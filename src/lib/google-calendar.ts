import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// ─── Settings helpers ─────────────────────────────────────────────────

async function getSetting(key: string): Promise<string | null> {
  const row = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  return row[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(appSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

// ─── OAuth token management ───────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  const refreshToken = await getSetting("google_refresh_token");
  if (!refreshToken) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    console.error("Failed to refresh Google token:", await res.text());
    return null;
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function getCalendarId(): Promise<string | null> {
  return getSetting("google_calendar_id");
}

export async function isConnected(): Promise<boolean> {
  const token = await getSetting("google_refresh_token");
  return !!token;
}

// ─── Event time building ──────────────────────────────────────────────

const TIMEZONE_MAP: Record<string, string> = {
  PST: "America/Los_Angeles",
  EST: "America/New_York",
  CST: "America/Chicago",
  MST: "America/Denver",
};

const MEETING_TIMES: Record<string, { hour: number; minute: number; durationMin: number; tz: string }> = {
  "meeting-ae": { hour: 9, minute: 0, durationMin: 60, tz: "America/Los_Angeles" },
  "meeting-bdr": { hour: 8, minute: 0, durationMin: 60, tz: "America/Los_Angeles" },
  "meeting-sam": { hour: 13, minute: 0, durationMin: 60, tz: "America/Los_Angeles" },
  "meeting-se": { hour: 12, minute: 0, durationMin: 30, tz: "America/Los_Angeles" },
};

interface EventTimeInput {
  scheduledDate: string;
  scheduledEndDate?: string | null;
  type?: string | null;
  deliverySlot?: string | null;
  customTime?: string | null;
  customTimezone?: string | null;
}

function buildEventTimes(data: EventTimeInput): {
  start: Record<string, string>;
  end: Record<string, string>;
} {
  const dateStr = data.scheduledDate.split("T")[0];

  // Certifications: multi-day all-day events
  if (data.type === "Certification") {
    const endStr = data.scheduledEndDate
      ? data.scheduledEndDate.split("T")[0]
      : dateStr;
    return {
      start: { date: dateStr },
      end: { date: endStr },
    };
  }

  // Team meeting slots: fixed times
  if (data.deliverySlot && MEETING_TIMES[data.deliverySlot]) {
    const mt = MEETING_TIMES[data.deliverySlot];
    const startDt = `${dateStr}T${String(mt.hour).padStart(2, "0")}:${String(mt.minute).padStart(2, "0")}:00`;
    const endHour = mt.hour + Math.floor((mt.minute + mt.durationMin) / 60);
    const endMin = (mt.minute + mt.durationMin) % 60;
    const endDt = `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;
    return {
      start: { dateTime: startDt, timeZone: mt.tz },
      end: { dateTime: endDt, timeZone: mt.tz },
    };
  }

  // One-off with custom time
  if (data.deliverySlot === "one-off" && data.customTime) {
    const tz = TIMEZONE_MAP[data.customTimezone || "PST"] || "America/Los_Angeles";
    const startDt = `${dateStr}T${data.customTime}:00`;
    // Parse hours/minutes and add 1 hour
    const [h, m] = data.customTime.split(":").map(Number);
    const endH = h + 1;
    const endDt = `${dateStr}T${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
    return {
      start: { dateTime: startDt, timeZone: tz },
      end: { dateTime: endDt, timeZone: tz },
    };
  }

  // Fallback: all-day event
  return {
    start: { date: dateStr },
    end: { date: dateStr },
  };
}

// ─── Event description building ───────────────────────────────────────

interface DescriptionInput {
  details?: string | null;
  audience?: string | null;
  improvementArea?: string | null;
  planningDocLink?: string | null;
}

function buildDescription(data: DescriptionInput): string {
  const parts: string[] = [];

  if (data.details) {
    parts.push(data.details);
  }

  if (data.audience) {
    parts.push(`Audience: ${data.audience}`);
  }

  if (data.improvementArea) {
    parts.push(`Improvement Area: ${data.improvementArea}`);
  }

  if (data.planningDocLink) {
    parts.push(`Planning Doc: ${data.planningDocLink}`);
  }

  return parts.join("\n\n");
}

// ─── Google Calendar color IDs ────────────────────────────────────────
// Google Calendar uses numeric color IDs (1-11)
// 2 = Sage/Green, 9 = Blueberry/Blue, 5 = Banana/Yellow
const TYPE_COLOR_IDS: Record<string, string> = {
  Live: "2",
  Async: "9",
  Certification: "5",
};

// ─── CRUD operations ──────────────────────────────────────────────────

interface CalendarEventData {
  title: string;
  scheduledDate: string;
  scheduledEndDate?: string | null;
  type?: string | null;
  details?: string | null;
  audience?: string | null;
  improvementArea?: string | null;
  planningDocLink?: string | null;
  deliverySlot?: string | null;
  customTime?: string | null;
  customTimezone?: string | null;
}

export async function createCalendarEvent(
  data: CalendarEventData
): Promise<string | null> {
  const accessToken = await getAccessToken();
  const calendarId = await getCalendarId();
  if (!accessToken || !calendarId) return null;

  const times = buildEventTimes(data);
  const description = buildDescription(data);
  const colorId = TYPE_COLOR_IDS[data.type || ""] || undefined;

  const isLive = data.type === "Live";

  const event: Record<string, unknown> = {
    summary: data.title,
    description,
    start: times.start,
    end: times.end,
    ...(colorId && { colorId }),
    ...(isLive && {
      conferenceData: {
        createRequest: {
          requestId: `enablement-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }),
  };

  const conferenceParam = isLive ? "&conferenceDataVersion=1" : "";
  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${conferenceParam}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    console.error("Failed to create Google Calendar event:", await res.text());
    return null;
  }

  const created = await res.json();
  return created.id as string;
}

export async function updateCalendarEvent(
  eventId: string,
  data: CalendarEventData
): Promise<boolean> {
  const accessToken = await getAccessToken();
  const calendarId = await getCalendarId();
  if (!accessToken || !calendarId) return false;

  const times = buildEventTimes(data);
  const description = buildDescription(data);
  const colorId = TYPE_COLOR_IDS[data.type || ""] || undefined;

  const isLive = data.type === "Live";

  const event: Record<string, unknown> = {
    summary: data.title,
    description,
    start: times.start,
    end: times.end,
    ...(colorId && { colorId }),
    ...(isLive && {
      conferenceData: {
        createRequest: {
          requestId: `enablement-${eventId}-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }),
  };

  const conferenceParam = isLive ? "?conferenceDataVersion=1" : "";
  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}${conferenceParam}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    console.error("Failed to update Google Calendar event:", await res.text());
    return false;
  }

  return true;
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const accessToken = await getAccessToken();
  const calendarId = await getCalendarId();
  if (!accessToken || !calendarId) return false;

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok && res.status !== 410) {
    console.error("Failed to delete Google Calendar event:", await res.text());
    return false;
  }

  return true;
}
