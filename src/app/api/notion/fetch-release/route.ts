import { NextRequest, NextResponse } from "next/server";

function extractPageId(url: string): string | null {
  const cleaned = url.trim();

  const rawId = cleaned.replace(/-/g, "");
  if (/^[a-f0-9]{32}$/i.test(rawId)) return rawId;

  const match = cleaned.match(/([a-f0-9]{32})(?:\?|$)/i);
  if (match) return match[1];

  const slugMatch = cleaned.match(/([a-f0-9]{8})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{12})(?:\?|$)/i);
  if (slugMatch) return slugMatch.slice(1).join("");

  return null;
}

export async function POST(req: NextRequest) {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Notion integration not configured. Add NOTION_TOKEN to .env.local (create one at notion.so/profile/integrations)." },
      { status: 500 }
    );
  }

  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  const pageId = extractPageId(url);
  if (!pageId) {
    return NextResponse.json({ error: "Could not extract Notion page ID from URL" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const code = body.code || "";
      if (res.status === 401 || code === "unauthorized") {
        return NextResponse.json({ error: "Invalid Notion token. Make sure NOTION_TOKEN is a valid Internal Integration Token (starts with ntn_ or secret_) and the integration has access to the database." }, { status: 401 });
      }
      if (res.status === 404 || code === "object_not_found") {
        return NextResponse.json({ error: "Page not found. Check the URL and make sure the integration has access to this page." }, { status: 404 });
      }
      return NextResponse.json({ error: body.message || "Notion API error" }, { status: res.status });
    }

    const page = await res.json();
    const props = page.properties || {};

    // Extract title
    let name = "";
    const titleProp = Object.values(props).find((p: unknown) => (p as { type: string }).type === "title") as { type: "title"; title: { plain_text: string }[] } | undefined;
    if (titleProp) {
      name = titleProp.title.map((t) => t.plain_text).join("");
    }

    // Extract GA Date
    let gaDate: string | null = null;
    const gaDateProp = props["GA Date"] as { type: string; date?: { start: string } | null } | undefined;
    if (gaDateProp?.type === "date" && gaDateProp.date) {
      gaDate = gaDateProp.date.start;
    }

    // Extract Size (select)
    let size: string | null = null;
    const sizeProp = props["Size"] as { type: string; select?: { name: string } | null } | undefined;
    if (sizeProp?.type === "select" && sizeProp.select) {
      size = sizeProp.select.name;
    }

    // Extract first PRD relation URL
    let prdUrl: string | null = null;
    const prdProp = props["PRD"] as { type: string; relation?: { id: string }[] } | undefined;
    if (prdProp?.type === "relation" && prdProp.relation && prdProp.relation.length > 0) {
      prdUrl = `https://www.notion.so/${prdProp.relation[0].id.replace(/-/g, "")}`;
    }

    // Extract first GTM Tracker relation URL
    let gtmUrl: string | null = null;
    const gtmProp = props["GTM Tracker"] as { type: string; relation?: { id: string }[] } | undefined;
    if (gtmProp?.type === "relation" && gtmProp.relation && gtmProp.relation.length > 0) {
      gtmUrl = `https://www.notion.so/${gtmProp.relation[0].id.replace(/-/g, "")}`;
    }

    const notionUrl = `https://www.notion.so/${pageId}`;

    return NextResponse.json({ name, gaDate, size, prdUrl, gtmUrl, notionUrl });
  } catch {
    return NextResponse.json({ error: "Could not connect to Notion. Check that NOTION_TOKEN is set in .env.local and the integration has access to the database." }, { status: 500 });
  }
}
