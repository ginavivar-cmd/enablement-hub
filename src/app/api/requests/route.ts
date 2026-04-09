import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { requests, activities } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allRequests = await db.select().from(requests).orderBy(desc(requests.createdAt));

  const results = await Promise.all(
    allRequests.map(async (r) => {
      const acts = await db.select().from(activities).where(eq(activities.requestId, r.id)).orderBy(activities.sortOrder);
      return { ...r, activities: acts };
    })
  );

  return NextResponse.json({ requests: results });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const [created] = await db.insert(requests).values({
    title: body.title,
    description: body.description || null,
    audience: body.audience || null,
    owner: body.owner || null,
    status: body.status || "planning",
    type: body.type || null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    planningDocUrl: body.planningDocUrl || null,
    requestedBy: body.requestedBy || null,
    requestSource: body.requestSource || null,
    aiScanNotes: body.aiScanNotes || null,
  }).returning();

  return NextResponse.json({ request: created }, { status: 201 });
}
