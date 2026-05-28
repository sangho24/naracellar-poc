// ============================================================================
// 나라셀라 PoC — Mock API 데이터
// 기존 FastAPI 백엔드의 mock fallback 응답을 그대로 옮긴 정적 데이터.
// route handler들이 이 데이터를 참조해서 JSON / SSE 응답을 만든다.
// ============================================================================

// ─── KPI ────────────────────────────────────────────────────────────────────
export const MOCK_KPI = {
  inventory_days: 362,
  inventory_days_change: "+147일 vs 2022",
  overdue_rate: 19.4,
  overdue_amount: "25.4억",
  fx_exposure: 73,
  fx_impact: "5% 변동시 3.6억",
  longtail_rate: 13.2,
  longtail_change: "-3.0% vs 전월",
  sales_trend: [
    { month: "2024-09", revenue: 37800000 },
    { month: "2024-10", revenue: 41200000 },
    { month: "2024-11", revenue: 39500000 },
    { month: "2024-12", revenue: 43800000 },
    { month: "2025-01", revenue: 40500000 },
    { month: "2025-02", revenue: 40000000 },
    { month: "2025-03", revenue: 32000000 },
  ],
};

// ─── Alerts ────────────────────────────────────────────────────────────────
export const MOCK_ALERTS = [
  {
    id: "ALT-DRM001",
    region: "강남",
    channel: "도매",
    metric: "거래처 휴면 (3/10)",
    change_pct: -30.0,
    detected_at: "2025-03-15T09:23:00",
    status: "new" as const,
    detail: "강남 거래처 10곳 중 3곳 휴면 의심 (확정 폐업 3곳, 휴면 의심 0곳) — 평균 매출 직전 3개월 대비 -27.0%",
  },
  {
    id: "ALT-DRM002",
    region: "홍대",
    channel: "리테일",
    metric: "거래처 휴면 (2/8)",
    change_pct: -25.0,
    detected_at: "2025-03-15T09:23:00",
    status: "new" as const,
    detail: "홍대 거래처 8곳 중 2곳 휴면 의심 (확정 폐업 2곳, 휴면 의심 0곳) — 평균 매출 직전 3개월 대비 -32.8%",
  },
  {
    id: "ALT-001",
    region: "강남",
    channel: "도매",
    metric: "매출",
    change_pct: -20.0,
    detected_at: "2025-03-15T09:23:00",
    status: "new" as const,
    detail: null,
  },
  {
    id: "ALT-002",
    region: "홍대",
    channel: "리테일",
    metric: "매출",
    change_pct: -15.0,
    detected_at: "2025-03-15T09:23:00",
    status: "new" as const,
    detail: null,
  },
];

// ─── Alert ID → 시나리오 매핑 (analyze SSE용) ───────────────────────────────
export const ALERT_SCENARIO_MAP: Record<string, { region: string; channel: string; change_pct: number }> = {
  "ALT-001":    { region: "강남", channel: "도매",   change_pct: -20.0 },
  "ALT-002":    { region: "홍대", channel: "리테일", change_pct: -15.0 },
  "ALT-DRM001": { region: "강남", channel: "도매",   change_pct: -30.0 },
  "ALT-DRM002": { region: "홍대", channel: "리테일", change_pct: -25.0 },
};

// ─── Actions 시뮬레이션 ─────────────────────────────────────────────────────
export const MOCK_ACTION_RESULTS: Record<string, {
  revenue_change_pct: number;
  target_accounts: number;
  estimated_cost: string;
  roi: number;
}> = {
  "ACT-001": { revenue_change_pct: 12.0, target_accounts: 44, estimated_cost: "850만원",   roi: 3.2 },
  "ACT-002": { revenue_change_pct: 5.5,  target_accounts: 3,  estimated_cost: "1,200만원", roi: 1.8 },
  "ACT-003": { revenue_change_pct: 3.0,  target_accounts: 12, estimated_cost: "200만원",   roi: 5.1 },
};

// ─── Knowledge Graph (강남 도매) ────────────────────────────────────────────
export const MOCK_GRAPH = {
  source: "mock",
  nodes: [
    { id: "gangnam",            label: "강남 도매",       type: "region",  status: null },
    { id: "rest1",              label: "리스토란테 A",    type: "account", status: "closed" },
    { id: "rest2",              label: "비스트로 마레",   type: "account", status: "closed" },
    { id: "wine1",              label: "와인바 비노",     type: "account", status: "closed" },
    { id: "rest3",              label: "레스토랑 세종",   type: "account", status: null },
    { id: "hotel1",             label: "파르나스 호텔",   type: "account", status: null },
    { id: "sku-caymus-cab",     label: "케이머스 카베르네", type: "sku",   status: null },
    { id: "sku-montes-alpha",   label: "몬테스 알파",     type: "sku",     status: null },
    { id: "sku-montes-classic", label: "몬테스 클래식",   type: "sku",     status: null },
    { id: "usa",                label: "미국",            type: "brand",   status: null },
    { id: "chile",              label: "칠레",            type: "brand",   status: null },
  ],
  edges: [
    { from: "gangnam", to: "rest1",  relation: "SERVES" },
    { from: "gangnam", to: "rest2",  relation: "SERVES" },
    { from: "gangnam", to: "wine1",  relation: "SERVES" },
    { from: "gangnam", to: "rest3",  relation: "SERVES" },
    { from: "gangnam", to: "hotel1", relation: "SERVES" },
    { from: "rest1",   to: "sku-caymus-cab",   relation: "ORDERS" },
    { from: "rest3",   to: "sku-caymus-cab",   relation: "ORDERS" },
    { from: "hotel1",  to: "sku-caymus-cab",   relation: "ORDERS" },
    { from: "wine1",   to: "sku-montes-alpha", relation: "ORDERS" },
    { from: "sku-caymus-cab",     to: "usa",   relation: "ORIGIN" },
    { from: "sku-montes-alpha",   to: "chile", relation: "ORIGIN" },
    { from: "sku-montes-classic", to: "chile", relation: "ORIGIN" },
  ],
};

// ─── Analyze SSE — region 별 cause/action 분기 ──────────────────────────────
export interface AnalyzeStep {
  node: "anomaly_detector" | "data_gatherer" | "root_cause_analyzer" | "action_recommender";
  status: "complete";
  data: Record<string, unknown>;
}

// 강남 도매 시나리오 (ALT-001, ALT-DRM001)
function buildGangnamSteps(changePct: number): AnalyzeStep[] {
  const baselineMean = 3722;
  const lastRevenue = 3200;
  const deltaPct = Math.round(((lastRevenue - baselineMean) / baselineMean) * 100);
  return [
    {
      node: "anomaly_detector",
      status: "complete",
      data: {
        z_score: 2.24,
        threshold: 2.0,
        detail: `강남 도매 매출 ${lastRevenue.toLocaleString()}만원 — 직전 6개월 평균 ${baselineMean.toLocaleString()}만원 대비 ${deltaPct}% (z=2.24, 임계 2.0 초과)`,
      },
    },
    {
      node: "data_gatherer",
      status: "complete",
      data: {
        neo4j_results: { accounts: 5, skus: 3, closed_accounts: 3 },
        vector_results: [
          { case: "2023년 이태원 도매 15% 하락", similarity: 0.87 },
          { case: "2022년 강남 리테일 12% 하락", similarity: 0.74 },
          { case: "2021년 홍대 도매 18% 하락",  similarity: 0.68 },
        ],
      },
    },
    {
      node: "root_cause_analyzer",
      status: "complete",
      data: {
        causes: [
          { depth: 1, text: `강남 도매 매출 ${changePct.toFixed(0)}% 하락` },
          { depth: 2, text: "거래처 3곳 폐업 (레스토랑 2, 와인바 1)" },
          { depth: 2, text: "거래처 3곳 폐업 → 케이머스 카베르네 소비뇽 발주 -4% (월평균 1,560만원 → 1,490만원)" },
          { depth: 2, text: "거래처 3곳 폐업 → 몬테스 알파 카베르네 발주 -13% (월평균 449만원 → 390만원)" },
          { depth: 3, text: "케이머스 카베르네 소비뇽 재고 적체 추정 약 4,542만원 (현재 240병, 체류 150일)" },
          { depth: 3, text: "MZ세대 와인 → 위스키·무알코올 이탈 가속" },
          { depth: 3, text: "편의점 채널 구조적 성장 → 도매 잠식" },
          { depth: 3, text: "병당 판매가 17% 하락 (vs 2022) 지속" },
        ],
      },
    },
    {
      node: "action_recommender",
      status: "complete",
      data: {
        actions: [
          { id: "ACT-001", title: "중저가 칠레 와인 프로모션",
            desc: "몬테스 클래식 20% 할인 쿠폰 → 잔존 거래처 44곳 대상",
            impact: "예상 매출 +12%", confidence: 0.82 },
          { id: "ACT-002", title: "편의점 채널 신규 입점",
            desc: "GS25·CU Long Tail SKU 5종 소용량(187ml) 패키징",
            impact: "Long Tail 소진율 +8%p", confidence: 0.74 },
          { id: "ACT-003", title: "잔존 레스토랑 와인 페어링 컨설팅",
            desc: "와인 페어링 메뉴 최적화 데이터 무상 제공",
            impact: "거래처 이탈 방지, 충성도 +15%", confidence: 0.68 },
        ],
      },
    },
  ];
}

// 홍대 리테일 시나리오 (ALT-002, ALT-DRM002)
function buildHongdaeSteps(changePct: number): AnalyzeStep[] {
  return [
    {
      node: "anomaly_detector",
      status: "complete",
      data: {
        z_score: Math.round((Math.abs(changePct) / 7) * 10) / 10,
        threshold: 2.0,
        detail: `홍대 리테일 매출 전월 대비 ${changePct.toFixed(0)}% 하락 — 직전 6개월 평균 대비 표준편차 초과`,
      },
    },
    {
      node: "data_gatherer",
      status: "complete",
      data: {
        neo4j_results: { accounts: 8, skus: 21, closed_accounts: 2 },
        vector_results: [
          { case: "2024년 강남 도매 20% 하락",   similarity: 0.81 },
          { case: "2023년 신촌 리테일 13% 하락", similarity: 0.72 },
          { case: "2022년 잠실 리테일 11% 하락", similarity: 0.65 },
        ],
      },
    },
    {
      node: "root_cause_analyzer",
      status: "complete",
      data: {
        causes: [
          { depth: 1, text: `홍대 리테일 매출 ${changePct.toFixed(0)}% 하락` },
          { depth: 2, text: "거래처 2곳 폐업 (와인샵 1, 리테일 1)" },
          { depth: 2, text: "유동인구 감소 + MZ 와인 이탈" },
          { depth: 3, text: "편의점 와인 객단가 -22% 가격 압박" },
          { depth: 3, text: "근거리 거래처 폐업 → 진열 부족 악순환" },
          { depth: 3, text: "주말 외식 트렌드 변화 (위스키바·하이볼)" },
        ],
      },
    },
    {
      node: "action_recommender",
      status: "complete",
      data: {
        actions: [
          { id: "ACT-001", title: "중저가 칠레 와인 프로모션",
            desc: "몬테스 클래식 20% 할인 쿠폰 → 홍대 잔존 거래처 6곳",
            impact: "예상 매출 +9%", confidence: 0.78 },
          { id: "ACT-002", title: "편의점 채널 신규 입점",
            desc: "GS25·CU 홍대 인근 Long Tail SKU 5종 입점",
            impact: "Long Tail 소진율 +6%p", confidence: 0.71 },
          { id: "ACT-003", title: "신규 거래처 발굴 캠페인",
            desc: "홍대 신규 와인바 오픈 3곳 대상 견적 + 시음회",
            impact: "월 평균 매출 +200만원/거래처", confidence: 0.65 },
        ],
      },
    },
  ];
}

export function buildAnalyzeSteps(alertId: string): AnalyzeStep[] {
  const meta = ALERT_SCENARIO_MAP[alertId] ?? ALERT_SCENARIO_MAP["ALT-001"];
  if (meta.region === "홍대") return buildHongdaeSteps(meta.change_pct);
  return buildGangnamSteps(meta.change_pct);
}

// ─── What-If 추천 ───────────────────────────────────────────────────────────
export const MOCK_WHATIF = {
  scenario_summary: (
    "강남 도매 채널 매출 전월 대비 -20% 급락. 거래처 3곳(레스토랑 2, 와인바 1) 폐업. " +
    "이 상황의 근본 원인은 단발성 폐업이 아니라 구조적 수요 이탈(MZ→위스키·무알코올, " +
    "편의점 채널 잠식)이므로, 단기 회복보다 발주 정확도·재무 방어·Long Tail 분산이 우선."
  ),
  sliders: { demand: 28, hedge: 70, detection: 75, longTail: 35 },
  reasons: [
    {
      slider: "demand" as const,
      title: "수요예측 28% — 발주 재정렬이 가장 시급",
      rationale: "강남 거래처 3곳 폐업으로 해당 SKU 발주가 즉시 미스얼라인. 수요예측 정확도를 28%까지 끌어올리면 재고보유일수가 362일 → 약 260일대로 정상화 경로 진입.",
      quantified_effect: "재고 약 41억 회수 · 이자 절감 연 2.1억",
      source_signal: "Alert ALT-001 (강남/도매 -20%) · 재고보유일수 362일 기준값 · Phase 2 목표치 250일과 격차 100일",
    },
    {
      slider: "hedge" as const,
      title: "환헤지 70% — 외화부채 73억 노출 방어",
      rationale: "강남 매출 감소가 현금흐름 압박으로 누적 중. 외화부채 73억의 5% 변동만으로 3.6억 영향이 발생하므로, 이 시점에서 헤지 비율 70% 이상이 방어선.",
      quantified_effect: "환리스크 절감 연 약 1.3억",
      source_signal: "DART 2025년 3분기 외화부채 73억 · 부채 316억 vs 현금 44억",
    },
    {
      slider: "detection" as const,
      title: "연체 조기식별 75% — 폐업 패턴 학습 즉시 반영",
      rationale: "이번 3곳 폐업 패턴(주문량 감소→결제 지연→폐업)을 학습해 잔존 강남 거래처 41곳 중 유사 신호를 보이는 곳을 사전 플래그. 대손충당금 매년 2억 증가 추세를 꺾는 가장 빠른 레버.",
      quantified_effect: "대손 절감 연 약 1.1억 · 연체율 19.4% → 11% 대",
      source_signal: "매출채권 25.4억 · 연체율 18.6% · 대손충당금 연 +2억 추세",
    },
    {
      slider: "longTail" as const,
      title: "Long Tail 35% — 잃은 채널을 AI 매칭으로 보완",
      rationale: "740 SKU 중 프랑스가 SKU 38% vs 매출 23% (gap +15%p)로 가장 큰 미소진 위험. 폐업한 강남 채널을 즉시 회복할 수 없다면, Long Tail 매칭으로 다른 채널(편의점·온라인) 분산이 정답.",
      quantified_effect: "Long Tail 소진율 13.2% → 48% · 추가 매출 연 약 0.8억",
      source_signal: "PoC SKU 분석 (poc_methodology.md) · 국가별 gap (FR +15%p, IT +8%p) · Opportunity Top 50 중 화이트·스파클링·칠레/뉴질랜드 entry-level 다수",
    },
  ],
  overall_projection: "이 조합으로 비용 절감 합계 약 5.3억 + Long Tail 추가 매출 0.8억 = 현재 영업손실 2.3억을 충분히 상쇄해 흑자 전환 가능.",
  model: "mock",
};
