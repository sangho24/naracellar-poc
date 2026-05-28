"""매니저 review용 3장 deck 생성. 디자인 최소, 컨텐츠 우선."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# 16:9 wide
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

NAVY = RGBColor(0x1F, 0x2C, 0x4C)
GREY = RGBColor(0x55, 0x5B, 0x6E)
RED = RGBColor(0xC0, 0x39, 0x2B)
GREEN = RGBColor(0x1E, 0x8E, 0x3E)
LIGHT = RGBColor(0xF4, 0xF5, 0xF7)


def add_text(slide, left, top, width, height, text, size=12, bold=False, color=None, align=PP_ALIGN.LEFT):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.name = "맑은 고딕"
    if color:
        run.font.color.rgb = color
    return tb


def add_bullets(slide, left, top, width, height, lines, size=11, color=None):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        run = p.add_run()
        run.text = "• " + ln
        run.font.size = Pt(size)
        run.font.name = "맑은 고딕"
        if color:
            run.font.color.rgb = color
    return tb


def add_footer(slide, page_num):
    add_text(slide, Inches(0.4), Inches(7.05), Inches(6), Inches(0.35),
             "삼일회계법인 AX Node", size=9, color=GREY)
    add_text(slide, Inches(12.5), Inches(7.05), Inches(0.8), Inches(0.35),
             f"{page_num} / 3", size=9, color=GREY, align=PP_ALIGN.RIGHT)


def add_header(slide, eyebrow, title, subtitle):
    add_text(slide, Inches(0.5), Inches(0.35), Inches(3), Inches(0.3),
             eyebrow, size=11, bold=True, color=RED)
    add_text(slide, Inches(0.5), Inches(0.65), Inches(12), Inches(0.7),
             title, size=24, bold=True, color=NAVY)
    add_text(slide, Inches(0.5), Inches(1.35), Inches(12), Inches(0.5),
             subtitle, size=12, color=GREY)
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(1.95),
                                   Inches(12.3), Emu(20000))
    line.fill.solid()
    line.fill.fore_color.rgb = NAVY
    line.line.fill.background()


def add_box(slide, left, top, w, h, fill=LIGHT, line=None):
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, w, h)
    box.fill.solid()
    box.fill.fore_color.rgb = fill
    if line:
        box.line.color.rgb = line
        box.line.width = Pt(0.75)
    else:
        box.line.fill.background()
    box.shadow.inherit = False
    return box


blank = prs.slide_layouts[6]

# ============================================================
# Slide 1 — As-Is: Cash Flow
# ============================================================
s1 = prs.slides.add_slide(blank)
add_header(s1, "AS-IS",
           "현금흐름 위기 — 매출보다 시급한 문제",
           "부채 316억 vs 현금 44억. 재고에 자본이 묶여 있고 환·대손 리스크가 누적되고 있습니다.")

# 좌측 column - 메인
add_box(s1, Inches(0.5), Inches(2.15), Inches(4.3), Inches(4.6), fill=RGBColor(0xFD, 0xEC, 0xEA), line=RED)
add_text(s1, Inches(0.7), Inches(2.3), Inches(4), Inches(0.4),
         "1. 현금흐름 압박", size=14, bold=True, color=RED)
add_bullets(s1, Inches(0.7), Inches(2.75), Inches(4), Inches(4),
            ["부채 316억 vs 현금 44억 — 7배 차이",
             "이자 부담 연 16억 (재고 차입 의존)",
             "재고보유일수 348일 (2022년 215일 → +133일)",
             "미착상품 102억 (전체 재고의 25%)",
             "재고평가충당금 2.86억 (시장가 < 원가)",
             "2025.3Q 영업손실 2.3억"], size=11, color=NAVY)

# 중앙 column - 부수 리스크
add_box(s1, Inches(5.0), Inches(2.15), Inches(4.0), Inches(4.6))
add_text(s1, Inches(5.2), Inches(2.3), Inches(3.8), Inches(0.4),
         "2. 누적되고 있는 부수 리스크", size=14, bold=True, color=NAVY)
add_bullets(s1, Inches(5.2), Inches(2.75), Inches(3.7), Inches(4),
            ["환리스크: 외화부채 73억, 5% 변동 시 3.6억 영향",
             "수동 헤지 — 실시간 추적 불가",
             "매출채권 연체 25.4억 (연체율 18.6%)",
             "대손충당금 매년 +2억 증가 추세",
             "얼로케이션 압박: 한국 안 팔리면 와이너리가 물량 회수",
             "포트폴리오 약화 악순환"], size=11, color=NAVY)

# 우측 column - 공통 원인
add_box(s1, Inches(9.2), Inches(2.15), Inches(3.6), Inches(4.6))
add_text(s1, Inches(9.4), Inches(2.3), Inches(3.3), Inches(0.4),
         "3. 공통 원인 — 데이터 부재", size=14, bold=True, color=NAVY)
add_bullets(s1, Inches(9.4), Inches(2.75), Inches(3.3), Inches(4),
            ["채널 사일로: 영업1/영업2/리테일 분리",
             "계열사 8개 미연결",
             "매장 10여개 POS 연동 불명확",
             "프로모션 ROI 측정 도구 부재",
             "\"감\" 기반 의사결정",
             "상위 4 브랜드군 = 매출 93%",
             "161 브랜드·1,955 SKU 중 대부분 재고 잠김"], size=10, color=NAVY)

# 하단 강조
add_box(s1, Inches(0.5), Inches(6.5), Inches(12.3), Inches(0.45), fill=NAVY)
add_text(s1, Inches(0.7), Inches(6.55), Inches(12), Inches(0.35),
         "진짜 위협은 줄어드는 매출이 아니라, 그 매출로 늘어나는 재고를 떠받치고 있다는 것. 데이터·자동화·AI로 세 가지 모두 해결 가능.",
         size=11, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))

add_footer(s1, 1)

# Speaker note
s1.notes_slide.notes_text_frame.text = (
    "1장은 cash flow 한 장입니다. 매니저님, 나라셀라 IR에서 가장 자주 등장하는 단어가 '재무구조 개선'이에요. "
    "시장은 축소되고 있는데 재고는 늘고 있고, 그 재고를 떠받치느라 차입이자가 연 16억 나가는 구조입니다. "
    "그런데 그 모든 원인이 결국 '데이터로 못 푸는 채널 사일로'라는 한 가지로 수렴한다는 게 우리 진단입니다. "
    "수치 신뢰성에 대해 매니저님 본부에서 더 받을 수 있는 게 있는지 의견 듣고 싶습니다."
)

# ============================================================
# Slide 2 — Roadmap
# ============================================================
s2 = prs.slides.add_slide(blank)
add_header(s2, "ROADMAP",
           "기초공사 → 골조 → 인테리어 — 순서를 지켜야 무너지지 않습니다",
           "18개월, 3 Phase. 각 Phase에서 cash flow 효과가 누적됩니다.")


def phase_card(slide, left, title_top, color_accent, phase_num, period, title, tasks, cash_effect):
    add_box(slide, left, Inches(2.15), Inches(4.0), Inches(4.6), line=color_accent)
    # 헤더 색 bar
    add_box(slide, left, Inches(2.15), Inches(4.0), Inches(0.55), fill=color_accent)
    add_text(slide, left + Inches(0.15), Inches(2.22), Inches(2), Inches(0.35),
             f"Phase {phase_num}", size=14, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))
    add_text(slide, left + Inches(2.5), Inches(2.25), Inches(1.5), Inches(0.3),
             period, size=10, color=RGBColor(0xFF, 0xFF, 0xFF), align=PP_ALIGN.RIGHT)
    add_text(slide, left + Inches(0.15), Inches(2.8), Inches(3.7), Inches(0.4),
             title, size=12, bold=True, color=NAVY)
    add_bullets(slide, left + Inches(0.15), Inches(3.3), Inches(3.7), Inches(2.6),
                tasks, size=9, color=NAVY)
    # Cash flow 효과 박스
    add_box(slide, left + Inches(0.15), Inches(5.9), Inches(3.7), Inches(0.8),
            fill=RGBColor(0xE6, 0xF4, 0xEA), line=GREEN)
    add_text(slide, left + Inches(0.25), Inches(5.95), Inches(3.5), Inches(0.25),
             "Cash flow 효과", size=9, bold=True, color=GREEN)
    add_text(slide, left + Inches(0.25), Inches(6.2), Inches(3.5), Inches(0.45),
             cash_effect, size=9, color=NAVY)


phase_card(s2, Inches(0.5), Inches(2.15), RGBColor(0x4A, 0x6B, 0x9E), 1, "0~6개월",
           "클라우드 + 데이터 기반 구축",
           ["클라우드 ERP 전환 (SAP ByDesign / 더존 클라우드)",
            "본사 + 물류 + 미국법인 + 직영매장 연결",
            "SKU×채널×거래처 데이터 정제·축적",
            "거래처 네트워크 맵핑 (도매-업장-상권)",
            "프로모션 ROI 측정 (Google CausalImpact)",
            "통합 데이터 레이크 + 실시간 연동"],
           "IT 관리비 ~30%↓ (CapEx→OpEx). 직접 절감은 작지만 Phase 2/3의 전제.")

phase_card(s2, Inches(4.65), Inches(2.15), RGBColor(0x3D, 0x5A, 0x80), 2, "6~12개월",
           "자동화 + 시뮬레이션",
           ["수요예측 모델 (SKU×채널, 시즌·환율·트렌드)",
            "재고보유일수 348일 → 250일 목표",
            "환리스크 자동 추적 + 임계치 알림",
            "거래처 신용스코링 + 연체 자동 플래그",
            "채널 배분 What-If 시뮬레이션",
            "→ 이 시점에서 영업손실 흑자 전환 가능"],
           "재고 100억↓ → 이자 연 4~5억↓ / 환리스크 1~2억 / 대손 2~3억 절감.")

phase_card(s2, Inches(8.8), Inches(2.15), RGBColor(0x1F, 0x2C, 0x4C), 3, "12~18개월",
           "AI 개인화 추천 Agent",
           ["거래처별 맞춤 와인 추천 AI",
            "1,955 SKU 전체가 추천 대상화",
            "영업사원 미팅 브리핑 자동 생성",
            "거래처 매출 개선 컨설팅 데이터 제공",
            "포지셔닝: 공급자 → 거래처 성장 파트너",
            "신규 브랜드 론칭 최적화"],
           "Long Tail 매출 +5~10% (와인앱 벤치마크 +41% 대비 보수적 추정).")

add_footer(s2, 2)

s2.notes_slide.notes_text_frame.text = (
    "2장은 매니저님이 가장 의견 주실 부분입니다. Phase 1만 6개월인 게 길어 보일 수 있는데, "
    "ERP 전환이 핵심이라 줄이기 어렵습니다. 다만 'effect가 언제 나오나'에 대한 답은 "
    "Phase 2 끝 무렵 흑자 전환이라는 게 우리 추정이고, 매니저님이 보시기에 이 timing이 "
    "client 입장에서 sellable한지, Phase 1을 5개월로 줄이는 옵션이 있는지 듣고 싶습니다."
)

# ============================================================
# Slide 3 — Expected Impact
# ============================================================
s3 = prs.slides.add_slide(blank)
add_header(s3, "EXPECTED IMPACT",
           "비용절감만으로 흑자 전환 — 성장은 그 위에 얹는 것",
           "2025.3Q 영업손실 2.3억. Phase 2 종료 시점에 비용절감 합계가 손실을 넘어섭니다.")

# 테이블
table_left = Inches(0.5)
table_top = Inches(2.2)
table_w = Inches(8.8)
table_h = Inches(3.6)

rows_data = [
    ["항목", "현재", "전환 후", "연 효과", "누적 시점"],
    ["이자 부담 절감 (재고↓)", "재고 348일, 이자 16억", "재고 250일", "연 4~5억↓", "Phase 2 후반"],
    ["환리스크 절감", "수동 헤지, 73억 노출", "실시간 추적 + 알림", "연 1~2억", "Phase 2 중반"],
    ["대손 절감", "매년 2억↑ 증가", "신용스코링 + 자동 플래그", "연 2~3억", "Phase 2 후반"],
    ["IT 관리비 절감", "온프레미스 사일로", "클라우드 통합", "~30%↓", "Phase 1 종료"],
    ["Long Tail 매출 (보너스)", "상위 4 브랜드 = 93%", "AI 매칭 미들/롱테일 활성", "매출 +5~10%", "Phase 3"],
]

tbl = s3.shapes.add_table(len(rows_data), 5, table_left, table_top, table_w, table_h).table
tbl.columns[0].width = Inches(2.0)
tbl.columns[1].width = Inches(1.8)
tbl.columns[2].width = Inches(1.8)
tbl.columns[3].width = Inches(1.5)
tbl.columns[4].width = Inches(1.7)

for r, row in enumerate(rows_data):
    for c, val in enumerate(row):
        cell = tbl.cell(r, c)
        cell.text = val
        for para in cell.text_frame.paragraphs:
            for run in para.runs:
                run.font.size = Pt(10)
                run.font.name = "맑은 고딕"
                if r == 0:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                else:
                    run.font.color.rgb = NAVY
        if r == 0:
            cell.fill.solid()
            cell.fill.fore_color.rgb = NAVY
        elif r == 5:  # 보너스 행
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(0xFF, 0xF8, 0xE1)

# 우측 벤치마크 박스
add_box(s3, Inches(9.5), Inches(2.2), Inches(3.3), Inches(3.6), fill=LIGHT)
add_text(s3, Inches(9.7), Inches(2.3), Inches(3), Inches(0.3),
         "벤치마크 (illustrative)", size=11, bold=True, color=NAVY)
add_bullets(s3, Inches(9.7), Inches(2.75), Inches(3), Inches(3),
            ["이마트 사이캐스트: 예측오차 18%↓",
             "유통업 AI 재고비용: 20%↓",
             "와인앱 개인화 장바구니: +41%",
             "애터미 클라우드: IT비용 30%↓"], size=10, color=GREY)

# 하단 메시지 박스
add_box(s3, Inches(0.5), Inches(6.0), Inches(12.3), Inches(0.95), fill=NAVY)
add_text(s3, Inches(0.7), Inches(6.05), Inches(12), Inches(0.3),
         "단기: 비용절감 합계 연 7~10억 → 영업손실 2.3억 충분히 상쇄, 흑자 전환",
         size=11, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))
add_text(s3, Inches(0.7), Inches(6.35), Inches(12), Inches(0.3),
         "중기: 재고 100억 감소로 자본 회수 → 재무구조 개선 (부채/자본 비율)",
         size=11, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))
add_text(s3, Inches(0.7), Inches(6.65), Inches(12), Inches(0.3),
         "장기 (진짜 가치): Long Tail 활성화 → 매출 2,500억 경로 재활성화, 얼로케이션 선순환",
         size=11, bold=True, color=RGBColor(0xFF, 0xC1, 0x07))

add_footer(s3, 3)

s3.notes_slide.notes_text_frame.text = (
    "3장은 우리가 매니저님께 가장 자신 있게 보여드릴 수 있는 장입니다. "
    "단순히 '매출 늘릴게요'가 아니라 '이미 새고 있는 돈을 막기만 해도 흑자 전환됩니다'라는 메시지입니다. "
    "Long Tail은 보너스로 두고, 매니저님 의견은 '이 절감 추정치들이 client 앞에서 방어 가능한 수준인지'를 듣고 싶습니다. "
    "너무 보수적인지, 적정한지, 더 conservative하게 낮춰야 하는지."
)

out_path = r"C:\Users\seum004\Desktop\인턴 교육\narasellar-poc\output\manager_review_deck.pptx"
prs.save(out_path)
print(f"Saved: {out_path}")
