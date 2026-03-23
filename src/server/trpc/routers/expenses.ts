import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  currencies,
  customers,
  expenseCategories,
  expenses,
  organizationPreferences,
  paymentModes,
} from "@/server/db/schemas";
import { ensureDefaultPaymentModes } from "@/server/services/workspace/ensure-default-payment-modes";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

export const expensesRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("expense:view"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: expenses.id,
          amount: expenses.amount,
          expenseDate: expenses.expenseDate,
          notes: expenses.notes,
          categoryId: expenses.categoryId,
          customerId: expenses.customerId,
          paymentModeId: expenses.paymentModeId,
          currencyId: expenses.currencyId,
          createdAt: expenses.createdAt,
        })
        .from(expenses)
        .where(eq(expenses.organizationId, ctx.organizationId))
        .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));
    }),

  create: organizationProcedure
    .use(requirePermission("expense:create"))
    .input(
      z.object({
        amount: z.string().min(1),
        expenseDate: z.string().min(1),
        notes: z.string().max(20000).optional().nullable(),
        categoryId: z.string().optional().nullable(),
        customerId: z.string().optional().nullable(),
        paymentModeId: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);

      const [prefs] = await ctx.db
        .select({ defaultCurrencyId: organizationPreferences.defaultCurrencyId })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      await ctx.db.insert(expenses).values({
        organizationId: ctx.organizationId,
        amount: input.amount,
        expenseDate: input.expenseDate,
        notes: input.notes ?? null,
        categoryId: input.categoryId ?? null,
        customerId: input.customerId ?? null,
        paymentModeId: input.paymentModeId ?? null,
        currencyId: prefs?.defaultCurrencyId ?? null,
        createdById: userId,
      });
      return { ok: true as const };
    }),

  update: organizationProcedure
    .use(requirePermission("expense:edit"))
    .input(
      z.object({
        id: z.string().min(1),
        amount: z.string().min(1),
        expenseDate: z.string().min(1),
        notes: z.string().max(20000).optional().nullable(),
        categoryId: z.string().optional().nullable(),
        customerId: z.string().optional().nullable(),
        paymentModeId: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(expenses)
        .set({
          amount: input.amount,
          expenseDate: input.expenseDate,
          notes: input.notes ?? null,
          categoryId: input.categoryId ?? null,
          customerId: input.customerId ?? null,
          paymentModeId: input.paymentModeId ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(expenses.id, input.id),
            eq(expenses.organizationId, ctx.organizationId),
          ),
        );
      return { ok: true as const };
    }),

  delete: organizationProcedure
    .use(requirePermission("expense:delete"))
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(expenses)
        .where(
          and(
            eq(expenses.id, input.id),
            eq(expenses.organizationId, ctx.organizationId),
          ),
        );
      return { ok: true as const };
    }),

  // Helpers for form dropdowns — available to all org members
  getDefaultCurrency: organizationProcedure
    .use(requirePermission("expense:view"))
    .query(async ({ ctx }) => {
      const [row] = await ctx.db
        .select({
          id: currencies.id,
          code: currencies.code,
          symbol: currencies.symbol,
        })
        .from(organizationPreferences)
        .innerJoin(
          currencies,
          eq(organizationPreferences.defaultCurrencyId, currencies.id),
        )
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);
      return row ?? null;
    }),

  listCategories: organizationProcedure
    .use(requirePermission("expense:view"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({ id: expenseCategories.id, name: expenseCategories.name })
        .from(expenseCategories)
        .where(eq(expenseCategories.organizationId, ctx.organizationId))
        .orderBy(asc(expenseCategories.name));
    }),

  listCustomers: organizationProcedure
    .use(requirePermission("expense:view"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({ id: customers.id, displayName: customers.displayName })
        .from(customers)
        .where(eq(customers.organizationId, ctx.organizationId))
        .orderBy(asc(customers.displayName));
    }),

  listPaymentModes: organizationProcedure
    .use(requirePermission("expense:view"))
    .query(async ({ ctx }) => {
      await ensureDefaultPaymentModes(ctx.db, ctx.organizationId);
      return ctx.db
        .select({ id: paymentModes.id, name: paymentModes.name })
        .from(paymentModes)
        .where(eq(paymentModes.organizationId, ctx.organizationId))
        .orderBy(asc(paymentModes.name));
    }),
});
