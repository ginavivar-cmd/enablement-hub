"use client";

interface Enablement {
  status: string;
}

interface StatCardsProps {
  enablements: Enablement[];
}

const CARDS = [
  {
    label: "Completed Enablements",
    description: "Delivered and finished",
    border: "border-l-green-600",
    filter: (e: Enablement) => e.status === "completed",
  },
  {
    label: "In Progress Enablements",
    description: "Accepted or currently scheduled",
    border: "border-l-blue-500",
    filter: (e: Enablement) =>
      e.status === "accepted" || e.status === "scheduled",
  },
  {
    label: "Planned Enablements",
    description: "Submitted or suggested for review",
    border: "border-l-purple-500",
    filter: (e: Enablement) =>
      e.status === "submitted" || e.status === "suggested",
  },
  {
    label: "On Hold Enablements",
    description: "Paused for later review",
    border: "border-l-amber-500",
    filter: (e: Enablement) => e.status === "hold",
  },
  {
    label: "Archived Enablements",
    description: "Deprioritized or no longer needed",
    border: "border-l-red-600",
    filter: (e: Enablement) => e.status === "deprioritized",
  },
];

export function StatCards({ enablements }: StatCardsProps) {
  const total = enablements.length;
  const completedCount = enablements.filter(
    (e) => e.status === "completed"
  ).length;
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {CARDS.map((card) => {
        const count = enablements.filter(card.filter).length;
        const isCompleted = card.label === "Completed Enablements";

        return (
          <div
            key={card.label}
            className={`rounded-lg bg-white border border-[#e5e5e5] shadow-sm border-l-4 ${card.border} p-4`}
          >
            <p className="text-2xl font-bold text-[#1a1a1a]">{count}</p>
            <p className="text-xs font-medium text-[#737373] mt-1">
              {card.label}
            </p>
            <p className="text-[11px] text-[#aaa] mt-0.5">
              {card.description}
            </p>
            {isCompleted && (
              <p className="text-xs text-[#aaa] mt-1">
                {completionRate}% completion rate
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
