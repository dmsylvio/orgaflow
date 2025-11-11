import { protectedProcedure, router } from "../trpc";

/**
 * Retorna contadores para badges do menu.
 * Ajuste as queries conforme seus modelos (Invoices, etc).
 */
export const dashboardRouter = router({
  counters: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, orgId } = ctx;

    if (!orgId) {
      // sem org ativa ⇒ counters vazios
      return { invoicesDue: 0 };
    }

    // Exemplo: se ainda não tiver Invoice no schema, mantenha 0 ou use outro count (ex.: customers)
    // const invoicesDue = await prisma.invoice.count({
    //   where: { orgId, status: "overdue" },
    // });

    const invoicesDue = 0;

    return {
      invoicesDue,
    };
  }),
});
