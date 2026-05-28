"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
} from "recharts";

const SALES_DATA = [
  { month: "24.09", revenue: 3780 },
  { month: "24.10", revenue: 4120 },
  { month: "24.11", revenue: 3950 },
  { month: "24.12", revenue: 4380 },
  { month: "25.01", revenue: 4050 },
  { month: "25.02", revenue: 4000 },
  { month: "25.03", revenue: 3200 }, // -20% 급락
];

interface SalesChartProps {
  data?: { month: string; revenue: number }[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const chartData =
    data && data.length > 0
      ? data.map((d) => ({
          month: d.month.replace("2024-", "24.").replace("2025-", "25."),
          revenue: Math.round(d.revenue / 10000),
        }))
      : SALES_DATA;

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-ink-500">최근 7개월</span>
        <span className="text-xs text-ink-500">(단위: 만원)</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 32, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e5de" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#6f6760", fontSize: 11 }}
            axisLine={{ stroke: "#d4cfc4" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${v.toLocaleString()}`}
            tick={{ fill: "#6f6760", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #d4cfc4",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(26,20,16,0.08)",
            }}
            labelStyle={{ color: "#1a1410", fontWeight: "600", marginBottom: "4px" }}
            itemStyle={{ color: "#9a253c" }}
            formatter={(value: number) => [`${value.toLocaleString()}만원`, "매출"]}
          />
          {/* 2025-03 급락 라인 */}
          <ReferenceLine x="25.03" stroke="#c7373b" strokeDasharray="4 2" strokeOpacity={0.7}>
            <Label
              value="거래처 3곳 폐업 ▼"
              position="top"
              fill="#c7373b"
              fontSize={10}
              fontWeight={500}
            />
          </ReferenceLine>
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#9a253c"
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const isAlert = payload.month === "25.03";
              return (
                <circle
                  key={payload.month}
                  cx={cx}
                  cy={cy}
                  r={isAlert ? 6 : 3.5}
                  fill={isAlert ? "#c7373b" : "#9a253c"}
                  stroke={isAlert ? "#f5c7c9" : "#7d1e32"}
                  strokeWidth={isAlert ? 2 : 1.5}
                />
              );
            }}
            activeDot={{ r: 6, fill: "#9a253c", stroke: "#7d1e32", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
