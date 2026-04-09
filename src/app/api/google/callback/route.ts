import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { setSetting } from "@/lib/google-calendar";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.name !== "Gina Vivar") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Google token exchange failed:", err);
    return NextResponse.json(
      { error: "Token exchange failed" },
      { status: 500 }
    );
  }

  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    console.error("No refresh_token returned. User may need to re-consent.");
    return NextResponse.json(
      { error: "No refresh token received. Try revoking access and reconnecting." },
      { status: 500 }
    );
  }

  await setSetting("google_refresh_token", tokens.refresh_token);

  // Use pre-configured calendar ID if set, otherwise find/create one
  let calendarId: string | null = process.env.GOOGLE_CALENDAR_ID || null;

  if (!calendarId) {
    const accessToken = tokens.access_token as string;

    // Check existing calendars
    const listRes = await fetch(
      `${GOOGLE_CALENDAR_API}/users/me/calendarList`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (listRes.ok) {
      const listData = await listRes.json();
      const existing = listData.items?.find(
        (cal: { summary?: string; id: string }) =>
          cal.summary === "Enablement Hub"
      );
      if (existing) {
        calendarId = existing.id;
      }
    }

    // Create calendar if not found
    if (!calendarId) {
      const createRes = await fetch(`${GOOGLE_CALENDAR_API}/calendars`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: "Enablement Hub",
          description: "Enablement events synced from the Enablement Hub app",
          timeZone: "America/Los_Angeles",
        }),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        calendarId = created.id;
      } else {
        console.error("Failed to create calendar:", await createRes.text());
      }
    }
  }

  if (calendarId) {
    await setSetting("google_calendar_id", calendarId);
  }

  // Redirect back to calendar view
  const baseUrl = req.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/calendar`);
}
