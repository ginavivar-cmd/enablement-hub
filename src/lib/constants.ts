export const AUDIENCES = [
  "BDRs",
  "Growth AEs",
  "Enterprise AEs",
  "All AEs",
  "SAMs",
  "SEs",
  "Customer Success/Support",
  "Marketing",
  "All of the above",
] as const;
export type Audience = (typeof AUDIENCES)[number];

export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ENABLEMENT_TYPES = ["Async", "Live", "Certification"] as const;
export type EnablementType = (typeof ENABLEMENT_TYPES)[number];

export const IMPROVEMENT_AREAS = [
  "Build Foundational Knowledge & Role Readiness",
  "Improve Pipeline / Stage Progression Speed",
  "Strengthen Technical Proficiency",
  "Optimize Resolution Rates & Channel Utilization",
  "Improve Customer Communication",
  "Increase Revenue / Business Impact",
] as const;
export type ImprovementArea = (typeof IMPROVEMENT_AREAS)[number];

export const STATUSES = [
  "submitted",
  "suggested",
  "accepted",
  "hold",
  "scheduled",
  "completed",
  "deprioritized",
] as const;
export type EnablementStatus = (typeof STATUSES)[number];

export const SOURCES = ["intake", "slack"] as const;
export type Source = (typeof SOURCES)[number];

export const TYPE_COLORS: Record<string, string> = {
  Async: "#3B82F6",       // blue
  Live: "#10B981",        // green
  Certification: "#F59E0B", // amber
};

export const RECURRING_MEETINGS = [
  {
    name: "AE Team Meeting (Refuse to Compromise)",
    schedule: "Fridays, 9–10am PST / 12–1pm EST",
  },
  {
    name: "Team Meeting: BDR",
    schedule: "Wednesdays, 8–9am PST / 11am–12pm EST",
  },
  {
    name: "Team Meeting: SAM",
    schedule: "Thursdays, 1–2pm PST / 4–5pm EST",
  },
  {
    name: "Team Meeting: SE",
    schedule: "Mondays, 12–12:30pm PST / 3–3:30pm EST",
  },
  {
    name: "Enablement Hour",
    schedule: "Thursdays, 12–1pm PST / 3–4pm EST",
  },
  {
    name: "Technical Enablement",
    schedule: "Fridays, 10:15–11am PST / 1:15–2pm EST",
  },
];

export const BRANCH_LABELS: Record<string, { label: string; color: string }> = {
  internal_enablement: { label: "Internal", color: "bg-blue-50 text-blue-700" },
  customer_education: { label: "Customer Ed", color: "bg-teal-50 text-teal-700" },
  marketing_pmm: { label: "Marketing/PMM", color: "bg-pink-50 text-pink-700" },
};

export const SLACK_CHANNELS = [
  // Curated high-signal channels for enablement scanning.
  // Referenced by Claude Code when running "scan Slack channels".
  "what-we-are-shipping",
] as const;

export const USERS = [
  { name: "Gina Vivar", displayName: "Gina" },
  { name: "Christian Shockley", displayName: "Christian" },
  { name: "Gerard Urbano", displayName: "Gerard" },
  { name: "Emily Moore", displayName: "Emily" },
  { name: "Eliza Wiraatmadja", displayName: "Eliza" },
];
