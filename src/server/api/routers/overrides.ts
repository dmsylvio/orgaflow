import { TRPCError } from "@trpc/server";
import {
  createOverrideInput,
  deleteOverrideInput,
  listOverridesByUserInput,
  updateOverrideInput,
} from "@/validations/override.schema";
import { orgProcedure, protectedProcedure, router } from "@/server/api/trpc";

export const overridesRouter = router({
  // List permission overrides for a user within an organization
  listByUser: orgProcedure
    .input(listOverridesByUserInput)
    .query(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

      if (!membership.isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("permission:override:manage"))
          throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.userPermissionOverride.findMany({
        where: { orgId: input.orgId, userId: input.userId },
        select: {
          id: true,
          mode: true,
          permission: { select: { id: true, key: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // Create a new override for a user in an organization
  create: orgProcedure
    .input(createOverrideInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      if (!membership.isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("permission:override:manage"))
          throw new TRPCError({ code: "FORBIDDEN" });
      }

      // validate target membership and permission existence
      const isMember = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: input.userId,
          },
        },
        select: { id: true },
      });
      if (!isMember)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não é membro",
        });

      const perm = await ctx.prisma.permission.findUnique({
        where: { id: input.permissionId },
        select: { id: true },
      });
      if (!perm)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Permissão inválida",
        });

      const created = await ctx.prisma.userPermissionOverride.create({
        data: {
          orgId: input.orgId,
          userId: input.userId,
          permissionId: input.permissionId,
          mode: input.mode,
        },
        select: { id: true },
      });
      return created;
    }),

  // Update override mode
  update: protectedProcedure
    .input(updateOverrideInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.userPermissionOverride.findUnique({
        where: { id: input.id },
        select: { orgId: true },
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: row.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      if (!membership.isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("permission:override:manage"))
          throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.prisma.userPermissionOverride.update({
        where: { id: input.id },
        data: { mode: input.mode },
      });
      return { ok: true };
    }),

  // Delete an override
  delete: protectedProcedure
    .input(deleteOverrideInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.userPermissionOverride.findUnique({
        where: { id: input.id },
        select: { orgId: true },
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: row.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      if (!membership.isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("permission:override:manage"))
          throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.prisma.userPermissionOverride.delete({
        where: { id: input.id },
      });
      return { ok: true };
    }),
});
