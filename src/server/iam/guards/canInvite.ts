import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

export async function canInviteToOrg(
  userId: string,
  orgId: string,
  getPermissions: () => Promise<Set<string>>,
) {
  // owner bypass
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
  const membership = rows[0];
  if (!membership) return false;
  if (membership.isOwner) return true;

  const perms = await getPermissions();
  // ajuste a chave conforme seu catálogo
  return perms.has("member:invite");
}
