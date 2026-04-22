import "server-only";

import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, max } from "drizzle-orm";
import { z } from "zod";
import { getAppBaseUrl } from "@/lib/base-url";
import type { DbClient } from "@/server/db";
import {
  currencies,
  customers,
  documentFiles,
  estimateItems,
  estimates,
  invoiceItems,
  invoices,
  items,
  organizationPreferences,
  organizations,
  taxTypes,
  units,
} from "@/server/db/schemas";
import { can } from "@/server/iam/ability";
import { runWorkflowAutomations } from "@/server/services/automations/run-workflow-automations";
import { getOrganizationPlan } from "@/server/services/billing/get-organization-plan";
import { getUsageLimit } from "@/server/services/billing/plan-limits";
import { sendTransactionalEmail } from "@/server/services/email/resend";
import { sendInvoiceOverdueNotification } from "@/server/services/notifications/send-invoice-overdue-notification";
import { sendViewedNotification } from "@/server/services/notifications/send-viewed-notification";
import {
  createTRPCRouter,
  organizationProcedure,
  publicProcedure,
  requirePermission,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

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
  discount: z.string().nullable().optional(),
  discountFixed: z.boolean().optional(),
  taxIds: z.array(z.string()).optional(),
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatEmailBodyHtml(body: string): string {
  return escapeHtml(body).replaceAll("\n", "<br />");
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
    .select({ maxSeq: max(invoices.sequenceNumber) })
    .from(invoices)
    .where(eq(invoices.organizationId, organizationId));

  const nextSeq = (maxRow?.maxSeq ?? 0) + 1;

  return {
    defaultCurrency: currency ?? null,
    items: itemOptions,
    nextInvoiceNumber: formatInvoiceNumber(nextSeq),
    taxTypes: taxTypeOptions,
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
    discountVal: toMoneyString(discountVal),
    tax: toMoneyString(taxValue),
    total: toMoneyString(totalValue),
  };
}

export const invoicesRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("invoice:view"))
    .query(async ({ ctx }) => {
      const canViewPrices = can(ctx.ability, "invoice:view-prices");

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
          customerEmail: customers.email,
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
        subTotal: canViewPrices ? row.subTotal : null,
        total: canViewPrices ? row.total : null,
        tax: canViewPrices ? row.tax : null,
        createdAt: row.createdAt,
        customer: {
          id: row.customerId,
          displayName: row.customerName,
          email: row.customerEmail,
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
      const canViewPrices = can(ctx.ability, "invoice:view-prices");
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
          discount: invoices.discount,
          discountFixed: invoices.discountFixed,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          customerId: customers.id,
          customerName: customers.displayName,
          customerEmail: customers.email,
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
        subTotal: canViewPrices ? invoice.subTotal : null,
        total: canViewPrices ? invoice.total : null,
        tax: canViewPrices ? invoice.tax : null,
        discount: canViewPrices ? invoice.discount : null,
        discountFixed: canViewPrices ? invoice.discountFixed : null,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        customer: {
          id: invoice.customerId,
          displayName: invoice.customerName,
          email: invoice.customerEmail,
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
        items: canViewPrices
          ? lineItems
          : lineItems.map((item) => ({ ...item, price: null, total: null })),
      };
    }),

  getPublicByToken: publicProcedure
    .input(z.string().trim().min(1))
    .query(async ({ ctx, input }) => {
      const token = input;

      const [invoice] = await ctx.db
        .select({
          id: invoices.id,
          organizationId: invoices.organizationId,
          organizationName: organizations.name,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          notes: invoices.notes,
          subTotal: invoices.subTotal,
          total: invoices.total,
          tax: invoices.tax,
          discount: invoices.discount,
          discountFixed: invoices.discountFixed,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          publicLinkCreatedAt: invoices.publicLinkCreatedAt,
          customerId: customers.id,
          customerName: customers.displayName,
          customerEmail: customers.email,
          currencyId: currencies.id,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
          currencyPrecision: currencies.precision,
          currencyThousandSeparator: currencies.thousandSeparator,
          currencyDecimalSeparator: currencies.decimalSeparator,
          currencySwapSymbol: currencies.swapCurrencySymbol,
          publicLinksExpireEnabled:
            organizationPreferences.publicLinksExpireEnabled,
          publicLinksExpireDays: organizationPreferences.publicLinksExpireDays,
        })
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .innerJoin(currencies, eq(invoices.currencyId, currencies.id))
        .innerJoin(organizations, eq(invoices.organizationId, organizations.id))
        .leftJoin(
          organizationPreferences,
          eq(organizationPreferences.organizationId, invoices.organizationId),
        )
        .where(eq(invoices.publicLinkToken, token))
        .limit(1);

      if (!invoice || !invoice.publicLinkCreatedAt) {
        return { status: "invalid" as const };
      }

      const expireEnabled = invoice.publicLinksExpireEnabled ?? true;
      const expireDays = invoice.publicLinksExpireDays ?? 7;
      const expiresAt = expireEnabled
        ? new Date(
            invoice.publicLinkCreatedAt.getTime() +
              expireDays * 24 * 60 * 60 * 1000,
          )
        : null;

      if (expiresAt && expiresAt <= new Date()) {
        return { status: "expired" as const, expiresAt };
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
            eq(invoiceItems.organizationId, invoice.organizationId),
            eq(invoiceItems.invoiceId, invoice.id),
          ),
        )
        .orderBy(asc(invoiceItems.createdAt));

      const publicFiles = await ctx.db
        .select({
          id: documentFiles.id,
          fileName: documentFiles.fileName,
          storageKey: documentFiles.storageKey,
          mimeType: documentFiles.mimeType,
          fileSize: documentFiles.fileSize,
        })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.resourceType, "invoice"),
            eq(documentFiles.resourceId, invoice.id),
            eq(documentFiles.isPublic, true),
          ),
        )
        .orderBy(asc(documentFiles.createdAt));

      let nextStatus = invoice.status;
      let nextUpdatedAt = invoice.updatedAt;

      if (invoice.status === "SENT") {
        nextStatus = "VIEWED";
        nextUpdatedAt = new Date();
        await ctx.db
          .update(invoices)
          .set({ status: nextStatus, updatedAt: nextUpdatedAt })
          .where(eq(invoices.id, invoice.id));

        await runWorkflowAutomations(ctx.db, {
          organizationId: invoice.organizationId,
          triggerDocument: "invoice",
          triggerStatus: nextStatus,
          documentId: invoice.id,
          actorUserId: null,
          triggeredAt: nextUpdatedAt,
        });

        void sendViewedNotification({
          db: ctx.db,
          organizationId: invoice.organizationId,
          documentType: "invoice",
          documentNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          documentUrl: `${getAppBaseUrl()}/app/invoices/${invoice.id}`,
        });
      }

      return {
        status: "ok" as const,
        expiresAt,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: nextStatus,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          notes: invoice.notes,
          subTotal: invoice.subTotal,
          total: invoice.total,
          tax: invoice.tax,
          discount: invoice.discount,
          discountFixed: invoice.discountFixed,
          createdAt: invoice.createdAt,
          updatedAt: nextUpdatedAt,
          organization: {
            id: invoice.organizationId,
            name: invoice.organizationName,
          },
          customer: {
            id: invoice.customerId,
            displayName: invoice.customerName,
            email: invoice.customerEmail,
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
          files: publicFiles,
        },
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
    .use(requirePermission("invoice:view-prices"))
    .use(requirePermission("item:view"))
    .use(requirePermission("item:view-prices"))
    .query(async ({ ctx }) => {
      return getInvoiceFormMeta(ctx.db, ctx.organizationId);
    }),

  create: organizationProcedure
    .use(requirePermission("invoice:create"))
    .use(requirePermission("invoice:view-prices"))
    .use(requirePermission("customer:view"))
    .use(requirePermission("item:view"))
    .use(requirePermission("item:view-prices"))
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

      const { normalizedItems, subTotalValue } =
        await buildNormalizedInvoiceItems(
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
            taxPerItem: false,
            discountPerItem: prefs.discountPerItem ?? false,
            discountFixed,
            notes: nullableString(input.notes) ?? undefined,
            discount: nullableString(input.discount) ?? undefined,
            discountVal: totals.discountVal,
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

  createFromEstimate: organizationProcedure
    .use(requirePermission("invoice:create"))
    .use(requirePermission("estimate:view"))
    .input(z.object({ estimateId: z.string().trim().min(1) }))
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

      const [estimate] = await ctx.db
        .select({
          id: estimates.id,
          customerId: estimates.customerId,
          currencyId: estimates.currencyId,
          estimateDate: estimates.estimateDate,
          expiryDate: estimates.expiryDate,
          notes: estimates.notes,
          taxPerItem: estimates.taxPerItem,
          discountPerItem: estimates.discountPerItem,
          discountFixed: estimates.discountFixed,
          discount: estimates.discount,
          discountVal: estimates.discountVal,
          subTotal: estimates.subTotal,
          total: estimates.total,
          tax: estimates.tax,
        })
        .from(estimates)
        .where(
          and(
            eq(estimates.id, input.estimateId),
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
            eq(estimateItems.estimateId, input.estimateId),
          ),
        )
        .orderBy(asc(estimateItems.createdAt));

      if (lineItems.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Estimate has no line items.",
        });
      }

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
            customerId: estimate.customerId,
            currencyId: estimate.currencyId,
            sequenceNumber: nextSeq,
            invoiceDate: estimate.estimateDate,
            dueDate: estimate.expiryDate ?? undefined,
            invoiceNumber,
            status: "DRAFT",
            taxPerItem: estimate.taxPerItem ?? false,
            discountPerItem: estimate.discountPerItem ?? false,
            discountFixed: estimate.discountFixed ?? false,
            notes: estimate.notes ?? undefined,
            discount: estimate.discount ?? undefined,
            discountVal: estimate.discountVal ?? undefined,
            subTotal: estimate.subTotal,
            total: estimate.total,
            tax: estimate.tax,
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
          lineItems.map((item) => ({
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

      await runWorkflowAutomations(ctx.db, {
        organizationId: ctx.organizationId,
        triggerDocument: "invoice",
        triggerStatus: "DRAFT",
        documentId: created.id,
        actorUserId: getSessionUserId(ctx),
        triggeredAt: new Date(),
      });

      return created;
    }),

  update: organizationProcedure
    .use(requirePermission("invoice:edit"))
    .use(requirePermission("invoice:view-prices"))
    .use(requirePermission("customer:view"))
    .use(requirePermission("item:view"))
    .use(requirePermission("item:view-prices"))
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

      const { normalizedItems, subTotalValue } =
        await buildNormalizedInvoiceItems(
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

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(invoices)
          .set({
            customerId: input.customerId,
            invoiceDate: input.invoiceDate,
            dueDate: nullableString(input.dueDate) ?? undefined,
            notes: nullableString(input.notes) ?? undefined,
            discount: nullableString(input.discount) ?? undefined,
            discountVal: totals.discountVal,
            discountFixed,
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

  sendEmail: organizationProcedure
    .use(requirePermission("invoice:edit"))
    .input(
      z.object({
        id: z.string().trim().min(1),
        to: z.string().trim().email().max(320),
        subject: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(20000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();

      const [invoice] = await ctx.db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          publicLinkToken: invoices.publicLinkToken,
          publicLinkCreatedAt: invoices.publicLinkCreatedAt,
          customerName: customers.displayName,
        })
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
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

      const [prefs] = await ctx.db
        .select({
          publicLinksExpireEnabled:
            organizationPreferences.publicLinksExpireEnabled,
          publicLinksExpireDays: organizationPreferences.publicLinksExpireDays,
        })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      const expireEnabled = prefs?.publicLinksExpireEnabled ?? true;
      const expireDays = prefs?.publicLinksExpireDays ?? 7;

      const existingToken = invoice.publicLinkToken;
      const existingCreatedAt = invoice.publicLinkCreatedAt;
      const existingExpiresAt =
        expireEnabled && existingCreatedAt
          ? new Date(
              existingCreatedAt.getTime() + expireDays * 24 * 60 * 60 * 1000,
            )
          : null;
      const existingIsExpired =
        existingExpiresAt !== null ? existingExpiresAt <= now : false;

      const publicToken =
        existingToken && existingCreatedAt && !existingIsExpired
          ? existingToken
          : randomBytes(32).toString("hex");

      const publicLinkCreatedAt =
        existingToken && existingCreatedAt && !existingIsExpired
          ? existingCreatedAt
          : now;

      const viewUrl = `${getAppBaseUrl()}/invoice/${publicToken}`;

      const text = `${input.body.trim()}\n\nView invoice: ${viewUrl}`;
      const html = `
        <div style="background:#f6f6f1;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#101828;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
            <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Orgaflow Invoice</div>
              <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;">Invoice ${escapeHtml(invoice.invoiceNumber)}</h1>
            </div>
            <div style="padding:32px;">
              <div style="margin:0 0 18px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><strong>Customer:</strong> ${escapeHtml(invoice.customerName)}</p>
                <p style="margin:0;font-size:14px;line-height:1.6;"><strong>To:</strong> ${escapeHtml(input.to)}</p>
              </div>

              <div style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#101828;">
                ${formatEmailBodyHtml(input.body.trim())}
              </div>

              <a
                href="${escapeHtml(viewUrl)}"
                style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:12px;"
              >
                View invoice
              </a>

              <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#475467;">
                If the button does not work, open this link:
              </p>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.7;word-break:break-all;color:#163329;">
                ${escapeHtml(viewUrl)}
              </p>
            </div>
          </div>
        </div>
      `.trim();

      await sendTransactionalEmail({
        to: input.to,
        subject: input.subject,
        html,
        text,
      });

      const nextStatus =
        invoice.status === "DRAFT" || invoice.status === "PENDING"
          ? "SENT"
          : invoice.status;

      await ctx.db
        .update(invoices)
        .set({
          status: nextStatus,
          publicLinkToken: publicToken,
          publicLinkCreatedAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(invoices.id, invoice.id),
            eq(invoices.organizationId, ctx.organizationId),
          ),
        );

      if (nextStatus !== invoice.status) {
        await runWorkflowAutomations(ctx.db, {
          organizationId: ctx.organizationId,
          triggerDocument: "invoice",
          triggerStatus: nextStatus,
          documentId: invoice.id,
          actorUserId: getSessionUserId(ctx),
          triggeredAt: now,
        });
      }

      return { ok: true as const, id: invoice.id };
    }),

  setStatus: organizationProcedure
    .use(requirePermission("invoice:edit"))
    .input(
      z.object({
        id: z.string().trim().min(1),
        status: z.enum([
          "DRAFT",
          "PENDING",
          "SENT",
          "VIEWED",
          "PARTIALLY_PAID",
          "PAID",
          "OVERDUE",
          "VOID",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: invoices.id, status: invoices.status })
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

      if (existing.status === input.status) {
        return { ok: true as const, ...existing };
      }

      const updatedAt = new Date();
      await ctx.db
        .update(invoices)
        .set({ status: input.status, updatedAt })
        .where(
          and(
            eq(invoices.id, existing.id),
            eq(invoices.organizationId, ctx.organizationId),
          ),
        );

      await runWorkflowAutomations(ctx.db, {
        organizationId: ctx.organizationId,
        triggerDocument: "invoice",
        triggerStatus: input.status,
        documentId: existing.id,
        actorUserId: getSessionUserId(ctx),
        triggeredAt: updatedAt,
      });

      if (input.status === "OVERDUE") {
        const [inv] = await ctx.db
          .select({
            invoiceNumber: invoices.invoiceNumber,
            dueDate: invoices.dueDate,
            customerName: customers.displayName,
          })
          .from(invoices)
          .leftJoin(customers, eq(customers.id, invoices.customerId))
          .where(eq(invoices.id, existing.id))
          .limit(1);

        if (inv?.dueDate) {
          void sendInvoiceOverdueNotification({
            db: ctx.db,
            organizationId: ctx.organizationId,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName ?? "Client",
            dueDate: inv.dueDate,
            documentUrl: `${getAppBaseUrl()}/app/invoices/${existing.id}`,
          });
        }
      }

      return { ok: true as const, id: existing.id, status: input.status };
    }),

  clone: organizationProcedure
    .use(requirePermission("invoice:create"))
    .input(z.object({ id: z.string().trim().min(1) }))
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

      const [invoice] = await ctx.db
        .select({
          id: invoices.id,
          customerId: invoices.customerId,
          currencyId: invoices.currencyId,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          notes: invoices.notes,
          taxPerItem: invoices.taxPerItem,
          discountPerItem: invoices.discountPerItem,
          discountFixed: invoices.discountFixed,
          discount: invoices.discount,
          discountVal: invoices.discountVal,
          subTotal: invoices.subTotal,
          total: invoices.total,
          tax: invoices.tax,
        })
        .from(invoices)
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

      if (lineItems.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice has no line items.",
        });
      }

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
            customerId: invoice.customerId,
            currencyId: invoice.currencyId,
            sequenceNumber: nextSeq,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate ?? undefined,
            invoiceNumber,
            status: "DRAFT",
            taxPerItem: invoice.taxPerItem ?? false,
            discountPerItem: invoice.discountPerItem ?? false,
            discountFixed: invoice.discountFixed ?? false,
            notes: invoice.notes ?? undefined,
            discount: invoice.discount ?? undefined,
            discountVal: invoice.discountVal ?? undefined,
            subTotal: invoice.subTotal,
            total: invoice.total,
            tax: invoice.tax,
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
          lineItems.map((item) => ({
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

      await runWorkflowAutomations(ctx.db, {
        organizationId: ctx.organizationId,
        triggerDocument: "invoice",
        triggerStatus: "DRAFT",
        documentId: created.id,
        actorUserId: getSessionUserId(ctx),
        triggeredAt: new Date(),
      });

      return created;
    }),

  delete: organizationProcedure
    .use(requirePermission("invoice:delete"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Remove blobs antes de excluir o registro
      const { del } = await import("@vercel/blob");
      const files = await ctx.db
        .select({ storageKey: documentFiles.storageKey })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.organizationId, ctx.organizationId),
            eq(documentFiles.resourceType, "invoice"),
            eq(documentFiles.resourceId, input.id),
          ),
        );
      for (const file of files) {
        await del(file.storageKey).catch(() => null);
      }

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

  listFiles: organizationProcedure
    .use(requirePermission("invoice:view"))
    .input(z.object({ invoiceId: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: documentFiles.id,
          fileName: documentFiles.fileName,
          storageKey: documentFiles.storageKey,
          mimeType: documentFiles.mimeType,
          fileSize: documentFiles.fileSize,
        })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.resourceType, "invoice"),
            eq(documentFiles.resourceId, input.invoiceId),
            eq(documentFiles.organizationId, ctx.organizationId),
          ),
        )
        .orderBy(asc(documentFiles.createdAt));
    }),

  deleteFile: organizationProcedure
    .use(requirePermission("invoice:edit"))
    .input(z.object({ fileId: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { del } = await import("@vercel/blob");

      const [file] = await ctx.db
        .select({ id: documentFiles.id, storageKey: documentFiles.storageKey })
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

      await del(file.storageKey);
      await ctx.db.delete(documentFiles).where(eq(documentFiles.id, file.id));

      return { ok: true as const };
    }),
});
