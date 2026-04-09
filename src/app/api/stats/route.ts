import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { launches, activities, requests } from "@/db/schema";
import { eq, sql, and, gte, inArray } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Active launches
  const activeLaunches = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(launches)
    .where(inArray(launches.status, ["planning", "in_progress"]));

  // Total / completed tasks
  const taskStats = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${activities.completed} = true)::int`,
    })
    .from(activities);

  // Open requests
  const openRequests = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requests)
    .where(inArray(requests.status, ["planning", "in_progress"]));

  // Launch progress
  const allLaunches = await db
    .select()
    .from(launches)
    .where(inArray(launches.status, ["planning", "in_progress"]));

  const launchProgress = await Promise.all(
    allLaunches.map(async (l) => {
      const acts = await db.select().from(activities).where(eq(activities.launchId, l.id));
      const eduActs = acts.filter((a) => a.team === "education");
      const enbActs = acts.filter((a) => a.team === "enablement");
      return {
        id: l.id,
        name: l.name,
        total: acts.length,
        completed: acts.filter((a) => a.completed).length,
        eduTotal: eduActs.length,
        eduDone: eduActs.filter((a) => a.completed).length,
        enbTotal: enbActs.length,
        enbDone: enbActs.filter((a) => a.completed).length,
      };
    })
  );

  // Upcoming scheduled activities
  const now = new Date();
  const upcoming = await db
    .select()
    .from(activities)
    .where(and(gte(activities.scheduledDate, now)))
    .orderBy(activities.scheduledDate)
    .limit(5);

  return NextResponse.json({
    activeLaunches: activeLaunches[0]?.count ?? 0,
    totalTasks: taskStats[0]?.total ?? 0,
    completedTasks: taskStats[0]?.completed ?? 0,
    openRequests: openRequests[0]?.count ?? 0,
    launchProgress,
    upcoming,
  });
}
