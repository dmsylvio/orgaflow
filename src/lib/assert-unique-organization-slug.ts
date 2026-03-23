import "server-only";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import { organizations } from "@/server/db/schemas";

/**
 * Garante um `slug` único na tabela `organizations`, com sufixo aleatório se necessário.
 */
export async function assertUniqueOrganizationSlug(
  db: DbClient,
  base: string,
): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const candidate =
      i === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.slug, candidate),
    });
    if (!existing) return candidate;
  }
  return `${base}-${randomBytes(4).toString("hex")}`;
}
