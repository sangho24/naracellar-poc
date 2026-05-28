"use client";

import { useEffect, useState, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface GraphNode {
  id: string;
  label: string;
  type: "region" | "account" | "sku" | "brand";
  status?: "closed";
}

interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface NodePos {
  x: number;
  y: number;
}

interface KnowledgeGraphProps {
  entityId: string;
  compact?: boolean;
}

// 나라셀라 브랜드 톤에 맞춘 노드 컬러
const NODE_COLOR: Record<GraphNode["type"], string> = {
  region:  "#9a253c",  // 버건디 — 중심 지역
  account: "#b89a65",  // 골드 — 거래처
  sku:     "#5e8c7d",  // 머스크 그린 — SKU
  brand:   "#3d342d",  // 다크 브라운 — 브랜드
};

const TYPE_LABEL: Record<GraphNode["type"], string> = {
  region:  "지역",
  account: "거래처",
  sku:     "SKU",
  brand:   "브랜드",
};

function computePositions(nodes: GraphNode[], cx: number, cy: number, scale: number): Record<string, NodePos> {
  const byType: Record<string, GraphNode[]> = { region: [], account: [], sku: [], brand: [] };
  nodes.forEach((n) => byType[n.type].push(n));

  const positions: Record<string, NodePos> = {};
  byType.region.forEach((n) => { positions[n.id] = { x: cx, y: cy }; });

  const radii = { account: 120 * scale, sku: 200 * scale, brand: 270 * scale };

  (["account", "sku", "brand"] as const).forEach((type) => {
    byType[type].forEach((n, i) => {
      const total = byType[type].length;
      const angle = (2 * Math.PI * i) / total - Math.PI / 2;
      positions[n.id] = {
        x: cx + radii[type] * Math.cos(angle),
        y: cy + radii[type] * Math.sin(angle),
      };
    });
  });

  return positions;
}

function edgePoints(from: NodePos, to: NodePos, r: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x1: from.x + (dx / len) * r,
    y1: from.y + (dy / len) * r,
    x2: to.x  - (dx / len) * r,
    y2: to.y  - (dy / len) * r,
  };
}

export default function KnowledgeGraph({ entityId, compact = false }: KnowledgeGraphProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();

    let didTimeout = false;
    const timeoutHandle = setTimeout(() => { didTimeout = true; controller.abort(); }, 15000);

    fetch(`${API_BASE}/api/v1/graph/${entityId}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GraphData) => { setGraphData(data); setIsLoading(false); })
      .catch((e: Error) => {
        // Strict Mode cleanup으로 인한 abort는 무시 (다음 effect가 처리)
        if (e.name === "AbortError" && !didTimeout) return;
        if (e.name === "AbortError") setError("백엔드 응답 없음 — 15초 타임아웃");
        else setError(e.message);
        setIsLoading(false);
      })
      .finally(() => clearTimeout(timeoutHandle));

    return () => controller.abort();
  }, [entityId, retryCount]);

  const height = compact ? 220 : 600;
  const svgWidth = 600;
  const cx = svgWidth / 2;
  const cy = height / 2;
  const scale = compact ? 0.55 : 0.9;
  const nodeR = compact ? 10 : 14;
  const fontSize = compact ? 9 : 11;

  const positions = graphData ? computePositions(graphData.nodes, cx, cy, scale) : {};

  return (
    <div className="surface p-5">
      {!compact && (
        <h3 className="text-sm font-semibold text-ink-900 mb-4">
          Knowledge Graph — {entityId}
        </h3>
      )}

      {/* 범례 */}
      <div className="flex gap-3 mb-3 flex-wrap">
        {(Object.entries(NODE_COLOR) as [GraphNode["type"], string][]).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-ink-500">
            <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {TYPE_LABEL[type]}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-ink-500">
          <span className="inline-block w-2 h-2 rounded-full border border-dashed border-danger flex-shrink-0" />
          폐업
        </span>
      </div>

      {/* 에러 상태 */}
      {error && (
        <div className="border border-danger/30 bg-danger/5 rounded-lg p-4 text-center text-sm text-danger mb-3">
          <p className="font-medium mb-1">그래프 로드 실패</p>
          <p className="text-xs text-danger/70 mb-3">{error}</p>
          <button
            onClick={() => { setError(null); setRetryCount((c) => c + 1); }}
            className="text-xs bg-ink-100 hover:bg-line-strong text-ink-700 px-3 py-1.5 rounded-md transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* SVG 캔버스 */}
      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="bg-canvas rounded-lg border border-line"
          aria-label="Knowledge Graph 시각화"
        >
          {/* 로딩 스켈레톤 — 펄스 원 3개 */}
          {isLoading && (
            <g>
              <circle cx={cx} cy={cy} r={16} fill="#e8e5de" className="animate-pulse" />
              <circle cx={cx - 100} cy={cy} r={12} fill="#e8e5de" className="animate-pulse" style={{ animationDelay: "0.2s" }} />
              <circle cx={cx + 100} cy={cy} r={12} fill="#e8e5de" className="animate-pulse" style={{ animationDelay: "0.4s" }} />
              <text x="50%" y={cy + 50} textAnchor="middle" fill="#a8a29e" fontSize="11">
                그래프 데이터 로딩 중...
              </text>
            </g>
          )}

          {graphData && (
            <>
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#a8a29e" />
                </marker>
              </defs>

              {/* 엣지 */}
              {graphData.edges.map((edge, i) => {
                const from = positions[edge.from];
                const to = positions[edge.to];
                if (!from || !to) return null;
                const { x1, y1, x2, y2 } = edgePoints(from, to, nodeR);
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2 - 4;
                const tw = edge.relation.length * 6 + 8;
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d4cfc4" strokeWidth={1.5} markerEnd="url(#arrow)" />
                    {!compact && (
                      <g>
                        <rect x={mx - tw / 2} y={my - 10} width={tw} height={12} rx={2} fill="#ffffff" fillOpacity={0.95} stroke="#e8e5de" strokeWidth={0.5} />
                        <text x={mx} y={my} textAnchor="middle" fill="#6f6760" fontSize={9}>{edge.relation}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 노드 */}
              {graphData.nodes.map((node) => {
                const pos = positions[node.id];
                if (!pos) return null;
                const isClosed = node.status === "closed";
                const color = NODE_COLOR[node.type];

                return (
                  <g
                    key={node.id}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => {
                      const tipY = pos.y < cy / 2 ? pos.y + nodeR + 24 : pos.y - nodeR - 8;
                      setTooltip({ label: node.label, x: pos.x, y: tipY });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {isClosed && (
                      <circle cx={pos.x} cy={pos.y} r={nodeR + 5} fill="none" stroke="#c7373b" strokeWidth={1.5} strokeDasharray="4 2" />
                    )}
                    <circle cx={pos.x} cy={pos.y} r={nodeR} fill={color} fillOpacity={isClosed ? 0.3 : 0.92} stroke={color} strokeWidth={1.5} />
                    {isClosed && (
                      <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#c7373b" fontSize={nodeR + 2} fontWeight="bold">✕</text>
                    )}
                    <text x={pos.x} y={pos.y + nodeR + fontSize + 2} textAnchor="middle" fill={isClosed ? "#a8a29e" : "#1a1410"} fontSize={fontSize} fontWeight={500}>
                      {node.label.length > 7 ? node.label.slice(0, 6) + "…" : node.label}
                    </text>
                    {isClosed && (
                      <text x={pos.x} y={pos.y + nodeR + fontSize + 14} textAnchor="middle" fill="#c7373b" fontSize={8}>폐업</text>
                    )}
                  </g>
                );
              })}

              {/* 툴팁 */}
              {tooltip && (() => {
                const tipW = Math.max(80, tooltip.label.length * 7 + 16);
                const tipX = Math.min(Math.max(tooltip.x, tipW / 2 + 4), svgWidth - tipW / 2 - 4);
                return (
                  <g>
                    <rect x={tipX - tipW / 2} y={tooltip.y - 16} width={tipW} height={20} rx={4} fill="#1a1410" />
                    <text x={tipX} y={tooltip.y - 2} textAnchor="middle" fill="#faf9f6" fontSize={10}>{tooltip.label}</text>
                  </g>
                );
              })()}
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
