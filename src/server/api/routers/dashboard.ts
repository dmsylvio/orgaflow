// src/server/trpc/routers/dashboard.ts
import { orgProcedure, router } from "@/server/api/trpc";

export const dashboardRouter = router({
  counters: orgProcedure.query(async ({ ctx }) => {
    // Exemplo: dê números reais quando tiver modelos
    const orgId = ctx.orgId;
    const [customers] = await Promise.all([
      ctx.prisma.customer.count({ where: { orgId } }),
      // adicione outros contadores quando tiver
    ]);
    return { customers };
  }),
});
