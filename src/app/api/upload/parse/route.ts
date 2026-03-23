import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".pdf")) {
      // Import pdf-parse/lib/pdf-parse directly to avoid test file issue
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse");
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, DOCX, TXT, or MD." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: text.trim(), fileName: file.name });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to parse file";
    console.error("File parse error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
