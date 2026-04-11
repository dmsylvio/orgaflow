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
  items,
  organizationPreferences,
  organizations,
  taxTypes,
  units,
} from "@/server/db/schemas";
import { runWorkflowAutomations } from "@/server/services/automations/run-workflow-automations";
import { getOrganizationPlan } from "@/server/services/billing/get-organization-plan";
import { getUsageLimit } from "@/server/services/billing/plan-limits";
import { sendTransactionalEmail } from "@/server/services/email/resend";
import { sendEstimateStatusNotification } from "@/server/services/notifications/send-estimate-status-notification";
import { sendViewedNotification } from "@/server/services/notifications/send-viewed-notification";
import { can } from "@/server/iam/ability";
import {
  createTRPCRouter,
  organizationProcedure,
  publicProcedure,
  requirePermission,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

const estimateLineItemInputSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  unitPrice: z.string().trim().min(1),
});

const estimateUpsertSchema = z.object({
  customerId: z.string().trim().min(1),
  estimateDate: z.string().trim().min(1),
  expiryDate: z.string().trim().nullable().optional(),
  notes: z.string().trim().max(20000).nullable().optional(),
  items: z.array(estimateLineItemInputSchema).min(1),
  discount: z.string().nullable().optional(),
  discountFixed: z.boolean().optional(),
  taxIds: z.array(z.string()).optional(),
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

export const estimatesRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("estimate:view"))
    .query(async ({ ctx }) => {
      const canViewPrices = can(ctx.ability, "estimate:view-prices");

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
          customerEmail: customers.email,
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
        itemCount: countByEstimateId.get(row.id) ?? 0,
      }));
    }),

  getById: organizationProcedure
    .use(requirePermission("estimate:view"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      const canViewPrices = can(ctx.ability, "estimate:view-prices");
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
          discount: estimates.discount,
          discountFixed: estimates.discountFixed,
          createdAt: estimates.createdAt,
          updatedAt: estimates.updatedAt,
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
        subTotal: canViewPrices ? estimate.subTotal : null,
        total: canViewPrices ? estimate.total : null,
        tax: canViewPrices ? estimate.tax : null,
        discount: canViewPrices ? estimate.discount : null,
        discountFixed: canViewPrices ? estimate.discountFixed : null,
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt,
        customer: {
          id: estimate.customerId,
          displayName: estimate.customerName,
          email: estimate.customerEmail,
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
        items: canViewPrices
          ? lineItems
          : lineItems.map((item) => ({ ...item, price: null, total: null })),
      };
    }),

  getPublicByToken: publicProcedure
    .input(z.string().trim().min(1))
    .query(async ({ ctx, input }) => {
      const token = input;

      const [estimate] = await ctx.db
        .select({
          id: estimates.id,
          organizationId: estimates.organizationId,
          organizationName: organizations.name,
          estimateNumber: estimates.estimateNumber,
          status: estimates.status,
          estimateDate: estimates.estimateDate,
          expiryDate: estimates.expiryDate,
          notes: estimates.notes,
          rejectionReason: estimates.rejectionReason,
          subTotal: estimates.subTotal,
          total: estimates.total,
          tax: estimates.tax,
          discount: estimates.discount,
          discountFixed: estimates.discountFixed,
          createdAt: estimates.createdAt,
          updatedAt: estimates.updatedAt,
          publicLinkCreatedAt: estimates.publicLinkCreatedAt,
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
        .from(estimates)
        .innerJoin(customers, eq(estimates.customerId, customers.id))
        .innerJoin(currencies, eq(estimates.currencyId, currencies.id))
        .innerJoin(
          organizations,
          eq(estimates.organizationId, organizations.id),
        )
        .leftJoin(
          organizationPreferences,
          eq(organizationPreferences.organizationId, estimates.organizationId),
        )
        .where(eq(estimates.publicLinkToken, token))
        .limit(1);

      if (!estimate || !estimate.publicLinkCreatedAt) {
        return { status: "invalid" as const };
      }

      const expireEnabled = estimate.publicLinksExpireEnabled ?? true;
      const expireDays = estimate.publicLinksExpireDays ?? 7;
      const expiresAt = expireEnabled
        ? new Date(
            estimate.publicLinkCreatedAt.getTime() +
              expireDays * 24 * 60 * 60 * 1000,
          )
        : null;

      if (expiresAt && expiresAt <= new Date()) {
        return { status: "expired" as const, expiresAt };
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
            eq(estimateItems.organizationId, estimate.organizationId),
            eq(estimateItems.estimateId, estimate.id),
          ),
        )
        .orderBy(asc(estimateItems.createdAt));

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
            eq(documentFiles.resourceType, "estimate"),
            eq(documentFiles.resourceId, estimate.id),
            eq(documentFiles.isPublic, true),
          ),
        )
        .orderBy(asc(documentFiles.createdAt));

      let nextStatus = estimate.status;
      let nextUpdatedAt = estimate.updatedAt;

      if (estimate.status === "SENT") {
        nextStatus = "VIEWED";
        nextUpdatedAt = new Date();
        await ctx.db
          .update(estimates)
          .set({ status: nextStatus, updatedAt: nextUpdatedAt })
          .where(eq(estimates.id, estimate.id));

        await runWorkflowAutomations(ctx.db, {
          organizationId: estimate.organizationId,
          triggerDocument: "estimate",
          triggerStatus: nextStatus,
          documentId: estimate.id,
          actorUserId: null,
          triggeredAt: nextUpdatedAt,
        });

        void sendViewedNotification({
          db: ctx.db,
          organizationId: estimate.organizationId,
          documentType: "estimate",
          documentNumber: estimate.estimateNumber,
          customerName: estimate.customerName,
          documentUrl: `${getAppBaseUrl()}/app/estimates/${estimate.id}`,
        });
      }

      return {
        status: "ok" as const,
        expiresAt,
        estimate: {
          id: estimate.id,
          estimateNumber: estimate.estimateNumber,
          status: nextStatus,
          estimateDate: estimate.estimateDate,
          expiryDate: estimate.expiryDate,
          notes: estimate.notes,
          subTotal: estimate.subTotal,
          total: estimate.total,
          tax: estimate.tax,
          discount: estimate.discount,
          discountFixed: estimate.discountFixed,
          createdAt: estimate.createdAt,
          updatedAt: nextUpdatedAt,
          organization: {
            id: estimate.organizationId,
            name: estimate.organizationName,
          },
          customer: {
            id: estimate.customerId,
            displayName: estimate.customerName,
            email: estimate.customerEmail,
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
          files: publicFiles,
          rejectionReason: estimate.rejectionReason ?? null,
        },
      };
    }),

  approvePublic: publicProcedure
    .input(z.string().trim().min(1))
    .mutation(async ({ ctx, input }) => {
      const token = input;

      const [estimate] = await ctx.db
        .select({
          id: estimates.id,
          organizationId: estimates.organizationId,
          status: estimates.status,
          estimateNumber: estimates.estimateNumber,
          customerName: customers.displayName,
          publicLinkCreatedAt: estimates.publicLinkCreatedAt,
          publicLinksExpireEnabled:
            organizationPreferences.publicLinksExpireEnabled,
          publicLinksExpireDays: organizationPreferences.publicLinksExpireDays,
        })
        .from(estimates)
        .leftJoin(customers, eq(customers.id, estimates.customerId))
        .leftJoin(
          organizationPreferences,
          eq(organizationPreferences.organizationId, estimates.organizationId),
        )
        .where(eq(estimates.publicLinkToken, token))
        .limit(1);

      if (!estimate || !estimate.publicLinkCreatedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const expireEnabled = estimate.publicLinksExpireEnabled ?? true;
      const expireDays = estimate.publicLinksExpireDays ?? 7;
      const expiresAt = expireEnabled
        ? new Date(
            estimate.publicLinkCreatedAt.getTime() +
              expireDays * 24 * 60 * 60 * 1000,
          )
        : null;

      if (expiresAt && expiresAt <= new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Link expired" });
      }

      if (
        estimate.status !== "SENT" &&
        estimate.status !== "VIEWED"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Estimate cannot be approved in its current state.",
        });
      }

      const now = new Date();
      await ctx.db
        .update(estimates)
        .set({ status: "APPROVED", updatedAt: now })
        .where(eq(estimates.id, estimate.id));

      await runWorkflowAutomations(ctx.db, {
        organizationId: estimate.organizationId,
        triggerDocument: "estimate",
        triggerStatus: "APPROVED",
        documentId: estimate.id,
        actorUserId: null,
        triggeredAt: now,
      });

      void sendEstimateStatusNotification({
        db: ctx.db,
        organizationId: estimate.organizationId,
        status: "APPROVED",
        estimateNumber: estimate.estimateNumber,
        customerName: estimate.customerName ?? "Client",
        documentUrl: `${getAppBaseUrl()}/app/estimates/${estimate.id}`,
      });

      return { ok: true };
    }),

  rejectPublic: publicProcedure
    .input(
      z.object({
        token: z.string().trim().min(1),
        reason: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { token, reason } = input;

      const [estimate] = await ctx.db
        .select({
          id: estimates.id,
          organizationId: estimates.organizationId,
          status: estimates.status,
          estimateNumber: estimates.estimateNumber,
          customerName: customers.displayName,
          publicLinkCreatedAt: estimates.publicLinkCreatedAt,
          publicLinksExpireEnabled:
            organizationPreferences.publicLinksExpireEnabled,
          publicLinksExpireDays: organizationPreferences.publicLinksExpireDays,
        })
        .from(estimates)
        .leftJoin(customers, eq(customers.id, estimates.customerId))
        .leftJoin(
          organizationPreferences,
          eq(organizationPreferences.organizationId, estimates.organizationId),
        )
        .where(eq(estimates.publicLinkToken, token))
        .limit(1);

      if (!estimate || !estimate.publicLinkCreatedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const expireEnabled = estimate.publicLinksExpireEnabled ?? true;
      const expireDays = estimate.publicLinksExpireDays ?? 7;
      const expiresAt = expireEnabled
        ? new Date(
            estimate.publicLinkCreatedAt.getTime() +
              expireDays * 24 * 60 * 60 * 1000,
          )
        : null;

      if (expiresAt && expiresAt <= new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Link expired" });
      }

      if (
        estimate.status !== "SENT" &&
        estimate.status !== "VIEWED"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Estimate cannot be rejected in its current state.",
        });
      }

      const now = new Date();
      await ctx.db
        .update(estimates)
        .set({
          status: "REJECTED",
          rejectionReason: reason ?? null,
          updatedAt: now,
        })
        .where(eq(estimates.id, estimate.id));

      await runWorkflowAutomations(ctx.db, {
        organizationId: estimate.organizationId,
        triggerDocument: "estimate",
        triggerStatus: "REJECTED",
        documentId: estimate.id,
        actorUserId: null,
        triggeredAt: now,
      });

      void sendEstimateStatusNotification({
        db: ctx.db,
        organizationId: estimate.organizationId,
        status: "REJECTED",
        estimateNumber: estimate.estimateNumber,
        customerName: estimate.customerName ?? "Client",
        documentUrl: `${getAppBaseUrl()}/app/estimates/${estimate.id}`,
        rejectionReason: reason,
      });

      return { ok: true };
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

      const { normalizedItems, subTotalValue } =
        await buildNormalizedEstimateItems(
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
            tax: null,
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

      await runWorkflowAutomations(ctx.db, {
        organizationId: ctx.organizationId,
        triggerDocument: "estimate",
        triggerStatus: "DRAFT",
        documentId: created.id,
        actorUserId: getSessionUserId(ctx),
        triggeredAt: new Date(),
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
          discountPerItem: estimates.discountPerItem,
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

      const { normalizedItems, subTotalValue } =
        await buildNormalizedEstimateItems(
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
          .update(estimates)
          .set({
            customerId: input.customerId,
            estimateDate: input.estimateDate,
            expiryDate: nullableString(input.expiryDate) ?? undefined,
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

  setStatus: organizationProcedure
    .use(requirePermission("estimate:edit"))
    .input(
      z.object({
        id: z.string().trim().min(1),
        status: z.enum([
          "DRAFT",
          "SENT",
          "VIEWED",
          "EXPIRED",
          "APPROVED",
          "REJECTED",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: estimates.id, status: estimates.status })
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

      if (existing.status === input.status) {
        return { ok: true as const, ...existing };
      }

      const updatedAt = new Date();
      await ctx.db
        .update(estimates)
        .set({ status: input.status, updatedAt })
        .where(
          and(
            eq(estimates.id, existing.id),
            eq(estimates.organizationId, ctx.organizationId),
          ),
        );

      await runWorkflowAutomations(ctx.db, {
        organizationId: ctx.organizationId,
        triggerDocument: "estimate",
        triggerStatus: input.status,
        documentId: existing.id,
        actorUserId: getSessionUserId(ctx),
        triggeredAt: updatedAt,
      });

      return { ok: true as const, id: existing.id, status: input.status };
    }),

  sendEmail: organizationProcedure
    .use(requirePermission("estimate:edit"))
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

      const [estimate] = await ctx.db
        .select({
          id: estimates.id,
          estimateNumber: estimates.estimateNumber,
          status: estimates.status,
          publicLinkToken: estimates.publicLinkToken,
          publicLinkCreatedAt: estimates.publicLinkCreatedAt,
          customerName: customers.displayName,
        })
        .from(estimates)
        .innerJoin(customers, eq(estimates.customerId, customers.id))
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

      const existingToken = estimate.publicLinkToken;
      const existingCreatedAt = estimate.publicLinkCreatedAt;
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

      const viewUrl = `${getAppBaseUrl()}/estimate/${publicToken}`;

      const text = `${input.body.trim()}\n\nView estimate: ${viewUrl}`;
      const html = `
        <div style="background:#f6f6f1;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#101828;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
            <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Orgaflow Estimate</div>
              <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;">Estimate ${escapeHtml(estimate.estimateNumber)}</h1>
            </div>
            <div style="padding:32px;">
              <div style="margin:0 0 18px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><strong>Customer:</strong> ${escapeHtml(estimate.customerName)}</p>
                <p style="margin:0;font-size:14px;line-height:1.6;"><strong>To:</strong> ${escapeHtml(input.to)}</p>
              </div>

              <div style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#101828;">
                ${formatEmailBodyHtml(input.body.trim())}
              </div>

              <a
                href="${escapeHtml(viewUrl)}"
                style="display:inline-block;background:#163329;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:12px;"
              >
                View estimate
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

      const nextStatus = estimate.status === "DRAFT" ? "SENT" : estimate.status;

      await ctx.db
        .update(estimates)
        .set({
          status: nextStatus,
          publicLinkToken: publicToken,
          publicLinkCreatedAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(estimates.id, estimate.id),
            eq(estimates.organizationId, ctx.organizationId),
          ),
        );

      if (nextStatus !== estimate.status) {
        await runWorkflowAutomations(ctx.db, {
          organizationId: ctx.organizationId,
          triggerDocument: "estimate",
          triggerStatus: nextStatus,
          documentId: estimate.id,
          actorUserId: getSessionUserId(ctx),
          triggeredAt: now,
        });
      }

      return { ok: true as const, id: estimate.id };
    }),

  delete: organizationProcedure
    .use(requirePermission("estimate:delete"))
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
            eq(documentFiles.resourceType, "estimate"),
            eq(documentFiles.resourceId, input.id),
          ),
        );
      for (const file of files) {
        await del(file.storageKey).catch(() => null);
      }

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

  listFiles: organizationProcedure
    .use(requirePermission("estimate:view"))
    .input(z.object({ estimateId: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: documentFiles.id,
          fileName: documentFiles.fileName,
          storageKey: documentFiles.storageKey,
          mimeType: documentFiles.mimeType,
          fileSize: documentFiles.fileSize,
          isPublic: documentFiles.isPublic,
        })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.resourceType, "estimate"),
            eq(documentFiles.resourceId, input.estimateId),
            eq(documentFiles.organizationId, ctx.organizationId),
          ),
        )
        .orderBy(asc(documentFiles.createdAt));
    }),

  deleteFile: organizationProcedure
    .use(requirePermission("estimate:edit"))
    .input(z.object({ fileId: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { del } = await import("@vercel/blob");

      const [file] = await ctx.db
        .select({
          id: documentFiles.id,
          storageKey: documentFiles.storageKey,
        })
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
      await ctx.db
        .delete(documentFiles)
        .where(eq(documentFiles.id, file.id));

      return { ok: true as const };
    }),

  toggleFileVisibility: organizationProcedure
    .use(requirePermission("estimate:edit"))
    .input(
      z.object({
        fileId: z.string().trim().min(1),
        isPublic: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(documentFiles)
        .set({ isPublic: input.isPublic })
        .where(
          and(
            eq(documentFiles.id, input.fileId),
            eq(documentFiles.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),
});
