"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend,
} from "recharts";

// ─── 데이터 (poc_methodology.md 정량 결과 기반) ─────────────────────────────
const COUNTRY_GAP = [
  { country: "France",    sku: 37.8, sales: 23.0, gap: 14.8, status: "risk" },
  { country: "USA",       sku: 25.0, sales: 36.0, gap: -11.0, status: "under" },
  { country: "Italy",     sku: 15.4, sales: 7.0,  gap: 8.4,  status: "risk" },
  { country: "Chile",     sku: 5.5,  sales: 13.0, gap: -7.5, status: "under" },
  { country: "Spain",     sku: 4.3,  sales: 0,    gap: 4.3,  status: "risk" },
  { country: "Australia", sku: 3.4,  sales: 0,    gap: 3.4,  status: "risk" },
  { country: "Germany",   sku: 2.3,  sales: 0,    gap: 2.3,  status: "risk" },
  { country: "Portugal",  sku: 2.0,  sales: 0,    gap: 2.0,  status: "risk" },
];

const CATEGORY_DIST = [
  { cat: "레드",      naracellar: 50.4, market: 51.5, match: true },
  { cat: "화이트",    naracellar: 31.6, market: 33.7, match: true },
  { cat: "스파클링",  naracellar: 12.2, market: 9.0,  match: "ahead" },
  { cat: "로제",      naracellar: 1.8,  market: 3.0,  match: true },
  { cat: "디저트·강화", naracellar: 2.6, market: 1.8,  match: true },
];

const RISK_PATTERNS = [
  { rank: 1, label: "프랑스 레드 mid-premium", detail: "양극화 시장에서 가장 약한 위치" },
  { rank: 2, label: "어워드 없는 SKU 다수", detail: "시장 검증 신호 부재 (40%만 어워드 보유)" },
  { rank: 3, label: "디저트·주정강화 일부", detail: "회전 느린 틈새 카테고리" },
];

const OPP_PATTERNS = [
  { rank: 1, label: "화이트·스파클링", detail: "한국 시장 성장 카테고리" },
  { rank: 2, label: "Riesling · Sauv.Blanc · Chard · Pinot Noir", detail: "트렌드 품종" },
  { rank: 3, label: "칠레·뉴질랜드 entry-level", detail: "편의점 채널 적합" },
  { rank: 4, label: "90점 이상 평점 SKU", detail: "결정적 시장 검증 보유" },
];

const INTERNAL_DATA_GAINS = [
  "재고 회전율 (가격·체류일 결합 시)",
  "570 거래처 × 1,955 SKU 매칭 행렬",
  "채널별 (도매/리테일/온라인) 회전율 분리",
  "가격대 × 회전율 매트릭스",
  "거래처 신용스코링",
  "재고 100억 감소 시뮬레이션 (Phase 2 핵심)",
];

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function SkuAnalysis() {
  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="surface p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-brand-primary font-semibold">PoC Analysis</span>
          <span className="text-xs text-ink-500">2026-05-27 · 외부 공개 데이터 기반</span>
        </div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2 tracking-tight">
          740 SKU 분석 — Long Tail 미소진 위험의 정량 증거
        </h1>
        <p className="text-sm text-ink-700 leading-relaxed">
          나라셀라 공식 wine list(<span className="font-mono text-xs">wine_list.php</span>) 전수 스크래핑 740 SKU,
          한국 와인 시장 카테고리·국가별 매출 데이터(Wine21·Investing.com)와 매핑.
          <span className="text-brand-primary font-medium"> 정확도가 아니라 "외부 데이터로 이만큼 보인다"가 메시지</span>입니다.
        </p>

        {/* 메타 카드 4개 */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          <MetaCard label="수집 SKU" value="740" sub="고유 product 기준" />
          <MetaCard label="active 커버리지" value="46%" sub="회사 1,613 SKU 대비" />
          <MetaCard label="필드 채움률" value="100%" sub="name/country/region/varietal" />
          <MetaCard label="어워드 보유" value="40%" sub="시장 검증 신호 보유" tone="warning" />
        </div>
      </div>

      {/* 국가별 SKU vs 매출 gap — 핵심 차트 */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-4 bg-brand-primary rounded-sm flex-shrink-0" />
          <h2 className="text-[13px] font-semibold text-ink-900 tracking-tight uppercase">
            국가별 SKU vs 매출 — Gap이 클수록 Long Tail 미소진 위험
          </h2>
        </div>

        <div className="surface p-5">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={COUNTRY_GAP} margin={{ top: 24, right: 30, left: 12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e5de" vertical={false} />
              <XAxis dataKey="country" tick={{ fill: "#6f6760", fontSize: 11 }} axisLine={{ stroke: "#d4cfc4" }} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fill: "#6f6760", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d4cfc4",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(26,20,16,0.08)",
                }}
                formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name === "sku" ? "SKU 비중" : "매출 비중"]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => v === "sku" ? "SKU 비중" : "매출 비중"} />
              <Bar dataKey="sku" fill="#9a253c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sales" fill="#b89a65" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* gap 강조 라벨 */}
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-xs text-ink-500 font-medium mb-2">국가별 Gap (SKU 비중 − 매출 비중)</p>
            <div className="grid grid-cols-4 gap-2">
              {COUNTRY_GAP.filter((c) => Math.abs(c.gap) >= 2).map((c) => (
                <div
                  key={c.country}
                  className={`rounded-lg p-2.5 border text-center ${
                    c.gap > 0
                      ? "bg-danger/8 border-danger/20"
                      : "bg-positive/8 border-positive/20"
                  }`}
                >
                  <p className="text-[10px] text-ink-500 mb-0.5">{c.country}</p>
                  <p className={`text-base font-bold tabular-nums ${c.gap > 0 ? "text-danger" : "text-positive"}`}>
                    {c.gap > 0 ? "+" : ""}{c.gap.toFixed(1)}%p
                  </p>
                  <p className="text-[10px] text-ink-500 mt-0.5">
                    {c.gap > 0 ? "Long Tail 위험" : "under-curated"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-700 mt-4 leading-relaxed">
            <span className="text-danger font-semibold">프랑스 +14.8%p</span>가 가장 큰 미소진 위험.
            반대로 <span className="text-positive font-semibold">미국 -11%p, 칠레 -7.5%p</span>는
            SKU 대비 매출이 크지만 큐레이션 여지가 있어 추가 큐레이션 시 더 끌어올릴 수 있는 영역.
          </p>
        </div>
      </section>

      {/* Risk/Opportunity 패턴 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <h3 className="text-sm font-semibold text-ink-900">Risk Top 50 — 상위 패턴</h3>
            </div>
            <span className="text-[11px] text-danger bg-danger/10 px-2 py-0.5 rounded font-medium">평균 risk 49.5</span>
          </div>
          <div className="space-y-2">
            {RISK_PATTERNS.map((p) => (
              <div key={p.rank} className="flex items-start gap-3 p-2.5 bg-canvas border border-line rounded-lg">
                <span className="text-xs text-danger font-mono font-bold w-4 flex-shrink-0">#{p.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-900">{p.label}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5">{p.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-500 mt-3 leading-relaxed">
            가중치: 국가 oversupply + 레드(시장 축소) + 어워드 부재 + 점수 낮음 +
            디저트·강화 + (FR/IT) × Red mid-premium 양극화
          </p>
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🌱</span>
              <h3 className="text-sm font-semibold text-ink-900">Opportunity Top 50 — 상위 패턴</h3>
            </div>
            <span className="text-[11px] text-positive bg-positive/10 px-2 py-0.5 rounded font-medium">평균 opp 78</span>
          </div>
          <div className="space-y-2">
            {OPP_PATTERNS.map((p) => (
              <div key={p.rank} className="flex items-start gap-3 p-2.5 bg-canvas border border-line rounded-lg">
                <span className="text-xs text-positive font-mono font-bold w-4 flex-shrink-0">#{p.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-900">{p.label}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5">{p.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-500 mt-3 leading-relaxed">
            가중치: 화이트·스파클링 + 로제 대안 + 어워드 보유 + 90점↑ + 트렌드 품종 +
            칠레·뉴질랜드 entry-level (편의점 적합)
          </p>
        </div>
      </section>

      {/* 카테고리 분포 */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-4 bg-brand-primary rounded-sm flex-shrink-0" />
          <h2 className="text-[13px] font-semibold text-ink-900 tracking-tight uppercase">
            카테고리 분포 — 시장과 거의 일치 (진짜 문제는 국가별 mismatch)
          </h2>
        </div>
        <div className="surface p-5">
          <div className="grid grid-cols-5 gap-3">
            {CATEGORY_DIST.map((c) => {
              const diff = c.naracellar - c.market;
              const isAhead = c.match === "ahead";
              return (
                <div key={c.cat} className="text-center bg-canvas border border-line rounded-lg p-3">
                  <p className="text-xs font-medium text-ink-900 mb-2">{c.cat}</p>
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-[10px] text-ink-500">나라셀라</p>
                      <p className="text-base font-bold text-brand-primary tabular-nums">{c.naracellar}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-500">한국 시장</p>
                      <p className="text-sm text-ink-700 tabular-nums">{c.market}%</p>
                    </div>
                    <div className="pt-1 border-t border-line">
                      <span className={`text-[10px] font-medium ${
                        isAhead ? "text-brand-accent" : Math.abs(diff) < 1.5 ? "text-positive" : "text-ink-500"
                      }`}>
                        {isAhead ? "↑ 앞섬" : Math.abs(diff) < 1.5 ? "✓ 일치" : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%p`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-700 mt-4 leading-relaxed">
            카테고리 mismatch는 <span className="font-semibold">유의미한 차이 없음</span>.
            진짜 문제는 <span className="text-brand-primary font-semibold">국가별 mismatch</span>이며,
            그중 프랑스가 가장 크다. 이는 일반적 "포트폴리오 다양성 부족"이 아니라 특정 국가의 과잉 큐레이션 문제.
          </p>
        </div>
      </section>

      {/* 한계 + 내부 데이터 결합 시 시나리오 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⚖️</span>
            <h3 className="text-sm font-semibold text-ink-900">분석 한계 — 정직하게</h3>
          </div>
          <div className="space-y-2 text-xs text-ink-700 leading-relaxed">
            <p>
              <span className="text-warning font-semibold">vintage · price · grade · abv 0%</span>: B2B 사이트 특성상 미공개.
              가격대별 회전 분석 불가.
            </p>
            <p>
              <span className="text-warning font-semibold">어워드 채움률 40%</span>: 어워드 없다고 실패 SKU는 아님.
              신규·소규모 와이너리 포함된 한계.
            </p>
            <p>
              <span className="text-warning font-semibold">매출 데이터 1개 분기</span>:
              2026 1Q 매출 비중은 연간 평균과 다를 수 있음. 기타 21% 비중 국가는 추정만 가능.
            </p>
          </div>
        </div>

        <div className="surface p-5 bg-brand-primaryLight/30 border-brand-primaryBorder">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🚀</span>
            <h3 className="text-sm font-semibold text-ink-900">내부 데이터 결합 시 — 1주 안에 가능</h3>
          </div>
          <ul className="space-y-1.5">
            {INTERNAL_DATA_GAINS.map((g, i) => (
              <li key={i} className="flex gap-2 text-xs text-ink-700 leading-relaxed">
                <span className="text-brand-primary flex-shrink-0 font-bold">→</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-brand-primary mt-3 font-medium leading-relaxed border-t border-brand-primaryBorder pt-3">
            본 PoC는 이 결합 시점부터 진짜 가치가 나오기 시작합니다. 외부 데이터 분석은 입구입니다.
          </p>
        </div>
      </section>
    </div>
  );
}

function MetaCard({
  label, value, sub, tone = "default",
}: { label: string; value: string; sub: string; tone?: "default" | "warning" }) {
  const valueColor = tone === "warning" ? "text-warning" : "text-brand-primary";
  return (
    <div className="bg-canvas border border-line rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-ink-500 mt-0.5">{sub}</p>
    </div>
  );
}
