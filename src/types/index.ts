import type { enablements, notifications, weeklySummaries } from "@/db/schema";

export type Enablement = typeof enablements.$inferSelect;
export type NewEnablement = typeof enablements.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type WeeklySummary = typeof weeklySummaries.$inferSelect;
