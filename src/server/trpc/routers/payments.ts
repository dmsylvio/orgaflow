import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNotNull, max, sql } from "drizzle-orm";
import { z } from "zod";
import type { DbClient } from "@/server/db";
import {
  currencies,
  customers,
  invoices,
  organizationPreferences,
  paymentModes,
  payments,
} from "@/server/db/schemas";
import { runWorkflowAutomations } from "@/server/services/automations/run-workflow-automations";
import { ensureDefaultPaymentModes } from "@/server/services/workspace/ensure-default-payment-modes";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

type DbTx = Parameters<Parameters<DbClient["transaction"]>[0]>[0];
type DbOrTx = DbClient | DbTx;

function formatPaymentNumber(seq: number): string {
  return `PAY-${String(seq).padStart(6, "0")}`;
}

const MONEY_EPSILON = 0.0005;

function parsePositiveMoney(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label} must be greater than zero.`,
    });
  }
  return Number(parsed.toFixed(3));
}

async function getPaidTotalForInvoice(
  db: DbOrTx,
  organizationId: string,
  invoiceId: string,
  excludePaymentId?: string,
): Promise<number> {
  const where = excludePaymentId
    ? and(
        eq(payments.organizationId, organizationId),
        eq(payments.invoiceId, invoiceId),
        sql`${payments.id} <> ${excludePaymentId}`,
      )
    : and(
        eq(payments.organizationId, organizationId),
        eq(payments.invoiceId, invoiceId),
      );

  const [row] = await db
    .select({
      paid: sql<string>`coalesce(sum(${payments.amount}), '0')`,
    })
    .from(payments)
    .where(where);

  return Number(Number(row?.paid ?? 0).toFixed(3));
}

async function refreshInvoicePaymentStatus(
  db: DbOrTx,
  organizationId: string,
  invoiceId: string,
): Promise<{ previous: string; next: string } | null> {
  const [invoice] = await db
    .select({
      id: invoices.id,
      status: invoices.status,
      total: invoices.total,
    })
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)))
    .limit(1);

  if (!invoice) {
    return null;
  }

  if (invoice.status === "VOID") {
    return null;
  }

  const total = Number(invoice.total);
  const paid = await getPaidTotalForInvoice(db, organizationId, invoice.id);

  let nextStatus: string | null = null;
  if (paid + MONEY_EPSILON >= total) {
    nextStatus = "PAID";
  } else if (paid > MONEY_EPSILON) {
    nextStatus = "PARTIALLY_PAID";
  } else if (invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID") {
    nextStatus = "PENDING";
  }

  if (!nextStatus || nextStatus === invoice.status) {
    return null;
  }

  await db
    .update(invoices)
    .set({ status: nextStatus as never, updatedAt: new Date() })
    .where(and(eq(invoices.id, invoice.id), eq(invoices.organizationId, organizationId)));

  return { previous: invoice.status, next: nextStatus };
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
          invoiceId: payments.invoiceId,
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
        invoiceId: z.string().optional().nullable(),
        invoiceRef: z.string().max(100).optional().nullable(),
        notes: z.string().max(20000).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const amountVal = parsePositiveMoney(input.amount, "Amount");

      const result = await ctx.db.transaction(async (tx) => {
        const [prefs] = await tx
          .select({
            defaultCurrencyId: organizationPreferences.defaultCurrencyId,
          })
          .from(organizationPreferences)
          .where(eq(organizationPreferences.organizationId, ctx.organizationId))
          .limit(1);

        const [maxRow] = await tx
          .select({ maxSeq: max(payments.sequenceNumber) })
          .from(payments)
          .where(eq(payments.organizationId, ctx.organizationId));

        const nextSeq = (maxRow?.maxSeq ?? 0) + 1;

        let invoiceRow: {
          id: string;
          invoiceNumber: string;
          total: string;
          currencyId: string;
          customerId: string;
          status: string;
        } | null = null;

        const invoiceId = input.invoiceId?.trim() || null;
        if (invoiceId) {
          const [inv] = await tx
            .select({
              id: invoices.id,
              invoiceNumber: invoices.invoiceNumber,
              total: invoices.total,
              currencyId: invoices.currencyId,
              customerId: invoices.customerId,
              status: invoices.status,
            })
            .from(invoices)
            .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, ctx.organizationId)))
            .limit(1);

          if (!inv) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
          }
          if (inv.status === "VOID") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot apply a payment to a void invoice.",
            });
          }

          const paid = await getPaidTotalForInvoice(tx, ctx.organizationId, inv.id);
          const remaining = Number((Number(inv.total) - paid).toFixed(3));

          if (amountVal > remaining + MONEY_EPSILON) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment amount exceeds the remaining invoice balance.",
            });
          }

          invoiceRow = inv;
        }

        await tx.insert(payments).values({
          organizationId: ctx.organizationId,
          sequenceNumber: nextSeq,
          amount: amountVal.toFixed(3),
          paymentDate: input.paymentDate,
          notes: input.notes ?? null,
          invoiceId: invoiceRow?.id ?? null,
          invoiceRef: invoiceRow?.invoiceNumber ?? (input.invoiceRef ?? null),
          customerId: invoiceRow?.customerId ?? (input.customerId ?? null),
          paymentModeId: input.paymentModeId ?? null,
          currencyId: invoiceRow?.currencyId ?? (prefs?.defaultCurrencyId ?? null),
          createdById: userId,
        });

        const statusChange = invoiceRow
          ? await refreshInvoicePaymentStatus(tx, ctx.organizationId, invoiceRow.id)
          : null;

        return { statusChange, invoiceId: invoiceRow?.id ?? null };
      });

      if (result.statusChange && result.invoiceId) {
        await runWorkflowAutomations(ctx.db, {
          organizationId: ctx.organizationId,
          triggerDocument: "invoice",
          triggerStatus: result.statusChange.next,
          documentId: result.invoiceId,
          actorUserId: userId,
          triggeredAt: new Date(),
        });
      }

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
        invoiceId: z.string().optional().nullable(),
        invoiceRef: z.string().max(100).optional().nullable(),
        notes: z.string().max(20000).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const amountVal = parsePositiveMoney(input.amount, "Amount");

      const result = await ctx.db.transaction(async (tx) => {
        const [existing] = await tx
          .select({
            id: payments.id,
            invoiceId: payments.invoiceId,
          })
          .from(payments)
          .where(and(eq(payments.id, input.id), eq(payments.organizationId, ctx.organizationId)))
          .limit(1);

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
        }

        const nextInvoiceId = input.invoiceId?.trim() || null;
        let nextInvoiceRow: {
          id: string;
          invoiceNumber: string;
          total: string;
          currencyId: string;
          customerId: string;
          status: string;
        } | null = null;

        if (nextInvoiceId) {
          const [inv] = await tx
            .select({
              id: invoices.id,
              invoiceNumber: invoices.invoiceNumber,
              total: invoices.total,
              currencyId: invoices.currencyId,
              customerId: invoices.customerId,
              status: invoices.status,
            })
            .from(invoices)
            .where(and(eq(invoices.id, nextInvoiceId), eq(invoices.organizationId, ctx.organizationId)))
            .limit(1);

          if (!inv) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
          }
          if (inv.status === "VOID") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot apply a payment to a void invoice.",
            });
          }

          const paidExcluding = await getPaidTotalForInvoice(
            tx,
            ctx.organizationId,
            inv.id,
            input.id,
          );
          const remaining = Number((Number(inv.total) - paidExcluding).toFixed(3));

          if (amountVal > remaining + MONEY_EPSILON) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment amount exceeds the remaining invoice balance.",
            });
          }

          nextInvoiceRow = inv;
        }

        await tx
          .update(payments)
          .set({
            amount: amountVal.toFixed(3),
            paymentDate: input.paymentDate,
            notes: input.notes ?? null,
            invoiceId: nextInvoiceRow?.id ?? null,
            invoiceRef: nextInvoiceRow?.invoiceNumber ?? (input.invoiceRef ?? null),
            customerId: nextInvoiceRow?.customerId ?? (input.customerId ?? null),
            paymentModeId: input.paymentModeId ?? null,
            currencyId: nextInvoiceRow?.currencyId ?? undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(payments.id, input.id), eq(payments.organizationId, ctx.organizationId)));

        const statusChanges: Array<{ invoiceId: string; change: { previous: string; next: string } }> = [];

        if (existing.invoiceId && existing.invoiceId !== nextInvoiceRow?.id) {
          const change = await refreshInvoicePaymentStatus(tx, ctx.organizationId, existing.invoiceId);
          if (change) statusChanges.push({ invoiceId: existing.invoiceId, change });
        }

        if (nextInvoiceRow?.id) {
          const change = await refreshInvoicePaymentStatus(tx, ctx.organizationId, nextInvoiceRow.id);
          if (change) statusChanges.push({ invoiceId: nextInvoiceRow.id, change });
        }

        return { statusChanges };
      });

      for (const { invoiceId, change } of result.statusChanges) {
        await runWorkflowAutomations(ctx.db, {
          organizationId: ctx.organizationId,
          triggerDocument: "invoice",
          triggerStatus: change.next,
          documentId: invoiceId,
          actorUserId: userId,
          triggeredAt: new Date(),
        });
      }

      return { ok: true as const };
    }),

  delete: organizationProcedure
    .use(requirePermission("payment:delete"))
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const result = await ctx.db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ invoiceId: payments.invoiceId })
          .from(payments)
          .where(and(eq(payments.id, input.id), eq(payments.organizationId, ctx.organizationId)))
          .limit(1);

        await tx
          .delete(payments)
          .where(and(eq(payments.id, input.id), eq(payments.organizationId, ctx.organizationId)));

        const invoiceId = existing?.invoiceId ?? null;
        const change = invoiceId
          ? await refreshInvoicePaymentStatus(tx, ctx.organizationId, invoiceId)
          : null;

        return { invoiceId, change };
      });

      if (result.invoiceId && result.change) {
        await runWorkflowAutomations(ctx.db, {
          organizationId: ctx.organizationId,
          triggerDocument: "invoice",
          triggerStatus: result.change.next,
          documentId: result.invoiceId,
          actorUserId: userId,
          triggeredAt: new Date(),
        });
      }

      return { ok: true as const };
    }),

  listInvoiceOptions: organizationProcedure
    .use(requirePermission("payment:view"))
    .input(
      z
        .object({
          includeInvoiceId: z.string().trim().min(1).optional().nullable(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const includeInvoiceId = input?.includeInvoiceId ?? null;
      const invoiceRows = await ctx.db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          total: invoices.total,
          customerId: customers.id,
          customerName: customers.displayName,
          invoiceDate: invoices.invoiceDate,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .where(eq(invoices.organizationId, ctx.organizationId))
        .orderBy(desc(invoices.invoiceDate), desc(invoices.createdAt));

      const paidRows = await ctx.db
        .select({
          invoiceId: payments.invoiceId,
          paid: sql<string>`coalesce(sum(${payments.amount}), '0')`,
        })
        .from(payments)
        .where(
          and(
            eq(payments.organizationId, ctx.organizationId),
            isNotNull(payments.invoiceId),
          ),
        )
        .groupBy(payments.invoiceId);

      const paidByInvoiceId = new Map(
        paidRows
          .filter((r) => !!r.invoiceId)
          .map((r) => [r.invoiceId as string, Number(r.paid)]),
      );

      return invoiceRows
        .filter((inv) => inv.id === includeInvoiceId || inv.status !== "VOID")
        .map((inv) => {
          const paid = Number((paidByInvoiceId.get(inv.id) ?? 0).toFixed(3));
          const remaining = Number((Number(inv.total) - paid).toFixed(3));
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            status: inv.status,
            customer: { id: inv.customerId, displayName: inv.customerName },
            total: inv.total,
            paidTotal: paid.toFixed(3),
            remaining: Math.max(remaining, 0).toFixed(3),
          };
        })
        .filter(
          (inv) =>
            inv.id === includeInvoiceId || Number(inv.remaining) > MONEY_EPSILON,
        );
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
          precision: currencies.precision,
          thousandSeparator: currencies.thousandSeparator,
          decimalSeparator: currencies.decimalSeparator,
          swapCurrencySymbol: currencies.swapCurrencySymbol,
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
