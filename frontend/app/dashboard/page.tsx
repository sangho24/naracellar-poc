"use client";

import { useState, useEffect } from "react";
import KpiCard from "../components/KpiCard";
import SalesChart from "../components/SalesChart";
import AlertList from "../components/AlertList";
import AnalysisStream from "../components/AnalysisStream";
import CauseTree from "../components/CauseTree";
import ActionCard from "../components/ActionCard";
import KnowledgeGraph from "../components/KnowledgeGraph";
import WineMatchingDemo from "../components/WineMatchingDemo";
import WhatIfSimulator from "../components/WhatIfSimulator";

// Vercel 단일 배포 — 상대 경로로 자체 Route Handlers 호출 (/api/v1/...)
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type Tab = "today" | "diagnosis" | "action";
type ActionMode = "wine-match" | "what-if";

interface Cause { depth: 1 | 2 | 3; text: string; }
interface Action { id: string; title: string; desc: string; impact: string; confidence: number; }

interface KpiData {
  inventory_days: number;
  inventory_days_change: string;
  overdue_rate: number;
  overdue_amount: string;
  fx_exposure: number;
  fx_impact: string;
  longtail_rate: number;
  longtail_change: string;
  sales_trend?: { month: string; revenue: number }[];
}

const TAB_META: Record<Tab, { num: string; label: string; question: string }> = {
  today:     { num: "01", label: "Today",    question: "지금 무슨 일이 일어나고 있는가" },
  diagnosis: { num: "02", label: "AI 진단",  question: "왜 이런 일이 발생했는가" },
  action:    { num: "03", label: "Action",   question: "그래서 어떻게 대응할 것인가" },
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(new Set<Tab>(["today"]));
  const [actionMode, setActionMode] = useState<ActionMode>("what-if");
  const [selectedAlertId, setSelectedAlertId] = useState<string>("ALT-001");
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [causes, setCauses] = useState<Cause[]>([]);
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/kpi`)
      .then((r) => r.json())
      .then((data: KpiData) => setKpi(data))
      .catch(() => {
        setKpi({
          inventory_days: 348, inventory_days_change: "+133일 vs 2022",
          overdue_rate: 18.6, overdue_amount: "25.4억",
          fx_exposure: 73, fx_impact: "5% 변동시 3.6억",
          longtail_rate: 12, longtail_change: "-3% vs 전월",
        });
      });
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      const next = new Set<Tab>(prev);
      next.add(tab);
      return next;
    });
  };

  const handleAlertClick = (alertId: string) => {
    setSelectedAlertId(alertId);
    setCauses([]);
    setActions([]);
    handleTabChange("diagnosis");
  };

  const tabs: Tab[] = ["today", "diagnosis", "action"];

  return (
    <div>
      {/* 탭 네비게이션 — 3단계 스토리 */}
      <nav className="mb-8">
        <div className="flex items-stretch border-b border-line">
          {tabs.map((tab) => {
            const meta = TAB_META[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 px-5 py-3 text-left transition-colors -mb-px border-b-2 group ${
                  isActive
                    ? "border-brand-primary"
                    : "border-transparent hover:border-line-strong"
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className={`text-[10px] font-mono tracking-wider ${isActive ? "text-brand-primary" : "text-ink-300"}`}>
                    {meta.num}
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? "text-brand-primary" : "text-ink-500 group-hover:text-ink-900"}`}>
                    {meta.label}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 leading-tight ${isActive ? "text-ink-700" : "text-ink-300"}`}>
                  {meta.question}
                </p>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─────────────────────────── Today 탭 ─────────────────────────── */}
      <div className={activeTab === "today" ? "block" : "hidden"}>
        <div className="space-y-6">
          <CashFlowBanner />

          {/* KPI 4개 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon="📦" title="재고보유일수"
              value={kpi ? `${kpi.inventory_days}일` : "---"}
              change={kpi?.inventory_days_change ?? ""} trend="up" />
            <KpiCard icon="💳" title="매출채권 연체율"
              value={kpi ? `${kpi.overdue_rate.toFixed(1)}%` : "---"}
              change={kpi?.overdue_amount ?? ""} trend="up" />
            <KpiCard icon="💱" title="환리스크 노출"
              value={kpi ? `${kpi.fx_exposure}억` : "---"}
              change={kpi?.fx_impact ?? ""} trend="neutral" />
            <KpiCard icon="📈" title="Long Tail 소진율"
              value={kpi ? `${kpi.longtail_rate.toFixed(1)}%` : "---"}
              change={kpi?.longtail_change ?? ""}
              trend={(() => {
                const c = kpi?.longtail_change ?? "";
                if (!c || c.startsWith("+0.0") || c.startsWith("0.0")) return "neutral";
                if (c.startsWith("+")) return "down";
                return "up";
              })()} />
          </div>

          {/* Sales + Alert 2단 */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <SectionHeader>강남 도매 채널 매출 추이</SectionHeader>
              <SalesChart data={kpi?.sales_trend} />
            </div>
            <div className="lg:col-span-2">
              <SectionHeader>
                이상 감지 알림
                <span className="ml-auto text-[10px] text-ink-500 font-normal">클릭 → AI 진단</span>
              </SectionHeader>
              <AlertList onAlertClick={handleAlertClick} />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────── AI 진단 탭 ─────────────────────────── */}
      <div className={activeTab === "diagnosis" ? "block" : "hidden"}>
        <div className="space-y-4">
          {/* 상단 — 선택된 알림 컨텍스트 */}
          <div className="surface px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              <span className="text-xs text-ink-500">선택된 알림:</span>
              <span className="text-sm font-semibold text-ink-900 font-mono">{selectedAlertId}</span>
              <span className="text-xs text-ink-700">강남 도매 매출 -20%</span>
            </div>
            <span className="text-[10px] text-ink-500">
              LangGraph · 4 노드 워크플로우
            </span>
          </div>

          {/* 좌측: Agent 실행 스트리밍 / Cause Tree │ 우측: KG + 액션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <AnalysisStream alertId={selectedAlertId} onCausesReady={setCauses} onActionsReady={setActions} />
              <CauseTree causes={causes} />
            </div>
            <div className="space-y-4">
              {visitedTabs.has("diagnosis") && (
                <KnowledgeGraph entityId="gangnam-wholesale" compact />
              )}
              {actions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold px-1">
                    추천 액션 ({actions.length})
                  </p>
                  {actions.map((action) => <ActionCard key={action.id} action={action} />)}
                </div>
              ) : (
                <div className="surface p-5 text-center text-ink-500 text-sm">
                  좌측에서 분석을 실행하면 추천 액션이 여기 표시됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────── Action 탭 ─────────────────────────── */}
      <div className={activeTab === "action" ? "block" : "hidden"}>
        <div className="space-y-4">
          {/* 모드 토글 — 와인 매칭 vs What-If */}
          <div className="flex items-center justify-between">
            <div className="inline-flex border border-line rounded-lg p-0.5 bg-surface">
              <button
                onClick={() => setActionMode("what-if")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  actionMode === "what-if"
                    ? "bg-brand-primary text-white"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                정량 시뮬레이션
              </button>
              <button
                onClick={() => setActionMode("wine-match")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  actionMode === "wine-match"
                    ? "bg-brand-primary text-white"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                와인 매칭 추천
              </button>
            </div>
            <p className="text-[11px] text-ink-500">
              {actionMode === "what-if"
                ? "4개 슬라이더 · AI 자동 추천 · 영업이익 워터폴"
                : "거래처 × SKU 매칭 · Long Tail 우선순위"}
            </p>
          </div>

          {/* 모드별 본문 */}
          {visitedTabs.has("action") && actionMode === "what-if" && (
            <WhatIfSimulator onGoToAction={() => setActionMode("wine-match")} />
          )}
          {visitedTabs.has("action") && actionMode === "wine-match" && <WineMatchingDemo />}
        </div>
      </div>
    </div>
  );
}

// ─── 섹션 헤더 ────────────────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-1 h-4 bg-brand-primary rounded-sm flex-shrink-0" />
      <h2 className="text-[13px] font-semibold text-ink-900 tracking-tight uppercase flex items-center w-full">
        {children}
      </h2>
    </div>
  );
}

// ─── Cash Flow 압축 배너 — Today 상단 ──────────────────────────────────────
function CashFlowBanner() {
  return (
    <div className="surface p-5 bg-gradient-to-br from-brand-primaryLight/40 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-brand-primary font-semibold">Cash Flow Snapshot</span>
        <span className="text-[10px] text-ink-300">·</span>
        <span className="text-[10px] text-ink-500">DART 2025.3Q</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 핵심 메시지 */}
        <div className="lg:col-span-1">
          <p className="text-base font-bold text-ink-900 leading-tight">
            부채 <span className="text-brand-primary tabular-nums">316억</span>
          </p>
          <p className="text-base font-bold text-ink-900 leading-tight mt-0.5">
            <span className="text-ink-300 text-xs">vs</span> 현금 <span className="tabular-nums">44억</span>
          </p>
          <p className="text-[11px] text-ink-500 mt-1.5">7배 차이 · 이자 연 16억</p>
        </div>

        {/* 보조 3개 */}
        <BannerMini label="재고 자본 묶임" value="348일" sub="2022→+133일" tone="danger" />
        <BannerMini label="환리스크 노출" value="73억" sub="5% 변동시 3.6억" tone="warning" />
        <BannerMini label="매출채권 연체" value="25.4억" sub="대손 매년 +2억" tone="warning" />
      </div>
    </div>
  );
}

function BannerMini({
  label, value, sub, tone,
}: { label: string; value: string; sub: string; tone: "danger" | "warning" }) {
  const toneColor = tone === "danger" ? "text-danger" : "text-warning";
  return (
    <div className="border-l-2 border-line pl-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`text-base font-bold tabular-nums mt-0.5 ${toneColor}`}>{value}</p>
      <p className="text-[10px] text-ink-500 mt-0.5">{sub}</p>
    </div>
  );
}
