// src/server/trpc/routers/dashboard.ts

import { eq, sql } from "drizzle-orm/sql";
import { orgProcedure, router } from "@/server/api/trpc";
import { customer } from "@/server/db/schema";

export const dashboardRouter = router({
  counters: orgProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(customer)
      .where(eq(customer.orgId, ctx.orgId));

    return { customers: Number(row?.count ?? 0) };
  }),
});
