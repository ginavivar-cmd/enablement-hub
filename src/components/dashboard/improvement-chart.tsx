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
  improvementArea: string | null;
}

interface ImprovementChartProps {
  enablements: Enablement[];
}

const SHORT_LABELS: Record<string, string> = {
  "Build Foundational Knowledge & Role Readiness": "Foundational Knowledge",
  "Improve Pipeline / Stage Progression Speed": "Pipeline Progression",
  "Strengthen Technical Proficiency": "Technical Proficiency",
  "Optimize Resolution Rates & Channel Utilization": "Resolution & Channels",
  "Improve Customer Communication": "Customer Communication",
  "Increase Revenue / Business Impact": "Revenue Impact",
};

export function ImprovementChart({ enablements }: ImprovementChartProps) {
  const counts: Record<string, number> = {};
  const fullNames: Record<string, string> = {};

  for (const e of enablements) {
    if (!e.improvementArea) continue;
    const short = SHORT_LABELS[e.improvementArea] || e.improvementArea;
    counts[short] = (counts[short] || 0) + 1;
    fullNames[short] = e.improvementArea;
  }

  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value, fullName: fullNames[name] }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[#aaa]">
        No improvement area data
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
          width={150}
          tick={{ fontSize: 11, fill: "#1a1a1a" }}
        />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={(label) => fullNames[label] || label}
            />
          }
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar dataKey="value" name="Enablements" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="#3B82F6" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
