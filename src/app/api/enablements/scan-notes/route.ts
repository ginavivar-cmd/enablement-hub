import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { scanForOpportunities } from "@/lib/ai-scanner";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notes } = await req.json();
  if (!notes || typeof notes !== "string" || !notes.trim()) {
    return NextResponse.json(
      { error: "Notes text is required" },
      { status: 400 }
    );
  }

  try {
    const result = await scanForOpportunities(notes, "notes");
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error calling AI";
    console.error("Scan notes error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
