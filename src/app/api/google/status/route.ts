import { NextResponse } from "next/server";
import { isConnected } from "@/lib/google-calendar";

export async function GET() {
  const connected = await isConnected();
  return NextResponse.json({ connected });
}
