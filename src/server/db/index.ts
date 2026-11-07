import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schemas";

// `next build` imports this module while collecting page data, and on
// Cloudflare DATABASE_URL only exists at runtime. Creating the Pool does not
// connect, so the build can go on without it.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!process.env.DATABASE_URL && !isBuild) {
  throw new Error("DATABASE_URL is not set");
}

const queryClient = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export const db = drizzle(queryClient, { schema });

export type DbClient = typeof db;
