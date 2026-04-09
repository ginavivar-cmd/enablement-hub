import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/db";
import { slackScanLog } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [lastScan] = await db
    .select()
    .from(slackScanLog)
    .orderBy(desc(slackScanLog.scannedAt))
    .limit(1);

  return NextResponse.json({ lastScan: lastScan || null });
}
