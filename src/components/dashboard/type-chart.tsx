"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface Enablement {
  type: string | null;
}

interface TypeChartProps {
  enablements: Enablement[];
}

const TYPE_COLORS: Record<string, string> = {
  Async: "#3B82F6",
  Live: "#10B981",
  Certification: "#F59E0B",
};

export function TypeChart({ enablements }: TypeChartProps) {
  const counts: Record<string, number> = {};
  for (const e of enablements) {
    if (!e.type) continue;
    counts[e.type] = (counts[e.type] || 0) + 1;
  }

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[#aaa]">
        No type data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={45}
          outerRadius={70}
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || "#737373"} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
