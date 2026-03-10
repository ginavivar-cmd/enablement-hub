export const AUDIENCES = ["BDR", "SAM", "SE", "All", "Other"] as const;
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
    name: "Enablement Hour",
    schedule: "Thursdays, 12pm PST / 3pm EST",
  },
  {
    name: "Refuse to Compromise Series",
    schedule: "Recurring",
  },
  {
    name: "Team Meeting: BDR",
    schedule: "Recurring",
  },
  {
    name: "Team Meeting: SAM",
    schedule: "Recurring",
  },
  {
    name: "Team Meeting: SE",
    schedule: "Recurring",
  },
];

export const USERS = [
  { name: "Gina Vivar", displayName: "Gina" },
  { name: "Christian Shockley", displayName: "Christian" },
  { name: "Gerard Urbano", displayName: "Gerard" },
  { name: "Emily Moore", displayName: "Emily" },
  { name: "Eliza Wiraatmadja", displayName: "Eliza" },
];
