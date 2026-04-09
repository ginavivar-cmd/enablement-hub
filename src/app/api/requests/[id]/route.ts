import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { requests, activities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [request] = await db.select().from(requests).where(eq(requests.id, id));
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const acts = await db.select().from(activities).where(eq(activities.requestId, id)).orderBy(activities.sortOrder);

  return NextResponse.json({ request: { ...request, activities: acts } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = { updatedAt: new Date() };

  const fields = ['title', 'description', 'audience', 'owner', 'status', 'type', 'planningDocUrl', 'requestedBy', 'requestSource', 'aiScanNotes'];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const [updated] = await db.update(requests).set(data).where(eq(requests.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ request: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(requests).where(eq(requests.id, id));
  return NextResponse.json({ success: true });
}
