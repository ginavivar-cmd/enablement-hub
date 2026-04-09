import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { launches, launchTracks, activities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allLaunches = await db
    .select()
    .from(launches)
    .orderBy(desc(launches.createdAt));

  // Fetch tracks and activities for each launch
  const results = await Promise.all(
    allLaunches.map(async (launch) => {
      const tracks = await db
        .select()
        .from(launchTracks)
        .where(eq(launchTracks.launchId, launch.id));

      const acts = await db
        .select()
        .from(activities)
        .where(eq(activities.launchId, launch.id))
        .orderBy(activities.sortOrder);

      return {
        ...launch,
        tracks: tracks.map((t) => t.trackCode),
        activities: acts,
      };
    })
  );

  return NextResponse.json({ launches: results });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const [created] = await db
    .insert(launches)
    .values({
      name: body.name,
      description: body.description || null,
      tier: body.tier,
      status: body.status || "planning",
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      notionBriefUrl: body.notionBriefUrl || null,
      planningDocUrl: body.planningDocUrl || null,
      goal: body.goal || null,
      learningObjectives: body.learningObjectives || null,
      kirkpatrick: body.kirkpatrick || null,
    })
    .returning();

  // Insert track associations
  if (body.tracks && body.tracks.length > 0) {
    await db.insert(launchTracks).values(
      body.tracks.map((code: string) => ({
        launchId: created.id,
        trackCode: code,
      }))
    );
  }

  // Insert suggested activities if provided
  if (body.activities && body.activities.length > 0) {
    await db.insert(activities).values(
      body.activities.map((act: { name: string; team: string; type: string; category?: string }, i: number) => ({
        launchId: created.id,
        name: act.name,
        team: act.team,
        type: act.type,
        category: act.category || null,
        sortOrder: i,
      }))
    );
  }

  return NextResponse.json({ launch: created }, { status: 201 });
}
