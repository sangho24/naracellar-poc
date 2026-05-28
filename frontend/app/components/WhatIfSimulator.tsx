"use client";

import { useState, useMemo, useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── AI 추천 응답 타입 ───────────────────────────────────────────────────────
interface ReasonCard {
  slider: "demand" | "hedge" | "detection" | "longTail";
  title: string;
  rationale: string;
  quantified_effect: string;
  source_signal: string;
}
interface RecommendResponse {
  scenario_summary: string;
  sliders: { demand: number; hedge: number; detection: number; longTail: number };
  reasons: ReasonCard[];
  overall_projection: string;
  model: string;
}

const LOADING_STEPS = [
  "현재 KPI · 알림 · KG 컨텍스트 수집 중",
  "740 SKU 분석 + 국가별 gap 매핑 중",
  "Gemini 2.0 Flash 추론 중 (LLM fallback: Mock)",
  "슬라이더 4개 최적값 + 근거 카드 정리 중",
];
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

// ─── 기준값 (수정 금지) ───────────────────────────────────────────────────────
const BASE = {
  inventoryDays: 362,
  inventoryDaysOptimal: 215,
  overdueRate: 19.4,
  longTailRate: 13.2,
  fxExposure: 73,
  fxImpact: 3.6,
  operatingLoss: -2.3,
  totalInventoryValue: 400,
  annualRevenue: 800,
  overdueAmount: 25.4,
  badDebtAnnualIncrease: 2,
  itCostReduction: 0.8,
  annualInterestBase: 16,
} as const;

const PRESETS = {
  conservative: { demand: 10, hedge: 30, detection: 40, longTail: 10 },
  base:         { demand: 20, hedge: 50, detection: 60, longTail: 20 },
  optimistic:   { demand: 35, hedge: 80, detection: 80, longTail: 40 },
} as const;

type PresetKey = keyof typeof PRESETS;

interface SliderValues {
  demand: number;
  hedge: number;
  detection: number;
  longTail: number;
}

// ─── 카운트업 훅 ──────────────────────────────────────────────────────────────
function useAnimatedValue(target: number, decimals: number = 1, duration: number = 400): number {
  const [display, setDisplay] = useState<number>(target);
  const prevRef = useRef<number>(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = target;
    if (start === end) return;
    const startTime = performance.now();

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      const current = start + (end - start) * eased;
      const factor = Math.pow(10, decimals);
      setDisplay(Math.round(current * factor) / factor);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
        setDisplay(end);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, decimals]);

  return display;
}

// ─── KPI After 카드 ───────────────────────────────────────────────────────────
interface KpiAfterCardProps {
  title: string;
  before: string;
  afterValue: number;
  afterSuffix: string;
  change: string;
  changeType: "green" | "blue" | "red" | "neutral";
  decimals?: number;
}

function KpiAfterCard({
  title, before, afterValue, afterSuffix, change, changeType, decimals = 1,
}: KpiAfterCardProps) {
  const animated = useAnimatedValue(afterValue, decimals);
  const formatted = decimals === 0 ? Math.round(animated).toString() : animated.toFixed(decimals);

  const changeColor =
    changeType === "green" ? "text-positive"
    : changeType === "blue" ? "text-brand-primary"
    : changeType === "red" ? "text-danger"
    : "text-ink-500";

  return (
    <div className="surface surface-hover p-4 transition-all">
      <p className="text-xs text-ink-500 font-medium mb-2">{title}</p>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-sm text-ink-300 line-through">{before}</span>
        <span className="text-lg font-bold text-ink-900 tabular-nums">
          {formatted}{afterSuffix}
        </span>
      </div>
      <span className={`text-xs font-medium ${changeColor}`}>{change}</span>
    </div>
  );
}

// ─── 슬라이더 행 ──────────────────────────────────────────────────────────────
interface SliderRowProps {
  icon: string; title: string; description: string;
  value: number; min: number; max: number; step: number;
  unit: string; impactLabel: string;
  onChange: (v: number) => void;
}

function SliderRow({
  icon, title, description, value, min, max, step, unit, impactLabel, onChange,
}: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <span className="text-sm font-medium text-ink-900">{title}</span>
        </div>
        <span className="text-sm font-bold text-brand-primary tabular-nums">
          {value}{unit}
        </span>
      </div>

      <p className="text-xs text-ink-500 mb-3 ml-6">{description}</p>

      <div className="relative mb-2">
        <div className="w-full h-1.5 bg-ink-100 rounded-full" />
        <div
          className="absolute top-0 left-0 h-1.5 bg-brand-primary rounded-full pointer-events-none"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
          style={{ margin: 0 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-primary rounded-full border-2 border-surface shadow-card pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>

      <p className="text-xs text-brand-primary mt-3">{impactLabel}</p>
    </div>
  );
}

// ─── 커스텀 워터폴 툴팁 ──────────────────────────────────────────────────────
interface TooltipPayloadEntry {
  name: string; value: number;
  payload?: { displayValue?: number; name?: string };
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function WaterfallTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload.find((p) => p.name === "visible");
  const displayVal = entry?.payload?.displayValue ?? entry?.value ?? 0;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #d4cfc4",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "12px",
        color: "#1a1410",
        boxShadow: "0 4px 16px rgba(26,20,16,0.08)",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p>{(displayVal as number).toFixed(2)}억원</p>
    </div>
  );
}

// ─── AI 추천 패널 ────────────────────────────────────────────────────────────
interface AiPanelProps {
  onApplyRecommendation: (sliders: { demand: number; hedge: number; detection: number; longTail: number }) => void;
  onGoToAction?: () => void;  // 매니저 review용 다음 단계 CTA
}

function AiRecommendationPanel({ onApplyRecommendation, onGoToAction }: AiPanelProps) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<RecommendResponse | null>(null);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state === "loading") {
      setLoadingStepIdx(0);
      timerRef.current = setInterval(() => {
        setLoadingStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
      }, 900);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const handleRecommend = async () => {
    setState("loading");
    setError(null);
    setData(null);
    const minDelay = new Promise((r) => setTimeout(r, 3600));
    try {
      const [res] = await Promise.all([
        fetch(`${API_BASE}/api/v1/whatif/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario: "gangnam_wholesale" }),
        }),
        minDelay,
      ]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RecommendResponse = await res.json();
      setData(json);
      setState("done");
      // 슬라이더 자동 적용 (약간 딜레이 후 자연스럽게)
      setTimeout(() => onApplyRecommendation(json.sliders), 300);
    } catch (e) {
      setError(e instanceof Error ? e.message : "추천 실패");
      setState("error");
    }
  };

  return (
    <div className="surface p-5 relative overflow-hidden">
      {/* 액센트 데코 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-base">🤖</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-ink-900">AI 최적조합 추천</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-accentLight text-brand-accent font-medium tracking-wide">
                Gemini 2.0 Flash
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-1">
              현재 알림(강남 도매 -20%)·KG·SKU 분석을 종합해 4개 슬라이더 최적값과 근거를 제시
            </p>
          </div>
        </div>
        <button
          onClick={handleRecommend}
          disabled={state === "loading"}
          className="text-xs bg-brand-primary hover:bg-brand-primaryDark text-white disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 flex-shrink-0"
        >
          {state === "loading" && (
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {state === "loading" ? "분석 중..." : state === "done" ? "다시 추천" : "AI 추천 받기"}
        </button>
      </div>

      {/* 로딩 단계 표시 */}
      {state === "loading" && (
        <div className="bg-canvas border border-line rounded-lg p-4 space-y-2.5">
          {LOADING_STEPS.map((step, i) => {
            const isDone = i < loadingStepIdx;
            const isActive = i === loadingStepIdx;
            const isPending = i > loadingStepIdx;
            return (
              <div key={i} className="flex items-center gap-3 text-xs">
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {isDone && (
                    <span className="w-3.5 h-3.5 rounded-full bg-positive/20 border border-positive flex items-center justify-center">
                      <span className="text-positive text-[7px] font-bold">✓</span>
                    </span>
                  )}
                  {isActive && <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />}
                  {isPending && <span className="w-2.5 h-2.5 rounded-full border border-line-strong" />}
                </div>
                <span className={isActive ? "text-brand-primary font-medium" : isDone ? "text-ink-900" : "text-ink-300"}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 에러 */}
      {state === "error" && (
        <div className="bg-danger/5 border border-danger/30 rounded-lg p-3 text-xs text-danger">
          추천 실패: {error}
        </div>
      )}

      {/* 결과 */}
      {state === "done" && data && (
        <div className="space-y-4 mt-2">
          {/* 시나리오 요약 */}
          <div className="bg-brand-primaryLight border border-brand-primaryBorder rounded-lg p-4">
            <p className="text-[11px] uppercase tracking-wider text-brand-primary font-semibold mb-1">시나리오 분석</p>
            <p className="text-sm text-ink-900 leading-relaxed">{data.scenario_summary}</p>
          </div>

          {/* 추천된 슬라이더 4개 — 추천값과 함께 */}
          <div className="grid grid-cols-4 gap-2">
            {(["demand", "hedge", "detection", "longTail"] as const).map((key, i) => {
              const labels = { demand: "수요예측", hedge: "환헤지", detection: "연체식별", longTail: "Long Tail" };
              const icons = { demand: "📦", hedge: "💱", detection: "💳", longTail: "🤖" };
              const units = { demand: "%", hedge: "%", detection: "%", longTail: "%p" };
              return (
                <div key={key} className="bg-canvas border border-line rounded-lg p-3 text-center">
                  <div className="text-base mb-1">{icons[key]}</div>
                  <p className="text-[10px] text-ink-500 mb-1">{labels[key]}</p>
                  <p className="text-lg font-bold text-brand-primary tabular-nums">
                    {data.sliders[key]}{units[key]}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 4개 이유 카드 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-ink-700 tracking-tight">추천 근거</p>
            {data.reasons.map((reason, i) => {
              const icons = { demand: "📦", hedge: "💱", detection: "💳", longTail: "🤖" };
              return (
                <div
                  key={i}
                  className="bg-surface border border-line rounded-lg p-3.5 hover:border-brand-primary/30 transition-colors"
                  style={{ animation: `fadeInUp 0.4s ease-out ${i * 100}ms both` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0">{icons[reason.slider]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 mb-1.5">{reason.title}</p>
                      <p className="text-xs text-ink-700 leading-relaxed mb-2">{reason.rationale}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-positive/10 text-positive font-medium">
                          {reason.quantified_effect}
                        </span>
                        <span className="text-ink-500">근거: {reason.source_signal}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 종합 결론 — Hero 카드 */}
          <ConclusionHero
            projection={data.overall_projection}
            model={data.model}
            onGoToAction={onGoToAction}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── 종합 결론 Hero 카드 ─────────────────────────────────────────────────────
interface ConclusionHeroProps {
  projection: string;
  model: string;
  onGoToAction?: () => void;
}

function ConclusionHero({ projection, model, onGoToAction }: ConclusionHeroProps) {
  // projection 텍스트에서 "흑자 전환 가능" 핵심 수치 추출 시도
  // 예: "비용 절감 합계 약 5.3억 + Long Tail 추가 매출 0.8억 = 현재 영업손실 2.3억을 충분히 상쇄해 흑자 전환 가능."
  const savingMatch = projection.match(/절감\s*합?계?\s*약?\s*([\d.]+)억/);
  const revenueMatch = projection.match(/추가\s*매출\s*([\d.]+)억/);
  const saving = savingMatch ? parseFloat(savingMatch[1]) : 5.3;
  const revenue = revenueMatch ? parseFloat(revenueMatch[1]) : 0.8;
  const loss = 2.3;
  const net = saving + revenue - loss;

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-positive/40 bg-gradient-to-br from-positive/10 via-positive/5 to-transparent p-5">
      {/* 액센트 데코 */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-positive/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-positive font-bold">최종 결론</span>
          <span className="text-[10px] text-ink-300">·</span>
          <span className="text-[10px] text-ink-500">시뮬레이션 종합</span>
        </div>

        {/* Hero 숫자 */}
        <div className="flex items-end gap-3 mb-2">
          <div>
            <p className="text-[10px] text-ink-500 mb-0.5">예상 영업이익</p>
            <p className="text-4xl font-bold tabular-nums text-positive leading-none">
              +{net.toFixed(1)}<span className="text-2xl">억</span>
            </p>
          </div>
          <div className="mb-1">
            <span className="text-[11px] px-2 py-1 rounded-full bg-positive text-white font-semibold tracking-wide">
              ✓ 흑자 전환
            </span>
          </div>
        </div>

        {/* 수식 형태 breakdown */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[12px] text-ink-700 mb-3 font-mono">
          <span className="text-positive font-semibold tabular-nums">+{saving}억</span>
          <span className="text-ink-300">(비용절감)</span>
          <span className="text-ink-300">+</span>
          <span className="text-positive font-semibold tabular-nums">+{revenue}억</span>
          <span className="text-ink-300">(LongTail)</span>
          <span className="text-ink-300">−</span>
          <span className="text-danger font-semibold tabular-nums">{loss}억</span>
          <span className="text-ink-300">(현재 손실)</span>
          <span className="text-ink-300">=</span>
          <span className="text-positive font-bold tabular-nums">+{net.toFixed(1)}억</span>
        </div>

        {/* 원문 설명 */}
        <p className="text-sm text-ink-900 leading-relaxed mb-4">{projection}</p>

        {/* CTA 버튼 */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-positive/20">
          {onGoToAction && (
            <button
              onClick={onGoToAction}
              className="text-xs bg-brand-primary hover:bg-brand-primaryDark text-white px-3.5 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <span>구체 액션 보기</span>
              <span aria-hidden>→</span>
            </button>
          )}
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            className="text-xs bg-surface border border-line hover:border-brand-primary/40 text-ink-700 hover:text-brand-primary px-3.5 py-2 rounded-lg transition-colors font-medium"
          >
            워터폴 차트로 확인 ↓
          </button>
          <span className="ml-auto text-[10px] text-ink-500">
            모델: <span className="font-mono">{model}</span> · 슬라이더 자동 적용됨
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
interface WhatIfSimulatorProps {
  onGoToAction?: () => void;  // dashboard에서 wine-match 모드로 전환할 콜백
}

export default function WhatIfSimulator({ onGoToAction }: WhatIfSimulatorProps = {}) {
  const [sliders, setSliders] = useState<SliderValues>({ demand: 0, hedge: 0, detection: 0, longTail: 0 });
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);

  const calc = useMemo(() => {
    const { demand, hedge, detection, longTail } = sliders;

    const inventoryReduction = (BASE.inventoryDays - BASE.inventoryDaysOptimal) * (demand / 40);
    const newInventoryDays = Math.round(BASE.inventoryDays - inventoryReduction);
    const inventoryValueReduction = (inventoryReduction / BASE.inventoryDays) * BASE.totalInventoryValue;
    const interestSaving = inventoryValueReduction * 0.05;

    const riskReduction = BASE.fxImpact * (hedge / 100) * 0.5;

    const badDebtSaving = BASE.badDebtAnnualIncrease * (detection / 100) * 0.7;
    const newOverdueRate = BASE.overdueRate * (1 - (detection / 100) * 0.6);

    const newLongTailRate = BASE.longTailRate + longTail;
    const additionalRevenue = BASE.annualRevenue * (longTail / 100) * 0.3;

    const totalSaving = interestSaving + riskReduction + badDebtSaving + BASE.itCostReduction;
    const projectedOperating = BASE.operatingLoss + totalSaving + additionalRevenue;

    return {
      newInventoryDays, inventoryValueReduction, interestSaving,
      riskReduction, badDebtSaving, newOverdueRate,
      newLongTailRate, additionalRevenue, totalSaving, projectedOperating,
    };
  }, [sliders]);

  const waterfallData = useMemo(() => {
    const items = [
      { name: "현재 영업이익", value: BASE.operatingLoss, type: "base" },
      { name: "이자비용↓", value: calc.interestSaving, type: "positive" },
      { name: "환리스크↓", value: calc.riskReduction, type: "positive" },
      { name: "대손↓", value: calc.badDebtSaving, type: "positive" },
      { name: "IT비용↓", value: BASE.itCostReduction, type: "fixed" },
      { name: "Long Tail↑", value: calc.additionalRevenue, type: "positive" },
      { name: "전환 후", value: calc.projectedOperating, type: "result" },
    ];

    let runningTotal = 0;
    return items.map((item) => {
      if (item.type === "base") {
        runningTotal = item.value;
        return { ...item, offset: 0, visible: item.value, displayValue: item.value };
      } else if (item.type === "result") {
        return { ...item, offset: 0, visible: item.value, displayValue: item.value };
      } else {
        const offset = runningTotal;
        const visible = item.value;
        runningTotal += item.value;
        return { ...item, offset, visible, displayValue: item.value };
      }
    });
  }, [calc]);

  const applyPreset = (key: PresetKey) => {
    setActivePreset(key);
    setSliders(PRESETS[key]);
  };

  const setSlider = (key: keyof SliderValues, value: number) => {
    setActivePreset(null);
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const impactLabels = {
    demand: `영향 지표: 재고보유일수 ${calc.newInventoryDays}일 (↓${BASE.inventoryDays - calc.newInventoryDays}일) · 이자절감 연 ${calc.interestSaving.toFixed(2)}억`,
    hedge: `영향 지표: 환리스크 절감 연 ${calc.riskReduction.toFixed(2)}억원`,
    detection: `영향 지표: 대손 절감 연 ${calc.badDebtSaving.toFixed(2)}억 · 연체율 ${calc.newOverdueRate.toFixed(1)}%`,
    longTail: `영향 지표: Long Tail 소진율 ${calc.newLongTailRate.toFixed(1)}% · 추가 매출 연 ${calc.additionalRevenue.toFixed(2)}억`,
  };

  // 워터폴 색상 — 나라셀라 톤
  const barColors: Record<string, string> = {
    base: "#6f6760",
    positive: "#2d7d3f",
    fixed: "#b89a65",
    result: calc.projectedOperating > 0 ? "#15803d" : "#c7373b",
  };

  const projectedAnimated = useAnimatedValue(calc.projectedOperating, 2);
  const totalSavingAnimated = useAnimatedValue(calc.totalSaving, 2);
  const additionalRevenueAnimated = useAnimatedValue(calc.additionalRevenue, 2);

  const applyAiRecommendation = (newSliders: SliderValues) => {
    setActivePreset(null);
    setSliders(newSliders);
  };

  return (
    <div className="space-y-6">
      {/* ── 섹션 0: AI 최적조합 추천 (LLM 기반) ───────────────────────────── */}
      <AiRecommendationPanel
        onApplyRecommendation={applyAiRecommendation}
        onGoToAction={onGoToAction}
      />

      {/* ── 섹션 1: 시나리오 조절 ─────────────────────────────────────────── */}
      <div className="surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 bg-brand-primary rounded-sm flex-shrink-0" />
            <h2 className="text-[13px] font-semibold text-ink-900 tracking-tight uppercase">시나리오 조절</h2>
          </div>

          <div className="flex gap-2">
            {(["conservative", "base", "optimistic"] as PresetKey[]).map((key) => {
              const labels: Record<PresetKey, string> = { conservative: "보수적", base: "기본", optimistic: "낙관적" };
              const sublabels: Record<PresetKey, string> = { conservative: "Conservative", base: "Base Case", optimistic: "Optimistic" };
              const isActive = activePreset === key;
              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                    isActive
                      ? "bg-brand-primary border-brand-primary text-white shadow-card"
                      : "bg-surface border-line text-ink-700 hover:border-brand-primary/40 hover:text-brand-primary"
                  }`}
                >
                  {labels[key]}
                  <span className="block text-[10px] opacity-70">{sublabels[key]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SliderRow icon="📦" title="수요예측 정확도 개선"
            description="AI 수요예측 모델 도입으로 발주 정확도 향상 → 재고 적정화"
            value={sliders.demand} min={0} max={40} step={1} unit="%"
            impactLabel={impactLabels.demand} onChange={(v) => setSlider("demand", v)} />
          <SliderRow icon="💱" title="환율 헤지 자동화 비율"
            description="실시간 환율 추적 + 자동 알림으로 환리스크 헤지 비율 향상"
            value={sliders.hedge} min={0} max={100} step={5} unit="%"
            impactLabel={impactLabels.hedge} onChange={(v) => setSlider("hedge", v)} />
          <SliderRow icon="💳" title="연체 조기식별률"
            description="거래처 신용스코링으로 연체 위험 사전 식별 → 대손 방지"
            value={sliders.detection} min={0} max={100} step={5} unit="%"
            impactLabel={impactLabels.detection} onChange={(v) => setSlider("detection", v)} />
          <SliderRow icon="🤖" title="AI 추천 Long Tail 활성화"
            description="AI Agent가 1,955개 SKU × 570 거래처 매칭 → Long Tail 소진"
            value={sliders.longTail} min={0} max={50} step={1} unit="%"
            impactLabel={impactLabels.longTail} onChange={(v) => setSlider("longTail", v)} />
        </div>
      </div>

      {/* ── 섹션 2: KPI Before → After ───────────────────────────────────── */}
      <div className="surface p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-4 bg-brand-primary rounded-sm flex-shrink-0" />
          <h2 className="text-[13px] font-semibold text-ink-900 tracking-tight uppercase">KPI 변화 Before → After</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiAfterCard title="📦 재고보유일수" before="362일"
            afterValue={calc.newInventoryDays} afterSuffix="일"
            change={`▼ ${BASE.inventoryDays - calc.newInventoryDays}일 감소`}
            changeType="green" decimals={0} />
          <KpiAfterCard title="💰 재고 감소 효과" before="—"
            afterValue={calc.inventoryValueReduction} afterSuffix="억원"
            change={`이자 절감 연 ${calc.interestSaving.toFixed(2)}억`}
            changeType="blue" decimals={1} />
          <KpiAfterCard title="💳 매출채권 연체율" before="19.4%"
            afterValue={calc.newOverdueRate} afterSuffix="%"
            change={`▼ ${(BASE.overdueRate - calc.newOverdueRate).toFixed(1)}%p 감소`}
            changeType="green" decimals={1} />
          <KpiAfterCard title="💱 환리스크 절감" before="—"
            afterValue={calc.riskReduction} afterSuffix="억원/년"
            change="자동 헤지 효과" changeType="blue" decimals={2} />
          <KpiAfterCard title="📈 Long Tail 소진율" before="13.2%"
            afterValue={calc.newLongTailRate} afterSuffix="%"
            change={`▲ +${sliders.longTail}%p 증가`}
            changeType="green" decimals={1} />
          <KpiAfterCard title="🚀 추가 매출" before="—"
            afterValue={calc.additionalRevenue} afterSuffix="억원/년"
            change="Long Tail 매출 활성화" changeType="green" decimals={2} />
        </div>
      </div>

      {/* ── 섹션 3: 종합 재무 영향 ───────────────────────────────────────── */}
      <div className="surface p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-4 bg-brand-primary rounded-sm flex-shrink-0" />
          <h2 className="text-[13px] font-semibold text-ink-900 tracking-tight uppercase">종합 재무 영향</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측 */}
          <div className="space-y-3">
            <div
              className={`rounded-xl p-5 border ${
                calc.projectedOperating > 0
                  ? "bg-positive/8 border-positive/30"
                  : "bg-danger/8 border-danger/30"
              }`}
            >
              <p className="text-xs text-ink-500 mb-1">전환 후 예상 영업이익</p>
              <p
                className={`text-3xl font-bold tabular-nums ${
                  calc.projectedOperating > 0 ? "text-positive" : "text-danger"
                }`}
              >
                {projectedAnimated >= 0 ? "+" : ""}
                {projectedAnimated.toFixed(2)}억원
              </p>
              <p
                className={`text-sm font-semibold mt-2 ${
                  calc.projectedOperating > 0 ? "text-positive" : "text-ink-500"
                }`}
              >
                {calc.projectedOperating > 0 ? "✓ 흑자 전환 달성" : "계속 노력 필요"}
              </p>
            </div>

            <div className="bg-canvas border border-line rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">현재 영업손실</span>
                <span className="text-danger font-medium tabular-nums">
                  {BASE.operatingLoss}억원
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">총 비용 절감 효과</span>
                <span className="text-positive font-medium tabular-nums">
                  +{totalSavingAnimated.toFixed(2)}억원
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">추가 매출 기여</span>
                <span className="text-brand-primary font-medium tabular-nums">
                  +{additionalRevenueAnimated.toFixed(2)}억원
                </span>
              </div>
              <div className="border-t border-line pt-2 flex justify-between text-sm font-semibold">
                <span className="text-ink-900">전환 후 영업이익</span>
                <span
                  className={`tabular-nums ${
                    calc.projectedOperating > 0 ? "text-positive" : "text-danger"
                  }`}
                >
                  {projectedAnimated >= 0 ? "+" : ""}
                  {projectedAnimated.toFixed(2)}억원
                </span>
              </div>
            </div>

            <div className="bg-canvas border border-line rounded-xl p-4">
              <p className="text-xs text-ink-500 mb-2 font-medium">비용 절감 세부 내역</p>
              <div className="space-y-1.5">
                {[
                  { label: "이자비용 절감", value: calc.interestSaving, color: "text-positive" },
                  { label: "환리스크 절감", value: calc.riskReduction, color: "text-positive" },
                  { label: "대손 절감", value: calc.badDebtSaving, color: "text-positive" },
                  { label: "IT비용 절감 (고정)", value: BASE.itCostReduction, color: "text-brand-accent" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-ink-500">{item.label}</span>
                    <span className={`tabular-nums font-medium ${item.color}`}>
                      +{item.value.toFixed(2)}억
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: 워터폴 차트 */}
          <div className="bg-canvas border border-line rounded-xl p-4">
            <p className="text-xs text-ink-500 mb-3 font-medium">영업이익 워터폴 (억원)</p>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart
                data={waterfallData}
                margin={{ top: 8, right: 8, bottom: 32, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e5de" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6f6760", fontSize: 10 }}
                  axisLine={{ stroke: "#d4cfc4" }}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={48}
                />
                <YAxis
                  tickFormatter={(v: number) => `${v.toFixed(1)}`}
                  tick={{ fill: "#6f6760", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  unit="억"
                  width={42}
                />
                <Tooltip content={<WaterfallTooltip />} />
                <ReferenceLine y={0} stroke="#d4cfc4" strokeWidth={1} />

                <Bar dataKey="offset" stackId="waterfall" fill="transparent" radius={0}>
                  {waterfallData.map((_, index) => (
                    <Cell key={`offset-${index}`} fill="transparent" />
                  ))}
                </Bar>

                <Bar dataKey="visible" stackId="waterfall" radius={[3, 3, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={barColors[entry.type] ?? "#6f6760"} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {[
                { color: "#6f6760", label: "현재 영업이익" },
                { color: "#2d7d3f", label: "비용 절감" },
                { color: "#b89a65", label: "IT(고정)" },
                { color: "#15803d", label: "전환 후(흑자)" },
                { color: "#c7373b", label: "전환 후(적자)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-ink-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
