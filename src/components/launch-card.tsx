"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRACKS } from "@/lib/programming-tracks";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";

interface Activity {
  id: string;
  name: string;
  team: string;
  type: string;
  category: string | null;
  owner: string | null;
  completed: boolean | null;
  assetUrl: string | null;
}

interface LaunchCardProps {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  status: string;
  targetDate: string | null;
  notionBriefUrl: string | null;
  planningDocUrl: string | null;
  goal: string | null;
  tracks: string[];
  activities: Activity[];
  onAction?: () => void;
}

const TIER_BADGES: Record<string, string> = {
  small: "bg-slate-50 text-slate-600",
  medium: "bg-amber-50 text-amber-700",
  large_xl: "bg-purple-50 text-purple-700",
};

const TIER_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large_xl: "Large/XL",
};

const STATUS_BADGES: Record<string, string> = {
  planning: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  shipped: "bg-green-50 text-green-700",
  archived: "bg-slate-50 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  shipped: "Shipped",
  archived: "Archived",
};

const TRACK_COLORS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  pink: "bg-pink-50 text-pink-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  orange: "bg-orange-50 text-orange-700",
  purple: "bg-purple-50 text-purple-700",
  slate: "bg-slate-50 text-slate-600",
};

export function LaunchCard({
  id,
  name,
  description,
  tier,
  status,
  targetDate,
  notionBriefUrl,
  planningDocUrl,
  goal,
  tracks,
  activities,
  onAction,
}: LaunchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const eduActivities = activities.filter((a) => a.team === "education");
  const enbActivities = activities.filter((a) => a.team === "enablement");
  const completedCount = activities.filter((a) => a.completed).length;
  const totalCount = activities.length;

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      await fetch(`/api/launches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onAction?.();
    } finally {
      setUpdating(false);
    }
  }

  async function toggleActivity(actId: string, completed: boolean) {
    try {
      await fetch(`/api/launches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // we need a separate activity endpoint
      });
    } catch {
      // activity toggle needs its own endpoint - for now just reload
    }
  }

  async function deleteLaunch() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/launches/${id}`, { method: "DELETE" });
      onAction?.();
    } catch {
      // silently fail
    }
  }

  return (
    <div className="rounded-lg bg-white border border-[#e5e5e5] shadow-sm overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#fafafa] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-sm font-semibold text-[#1a1a1a] truncate">{name}</h3>
          <Badge variant="secondary" className={`${TIER_BADGES[tier] || ""} border-0 text-xs shrink-0`}>
            {TIER_LABELS[tier] || tier}
          </Badge>
          <Badge variant="secondary" className={`${STATUS_BADGES[status] || ""} border-0 text-xs shrink-0`}>
            {STATUS_LABELS[status] || status}
          </Badge>
          {tracks.map((code) => {
            const track = TRACKS[code as keyof typeof TRACKS];
            const color = track ? TRACK_COLORS[track.color] || TRACK_COLORS.slate : TRACK_COLORS.slate;
            return (
              <Badge key={code} variant="secondary" className={`${color} border-0 text-xs shrink-0`}>
                {code}
              </Badge>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {totalCount > 0 && (
            <span className="text-xs text-[#aaa]">
              {completedCount}/{totalCount} activities
            </span>
          )}
          {targetDate && (
            <span className="text-xs text-[#aaa]">
              {new Date(targetDate).toLocaleDateString()}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[#aaa]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#aaa]" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#e5e5e5] px-5 py-4 space-y-4">
          {/* Description + Goal */}
          {description && (
            <p className="text-sm text-[#737373]">{description}</p>
          )}
          {goal && (
            <div>
              <p className="text-xs font-semibold text-[#aaa] uppercase tracking-wide mb-1">Goal</p>
              <p className="text-sm text-[#1a1a1a]">{goal}</p>
            </div>
          )}

          {/* Links */}
          {(notionBriefUrl || planningDocUrl) && (
            <div className="flex gap-3">
              {notionBriefUrl && (
                <a
                  href={notionBriefUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gladly-green hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Notion Brief
                </a>
              )}
              {planningDocUrl && (
                <a
                  href={planningDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gladly-green hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Planning Doc
                </a>
              )}
            </div>
          )}

          {/* Activities by team */}
          {eduActivities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">
                Customer Education ({eduActivities.length})
              </p>
              <div className="space-y-1.5">
                {eduActivities.map((act) => (
                  <ActivityRow key={act.id} activity={act} />
                ))}
              </div>
            </div>
          )}

          {enbActivities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                Revenue Enablement ({enbActivities.length})
              </p>
              <div className="space-y-1.5">
                {enbActivities.map((act) => (
                  <ActivityRow key={act.id} activity={act} />
                ))}
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <p className="text-xs text-[#aaa]">No activities yet. Edit this launch to add activities.</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#f0f0f0]">
            <Select
              value={status}
              onValueChange={(v) => v && updateStatus(v)}
              disabled={updating}
            >
              <SelectTrigger className="w-[160px] border-[#e5e5e5] bg-white text-[#1a1a1a] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#e5e5e5] bg-white">
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="text-[#1a1a1a] text-xs focus:bg-[#f5f5f5]">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={deleteLaunch}
              className="text-[#aaa] hover:text-red-600 h-8 px-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {activity.completed ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-gladly-green shrink-0" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-[#ccc] shrink-0" />
      )}
      <span className={activity.completed ? "text-[#aaa] line-through" : "text-[#1a1a1a]"}>
        {activity.name}
      </span>
      {activity.owner && (
        <span className="text-xs text-[#aaa]">({activity.owner})</span>
      )}
      {activity.assetUrl && (
        <a href={activity.assetUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3 w-3 text-gladly-green" />
        </a>
      )}
    </div>
  );
}
