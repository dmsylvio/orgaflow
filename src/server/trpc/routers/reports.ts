import "server-only";

import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import { z } from "zod";
import {
  customers,
  estimates,
  expenses,
  invoices,
  payments,
} from "@/server/db/schemas";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";

const periodSchema = z.enum(["3m", "6m", "12m"]).default("12m");

function monthsBack(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function periodToMonths(period: "3m" | "6m" | "12m"): number {
  return period === "3m" ? 3 : period === "6m" ? 6 : 12;
}

export const reportsRouter = createTRPCRouter({
  // ── Monthly revenue & expenses ────────────────────────────────────────────
  getMonthlyOverview: organizationProcedure
    .use(requirePermission("dashboard:view"))
    .input(z.object({ period: periodSchema }))
    .query(async ({ ctx, input }) => {
      const months = periodToMonths(input.period);
      const since = monthsBack(months);

      const revenueRows = await ctx.db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${payments.paymentDate}::date), 'YYYY-MM')`.as("month"),
          total: sum(payments.amount),
        })
        .from(payments)
        .where(
          and(
            eq(payments.organizationId, ctx.organizationId),
            gte(sql`${payments.paymentDate}::date`, since),
          ),
        )
        .groupBy(sql`date_trunc('month', ${payments.paymentDate}::date)`)
        .orderBy(sql`date_trunc('month', ${payments.paymentDate}::date)`);

      const expenseRows = await ctx.db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${expenses.expenseDate}::date), 'YYYY-MM')`.as("month"),
          total: sum(expenses.amount),
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.organizationId, ctx.organizationId),
            gte(sql`${expenses.expenseDate}::date`, since),
          ),
        )
        .groupBy(sql`date_trunc('month', ${expenses.expenseDate}::date)`)
        .orderBy(sql`date_trunc('month', ${expenses.expenseDate}::date)`);

      // Build a complete month grid
      const grid: { month: string; revenue: number; expenses: number }[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        grid.push({ month: key, revenue: 0, expenses: 0 });
      }

      for (const row of revenueRows) {
        const entry = grid.find((g) => g.month === row.month);
        if (entry) entry.revenue = Number(row.total ?? 0);
      }
      for (const row of expenseRows) {
        const entry = grid.find((g) => g.month === row.month);
        if (entry) entry.expenses = Number(row.total ?? 0);
      }

      return grid;
    }),

  // ── Estimate status breakdown ─────────────────────────────────────────────
  getEstimateStats: organizationProcedure
    .use(requirePermission("estimate:view"))
    .query(async ({ ctx }) => {
      const rows = await ctx.db
        .select({
          status: estimates.status,
          total: count(),
        })
        .from(estimates)
        .where(eq(estimates.organizationId, ctx.organizationId))
        .groupBy(estimates.status);

      const statusMap: Record<string, number> = {};
      for (const row of rows) {
        statusMap[row.status] = row.total;
      }

      return [
        { status: "DRAFT", label: "Draft", count: statusMap["DRAFT"] ?? 0 },
        { status: "SENT", label: "Sent", count: statusMap["SENT"] ?? 0 },
        { status: "VIEWED", label: "Viewed", count: statusMap["VIEWED"] ?? 0 },
        { status: "APPROVED", label: "Approved", count: statusMap["APPROVED"] ?? 0 },
        { status: "REJECTED", label: "Rejected", count: statusMap["REJECTED"] ?? 0 },
      ];
    }),

  // ── Invoice status breakdown ──────────────────────────────────────────────
  getInvoiceStats: organizationProcedure
    .use(requirePermission("invoice:view"))
    .query(async ({ ctx }) => {
      const rows = await ctx.db
        .select({
          status: invoices.status,
          total: count(),
        })
        .from(invoices)
        .where(eq(invoices.organizationId, ctx.organizationId))
        .groupBy(invoices.status);

      const statusMap: Record<string, number> = {};
      for (const row of rows) {
        statusMap[row.status] = row.total;
      }

      return [
        { status: "DRAFT", label: "Draft", count: statusMap["DRAFT"] ?? 0 },
        { status: "SENT", label: "Sent", count: statusMap["SENT"] ?? 0 },
        { status: "VIEWED", label: "Viewed", count: statusMap["VIEWED"] ?? 0 },
        { status: "DUE", label: "Overdue", count: statusMap["DUE"] ?? 0 },
        { status: "PAID", label: "Paid", count: statusMap["PAID"] ?? 0 },
        { status: "CANCELLED", label: "Cancelled", count: statusMap["CANCELLED"] ?? 0 },
      ];
    }),

  // ── Top customers by revenue ──────────────────────────────────────────────
  getTopCustomers: organizationProcedure
    .use(requirePermission("payment:view"))
    .input(z.object({ period: periodSchema }))
    .query(async ({ ctx, input }) => {
      const months = periodToMonths(input.period);
      const since = monthsBack(months);

      const rows = await ctx.db
        .select({
          customerId: payments.customerId,
          customerName: customers.displayName,
          total: sum(payments.amount),
          count: count(),
        })
        .from(payments)
        .innerJoin(customers, eq(payments.customerId, customers.id))
        .where(
          and(
            eq(payments.organizationId, ctx.organizationId),
            gte(sql`${payments.paymentDate}::date`, since),
          ),
        )
        .groupBy(payments.customerId, customers.displayName)
        .orderBy(sql`sum(${payments.amount}) desc`)
        .limit(5);

      return rows.map((r) => ({
        customerId: r.customerId,
        customerName: r.customerName ?? "Unknown",
        total: Number(r.total ?? 0),
        count: r.count,
      }));
    }),
});
