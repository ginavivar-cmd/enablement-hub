"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface Enablement {
  audience: string | null;
}

interface AudienceChartProps {
  enablements: Enablement[];
}

export function AudienceChart({ enablements }: AudienceChartProps) {
  const counts: Record<string, number> = {};
  for (const e of enablements) {
    if (!e.audience) continue;
    const audiences = e.audience.split(",").map((a) => a.trim());
    for (const a of audiences) {
      if (a) counts[a] = (counts[a] || 0) + 1;
    }
  }

  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[#aaa]">
        No audience data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={data.length * 36 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#737373" }} />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 11, fill: "#1a1a1a" }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="value" name="Enablements" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="#009b00" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
