import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { launches, launchTracks, activities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [launch] = await db
    .select()
    .from(launches)
    .where(eq(launches.id, id));

  if (!launch) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tracks = await db
    .select()
    .from(launchTracks)
    .where(eq(launchTracks.launchId, id));

  const acts = await db
    .select()
    .from(activities)
    .where(eq(activities.launchId, id))
    .orderBy(activities.sortOrder);

  return NextResponse.json({
    launch: {
      ...launch,
      tracks: tracks.map((t) => t.trackCode),
      activities: acts,
    },
  });
}

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

  // Update launch fields
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.tier !== undefined) updateData.tier = body.tier;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.targetDate !== undefined)
    updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null;
  if (body.notionBriefUrl !== undefined) updateData.notionBriefUrl = body.notionBriefUrl;
  if (body.planningDocUrl !== undefined) updateData.planningDocUrl = body.planningDocUrl;
  if (body.goal !== undefined) updateData.goal = body.goal;
  if (body.learningObjectives !== undefined) updateData.learningObjectives = body.learningObjectives;
  if (body.kirkpatrick !== undefined) updateData.kirkpatrick = body.kirkpatrick;

  const [updated] = await db
    .update(launches)
    .set(updateData)
    .where(eq(launches.id, id))
    .returning();

  // Update tracks if provided
  if (body.tracks) {
    await db.delete(launchTracks).where(eq(launchTracks.launchId, id));
    if (body.tracks.length > 0) {
      await db.insert(launchTracks).values(
        body.tracks.map((code: string) => ({
          launchId: id,
          trackCode: code,
        }))
      );
    }
  }

  return NextResponse.json({ launch: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db.delete(launches).where(eq(launches.id, id));

  return NextResponse.json({ success: true });
}
