import { and, eq } from "drizzle-orm";
import type { Elysia } from "elysia";
import { db, schema } from "../db";
import { badRequest, forbidden, notFound, unauthorized } from "../lib/http";
import { requireAuth, requireOrg } from "../modules/context";
import {
  orgCreateSchema,
  orgDeleteSchema,
  orgSwitchSchema,
  orgUpdateSchema,
} from "../validation";

export function registerOrgRoutes(app: Elysia) {
  return app
    .get("/org", async ({ request }) => {
      try {
        const session = await requireAuth(request);
        const rows = await db
          .select({
            id: schema.organization.id,
            name: schema.organization.name,
            slug: schema.organization.slug,
            isOwner: schema.organizationMember.isOwner,
          })
          .from(schema.organizationMember)
          .innerJoin(
            schema.organization,
            eq(schema.organizationMember.orgId, schema.organization.id),
          )
          .where(eq(schema.organizationMember.userId, session.userId));

        return rows;
      } catch {
        return unauthorized();
      }
    })
    .get("/org/current", async ({ request }) => {
      try {
        const session = await requireAuth(request);
        const orgId = await requireOrg(request, session.userId);

        const org = await db
          .select({
            id: schema.organization.id,
            name: schema.organization.name,
            slug: schema.organization.slug,
          })
          .from(schema.organization)
          .where(eq(schema.organization.id, orgId))
          .limit(1);

        if (!org[0]) return notFound("Organization not found");
        return org[0];
      } catch {
        return unauthorized();
      }
    })
    .post("/org/switch", async ({ request, body }) => {
      try {
        const session = await requireAuth(request);
        const input = orgSwitchSchema.parse(body);

        const member = await db
          .select({ id: schema.organizationMember.id })
          .from(schema.organizationMember)
          .where(
            and(
              eq(schema.organizationMember.orgId, input.orgId),
              eq(schema.organizationMember.userId, session.userId),
            ),
          )
          .limit(1);

        if (!member[0]) return forbidden();

        await db
          .update(schema.user)
          .set({ activeOrgId: input.orgId })
          .where(eq(schema.user.id, session.userId));

        return { ok: true };
      } catch {
        return badRequest();
      }
    })
    .post("/org", async ({ request, body }) => {
      try {
        const session = await requireAuth(request);
        const input = orgCreateSchema.parse(body);

        const [org] = await db
          .insert(schema.organization)
          .values({ name: input.name, slug: input.slug })
          .returning({
            id: schema.organization.id,
            name: schema.organization.name,
            slug: schema.organization.slug,
          });

        if (!org) return notFound("Failed to create organization");

        await db.insert(schema.organizationMember).values({
          orgId: org.id,
          userId: session.userId,
          isOwner: true,
        });

        await db
          .update(schema.user)
          .set({ activeOrgId: org.id })
          .where(eq(schema.user.id, session.userId));

        return { org };
      } catch {
        return badRequest();
      }
    })
    .patch("/org", async ({ request, body }) => {
      try {
        const session = await requireAuth(request);
        const input = orgUpdateSchema.parse(body);

        const member = await db
          .select({ isOwner: schema.organizationMember.isOwner })
          .from(schema.organizationMember)
          .where(
            and(
              eq(schema.organizationMember.orgId, input.orgId),
              eq(schema.organizationMember.userId, session.userId),
            ),
          )
          .limit(1);

        if (!member[0]?.isOwner) return forbidden();

        await db
          .update(schema.organization)
          .set({ name: input.name, slug: input.slug })
          .where(eq(schema.organization.id, input.orgId));

        return { org: { id: input.orgId, name: input.name, slug: input.slug } };
      } catch {
        return badRequest();
      }
    })
    .delete("/org", async ({ request, body }) => {
      try {
        const session = await requireAuth(request);
        const input = orgDeleteSchema.parse(body);

        const member = await db
          .select({ isOwner: schema.organizationMember.isOwner })
          .from(schema.organizationMember)
          .where(
            and(
              eq(schema.organizationMember.orgId, input.orgId),
              eq(schema.organizationMember.userId, session.userId),
            ),
          )
          .limit(1);

        if (!member[0]?.isOwner) return forbidden();

        await db
          .delete(schema.organization)
          .where(eq(schema.organization.id, input.orgId));

        return { ok: true };
      } catch {
        return badRequest();
      }
    });
}
