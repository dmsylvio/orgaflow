// src/server/trpc/routers/me.ts

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "@/server/api/trpc";

export const meRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session!.user.id;
    const user = await ctx.prisma.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        activeOrgId: true,
        OrganizationMember: {
          where: { orgId: ctx.orgId ?? undefined },
          select: { isOwner: true },
        },
      },
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      activeOrgId: user.activeOrgId,
      membership: user.OrganizationMember[0] ?? null,
    };
  }),

  permissions: protectedProcedure.query(async ({ ctx }) => {
    const set = await ctx.getPermissions();
    return Array.from(set); // abilities
  }),
});
