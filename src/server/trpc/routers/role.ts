import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { rolePermissions, roles } from "@/server/db/schemas";
import { isPermissionKey, type PermissionKey } from "@/server/iam";
import {
  getAssignablePermissionGroups,
  prepareRolePermissionsForSave,
} from "@/server/iam/role-utils";
import { createTRPCRouter, ownerProcedure } from "@/server/trpc/init";

const roleKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Key may only contain lowercase letters, numbers, and hyphens.",
  );

const roleIdInput = z.object({ id: z.string().min(1) });

const createRoleInput = z.object({
  key: roleKeySchema,
  name: z.string().min(1).max(255),
  permissions: z.array(z.string()),
});

const updateRoleInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255).optional(),
  permissions: z.array(z.string()).optional(),
});

function parsePermissionKeys(raw: string[]): PermissionKey[] {
  return raw.filter((p): p is PermissionKey => isPermissionKey(p));
}

export const roleRouter = createTRPCRouter({
  assignablePermissionGroups: ownerProcedure.query(() => {
    return getAssignablePermissionGroups();
  }),

  list: ownerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: roles.id,
        key: roles.key,
        name: roles.name,
        isSystem: roles.isSystem,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .where(eq(roles.organizationId, ctx.organizationId));
  }),

  byId: ownerProcedure.input(roleIdInput).query(async ({ ctx, input }) => {
    const [role] = await ctx.db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.id, input.id),
          eq(roles.organizationId, ctx.organizationId),
        ),
      )
      .limit(1);

    if (!role) {
      return null;
    }

    const perms = await ctx.db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, role.id));

    return {
      ...role,
      permissions: perms
        .map((p) => p.permission)
        .filter((p): p is PermissionKey => isPermissionKey(p)),
    };
  }),

  create: ownerProcedure
    .input(createRoleInput)
    .mutation(async ({ ctx, input }) => {
      const parsed = parsePermissionKeys(input.permissions);
      const normalized = prepareRolePermissionsForSave(parsed);

      const [duplicate] = await ctx.db
        .select({ id: roles.id })
        .from(roles)
        .where(
          and(
            eq(roles.organizationId, ctx.organizationId),
            eq(roles.key, input.key),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A role with key "${input.key}" already exists.`,
        });
      }

      const [created] = await ctx.db
        .insert(roles)
        .values({
          organizationId: ctx.organizationId,
          key: input.key,
          name: input.name,
          isSystem: false,
        })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create the role.",
        });
      }

      if (normalized.length > 0) {
        await ctx.db.insert(rolePermissions).values(
          normalized.map((permission) => ({
            roleId: created.id,
            permission,
          })),
        );
      }

      return created;
    }),

  update: ownerProcedure
    .input(updateRoleInput)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.id, input.id),
            eq(roles.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role not found.",
        });
      }

      if (input.name !== undefined) {
        await ctx.db
          .update(roles)
          .set({ name: input.name, updatedAt: new Date() })
          .where(eq(roles.id, existing.id));
      }

      if (input.permissions !== undefined) {
        const parsed = parsePermissionKeys(input.permissions);
        const normalized = prepareRolePermissionsForSave(parsed);

        await ctx.db
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, existing.id));

        if (normalized.length > 0) {
          await ctx.db.insert(rolePermissions).values(
            normalized.map((permission) => ({
              roleId: existing.id,
              permission,
            })),
          );
        }
      }

      return { ok: true as const };
    }),

  delete: ownerProcedure.input(roleIdInput).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.id, input.id),
          eq(roles.organizationId, ctx.organizationId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Role not found.",
      });
    }

    if (existing.isSystem) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "System roles cannot be deleted.",
      });
    }

    await ctx.db.delete(roles).where(eq(roles.id, existing.id));

    return { ok: true as const };
  }),
});
