import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

/**
 * Backfills `drizzle.__drizzle_migrations` for migrations whose objects were
 * applied via `db:push` (which does not record history). Without this,
 * `drizzle-kit migrate` replays them, hits "already exists" and aborts before
 * reaching newer migrations.
 *
 * Every migration is verified against live catalog state before being recorded,
 * so nothing genuinely unapplied is ever skipped. Pass `--apply` to write.
 */
const MIGRATIONS: MigrationToRepair[] = [
  {
    tag: "0014_recurring_invoices",
    when: 1775300000000,
    tables: ["recurring_invoice_templates", "recurring_invoice_template_items"],
    types: ["recurring_frequency", "recurring_limit_type", "recurring_status"],
    columns: [["invoices", "recurring_template_id"]],
  },
  {
    tag: "0015_curious_newton_destine",
    when: 1775309170847,
    tables: ["recurring_invoice_templates", "recurring_invoice_template_items"],
    types: ["recurring_frequency", "recurring_limit_type", "recurring_status"],
    columns: [
      ["invoices", "recurring_template_id"],
      ["automation_rules", "attach_document"],
      ["tasks", "linked_document_type"],
    ],
  },
  {
    tag: "0016_natural_lizard",
    when: 1777301121131,
    tables: ["user_email_preferences"],
    types: [],
    columns: [
      ["organization_preferences", "invoice_template"],
      ["organization_preferences", "estimate_template"],
      ["organizations", "logo_url"],
    ],
  },
  {
    tag: "0017_confused_killmonger",
    when: 1785949034878,
    tables: ["appointments", "schedule_series"],
    types: [
      "appointment_status",
      "schedule_billing_mode",
      "schedule_billing_period",
      "schedule_billing_trigger",
      "schedule_frequency",
      "schedule_series_status",
    ],
    columns: [],
  },
];

/** Postgres codes meaning "this object is already there". */
const ALREADY_EXISTS = new Set(["42P07", "42701", "42710", "42P06"]);

async function main() {
  const apply = process.argv.includes("--apply");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const recorded = await client.query<{ hash: string }>(
    "select hash from drizzle.__drizzle_migrations",
  );
  const recordedHashes = new Set(recorded.rows.map((r) => r.hash));

  const pending: Array<{ tag: string; hash: string; when: number }> = [];

  for (const migration of MIGRATIONS) {
    const file = path.join("drizzle", `${migration.tag}.sql`);
    const sql = await readFile(file, "utf8");
    const hash = createHash("sha256").update(sql).digest("hex");

    if (recordedHashes.has(hash)) {
      console.log(`${migration.tag}: already recorded, skipping`);
      continue;
    }

    let missing = await findMissingObjects(client, migration);
    if (missing.length > 0) {
      if (!apply) {
        console.log(
          `${migration.tag}: incomplete — missing ${missing.join(", ")} (would apply)`,
        );
        continue;
      }

      console.log(`${migration.tag}: applying missing objects`);
      await applyIdempotently(client, sql);

      missing = await findMissingObjects(client, migration);
      if (missing.length > 0) {
        throw new Error(
          `${migration.tag}: still missing after apply: ${missing.join(", ")}`,
        );
      }
    }

    console.log(`${migration.tag}: objects verified present`);
    pending.push({ tag: migration.tag, hash, when: migration.when });
  }

  if (pending.length === 0) {
    console.log("\nnothing to backfill");
  } else if (!apply) {
    console.log(
      `\nwould record ${pending.length} migration(s); rerun with --apply`,
    );
  } else {
    for (const entry of pending) {
      await client.query(
        "insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)",
        [entry.hash, entry.when],
      );
      console.log(`recorded ${entry.tag}`);
    }
  }

  await client.end();
}

/**
 * Runs each statement on its own so a partially applied migration can be
 * completed: statements whose objects already exist are skipped rather than
 * aborting the run.
 */
async function applyIdempotently(client: Client, sql: string) {
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await client.query(statement);
      console.log(`    applied: ${summarize(statement)}`);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code && ALREADY_EXISTS.has(code)) {
        console.log(`    skipped (exists): ${summarize(statement)}`);
        continue;
      }
      throw error;
    }
  }
}

function summarize(statement: string) {
  return statement.replace(/\s+/g, " ").slice(0, 70);
}

async function findMissingObjects(
  client: Client,
  migration: MigrationToRepair,
): Promise<string[]> {
  const missing: string[] = [];

  for (const table of migration.tables) {
    const result = await client.query(
      `select 1 from information_schema.tables
       where table_schema = 'public' and table_name = $1`,
      [table],
    );
    if (result.rowCount === 0) missing.push(`table ${table}`);
  }

  for (const type of migration.types) {
    const result = await client.query(
      "select 1 from pg_type where typname = $1",
      [type],
    );
    if (result.rowCount === 0) missing.push(`type ${type}`);
  }

  for (const [table, column] of migration.columns) {
    const result = await client.query(
      `select 1 from information_schema.columns
       where table_schema = 'public' and table_name = $1 and column_name = $2`,
      [table, column],
    );
    if (result.rowCount === 0) missing.push(`column ${table}.${column}`);
  }

  return missing;
}

interface MigrationToRepair {
  tag: string;
  when: number;
  tables: string[];
  types: string[];
  columns: Array<[string, string]>;
}

main().catch((error) => {
  console.error("FAILED:", error);
  process.exit(1);
});
