"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface Enablement {
  priority: string | null;
}

interface PriorityChartProps {
  enablements: Enablement[];
}

const PRIORITY_COLORS: Record<string, string> = {
  High: "#dc2626",
  Medium: "#f59e0b",
  Low: "#737373",
};

export function PriorityChart({ enablements }: PriorityChartProps) {
  const counts: Record<string, number> = {};
  for (const e of enablements) {
    if (!e.priority) continue;
    counts[e.priority] = (counts[e.priority] || 0) + 1;
  }

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[#aaa]">
        No priority data
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
            <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || "#737373"} />
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
