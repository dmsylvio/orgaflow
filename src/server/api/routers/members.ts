import { TRPCError } from "@trpc/server";
import {
  assignRolesInput,
  listMembersByOrgInput,
  removeMemberInput,
  transferOwnershipInput,
} from "@/validations/member.schema";
import { orgProcedure, router } from "@/server/api/trpc";

export const membersRouter = router({
  // List organization members with roles
  listByOrg: orgProcedure
    .input(listMembersByOrgInput)
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
        select: { id: true },
      });
      if (!membership)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário não é membro da organização",
        });

      const rows = await ctx.prisma.organizationMember.findMany({
        where: { orgId: input.orgId },
        select: {
          user: { select: { id: true, name: true, email: true } },
          isOwner: true,
        },
        orderBy: [{ isOwner: "desc" }, { user: { name: "asc" } }],
      });

      // roles por usuário (opcional, leve)
      const roles = await ctx.prisma.userRole.findMany({
        where: { orgId: input.orgId },
        select: { userId: true, role: { select: { id: true, name: true } } },
      });
      const map = new Map<string, { id: string; name: string }[]>();
      roles.forEach((r) => {
        const arr = map.get(r.userId) ?? [];
        arr.push(r.role);
        map.set(r.userId, arr);
      });

      return rows.map((r) => ({
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        isOwner: r.isOwner,
        roles: map.get(r.user.id) ?? [],
      }));
    }),

  // assignRoles: protectedProcedure
  //   .input(z.object({
  //     orgId: z.uuid(),
  //     userId: z.uuid(),
  //     roleIds: z.array(z.uuid()),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     // precisa ser owner ou ter role:manage
  //     const membership = await ctx.prisma.organizationMember.findUnique({
  //       where: { organization_member_unique: { orgId: input.orgId, userId: ctx.session.user.id } },
  //       select: { isOwner: true },
  //     });
  //     if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
  //     if (!membership.isOwner) {
  //       const perms = await ctx.getPermissions();
  //       if (!perms.has("role:manage")) throw new TRPCError({ code: "FORBIDDEN" });
  //     }

  //     // valida se alvo é membro
  //     const isMember = await ctx.prisma.organizationMember.findUnique({
  //       where: { organization_member_unique: { orgId: input.orgId, userId: input.userId } },
  //       select: { id: true },
  //     });
  //     if (!isMember) throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não é membro" });

  //     // limpa e recria vínculos
  //     await ctx.prisma.userRole.deleteMany({ where: { orgId: input.orgId, userId: input.userId } });
  //     if (input.roleIds.length) {
  //       await ctx.prisma.userRole.createMany({
  //         data: input.roleIds.map(rid => ({ orgId: input.orgId, userId: input.userId, roleId: rid })),
  //         skipDuplicates: true,
  //       });
  //     }
  //     return { ok: true };
  //   }),
  // Assign roles to a member (replace set)
  assignRoles: orgProcedure
    .input(assignRolesInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // precisa ser owner ou ter role:manage
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
        const perms = await ctx.getPermissions();
        if (!perms.has("role:manage"))
          throw new TRPCError({ code: "FORBIDDEN" });
      }

      // usuário alvo deve ser membro
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

      if (input.roleIds.length) {
        // verifique que todas as roles existem e pertencem à org
        const roles = await ctx.prisma.role.findMany({
          where: { id: { in: input.roleIds }, orgId: input.orgId },
          select: { id: true },
        });
        if (roles.length !== input.roleIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Uma ou mais roles inválidas para esta organização",
          });
        }
      }

      await ctx.prisma.userRole.deleteMany({
        where: { orgId: input.orgId, userId: input.userId },
      });
      if (input.roleIds.length) {
        await ctx.prisma.userRole.createMany({
          data: input.roleIds.map((rid) => ({
            orgId: input.orgId,
            userId: input.userId,
            roleId: rid,
          })),
          skipDuplicates: true,
        });
      }
      return { ok: true };
    }),

  // Remove a member from organization
  removeMember: orgProcedure
    .input(removeMemberInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // apenas owner; não pode remover a si próprio se for único owner
      const acting = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!acting?.isOwner) throw new TRPCError({ code: "FORBIDDEN" });

      const target = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: input.userId,
          },
        },
        select: { isOwner: true, userId: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      // se for owner, garanta que não é o último owner
      if (target.isOwner) {
        const owners = await ctx.prisma.organizationMember.count({
          where: { orgId: input.orgId, isOwner: true },
        });
        if (owners <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível remover o único owner",
          });
        }
      }

      await ctx.prisma.userRole.deleteMany({
        where: { orgId: input.orgId, userId: input.userId },
      });
      await ctx.prisma.organizationMember.delete({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: input.userId,
          },
        },
      });

      // opcional: limpar activeOrgId se a org removida era a ativa do usuário removido
      await ctx.prisma.user.updateMany({
        where: { id: input.userId, activeOrgId: input.orgId },
        data: { activeOrgId: null },
      });

      return { ok: true };
    }),

  // Transfer organization ownership to another member
  transferOwnership: orgProcedure
    .input(transferOwnershipInput)
    .mutation(async ({ ctx, input }) => {
      if (input.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // somente owner atual pode transferir
      const acting = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: ctx.session!.user.id,
          },
        },
        select: { isOwner: true },
      });
      if (!acting?.isOwner) throw new TRPCError({ code: "FORBIDDEN" });

      const toMember = await ctx.prisma.organizationMember.findUnique({
        where: {
          organization_member_unique: {
            orgId: input.orgId,
            userId: input.toUserId,
          },
        },
        select: { isOwner: true },
      });
      if (!toMember)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não é membro",
        });

      // marca target como owner e acting como não-owner
      await ctx.prisma.$transaction([
        ctx.prisma.organizationMember.update({
          where: {
            organization_member_unique: {
              orgId: input.orgId,
              userId: input.toUserId,
            },
          },
          data: { isOwner: true },
        }),
        ctx.prisma.organizationMember.update({
          where: {
            organization_member_unique: {
              orgId: input.orgId,
              userId: ctx.session!.user.id,
            },
          },
          data: { isOwner: false },
        }),
      ]);

      return { ok: true };
    }),
});
