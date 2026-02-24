import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { orgProcedure, protectedProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";
import {
  createOrganizationInput,
  deleteOrganizationInput,
  switchOrganizationInput,
} from "@/validations/organization.schema";

export const orgRouter = router({
  // Return the currently active organization for the session user
  current: orgProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;

    const rows = await ctx.db
      .select({
        id: schema.organization.id,
        name: schema.organization.name,
        slug: schema.organization.slug,
      })
      .from(schema.organization)
      .where(eq(schema.organization.id, orgId))
      .limit(1);

    const org = rows[0];
    if (!org)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    return org;
  }),

  // List organizations the user belongs to, with owner flag
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user.id;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const rows = await ctx.db
      .select({
        isOwner: schema.organizationMember.isOwner,
        orgId: schema.organization.id,
        name: schema.organization.name,
        slug: schema.organization.slug,
      })
      .from(schema.organizationMember)
      .innerJoin(
        schema.organization,
        eq(schema.organizationMember.orgId, schema.organization.id),
      )
      .where(eq(schema.organizationMember.userId, userId))
      .orderBy(asc(schema.organizationMember.createdAt));

    return rows.map((row) => ({
      id: row.orgId,
      name: row.name,
      slug: row.slug,
      isOwner: row.isOwner,
    }));
  }),

  // Switch active organization
  switch: protectedProcedure
    .input(switchOrganizationInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const membership = await ctx.db
        .select({ id: schema.organizationMember.id })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, userId),
          ),
        )
        .limit(1);
      if (!membership[0])
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      await ctx.db
        .update(schema.user)
        .set({ activeOrgId: input.orgId })
        .where(eq(schema.user.id, userId));
      return { ok: true };
    }),

  // Create a new organization and make current user owner
  create: protectedProcedure
    .input(createOrganizationInput)
    .mutation(async ({ ctx, input }) => {
      const base = input.slug
        ? input.slug
        : input.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
      let slug = base || "org";
      for (
        let i = 2;
        (
          await ctx.db
            .select({ id: schema.organization.id })
            .from(schema.organization)
            .where(eq(schema.organization.slug, slug))
            .limit(1)
        )[0];
        i++
      )
        slug = `${base}-${i}`;

      const userId = ctx.session?.user.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const orgId = randomUUID();

      await ctx.db.transaction(async (tx) => {
        await tx.insert(schema.organization).values({
          id: orgId,
          name: input.name,
          slug,
        });
        await tx.insert(schema.organizationMember).values({
          id: randomUUID(),
          orgId,
          userId,
          isOwner: true,
        });
        await tx
          .update(schema.user)
          .set({ activeOrgId: orgId })
          .where(eq(schema.user.id, userId));
      });

      return { org: { id: orgId, name: input.name, slug } };
    }),

  // Update organization name and slug (owner only)
  update: protectedProcedure
    .input(
      createOrganizationInput.extend({
        orgId: switchOrganizationInput.shape.orgId,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, userId),
          ),
        )
        .limit(1);
      if (!membership[0]?.isOwner)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      const conflict = await ctx.db
        .select({ id: schema.organization.id })
        .from(schema.organization)
        .where(eq(schema.organization.slug, input.slug))
        .limit(1);
      if (conflict[0] && conflict[0].id !== input.orgId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Slug already in use",
        });
      }

      await ctx.db
        .update(schema.organization)
        .set({ name: input.name, slug: input.slug })
        .where(eq(schema.organization.id, input.orgId));

      return { org: { id: input.orgId, name: input.name, slug: input.slug } };
    }),

  // Delete organization (owner only)
  delete: protectedProcedure
    .input(deleteOrganizationInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, userId),
          ),
        )
        .limit(1);
      if (!membership[0]?.isOwner)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      await ctx.db
        .delete(schema.organization)
        .where(eq(schema.organization.id, input.orgId));
      return { ok: true };
    }),
});
