import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { recurringInvoiceUpsertSchema } from "@/schemas/recurring-invoice";
import type { DbClient } from "@/server/db";
import {
  currencies,
  customers,
  invoices,
  items,
  organizationPreferences,
  recurringInvoiceTemplateItems,
  recurringInvoiceTemplates,
  taxTypes,
  units,
} from "@/server/db/schemas";
import { calculateInitialNextRunAt } from "@/server/services/recurring-invoices/calculate-next-run";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";

function parsePositiveDecimal(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label} must be greater than zero.`,
    });
  }
  return parsed;
}

function parseNonNegativeDecimal(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label} must be zero or greater.`,
    });
  }
  return parsed;
}

function toMoneyString(value: number): string {
  return value.toFixed(3);
}

function toQuantityString(value: number): string {
  return value.toFixed(4);
}

function nullableString(value: string | null | undefined): string | null {
  const nextValue = value?.trim() ?? "";
  return nextValue.length > 0 ? nextValue : null;
}

async function buildNormalizedItems(
  db: DbClient,
  organizationId: string,
  inputItems: Array<{ itemId: string; quantity: string; unitPrice: string }>,
) {
  const itemIds = [...new Set(inputItems.map((i) => i.itemId))];
  const catalogItems = await db
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      unitName: units.name,
    })
    .from(items)
    .leftJoin(units, eq(items.unitId, units.id))
    .where(
      and(eq(items.organizationId, organizationId), inArray(items.id, itemIds)),
    );

  const itemById = new Map(catalogItems.map((i) => [i.id, i]));
  let subTotalValue = 0;

  const normalizedItems = inputItems.map((inputItem) => {
    const catalogItem = itemById.get(inputItem.itemId);
    if (!catalogItem) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "One of the selected items was not found.",
      });
    }
    const qty = parsePositiveDecimal(inputItem.quantity, "Quantity");
    const price = parseNonNegativeDecimal(inputItem.unitPrice, "Unit price");
    const lineTotal = Number((qty * price).toFixed(3));
    subTotalValue += lineTotal;

    return {
      itemId: catalogItem.id,
      name: catalogItem.name,
      description: catalogItem.description,
      unitName: catalogItem.unitName,
      quantity: toQuantityString(qty),
      price: toMoneyString(price),
      total: toMoneyString(lineTotal),
    };
  });

  return { normalizedItems, subTotalValue };
}

async function computeSummaryTotals(
  db: DbClient,
  organizationId: string,
  subTotalValue: number,
  discountInput: string | null | undefined,
  discountFixed: boolean,
  taxIds: string[] | undefined,
) {
  const discountStr = discountInput?.trim() ?? "";
  const discountInputVal = discountStr
    ? parseNonNegativeDecimal(discountStr, "Discount")
    : 0;

  const discountValRaw = discountFixed
    ? discountInputVal
    : subTotalValue * (discountInputVal / 100);
  const discountVal = Math.min(discountValRaw, subTotalValue);
  const discountedSub = subTotalValue - discountVal;

  let taxValue = 0;
  if (taxIds?.length) {
    const orgTaxTypes = await db
      .select({ id: taxTypes.id, percent: taxTypes.percent })
      .from(taxTypes)
      .where(
        and(
          eq(taxTypes.organizationId, organizationId),
          inArray(taxTypes.id, taxIds),
        ),
      );
    for (const t of orgTaxTypes) {
      taxValue += discountedSub * (Number(t.percent) / 100);
    }
    taxValue = Number(taxValue.toFixed(3));
  }

  const totalValue = Number((discountedSub + taxValue).toFixed(3));

  return {
    subTotal: toMoneyString(subTotalValue),
    tax: toMoneyString(taxValue),
    total: toMoneyString(totalValue),
  };
}

export const recurringInvoicesRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("recurring-invoice:view"))
    .query(async ({ ctx }) => {
      const rows = await ctx.db
        .select({
          id: recurringInvoiceTemplates.id,
          name: recurringInvoiceTemplates.name,
          frequency: recurringInvoiceTemplates.frequency,
          status: recurringInvoiceTemplates.status,
          nextRunAt: recurringInvoiceTemplates.nextRunAt,
          generatedCount: recurringInvoiceTemplates.generatedCount,
          sendAutomatically: recurringInvoiceTemplates.sendAutomatically,
          subTotal: recurringInvoiceTemplates.subTotal,
          total: recurringInvoiceTemplates.total,
          createdAt: recurringInvoiceTemplates.createdAt,
          customerId: customers.id,
          customerName: customers.displayName,
          currencyId: currencies.id,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
          currencyPrecision: currencies.precision,
          currencyThousandSeparator: currencies.thousandSeparator,
          currencyDecimalSeparator: currencies.decimalSeparator,
          currencySwapSymbol: currencies.swapCurrencySymbol,
        })
        .from(recurringInvoiceTemplates)
        .innerJoin(
          customers,
          eq(recurringInvoiceTemplates.customerId, customers.id),
        )
        .innerJoin(
          currencies,
          eq(recurringInvoiceTemplates.currencyId, currencies.id),
        )
        .where(eq(recurringInvoiceTemplates.organizationId, ctx.organizationId))
        .orderBy(desc(recurringInvoiceTemplates.createdAt));

      const itemCounts = await ctx.db
        .select({
          templateId: recurringInvoiceTemplateItems.templateId,
          total: count(recurringInvoiceTemplateItems.id),
        })
        .from(recurringInvoiceTemplateItems)
        .where(
          eq(recurringInvoiceTemplateItems.organizationId, ctx.organizationId),
        )
        .groupBy(recurringInvoiceTemplateItems.templateId);

      const countByTemplateId = new Map(
        itemCounts.map((row) => [row.templateId, Number(row.total ?? 0)]),
      );

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        frequency: row.frequency,
        status: row.status,
        nextRunAt: row.nextRunAt,
        generatedCount: row.generatedCount,
        sendAutomatically: row.sendAutomatically,
        subTotal: row.subTotal,
        total: row.total,
        createdAt: row.createdAt,
        customer: { id: row.customerId, displayName: row.customerName },
        currency: {
          id: row.currencyId,
          code: row.currencyCode,
          symbol: row.currencySymbol,
          precision: row.currencyPrecision,
          thousandSeparator: row.currencyThousandSeparator,
          decimalSeparator: row.currencyDecimalSeparator,
          swapCurrencySymbol: row.currencySwapSymbol,
        },
        itemCount: countByTemplateId.get(row.id) ?? 0,
      }));
    }),

  getById: organizationProcedure
    .use(requirePermission("recurring-invoice:view"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select({
          id: recurringInvoiceTemplates.id,
          name: recurringInvoiceTemplates.name,
          frequency: recurringInvoiceTemplates.frequency,
          startDate: recurringInvoiceTemplates.startDate,
          nextRunAt: recurringInvoiceTemplates.nextRunAt,
          limitType: recurringInvoiceTemplates.limitType,
          limitDate: recurringInvoiceTemplates.limitDate,
          limitCount: recurringInvoiceTemplates.limitCount,
          generatedCount: recurringInvoiceTemplates.generatedCount,
          status: recurringInvoiceTemplates.status,
          sendAutomatically: recurringInvoiceTemplates.sendAutomatically,
          dueDaysOffset: recurringInvoiceTemplates.dueDaysOffset,
          notes: recurringInvoiceTemplates.notes,
          discount: recurringInvoiceTemplates.discount,
          discountFixed: recurringInvoiceTemplates.discountFixed,
          subTotal: recurringInvoiceTemplates.subTotal,
          total: recurringInvoiceTemplates.total,
          tax: recurringInvoiceTemplates.tax,
          createdAt: recurringInvoiceTemplates.createdAt,
          updatedAt: recurringInvoiceTemplates.updatedAt,
          customerId: customers.id,
          customerName: customers.displayName,
          currencyId: currencies.id,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
          currencyPrecision: currencies.precision,
          currencyThousandSeparator: currencies.thousandSeparator,
          currencyDecimalSeparator: currencies.decimalSeparator,
          currencySwapSymbol: currencies.swapCurrencySymbol,
        })
        .from(recurringInvoiceTemplates)
        .innerJoin(
          customers,
          eq(recurringInvoiceTemplates.customerId, customers.id),
        )
        .innerJoin(
          currencies,
          eq(recurringInvoiceTemplates.currencyId, currencies.id),
        )
        .where(
          and(
            eq(recurringInvoiceTemplates.id, input.id),
            eq(recurringInvoiceTemplates.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice not found.",
        });
      }

      const lineItems = await ctx.db
        .select({
          id: recurringInvoiceTemplateItems.id,
          itemId: recurringInvoiceTemplateItems.itemId,
          name: recurringInvoiceTemplateItems.name,
          description: recurringInvoiceTemplateItems.description,
          unitName: recurringInvoiceTemplateItems.unitName,
          quantity: recurringInvoiceTemplateItems.quantity,
          price: recurringInvoiceTemplateItems.price,
          total: recurringInvoiceTemplateItems.total,
        })
        .from(recurringInvoiceTemplateItems)
        .where(eq(recurringInvoiceTemplateItems.templateId, input.id))
        .orderBy(asc(recurringInvoiceTemplateItems.createdAt));

      return {
        id: template.id,
        name: template.name,
        frequency: template.frequency,
        startDate: template.startDate,
        nextRunAt: template.nextRunAt,
        limitType: template.limitType,
        limitDate: template.limitDate,
        limitCount: template.limitCount,
        generatedCount: template.generatedCount,
        status: template.status,
        sendAutomatically: template.sendAutomatically,
        dueDaysOffset: template.dueDaysOffset,
        notes: template.notes,
        discount: template.discount,
        discountFixed: template.discountFixed,
        subTotal: template.subTotal,
        total: template.total,
        tax: template.tax,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        customer: {
          id: template.customerId,
          displayName: template.customerName,
        },
        currency: {
          id: template.currencyId,
          code: template.currencyCode,
          symbol: template.currencySymbol,
          precision: template.currencyPrecision,
          thousandSeparator: template.currencyThousandSeparator,
          decimalSeparator: template.currencyDecimalSeparator,
          swapCurrencySymbol: template.currencySwapSymbol,
        },
        items: lineItems,
      };
    }),

  getFormMeta: organizationProcedure
    .use(requirePermission("recurring-invoice:view"))
    .use(requirePermission("recurring-invoice:view-prices"))
    .use(requirePermission("item:view"))
    .use(requirePermission("item:view-prices"))
    .query(async ({ ctx }) => {
      const [currency] = await ctx.db
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

      const itemOptions = await ctx.db
        .select({
          id: items.id,
          name: items.name,
          description: items.description,
          price: items.price,
          unitName: units.name,
        })
        .from(items)
        .leftJoin(units, eq(items.unitId, units.id))
        .where(eq(items.organizationId, ctx.organizationId))
        .orderBy(asc(items.name), asc(items.createdAt));

      const taxTypeOptions = await ctx.db
        .select({
          id: taxTypes.id,
          name: taxTypes.name,
          percent: taxTypes.percent,
        })
        .from(taxTypes)
        .where(eq(taxTypes.organizationId, ctx.organizationId))
        .orderBy(asc(taxTypes.name));

      return {
        defaultCurrency: currency ?? null,
        items: itemOptions,
        taxTypes: taxTypeOptions,
      };
    }),

  create: organizationProcedure
    .use(requirePermission("recurring-invoice:create"))
    .use(requirePermission("recurring-invoice:view-prices"))
    .use(requirePermission("customer:view"))
    .use(requirePermission("item:view"))
    .use(requirePermission("item:view-prices"))
    .input(recurringInvoiceUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const [prefs] = await ctx.db
        .select({
          defaultCurrencyId: organizationPreferences.defaultCurrencyId,
        })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      if (!prefs?.defaultCurrencyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Set a default currency in Settings before creating recurring invoices.",
        });
      }
      const defaultCurrencyId = prefs.defaultCurrencyId;

      const [customer] = await ctx.db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.id, input.customerId),
            eq(customers.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!customer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected customer was not found.",
        });
      }

      const { normalizedItems, subTotalValue } = await buildNormalizedItems(
        ctx.db,
        ctx.organizationId,
        input.items,
      );

      const discountFixed = input.discountFixed ?? false;
      const totals = await computeSummaryTotals(
        ctx.db,
        ctx.organizationId,
        subTotalValue,
        input.discount,
        discountFixed,
        input.taxIds,
      );

      const nextRunAt = calculateInitialNextRunAt(
        input.frequency,
        input.startDate,
      );

      const [created] = await ctx.db.transaction(async (tx) => {
        const [template] = await tx
          .insert(recurringInvoiceTemplates)
          .values({
            organizationId: ctx.organizationId,
            customerId: input.customerId,
            currencyId: defaultCurrencyId,
            name: input.name,
            frequency: input.frequency,
            startDate: input.startDate,
            nextRunAt,
            limitType: input.limitType,
            limitDate: nullableString(input.limitDate) ?? undefined,
            limitCount: input.limitCount ?? undefined,
            status: "active",
            sendAutomatically: input.sendAutomatically ?? false,
            dueDaysOffset: input.dueDaysOffset ?? undefined,
            notes: nullableString(input.notes) ?? undefined,
            discount: nullableString(input.discount) ?? undefined,
            discountFixed,
            subTotal: totals.subTotal,
            total: totals.total,
            tax: totals.tax,
          })
          .returning({ id: recurringInvoiceTemplates.id });

        if (!template) throw new Error("Template insert returned no rows");

        await tx.insert(recurringInvoiceTemplateItems).values(
          normalizedItems.map((item) => ({
            organizationId: ctx.organizationId,
            templateId: template.id,
            itemId: item.itemId,
            name: item.name,
            description: item.description,
            unitName: item.unitName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        );

        return [template];
      });

      if (!created) {
        throw new Error("Template insert returned no rows");
      }

      return created;
    }),

  update: organizationProcedure
    .use(requirePermission("recurring-invoice:edit"))
    .use(requirePermission("recurring-invoice:view-prices"))
    .use(requirePermission("customer:view"))
    .use(requirePermission("item:view"))
    .use(requirePermission("item:view-prices"))
    .input(
      recurringInvoiceUpsertSchema.extend({
        id: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: recurringInvoiceTemplates.id,
          currencyId: recurringInvoiceTemplates.currencyId,
        })
        .from(recurringInvoiceTemplates)
        .where(
          and(
            eq(recurringInvoiceTemplates.id, input.id),
            eq(recurringInvoiceTemplates.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice not found.",
        });
      }

      const [customer] = await ctx.db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.id, input.customerId),
            eq(customers.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!customer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected customer was not found.",
        });
      }

      const { normalizedItems, subTotalValue } = await buildNormalizedItems(
        ctx.db,
        ctx.organizationId,
        input.items,
      );

      const discountFixed = input.discountFixed ?? false;
      const totals = await computeSummaryTotals(
        ctx.db,
        ctx.organizationId,
        subTotalValue,
        input.discount,
        discountFixed,
        input.taxIds,
      );

      const nextRunAt = calculateInitialNextRunAt(
        input.frequency,
        input.startDate,
      );

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(recurringInvoiceTemplates)
          .set({
            customerId: input.customerId,
            name: input.name,
            frequency: input.frequency,
            startDate: input.startDate,
            nextRunAt,
            limitType: input.limitType,
            limitDate: nullableString(input.limitDate) ?? undefined,
            limitCount: input.limitCount ?? undefined,
            sendAutomatically: input.sendAutomatically ?? false,
            dueDaysOffset: input.dueDaysOffset ?? undefined,
            notes: nullableString(input.notes) ?? undefined,
            discount: nullableString(input.discount) ?? undefined,
            discountFixed,
            subTotal: totals.subTotal,
            total: totals.total,
            tax: totals.tax,
            updatedAt: new Date(),
          })
          .where(eq(recurringInvoiceTemplates.id, input.id));

        // Replace items
        await tx
          .delete(recurringInvoiceTemplateItems)
          .where(eq(recurringInvoiceTemplateItems.templateId, input.id));

        await tx.insert(recurringInvoiceTemplateItems).values(
          normalizedItems.map((item) => ({
            organizationId: ctx.organizationId,
            templateId: input.id,
            itemId: item.itemId,
            name: item.name,
            description: item.description,
            unitName: item.unitName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        );
      });

      return { id: input.id };
    }),

  setStatus: organizationProcedure
    .use(requirePermission("recurring-invoice:edit"))
    .input(
      z.object({
        id: z.string().trim().min(1),
        status: z.enum(["active", "on_hold"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: recurringInvoiceTemplates.id })
        .from(recurringInvoiceTemplates)
        .where(
          and(
            eq(recurringInvoiceTemplates.id, input.id),
            eq(recurringInvoiceTemplates.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice not found.",
        });
      }

      await ctx.db
        .update(recurringInvoiceTemplates)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(recurringInvoiceTemplates.id, input.id));

      return { id: input.id };
    }),

  delete: organizationProcedure
    .use(requirePermission("recurring-invoice:delete"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: recurringInvoiceTemplates.id })
        .from(recurringInvoiceTemplates)
        .where(
          and(
            eq(recurringInvoiceTemplates.id, input.id),
            eq(recurringInvoiceTemplates.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice not found.",
        });
      }

      await ctx.db
        .delete(recurringInvoiceTemplates)
        .where(eq(recurringInvoiceTemplates.id, input.id));

      return { id: input.id };
    }),

  listGeneratedInvoices: organizationProcedure
    .use(requirePermission("recurring-invoice:view"))
    .use(requirePermission("invoice:view"))
    .input(z.object({ templateId: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          status: invoices.status,
          total: invoices.total,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, ctx.organizationId),
            eq(invoices.recurringTemplateId, input.templateId),
          ),
        )
        .orderBy(desc(invoices.createdAt));

      return rows;
    }),
});
