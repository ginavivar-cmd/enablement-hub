import { NextResponse } from "next/server";

// Notion import is disabled — re-enable when integration is configured.
// The original implementation is preserved in git history (commit 6753729).

export async function POST() {
  return NextResponse.json(
    { error: "Notion import is coming soon." },
    { status: 503 }
  );
}
