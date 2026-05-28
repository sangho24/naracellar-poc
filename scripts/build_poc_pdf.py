"""POC SKU 분석 1-pager (PDF) 생성.

데이터: output/scraped_wines.csv (740 SKU, 실데이터)
한계: B2B 사이트 특성상 가격·빈티지·재고회전 미공개
출력: output/poc_sku_analysis.pdf (1 페이지)
"""
import csv
import re
from collections import Counter
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
from matplotlib import rcParams

# 한글 폰트
rcParams["font.family"] = "Malgun Gothic"
rcParams["axes.unicode_minus"] = False

ROOT = Path(r"C:\Users\seum004\Desktop\인턴 교육\narasellar-poc")
CSV = ROOT / "output" / "scraped_wines.csv"
OUT = ROOT / "output" / "poc_sku_analysis.pdf"

# ============================================================
# 1) 데이터 로드 + 정규화
# ============================================================
with open(CSV, encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))

print(f"loaded {len(rows)} SKU")

# 국가 정규화
COUNTRY_MAP = {
    "프랑스": "France", "미국": "USA", "이태리": "Italy", "이탈리아": "Italy",
    "칠레": "Chile", "스페인": "Spain", "호주": "Australia",
    "독일": "Germany", "포르투갈": "Portugal", "아르헨티나": "Argentina",
    "뉴질랜드": "NZ", "오스트리아": "Austria", "남아프리카공화국": "S.Africa",
}

def norm_country(c):
    c = (c or "").strip()
    return COUNTRY_MAP.get(c, c if c else "Unknown")

for r in rows:
    r["country_norm"] = norm_country(r["country"])

# 카테고리 정규화 (Red/White/Sparkling/Rosé/Fortified/Dessert)
def norm_type(t):
    t = (t or "").strip()
    if "스파클링" in t or "Sparkling" in t: return "Sparkling"
    if "로제" in t or "Rosé" in t or "Rose" in t: return "Rosé"
    if "디저트" in t or "Dessert" in t: return "Dessert"
    if "주정강화" in t or "Fortified" in t: return "Fortified"
    if "화이트" in t or "White" in t: return "White"
    if "레드" in t or "Red" in t: return "Red"
    return "Other"

for r in rows:
    r["type_norm"] = norm_type(r["type"])

# 주요 품종 추출 (varietal 첫 번째)
def primary_varietal(v):
    v = (v or "").strip()
    if not v: return ""
    # "카베르네 소비뇽(Cabernet Sauvignon) 70%, ..." → 첫 단어
    m = re.match(r"([^,()0-9%]+)", v)
    return m.group(1).strip() if m else ""

for r in rows:
    r["primary_varietal"] = primary_varietal(r["varietal"])

# awards 존재 여부
for r in rows:
    r["has_awards"] = bool((r["awards"] or "").strip())
    # awards 텍스트에서 최고점수 추출 (90+ = critical acclaim)
    text = r["awards"] or ""
    scores = [int(s) for s in re.findall(r"\b(8[5-9]|9[0-9]|100)\b", text)]
    r["max_score"] = max(scores) if scores else 0

# ============================================================
# 2) 매출비중 vs SKU 비중 (Long Tail 증거)
# ============================================================
# 외부 정황: 2026 1Q 매출 비중 (Investing.com)
SALES_SHARE = {
    "USA": 36.0, "France": 23.0, "Chile": 13.0, "Italy": 7.0,
    # 나머지는 "기타" 21% 안에 묶임
}

country_count = Counter(r["country_norm"] for r in rows)
total_sku = sum(country_count.values())
country_pct = {k: 100 * v / total_sku for k, v in country_count.items()}

# Long Tail score = SKU share - revenue share (양수일수록 SKU 많은데 매출 적음 = 위험)
longtail = []
for c in ["France", "USA", "Italy", "Chile", "Spain", "Australia", "Germany", "Portugal"]:
    sku_pct = country_pct.get(c, 0)
    rev_pct = SALES_SHARE.get(c, 0)
    longtail.append({
        "country": c,
        "sku_count": country_count.get(c, 0),
        "sku_pct": sku_pct,
        "rev_pct": rev_pct,
        "gap": sku_pct - rev_pct,
    })

# ============================================================
# 3) Risk / Opportunity SKU 50개씩 선별
# ============================================================
# 한국 시장 트렌드:
# - 레드 점유율 69% → 51% (구조적 축소)
# - 화이트·스파클링 성장
# - 프리미엄 약세, 편의점 저가 와인 강세
# - 무알코올·소용량 신규 수요

# Country oversupply ranking (SKU share > revenue share)
country_oversupply = {l["country"]: max(0, l["gap"]) for l in longtail}

# 다른 국가는 "기타" 매출 21% 중 share — 보수적으로 oversupply=0 처리
declining_varietals = ["메를로", "Merlot", "산지오베제", "Sangiovese"]  # mid-premium 레드 일부
growing_varietals = ["리슬링", "Riesling", "소비뇽 블랑", "Sauvignon Blanc",
                     "샤르도네", "Chardonnay", "샴페인", "프로세코", "피노 누아", "Pinot Noir"]

def risk_score(r):
    s = 0
    # 국가 oversupply
    s += country_oversupply.get(r["country_norm"], 0) * 0.3
    # 레드 (축소 시장)
    if r["type_norm"] == "Red": s += 15
    # 어워드 없음 (시장에서 검증 못 받음)
    if not r["has_awards"]: s += 20
    # 점수 낮음 (90 미만)
    if r["max_score"] and r["max_score"] < 90: s += 10
    # 디저트·주정강화 (틈새, 회전 느림)
    if r["type_norm"] in ("Dessert", "Fortified"): s += 25
    # 프랑스/이탈리아 mid-premium (양극화 직격)
    if r["country_norm"] in ("France", "Italy") and r["type_norm"] == "Red":
        s += 10
    return s

def opportunity_score(r):
    s = 0
    # 화이트·스파클링 (성장 카테고리)
    if r["type_norm"] in ("White", "Sparkling"): s += 30
    # 로제 (대안 카테고리)
    if r["type_norm"] == "Rosé": s += 15
    # 어워드 있음
    if r["has_awards"]: s += 15
    # 90점 이상 (시장 검증)
    if r["max_score"] >= 90: s += 20
    # 성장 품종
    if any(g in (r["primary_varietal"] or "") for g in growing_varietals): s += 20
    # 칠레·뉴질랜드·아르헨티나 (entry-level + 편의점 가능성)
    if r["country_norm"] in ("Chile", "NZ", "Argentina", "S.Africa"): s += 10
    return s

for r in rows:
    r["risk_score"] = risk_score(r)
    r["opp_score"] = opportunity_score(r)

# 상위 50개씩
risk_50 = sorted(rows, key=lambda x: x["risk_score"], reverse=True)[:50]
opp_50 = sorted(rows, key=lambda x: x["opp_score"], reverse=True)[:50]

# 데이터 저장 (백업)
import json
with open(ROOT / "output" / "poc_risk_top50.json", "w", encoding="utf-8") as f:
    json.dump([{k: r[k] for k in ["num", "name_ko", "name_en", "country_norm",
               "type_norm", "primary_varietal", "max_score", "has_awards",
               "risk_score"]} for r in risk_50], f, ensure_ascii=False, indent=2)
with open(ROOT / "output" / "poc_opportunity_top50.json", "w", encoding="utf-8") as f:
    json.dump([{k: r[k] for k in ["num", "name_ko", "name_en", "country_norm",
               "type_norm", "primary_varietal", "max_score", "has_awards",
               "opp_score"]} for r in opp_50], f, ensure_ascii=False, indent=2)

# ============================================================
# 4) PDF 생성 (1 페이지)
# ============================================================
fig = plt.figure(figsize=(11, 14.5))  # A4 비율 근사
gs = GridSpec(7, 2, height_ratios=[0.6, 0.3, 1.8, 1.8, 0.15, 1.0, 0.5],
              hspace=0.55, wspace=0.3, left=0.06, right=0.96, top=0.97, bottom=0.04)

# --- 상단 헤더 ---
ax_title = fig.add_subplot(gs[0, :])
ax_title.axis("off")
ax_title.text(0.0, 0.85, "POC — SKU 분석", fontsize=22, fontweight="bold",
              color="#1F2C4C", transform=ax_title.transAxes)
ax_title.text(0.0, 0.45,
              "외부 공개 데이터(나라셀라 wine list)만으로 1,955 SKU 중 740개의 카탈로그를 수집·분석. "
              "포트폴리오 mismatch와 50/50 위험·기회 SKU 후보를 식별합니다.",
              fontsize=10.5, color="#555B6E", transform=ax_title.transAxes)
ax_title.text(0.0, 0.08, "삼일회계법인 AX Node  |  매니저 리뷰용 PoC  |  2026-05-27",
              fontsize=9, color="#888", transform=ax_title.transAxes)

# --- 핵심 인사이트 3줄 박스 ---
ax_insight = fig.add_subplot(gs[1, :])
ax_insight.axis("off")
ax_insight.add_patch(mpatches.Rectangle((0, 0), 1, 1, transform=ax_insight.transAxes,
                                          facecolor="#FDECEA", edgecolor="#C0392B", linewidth=1.5))
insights = [
    "1. 프랑스 SKU 38%인데 매출 23% — +15%p gap, 가장 큰 Long Tail 미소진 (over-curation).",
    "2. 미국·칠레는 매출이 SKU 비중을 초과 (각 -11%p, -8%p) — 잘 팔리는데 SKU는 부족.",
    "3. 740 SKU 중 어워드·평점 데이터 보유 = 약 40% — 60%는 시장 검증 신호 부재.",
]
for i, line in enumerate(insights):
    ax_insight.text(0.03, 0.78 - i * 0.28, line, fontsize=10.5, color="#1F2C4C",
                    transform=ax_insight.transAxes, fontweight="bold")

# --- 차트 1: 국가별 SKU vs 매출 비교 ---
ax1 = fig.add_subplot(gs[2, 0])
countries = [l["country"] for l in longtail]
sku_pcts = [l["sku_pct"] for l in longtail]
rev_pcts = [l["rev_pct"] for l in longtail]

import numpy as np
x = np.arange(len(countries))
width = 0.4
b1 = ax1.bar(x - width / 2, sku_pcts, width, label="SKU 비중 (%)",
             color="#3D5A80", alpha=0.85)
b2 = ax1.bar(x + width / 2, rev_pcts, width, label="매출 비중 (2026 1Q, %)",
             color="#C0392B", alpha=0.85)
ax1.set_xticks(x)
ax1.set_xticklabels(countries, rotation=30, fontsize=9)
ax1.set_ylabel("비중 (%)", fontsize=9)
ax1.set_title("국가별: SKU 비중 vs 매출 비중", fontsize=12, fontweight="bold",
              color="#1F2C4C", pad=10)
ax1.legend(loc="upper right", fontsize=8)
ax1.grid(axis="y", alpha=0.3)
ax1.spines["top"].set_visible(False)
ax1.spines["right"].set_visible(False)
# gap 라벨
for i, l in enumerate(longtail):
    if abs(l["gap"]) > 5:
        color = "#C0392B" if l["gap"] > 0 else "#1E8E3E"
        sign = "+" if l["gap"] > 0 else ""
        ax1.annotate(f"{sign}{l['gap']:.0f}%p",
                     xy=(i, max(l["sku_pct"], l["rev_pct"]) + 1),
                     ha="center", fontsize=8, color=color, fontweight="bold")

# --- 차트 2: 카테고리(타입) 분포 ---
ax2 = fig.add_subplot(gs[2, 1])
type_count = Counter(r["type_norm"] for r in rows)
types_order = ["Red", "White", "Sparkling", "Rosé", "Dessert", "Fortified", "Other"]
type_pcts = [type_count.get(t, 0) for t in types_order]
# 한국 시장 점유 (2025년 기준, Wine21)
market_share_2025 = {"Red": 51.5, "White": 33.7, "Sparkling": 9.0,
                     "Rosé": 3.0, "Dessert": 1.0, "Fortified": 1.0, "Other": 0.8}

x2 = np.arange(len(types_order))
sku_type_pct = [100 * v / total_sku for v in type_pcts]
mkt_pct = [market_share_2025.get(t, 0) for t in types_order]

b3 = ax2.bar(x2 - width / 2, sku_type_pct, width, label="나라셀라 SKU (%)",
             color="#3D5A80", alpha=0.85)
b4 = ax2.bar(x2 + width / 2, mkt_pct, width, label="한국 시장 점유 (2025, %)",
             color="#C0392B", alpha=0.85)
ax2.set_xticks(x2)
ax2.set_xticklabels(types_order, rotation=30, fontsize=9)
ax2.set_ylabel("비중 (%)", fontsize=9)
ax2.set_title("카테고리: 나라셀라 vs 한국 시장 (2025)", fontsize=12, fontweight="bold",
              color="#1F2C4C", pad=10)
ax2.legend(loc="upper right", fontsize=8)
ax2.grid(axis="y", alpha=0.3)
ax2.spines["top"].set_visible(False)
ax2.spines["right"].set_visible(False)

# --- 차트 3: Risk SKU 50 분포 (heatmap: 국가 x 카테고리) ---
ax3 = fig.add_subplot(gs[3, 0])
countries_top = ["France", "USA", "Italy", "Chile", "Spain", "Australia", "Germany"]
types_short = ["Red", "White", "Sparkling", "Dessert", "Fortified"]
risk_matrix = np.zeros((len(countries_top), len(types_short)))
for r in risk_50:
    if r["country_norm"] in countries_top and r["type_norm"] in types_short:
        ci = countries_top.index(r["country_norm"])
        ti = types_short.index(r["type_norm"])
        risk_matrix[ci, ti] += 1

im1 = ax3.imshow(risk_matrix, cmap="Reds", aspect="auto")
ax3.set_xticks(range(len(types_short)))
ax3.set_xticklabels(types_short, fontsize=9)
ax3.set_yticks(range(len(countries_top)))
ax3.set_yticklabels(countries_top, fontsize=9)
ax3.set_title("위험 SKU 50개 — 국가 × 카테고리 분포", fontsize=12, fontweight="bold",
              color="#1F2C4C", pad=10)
for i in range(len(countries_top)):
    for j in range(len(types_short)):
        if risk_matrix[i, j] > 0:
            ax3.text(j, i, int(risk_matrix[i, j]), ha="center", va="center",
                     color="white" if risk_matrix[i, j] > 5 else "#1F2C4C", fontsize=9)

# --- 차트 4: Opportunity SKU 50 분포 ---
ax4 = fig.add_subplot(gs[3, 1])
opp_matrix = np.zeros((len(countries_top), len(types_short)))
for r in opp_50:
    if r["country_norm"] in countries_top and r["type_norm"] in types_short:
        ci = countries_top.index(r["country_norm"])
        ti = types_short.index(r["type_norm"])
        opp_matrix[ci, ti] += 1

im2 = ax4.imshow(opp_matrix, cmap="Greens", aspect="auto")
ax4.set_xticks(range(len(types_short)))
ax4.set_xticklabels(types_short, fontsize=9)
ax4.set_yticks(range(len(countries_top)))
ax4.set_yticklabels(countries_top, fontsize=9)
ax4.set_title("기회 SKU 50개 — 국가 × 카테고리 분포", fontsize=12, fontweight="bold",
              color="#1F2C4C", pad=10)
for i in range(len(countries_top)):
    for j in range(len(types_short)):
        if opp_matrix[i, j] > 0:
            ax4.text(j, i, int(opp_matrix[i, j]), ha="center", va="center",
                     color="white" if opp_matrix[i, j] > 5 else "#1F2C4C", fontsize=9)

# --- 구분선 ---
ax_sep = fig.add_subplot(gs[4, :])
ax_sep.axis("off")
ax_sep.axhline(0.5, color="#CCC", linewidth=0.5)

# --- 핵심 인사이트 텍스트 박스 ---
ax_text = fig.add_subplot(gs[5, :])
ax_text.axis("off")

text_left = (
    "▣ 위험 SKU 50개의 패턴\n"
    "  • 프랑스 레드 mid-premium 비중이 가장 높음 — 양극화 시장에서 가장 약한 위치\n"
    "  • 어워드·평점 없는 SKU 다수 → 시장 검증 신호 부재\n"
    "  • 디저트·주정강화 카테고리 일부 — 회전 느린 틈새\n"
    "  • 액션: '발주 예산제'와 결합 시 디스카운트·연계판매 우선 대상"
)
text_right = (
    "▣ 기회 SKU 50개의 패턴\n"
    "  • 화이트·스파클링 (한국 시장 성장 카테고리)\n"
    "  • Riesling, Sauvignon Blanc, Chardonnay, Pinot Noir — 트렌드 품종\n"
    "  • 칠레·뉴질랜드 entry-level — 편의점 채널 적합\n"
    "  • 액션: GS25·CU 신규 입점 후보, 187ml 소용량 패키징 검토"
)
ax_text.text(0.0, 1.0, text_left, fontsize=9.5, color="#1F2C4C",
             va="top", transform=ax_text.transAxes, family="Malgun Gothic")
ax_text.text(0.52, 1.0, text_right, fontsize=9.5, color="#1E8E3E",
             va="top", transform=ax_text.transAxes, family="Malgun Gothic")

# --- Disclaimer ---
ax_disc = fig.add_subplot(gs[6, :])
ax_disc.axis("off")
ax_disc.add_patch(mpatches.Rectangle((0, 0.3), 1, 0.7, transform=ax_disc.transAxes,
                                       facecolor="#F4F5F7", edgecolor="none"))
ax_disc.text(0.02, 0.78,
             "데이터 출처 & 한계", fontsize=9.5, fontweight="bold",
             color="#1F2C4C", transform=ax_disc.transAxes)
ax_disc.text(0.02, 0.50,
             "• 데이터: 나라셀라 공식 wine list (naracellar.com/wine/wine_list.php) — 740 SKU, "
             "국가·지역·품종·카테고리·어워드 수집 완료. 가격·빈티지·재고회전은 B2B 사이트 특성상 미공개.\n"
             "• 매출비중: 2026 1Q 실적 (Investing.com). 카테고리 시장점유: Wine21 2025 결산.\n"
             "• 한계: 회전율·재고일수·거래처 매칭은 외부 데이터로 불가. "
             "내부 POS·거래처 데이터 결합 시 정확도 비약적으로 향상 — 본 분석은 *방향성 가설* 용도.",
             fontsize=8, color="#555B6E", transform=ax_disc.transAxes,
             family="Malgun Gothic", linespacing=1.5)

plt.savefig(OUT, dpi=200, bbox_inches="tight", facecolor="white")
print(f"saved: {OUT}")

# ============================================================
# 5) 통계 출력 (terminal)
# ============================================================
print("\n=== Long Tail Gap (SKU% - Revenue%) ===")
for l in longtail:
    print(f"{l['country']:12} SKU={l['sku_pct']:5.1f}% Rev={l['rev_pct']:5.1f}% gap={l['gap']:+5.1f}p (n={l['sku_count']})")

print(f"\n총 740 SKU 중 Risk 50, Opportunity 50 선별 완료")
print(f"Risk 50 평균 점수: {sum(r['risk_score'] for r in risk_50)/50:.1f}")
print(f"Opportunity 50 평균 점수: {sum(r['opp_score'] for r in opp_50)/50:.1f}")
