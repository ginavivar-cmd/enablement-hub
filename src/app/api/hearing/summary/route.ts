import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { weeklySummaries } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(weeklySummaries)
    .orderBy(desc(weeklySummaries.generatedAt))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json(null);
  }

  return NextResponse.json(result[0]);
}
