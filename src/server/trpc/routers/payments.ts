import "server-only";

import { and, asc, desc, eq, max } from "drizzle-orm";
import { z } from "zod";
import {
  currencies,
  customers,
  organizationPreferences,
  paymentModes,
  payments,
} from "@/server/db/schemas";
import { ensureDefaultPaymentModes } from "@/server/services/workspace/ensure-default-payment-modes";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

function formatPaymentNumber(seq: number): string {
  return `PAY-${String(seq).padStart(6, "0")}`;
}

export const paymentsRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("payment:view"))
    .query(async ({ ctx }) => {
      const rows = await ctx.db
        .select({
          id: payments.id,
          sequenceNumber: payments.sequenceNumber,
          amount: payments.amount,
          paymentDate: payments.paymentDate,
          notes: payments.notes,
          invoiceRef: payments.invoiceRef,
          customerId: payments.customerId,
          paymentModeId: payments.paymentModeId,
          currencyId: payments.currencyId,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(eq(payments.organizationId, ctx.organizationId))
        .orderBy(desc(payments.paymentDate), desc(payments.createdAt));

      return rows.map((r) => ({
        ...r,
        paymentNumber: formatPaymentNumber(r.sequenceNumber),
      }));
    }),

  create: organizationProcedure
    .use(requirePermission("payment:create"))
    .input(
      z.object({
        paymentDate: z.string().min(1),
        amount: z.string().min(1),
        customerId: z.string().optional().nullable(),
        paymentModeId: z.string().optional().nullable(),
        invoiceRef: z.string().max(100).optional().nullable(),
        notes: z.string().max(20000).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);

      const [prefs] = await ctx.db
        .select({ defaultCurrencyId: organizationPreferences.defaultCurrencyId })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      const [maxRow] = await ctx.db
        .select({ maxSeq: max(payments.sequenceNumber) })
        .from(payments)
        .where(eq(payments.organizationId, ctx.organizationId));

      const nextSeq = (maxRow?.maxSeq ?? 0) + 1;

      await ctx.db.insert(payments).values({
        organizationId: ctx.organizationId,
        sequenceNumber: nextSeq,
        amount: input.amount,
        paymentDate: input.paymentDate,
        notes: input.notes ?? null,
        invoiceRef: input.invoiceRef ?? null,
        customerId: input.customerId ?? null,
        paymentModeId: input.paymentModeId ?? null,
        currencyId: prefs?.defaultCurrencyId ?? null,
        createdById: userId,
      });
      return { ok: true as const };
    }),

  update: organizationProcedure
    .use(requirePermission("payment:edit"))
    .input(
      z.object({
        id: z.string().min(1),
        paymentDate: z.string().min(1),
        amount: z.string().min(1),
        customerId: z.string().optional().nullable(),
        paymentModeId: z.string().optional().nullable(),
        invoiceRef: z.string().max(100).optional().nullable(),
        notes: z.string().max(20000).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(payments)
        .set({
          amount: input.amount,
          paymentDate: input.paymentDate,
          notes: input.notes ?? null,
          invoiceRef: input.invoiceRef ?? null,
          customerId: input.customerId ?? null,
          paymentModeId: input.paymentModeId ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(payments.id, input.id),
            eq(payments.organizationId, ctx.organizationId),
          ),
        );
      return { ok: true as const };
    }),

  delete: organizationProcedure
    .use(requirePermission("payment:delete"))
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(payments)
        .where(
          and(
            eq(payments.id, input.id),
            eq(payments.organizationId, ctx.organizationId),
          ),
        );
      return { ok: true as const };
    }),

  // Helpers for form dropdowns
  getDefaultCurrency: organizationProcedure
    .use(requirePermission("payment:view"))
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

  listPaymentModes: organizationProcedure
    .use(requirePermission("payment:view"))
    .query(async ({ ctx }) => {
      await ensureDefaultPaymentModes(ctx.db, ctx.organizationId);
      return ctx.db
        .select({ id: paymentModes.id, name: paymentModes.name })
        .from(paymentModes)
        .where(eq(paymentModes.organizationId, ctx.organizationId))
        .orderBy(asc(paymentModes.name));
    }),

  listCustomers: organizationProcedure
    .use(requirePermission("payment:view"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({ id: customers.id, displayName: customers.displayName })
        .from(customers)
        .where(eq(customers.organizationId, ctx.organizationId))
        .orderBy(asc(customers.displayName));
    }),

  getNextPaymentNumber: organizationProcedure
    .use(requirePermission("payment:create"))
    .query(async ({ ctx }) => {
      const [maxRow] = await ctx.db
        .select({ maxSeq: max(payments.sequenceNumber) })
        .from(payments)
        .where(eq(payments.organizationId, ctx.organizationId));
      const nextSeq = (maxRow?.maxSeq ?? 0) + 1;
      return { paymentNumber: formatPaymentNumber(nextSeq) };
    }),
});
