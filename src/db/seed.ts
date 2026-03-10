import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users } from "./schema";
import { USERS } from "../lib/constants";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Seeding users...");
  for (const user of USERS) {
    await db.insert(users).values({
      name: user.name,
      displayName: user.displayName,
    });
  }
  console.log("Done! Seeded", USERS.length, "users.");
}

seed().catch(console.error);
