import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [activity] = await db.select().from(activities).where(eq(activities.id, id));
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ activity });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  const fields = [
    'name', 'team', 'category', 'type', 'owner', 'assetUrl', 'completed', 'sortOrder',
    'googleMeetLink', 'recordingLink', 'audiences', 'duration', 'notes', 'format',
    'slideDeckLink', 'assetStatus', 'assessmentType', 'passThreshold',
    'kirkpatrickLevel', 'commsType', 'otherDescription',
  ];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.scheduledDate !== undefined) data.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;

  const [updated] = await db.update(activities).set(data).where(eq(activities.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ activity: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(activities).where(eq(activities.id, id));
  return NextResponse.json({ success: true });
}
