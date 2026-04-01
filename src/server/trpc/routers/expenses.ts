import "server-only";

import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  currencies,
  customers,
  documentFiles,
  expenseCategories,
  expenses,
  organizationPreferences,
  paymentModes,
} from "@/server/db/schemas";
import { ensureDefaultPaymentModes } from "@/server/services/workspace/ensure-default-payment-modes";
import { can } from "@/server/iam/ability";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

export const expensesRouter = createTRPCRouter({
  getById: organizationProcedure
    .use(requirePermission("expense:view"))
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const canViewPrices = can(ctx.ability, "expense:view-prices");
      const [row] = await ctx.db
        .select({
          id: expenses.id,
          amount: expenses.amount,
          expenseDate: expenses.expenseDate,
          notes: expenses.notes,
          createdAt: expenses.createdAt,
          categoryId: expenses.categoryId,
          customerId: expenses.customerId,
          paymentModeId: expenses.paymentModeId,
          currencyId: expenses.currencyId,
          categoryName: expenseCategories.name,
          customerDisplayName: customers.displayName,
          paymentModeName: paymentModes.name,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
          currencyPrecision: currencies.precision,
          currencyThousandSeparator: currencies.thousandSeparator,
          currencyDecimalSeparator: currencies.decimalSeparator,
          currencySwapSymbol: currencies.swapCurrencySymbol,
        })
        .from(expenses)
        .leftJoin(
          expenseCategories,
          eq(expenses.categoryId, expenseCategories.id),
        )
        .leftJoin(customers, eq(expenses.customerId, customers.id))
        .leftJoin(paymentModes, eq(expenses.paymentModeId, paymentModes.id))
        .leftJoin(currencies, eq(expenses.currencyId, currencies.id))
        .where(
          and(
            eq(expenses.id, input.id),
            eq(expenses.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      const files = await ctx.db
        .select({
          id: documentFiles.id,
          fileName: documentFiles.fileName,
          mimeType: documentFiles.mimeType,
          fileSize: documentFiles.fileSize,
          storageKey: documentFiles.storageKey,
          createdAt: documentFiles.createdAt,
        })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.organizationId, ctx.organizationId),
            eq(documentFiles.resourceType, "expense"),
            eq(documentFiles.resourceId, input.id),
          ),
        )
        .orderBy(asc(documentFiles.createdAt));

      return { ...row, amount: canViewPrices ? row.amount : null, files };
    }),

  list: organizationProcedure
    .use(requirePermission("expense:view"))
    .query(async ({ ctx }) => {
      const canViewPrices = can(ctx.ability, "expense:view-prices");

      const rows = await ctx.db
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

      return rows.map((row) => ({
        ...row,
        amount: canViewPrices ? row.amount : null,
      }));
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
        .select({
          defaultCurrencyId: organizationPreferences.defaultCurrencyId,
        })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      const [created] = await ctx.db
        .insert(expenses)
        .values({
          organizationId: ctx.organizationId,
          amount: input.amount,
          expenseDate: input.expenseDate,
          notes: input.notes ?? null,
          categoryId: input.categoryId ?? null,
          customerId: input.customerId ?? null,
          paymentModeId: input.paymentModeId ?? null,
          currencyId: prefs?.defaultCurrencyId ?? null,
          createdById: userId,
        })
        .returning({ id: expenses.id });

      return { ok: true as const, id: created.id };
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
      // Delete associated files from blob storage
      const files = await ctx.db
        .select({ storageKey: documentFiles.storageKey })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.organizationId, ctx.organizationId),
            eq(documentFiles.resourceType, "expense"),
            eq(documentFiles.resourceId, input.id),
          ),
        );

      for (const file of files) {
        await del(file.storageKey).catch(() => null);
      }

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

  listFiles: organizationProcedure
    .use(requirePermission("expense:view"))
    .input(z.object({ expenseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: documentFiles.id,
          fileName: documentFiles.fileName,
          mimeType: documentFiles.mimeType,
          fileSize: documentFiles.fileSize,
          storageKey: documentFiles.storageKey,
          createdAt: documentFiles.createdAt,
        })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.organizationId, ctx.organizationId),
            eq(documentFiles.resourceType, "expense"),
            eq(documentFiles.resourceId, input.expenseId),
          ),
        )
        .orderBy(asc(documentFiles.createdAt));
    }),

  deleteFile: organizationProcedure
    .use(requirePermission("expense:edit"))
    .input(z.object({ fileId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [file] = await ctx.db
        .select({ storageKey: documentFiles.storageKey })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.id, input.fileId),
            eq(documentFiles.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await del(file.storageKey).catch(() => null);
      await ctx.db
        .delete(documentFiles)
        .where(eq(documentFiles.id, input.fileId));

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
