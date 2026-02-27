import { and, eq } from "drizzle-orm";
import type { Elysia } from "elysia";
import { db, schema } from "../db";
import { preconditionFailed, unauthorized } from "../lib/http";
import { requireAuth, requireOrg } from "../modules/context";

export function registerMeRoutes(app: Elysia<"/api">) {
  return app
    .get("/me", async ({ request }) => {
      try {
        const session = await requireAuth(request);
        const orgId = await requireOrg(request, session.userId);

        const user = await db
          .select({
            id: schema.user.id,
            email: schema.user.email,
            name: schema.user.name,
            activeOrgId: schema.user.activeOrgId,
          })
          .from(schema.user)
          .where(eq(schema.user.id, session.userId))
          .limit(1);

        const membership = await db
          .select({ isOwner: schema.organizationMember.isOwner })
          .from(schema.organizationMember)
          .where(
            and(
              eq(schema.organizationMember.orgId, orgId),
              eq(schema.organizationMember.userId, session.userId),
            ),
          )
          .limit(1);

        return { ...user[0], membership: membership[0] ?? null };
      } catch (error) {
        if (error instanceof Error && error.message === "org-not-set") {
          return preconditionFailed("Organization not set");
        }
        return unauthorized();
      }
    })
    .get("/me/permissions", async ({ request }) => {
      try {
        const session = await requireAuth(request);
        const orgId = await requireOrg(request, session.userId);

        const member = await db
          .select({ isOwner: schema.organizationMember.isOwner })
          .from(schema.organizationMember)
          .where(
            and(
              eq(schema.organizationMember.orgId, orgId),
              eq(schema.organizationMember.userId, session.userId),
            ),
          )
          .limit(1);

        const isOwner = member[0]?.isOwner === true;
        return isOwner
          ? ["*"]
          : [
              "dashboard:access",
              "customer:view",
              "customer:create",
              "customer:edit",
              "customer:delete",
            ];
      } catch {
        return unauthorized();
      }
    });
}
