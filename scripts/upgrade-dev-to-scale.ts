import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  const rows = await db.execute(
    sql`SELECT id, organization_id, plan, status FROM organization_subscriptions`,
  );
  console.log("Current subscriptions:", rows.rows);

  await db.execute(
    sql`UPDATE organization_subscriptions SET plan = 'scale', status = 'active'`,
  );
  console.log("✓ All dev subscriptions upgraded to scale/active");

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
