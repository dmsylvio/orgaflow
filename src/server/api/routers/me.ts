// src/server/trpc/routers/me.ts
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm/sql/expressions";
import { protectedProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";

export const meRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session?.user.id;
    if (!uid) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const rows = await ctx.db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        image: schema.user.image,
        activeOrgId: schema.user.activeOrgId,
      })
      .from(schema.user)
      .where(eq(schema.user.id, uid))
      .limit(1);

    const user = rows[0];
    if (!user)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });

    let membership = null;
    if (ctx.orgId) {
      const memRows = await ctx.db
        .select({ isOwner: schema.organizationMember.isOwner })
        .from(schema.organizationMember)
        .where(
          and(
            eq(schema.organizationMember.orgId, ctx.orgId),
            eq(schema.organizationMember.userId, uid),
          ),
        )
        .limit(1);
      membership = memRows[0] ?? null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      activeOrgId: user.activeOrgId,
      membership,
    };
  }),

  permissions: protectedProcedure.query(async ({ ctx }) => {
    const set = await ctx.getPermissions();
    return Array.from(set); // abilities
  }),
});
