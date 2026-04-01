import "server-only";

import { and, count, desc, eq, gte, inArray, not, sql, sum } from "drizzle-orm";
import {
  customers,
  estimates,
  invoices,
  payments,
} from "@/server/db/schemas";
import { can } from "@/server/iam/ability";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthsBack(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const dashboardRouter = createTRPCRouter({
  // ── KPI stats ─────────────────────────────────────────────────────────────
  getStats: organizationProcedure
    .use(requirePermission("dashboard:view"))
    .query(async ({ ctx }) => {
      const canViewPrices = can(ctx.ability, "dashboard:view-prices");
      const orgId = ctx.organizationId;

      const [customerCount] = await ctx.db
        .select({ total: count() })
        .from(customers)
        .where(eq(customers.organizationId, orgId));

      const [openEstimatesCount] = await ctx.db
        .select({ total: count() })
        .from(estimates)
        .where(
          and(
            eq(estimates.organizationId, orgId),
            inArray(estimates.status, ["SENT", "VIEWED"]),
          ),
        );

      const [openInvoicesCount] = await ctx.db
        .select({ total: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, orgId),
            inArray(invoices.status, ["SENT", "VIEWED", "OVERDUE", "PARTIALLY_PAID"]),
          ),
        );

      const [revenueThisMonth] = await ctx.db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.organizationId, orgId),
            gte(sql`${payments.paymentDate}::date`, startOfMonth()),
          ),
        );

      return {
        customers: customerCount?.total ?? 0,
        openEstimates: openEstimatesCount?.total ?? 0,
        openInvoices: openInvoicesCount?.total ?? 0,
        revenueThisMonth: canViewPrices ? Number(revenueThisMonth?.total ?? 0) : null,
      };
    }),

  // ── Monthly revenue — last 12 months ──────────────────────────────────────
  getMonthlyRevenue: organizationProcedure
    .use(requirePermission("dashboard:view"))
    .query(async ({ ctx }) => {
      const canViewPrices = can(ctx.ability, "dashboard:view-prices");
      const since = monthsBack(12);
      const orgId = ctx.organizationId;

      const rows = await ctx.db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${payments.paymentDate}::date), 'YYYY-MM')`.as("month"),
          total: sum(payments.amount),
        })
        .from(payments)
        .where(
          and(
            eq(payments.organizationId, orgId),
            gte(sql`${payments.paymentDate}::date`, since),
          ),
        )
        .groupBy(sql`date_trunc('month', ${payments.paymentDate}::date)`)
        .orderBy(sql`date_trunc('month', ${payments.paymentDate}::date)`);

      const grid: { month: string; label: string; revenue: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        grid.push({ month: key, label, revenue: 0 });
      }
      if (canViewPrices) {
        for (const row of rows) {
          const entry = grid.find((g) => g.month === row.month);
          if (entry) entry.revenue = Number(row.total ?? 0);
        }
      }
      return grid;
    }),

  // ── Pending estimates (SENT / VIEWED) ─────────────────────────────────────
  getPendingEstimates: organizationProcedure
    .use(requirePermission("estimate:view"))
    .query(async ({ ctx }) => {
      const canViewPrices = can(ctx.ability, "estimate:view-prices");

      const rows = await ctx.db
        .select({
          id: estimates.id,
          estimateNumber: estimates.estimateNumber,
          status: estimates.status,
          estimateDate: estimates.estimateDate,
          total: estimates.total,
          customerName: customers.displayName,
        })
        .from(estimates)
        .innerJoin(customers, eq(estimates.customerId, customers.id))
        .where(
          and(
            eq(estimates.organizationId, ctx.organizationId),
            inArray(estimates.status, ["SENT", "VIEWED"]),
          ),
        )
        .orderBy(desc(estimates.updatedAt))
        .limit(6);

      return rows.map((row) => ({
        ...row,
        total: canViewPrices ? row.total : null,
      }));
    }),

  // ── Pending invoices (SENT / VIEWED / OVERDUE / PARTIALLY_PAID) ───────────
  getPendingInvoices: organizationProcedure
    .use(requirePermission("invoice:view"))
    .query(async ({ ctx }) => {
      const canViewPrices = can(ctx.ability, "invoice:view-prices");

      const rows = await ctx.db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          dueDate: invoices.dueDate,
          total: invoices.total,
          customerName: customers.displayName,
        })
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .where(
          and(
            eq(invoices.organizationId, ctx.organizationId),
            inArray(invoices.status, ["SENT", "VIEWED", "OVERDUE", "PARTIALLY_PAID"]),
          ),
        )
        .orderBy(desc(invoices.updatedAt))
        .limit(6);

      return rows.map((row) => ({
        ...row,
        total: canViewPrices ? row.total : null,
      }));
    }),

  // ── Recent activity ───────────────────────────────────────────────────────
  getRecentActivity: organizationProcedure
    .use(requirePermission("dashboard:view"))
    .query(async ({ ctx }) => {
      const orgId = ctx.organizationId;

      const recentEstimates = await ctx.db
        .select({
          id: estimates.id,
          number: estimates.estimateNumber,
          status: estimates.status,
          updatedAt: estimates.updatedAt,
          customerName: customers.displayName,
        })
        .from(estimates)
        .innerJoin(customers, eq(estimates.customerId, customers.id))
        .where(
          and(
            eq(estimates.organizationId, orgId),
            not(eq(estimates.status, "DRAFT")),
          ),
        )
        .orderBy(desc(estimates.updatedAt))
        .limit(6);

      const recentInvoices = await ctx.db
        .select({
          id: invoices.id,
          number: invoices.invoiceNumber,
          status: invoices.status,
          updatedAt: invoices.updatedAt,
          customerName: customers.displayName,
        })
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .where(
          and(
            eq(invoices.organizationId, orgId),
            not(eq(invoices.status, "DRAFT")),
          ),
        )
        .orderBy(desc(invoices.updatedAt))
        .limit(6);

      const recentPayments = await ctx.db
        .select({
          id: payments.id,
          amount: payments.amount,
          paymentDate: payments.paymentDate,
          createdAt: payments.createdAt,
          customerName: customers.displayName,
        })
        .from(payments)
        .innerJoin(customers, eq(payments.customerId, customers.id))
        .where(eq(payments.organizationId, orgId))
        .orderBy(desc(payments.createdAt))
        .limit(6);

      type ActivityItem = {
        id: string;
        type: "estimate" | "invoice" | "payment";
        status?: string;
        label: string;
        description: string;
        href: string;
        date: Date;
      };

      const items: ActivityItem[] = [
        ...recentEstimates.map((e) => ({
          id: `estimate-${e.id}`,
          type: "estimate" as const,
          status: e.status,
          label: e.number,
          description: e.customerName,
          href: `/app/estimates/${e.id}`,
          date: e.updatedAt,
        })),
        ...recentInvoices.map((i) => ({
          id: `invoice-${i.id}`,
          type: "invoice" as const,
          status: i.status,
          label: i.number,
          description: i.customerName,
          href: `/app/invoices/${i.id}`,
          date: i.updatedAt,
        })),
        ...recentPayments.map((p) => ({
          id: `payment-${p.id}`,
          type: "payment" as const,
          label: `Payment received`,
          description: p.customerName,
          href: `/app/payments`,
          date: p.createdAt,
        })),
      ];

      return items
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 8);
    }),
});
