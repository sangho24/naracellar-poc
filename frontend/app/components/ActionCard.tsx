"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Action {
  id: string;
  title: string;
  desc: string;
  impact: string;
  confidence: number;
}

interface SimulationResult {
  revenue_change_pct: number;
  target_accounts: number;
  estimated_cost: string;
  roi: number;
}

interface ActionCardProps {
  action: Action;
  onExecute?: () => void;
}

export default function ActionCard({ action, onExecute }: ActionCardProps) {
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/actions/${action.id}/execute`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSimResult(data.simulated_impact);
      onExecute?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "실행 실패");
    } finally {
      setIsExecuting(false);
    }
  };

  const confidencePct = Math.round(action.confidence * 100);
  const isHighConf = action.confidence >= 0.8;

  return (
    <div className="surface surface-hover p-5 transition-all">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <span className="text-[11px] text-brand-primary font-mono font-medium tracking-wider">{action.id}</span>
          <h3 className="text-sm font-semibold text-ink-900 mt-1 leading-snug">{action.title}</h3>
        </div>
      </div>

      <p className="text-sm text-ink-700 mb-2 leading-relaxed">{action.desc}</p>
      <p className="text-sm font-medium text-brand-accent mb-4">{action.impact}</p>

      {/* 신뢰도 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-ink-500">신뢰도</span>
          <span className={isHighConf ? "text-positive font-medium" : "text-warning font-medium"}>
            {confidencePct}%
          </span>
        </div>
        <div className="h-1 bg-ink-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isHighConf ? "bg-positive" : "bg-warning"}`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      {/* 시뮬레이션 결과 */}
      {simResult && (
        <div className="bg-positive/5 border border-positive/20 rounded-lg p-3.5 mb-4 space-y-1.5">
          <p className="text-xs text-ink-700 font-medium mb-2">시뮬레이션 결과</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div>
              <span className="text-ink-500">예상 매출 변화</span>
              <p className="text-positive font-bold text-sm">+{simResult.revenue_change_pct}%</p>
            </div>
            <div>
              <span className="text-ink-500">ROI</span>
              <p className="text-ink-900 font-semibold text-sm">{simResult.roi}x</p>
            </div>
            <div>
              <span className="text-ink-500">대상 거래처</span>
              <p className="text-ink-900">{simResult.target_accounts}곳</p>
            </div>
            <div>
              <span className="text-ink-500">예상 비용</span>
              <p className="text-ink-900">{simResult.estimated_cost}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <button
        onClick={handleExecute}
        disabled={isExecuting}
        className="w-full text-sm bg-brand-primary hover:bg-brand-primaryDark text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
      >
        {isExecuting && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {isExecuting ? "실행 중..." : simResult ? "재실행 (시뮬레이션)" : "실행 (시뮬레이션)"}
      </button>
    </div>
  );
}
