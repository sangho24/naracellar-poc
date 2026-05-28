"use client";

import { useState, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type NodeStatus = "pending" | "running" | "complete" | "error";

interface AgentStep {
  node: "anomaly_detector" | "data_gatherer" | "root_cause_analyzer" | "action_recommender";
  status: NodeStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
}

interface Cause {
  depth: 1 | 2 | 3;
  text: string;
}

interface Action {
  id: string;
  title: string;
  desc: string;
  impact: string;
  confidence: number;
}

interface AnalysisStreamProps {
  alertId: string;
  onCausesReady?: (causes: Cause[]) => void;
  onActionsReady?: (actions: Action[]) => void;
}

const NODE_LABELS: Record<AgentStep["node"], string> = {
  anomaly_detector:    "🔍 이상 감지",
  data_gatherer:       "📊 데이터 수집",
  root_cause_analyzer: "🔬 원인 분석",
  action_recommender:  "💡 액션 추천",
};

const NODE_ORDER: AgentStep["node"][] = [
  "anomaly_detector",
  "data_gatherer",
  "root_cause_analyzer",
  "action_recommender",
];

function summarizeData(node: AgentStep["node"], data: Record<string, unknown>): string {
  if (node === "anomaly_detector") {
    const d = data as { z_score?: number; detail?: string };
    return d.detail ?? `z-score: ${d.z_score}`;
  }
  if (node === "data_gatherer") {
    const d = data as { neo4j_results?: { accounts?: number }; vector_results?: unknown[] };
    return `거래처 ${d.neo4j_results?.accounts ?? 0}곳, 유사 사례 ${d.vector_results?.length ?? 0}건`;
  }
  if (node === "root_cause_analyzer") {
    const d = data as { causes?: Cause[] };
    return `원인 ${d.causes?.length ?? 0}개 파악`;
  }
  if (node === "action_recommender") {
    const d = data as { actions?: Action[] };
    return `액션 ${d.actions?.length ?? 0}개 추천`;
  }
  return "";
}

export default function AnalysisStream({ alertId, onCausesReady, onActionsReady }: AnalysisStreamProps) {
  const [steps, setSteps] = useState<Partial<Record<AgentStep["node"], AgentStep>>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [currentNode, setCurrentNode] = useState<AgentStep["node"] | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [totalSec, setTotalSec] = useState<number | null>(null);
  const evtRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isRunning]);

  const startAnalysis = () => {
    if (evtRef.current) evtRef.current.close();

    setIsRunning(true);
    setIsDone(false);
    setSteps({});
    setCurrentNode("anomaly_detector");
    setStreamError(null);
    setElapsedSec(0);
    setTotalSec(null);
    startTimeRef.current = Date.now();

    const evtSource = new EventSource(`${API_BASE}/api/v1/analyze?alert_id=${alertId}`);
    evtRef.current = evtSource;

    evtSource.addEventListener("step", (e: MessageEvent) => {
      const step: AgentStep = JSON.parse(e.data);
      setCurrentNode(step.node);
      setSteps((prev) => ({ ...prev, [step.node]: step }));

      if (step.node === "root_cause_analyzer" && step.data && onCausesReady) {
        onCausesReady((step.data as { causes?: Cause[] }).causes ?? []);
      }
      if (step.node === "action_recommender" && step.data && onActionsReady) {
        onActionsReady((step.data as { actions?: Action[] }).actions ?? []);
      }
    });

    evtSource.addEventListener("done", () => {
      const elapsed = startTimeRef.current !== null ? (Date.now() - startTimeRef.current) / 1000 : 0;
      setTotalSec(Math.round(elapsed * 10) / 10);
      setIsRunning(false);
      setIsDone(true);
      setCurrentNode(null);
      evtSource.close();
    });

    evtSource.onerror = () => {
      setIsRunning(false);
      setCurrentNode(null);
      setStreamError("백엔드 연결 실패. 서버 확인 후 다시 시도하세요.");
      evtSource.close();
    };
  };

  const getNodeStatus = (node: AgentStep["node"]): NodeStatus => {
    const step = steps[node];
    if (step) return step.status;
    if (currentNode === node) return "running";
    return "pending";
  };

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-ink-900">Agent 분석 실행</h3>
        <button
          onClick={startAnalysis}
          disabled={isRunning}
          className="text-xs bg-brand-primary hover:bg-brand-primaryDark text-white disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 rounded-lg transition-colors font-medium"
        >
          {isRunning ? `분석 중... ${elapsedSec}s` : "Root Cause 분석 시작"}
        </button>
      </div>

      <ol className="space-y-3">
        {NODE_ORDER.map((node) => {
          const status = getNodeStatus(node);
          const step = steps[node];
          const isComplete = status === "complete";
          const isActive = status === "running";
          const isPending = status === "pending";

          return (
            <li
              key={node}
              className={`flex items-start gap-3 text-sm transition-opacity duration-300 ${isPending ? "opacity-40" : "opacity-100"}`}
            >
              {/* 상태 인디케이터 */}
              <div className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {isComplete && (
                  <span className="w-4 h-4 rounded-full bg-positive/15 border border-positive flex items-center justify-center">
                    <span className="text-positive text-[8px] font-bold">✓</span>
                  </span>
                )}
                {isActive && (
                  <span className="w-3 h-3 rounded-full bg-brand-primary animate-pulse" />
                )}
                {isPending && (
                  <span className="w-3 h-3 rounded-full border border-line-strong" />
                )}
                {status === "error" && (
                  <span className="w-3 h-3 rounded-full bg-danger" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className={isActive ? "text-brand-primary font-medium" : isComplete ? "text-ink-900" : "text-ink-500"}>
                  {NODE_LABELS[node]}
                </span>
                {step?.data && (
                  <p className="text-xs text-ink-500 mt-0.5 truncate">
                    {summarizeData(node, step.data)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {isDone && (
        <div className="mt-4 pt-4 border-t border-line flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-positive" />
          <p className="text-xs text-positive font-medium">
            분석 완료{totalSec !== null ? ` — 총 ${totalSec}s` : ""}
          </p>
        </div>
      )}
      {streamError && (
        <p className="mt-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          {streamError}
        </p>
      )}
    </div>
  );
}
