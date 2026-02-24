import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { canInviteToOrg } from "@/server/iam/guards/canInvite";
import {
  inviteCreateInput,
  inviteTokenInput,
  listPendingInvitesInput,
  revokeInviteInput,
} from "@/validations/invitation.schema";
import {
  orgProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/api/trpc";

function addDays(d: Date, days: number) {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

// List pending invitations input validation

export const invitationsRouter = router({
  // Criar convite (owner ou member com permissão)
  // create: protectedProcedure
  //   .input(inviteCreateSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     const { session, getPermissions } = ctx;
  //     const { orgId, email, roleId, expiresInDays } = input;

  //     const allowed = await canInviteToOrg(session.user.id, orgId, getPermissions);
  //     if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para convidar" });

  //     const existsMember = await prisma.organizationMember.findUnique({
  //       where: { organization_member_unique: { orgId, userId: session.user.id } },
  //       select: { orgId: true },
  //     });
  //     if (!existsMember) throw new TRPCError({ code: "FORBIDDEN", message: "Sem vínculo com a organização" });

  //     const token = randomUUID();
  //     const expiresAt = addDays(new Date(), expiresInDays);

  //     // Impede convites duplicados ativos para o mesmo email+org
  //     const conflict = await prisma.invitation.findUnique({
  //       where: { invitation_org_email_unique: { orgId, email } },
  //       select: { id: true, acceptedAt: true, expiresAt: true },
  //     });
  //     if (conflict && !conflict.acceptedAt && conflict.expiresAt > new Date()) {
  //       throw new TRPCError({ code: "CONFLICT", message: "Convite pendente já existe" });
  //     }

  //     const invite = await prisma.invitation.upsert({
  //       where: { invitation_org_email_unique: { orgId, email } },
  //       create: {
  //         orgId,
  //         email,
  //         roleId: roleId ?? undefined,
  //         invitedBy: session.user.id,
  //         token,
  //         expiresAt,
  //       },
  //       update: {
  //         roleId: roleId ?? null,
  //         invitedBy: session.user.id,
  //         token,
  //         expiresAt,
  //         acceptedAt: null,
  //       },
  //       select: { id: true, token: true, expiresAt: true },
  //     });

  //     // TODO: enviar e-mail de convite aqui (provider de e-mail)
  //     // por enquanto, retornamos o token para você testar no front
  //     return invite;
  //   }),
  // Create a new organization invitation
  create: orgProcedure
    .input(inviteCreateInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const userId = ctx.session?.user.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });

      // deve ser membro e owner ou ter permission p/ convidar
      const member = await ctx.prisma.organizationMember.findUnique({
        where: { organization_member_unique: { orgId: input.orgId, userId } },
        select: { isOwner: true },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });
      if (!member.isOwner) {
        const perms = await ctx.getPermissions();
        if (!perms.has("member:invite"))
          throw new TRPCError({ code: "FORBIDDEN" });
      }

      // se veio roleId, valide que pertence à mesma org
      let roleId: string | null = null;
      if (input.roleId) {
        const role = await ctx.prisma.role.findFirst({
          where: { id: input.roleId, orgId: input.orgId },
          select: { id: true },
        });
        if (!role)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Role inválida para esta organização",
          });
        roleId = role.id;
      }

      // impede convites duplicados ativos para o mesmo email+org
      const existing = await ctx.prisma.invitation.findUnique({
        where: {
          invitation_org_email_unique: {
            orgId: input.orgId,
            email: input.email,
          },
        },
        select: { id: true, acceptedAt: true, expiresAt: true },
      });
      if (existing && !existing.acceptedAt && existing.expiresAt > new Date()) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Convite pendente já existe",
        });
      }

      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const inv = await ctx.prisma.invitation.create({
        data: {
          orgId: input.orgId,
          email: input.email,
          roleId: roleId ?? null,
          invitedBy: userId,
          token,
          expiresAt,
        },
        select: { id: true, token: true },
      });

      return inv;
    }),

  // Obter dados do convite por token (público)
  // Publicly fetch an invitation summary by token
  getByToken: publicProcedure
    .input(inviteTokenInput)
    .query(async ({ input }) => {
      const inv = await prisma.invitation.findUnique({
        where: { token: input.token },
        select: {
          id: true,
          token: true,
          email: true,
          expiresAt: true,
          acceptedAt: true,
          org: { select: { id: true, name: true, slug: true } },
          role: { select: { id: true, name: true } },
        },
      });

      if (!inv)
        throw new TRPCError({ code: "NOT_FOUND", message: "Convite inválido" });
      const expired = inv.expiresAt <= new Date();
      return { ...inv, expired };
    }),

  // Aceitar convite (precisa estar autenticado)
  // Accept an invitation; links membership and optional role
  accept: protectedProcedure
    .input(inviteTokenInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });

      const inv = await prisma.invitation.findUnique({
        where: { token: input.token },
        select: {
          id: true,
          orgId: true,
          roleId: true,
          email: true,
          expiresAt: true,
          acceptedAt: true,
        },
      });
      if (!inv)
        throw new TRPCError({ code: "NOT_FOUND", message: "Convite inválido" });
      if (inv.expiresAt <= new Date())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Convite expirado",
        });
      if (inv.acceptedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Convite já aceito",
        });

      // opcional: garantir que o e-mail do convite bate com o e-mail do usuário logado
      // se quiser exigir correspondência exata, descomente:
      // const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      // if (u?.email?.toLowerCase() !== inv.email.toLowerCase()) {
      //   throw new TRPCError({ code: "FORBIDDEN", message: "E-mail do convite não corresponde à conta" });
      // }

      // vínculo como membro (se já existe, mantém)
      await prisma.organizationMember.upsert({
        where: { organization_member_unique: { orgId: inv.orgId, userId } },
        create: { orgId: inv.orgId, userId, isOwner: false },
        update: {},
      });

      // aplica role do convite (se houver)
      if (inv.roleId) {
        await prisma.userRole.upsert({
          where: {
            user_role_unique: { orgId: inv.orgId, userId, roleId: inv.roleId },
          },
          create: { orgId: inv.orgId, userId, roleId: inv.roleId },
          update: {},
        });
      }

      // marca como aceito
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { acceptedAt: new Date() },
      });

      // deixa essa organização ativa
      await prisma.user.update({
        where: { id: userId },
        data: { activeOrgId: inv.orgId },
      });

      return { ok: true, orgId: inv.orgId };
    }),

  // Rejeitar convite (precisa estar autenticado)
  // Reject an invitation (delete if still valid)
  reject: protectedProcedure
    .input(inviteTokenInput)
    .mutation(async ({ ctx, input }) => {
      const inv = await prisma.invitation.findUnique({
        where: { token: input.token },
        select: { id: true, expiresAt: true, acceptedAt: true },
      });
      if (!inv)
        throw new TRPCError({ code: "NOT_FOUND", message: "Convite inválido" });
      if (inv.acceptedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Convite já aceito",
        });

      // estritamente, poderíamos marcar como "rejectedAt", mas não há campo; vamos apenas excluir
      if (inv.expiresAt > new Date()) {
        await prisma.invitation.delete({ where: { id: inv.id } });
      }
      return { ok: true };
    }),

  // List active, non-accepted invitations for an organization
  listPendingByOrg: orgProcedure
    .input(listPendingInvitesInput)
    .query(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const userId = ctx.session?.user.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });

      // exige vínculo à org
      const member = await ctx.prisma.organizationMember.findUnique({
        where: { organization_member_unique: { orgId: input.orgId, userId } },
        select: { id: true },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });

      const rows = await ctx.prisma.invitation.findMany({
        where: {
          orgId: input.orgId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          email: true,
          token: true,
          expiresAt: true,
          role: { select: { id: true, name: true } },
          invitedBy: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return rows;
    }),

  // Revoke a pending invitation
  revoke: orgProcedure
    .input(revokeInviteInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      if (!userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });

      const inv = await ctx.prisma.invitation.findUnique({
        where: { id: input.inviteId },
        select: { orgId: true, acceptedAt: true },
      });
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" });
      if (inv.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (inv.acceptedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Convite já aceito",
        });

      const allowed = await canInviteToOrg(
        userId,
        inv.orgId,
        ctx.getPermissions,
      );
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      await ctx.prisma.invitation.delete({ where: { id: input.inviteId } });
      return { ok: true };
    }),
});
