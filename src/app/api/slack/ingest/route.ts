import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { scanForOpportunities } from "@/lib/ai-scanner";
import { db } from "@/db";
import { slackScanLog } from "@/db/schema";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { messages, channelName, channelCount, messageCount } = body;

  if (!messages || typeof messages !== "string" || !messages.trim()) {
    return NextResponse.json(
      { error: "messages text is required" },
      { status: 400 }
    );
  }

  try {
    const result = await scanForOpportunities(messages, "slack");

    // Log the scan
    const [logEntry] = await db
      .insert(slackScanLog)
      .values({
        channelsScanned: channelCount || 1,
        messagesFound: messageCount || 0,
        signalsGenerated: result.opportunities.length,
      })
      .returning();

    return NextResponse.json({
      opportunities: result.opportunities,
      scanLog: {
        id: logEntry.id,
        scannedAt: logEntry.scannedAt,
        channelsScanned: logEntry.channelsScanned,
        messagesFound: logEntry.messagesFound,
        signalsGenerated: logEntry.signalsGenerated,
        channelName: channelName || "unknown",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error during Slack scan";
    console.error("Slack ingest error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
