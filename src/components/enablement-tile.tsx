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
import { USERS } from "@/lib/constants";
import { ArchiveReasonModal } from "@/components/archive-reason-modal";

interface EnablementTileProps {
  id: string;
  title: string | null;
  type: string | null;
  audience: string | null;
  details: string | null;
  submitter: string | null;
  source: string;
  sourceSlackChannel: string | null;
  sourceSlackLink: string | null;
  sourceSlackAuthor: string | null;
  priority: string | null;
  improvementArea: string | null;
  status: string;
  onAction: () => void;
}

export function EnablementTile({
  id,
  title,
  type,
  audience,
  details,
  submitter,
  source,
  sourceSlackChannel,
  sourceSlackLink,
  sourceSlackAuthor,
  priority,
  improvementArea,
  status,
  onAction,
}: EnablementTileProps) {
  const [expanded, setExpanded] = useState(false);
  const [showOwnerInput, setShowOwnerInput] = useState(false);
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  async function updateStatus(newStatus: string, ownerValue?: string) {
    setLoading(true);
    try {
      const body: Record<string, string> = { status: newStatus };
      if (ownerValue) body.owner = ownerValue;

      await fetch(`/api/enablements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onAction();
    } finally {
      setLoading(false);
      setShowOwnerInput(false);
      setOwner("");
    }
  }

  async function handleArchiveConfirm(reason: string) {
    setLoading(true);
    try {
      await fetch(`/api/enablements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "deprioritized",
          archivedReason: reason,
        }),
      });
      onAction();
    } finally {
      setLoading(false);
      setShowArchiveModal(false);
    }
  }

  function handleAccept() {
    setShowOwnerInput(true);
  }

  function confirmAccept() {
    if (!owner.trim()) return;
    updateStatus("accepted", owner.trim());
  }

  // Green left border for active, yellow for hold
  const borderColor =
    status === "hold" ? "border-l-amber-400" : "border-l-gladly-green";

  return (
    <div className={`rounded-lg bg-white border border-[#e5e5e5] shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#1a1a1a]">
              {title || "Untitled request"}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {type && (
                <Badge
                  variant="secondary"
                  className={`border-0 text-xs font-medium ${
                    type === "Live"
                      ? "bg-emerald-50 text-emerald-700"
                      : type === "Async"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {type}
                </Badge>
              )}
              {audience && audience.split(", ").map((aud) => (
                <Badge key={aud} variant="secondary" className="bg-[#f0f0f0] text-[#737373] border-0 text-xs">
                  {aud}
                </Badge>
              ))}
              {priority && (
                <Badge
                  variant="secondary"
                  className={`border-0 text-xs ${
                    priority === "High"
                      ? "bg-red-50 text-red-600 font-medium"
                      : priority === "Medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-[#f0f0f0] text-[#737373]"
                  }`}
                >
                  {priority}
                </Badge>
              )}
              {source === "slack" && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0 text-xs">
                  Slack
                </Badge>
              )}
              {status === "hold" && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-0 text-xs font-medium">
                  On Hold
                </Badge>
              )}
            </div>
            {details && (
              <p className="mt-3 text-sm text-[#737373] line-clamp-2">
                {details}
              </p>
            )}
          </div>

          {/* Expand button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-xs text-gladly-green hover:underline font-medium"
          >
            {expanded ? "Collapse" : "Details"}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#e5e5e5] px-5 py-4 space-y-3 bg-[#fafafa]">
          {details && (
            <div>
              <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Full Description</span>
              <p className="mt-1 text-sm text-[#1a1a1a] whitespace-pre-wrap">{details}</p>
            </div>
          )}
          {improvementArea && (
            <div>
              <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Improvement Area</span>
              <p className="mt-1 text-sm text-[#1a1a1a]">{improvementArea}</p>
            </div>
          )}
          <div>
            <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Source</span>
            <p className="mt-1 text-sm text-[#1a1a1a]">
              {source === "slack" ? (
                <>
                  Slack — #{sourceSlackChannel}
                  {sourceSlackAuthor && ` (${sourceSlackAuthor})`}
                  {sourceSlackLink && (
                    <>
                      {" "}
                      <a
                        href={sourceSlackLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gladly-green hover:underline"
                      >
                        View message
                      </a>
                    </>
                  )}
                </>
              ) : (
                <>
                  Intake form
                  {submitter && ` — submitted by ${submitter}`}
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-[#e5e5e5] px-5 py-3 bg-white">
        {showOwnerInput ? (
          <div className="flex items-center gap-2">
            <Select value={owner} onValueChange={(v) => setOwner(v ?? "")}>
              <SelectTrigger className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-sm min-w-[180px]">
                <SelectValue placeholder="Select owner..." />
              </SelectTrigger>
              <SelectContent className="border-[#e5e5e5] bg-white">
                {USERS.map((u) => (
                  <SelectItem key={u.name} value={u.name} className="text-[#1a1a1a]">
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={confirmAccept}
              disabled={!owner.trim() || loading}
              className="h-8 bg-gladly-green text-white hover:bg-gladly-green/90 text-xs"
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowOwnerInput(false); setOwner(""); }}
              className="h-8 text-[#aaa] hover:text-[#1a1a1a] text-xs"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={loading}
              className="h-7 bg-gladly-green text-white hover:bg-gladly-green/90 text-xs font-medium"
            >
              Accept
            </Button>
            {status !== "hold" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateStatus("hold")}
                disabled={loading}
                className="h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-xs"
              >
                Hold
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateStatus("submitted")}
                disabled={loading}
                className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
              >
                Unhold
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowArchiveModal(true)}
              disabled={loading}
              className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
            >
              Archive
            </Button>
          </div>
        )}
      </div>

      {/* Archive reason modal */}
      {showArchiveModal && (
        <ArchiveReasonModal
          title={title || "Untitled"}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setShowArchiveModal(false)}
        />
      )}
    </div>
  );
}
