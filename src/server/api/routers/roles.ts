// src/server/trpc/routers/roles.ts

import { TRPCError } from "@trpc/server";
import {
  createRoleInput,
  deleteRoleInput,
  orgScopeInput,
  setRolePermsInput,
  updateRoleInput,
} from "@/validations/role.schema";
import { orgProcedure, protectedProcedure, router } from "@/server/api/trpc";

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9:_\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const rolesRouter = router({
  // List roles for an organization the user belongs to
  listByOrg: orgProcedure.input(orgScopeInput).query(async ({ ctx, input }) => {
    if (input.orgId !== ctx.orgId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const member = await ctx.prisma.organizationMember.findUnique({
      where: {
        organization_member_unique: {
          orgId: input.orgId,
          userId: ctx.session!.user.id,
        },
      },
      select: { id: true },
    });
    if (!member) throw new TRPCError({ code: "FORBIDDEN" });

    return ctx.prisma.role.findMany({
      where: { orgId: input.orgId },
      select: { id: true, name: true, key: true },
      orderBy: [{ name: "asc" }, { key: "asc" }],
    });
  }),

  // Create a role under an organization; owners or users with role:manage
  create: orgProcedure
    .input(createRoleInput)
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
        if (!ab.has("role:manage")) throw new TRPCError({ code: "FORBIDDEN" });
      }

      const key = input.key ?? slugify(input.name);

      const exists = await ctx.prisma.role.findFirst({
        where: { orgId: input.orgId, key },
        select: { id: true },
      });
      if (exists)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Key já usada nesta organização",
        });

      return ctx.prisma.role.create({
        data: { orgId: input.orgId, name: input.name, key },
        select: { id: true, name: true, key: true },
      });
    }),

  // Update role name; key is immutable
  update: protectedProcedure
    .input(updateRoleInput)
    .mutation(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        select: { orgId: true },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: role.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

      if (!membership.isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("role:manage")) throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.role.update({
        where: { id: input.roleId },
        data: { name: input.name }, // key imutável
        select: { id: true, name: true, key: true },
      });
    }),

  // Delete a role, cleaning relations; protect reserved 'owner'
  delete: protectedProcedure
    .input(deleteRoleInput)
    .mutation(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        select: { id: true, orgId: true, key: true },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: role.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

      if (!membership.isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("role:manage")) throw new TRPCError({ code: "FORBIDDEN" });
      }

      // opcional: proteja "owner" por convenção
      if (role.key === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Role 'owner' não pode ser apagada",
        });
      }

      await ctx.prisma.userRole.deleteMany({ where: { roleId: role.id } });
      await ctx.prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });
      await ctx.prisma.role.delete({ where: { id: role.id } });
      return { ok: true };
    }),

  // Get role with its permissions
  getWithPermissions: protectedProcedure
    .input(updateRoleInput.pick({ roleId: true }))
    .query(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        select: {
          id: true,
          name: true,
          key: true,
          orgId: true,
          RolePermission: {
            select: {
              permission: {
                select: { id: true, key: true, name: true, description: true },
              },
            },
          },
        },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      const member = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: role.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { id: true },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });

      const permissions = role.RolePermission.map((rp) => rp.permission);
      return {
        id: role.id,
        name: role.name,
        key: role.key,
        orgId: role.orgId,
        permissions,
      };
    }),

  // Replace role permissions set with given permission ids
  setPermissions: protectedProcedure
    .input(setRolePermsInput)
    .mutation(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        select: { id: true, orgId: true },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      const membership = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: role.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

      if (!membership.isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("role:manage")) throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });
      if (input.permissionIds.length) {
        await ctx.prisma.rolePermission.createMany({
          data: input.permissionIds.map((pid) => ({
            roleId: role.id,
            permissionId: pid,
          })),
          skipDuplicates: true,
        });
      }
      return { ok: true };
    }),
});
