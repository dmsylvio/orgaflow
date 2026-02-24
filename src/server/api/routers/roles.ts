// src/server/trpc/routers/roles.ts

import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { orgProcedure, protectedProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";
import {
  createRoleInput,
  deleteRoleInput,
  orgScopeInput,
  setRolePermsInput,
  updateRoleInput,
} from "@/validations/role.schema";

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
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });
    }

    const member = await ctx.db
      .select({ id: schema.organizationMember.id })
      .from(schema.organizationMember)
      .where(
        and(
          eq(schema.organizationMember.orgId, input.orgId),
          eq(schema.organizationMember.userId, ctx.session?.user.id),
        ),
      )
      .limit(1);
    if (!member[0])
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });

    return ctx.db
      .select({
        id: schema.role.id,
        name: schema.role.name,
        key: schema.role.key,
      })
      .from(schema.role)
      .where(eq(schema.role.orgId, input.orgId))
      .orderBy(asc(schema.role.name), asc(schema.role.key));
  }),

  // Create a role under an organization; owners or users with role:manage
  create: orgProcedure
    .input(createRoleInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      }

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, ctx.session?.user.id),
          ),
        )
        .limit(1);
      if (!membership[0])
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      if (!membership[0].isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("role:manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      const key = input.key ?? slugify(input.name);

      const exists = await ctx.db
        .select({ id: schema.role.id })
        .from(schema.role)
        .where(
          and(eq(schema.role.orgId, input.orgId), eq(schema.role.key, key)),
        )
        .limit(1);
      if (exists[0])
        throw new TRPCError({
          code: "CONFLICT",
          message: "Key already in use in this organization",
        });

      const id = randomUUID();
      await ctx.db.insert(schema.role).values({
        id,
        orgId: input.orgId,
        name: input.name,
        key,
      });

      return { id, name: input.name, key };
    }),

  // Update role name; key is immutable
  update: protectedProcedure
    .input(updateRoleInput)
    .mutation(async ({ ctx, input }) => {
      const roleRows = await ctx.db
        .select({ id: schema.role.id, orgId: schema.role.orgId })
        .from(schema.role)
        .where(eq(schema.role.id, input.roleId))
        .limit(1);
      const role = roleRows[0];
      if (!role)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role not found",
        });

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, role.orgId),
            eq(schema.organizationMember.userId, ctx.session?.user.id),
          ),
        )
        .limit(1);
      if (!membership[0])
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      if (!membership[0].isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("role:manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      await ctx.db
        .update(schema.role)
        .set({ name: input.name })
        .where(eq(schema.role.id, input.roleId));

      return { id: input.roleId, name: input.name };
    }),

  // Delete a role, cleaning relations; protect reserved 'owner'
  delete: protectedProcedure
    .input(deleteRoleInput)
    .mutation(async ({ ctx, input }) => {
      const roleRows = await ctx.db
        .select({
          id: schema.role.id,
          orgId: schema.role.orgId,
          key: schema.role.key,
        })
        .from(schema.role)
        .where(eq(schema.role.id, input.roleId))
        .limit(1);
      const role = roleRows[0];
      if (!role)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role not found",
        });

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, role.orgId),
            eq(schema.organizationMember.userId, ctx.session?.user.id),
          ),
        )
        .limit(1);
      if (!membership[0])
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      if (!membership[0].isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("role:manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      if (role.key === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Role 'owner' cannot be deleted",
        });
      }

      await ctx.db
        .delete(schema.userRole)
        .where(eq(schema.userRole.roleId, role.id));
      await ctx.db
        .delete(schema.rolePermission)
        .where(eq(schema.rolePermission.roleId, role.id));
      await ctx.db.delete(schema.role).where(eq(schema.role.id, role.id));

      return { ok: true };
    }),

  // Get role with its permissions
  getWithPermissions: protectedProcedure
    .input(updateRoleInput.pick({ roleId: true }))
    .query(async ({ ctx, input }) => {
      const roleRows = await ctx.db
        .select({
          id: schema.role.id,
          name: schema.role.name,
          key: schema.role.key,
          orgId: schema.role.orgId,
        })
        .from(schema.role)
        .where(eq(schema.role.id, input.roleId))
        .limit(1);
      const role = roleRows[0];
      if (!role)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role not found",
        });

      const member = await ctx.db
        .select({ id: schema.organizationMember.id })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, role.orgId),
            eq(schema.organizationMember.userId, ctx.session?.user.id),
          ),
        )
        .limit(1);
      if (!member[0])
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      const perms = await ctx.db
        .select({
          id: schema.permission.id,
          key: schema.permission.key,
          name: schema.permission.name,
          description: schema.permission.description,
        })
        .from(schema.rolePermission)
        .innerJoin(
          schema.permission,
          eq(schema.rolePermission.permissionId, schema.permission.id),
        )
        .where(eq(schema.rolePermission.roleId, role.id));

      return {
        ...role,
        permissions: perms,
      };
    }),

  // Replace role permissions set with given permission ids
  setPermissions: protectedProcedure
    .input(setRolePermsInput)
    .mutation(async ({ ctx, input }) => {
      const roleRows = await ctx.db
        .select({ id: schema.role.id, orgId: schema.role.orgId })
        .from(schema.role)
        .where(eq(schema.role.id, input.roleId))
        .limit(1);
      const role = roleRows[0];
      if (!role)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role not found",
        });

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, role.orgId),
            eq(schema.organizationMember.userId, ctx.session?.user.id),
          ),
        )
        .limit(1);
      if (!membership[0])
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      if (!membership[0].isOwner) {
        const ab = await ctx.getPermissions();
        if (!ab.has("role:manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      if (input.permissionIds.length) {
        const perms = await ctx.db
          .select({ id: schema.permission.id })
          .from(schema.permission)
          .where(inArray(schema.permission.id, input.permissionIds));
        if (perms.length !== input.permissionIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more invalid permissions",
          });
        }
      }

      await ctx.db
        .delete(schema.rolePermission)
        .where(eq(schema.rolePermission.roleId, role.id));

      if (input.permissionIds.length) {
        await ctx.db.insert(schema.rolePermission).values(
          input.permissionIds.map((permissionId) => ({
            id: randomUUID(),
            roleId: role.id,
            permissionId,
          })),
        );
      }

      return { ok: true };
    }),
});
