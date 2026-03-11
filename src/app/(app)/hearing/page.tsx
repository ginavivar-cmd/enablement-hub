"use client";

import { useState, useEffect, useCallback } from "react";
import { EnablementTile } from "@/components/enablement-tile";

interface Enablement {
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
}

interface WeeklySummary {
  summary: string;
  weekOf: string;
}

export default function HearingPage() {
  const [items, setItems] = useState<Enablement[]>([]);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/enablements?status=submitted,suggested,hold").then((r) => r.json()),
      fetch("/api/hearing/summary").then((r) => r.ok ? r.json() : null),
    ])
      .then(([enablementData, summaryData]) => {
        setItems(enablementData.enablements || []);
        setSummary(summaryData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeItems = items.filter((i) => i.status !== "hold");
  const holdItems = items.filter((i) => i.status === "hold");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">
          What We&apos;re Hearing
        </h1>
        <p className="mt-1 text-gladly-green font-medium">
          Enablement needs and gaps from intake submissions and Slack signals
        </p>
      </div>

      {/* Executive Summary — white card with green left border */}
      <div className="rounded-lg bg-white border border-[#e5e5e5] shadow-sm border-l-4 border-l-gladly-green p-6">
        <h2 className="text-xs font-semibold text-[#aaa] uppercase tracking-wide mb-3">
          Top things enablement is hearing this week
        </h2>
        {summary ? (
          <p className="text-sm text-[#1a1a1a] leading-relaxed">
            {summary.summary}
          </p>
        ) : items.length > 0 ? (
          <p className="text-sm text-[#1a1a1a] leading-relaxed">
            There {items.length === 1 ? "is" : "are"} currently{" "}
            <span className="font-bold">{items.length}</span>{" "}
            enablement {items.length === 1 ? "signal" : "signals"} to review
            {activeItems.length > 0 && ` \u2014 ${activeItems.length} active`}
            {holdItems.length > 0 && `, ${holdItems.length} on hold`}
            . Review each signal below and accept, hold, or deprioritize.
          </p>
        ) : (
          <p className="text-sm text-[#737373]">
            No enablement signals yet. Submit requests via the Intake tab or
            wait for the weekly Slack scan.
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#aaa]">Loading...</div>
      ) : (
        <>
          {/* Active signals */}
          {activeItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">
                Active Signals
                <span className="ml-2 text-gladly-green">({activeItems.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {activeItems.map((item) => (
                  <EnablementTile
                    key={item.id}
                    {...item}
                    onAction={load}
                  />
                ))}
              </div>
            </div>
          )}

          {/* On Hold */}
          {holdItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">
                On Hold
                <span className="ml-2 text-amber-500">({holdItems.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {holdItems.map((item) => (
                  <EnablementTile
                    key={item.id}
                    {...item}
                    onAction={load}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <div className="rounded-lg bg-white border border-dashed border-[#e5e5e5] p-12 text-center text-[#aaa]">
              No enablement signals to review. Submit requests via the Intake
              tab or wait for the weekly Slack scan.
            </div>
          )}
        </>
      )}
    </div>
  );
}
