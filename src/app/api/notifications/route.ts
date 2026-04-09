import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { users } from "@/db/schema";

async function getUserId(name: string) {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.name, name))
    .limit(1);
  return result[0]?.id ?? null;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserId(session.name);
  if (!userId) {
    return NextResponse.json({ notifications: [] });
  }

  const results = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  return NextResponse.json({ notifications: results });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserId(session.name);
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json();
  if (body.markAllRead) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false))
      );
  }

  return NextResponse.json({ ok: true });
}
