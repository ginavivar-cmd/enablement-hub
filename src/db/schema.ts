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
} from "drizzle-orm/pg-core";

export const audienceEnum = pgEnum("audience", [
  "BDR",
  "SAM",
  "SE",
  "All",
  "Other",
]);

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
  audience: audienceEnum("audience"),
  priority: priorityEnum("priority"),
  idealDate: date("ideal_date"),
  type: enablementTypeEnum("type"),
  improvementArea: improvementAreaEnum("improvement_area"),
  owner: text("owner"),
  planningDocLink: text("planning_doc_link"),
  scheduledDate: timestamp("scheduled_date"),
  status: statusEnum("status").notNull().default("submitted"),
  source: sourceEnum("source").notNull().default("intake"),
  sourceSlackChannel: text("source_slack_channel"),
  sourceSlackLink: text("source_slack_link"),
  sourceSlackAuthor: text("source_slack_author"),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
