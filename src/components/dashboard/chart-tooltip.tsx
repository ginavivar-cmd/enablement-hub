"use client";

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(String(label)) : label;

  return (
    <div className="rounded-lg bg-white border border-[#e5e5e5] shadow-sm px-3 py-2 text-xs">
      {displayLabel && (
        <p className="font-medium text-[#1a1a1a] mb-1">{displayLabel}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#737373]">{entry.name}:</span>
          <span className="font-medium text-[#1a1a1a]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
