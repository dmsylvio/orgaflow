import "dotenv/config";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schemas";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

function createDb(max: number) {
  return drizzle(
    new Pool({ connectionString: process.env.DATABASE_URL, max }),
    { schema },
  );
}

/** Long-lived instance: used on Node (dev / `next start` / Vercel). */
const nodeDb = createDb(10);

type Db = typeof nodeDb;

/**
 * On Cloudflare Workers, a TCP socket opened while serving one request cannot
 * be used from another request: the runtime cancels the second request with
 * "Worker's code had hung" (surfaced to users as "Server failed to respond").
 * A module-level Pool is therefore unsafe, so there we keep one Pool per
 * request, keyed by the request's ExecutionContext.
 */
const workerDbs = new WeakMap<object, Db>();

function resolveDb(): Db {
  let ctx: object | undefined;
  try {
    ctx = getCloudflareContext().ctx;
  } catch {
    // Not running inside a Cloudflare request (Node runtime, build, scripts).
  }
  if (!ctx) return nodeDb;

  let requestDb = workerDbs.get(ctx);
  if (!requestDb) {
    requestDb = createDb(5);
    workerDbs.set(ctx, requestDb);
  }
  return requestDb;
}

/**
 * Proxy so existing `import { db }` call sites keep working unchanged.
 * `nodeDb` is the proxy target so `is(db, PgDatabase)` checks (used by the
 * Auth.js Drizzle adapter) still pass; its pool never connects on Workers.
 */
export const db: Db = new Proxy(nodeDb, {
  get(_target, prop) {
    const current = resolveDb();
    const value = Reflect.get(current, prop, current);
    return typeof value === "function" ? value.bind(current) : value;
  },
});

export type DbClient = typeof db;
