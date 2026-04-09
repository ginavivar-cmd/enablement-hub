import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { enablements, users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  const allowedFields = [
    "title",
    "submitter",
    "details",
    "audience",
    "priority",
    "idealDate",
    "type",
    "improvementArea",
    "owner",
    "planningDocLink",
    "educationPlanningLink",
    "slackLink",
    "scheduledDate",
    "scheduledEndDate",
    "status",
    "archivedReason",
    "archivedBy",
    "branches",
    "sourceSignal",
    "learningObjective",
    "proposedDeliverables",
    "confidence",
    "priorityReason",
  ];

  for (const field of allowedFields) {
    if (field in body) {
      // Convert date strings to Date objects for timestamp columns
      // Use noon UTC to avoid timezone-boundary shifts where midnight UTC
      // could be serialized as the previous day in non-UTC server timezones
      if ((field === "scheduledDate" || field === "scheduledEndDate") && body[field]) {
        const dateStr = body[field] as string;
        // If it's a date-only string (YYYY-MM-DD), store as noon UTC
        updateData[field] = dateStr.length === 10
          ? new Date(`${dateStr}T12:00:00Z`)
          : new Date(dateStr);
      } else {
        updateData[field] = body[field];
      }
    }
  }

  // Auto-set archivedBy from session when deprioritizing
  if (body.status === "deprioritized" && !updateData.archivedBy) {
    updateData.archivedBy = session.name;
  }

  const [updated] = await db
    .update(enablements)
    .set(updateData)
    .where(eq(enablements.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ─── Google Calendar sync (best-effort, never blocks the response) ──
  try {
    const calendarData = {
      title: updated.title || "Untitled",
      scheduledDate: updated.scheduledDate?.toISOString() || "",
      scheduledEndDate: updated.scheduledEndDate?.toISOString() || null,
      type: updated.type,
      details: updated.details,
      audience: updated.audience,
      improvementArea: updated.improvementArea,
      planningDocLink: updated.planningDocLink,
      deliverySlot: body.deliverySlot || null,
      customTime: body.customTime || null,
      customTimezone: body.customTimezone || null,
    };

    // Scheduling: create a new Google Calendar event
    if (body.status === "scheduled" && updated.scheduledDate) {
      const gcalEventId = await createCalendarEvent(calendarData);
      if (gcalEventId) {
        await db
          .update(enablements)
          .set({ googleCalendarEventId: gcalEventId })
          .where(eq(enablements.id, id));
        updated.googleCalendarEventId = gcalEventId;
      }
    }

    // Updating: event already exists, sync changes
    else if (
      updated.status === "scheduled" &&
      updated.googleCalendarEventId &&
      !body.status // not a status change, just a field update
    ) {
      await updateCalendarEvent(updated.googleCalendarEventId, calendarData);
    }

    // Archiving / deprioritizing: remove from Google Calendar
    else if (
      body.status === "deprioritized" &&
      updated.googleCalendarEventId
    ) {
      await deleteCalendarEvent(updated.googleCalendarEventId);
      await db
        .update(enablements)
        .set({ googleCalendarEventId: null })
        .where(eq(enablements.id, id));
    }
  } catch (err) {
    // Calendar sync is best-effort — log but don't fail the request
    console.error("Google Calendar sync error:", err);
  }

  // Send notifications for status changes
  if (body.status) {
    const allUsers = await db.select({ id: users.id }).from(users);
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.name, session.name))
      .limit(1);
    const currentUserId = userResult[0]?.id;

    const actionMap: Record<string, string> = {
      accepted: "accepted",
      hold: "put on hold",
      deprioritized: "deprioritized",
      scheduled: "scheduled",
      completed: "marked as completed",
    };

    const action = actionMap[body.status];
    if (action) {
      for (const u of allUsers) {
        if (u.id !== currentUserId) {
          await db.insert(notifications).values({
            userId: u.id,
            message: `${session.displayName} ${action} "${updated.title || "Untitled"}"`,
            enablementId: updated.id,
          });
        }
      }
    }
  }

  return NextResponse.json({ enablement: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Load the enablement to get its Google Calendar event ID
  const [existing] = await db
    .select()
    .from(enablements)
    .where(eq(enablements.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete Google Calendar event if it exists (best-effort)
  if (existing.googleCalendarEventId) {
    try {
      await deleteCalendarEvent(existing.googleCalendarEventId);
    } catch (err) {
      console.error("Failed to delete Google Calendar event:", err);
    }
  }

  // Delete related notification rows first (no cascade configured)
  await db.delete(notifications).where(eq(notifications.enablementId, id));

  // Delete the enablement
  await db.delete(enablements).where(eq(enablements.id, id));

  return NextResponse.json({ success: true });
}
