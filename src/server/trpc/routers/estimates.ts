import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, max } from "drizzle-orm";
import { z } from "zod";
import type { DbClient } from "@/server/db";
import {
  currencies,
  customers,
  estimateItems,
  estimates,
  items,
  organizationPreferences,
  taxTypes,
  units,
} from "@/server/db/schemas";
import { getOrganizationPlan } from "@/server/services/billing/get-organization-plan";
import { getUsageLimit } from "@/server/services/billing/plan-limits";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";

const estimateLineItemInputSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  unitPrice: z.string().trim().min(1),
  taxId: z.string().nullable().optional(),
});

const estimateUpsertSchema = z.object({
  customerId: z.string().trim().min(1),
  estimateDate: z.string().trim().min(1),
  expiryDate: z.string().trim().nullable().optional(),
  notes: z.string().trim().max(20000).nullable().optional(),
  items: z.array(estimateLineItemInputSchema).min(1),
  globalTaxId: z.string().nullable().optional(),
});

function formatEstimateNumber(seq: number): string {
  return `EST-${String(seq).padStart(6, "0")}`;
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

async function getEstimateFormMeta(db: DbClient, organizationId: string) {
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

  const [prefs] = await db
    .select({ taxPerItem: organizationPreferences.taxPerItem })
    .from(organizationPreferences)
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

  const taxTypeOptions = await db
    .select({
      id: taxTypes.id,
      name: taxTypes.name,
      percent: taxTypes.percent,
    })
    .from(taxTypes)
    .where(eq(taxTypes.organizationId, organizationId))
    .orderBy(asc(taxTypes.name));

  const [maxRow] = await db
    .select({ maxSeq: max(estimates.sequenceNumber) })
    .from(estimates)
    .where(eq(estimates.organizationId, organizationId));

  const nextSeq = (maxRow?.maxSeq ?? 0) + 1;

  return {
    defaultCurrency: currency ?? null,
    customers: customerOptions,
    items: itemOptions,
    nextEstimateNumber: formatEstimateNumber(nextSeq),
    taxPerItem: prefs?.taxPerItem ?? false,
    taxTypes: taxTypeOptions,
  };
}

async function buildNormalizedEstimateItems(
  db: DbClient,
  organizationId: string,
  inputItems: Array<{
    itemId: string;
    quantity: string;
    unitPrice: string;
    taxId?: string | null;
  }>,
  taxTypesById: Map<string, { percent: string }>,
  globalTaxId: string | null | undefined,
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
  let taxValue = 0;

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

    let lineTaxValue = 0;
    if (inputItem.taxId) {
      const taxType = taxTypesById.get(inputItem.taxId);
      if (taxType) {
        lineTaxValue = Number(
          (lineTotalValue * (Number(taxType.percent) / 100)).toFixed(3),
        );
        taxValue += lineTaxValue;
      }
    }

    return {
      itemId: catalogItem.id,
      name: catalogItem.name,
      description: catalogItem.description,
      unitName: catalogItem.unitName,
      quantity: toQuantityString(quantityValue),
      price: toMoneyString(unitPriceValue),
      tax: lineTaxValue > 0 ? toMoneyString(lineTaxValue) : null,
      total: toMoneyString(lineTotalValue),
    };
  });

  // Global tax: applied when no per-item taxes were calculated
  if (globalTaxId && taxValue === 0) {
    const taxType = taxTypesById.get(globalTaxId);
    if (taxType) {
      taxValue = Number(
        (subTotalValue * (Number(taxType.percent) / 100)).toFixed(3),
      );
    }
  }

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

export const estimatesRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("estimate:view"))
    .query(async ({ ctx }) => {
      const rows = await ctx.db
        .select({
          id: estimates.id,
          estimateNumber: estimates.estimateNumber,
          status: estimates.status,
          estimateDate: estimates.estimateDate,
          expiryDate: estimates.expiryDate,
          notes: estimates.notes,
          subTotal: estimates.subTotal,
          total: estimates.total,
          tax: estimates.tax,
          createdAt: estimates.createdAt,
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
        .from(estimates)
        .innerJoin(customers, eq(estimates.customerId, customers.id))
        .innerJoin(currencies, eq(estimates.currencyId, currencies.id))
        .where(eq(estimates.organizationId, ctx.organizationId))
        .orderBy(desc(estimates.estimateDate), desc(estimates.createdAt));

      const itemCounts = await ctx.db
        .select({
          estimateId: estimateItems.estimateId,
          total: count(estimateItems.id),
        })
        .from(estimateItems)
        .where(eq(estimateItems.organizationId, ctx.organizationId))
        .groupBy(estimateItems.estimateId);

      const countByEstimateId = new Map(
        itemCounts.map((row) => [row.estimateId, Number(row.total ?? 0)]),
      );

      return rows.map((row) => ({
        id: row.id,
        estimateNumber: row.estimateNumber,
        status: row.status,
        estimateDate: row.estimateDate,
        expiryDate: row.expiryDate,
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
        itemCount: countByEstimateId.get(row.id) ?? 0,
      }));
    }),

  getById: organizationProcedure
    .use(requirePermission("estimate:view"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      const [estimate] = await ctx.db
        .select({
          id: estimates.id,
          estimateNumber: estimates.estimateNumber,
          status: estimates.status,
          estimateDate: estimates.estimateDate,
          expiryDate: estimates.expiryDate,
          notes: estimates.notes,
          subTotal: estimates.subTotal,
          total: estimates.total,
          tax: estimates.tax,
          createdAt: estimates.createdAt,
          updatedAt: estimates.updatedAt,
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
        .from(estimates)
        .innerJoin(customers, eq(estimates.customerId, customers.id))
        .innerJoin(currencies, eq(estimates.currencyId, currencies.id))
        .where(
          and(
            eq(estimates.id, input.id),
            eq(estimates.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!estimate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estimate not found.",
        });
      }

      const lineItems = await ctx.db
        .select({
          id: estimateItems.id,
          itemId: estimateItems.itemId,
          name: estimateItems.name,
          description: estimateItems.description,
          unitName: estimateItems.unitName,
          quantity: estimateItems.quantity,
          price: estimateItems.price,
          total: estimateItems.total,
        })
        .from(estimateItems)
        .where(
          and(
            eq(estimateItems.organizationId, ctx.organizationId),
            eq(estimateItems.estimateId, input.id),
          ),
        )
        .orderBy(asc(estimateItems.createdAt));

      return {
        id: estimate.id,
        estimateNumber: estimate.estimateNumber,
        status: estimate.status,
        estimateDate: estimate.estimateDate,
        expiryDate: estimate.expiryDate,
        notes: estimate.notes,
        subTotal: estimate.subTotal,
        total: estimate.total,
        tax: estimate.tax,
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt,
        customer: {
          id: estimate.customerId,
          displayName: estimate.customerName,
        },
        currency: {
          id: estimate.currencyId,
          code: estimate.currencyCode,
          symbol: estimate.currencySymbol,
          precision: estimate.currencyPrecision,
          thousandSeparator: estimate.currencyThousandSeparator,
          decimalSeparator: estimate.currencyDecimalSeparator,
          swapCurrencySymbol: estimate.currencySwapSymbol,
        },
        items: lineItems,
      };
    }),

  getUsage: organizationProcedure
    .use(requirePermission("estimate:view"))
    .query(async ({ ctx }) => {
      const plan = await getOrganizationPlan(ctx.db, ctx.organizationId);
      const limit = getUsageLimit(plan, "estimates");

      const [row] = await ctx.db
        .select({ total: count(estimates.id) })
        .from(estimates)
        .where(eq(estimates.organizationId, ctx.organizationId));

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
    .use(requirePermission("estimate:view"))
    .query(async ({ ctx }) => {
      return getEstimateFormMeta(ctx.db, ctx.organizationId);
    }),

  create: organizationProcedure
    .use(requirePermission("estimate:create"))
    .input(estimateUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const plan = await getOrganizationPlan(ctx.db, ctx.organizationId);
      const limit = getUsageLimit(plan, "estimates");

      if (limit !== null) {
        const [row] = await ctx.db
          .select({ total: count(estimates.id) })
          .from(estimates)
          .where(eq(estimates.organizationId, ctx.organizationId));

        const total = Number(row?.total ?? 0);

        if (total >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You reached the limit of ${limit} estimates for the Starter plan. Upgrade to continue creating estimates.`,
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
            "Set a default currency in Settings before creating estimates.",
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

      const orgTaxTypes = await ctx.db
        .select({ id: taxTypes.id, percent: taxTypes.percent })
        .from(taxTypes)
        .where(eq(taxTypes.organizationId, ctx.organizationId));

      const taxTypesById = new Map(
        orgTaxTypes.map((t) => [t.id, { percent: t.percent }]),
      );

      const { normalizedItems, totals } = await buildNormalizedEstimateItems(
        ctx.db,
        ctx.organizationId,
        input.items,
        taxTypesById,
        prefs.taxPerItem ? null : input.globalTaxId,
      );

      const currencyId = prefs.defaultCurrencyId;

      const created = await ctx.db.transaction(async (tx) => {
        const [maxRow] = await tx
          .select({ maxSeq: max(estimates.sequenceNumber) })
          .from(estimates)
          .where(eq(estimates.organizationId, ctx.organizationId));

        const nextSeq = (maxRow?.maxSeq ?? 0) + 1;
        const estimateNumber = formatEstimateNumber(nextSeq);

        const [createdEstimate] = await tx
          .insert(estimates)
          .values({
            organizationId: ctx.organizationId,
            customerId: input.customerId,
            currencyId,
            sequenceNumber: nextSeq,
            customerSequenceNumber: undefined,
            estimateDate: input.estimateDate,
            expiryDate: nullableString(input.expiryDate) ?? undefined,
            estimateNumber,
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
            id: estimates.id,
            estimateNumber: estimates.estimateNumber,
          });

        await tx.insert(estimateItems).values(
          normalizedItems.map((item) => ({
            organizationId: ctx.organizationId,
            estimateId: createdEstimate.id,
            itemId: item.itemId,
            name: item.name,
            description: item.description,
            unitName: item.unitName,
            quantity: item.quantity,
            price: item.price,
            discountType: "fixed" as const,
            discount: null,
            discountVal: null,
            tax: item.tax,
            total: item.total,
            exchangeRate: null,
            baseDiscountVal: null,
            basePrice: null,
            baseTax: null,
            baseTotal: null,
          })),
        );

        return createdEstimate;
      });

      return created;
    }),

  update: organizationProcedure
    .use(requirePermission("estimate:edit"))
    .input(
      estimateUpsertSchema.extend({
        id: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: estimates.id,
          currencyId: estimates.currencyId,
          status: estimates.status,
          taxPerItem: estimates.taxPerItem,
          discountPerItem: estimates.discountPerItem,
          discountFixed: estimates.discountFixed,
        })
        .from(estimates)
        .where(
          and(
            eq(estimates.id, input.id),
            eq(estimates.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estimate not found.",
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

      const orgTaxTypes = await ctx.db
        .select({ id: taxTypes.id, percent: taxTypes.percent })
        .from(taxTypes)
        .where(eq(taxTypes.organizationId, ctx.organizationId));

      const taxTypesById = new Map(
        orgTaxTypes.map((t) => [t.id, { percent: t.percent }]),
      );

      const { normalizedItems, totals } = await buildNormalizedEstimateItems(
        ctx.db,
        ctx.organizationId,
        input.items,
        taxTypesById,
        existing.taxPerItem ? null : input.globalTaxId,
      );

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(estimates)
          .set({
            customerId: input.customerId,
            estimateDate: input.estimateDate,
            expiryDate: nullableString(input.expiryDate) ?? undefined,
            notes: nullableString(input.notes) ?? undefined,
            subTotal: totals.subTotal,
            total: totals.total,
            tax: totals.tax,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(estimates.id, input.id),
              eq(estimates.organizationId, ctx.organizationId),
            ),
          );

        await tx
          .delete(estimateItems)
          .where(
            and(
              eq(estimateItems.estimateId, input.id),
              eq(estimateItems.organizationId, ctx.organizationId),
            ),
          );

        await tx.insert(estimateItems).values(
          normalizedItems.map((item) => ({
            organizationId: ctx.organizationId,
            estimateId: input.id,
            itemId: item.itemId,
            name: item.name,
            description: item.description,
            unitName: item.unitName,
            quantity: item.quantity,
            price: item.price,
            discountType: "fixed" as const,
            discount: null,
            discountVal: null,
            tax: item.tax,
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
    .use(requirePermission("estimate:delete"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(estimates)
        .where(
          and(
            eq(estimates.id, input.id),
            eq(estimates.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),
});
