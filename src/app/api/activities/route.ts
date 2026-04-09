import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const launchId = searchParams.get("launchId");
  const requestId = searchParams.get("requestId");
  const scheduled = searchParams.get("scheduled");

  const conditions = [];
  if (launchId) conditions.push(eq(activities.launchId, launchId));
  if (requestId) conditions.push(eq(activities.requestId, requestId));
  if (scheduled === "true") conditions.push(isNotNull(activities.scheduledDate));
  if (scheduled === "false") conditions.push(isNull(activities.scheduledDate));

  const results = conditions.length > 0
    ? await db.select().from(activities).where(and(...conditions)).orderBy(activities.sortOrder)
    : await db.select().from(activities).orderBy(desc(activities.createdAt));

  return NextResponse.json({ activities: results });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const [created] = await db.insert(activities).values({
    launchId: body.launchId || null,
    requestId: body.requestId || null,
    team: body.team,
    category: body.category || null,
    name: body.name,
    type: body.type,
    owner: body.owner || null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
    assetUrl: body.assetUrl || null,
    completed: body.completed ?? false,
    sortOrder: body.sortOrder ?? 0,
    googleMeetLink: body.googleMeetLink || null,
    recordingLink: body.recordingLink || null,
    audiences: body.audiences || null,
    duration: body.duration || null,
    notes: body.notes || null,
    format: body.format || null,
    slideDeckLink: body.slideDeckLink || null,
    assetStatus: body.assetStatus || null,
    assessmentType: body.assessmentType || null,
    passThreshold: body.passThreshold || null,
    kirkpatrickLevel: body.kirkpatrickLevel || null,
    commsType: body.commsType || null,
    otherDescription: body.otherDescription || null,
  }).returning();

  return NextResponse.json({ activity: created }, { status: 201 });
}
