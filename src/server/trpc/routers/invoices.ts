import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, max } from "drizzle-orm";
import { z } from "zod";
import type { DbClient } from "@/server/db";
import {
  currencies,
  customers,
  invoiceItems,
  invoices,
  items,
  organizationPreferences,
  units,
} from "@/server/db/schemas";
import { getOrganizationPlan } from "@/server/services/billing/get-organization-plan";
import { getUsageLimit } from "@/server/services/billing/plan-limits";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";

const invoiceLineItemInputSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  unitPrice: z.string().trim().min(1),
});

const invoiceUpsertSchema = z.object({
  customerId: z.string().trim().min(1),
  invoiceDate: z.string().trim().min(1),
  dueDate: z.string().trim().nullable().optional(),
  notes: z.string().trim().max(20000).nullable().optional(),
  items: z.array(invoiceLineItemInputSchema).min(1),
});

function formatInvoiceNumber(seq: number): string {
  return `INV-${String(seq).padStart(6, "0")}`;
}

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

async function getInvoiceFormMeta(db: DbClient, organizationId: string) {
  const [currency] = await db
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
    .where(eq(organizationPreferences.organizationId, organizationId))
    .limit(1);

  const customerOptions = await db
    .select({
      id: customers.id,
      displayName: customers.displayName,
    })
    .from(customers)
    .where(eq(customers.organizationId, organizationId))
    .orderBy(asc(customers.displayName));

  const itemOptions = await db
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      price: items.price,
      unitName: units.name,
    })
    .from(items)
    .leftJoin(units, eq(items.unitId, units.id))
    .where(eq(items.organizationId, organizationId))
    .orderBy(asc(items.name), asc(items.createdAt));

  const [maxRow] = await db
    .select({ maxSeq: max(invoices.sequenceNumber) })
    .from(invoices)
    .where(eq(invoices.organizationId, organizationId));

  const nextSeq = (maxRow?.maxSeq ?? 0) + 1;

  return {
    defaultCurrency: currency ?? null,
    customers: customerOptions,
    items: itemOptions,
    nextInvoiceNumber: formatInvoiceNumber(nextSeq),
  };
}

async function buildNormalizedInvoiceItems(
  db: DbClient,
  organizationId: string,
  inputItems: Array<{
    itemId: string;
    quantity: string;
    unitPrice: string;
  }>,
) {
  const itemIds = [...new Set(inputItems.map((item) => item.itemId))];

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

  const itemById = new Map(catalogItems.map((item) => [item.id, item]));

  let subTotalValue = 0;

  const normalizedItems = inputItems.map((inputItem) => {
    const catalogItem = itemById.get(inputItem.itemId);

    if (!catalogItem) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "One of the selected items was not found.",
      });
    }

    const quantityValue = parsePositiveDecimal(inputItem.quantity, "Quantity");
    const unitPriceValue = parseNonNegativeDecimal(
      inputItem.unitPrice,
      "Unit price",
    );
    const lineTotalValue = Number((quantityValue * unitPriceValue).toFixed(3));

    subTotalValue += lineTotalValue;

    return {
      itemId: catalogItem.id,
      name: catalogItem.name,
      description: catalogItem.description,
      unitName: catalogItem.unitName,
      quantity: toQuantityString(quantityValue),
      price: toMoneyString(unitPriceValue),
      total: toMoneyString(lineTotalValue),
    };
  });

  const taxValue = 0;
  const totalValue = Number((subTotalValue + taxValue).toFixed(3));

  return {
    normalizedItems,
    totals: {
      subTotal: toMoneyString(subTotalValue),
      tax: toMoneyString(taxValue),
      total: toMoneyString(totalValue),
    },
  };
}

export const invoicesRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("invoice:view"))
    .query(async ({ ctx }) => {
      const rows = await ctx.db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          notes: invoices.notes,
          subTotal: invoices.subTotal,
          total: invoices.total,
          tax: invoices.tax,
          createdAt: invoices.createdAt,
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
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .innerJoin(currencies, eq(invoices.currencyId, currencies.id))
        .where(eq(invoices.organizationId, ctx.organizationId))
        .orderBy(desc(invoices.invoiceDate), desc(invoices.createdAt));

      const itemCounts = await ctx.db
        .select({
          invoiceId: invoiceItems.invoiceId,
          total: count(invoiceItems.id),
        })
        .from(invoiceItems)
        .where(eq(invoiceItems.organizationId, ctx.organizationId))
        .groupBy(invoiceItems.invoiceId);

      const countByInvoiceId = new Map(
        itemCounts.map((row) => [row.invoiceId, Number(row.total ?? 0)]),
      );

      return rows.map((row) => ({
        id: row.id,
        invoiceNumber: row.invoiceNumber,
        status: row.status,
        invoiceDate: row.invoiceDate,
        dueDate: row.dueDate,
        notes: row.notes,
        subTotal: row.subTotal,
        total: row.total,
        tax: row.tax,
        createdAt: row.createdAt,
        customer: {
          id: row.customerId,
          displayName: row.customerName,
        },
        currency: {
          id: row.currencyId,
          code: row.currencyCode,
          symbol: row.currencySymbol,
          precision: row.currencyPrecision,
          thousandSeparator: row.currencyThousandSeparator,
          decimalSeparator: row.currencyDecimalSeparator,
          swapCurrencySymbol: row.currencySwapSymbol,
        },
        itemCount: countByInvoiceId.get(row.id) ?? 0,
      }));
    }),

  getById: organizationProcedure
    .use(requirePermission("invoice:view"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      const [invoice] = await ctx.db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          notes: invoices.notes,
          subTotal: invoices.subTotal,
          total: invoices.total,
          tax: invoices.tax,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
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
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .innerJoin(currencies, eq(invoices.currencyId, currencies.id))
        .where(
          and(
            eq(invoices.id, input.id),
            eq(invoices.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found.",
        });
      }

      const lineItems = await ctx.db
        .select({
          id: invoiceItems.id,
          itemId: invoiceItems.itemId,
          name: invoiceItems.name,
          description: invoiceItems.description,
          unitName: invoiceItems.unitName,
          quantity: invoiceItems.quantity,
          price: invoiceItems.price,
          total: invoiceItems.total,
        })
        .from(invoiceItems)
        .where(
          and(
            eq(invoiceItems.organizationId, ctx.organizationId),
            eq(invoiceItems.invoiceId, input.id),
          ),
        )
        .orderBy(asc(invoiceItems.createdAt));

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        subTotal: invoice.subTotal,
        total: invoice.total,
        tax: invoice.tax,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        customer: {
          id: invoice.customerId,
          displayName: invoice.customerName,
        },
        currency: {
          id: invoice.currencyId,
          code: invoice.currencyCode,
          symbol: invoice.currencySymbol,
          precision: invoice.currencyPrecision,
          thousandSeparator: invoice.currencyThousandSeparator,
          decimalSeparator: invoice.currencyDecimalSeparator,
          swapCurrencySymbol: invoice.currencySwapSymbol,
        },
        items: lineItems,
      };
    }),

  getUsage: organizationProcedure
    .use(requirePermission("invoice:view"))
    .query(async ({ ctx }) => {
      const plan = await getOrganizationPlan(ctx.db, ctx.organizationId);
      const limit = getUsageLimit(plan, "invoices");

      const [row] = await ctx.db
        .select({ total: count(invoices.id) })
        .from(invoices)
        .where(eq(invoices.organizationId, ctx.organizationId));

      const total = Number(row?.total ?? 0);

      return {
        plan,
        total,
        limit,
        remaining: limit === null ? null : Math.max(limit - total, 0),
        canCreate: limit === null || total < limit,
      };
    }),

  getFormMeta: organizationProcedure
    .use(requirePermission("invoice:view"))
    .query(async ({ ctx }) => {
      return getInvoiceFormMeta(ctx.db, ctx.organizationId);
    }),

  create: organizationProcedure
    .use(requirePermission("invoice:create"))
    .input(invoiceUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const plan = await getOrganizationPlan(ctx.db, ctx.organizationId);
      const limit = getUsageLimit(plan, "invoices");

      if (limit !== null) {
        const [row] = await ctx.db
          .select({ total: count(invoices.id) })
          .from(invoices)
          .where(eq(invoices.organizationId, ctx.organizationId));

        const total = Number(row?.total ?? 0);

        if (total >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You reached the limit of ${limit} invoices for the Starter plan. Upgrade to continue creating invoices.`,
          });
        }
      }

      const [prefs] = await ctx.db
        .select({
          defaultCurrencyId: organizationPreferences.defaultCurrencyId,
          taxPerItem: organizationPreferences.taxPerItem,
          discountPerItem: organizationPreferences.discountPerItem,
        })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      if (!prefs?.defaultCurrencyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Set a default currency in Settings before creating invoices.",
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

      const { normalizedItems, totals } = await buildNormalizedInvoiceItems(
        ctx.db,
        ctx.organizationId,
        input.items,
      );

      const currencyId = prefs.defaultCurrencyId;

      const created = await ctx.db.transaction(async (tx) => {
        const [maxRow] = await tx
          .select({ maxSeq: max(invoices.sequenceNumber) })
          .from(invoices)
          .where(eq(invoices.organizationId, ctx.organizationId));

        const nextSeq = (maxRow?.maxSeq ?? 0) + 1;
        const invoiceNumber = formatInvoiceNumber(nextSeq);

        const [createdInvoice] = await tx
          .insert(invoices)
          .values({
            organizationId: ctx.organizationId,
            customerId: input.customerId,
            currencyId,
            sequenceNumber: nextSeq,
            invoiceDate: input.invoiceDate,
            dueDate: nullableString(input.dueDate) ?? undefined,
            invoiceNumber,
            status: "DRAFT",
            taxPerItem: prefs.taxPerItem ?? false,
            discountPerItem: prefs.discountPerItem ?? false,
            discountFixed: false,
            notes: nullableString(input.notes) ?? undefined,
            discount: undefined,
            discountVal: undefined,
            subTotal: totals.subTotal,
            total: totals.total,
            tax: totals.tax,
            exchangeRate: undefined,
            baseDiscountVal: undefined,
            baseSubTotal: undefined,
            baseTotal: undefined,
            baseTax: undefined,
            salesTax: undefined,
          })
          .returning({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
          });

        await tx.insert(invoiceItems).values(
          normalizedItems.map((item) => ({
            organizationId: ctx.organizationId,
            invoiceId: createdInvoice.id,
            itemId: item.itemId,
            name: item.name,
            description: item.description,
            unitName: item.unitName,
            quantity: item.quantity,
            price: item.price,
            discountType: "fixed" as const,
            discount: null,
            discountVal: null,
            tax: null,
            total: item.total,
            exchangeRate: null,
            baseDiscountVal: null,
            basePrice: null,
            baseTax: null,
            baseTotal: null,
          })),
        );

        return createdInvoice;
      });

      return created;
    }),

  update: organizationProcedure
    .use(requirePermission("invoice:edit"))
    .input(
      invoiceUpsertSchema.extend({
        id: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: invoices.id,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.id, input.id),
            eq(invoices.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found.",
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

      const { normalizedItems, totals } = await buildNormalizedInvoiceItems(
        ctx.db,
        ctx.organizationId,
        input.items,
      );

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(invoices)
          .set({
            customerId: input.customerId,
            invoiceDate: input.invoiceDate,
            dueDate: nullableString(input.dueDate) ?? undefined,
            notes: nullableString(input.notes) ?? undefined,
            subTotal: totals.subTotal,
            total: totals.total,
            tax: totals.tax,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(invoices.id, input.id),
              eq(invoices.organizationId, ctx.organizationId),
            ),
          );

        await tx
          .delete(invoiceItems)
          .where(
            and(
              eq(invoiceItems.invoiceId, input.id),
              eq(invoiceItems.organizationId, ctx.organizationId),
            ),
          );

        await tx.insert(invoiceItems).values(
          normalizedItems.map((item) => ({
            organizationId: ctx.organizationId,
            invoiceId: input.id,
            itemId: item.itemId,
            name: item.name,
            description: item.description,
            unitName: item.unitName,
            quantity: item.quantity,
            price: item.price,
            discountType: "fixed" as const,
            discount: null,
            discountVal: null,
            tax: null,
            total: item.total,
            exchangeRate: null,
            baseDiscountVal: null,
            basePrice: null,
            baseTax: null,
            baseTotal: null,
          })),
        );
      });

      return {
        ok: true as const,
        id: existing.id,
      };
    }),

  delete: organizationProcedure
    .use(requirePermission("invoice:delete"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(invoices)
        .where(
          and(
            eq(invoices.id, input.id),
            eq(invoices.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),
});
