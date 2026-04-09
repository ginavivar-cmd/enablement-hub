import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  date,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const priorityEnum = pgEnum("priority", ["High", "Medium", "Low"]);

export const enablementTypeEnum = pgEnum("enablement_type", [
  "Async",
  "Live",
  "Certification",
]);

export const improvementAreaEnum = pgEnum("improvement_area", [
  "Build Foundational Knowledge & Role Readiness",
  "Improve Pipeline / Stage Progression Speed",
  "Strengthen Technical Proficiency",
  "Optimize Resolution Rates & Channel Utilization",
  "Improve Customer Communication",
  "Increase Revenue / Business Impact",
]);

export const statusEnum = pgEnum("status", [
  "submitted",
  "suggested",
  "accepted",
  "hold",
  "scheduled",
  "completed",
  "deprioritized",
]);

export const sourceEnum = pgEnum("source", ["intake", "slack"]);

// ─── Users ───────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Enablements (core entity) ───────────────────────────────────────
export const enablements = pgTable("enablements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  submitter: text("submitter"),
  details: text("details"),
  audience: text("audience"),
  priority: priorityEnum("priority"),
  idealDate: date("ideal_date"),
  type: enablementTypeEnum("type"),
  improvementArea: improvementAreaEnum("improvement_area"),
  owner: text("owner"),
  planningDocLink: text("planning_doc_link"),
  educationPlanningLink: text("education_planning_link"),
  slackLink: text("slack_link"),
  scheduledDate: timestamp("scheduled_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  status: statusEnum("status").notNull().default("submitted"),
  source: sourceEnum("source").notNull().default("intake"),
  sourceSlackChannel: text("source_slack_channel"),
  sourceSlackLink: text("source_slack_link"),
  sourceSlackAuthor: text("source_slack_author"),
  archivedReason: text("archived_reason"),
  archivedBy: text("archived_by"),
  branches: text("branches"),
  sourceSignal: text("source_signal"),
  learningObjective: text("learning_objective"),
  proposedDeliverables: text("proposed_deliverables"),
  confidence: text("confidence"),
  priorityReason: text("priority_reason"),
  googleCalendarEventId: text("google_calendar_event_id"),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── App Settings (key-value store for OAuth tokens, calendar IDs) ───
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Notifications ───────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  enablementId: uuid("enablement_id").references(() => enablements.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Weekly Summaries ────────────────────────────────────────────────
export const weeklySummaries = pgTable("weekly_summaries", {
  id: serial("id").primaryKey(),
  weekOf: date("week_of").notNull(),
  summary: text("summary").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// ─── Slack Scan Log ──────────────────────────────────────────────────
export const slackScanLog = pgTable("slack_scan_log", {
  id: serial("id").primaryKey(),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
  channelsScanned: integer("channels_scanned").notNull(),
  messagesFound: integer("messages_found").notNull(),
  signalsGenerated: integer("signals_generated").notNull(),
});

// ═══════════════════════════════════════════════════════════════════════
// NEW: Education + Enablement Tracker tables (v2)
// ═══════════════════════════════════════════════════════════════════════

export const launchTierEnum = pgEnum("launch_tier", [
  "small",
  "medium",
  "large_xl",
]);

export const launchStatusEnum = pgEnum("launch_status", [
  "planning",
  "in_progress",
  "shipped",
  "archived",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "live_session",
  "async",
  "asset",
  "assessment",
  "comms",
  "other",
]);

export const activityTeamEnum = pgEnum("activity_team", [
  "education",
  "enablement",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "planning",
  "in_progress",
  "done",
  "archived",
]);

// ─── Programming Tracks ─────────────────────────────────────────────
export const programmingTracks = pgTable("programming_tracks", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(), // T1, T2, T3, T4, T5, T6, Custom
  name: text("name").notNull(),
});

// ─── Launches (primary entity) ──────────────────────────────────────
export const launches = pgTable("launches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  tier: launchTierEnum("tier").notNull(),
  status: launchStatusEnum("status").default("planning").notNull(),
  targetDate: timestamp("target_date"),
  notionBriefUrl: text("notion_brief_url"),
  planningDocUrl: text("planning_doc_url"),
  goal: text("goal"),
  learningObjectives: jsonb("learning_objectives"), // string[]
  kirkpatrick: jsonb("kirkpatrick"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Launch ↔ Track junction ────────────────────────────────────────
export const launchTracks = pgTable("launch_tracks", {
  id: uuid("id").defaultRandom().primaryKey(),
  launchId: uuid("launch_id")
    .notNull()
    .references(() => launches.id, { onDelete: "cascade" }),
  trackCode: text("track_code").notNull(), // T1–T6 or Custom
});

// ─── Activities (belong to a launch or request) ─────────────────────
export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  launchId: uuid("launch_id").references(() => launches.id, {
    onDelete: "cascade",
  }),
  requestId: uuid("request_id").references(() => requests.id, {
    onDelete: "cascade",
  }),
  team: activityTeamEnum("team").notNull(), // education | enablement
  category: text("category"), // 'Live Sessions', 'Assets', 'Media', etc.
  name: text("name").notNull(),
  type: activityTypeEnum("type").notNull(),
  owner: text("owner"),
  dueDate: timestamp("due_date"),
  scheduledDate: timestamp("scheduled_date"),
  assetUrl: text("asset_url"),
  completed: boolean("completed").default(false),
  sortOrder: integer("sort_order").default(0),
  // Drawer fields
  googleMeetLink: text("google_meet_link"),
  recordingLink: text("recording_link"),
  audiences: jsonb("audiences"), // string[]
  duration: text("duration"),
  notes: text("notes"),
  format: text("format"),
  slideDeckLink: text("slide_deck_link"),
  assetStatus: text("asset_status"),
  assessmentType: text("assessment_type"),
  passThreshold: text("pass_threshold"),
  kirkpatrickLevel: text("kirkpatrick_level"),
  commsType: text("comms_type"),
  otherDescription: text("other_description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Requests (standalone ad-hoc enablement) ────────────────────────
export const requests = pgTable("requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  audience: text("audience"),
  owner: text("owner"),
  status: requestStatusEnum("status").default("planning").notNull(),
  type: activityTypeEnum("type"),
  dueDate: timestamp("due_date"),
  planningDocUrl: text("planning_doc_url"),
  requestedBy: text("requested_by"),
  requestSource: text("request_source"), // 'slack', 'email', 'meeting'
  aiScanNotes: text("ai_scan_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
