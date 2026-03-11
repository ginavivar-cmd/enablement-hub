"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StatCards } from "@/components/dashboard/stat-cards";
import { AudienceChart } from "@/components/dashboard/audience-chart";
import { ImprovementChart } from "@/components/dashboard/improvement-chart";
import { TypeChart } from "@/components/dashboard/type-chart";
import { PriorityChart } from "@/components/dashboard/priority-chart";
import { SwimLanes } from "@/components/dashboard/swim-lanes";

// ── Quarter helpers ─────────────────────────────────────────────────
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

// ── Improvement area short labels ───────────────────────────────────
const SHORT_AREA: Record<string, string> = {
  "Build Foundational Knowledge & Role Readiness": "foundational knowledge and role readiness",
  "Improve Pipeline / Stage Progression Speed": "pipeline and stage progression",
  "Strengthen Technical Proficiency": "technical proficiency",
  "Optimize Resolution Rates & Channel Utilization": "resolution rates and channel utilization",
  "Improve Customer Communication": "customer communication",
  "Increase Revenue / Business Impact": "revenue and business impact",
};

// ── Types ───────────────────────────────────────────────────────────
interface Enablement {
  id: string;
  title: string | null;
  type: string | null;
  audience: string | null;
  details: string | null;
  priority: string | null;
  improvementArea: string | null;
  owner: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// ── Value-focused summary generation ────────────────────────────────
function describeValue(e: Enablement): string {
  const parts: string[] = [];

  // Start with what it targets / addresses
  if (e.improvementArea) {
    const area = SHORT_AREA[e.improvementArea] || e.improvementArea.toLowerCase();
    parts.push(`improving ${area}`);
  }

  // Who benefits
  if (e.audience) {
    parts.push(`for ${e.audience}`);
  }

  // How it's delivered
  if (e.type) {
    parts.push(`via ${e.type.toLowerCase()} session`);
  }

  return parts.length > 0 ? parts.join(" ") : "";
}

function buildDoneSummary(items: Enablement[]): string {
  if (items.length === 0) return "No enablements were completed in the last two weeks.";

  const n = items.length;
  let text = `${n} enablement${n !== 1 ? "s were" : " was"} completed in the last two weeks. `;

  const descriptions = items.slice(0, 4).map((e) => {
    const title = e.title || "Untitled";
    const value = describeValue(e);
    return value ? `"${title}" focused on ${value}` : `"${title}"`;
  });

  text += descriptions.join("; ") + ".";
  if (items.length > 4) text += ` Plus ${items.length - 4} more.`;
  return text;
}

function buildWipSummary(items: Enablement[]): string {
  if (items.length === 0) return "No enablements are currently in progress.";

  const n = items.length;
  let text = `${n} enablement${n !== 1 ? "s are" : " is"} currently in progress. `;

  // Group by improvement area for a theme-based summary
  const areaGroups: Record<string, Enablement[]> = {};
  for (const e of items) {
    const area = e.improvementArea
      ? SHORT_AREA[e.improvementArea] || e.improvementArea.toLowerCase()
      : "general enablement";
    if (!areaGroups[area]) areaGroups[area] = [];
    areaGroups[area].push(e);
  }

  const groupDescriptions = Object.entries(areaGroups)
    .slice(0, 3)
    .map(([area, group]) => {
      const audiences = [...new Set(group.map((e) => e.audience).filter(Boolean))];
      const audienceNote = audiences.length > 0 ? ` targeting ${audiences.join(", ")}` : "";
      return `${group.length} focused on ${area}${audienceNote}`;
    });

  text += groupDescriptions.join("; ") + ".";
  return text;
}

function buildPlannedSummary(items: Enablement[]): string {
  if (items.length === 0) return "No enablements are currently in the pipeline.";

  const n = items.length;
  const highCount = items.filter((e) => e.priority === "High").length;
  let text = `${n} enablement${n !== 1 ? "s are" : " is"} in the pipeline`;
  if (highCount > 0) text += `, ${highCount} high priority`;
  text += ". ";

  // Summarize by what audiences / areas are being requested
  const areaCounts: Record<string, number> = {};
  const audienceCounts: Record<string, number> = {};
  for (const e of items) {
    if (e.improvementArea) {
      const short = SHORT_AREA[e.improvementArea] || e.improvementArea.toLowerCase();
      areaCounts[short] = (areaCounts[short] || 0) + 1;
    }
    if (e.audience) {
      for (const a of e.audience.split(",").map((s) => s.trim())) {
        if (a) audienceCounts[a] = (audienceCounts[a] || 0) + 1;
      }
    }
  }

  const topAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const topAudiences = Object.entries(audienceCounts).sort((a, b) => b[1] - a[1]).slice(0, 2);

  const needs: string[] = [];
  if (topAreas.length > 0) {
    needs.push(`Key focus areas: ${topAreas.map(([a]) => a).join(" and ")}`);
  }
  if (topAudiences.length > 0) {
    needs.push(`most requested for ${topAudiences.map(([a]) => a).join(" and ")}`);
  }
  if (needs.length > 0) text += needs.join("; ") + ".";

  return text;
}

// ── Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [enablements, setEnablements] = useState<Enablement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(() => getCurrentQuarter().year);
  const [selectedQuarter, setSelectedQuarter] = useState(() => getCurrentQuarter().quarter);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/enablements")
      .then((r) => r.json())
      .then((data) => setEnablements(data.enablements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const quarterRange = useMemo(
    () => getQuarterRange(selectedYear, selectedQuarter),
    [selectedYear, selectedQuarter]
  );

  const quarterEnablements = useMemo(() => {
    return enablements.filter((e) => {
      const d = new Date(e.createdAt);
      return d >= quarterRange.start && d <= quarterRange.end;
    });
  }, [enablements, quarterRange]);

  // TLDR data — always relative to now, not quarter-filtered
  const tldr = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

    const recentlyCompleted = enablements.filter(
      (e) =>
        e.status === "completed" &&
        new Date(e.updatedAt) >= twoWeeksAgo &&
        new Date(e.updatedAt) <= now
    );

    const inProgress = enablements.filter(
      (e) => e.status === "accepted" || e.status === "scheduled"
    );

    const planned = enablements.filter(
      (e) => e.status === "submitted" || e.status === "suggested"
    );

    // Common themes across ALL enablements
    const areaCounts: Record<string, number> = {};
    for (const e of enablements) {
      if (e.improvementArea) {
        const short = SHORT_AREA[e.improvementArea] || e.improvementArea.toLowerCase();
        areaCounts[short] = (areaCounts[short] || 0) + 1;
      }
    }
    const topAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const audienceCounts: Record<string, number> = {};
    for (const e of enablements) {
      if (e.audience) {
        for (const a of e.audience.split(",").map((s) => s.trim())) {
          if (a) audienceCounts[a] = (audienceCounts[a] || 0) + 1;
        }
      }
    }
    const topAudiences = Object.entries(audienceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    let themesSummary = "";
    if (topAreas.length > 0 || topAudiences.length > 0) {
      const parts: string[] = [];
      if (topAreas.length > 0) {
        parts.push(
          `Top improvement areas: ${topAreas
            .map(([area, count]) => `${area} (${count})`)
            .join(", ")}`
        );
      }
      if (topAudiences.length > 0) {
        parts.push(
          `Most requested for: ${topAudiences.map(([a, c]) => `${a} (${c})`).join(", ")}`
        );
      }
      themesSummary = parts.join(". ") + ".";
    }

    return {
      doneSummary: buildDoneSummary(recentlyCompleted),
      wipSummary: buildWipSummary(inProgress),
      plannedSummary: buildPlannedSummary(planned),
      themesSummary,
    };
  }, [enablements]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">
          Enablement Dashboard
        </h1>
        <p className="mt-1 text-gladly-green font-medium">
          Executive-facing view of enablement health, impact, and program metrics
        </p>
      </div>

      {/* Quarter selector */}
      <div className="flex items-center gap-3">
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
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#aaa]">Loading...</div>
      ) : enablements.length === 0 ? (
        <div className="rounded-lg bg-white border border-dashed border-[#e5e5e5] p-12 text-center text-[#aaa]">
          No enablement data yet. Submit requests via the Intake tab to see
          metrics here.
        </div>
      ) : (
        <>
          {/* TLDR Executive Summary */}
          <div className="rounded-lg bg-white border border-[#e5e5e5] shadow-sm border-l-4 border-l-gladly-green p-6">
            <h2 className="text-xs font-semibold text-[#aaa] uppercase tracking-wide mb-4">
              TLDR — Executive Summary
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">
                  What We&apos;ve Done (Last 2 Weeks)
                </p>
                <p className="text-sm text-[#1a1a1a] leading-relaxed">
                  {tldr.doneSummary}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                  What We&apos;re Working On
                </p>
                <p className="text-sm text-[#1a1a1a] leading-relaxed">
                  {tldr.wipSummary}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">
                  What&apos;s Coming
                </p>
                <p className="text-sm text-[#1a1a1a] leading-relaxed">
                  {tldr.plannedSummary}
                </p>
              </div>
              {tldr.themesSummary && (
                <div className="pt-3 border-t border-[#e5e5e5]">
                  <p className="text-xs font-bold text-[#737373] uppercase tracking-wide mb-1">
                    Common Themes
                  </p>
                  <p className="text-sm text-[#1a1a1a] leading-relaxed">
                    {tldr.themesSummary}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stat cards — quarter-filtered */}
          <StatCards enablements={quarterEnablements} />

          {/* Audience + Improvement Area — 2 columns */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Audience Breakdown"
              subtitle="Which teams and roles are being enabled"
            >
              <AudienceChart enablements={quarterEnablements} />
            </ChartCard>
            <ChartCard
              title="Improvement Area"
              subtitle="What skills and gaps enablements target"
            >
              <ImprovementChart enablements={quarterEnablements} />
            </ChartCard>
          </div>

          {/* Type / Priority — 2 columns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ChartCard
              title="Type Mix"
              subtitle="Delivery format — async, live, or certification"
            >
              <TypeChart enablements={quarterEnablements} />
            </ChartCard>
            <ChartCard
              title="Priority"
              subtitle="How enablements are prioritized"
            >
              <PriorityChart enablements={quarterEnablements} />
            </ChartCard>
          </div>

          {/* Swim lanes — current state (not quarter-filtered) */}
          <SwimLanes enablements={enablements} />
        </>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg bg-white border border-[#e5e5e5] shadow-sm p-4 ${className}`}
    >
      <h3 className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs text-[#aaa] mt-0.5 mb-3">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}
