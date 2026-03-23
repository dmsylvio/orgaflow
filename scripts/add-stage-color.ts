import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  await db.execute(sql`
    ALTER TABLE task_stages ADD COLUMN IF NOT EXISTS color text;
  `);

  console.log("✓ Added color column to task_stages");
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
