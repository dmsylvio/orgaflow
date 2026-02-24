import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrgFromHost } from "@/lib/tenant";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { getUserAbilitiesForOrg } from "@/server/iam/ability/resolver";

const getRootDomain = () =>
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? process.env.ROOT_DOMAIN ?? null;

const getOrgIdFromSlug = async (orgSlug: string | null) => {
  if (!orgSlug) return null;
  const rows = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, orgSlug))
    .limit(1);
  return rows[0]?.id ?? null;
};

const getOrgIdFromUser = async (userId?: string) => {
  if (!userId) return null;
  const rows = await db
    .select({ activeOrgId: schema.user.activeOrgId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  return rows[0]?.activeOrgId ?? null;
};

const isMemberOfOrg = async (orgId: string, userId?: string) => {
  if (!userId) return false;
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
};

export async function createTRPCContext() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });

  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const orgSlug = getOrgFromHost(host, getRootDomain());

  const userId = session?.user?.id;
  let orgId = await getOrgIdFromSlug(orgSlug);

  if (!orgId) {
    orgId = await getOrgIdFromUser(userId);
  }

  if (orgId && !(await isMemberOfOrg(orgId, userId))) {
    orgId = null;
  }

  return {
    session,
    db,
    orgId,
    getPermissions: async () => {
      if (!userId || !orgId) return new Set<string>();
      return getUserAbilitiesForOrg(orgId, userId);
    },
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
