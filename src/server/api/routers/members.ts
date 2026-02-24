import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { orgProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";
import {
  assignRolesInput,
  listMembersByOrgInput,
  removeMemberInput,
  transferOwnershipInput,
} from "@/validations/member.schema";

export const membersRouter = router({
  // List organization members with roles
  listByOrg: orgProcedure
    .input(listMembersByOrgInput)
    .query(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      }

      const membership = await ctx.db
        .select({ id: schema.organizationMember.id })
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
          message: "User is not a member of the organization",
        });

      const rows = await ctx.db
        .select({
          userId: schema.user.id,
          name: schema.user.name,
          email: schema.user.email,
          isOwner: schema.organizationMember.isOwner,
        })
        .from(schema.organizationMember)
        .innerJoin(
          schema.user,
          eq(schema.organizationMember.userId, schema.user.id),
        )
        .where(eq(schema.organizationMember.orgId, input.orgId))
        .orderBy(
          desc(schema.organizationMember.isOwner),
          asc(schema.user.name),
        );

      const roleRows = await ctx.db
        .select({
          userId: schema.userRole.userId,
          roleId: schema.role.id,
          roleName: schema.role.name,
        })
        .from(schema.userRole)
        .innerJoin(schema.role, eq(schema.userRole.roleId, schema.role.id))
        .where(eq(schema.userRole.orgId, input.orgId));

      const map = new Map<string, { id: string; name: string }[]>();
      for (const r of roleRows) {
        const arr = map.get(r.userId) ?? [];
        arr.push({ id: r.roleId, name: r.roleName });
        map.set(r.userId, arr);
      }

      return rows.map((r) => ({
        id: r.userId,
        name: r.name,
        email: r.email,
        isOwner: r.isOwner,
        roles: map.get(r.userId) ?? [],
      }));
    }),

  // Assign roles to a member (replace set)
  assignRoles: orgProcedure
    .input(assignRolesInput)
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
        const perms = await ctx.getPermissions();
        if (!perms.has("role:manage"))
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

      if (input.roleIds.length) {
        const roles = await ctx.db
          .select({ id: schema.role.id })
          .from(schema.role)
          .where(
            and(
              eq(schema.role.orgId, input.orgId),
              inArray(schema.role.id, input.roleIds),
            ),
          );
        if (roles.length !== input.roleIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more invalid roles for this organization",
          });
        }
      }

      await ctx.db
        .delete(schema.userRole)
        .where(
          and(
            eq(schema.userRole.orgId, input.orgId),
            eq(schema.userRole.userId, input.userId),
          ),
        );

      if (input.roleIds.length) {
        await ctx.db.insert(schema.userRole).values(
          input.roleIds.map((roleId) => ({
            id: randomUUID(),
            orgId: input.orgId,
            userId: input.userId,
            roleId,
          })),
        );
      }
      return { ok: true };
    }),

  // Remove a member from organization
  removeMember: orgProcedure
    .input(removeMemberInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      }

      const acting = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, ctx.session?.user.id),
          ),
        )
        .limit(1);
      if (!acting[0]?.isOwner)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      const target = await ctx.db
        .select({
          isOwner: schema.organizationMember.isOwner,
          userId: schema.organizationMember.userId,
        })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, input.userId),
          ),
        )
        .limit(1);
      if (!target[0])
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });

      if (target[0].isOwner) {
        const owners = await ctx.db
          .select({ id: schema.organizationMember.id })
          .from(schema.organizationMember)
          .where(
            and(
              eq(schema.organizationMember.orgId, input.orgId),
              eq(schema.organizationMember.isOwner, true),
            ),
          );
        if (owners.length <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the only owner",
          });
        }
      }

      await ctx.db
        .delete(schema.userRole)
        .where(
          and(
            eq(schema.userRole.orgId, input.orgId),
            eq(schema.userRole.userId, input.userId),
          ),
        );

      await ctx.db
        .delete(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, input.userId),
          ),
        );

      await ctx.db
        .update(schema.user)
        .set({ activeOrgId: null })
        .where(
          and(
            eq(schema.user.id, input.userId),
            eq(schema.user.activeOrgId, input.orgId),
          ),
        );

      return { ok: true };
    }),

  // Transfer organization ownership to another member
  transferOwnership: orgProcedure
    .input(transferOwnershipInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      }

      const acting = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, ctx.session?.user.id),
          ),
        )
        .limit(1);
      if (!acting[0]?.isOwner)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      const toMember = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, input.toUserId),
          ),
        )
        .limit(1);
      if (!toMember[0])
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not a member of the organization",
        });

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(schema.organizationMember)
          .set({ isOwner: true })
          .where(
            and(
              eq(schema.organizationMember.orgId, input.orgId),
              eq(schema.organizationMember.userId, input.toUserId),
            ),
          );
        await tx
          .update(schema.organizationMember)
          .set({ isOwner: false })
          .where(
            and(
              eq(schema.organizationMember.orgId, input.orgId),
              eq(schema.organizationMember.userId, ctx.session?.user.id),
            ),
          );
      });

      return { ok: true };
    }),
});
