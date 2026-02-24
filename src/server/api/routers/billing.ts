import { desc, eq } from "drizzle-orm";
import { orgProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";

export const billingRouter = router({
  current: orgProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: schema.subscription.id,
        plan: schema.subscription.plan,
        status: schema.subscription.status,
        interval: schema.subscription.interval,
        currentPeriodEnd: schema.subscription.currentPeriodEnd,
        stripeCustomerId: schema.subscription.stripeCustomerId,
      })
      .from(schema.subscription)
      .where(eq(schema.subscription.orgId, ctx.orgId))
      .orderBy(desc(schema.subscription.createdAt))
      .limit(1);

    return rows[0] ?? null;
  }),
});
