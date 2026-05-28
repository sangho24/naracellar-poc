"use client";

import { useEffect, useState } from "react";

interface Cause {
  depth: 1 | 2 | 3;
  text: string;
}

interface CauseTreeProps {
  causes: Cause[];
}

const depthConfig: Record<number, { textClass: string; indent: string; prefix: string }> = {
  1: { textClass: "text-brand-primary font-semibold text-sm",          indent: "",      prefix: "■" },
  2: { textClass: "text-ink-900 text-sm",                              indent: "ml-5",  prefix: "▸" },
  3: { textClass: "text-ink-500 text-xs",                              indent: "ml-10", prefix: "·" },
};

function CauseItem({ cause, index }: { cause: Cause; index: number }) {
  const [visible, setVisible] = useState(false);
  const { textClass, indent, prefix } = depthConfig[cause.depth];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 120);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <li
      className={`flex gap-2 ${indent} ${textClass} transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      <span className="shrink-0 mt-0.5">{prefix}</span>
      <span className="leading-relaxed">{cause.text}</span>
    </li>
  );
}

export default function CauseTree({ causes }: CauseTreeProps) {
  return (
    <div className="surface p-5">
      <h3 className="text-sm font-semibold text-ink-900 mb-4">원인 분석 트리</h3>

      {causes.length === 0 ? (
        <p className="text-ink-500 text-sm">분석 완료 후 원인 트리가 여기에 표시됩니다.</p>
      ) : (
        <ul className="space-y-2">
          {causes.map((cause, idx) => (
            <CauseItem key={idx} cause={cause} index={idx} />
          ))}
        </ul>
      )}
    </div>
  );
}
