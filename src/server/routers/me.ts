import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";

export const meRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const { session, prisma, orgId } = ctx;

    if (!session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        activeOrgId: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // membership atual (org ativa); se não houver org, volta null
    const membership = orgId
      ? await prisma.organizationMember.findUnique({
          where: { organization_member_unique: { orgId, userId: user.id } },
          select: { isOwner: true, orgId: true, userId: true },
        })
      : null;

    return {
      user,
      membership, // { isOwner, orgId, userId } | null
    };
  }),

  permissions: protectedProcedure.query(async ({ ctx }) => {
    const { session, orgId, getPermissions } = ctx;

    // sem org ativa ⇒ sem permissões (Sidebar vai ocultar itens)
    if (!orgId) return [] as string[];

    const set = await getPermissions();
    // devolve como array simples de strings
    return Array.from(set);
  }),
});
