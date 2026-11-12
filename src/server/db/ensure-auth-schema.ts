import { sql } from "drizzle-orm";
import { ENSURE_AUTH_SCHEMA_STATEMENTS } from "./auth-schema-sql";

/**
 * Makes sure the Better Auth tables exist before the app serves requests.
 * Without them, magic links and password resets fail with a 500 (the
 * production database wasn't migrated when Better Auth shipped). Runs in a
 * transaction under an advisory lock so concurrent instances don't race.
 */
export async function ensureAuthSchema() {
  const { db } = await import("./index");
  const started = Date.now();

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(784512903)`);
    for (const statement of ENSURE_AUTH_SCHEMA_STATEMENTS) {
      await tx.execute(sql.raw(statement));
    }
  });

  console.log(`[db] Auth schema verified in ${Date.now() - started}ms`);
}
