import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { orgProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";
import {
  createOverrideInput,
  deleteOverrideInput,
  listOverridesByUserInput,
  updateOverrideInput,
} from "@/validations/override.schema";

export const overridesRouter = router({
  // List permission overrides for a user within an organization
  listByUser: orgProcedure
    .input(listOverridesByUserInput)
    .query(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, ctx.session!.user.id),
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
        if (!ab.has("permission:override:manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      const rows = await ctx.db
        .select({
          id: schema.userPermissionOverride.id,
          mode: schema.userPermissionOverride.mode,
          permissionId: schema.permission.id,
          key: schema.permission.key,
          name: schema.permission.name,
        })
        .from(schema.userPermissionOverride)
        .innerJoin(
          schema.permission,
          eq(schema.userPermissionOverride.permissionId, schema.permission.id),
        )
        .where(
          and(
            eq(schema.userPermissionOverride.orgId, input.orgId),
            eq(schema.userPermissionOverride.userId, input.userId),
          ),
        )
        .orderBy(schema.userPermissionOverride.createdAt);

      return rows.map((r) => ({
        id: r.id,
        mode: r.mode,
        permission: { id: r.permissionId, key: r.key, name: r.name },
      }));
    }),

  // Create a new override for a user in an organization
  create: orgProcedure
    .input(createOverrideInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, ctx.session!.user.id),
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
        if (!ab.has("permission:override:manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      const isMember = await ctx.db
        .select({ id: schema.organizationMember.id })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, input.userId),
          ),
        )
        .limit(1);
      if (!isMember[0])
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not a member of the organization",
        });

      const perm = await ctx.db
        .select({ id: schema.permission.id })
        .from(schema.permission)
        .where(eq(schema.permission.id, input.permissionId))
        .limit(1);
      if (!perm[0])
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid permission",
        });

      const id = randomUUID();
      await ctx.db.insert(schema.userPermissionOverride).values({
        id,
        orgId: input.orgId,
        userId: input.userId,
        permissionId: input.permissionId,
        mode: input.mode,
      });

      return { id };
    }),

  // Update override mode
  update: orgProcedure
    .input(updateOverrideInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({ orgId: schema.userPermissionOverride.orgId })
        .from(schema.userPermissionOverride)
        .where(eq(schema.userPermissionOverride.id, input.id))
        .limit(1);
      if (!row[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Override not found",
        });

      if (row[0].orgId !== ctx.orgId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, row[0].orgId),
            eq(schema.organizationMember.userId, ctx.session!.user.id),
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
        if (!ab.has("permission:override:manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      await ctx.db
        .update(schema.userPermissionOverride)
        .set({ mode: input.mode })
        .where(eq(schema.userPermissionOverride.id, input.id));
      return { ok: true };
    }),

  // Delete an override
  delete: orgProcedure
    .input(deleteOverrideInput)
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({ orgId: schema.userPermissionOverride.orgId })
        .from(schema.userPermissionOverride)
        .where(eq(schema.userPermissionOverride.id, input.id))
        .limit(1);
      if (!row[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Override not found",
        });
      if (row[0].orgId !== ctx.orgId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      const membership = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, row[0].orgId),
            eq(schema.organizationMember.userId, ctx.session!.user.id),
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
        if (!ab.has("permission:override:manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      await ctx.db
        .delete(schema.userPermissionOverride)
        .where(eq(schema.userPermissionOverride.id, input.id));
      return { ok: true };
    }),
});
