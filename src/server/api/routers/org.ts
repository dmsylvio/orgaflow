import { TRPCError } from "@trpc/server";
import { assertOrgMembership } from "@/server/iam/guards/requireMember";
import {
  createOrganizationInput,
  deleteOrganizationInput,
  switchOrganizationInput,
} from "@/validations/organization.schema";
import { orgProcedure, protectedProcedure, router } from "@/server/api/trpc";

export const orgRouter = router({
  // Return the currently active organization for the session user
  current: orgProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;
    await assertOrgMembership(orgId, ctx.session!.user.id);

    const org = await ctx.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return org;
  }),

  // List organizations the user belongs to, with owner flag
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.organizationMember.findMany({
      where: { userId: ctx.session!.user.id },
      select: {
        isOwner: true,
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rows.map((row) => ({
      ...row.org,
      isOwner: row.isOwner,
    }));
  }),

  // Switch active organization
  switch: protectedProcedure
    .input(switchOrganizationInput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgMembership(input.orgId, ctx.session!.user.id);
      await ctx.prisma.user.update({
        where: { id: ctx.session!.user.id },
        data: { activeOrgId: input.orgId },
      });
      return { ok: true };
    }),

  // Create a new organization and make current user owner
  create: protectedProcedure
    .input(createOrganizationInput.pick({ name: true }))
    .mutation(async ({ ctx, input }) => {
      const base = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      let slug = base || "org";
      for (
        let i = 2;
        await ctx.prisma.organization.findUnique({ where: { slug } });
        i++
      )
        slug = `${base}-${i}`;

      const userId = ctx.session!.user.id;

      const org = await ctx.prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: input.name,
            slug,
          },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        });
        await tx.organizationMember.create({
          data: {
            orgId: org.id,
            userId,
            isOwner: true,
          },
        });
        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            activeOrgId: org.id,
          },
        });
        return org;
      });

      return { org };
    }),

  // Update organization name and slug (owner only)
  update: protectedProcedure
    .input(
      createOrganizationInput.extend({
        orgId: switchOrganizationInput.shape.orgId,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership?.isOwner) throw new TRPCError({ code: "FORBIDDEN" });

      const conflict = await ctx.prisma.organization.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (conflict && conflict.id !== input.orgId) {
        throw new TRPCError({ code: "CONFLICT", message: "Slug já em uso" });
      }

      const org = await ctx.prisma.organization.update({
        where: { id: input.orgId },
        data: { name: input.name, slug: input.slug },
        select: { id: true, name: true, slug: true },
      });
      return { org };
    }),

  // Delete organization (owner only)
  delete: protectedProcedure
    .input(deleteOrganizationInput)
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership?.isOwner) throw new TRPCError({ code: "FORBIDDEN" });

      await ctx.prisma.organization.delete({ where: { id: input.orgId } });
      return { ok: true };
    }),
});
