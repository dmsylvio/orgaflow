import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import {
  acceptInvitationSchema,
  createInvitationSchema,
  invitationActionSchema,
  invitationTokenSchema,
} from "@/schemas/invitations";
import type { DbClient } from "@/server/db";
import {
  invitations,
  organizationMembers,
  organizations,
  roles,
  users,
} from "@/server/db/schemas";
import {
  buildInvitationUrl,
  getInvitationExpiresAt,
  sendOrganizationInvitationEmail,
} from "@/server/services/invitations/email";
import {
  createTRPCRouter,
  ownerProcedure,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSessionEmail(session: { user?: { email?: string | null } } | null) {
  return session?.user?.email ? normalizeEmail(session.user.email) : null;
}

async function resolveOrganizationRole(params: {
  db: DbClient;
  organizationId: string;
  roleId: string | null;
}) {
  if (!params.roleId) {
    return null;
  }

  const [role] = await params.db
    .select({
      id: roles.id,
      name: roles.name,
    })
    .from(roles)
    .where(
      and(
        eq(roles.id, params.roleId),
        eq(roles.organizationId, params.organizationId),
      ),
    )
    .limit(1);

  if (!role) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Selected role does not exist in this organization.",
    });
  }

  return role;
}

export const teamRouter = createTRPCRouter({
  list: ownerProcedure.query(async ({ ctx }) => {
    const [members, pendingInvitations] = await Promise.all([
      ctx.db
        .select({
          id: organizationMembers.id,
          userId: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          isOwner: organizationMembers.isOwner,
          roleId: organizationMembers.roleId,
          roleName: roles.name,
          joinedAt: organizationMembers.joinedAt,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .leftJoin(roles, eq(organizationMembers.roleId, roles.id))
        .where(eq(organizationMembers.organizationId, ctx.organizationId))
        .orderBy(desc(organizationMembers.isOwner), asc(users.name)),
      ctx.db
        .select({
          id: invitations.id,
          token: invitations.token,
          email: invitations.email,
          roleId: invitations.roleId,
          roleName: roles.name,
          invitedByName: users.name,
          createdAt: invitations.createdAt,
          expiresAt: invitations.expiresAt,
        })
        .from(invitations)
        .leftJoin(roles, eq(invitations.roleId, roles.id))
        .leftJoin(users, eq(invitations.invitedByUserId, users.id))
        .where(
          and(
            eq(invitations.organizationId, ctx.organizationId),
            isNull(invitations.acceptedAt),
          ),
        )
        .orderBy(desc(invitations.createdAt)),
    ]);

    return {
      members,
      invitations: pendingInvitations.map((invite) => ({
        ...invite,
        isExpired: invite.expiresAt ? invite.expiresAt <= new Date() : false,
        invitationUrl: buildInvitationUrl(invite.token),
      })),
    };
  }),

  createInvitation: ownerProcedure
    .input(createInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      const viewerEmail = getSessionEmail(ctx.session);

      if (viewerEmail === email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You are already in this workspace. Use the workspace switcher instead of inviting yourself.",
        });
      }

      const [organization, role, existingMember, existingInvitation] =
        await Promise.all([
          ctx.db
            .select({
              id: organizations.id,
              name: organizations.name,
            })
            .from(organizations)
            .where(eq(organizations.id, ctx.organizationId))
            .limit(1)
            .then((rows) => rows[0] ?? null),
          resolveOrganizationRole({
            db: ctx.db,
            organizationId: ctx.organizationId,
            roleId: input.roleId ?? null,
          }),
          ctx.db
            .select({
              id: organizationMembers.id,
            })
            .from(organizationMembers)
            .innerJoin(users, eq(organizationMembers.userId, users.id))
            .where(
              and(
                eq(organizationMembers.organizationId, ctx.organizationId),
                eq(users.email, email),
              ),
            )
            .limit(1)
            .then((rows) => rows[0] ?? null),
          ctx.db
            .select({
              id: invitations.id,
            })
            .from(invitations)
            .where(
              and(
                eq(invitations.organizationId, ctx.organizationId),
                eq(invitations.email, email),
                isNull(invitations.acceptedAt),
              ),
            )
            .orderBy(desc(invitations.createdAt))
            .limit(1)
            .then((rows) => rows[0] ?? null),
        ]);

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found.",
        });
      }

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This person is already a member of the organization.",
        });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = getInvitationExpiresAt();
      const invitedByName = ctx.session.user.name?.trim() || "A teammate";
      const roleId = role?.id ?? null;

      let invitationId: string | null = null;

      if (existingInvitation) {
        const [updated] = await ctx.db
          .update(invitations)
          .set({
            email,
            token,
            roleId,
            invitedByUserId: getSessionUserId(ctx),
            expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(invitations.id, existingInvitation.id))
          .returning({ id: invitations.id });

        invitationId = updated?.id ?? null;
      } else {
        const [created] = await ctx.db
          .insert(invitations)
          .values({
            organizationId: ctx.organizationId,
            email,
            token,
            roleId,
            invitedByUserId: getSessionUserId(ctx),
            expiresAt,
          })
          .returning({ id: invitations.id });

        invitationId = created?.id ?? null;
      }

      if (!invitationId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create the invitation.",
        });
      }

      try {
        await sendOrganizationInvitationEmail({
          email,
          organizationName: organization.name,
          invitedByName,
          roleName: role?.name ?? null,
          acceptUrl: buildInvitationUrl(token),
          expiresAt,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error && error.message
              ? error.message
              : "The invitation was saved, but the email could not be sent.",
        });
      }

      return {
        id: invitationId,
        email,
        invitationUrl: buildInvitationUrl(token),
      };
    }),

  cancelInvitation: ownerProcedure
    .input(invitationActionSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(invitations)
        .where(
          and(
            eq(invitations.id, input.id),
            eq(invitations.organizationId, ctx.organizationId),
            isNull(invitations.acceptedAt),
          ),
        );

      return { ok: true as const };
    }),

  resendInvitation: ownerProcedure
    .input(invitationActionSchema)
    .mutation(async ({ ctx, input }) => {
      const [invitation] = await ctx.db
        .select({
          id: invitations.id,
          email: invitations.email,
          roleId: invitations.roleId,
          acceptedAt: invitations.acceptedAt,
          organizationName: organizations.name,
          roleName: roles.name,
        })
        .from(invitations)
        .innerJoin(
          organizations,
          eq(invitations.organizationId, organizations.id),
        )
        .leftJoin(roles, eq(invitations.roleId, roles.id))
        .where(
          and(
            eq(invitations.id, input.id),
            eq(invitations.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }

      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted.",
        });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = getInvitationExpiresAt();
      const invitedByName = ctx.session.user.name?.trim() || "A teammate";

      await ctx.db
        .update(invitations)
        .set({
          token,
          invitedByUserId: getSessionUserId(ctx),
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(invitations.id, invitation.id));

      try {
        await sendOrganizationInvitationEmail({
          email: invitation.email,
          organizationName: invitation.organizationName,
          invitedByName,
          roleName: invitation.roleName ?? null,
          acceptUrl: buildInvitationUrl(token),
          expiresAt,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error && error.message
              ? error.message
              : "Could not resend the invitation email.",
        });
      }

      return {
        ok: true as const,
        invitationUrl: buildInvitationUrl(token),
      };
    }),

  getInvitationByToken: publicProcedure
    .input(invitationTokenSchema)
    .query(async ({ ctx, input }) => {
      const [invitation] = await ctx.db
        .select({
          id: invitations.id,
          organizationId: invitations.organizationId,
          organizationName: organizations.name,
          email: invitations.email,
          acceptedAt: invitations.acceptedAt,
          expiresAt: invitations.expiresAt,
          roleName: roles.name,
          invitedByName: users.name,
        })
        .from(invitations)
        .innerJoin(
          organizations,
          eq(invitations.organizationId, organizations.id),
        )
        .leftJoin(roles, eq(invitations.roleId, roles.id))
        .leftJoin(users, eq(invitations.invitedByUserId, users.id))
        .where(eq(invitations.token, input))
        .limit(1);

      const viewerEmail = getSessionEmail(ctx.session);
      const viewerUserId =
        ctx.session?.user && "id" in ctx.session.user
          ? ctx.session.user.id
          : null;

      if (!invitation) {
        return {
          status: "invalid" as const,
          viewerEmail,
          viewerIsAuthenticated: Boolean(viewerUserId),
        };
      }

      const viewerMatchesInvitation = viewerEmail === invitation.email;
      const [membership] =
        viewerUserId && viewerMatchesInvitation
          ? await ctx.db
              .select({ id: organizationMembers.id })
              .from(organizationMembers)
              .where(
                and(
                  eq(
                    organizationMembers.organizationId,
                    invitation.organizationId,
                  ),
                  eq(organizationMembers.userId, viewerUserId),
                ),
              )
              .limit(1)
          : [];

      const isExpired = invitation.expiresAt
        ? invitation.expiresAt <= new Date()
        : false;

      return {
        id: invitation.id,
        organizationId: invitation.organizationId,
        organizationName: invitation.organizationName,
        email: invitation.email,
        roleName: invitation.roleName,
        invitedByName: invitation.invitedByName ?? "A teammate",
        acceptedAt: invitation.acceptedAt,
        expiresAt: invitation.expiresAt,
        viewerEmail,
        viewerIsAuthenticated: Boolean(viewerUserId),
        viewerMatchesInvitation,
        viewerIsMember: Boolean(membership),
        status: invitation.acceptedAt
          ? ("accepted" as const)
          : isExpired
            ? ("expired" as const)
            : ("pending" as const),
      };
    }),

  acceptInvitation: protectedProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const viewerEmail = getSessionEmail(ctx.session);

      if (!viewerEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your account does not have an email address.",
        });
      }

      const [invitation] = await ctx.db
        .select({
          id: invitations.id,
          organizationId: invitations.organizationId,
          organizationName: organizations.name,
          email: invitations.email,
          roleId: invitations.roleId,
          acceptedAt: invitations.acceptedAt,
          expiresAt: invitations.expiresAt,
        })
        .from(invitations)
        .innerJoin(
          organizations,
          eq(invitations.organizationId, organizations.id),
        )
        .where(eq(invitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found or no longer valid.",
        });
      }

      if (viewerEmail !== invitation.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `This invitation was sent to ${invitation.email}. Sign in with that email to accept it.`,
        });
      }

      if (
        !invitation.acceptedAt &&
        invitation.expiresAt &&
        invitation.expiresAt <= new Date()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This invitation has expired. Ask the workspace owner to resend it.",
        });
      }

      const result = await ctx.db.transaction(async (tx) => {
        const [membership] = await tx
          .select({
            id: organizationMembers.id,
          })
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.organizationId, invitation.organizationId),
              eq(organizationMembers.userId, userId),
            ),
          )
          .limit(1);

        if (!membership) {
          await tx.insert(organizationMembers).values({
            organizationId: invitation.organizationId,
            userId,
            roleId: invitation.roleId,
            isOwner: false,
          });
        }

        if (!invitation.acceptedAt) {
          await tx
            .update(invitations)
            .set({
              acceptedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(invitations.id, invitation.id));
        }

        return { alreadyMember: Boolean(membership) };
      });

      return {
        organizationId: invitation.organizationId,
        organizationName: invitation.organizationName,
        alreadyMember: result.alreadyMember,
      };
    }),
});
