import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

export async function isOrgOwner(orgId: string, userId: string) {
  const rows = await db
    .select({ isOwner: schema.organizationMember.isOwner })
    .from(schema.organizationMember)
    .where(
      and(
        eq(schema.organizationMember.orgId, orgId),
        eq(schema.organizationMember.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(rows[0]?.isOwner);
}

/**
 * Verifica se (userId) é membro da org.
 */
export async function ensureMembership(orgId: string, userId: string) {
  const rows = await db
    .select({ id: schema.organizationMember.id })
    .from(schema.organizationMember)
    .where(
      and(
        eq(schema.organizationMember.orgId, orgId),
        eq(schema.organizationMember.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(rows[0]);
}
