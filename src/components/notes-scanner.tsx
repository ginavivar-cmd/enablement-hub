"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Opportunity {
  title: string;
  details: string;
  type: "Async" | "Live" | "Certification";
  audience: string;
  priority: "High" | "Medium" | "Low";
  improvementArea?: string;
  level?: "Foundational" | "Tactical" | "Strategic" | "Technical";
  branches?: string[];
  source_signal?: string;
  learning_objective?: string;
  proposed_deliverables?: string[];
  confidence?: "high" | "low";
  priority_reason?: string;
}

const BRANCH_LABELS: Record<string, { label: string; color: string }> = {
  internal_enablement: { label: "Internal", color: "bg-blue-50 text-blue-700" },
  customer_education: { label: "Customer Ed", color: "bg-teal-50 text-teal-700" },
  marketing_pmm: { label: "Marketing/PMM", color: "bg-pink-50 text-pink-700" },
};

interface NotesScannerProps {
  onSuccess?: () => void;
}

export function NotesScanner({ onSuccess }: NotesScannerProps) {
  const [notes, setNotes] = useState("");
  const [scanning, setScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<number>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!notes.trim()) return;
    setScanning(true);
    setError(null);
    setOpportunities([]);
    setSubmittedIds(new Set());
    setDismissedIds(new Set());

    try {
      const res = await fetch("/api/enablements/scan-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        let errMsg = "Scan failed";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch {
          errMsg = `Server error (${res.status})`;
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(opp: Opportunity, index: number) {
    try {
      const detailParts: string[] = [];
      if (opp.level) detailParts.push(`**Level:** ${opp.level}`);
      if (opp.confidence) detailParts.push(`**Confidence:** ${opp.confidence}`);
      if (opp.branches?.length) {
        detailParts.push(`**Branches:** ${opp.branches.map((b) => BRANCH_LABELS[b]?.label || b).join(", ")}`);
      }
      detailParts.push("");
      detailParts.push(opp.details);
      if (opp.source_signal) {
        detailParts.push("");
        detailParts.push(`**Source signal:** "${opp.source_signal}"`);
      }
      if (opp.learning_objective) {
        detailParts.push("");
        detailParts.push(`**Learning objective:** ${opp.learning_objective}`);
      }
      if (opp.proposed_deliverables?.length) {
        detailParts.push("");
        detailParts.push(`**Proposed deliverables:**`);
        opp.proposed_deliverables.forEach((d) => detailParts.push(`- ${d}`));
      }
      if (opp.priority_reason) {
        detailParts.push("");
        detailParts.push(`**Priority rationale:** ${opp.priority_reason}`);
      }
      const details = detailParts.join("\n");
      const res = await fetch("/api/enablements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: opp.title,
          details,
          type: opp.type,
          audience: opp.audience,
          priority: opp.priority,
          improvementArea: opp.improvementArea || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmittedIds((prev) => new Set(prev).add(index));
      onSuccess?.();
    } catch {
      // silently fail — user can try again
    }
  }

  function handleDismiss(index: number) {
    setDismissedIds((prev) => new Set(prev).add(index));
  }

  const visibleOpps = opportunities.filter(
    (_, i) => !dismissedIds.has(i)
  );

  return (
    <div className="rounded-lg bg-white shadow-sm border-l-4 border-l-blue-500 border border-[#e5e5e5] p-6">
      <h2 className="mb-1 text-lg font-bold text-[#1a1a1a]">
        Scan for Enablement Opportunities
      </h2>
      <p className="mb-4 text-sm text-[#737373]">
        Paste meeting notes, Slack threads, call summaries, deal reviews, or support tickets to automatically identify enablement opportunities.
      </p>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste content here — meeting notes, Slack threads, call recordings, deal reviews, support tickets..."
        className="border-[#e5e5e5] resize-none min-h-[120px]"
        rows={5}
      />

      <div className="mt-3 flex items-center gap-3">
        <Button
          onClick={handleScan}
          disabled={scanning || !notes.trim()}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {scanning ? "Scanning..." : "Scan for Opportunities"}
        </Button>
        {scanning && (
          <span className="text-sm text-[#737373] animate-pulse">
            AI is analyzing your notes...
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {visibleOpps.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">
            Identified Opportunities ({visibleOpps.length})
          </h3>
          {opportunities.map((opp, index) => {
            if (dismissedIds.has(index)) return null;
            const isSubmitted = submittedIds.has(index);

            return (
              <div
                key={index}
                className={`rounded-lg border border-[#e5e5e5] p-4 ${
                  isSubmitted ? "bg-green-50/50 opacity-60" : "bg-[#fafafa]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isSubmitted && (
                        <span className="text-green-600 text-sm">&#10003;</span>
                      )}
                      <h4 className="text-sm font-bold text-[#1a1a1a]">
                        {opp.title}
                      </h4>
                      {opp.confidence && (
                        <span className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          opp.confidence === "high"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {opp.confidence}
                        </span>
                      )}
                    </div>
                    {/* Badges row: branches, type, audience, priority, area, level */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {opp.branches?.map((branch) => {
                        const info = BRANCH_LABELS[branch];
                        return info ? (
                          <Badge key={branch} variant="secondary" className={`border-0 text-xs font-medium ${info.color}`}>
                            {info.label}
                          </Badge>
                        ) : null;
                      })}
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          opp.type === "Live"
                            ? "bg-emerald-50 text-emerald-700"
                            : opp.type === "Async"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {opp.type}
                      </Badge>
                      {opp.audience.split(", ").map((aud) => (
                        <Badge
                          key={aud}
                          variant="secondary"
                          className="bg-[#f0f0f0] text-[#737373] border-0 text-xs"
                        >
                          {aud}
                        </Badge>
                      ))}
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          opp.priority === "High"
                            ? "bg-red-50 text-red-600"
                            : opp.priority === "Medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-[#f0f0f0] text-[#737373]"
                        }`}
                      >
                        {opp.priority}
                      </Badge>
                      {opp.improvementArea && (
                        <Badge
                          variant="secondary"
                          className="bg-violet-50 text-violet-700 border-0 text-xs"
                        >
                          {opp.improvementArea}
                        </Badge>
                      )}
                      {opp.level && (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-600 border-0 text-xs"
                        >
                          {opp.level}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[#737373]">
                      {opp.details}
                    </p>
                    {/* Source signal */}
                    {opp.source_signal && (
                      <div className="mt-2 rounded bg-[#f5f5f5] px-3 py-2 border-l-2 border-[#ccc]">
                        <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Source signal</span>
                        <p className="text-xs text-[#555] italic mt-0.5">&ldquo;{opp.source_signal}&rdquo;</p>
                      </div>
                    )}
                    {/* Learning objective */}
                    {opp.learning_objective && (
                      <div className="mt-2">
                        <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Learning objective</span>
                        <p className="text-xs text-[#555] mt-0.5">{opp.learning_objective}</p>
                      </div>
                    )}
                    {/* Proposed deliverables */}
                    {opp.proposed_deliverables && opp.proposed_deliverables.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Proposed deliverables</span>
                        <ul className="mt-0.5 space-y-0.5">
                          {opp.proposed_deliverables.map((d, i) => (
                            <li key={i} className="text-xs text-[#555] flex items-start gap-1.5">
                              <span className="text-[#ccc] mt-px">&#8226;</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Priority reason */}
                    {opp.priority_reason && (
                      <p className="mt-2 text-xs text-[#888]">
                        <span className="font-semibold text-[#aaa]">Why {opp.priority}:</span> {opp.priority_reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {isSubmitted ? (
                    <span className="text-xs text-green-600 font-medium">
                      Submitted
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(opp, index)}
                      className="h-7 bg-gladly-green text-white hover:bg-gladly-green/90 text-xs"
                    >
                      Submit as Enablement
                    </Button>
                  )}
                  {!isSubmitted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(index)}
                      className="h-7 text-xs text-[#aaa] hover:text-[#737373]"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
