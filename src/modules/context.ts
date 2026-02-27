import { and, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { type Session, resolveSession } from "./auth";

async function resolveOrgBySlug(slug: string) {
  const org = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.slug, slug))
    .limit(1);

  return org[0]?.id ?? null;
}

export async function resolveOrgId(
  userId?: string,
  explicitSlug?: string | null,
  explicitOrgId?: string | null,
) {
  let orgId: string | null = explicitOrgId ?? null;

  if (!orgId && explicitSlug) {
    orgId = await resolveOrgBySlug(explicitSlug.toLowerCase().trim());
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
  const explicitSlug = request.headers.get("x-org-slug");
  const explicitOrgId = request.headers.get("x-org-id");

  const orgId = await resolveOrgId(userId, explicitSlug, explicitOrgId);
  if (!orgId) throw new Error("org-not-set");
  return orgId;
}
