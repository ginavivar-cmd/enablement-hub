"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Quarter helpers (same as dashboard) ─────────────────────────────
const QUARTER_LABELS = ["Q1 (Feb - Apr)", "Q2 (May - Jul)", "Q3 (Aug - Oct)", "Q4 (Nov - Jan)"];

function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const m = now.getMonth();
  if (m >= 1 && m <= 3) return { year: now.getFullYear(), quarter: 1 };
  if (m >= 4 && m <= 6) return { year: now.getFullYear(), quarter: 2 };
  if (m >= 7 && m <= 9) return { year: now.getFullYear(), quarter: 3 };
  if (m >= 10) return { year: now.getFullYear(), quarter: 4 };
  return { year: now.getFullYear() - 1, quarter: 4 };
}

function getQuarterRange(year: number, quarter: number): { start: Date; end: Date } {
  switch (quarter) {
    case 1: return { start: new Date(year, 1, 1), end: new Date(year, 4, 0, 23, 59, 59) };
    case 2: return { start: new Date(year, 4, 1), end: new Date(year, 7, 0, 23, 59, 59) };
    case 3: return { start: new Date(year, 7, 1), end: new Date(year, 10, 0, 23, 59, 59) };
    case 4: return { start: new Date(year, 10, 1), end: new Date(year + 1, 1, 0, 23, 59, 59) };
    default: return { start: new Date(), end: new Date() };
  }
}

interface ArchivedEnablement {
  id: string;
  title: string | null;
  type: string | null;
  audience: string | null;
  priority: string | null;
  details: string | null;
  owner: string | null;
  status: string;
  archivedReason: string | null;
  archivedBy: string | null;
  scheduledDate: string | null;
  updatedAt: string;
}

export default function ArchivePage() {
  const [items, setItems] = useState<ArchivedEnablement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(() => getCurrentQuarter().year);
  const [selectedQuarter, setSelectedQuarter] = useState(() => getCurrentQuarter().quarter);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/enablements?status=deprioritized").then((r) => r.json()),
      fetch("/api/enablements?status=completed").then((r) => r.json()),
    ]).then(([dep, comp]) => {
      const all = [
        ...(dep.enablements || []),
        ...(comp.enablements || []),
      ].sort(
        (a: ArchivedEnablement, b: ArchivedEnablement) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setItems(all);
      setLoading(false);
    });
  }, []);

  // Filter by selected quarter (based on updatedAt — when it was archived/completed)
  const quarterRange = useMemo(
    () => getQuarterRange(selectedYear, selectedQuarter),
    [selectedYear, selectedQuarter]
  );

  const filteredItems = useMemo(() => {
    return items.filter((e) => {
      const d = new Date(e.updatedAt);
      return d >= quarterRange.start && d <= quarterRange.end;
    });
  }, [items, quarterRange]);

  function prevQuarter() {
    if (selectedQuarter === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedQuarter(4);
    } else {
      setSelectedQuarter((q) => q - 1);
    }
  }

  function nextQuarter() {
    if (selectedQuarter === 4) {
      setSelectedYear((y) => y + 1);
      setSelectedQuarter(1);
    } else {
      setSelectedQuarter((q) => q + 1);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/enablements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
    setDeletingId(null);
  }

  const completedCount = filteredItems.filter((i) => i.status === "completed").length;
  const archivedCount = filteredItems.filter((i) => i.status === "deprioritized").length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1a1a1a]">Archive</h1>
      <p className="mt-1 text-gladly-green font-medium">
        Read-only record of completed and deprioritized enablements
      </p>

      {/* Quarter selector */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={prevQuarter}
          className="h-8 w-8 rounded-md border border-[#e5e5e5] bg-white text-[#737373] hover:bg-[#f5f5f5] flex items-center justify-center text-sm"
        >
          &lsaquo;
        </button>
        <span className="text-sm font-bold text-[#1a1a1a] min-w-[180px] text-center">
          {QUARTER_LABELS[selectedQuarter - 1]} {selectedYear}
        </span>
        <button
          onClick={nextQuarter}
          className="h-8 w-8 rounded-md border border-[#e5e5e5] bg-white text-[#737373] hover:bg-[#f5f5f5] flex items-center justify-center text-sm"
        >
          &rsaquo;
        </button>
        {!loading && (
          <span className="text-xs text-[#aaa] ml-2">
            {completedCount} completed, {archivedCount} archived
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-8 text-center text-[#aaa] text-sm">Loading...</div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-6 rounded-lg bg-white border border-dashed border-[#e5e5e5] p-12 text-center text-[#aaa] text-sm">
          No archived enablements for this quarter.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg bg-white border border-[#e5e5e5] shadow-sm border-l-4 ${
                item.status === "completed"
                  ? "border-l-gladly-green"
                  : "border-l-red-400"
              } px-5 py-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-[#1a1a1a]">
                    {item.title || "Untitled"}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs font-medium ${
                        item.status === "completed"
                          ? "bg-gladly-green/10 text-gladly-green"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {item.status === "completed" ? "Completed" : "Archived"}
                    </Badge>
                    {item.type && (
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          item.type === "Live"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.type === "Async"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.type}
                      </Badge>
                    )}
                    {item.audience && item.audience.split(", ").map((aud) => (
                      <Badge key={aud} variant="secondary" className="bg-[#f0f0f0] text-[#737373] border-0 text-xs">
                        {aud}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-[#aaa]">
                    {new Date(item.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {item.status === "deprioritized" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingId(item.id)}
                      className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {item.details && (
                <p className="mt-3 text-sm text-[#737373] line-clamp-2">{item.details}</p>
              )}

              {(item.archivedReason || item.archivedBy || item.owner) && (
                <div className="mt-3 pt-3 border-t border-[#e5e5e5] flex flex-wrap gap-x-6 gap-y-1">
                  {item.archivedReason && (
                    <div>
                      <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Reason: </span>
                      <span className="text-xs text-[#1a1a1a]">{item.archivedReason}</span>
                    </div>
                  )}
                  {item.archivedBy && (
                    <div>
                      <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Archived by: </span>
                      <span className="text-xs text-[#1a1a1a]">{item.archivedBy}</span>
                    </div>
                  )}
                  {item.owner && (
                    <div>
                      <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Owner: </span>
                      <span className="text-xs text-[#1a1a1a]">{item.owner}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl border border-[#e5e5e5] p-6">
            <h3 className="text-lg font-bold text-[#1a1a1a]">
              Permanently Delete?
            </h3>
            <p className="mt-2 text-sm text-[#737373]">
              This will permanently delete this enablement and its Google Calendar event. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Button
                onClick={() => handleDelete(deletingId)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => setDeletingId(null)}
                className="text-[#737373]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
