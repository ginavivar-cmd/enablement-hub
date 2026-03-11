import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { enablements, users, notifications } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const statusList = statusFilter ? statusFilter.split(",") : null;

  let query = db.select().from(enablements).orderBy(desc(enablements.createdAt));

  const results = statusList
    ? await query.where(
        inArray(
          enablements.status,
          statusList as (
            | "submitted"
            | "suggested"
            | "accepted"
            | "hold"
            | "scheduled"
            | "completed"
            | "deprioritized"
          )[]
        )
      )
    : await query;

  return NextResponse.json({ enablements: results });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Look up user id
  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.name, session.name))
    .limit(1);
  const userId = userResult[0]?.id ?? null;

  const [created] = await db
    .insert(enablements)
    .values({
      title: body.title || null,
      submitter: body.submitter || null,
      details: body.details || null,
      audience: body.audience || null,
      priority: body.priority || null,
      idealDate: body.idealDate || null,
      type: body.type || null,
      improvementArea: body.improvementArea || null,
      branches: body.branches ? JSON.stringify(body.branches) : null,
      sourceSignal: body.sourceSignal || null,
      learningObjective: body.learningObjective || null,
      proposedDeliverables: body.proposedDeliverables ? JSON.stringify(body.proposedDeliverables) : null,
      confidence: body.confidence || null,
      priorityReason: body.priorityReason || null,
      status: "submitted",
      source: "intake",
      createdByUserId: userId,
    })
    .returning();

  // Notify all users about the new submission
  const allUsers = await db.select({ id: users.id }).from(users);
  for (const u of allUsers) {
    if (u.id !== userId) {
      await db.insert(notifications).values({
        userId: u.id,
        message: `${session.displayName} submitted "${body.title || "Untitled request"}"`,
        enablementId: created.id,
      });
    }
  }

  return NextResponse.json({ enablement: created }, { status: 201 });
}
