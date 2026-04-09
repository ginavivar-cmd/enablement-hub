import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

function extractPageId(url: string): string | null {
  // Handles URLs like:
  //   https://www.notion.so/workspace/Page-Title-abc123def456...
  //   https://www.notion.so/abc123def456...
  //   https://notion.so/workspace/abc123def456...?v=...
  //   Plain 32-char hex ID (with or without dashes)
  const cleaned = url.trim();

  // Already a raw ID (32 hex chars, with or without dashes)
  const rawId = cleaned.replace(/-/g, "");
  if (/^[a-f0-9]{32}$/i.test(rawId)) {
    return rawId;
  }

  // Extract from URL — the last 32 hex chars before any query string
  const match = cleaned.match(/([a-f0-9]{32})(?:\?|$)/i);
  if (match) return match[1];

  // Sometimes the ID is at the end of the slug separated by a dash
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

  const notion = new Client({ auth: token });

  try {
    const page = await notion.pages.retrieve({ page_id: pageId });

    if (!("properties" in page)) {
      return NextResponse.json({ error: "Not a database page" }, { status: 400 });
    }

    const props = page.properties;

    // Extract title
    let name = "";
    const titleProp = Object.values(props).find((p) => p.type === "title");
    if (titleProp && titleProp.type === "title") {
      name = titleProp.title.map((t) => t.plain_text).join("");
    }

    // Extract GA Date
    let gaDate: string | null = null;
    const gaDateProp = props["GA Date"];
    if (gaDateProp && gaDateProp.type === "date" && gaDateProp.date) {
      gaDate = gaDateProp.date.start;
    }

    // Extract Size (select)
    let size: string | null = null;
    const sizeProp = props["Size"];
    if (sizeProp && sizeProp.type === "select" && sizeProp.select) {
      size = sizeProp.select.name;
    }

    // Extract first PRD relation URL
    let prdUrl: string | null = null;
    const prdProp = props["PRD"];
    if (prdProp && prdProp.type === "relation" && prdProp.relation.length > 0) {
      const relId = prdProp.relation[0].id;
      prdUrl = `https://www.notion.so/${relId.replace(/-/g, "")}`;
    }

    // Extract first GTM Tracker relation URL
    let gtmUrl: string | null = null;
    const gtmProp = props["GTM Tracker"];
    if (gtmProp && gtmProp.type === "relation" && gtmProp.relation.length > 0) {
      const relId = gtmProp.relation[0].id;
      gtmUrl = `https://www.notion.so/${relId.replace(/-/g, "")}`;
    }

    // Build canonical Notion URL
    const notionUrl = `https://www.notion.so/${pageId}`;

    return NextResponse.json({
      name,
      gaDate,
      size,
      prdUrl,
      gtmUrl,
      notionUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Could not find page") || message.includes("object_not_found")) {
      return NextResponse.json({ error: "Page not found. Check the URL and make sure the integration has access to this page." }, { status: 404 });
    }
    if (message.includes("unauthorized") || message.includes("API token is invalid") || message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Invalid Notion token. Make sure NOTION_TOKEN is a valid Internal Integration Token (starts with ntn_ or secret_) and the integration has access to the database." }, { status: 401 });
    }
    return NextResponse.json({ error: "Could not connect to Notion. Check that NOTION_TOKEN is set in .env.local and the integration has access to the database." }, { status: 500 });
  }
}
