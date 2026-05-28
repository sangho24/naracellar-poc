"use client";

// 디지털 전환 Roadmap — deck Slide 2 기반
// 18개월, 3 Phase, cash flow 효과 누적

interface PhaseData {
  num: number;
  range: string;
  title: string;
  metaphor: string;
  works: string[];
  cashFlow: { label: string; amount: string; tone: "positive" | "fixed" | "info" }[];
  highlight?: string;
}

const PHASES: PhaseData[] = [
  {
    num: 1,
    range: "0~6개월",
    title: "클라우드 + 데이터 기반 구축",
    metaphor: "기초공사",
    works: [
      "클라우드 ERP 전환 (SAP ByDesign / 더존 ClouD) — 본사 + 물류 + 미국법인 + 직영매장",
      "SKU × 채널 × 거래처 데이터 정제·축적 (체류기간 측정 가능 형태)",
      "거래처 네트워크 맵핑 (도매상 — 업장 — 상권 관계)",
      "프로모션 ROI 측정 인프라 (Google CausalImpact 기반)",
    ],
    cashFlow: [
      { label: "IT 관리비", amount: "~30%↓", tone: "fixed" },
      { label: "직접 절감 효과", amount: "최소", tone: "info" },
    ],
    highlight: "근거 있는 의사결정의 발판",
  },
  {
    num: 2,
    range: "6~12개월",
    title: "자동화 + 시뮬레이션",
    metaphor: "골조",
    works: [
      "수요예측 모델 (SKU × 채널, 시즌성·환율·트렌드 반영)",
      "환리스크 자동 추적 (발주 → 결제까지, 임계 헤지 알림)",
      "거래처 신용스코링 (주문 패턴·결제 이력·연체 빈도)",
      "채널 배분 What-If 시뮬레이션",
    ],
    cashFlow: [
      { label: "이자비용 (재고 100억↓)", amount: "연 4~5억↓", tone: "positive" },
      { label: "환리스크 절감", amount: "연 1~2억", tone: "positive" },
      { label: "대손 절감", amount: "연 2~3억", tone: "positive" },
    ],
    highlight: "이 시점에서 영업손실 흑자 전환 가능",
  },
  {
    num: 3,
    range: "12~18개월",
    title: "AI 개인화 추천 Agent",
    metaphor: "인테리어",
    works: [
      "거래처별 맞춤 와인 추천 AI (1,955 SKU 전체 추천 대상화)",
      "영업사원 미팅 브리핑 자동 생성",
      "거래처 매출 개선 컨설팅 데이터 제공 (공급자 → 성장 파트너)",
      "신규 브랜드 론칭 최적화",
    ],
    cashFlow: [
      { label: "Long Tail 매출", amount: "+5~10%", tone: "positive" },
      { label: "가격 협상력", amount: "유지", tone: "info" },
    ],
    highlight: "포트폴리오 전체가 살아 있는 회사",
  },
];

const BENCHMARKS = [
  { tag: "이마트 사이캐스트", value: "예측오차 18%↓" },
  { tag: "유통업 AI 재고비용", value: "20%↓" },
  { tag: "와인앱 개인화", value: "장바구니 +41%" },
  { tag: "애터미 클라우드", value: "IT비용 30%↓" },
];

const toneClass: Record<PhaseData["cashFlow"][number]["tone"], string> = {
  positive: "text-positive bg-positive/8 border-positive/25",
  fixed: "text-brand-accent bg-brand-accentLight border-brand-accent/30",
  info: "text-ink-500 bg-ink-100 border-line",
};

export default function Roadmap() {
  return (
    <div className="space-y-8">
      {/* 헤더 박스 */}
      <div className="surface p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-brand-primary font-semibold">Roadmap</span>
          <span className="text-xs text-ink-500">18개월 · 3 Phase</span>
        </div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2 tracking-tight">
          기초공사 → 골조 → 인테리어
        </h1>
        <p className="text-sm text-ink-700 leading-relaxed">
          순서를 지켜야 무너지지 않습니다. 각 Phase에서 cash flow 효과가 누적되며,
          <span className="text-brand-primary font-medium"> Phase 2 종료 시점에 흑자 전환</span>이 가능합니다.
        </p>
      </div>

      {/* Phase 카드 3개 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
        {/* 화살표 (lg 이상에서만) */}
        <div className="hidden lg:flex absolute top-1/2 left-0 right-0 -translate-y-1/2 justify-between px-[33%] pointer-events-none z-0" aria-hidden>
          <div className="w-8 h-px bg-brand-primary/30" />
          <div className="w-8 h-px bg-brand-primary/30" />
        </div>

        {PHASES.map((phase) => (
          <div
            key={phase.num}
            className="surface p-5 relative z-10 flex flex-col"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">
                  {phase.num}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-500 font-medium">{phase.metaphor}</p>
                  <p className="text-xs text-ink-700 font-medium">{phase.range}</p>
                </div>
              </div>
            </div>

            {/* 타이틀 */}
            <h3 className="text-sm font-semibold text-ink-900 mb-3 leading-snug">
              {phase.title}
            </h3>

            {/* 작업 리스트 */}
            <ul className="space-y-1.5 mb-4 flex-1">
              {phase.works.map((w, i) => (
                <li key={i} className="text-xs text-ink-700 leading-relaxed flex gap-1.5">
                  <span className="text-brand-accent flex-shrink-0">·</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>

            {/* Cash flow 효과 */}
            <div className="border-t border-line pt-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
                Cash flow 효과
              </p>
              {phase.cashFlow.map((cf, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-ink-700">{cf.label}</span>
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${toneClass[cf.tone]}`}>
                    {cf.amount}
                  </span>
                </div>
              ))}
            </div>

            {/* 하이라이트 */}
            {phase.highlight && (
              <div className="mt-3 pt-3 border-t border-line text-xs text-brand-primary font-medium">
                → {phase.highlight}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 누적 효과 강조 박스 */}
      <div className="surface p-6 bg-brand-primaryLight/40 border-brand-primaryBorder">
        <div className="flex items-start gap-4">
          <div className="text-2xl">📈</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900 mb-1">
              순서가 협상이 아닌 물리적 종속관계인 이유
            </p>
            <p className="text-sm text-ink-700 leading-relaxed">
              <span className="font-medium">Phase 1 없이 Phase 2가 불가능하고, Phase 2 없이 Phase 3은 모래성.</span>
              {" "}데이터를 쌓아야 자동화가 정확해지고, 자동화로 발생한 신호가 있어야 AI 추천에 의미가 생깁니다.
              현재 영업손실 2.3억 → 비용절감 합계 연 7~10억으로 충분히 상쇄 → 흑자 전환.
            </p>
          </div>
        </div>
      </div>

      {/* 벤치마크 */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-1 h-4 bg-brand-accent rounded-sm flex-shrink-0" />
          <h2 className="text-[13px] font-semibold text-ink-900 tracking-tight uppercase">참고 벤치마크</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {BENCHMARKS.map((b, i) => (
            <div key={i} className="surface p-4">
              <p className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">{b.tag}</p>
              <p className="text-lg font-bold text-brand-primary tabular-nums">{b.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
