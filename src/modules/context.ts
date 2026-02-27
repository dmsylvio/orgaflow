import { and, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { getOrgFromHost } from "../tenant";
import { type Session, resolveSession } from "./auth";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "";

export async function resolveOrgId(host: string | null, userId?: string) {
  const slug = getOrgFromHost(host, ROOT_DOMAIN);
  let orgId: string | null = null;

  if (slug) {
    const org = await db
      .select({ id: schema.organization.id })
      .from(schema.organization)
      .where(eq(schema.organization.slug, slug))
      .limit(1);
    orgId = org[0]?.id ?? null;
  }

  if (!orgId && userId) {
    const usr = await db
      .select({ activeOrgId: schema.user.activeOrgId })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);
    orgId = usr[0]?.activeOrgId ?? null;
  }

  if (orgId && userId) {
    const member = await db
      .select({ id: schema.organizationMember.id })
      .from(schema.organizationMember)
      .where(
        and(
          eq(schema.organizationMember.orgId, orgId),
          eq(schema.organizationMember.userId, userId),
        ),
      )
      .limit(1);

    if (!member[0]) return null;
  }

  return orgId;
}

export async function requireAuth(request: Request): Promise<NonNullable<Session>> {
  const session = await resolveSession(request.headers.get("authorization"));
  if (!session) throw new Error("unauthorized");
  return session;
}

export async function requireOrg(request: Request, userId: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const orgId = await resolveOrgId(host, userId);
  if (!orgId) throw new Error("org-not-set");
  return orgId;
}
