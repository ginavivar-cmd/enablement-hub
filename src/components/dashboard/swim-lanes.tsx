"use client";

const TYPE_DOT_COLORS: Record<string, string> = {
  Async: "#3B82F6",
  Live: "#10B981",
  Certification: "#F59E0B",
};

interface Enablement {
  id: string;
  title: string | null;
  type: string | null;
  owner: string | null;
  status: string;
}

interface SwimLanesProps {
  enablements: Enablement[];
}

interface LaneConfig {
  title: string;
  subtitle: string;
  color: string;
  filter: (e: Enablement) => boolean;
}

const LANES: LaneConfig[] = [
  {
    title: "What We've Done",
    subtitle: "Completed and delivered enablements",
    color: "border-t-green-600",
    filter: (e) => e.status === "completed",
  },
  {
    title: "What's Happening",
    subtitle: "Currently accepted or scheduled",
    color: "border-t-blue-500",
    filter: (e) => e.status === "accepted" || e.status === "scheduled",
  },
  {
    title: "What's Coming",
    subtitle: "Submitted or suggested — in the pipeline",
    color: "border-t-purple-500",
    filter: (e) => e.status === "submitted" || e.status === "suggested",
  },
];

function LaneItem({ item }: { item: Enablement }) {
  const dotColor = TYPE_DOT_COLORS[item.type || ""] || "#737373";

  return (
    <div className="flex items-start gap-2 py-2 border-b border-[#f0f0f0] last:border-b-0">
      <span
        className="mt-1.5 inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#1a1a1a] truncate">
          {item.title || "Untitled"}
        </p>
        {item.owner && (
          <p className="text-xs text-[#aaa]">{item.owner}</p>
        )}
      </div>
    </div>
  );
}

export function SwimLanes({ enablements }: SwimLanesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {LANES.map((lane) => {
        const items = enablements.filter(lane.filter);
        return (
          <div
            key={lane.title}
            className={`rounded-lg bg-white border border-[#e5e5e5] shadow-sm border-t-4 ${lane.color}`}
          >
            <div className="px-4 py-3 border-b border-[#e5e5e5]">
              <h3 className="text-sm font-bold text-[#1a1a1a]">
                {lane.title}
                <span className="ml-2 font-normal text-[#aaa]">
                  ({items.length})
                </span>
              </h3>
              <p className="text-xs text-[#aaa] mt-0.5">{lane.subtitle}</p>
            </div>
            <div className="px-4 max-h-64 overflow-y-auto">
              {items.length > 0 ? (
                items.map((item) => <LaneItem key={item.id} item={item} />)
              ) : (
                <p className="py-4 text-sm text-[#aaa] text-center">
                  No items
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
