import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, gt, isNull } from "drizzle-orm/sql/expressions";
import {
  orgProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/api/trpc";
import * as schema from "@/server/db/schema";
import { canInviteToOrg } from "@/server/iam/guards/canInvite";
import {
  inviteCreateInput,
  inviteTokenInput,
  listPendingInvitesInput,
  revokeInviteInput,
} from "@/validations/invitation.schema";

function addDays(d: Date, days: number) {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

export const invitationsRouter = router({
  create: orgProcedure
    .input(inviteCreateInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      }
      const userId = ctx.session?.user.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });

      const member = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, userId),
          ),
        )
        .limit(1);
      if (!member[0])
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      if (!member[0].isOwner) {
        const perms = await ctx.getPermissions();
        if (!perms.has("member:invite"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          });
      }

      let roleId: string | null = null;
      if (input.roleId) {
        const role = await ctx.db
          .select({ id: schema.role.id })
          .from(schema.role)
          .where(
            and(
              eq(schema.role.id, input.roleId),
              eq(schema.role.orgId, input.orgId),
            ),
          )
          .limit(1);
        if (!role[0])
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid role for this organization",
          });
        roleId = role[0].id;
      }

      const existing = await ctx.db
        .select({
          id: schema.invitation.id,
          acceptedAt: schema.invitation.acceptedAt,
          expiresAt: schema.invitation.expiresAt,
        })
        .from(schema.invitation)
        .where(
          and(
            eq(schema.invitation.orgId, input.orgId),
            eq(schema.invitation.email, input.email),
          ),
        )
        .limit(1);
      if (
        existing[0] &&
        !existing[0].acceptedAt &&
        existing[0].expiresAt > new Date()
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Pending invitation already exists",
        });
      }

      const token = randomUUID();
      const expiresAt = addDays(new Date(), input.expiresInDays);

      const id = randomUUID();

      await ctx.db.insert(schema.invitation).values({
        id,
        orgId: input.orgId,
        email: input.email,
        roleId: roleId ?? null,
        invitedBy: userId,
        token,
        expiresAt,
      });

      return { id, token };
    }),

  // Publicly fetch an invitation summary by token
  getByToken: publicProcedure
    .input(inviteTokenInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: schema.invitation.id,
          token: schema.invitation.token,
          email: schema.invitation.email,
          expiresAt: schema.invitation.expiresAt,
          acceptedAt: schema.invitation.acceptedAt,
          orgId: schema.organization.id,
          orgName: schema.organization.name,
          orgSlug: schema.organization.slug,
          roleId: schema.role.id,
          roleName: schema.role.name,
        })
        .from(schema.invitation)
        .innerJoin(
          schema.organization,
          eq(schema.invitation.orgId, schema.organization.id),
        )
        .leftJoin(schema.role, eq(schema.invitation.roleId, schema.role.id))
        .where(eq(schema.invitation.token, input.token))
        .limit(1);

      const inv = rows[0];
      if (!inv)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation",
        });
      const expired = inv.expiresAt <= new Date();
      return {
        id: inv.id,
        token: inv.token,
        email: inv.email,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        expired,
        org: { id: inv.orgId, name: inv.orgName, slug: inv.orgSlug },
        role: inv.roleId ? { id: inv.roleId, name: inv.roleName } : null,
      };
    }),

  // Accept an invitation
  accept: protectedProcedure
    .input(inviteTokenInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });

      const rows = await ctx.db
        .select({
          id: schema.invitation.id,
          orgId: schema.invitation.orgId,
          roleId: schema.invitation.roleId,
          email: schema.invitation.email,
          expiresAt: schema.invitation.expiresAt,
          acceptedAt: schema.invitation.acceptedAt,
        })
        .from(schema.invitation)
        .where(eq(schema.invitation.token, input.token))
        .limit(1);

      const inv = rows[0];
      if (!inv)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation",
        });
      if (inv.expiresAt <= new Date())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation expired",
        });
      if (inv.acceptedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation already accepted",
        });

      // membership (upsert via select + insert)
      const member = await ctx.db
        .select({ id: schema.organizationMember.id })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, inv.orgId),
            eq(schema.organizationMember.userId, userId),
          ),
        )
        .limit(1);
      if (!member[0]) {
        await ctx.db.insert(schema.organizationMember).values({
          id: randomUUID(),
          orgId: inv.orgId,
          userId,
          isOwner: false,
        });
      }

      if (inv.roleId) {
        const ur = await ctx.db
          .select({ id: schema.userRole.id })
          .from(schema.userRole)
          .where(
            and(
              eq(schema.userRole.orgId, inv.orgId),
              eq(schema.userRole.userId, userId),
              eq(schema.userRole.roleId, inv.roleId),
            ),
          )
          .limit(1);
        if (!ur[0]) {
          await ctx.db.insert(schema.userRole).values({
            id: randomUUID(),
            orgId: inv.orgId,
            userId,
            roleId: inv.roleId,
          });
        }
      }

      await ctx.db
        .update(schema.invitation)
        .set({ acceptedAt: new Date() })
        .where(eq(schema.invitation.id, inv.id));

      await ctx.db
        .update(schema.user)
        .set({ activeOrgId: inv.orgId })
        .where(eq(schema.user.id, userId));

      return { ok: true, orgId: inv.orgId };
    }),

  reject: protectedProcedure
    .input(inviteTokenInput)
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: schema.invitation.id,
          expiresAt: schema.invitation.expiresAt,
          acceptedAt: schema.invitation.acceptedAt,
        })
        .from(schema.invitation)
        .where(eq(schema.invitation.token, input.token))
        .limit(1);
      const inv = rows[0];
      if (!inv)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation",
        });
      if (inv.acceptedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation already accepted",
        });

      if (inv.expiresAt > new Date()) {
        await ctx.db
          .delete(schema.invitation)
          .where(eq(schema.invitation.id, inv.id));
      }
      return { ok: true };
    }),

  // List active, non-accepted invitations for an organization
  listPendingByOrg: orgProcedure
    .input(listPendingInvitesInput)
    .query(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      }
      const userId = ctx.session?.user.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });

      const member = await ctx.db
        .select({ id: schema.organizationMember.id })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, input.orgId),
            eq(schema.organizationMember.userId, userId),
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
          id: schema.invitation.id,
          email: schema.invitation.email,
          token: schema.invitation.token,
          expiresAt: schema.invitation.expiresAt,
          roleId: schema.role.id,
          roleName: schema.role.name,
          invitedBy: schema.invitation.invitedBy,
          createdAt: schema.invitation.createdAt,
        })
        .from(schema.invitation)
        .leftJoin(schema.role, eq(schema.invitation.roleId, schema.role.id))
        .where(
          and(
            eq(schema.invitation.orgId, input.orgId),
            isNull(schema.invitation.acceptedAt),
            gt(schema.invitation.expiresAt, new Date()),
          ),
        )
        .orderBy(schema.invitation.createdAt);
    }),

  // Revoke a pending invitation
  revoke: orgProcedure
    .input(revokeInviteInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });

      const rows = await ctx.db
        .select({
          orgId: schema.invitation.orgId,
          acceptedAt: schema.invitation.acceptedAt,
        })
        .from(schema.invitation)
        .where(eq(schema.invitation.id, input.inviteId))
        .limit(1);
      const inv = rows[0];
      if (!inv)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      if (inv.orgId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });
      }
      if (inv.acceptedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation already accepted",
        });

      const allowed = await canInviteToOrg(
        userId,
        inv.orgId,
        ctx.getPermissions,
      );
      if (!allowed)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        });

      await ctx.db
        .delete(schema.invitation)
        .where(eq(schema.invitation.id, input.inviteId));
      return { ok: true };
    }),
});
