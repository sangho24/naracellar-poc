"use client";

import { useMemo, useState } from "react";
import {
  accounts,
  wines,
  matchWines,
  type Account,
  type Wine,
} from "../data/wineMatchingData";

// =====================================================
// 채널 / 티어 / 재고일수 색상 유틸 — 기존 톤 유지
// =====================================================
function channelBadgeClass(channel: string): string {
  switch (channel) {
    case "On-Premise":
      return "bg-brand-primary/10 text-brand-primary border border-brand-primary/20";
    case "Off-Premise":
      return "bg-brand-accent/15 text-brand-accent border border-brand-accent/25";
    case "Online":
      return "bg-positive/10 text-positive border border-positive/20";
    default:
      return "bg-ink-100 text-ink-500 border border-line";
  }
}

function TierBadge({ tier }: { tier: string }) {
  if (tier === "Long Tail") {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/25 font-medium shrink-0">
        Long Tail
      </span>
    );
  }
  if (tier === "히트") {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-medium shrink-0">
        히트
      </span>
    );
  }
  return (
    <span className="text-xs px-1.5 py-0.5 rounded bg-ink-100 text-ink-500 border border-line font-medium shrink-0">
      중간
    </span>
  );
}

function stockDaysColor(days: number): string {
  if (days >= 240) return "text-danger";
  if (days >= 150) return "text-warning";
  if (days >= 90) return "text-brand-accent";
  return "text-ink-500";
}

// 마진 프로그레스 바 (유사 ScoreBar) — 비교용
function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = pct >= 70 ? "bg-brand-primary" : pct >= 40 ? "bg-brand-accent" : "bg-ink-300";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-ink-500">
        <span>{label}</span>
        <span className="text-ink-900 font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// =====================================================
// 비즈니스 로직 — Swap 시뮬레이션
// =====================================================

// 위기 SKU 후보: stockDays >= 180 또는 Long Tail
function isRiskCandidate(w: Wine): boolean {
  return w.stockDays >= 180 || w.tier === "Long Tail";
}

// 재고 체류 비용 추정 (만원) = stockDays * priceWholesale * 추정 재고병수(=12) / 1000 / 10
// 단순 모델: 재고 자본 묶임 = stockDays * priceWholesale / 1000 (만원 단위)
function stuckCapitalMan(w: Wine): number {
  const estStockBottles = Math.max(12, Math.round(w.stockDays / 10));
  return Math.round((estStockBottles * w.priceWholesale) / 10000);
}

// 추천 score: velocity * 5 + (200 - stockDays) * 0.5 + (margin - 0.2) * 100
function recommendScore(w: Wine): number {
  return Math.round(w.monthlyVelocity * 5 + (200 - w.stockDays) * 0.5 + (w.margin - 0.2) * 100);
}

// 위기 SKU와 다른 type/country/priceTier 중 velocity 높고 stockDays 낮은 와인 3개
function getReplacements(risk: Wine): Wine[] {
  return wines
    .filter((w) => w.id !== risk.id)
    .filter((w) => w.stockDays < 100) // 회전 가능
    .filter((w) => w.country !== risk.country || w.type !== risk.type) // 다양성
    .map((w) => ({ wine: w, score: recommendScore(w) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.wine);
}

// 추천 SKU에 적합한 거래처 도출 (priceRange + 채널 활동성)
function getTargetAccounts(rec: Wine): Account[] {
  return accounts
    .filter((a) => rec.priceRetail >= a.priceRange.min * 0.7 && rec.priceRetail <= a.priceRange.max * 1.3)
    .map((a) => {
      // 매칭 스코어 활용 — 단순화: monthlyVolume 가중
      const matches = matchWines(a, [rec]);
      const score = matches[0]?.score ?? 0;
      return { account: a, score: score + Math.min(30, a.monthlyVolume / 10) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.account);
}

// 거래처별 예상 월 발주량 (보수적)
function estimatedBottles(rec: Wine, acc: Account): number {
  const ratio = Math.min(0.25, rec.monthlyVelocity / Math.max(20, acc.monthlyVolume));
  return Math.max(1, Math.round(acc.monthlyVolume * ratio * 0.5));
}

// 채널 비중 (target accounts 기반)
function channelMix(targets: Account[]): { channel: string; pct: number }[] {
  const tot = targets.length || 1;
  const counts: Record<string, number> = {};
  targets.forEach((a) => {
    counts[a.channel] = (counts[a.channel] ?? 0) + 1;
  });
  return ["On-Premise", "Off-Premise", "Online"]
    .map((ch) => ({ channel: ch, pct: Math.round(((counts[ch] ?? 0) / tot) * 100) }))
    .filter((x) => x.pct > 0);
}

// =====================================================
// 메인 컴포넌트
// =====================================================
export default function WineMatchingDemo() {
  // 위기 SKU 후보 (재고일수 내림차순)
  const riskCandidates = useMemo(
    () => wines.filter(isRiskCandidate).sort((a, b) => b.stockDays - a.stockDays),
    []
  );

  const [currentRiskWineId, setCurrentRiskWineId] = useState<string>(riskCandidates[0].id);
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [executed, setExecuted] = useState<boolean>(false);

  const riskWine = useMemo(
    () => wines.find((w) => w.id === currentRiskWineId) ?? riskCandidates[0],
    [currentRiskWineId, riskCandidates]
  );

  const replacements = useMemo(() => getReplacements(riskWine), [riskWine]);

  // 선택된 추천 SKU (없으면 첫 번째)
  const selectedRec = useMemo(() => {
    if (selectedRecId) {
      const found = replacements.find((w) => w.id === selectedRecId);
      if (found) return found;
    }
    return replacements[0];
  }, [selectedRecId, replacements]);

  const targetAccounts = useMemo(() => getTargetAccounts(selectedRec), [selectedRec]);
  const mix = useMemo(() => channelMix(targetAccounts), [targetAccounts]);

  // 종합 효과: 위기 SKU 자본 회수 + 추천 3개의 월 매출 증분 합
  const recoveredMan = stuckCapitalMan(riskWine);
  const monthlyRevGainMan = useMemo(() => {
    return replacements.reduce((acc, w) => {
      // 회전율 가속 가정 — 추가 증분 velocity * priceWholesale * 0.3 (보수적)
      return acc + Math.round((w.monthlyVelocity * w.priceWholesale * 0.3) / 10000);
    }, 0);
  }, [replacements]);

  // Long Tail 소진율 변화 (13.2% 기준)
  const ltBefore = 13.2;
  const ltAfter = Number((ltBefore + (riskWine.tier === "Long Tail" ? 4.2 : 2.1)).toFixed(1));

  // 재고일수 효과 (전체 가중)
  const stockDaysBefore = 362;
  const stockDaysAfter = stockDaysBefore - Math.min(18, Math.round(riskWine.stockDays / 20));

  function handleRiskChange(id: string) {
    setCurrentRiskWineId(id);
    setSelectedRecId(null);
    setExecuted(false);
  }

  function handleExecute() {
    setExecuted(true);
    // 5초 후 자동 해제
    setTimeout(() => setExecuted(false), 5000);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ============================================ */}
      {/* 상단: 현재 위기 SKU 박스                       */}
      {/* ============================================ */}
      <div className="surface px-5 py-4 border-l-4 border-danger">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden>⚠️</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold text-danger uppercase tracking-wider">현재 위기 SKU</span>
                <TierBadge tier={riskWine.tier} />
              </div>
              <p className="text-base text-ink-900 font-semibold leading-tight truncate">{riskWine.name}</p>
              <p className="text-xs text-ink-500 mt-0.5">
                {riskWine.brand} · {riskWine.country} · {riskWine.region} · {riskWine.type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-center">
              <p className="text-xs text-ink-500 mb-0.5">재고 체류</p>
              <p className={`text-xl font-bold tabular-nums ${stockDaysColor(riskWine.stockDays)}`}>
                {riskWine.stockDays}일
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-ink-500 mb-0.5">묶인 자본 추정</p>
              <p className="text-xl font-bold text-danger tabular-nums">{recoveredMan}만원</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-ink-500 mb-0.5">월 판매</p>
              <p className="text-xl font-bold text-ink-700 tabular-nums">{riskWine.monthlyVelocity}병</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-ink-500 mb-0.5">마진</p>
              <p className="text-xl font-bold text-ink-700 tabular-nums">{Math.round(riskWine.margin * 100)}%</p>
            </div>
          </div>

          {/* 위기 SKU 변경 selector */}
          <div className="w-full flex items-center gap-2 pt-2">
            <span className="text-xs text-ink-500">다른 위기 SKU 보기:</span>
            <select
              value={currentRiskWineId}
              onChange={(e) => handleRiskChange(e.target.value)}
              className="text-xs bg-surface border border-line rounded-md px-2 py-1 text-ink-900 hover:border-brand-primary/40 focus:outline-none focus:border-brand-primary"
            >
              {riskCandidates.slice(0, 20).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.stockDays}일 · {w.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink-300 ml-auto">
              위기 후보 {riskCandidates.length}개 SKU 중 stockDays 가장 높은 항목 자동 선정
            </span>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 중앙 2컬럼: 추천 대체 SKU + 추천 거래처/채널    */}
      {/* ============================================ */}
      <div className="grid grid-cols-[1.1fr_1fr] gap-4 flex-1 min-h-0">

        {/* ──────────────────────────────────────── */}
        {/* 좌: 추천 대체 SKU 3개                     */}
        {/* ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider px-1">
              이 SKU 대신 팔면 좋은 와인 (Top 3)
            </h3>
            <span className="text-xs text-ink-300">velocity · 재고 · 마진 종합</span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
            {replacements.map((rec, idx) => {
              const isSelected = selectedRec.id === rec.id;
              const stockDelta = riskWine.stockDays - rec.stockDays;
              const monthlyRevRiskMan = Math.round((riskWine.monthlyVelocity * riskWine.priceWholesale) / 10000);
              const monthlyRevRecMan = Math.round((rec.monthlyVelocity * rec.priceWholesale) / 10000);
              const revDelta = monthlyRevRecMan - monthlyRevRiskMan;
              const marginDelta = Math.round((rec.margin - riskWine.margin) * 100);

              return (
                <button
                  key={rec.id}
                  onClick={() => setSelectedRecId(rec.id)}
                  className={`text-left rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? "border-brand-primary bg-brand-primaryLight/40 shadow-sm"
                      : "border-line bg-surface hover:border-brand-primary/40"
                  }`}
                >
                  {/* 헤더 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-xs text-ink-300 font-mono shrink-0">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm text-ink-900 font-semibold leading-tight truncate">{rec.name}</p>
                          <TierBadge tier={rec.tier} />
                        </div>
                        <p className="text-xs text-ink-500">
                          {rec.brand} · {rec.country} · {rec.type}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* "이 SKU 대신 이걸 팔면" 비교 박스 */}
                  <div className="rounded-lg bg-ink-100/40 border border-line/60 px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider mb-2">
                      이 SKU 대신 이걸 팔면
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-xs">

                      {/* 재고 체류 */}
                      <div>
                        <p className="text-ink-300 mb-0.5">재고 체류</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`tabular-nums ${stockDaysColor(riskWine.stockDays)}`}>{riskWine.stockDays}일</span>
                          <span className="text-ink-300">→</span>
                          <span className={`font-semibold tabular-nums ${stockDaysColor(rec.stockDays)}`}>{rec.stockDays}일</span>
                        </div>
                        {stockDelta > 0 && (
                          <p className="text-[11px] text-positive font-medium tabular-nums mt-0.5">▼ {stockDelta}일 단축</p>
                        )}
                      </div>

                      {/* 월 매출 */}
                      <div>
                        <p className="text-ink-300 mb-0.5">월 매출</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-ink-500 tabular-nums">{monthlyRevRiskMan}만원</span>
                          <span className="text-ink-300">→</span>
                          <span className="text-ink-900 font-semibold tabular-nums">{monthlyRevRecMan}만원</span>
                        </div>
                        {revDelta > 0 && (
                          <p className="text-[11px] text-positive font-medium tabular-nums mt-0.5">▲ +{revDelta}만원</p>
                        )}
                      </div>

                      {/* 마진 */}
                      <div>
                        <p className="text-ink-300 mb-0.5">마진율</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-ink-500 tabular-nums">{Math.round(riskWine.margin * 100)}%</span>
                          <span className="text-ink-300">→</span>
                          <span className="text-positive font-semibold tabular-nums">{Math.round(rec.margin * 100)}%</span>
                        </div>
                        {marginDelta > 0 && (
                          <p className="text-[11px] text-positive font-medium tabular-nums mt-0.5">▲ +{marginDelta}%p</p>
                        )}
                        {marginDelta < 0 && (
                          <p className="text-[11px] text-ink-500 font-medium tabular-nums mt-0.5">{marginDelta}%p</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 부가 인사이트 */}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-ink-500">
                    <span>회전속도 <span className="tabular-nums text-ink-900 font-medium">{rec.monthlyVelocity}병/월</span></span>
                    <span>·</span>
                    <span>품종 <span className="text-ink-900">{rec.grape}</span></span>
                    <span className="ml-auto text-brand-primary text-xs font-medium">
                      {isSelected ? "선택됨 ✓" : "거래처 보기 →"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ──────────────────────────────────────── */}
        {/* 우: 추천 거래처 + 채널 비중                */}
        {/* ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider px-1">
              가장 잘 받아줄 거래처 · 채널
            </h3>
            <span className="text-xs text-ink-300 truncate max-w-[60%]">
              for {selectedRec.name}
            </span>
          </div>

          {/* 채널 비중 */}
          <div className="surface px-4 py-3">
            <p className="text-xs font-semibold text-ink-700 mb-2">추천 채널 믹스</p>
            <div className="flex items-center gap-2">
              {mix.length > 0 ? (
                mix.map((m) => (
                  <div key={m.channel} className={`flex-1 px-2 py-1.5 rounded-md ${channelBadgeClass(m.channel)}`}>
                    <p className="text-[11px] font-medium leading-tight">{m.channel}</p>
                    <p className="text-base font-bold tabular-nums leading-tight">{m.pct}%</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-500">매칭 거래처 없음</p>
              )}
            </div>
          </div>

          {/* 거래처 카드 */}
          <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
            {targetAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                <div className="text-3xl mb-2 opacity-40">🏪</div>
                <p className="text-sm text-ink-500">가격대 적합 거래처가 없습니다.</p>
              </div>
            ) : (
              targetAccounts.map((acc, idx) => {
                const bottles = estimatedBottles(selectedRec, acc);
                const revMan = Math.round((bottles * selectedRec.priceWholesale) / 10000);
                return (
                  <div key={acc.id} className="rounded-xl border border-line bg-surface p-3 hover:border-brand-primary/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs text-ink-300 font-mono shrink-0">#{idx + 1}</span>
                        <p className="text-sm text-ink-900 font-medium truncate">{acc.name}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${channelBadgeClass(acc.channel)}`}>
                        {acc.channel}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 mb-2">{acc.type} · {acc.location}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-brand-primaryLight/40 rounded-md px-2 py-1.5">
                        <p className="text-[10px] text-ink-500">예상 월 발주</p>
                        <p className="text-sm font-semibold text-brand-primary tabular-nums">{bottles}병</p>
                      </div>
                      <div className="bg-positive/10 rounded-md px-2 py-1.5">
                        <p className="text-[10px] text-ink-500">매출 기여</p>
                        <p className="text-sm font-semibold text-positive tabular-nums">{revMan}만원</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 하단: Swap 종합 효과 + 실행 시뮬레이션         */}
      {/* ============================================ */}
      <div className="surface px-5 py-4 border-l-4 border-positive shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden>📈</span>
            <div>
              <p className="text-xs font-semibold text-positive uppercase tracking-wider mb-0.5">
                이 swap을 실행하면
              </p>
              <p className="text-sm text-ink-700">
                위기 SKU {riskWine.name.split(" ")[0]} 정리 + 추천 3종 전환의 종합 효과
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-[11px] text-ink-500 mb-0.5">재고 회수</p>
              <p className="text-xl font-bold text-positive tabular-nums">{recoveredMan}만원</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-ink-500 mb-0.5">월 추가 매출</p>
              <p className="text-xl font-bold text-positive tabular-nums">+{monthlyRevGainMan}만원</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-ink-500 mb-0.5">재고보유일수</p>
              <p className="text-sm text-ink-500 tabular-nums">
                <span className="line-through">{stockDaysBefore}일</span>
                <span className="text-positive font-bold text-xl ml-1">{stockDaysAfter}일</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-ink-500 mb-0.5">Long Tail 소진율</p>
              <p className="text-sm text-ink-500 tabular-nums">
                <span className="line-through">{ltBefore}%</span>
                <span className="text-warning font-bold text-xl ml-1">{ltAfter}%</span>
              </p>
            </div>

            <button
              onClick={handleExecute}
              disabled={executed}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                executed
                  ? "bg-positive/15 text-positive border border-positive/30 cursor-default"
                  : "bg-brand-primary text-white hover:bg-brand-primaryDark shadow-sm"
              }`}
            >
              {executed ? "✓ 시뮬레이션 실행됨" : "실행 시뮬레이션"}
            </button>
          </div>
        </div>

        {/* 실행 결과 토스트 (인라인) */}
        {executed && (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="flex items-start gap-2 text-xs">
              <span className="text-positive shrink-0">✓</span>
              <div className="flex-1 text-ink-700">
                <span className="font-semibold text-positive">시뮬레이션 결과:</span>{" "}
                {targetAccounts.length}개 거래처에 추천 {replacements.length}종 푸시 시 90일 내{" "}
                <span className="font-semibold text-positive tabular-nums">재고 {recoveredMan}만원 회수</span>,{" "}
                <span className="font-semibold text-positive tabular-nums">월 매출 +{monthlyRevGainMan}만원</span>,{" "}
                회전율 <span className="tabular-nums">{(360 / stockDaysAfter).toFixed(1)}회/년</span>으로 개선 예상.
                액션 실행은 영업1팀 승인 단계로 이관됩니다.
              </div>
            </div>
          </div>
        )}

        {/* 보조 인사이트 — 마진 비교 미니바 */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-3 border-t border-line/60">
          <ScoreBar label="위기 SKU 마진" value={Math.round(riskWine.margin * 100)} />
          <ScoreBar label="추천 평균 마진" value={Math.round((replacements.reduce((a, w) => a + w.margin, 0) / replacements.length) * 100)} />
          <ScoreBar label="추천 평균 회전속도(병/월)" value={Math.min(100, Math.round(replacements.reduce((a, w) => a + w.monthlyVelocity, 0) / replacements.length))} />
        </div>
      </div>
    </div>
  );
}
