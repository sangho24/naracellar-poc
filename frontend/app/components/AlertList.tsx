"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Alert {
  id: string;
  region: string;
  channel: string;
  metric: string;
  change_pct: number;
  detected_at: string;
  status: "new" | "in_progress" | "resolved";
  detail?: string | null;  // 백엔드 정량 분석 메시지 (휴면 alert에 포함)
}

interface AlertListProps {
  onAlertClick: (alertId: string) => void;
}

const statusLabel: Record<Alert["status"], string> = {
  new: "신규",
  in_progress: "분석중",
  resolved: "해결됨",
};

const statusBadgeStyle: Record<Alert["status"], string> = {
  new: "bg-danger/10 text-danger border border-danger/20",
  in_progress: "bg-warning/10 text-warning border border-warning/20",
  resolved: "bg-positive/10 text-positive border border-positive/20",
};

export default function AlertList({ onAlertClick }: AlertListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = setTimeout(() => { didTimeout = true; controller.abort(); }, 5000);

    fetch(`${API_BASE}/api/v1/alerts`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Alert[]) => {
        setAlerts(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((e: Error) => {
        // Strict Mode cleanup abort는 무시
        if (e.name === "AbortError" && !didTimeout) return;
        if (e.name === "AbortError") setError("요청 시간 초과 (5초)");
        else setError(e.message);
        setIsLoading(false);
      })
      .finally(() => clearTimeout(timeoutId));

    return () => controller.abort();
  }, [retryCount]);

  if (isLoading) {
    return (
      <div className="surface p-6 text-center text-ink-500 text-sm">
        이상 감지 분석 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface p-5 text-center text-danger text-sm">
        <p>데이터 로드 실패: {error}</p>
        <button
          onClick={() => { setIsLoading(true); setError(null); setRetryCount((c) => c + 1); }}
          className="mt-3 text-xs bg-ink-100 hover:bg-line-strong text-ink-700 px-3 py-1.5 rounded-md transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden divide-y divide-line">
      {alerts.map((alert) => {
        const isDormant = alert.id.startsWith("ALT-DRM");
        return (
        <button
          key={alert.id}
          onClick={() => onAlertClick(alert.id)}
          className="w-full text-left px-5 py-4 hover:bg-brand-primaryLight/40 transition-colors group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* 펄스 인디케이터 — 휴면은 골드, 매출은 버건디 */}
              <span className="relative flex-shrink-0 w-2 h-2 mt-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${isDormant ? "bg-warning" : "bg-brand-primary"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isDormant ? "bg-warning" : "bg-brand-primary"}`} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-ink-300 tracking-wider">{alert.id}</span>
                  <span className="text-sm font-medium text-ink-900">
                    {alert.region} · {alert.channel} · {alert.metric}
                  </span>
                  <span className="text-danger font-bold text-sm tabular-nums">
                    {alert.change_pct}%
                  </span>
                </div>
                {alert.detail && (
                  <p className="text-[11px] text-ink-700 mt-1 leading-relaxed">
                    {alert.detail}
                  </p>
                )}
                <p className="text-[10px] text-ink-500 mt-1">{alert.detected_at}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBadgeStyle[alert.status]}`}>
                {statusLabel[alert.status]}
              </span>
              <span className="text-ink-300 group-hover:text-brand-primary transition-colors text-xs">→</span>
            </div>
          </div>
        </button>
        );
      })}
      {alerts.length === 0 && (
        <p className="px-5 py-8 text-center text-ink-500 text-sm">
          이상 감지된 항목이 없습니다.
        </p>
      )}
    </div>
  );
}
