"use client";

import { useEffect, useState } from "react";

type Trend = "up" | "down" | "neutral";

interface KpiCardProps {
  icon: string;
  title: string;
  value: string;
  change: string;
  trend: Trend;
}

// up = 부정적 지표 상승(빨강) / down = 긍정적 하락(초록) / neutral = 보류(앰버)
const trendConfig: Record<Trend, { color: string; bgColor: string; icon: string }> = {
  up:      { color: "text-danger",   bgColor: "bg-danger/10",   icon: "↑" },
  down:    { color: "text-positive", bgColor: "bg-positive/10", icon: "↓" },
  neutral: { color: "text-warning",  bgColor: "bg-warning/10",  icon: "→" },
};

function parseValue(value: string): { num: number; suffix: string } | null {
  if (!value || value === "---") return null;
  const match = value.match(/^([\d.]+)(.*)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  return { num, suffix: match[2] };
}

export default function KpiCard({ icon, title, value, change, trend }: KpiCardProps) {
  const { color, bgColor, icon: trendIcon } = trendConfig[trend];
  const parsed = parseValue(value);
  const [displayNum, setDisplayNum] = useState<number>(0);

  useEffect(() => {
    if (!parsed) return;
    const target = parsed.num;
    const startTime = performance.now();
    const duration = 600;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayNum(Math.round(target * eased * 10) / 10);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const displayValue = parsed
    ? `${Number.isInteger(parsed.num) ? Math.round(displayNum) : displayNum.toFixed(1)}${parsed.suffix}`
    : value;

  return (
    <div className="surface surface-hover p-5 transition-all">
      {/* 아이콘 + 제목 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">{icon}</span>
        <p className="text-xs text-ink-500 font-medium tracking-tight">{title}</p>
      </div>

      {/* 값 */}
      <p className="text-2xl font-bold text-ink-900 tabular-nums leading-none mb-3">
        {displayValue}
      </p>

      {/* 변화량 배지 */}
      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${color} ${bgColor}`}>
        {trendIcon} {change}
      </span>
    </div>
  );
}
