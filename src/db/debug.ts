import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { enablements } from "./schema";

async function debug() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const all = await db.select().from(enablements);
  console.log("Total enablements:", all.length);
  for (const e of all) {
    console.log(`  [${e.status}] "${e.title}" | scheduledDate: ${e.scheduledDate} | type: ${e.type} | owner: ${e.owner} | audience: ${e.audience} | priority: ${e.priority}`);
  }
}

debug().catch(console.error);
