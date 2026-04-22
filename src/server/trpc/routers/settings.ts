import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, eq, sum } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";
import { getAppBaseUrl } from "@/lib/base-url";
import {
  getStripeBillingIntervalFromPriceId,
  getStripePriceIdForPlan,
} from "@/lib/stripe-subscription-prices";
import {
  currencies,
  DATE_FORMAT_VALUES,
  documentFiles,
  expenseCategories,
  FINANCIAL_YEAR_VALUES,
  notes,
  organizationNotificationSettings,
  organizationPreferences,
  organizationSubscriptions,
  organizations,
  paymentModes,
  taxTypes,
} from "@/server/db/schemas";
import {
  getTrialPeriodEnd,
  syncOrganizationSubscriptionStatus,
} from "@/server/services/billing/sync-organization-subscription";
import { ensureDefaultPaymentModes } from "@/server/services/workspace/ensure-default-payment-modes";
import { createOrganizationSubscriptionCheckout } from "@/server/stripe/organization-checkout";
import {
  createTRPCRouter,
  organizationProcedure,
  ownerProcedure,
} from "@/server/trpc/init";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const settingsRouter = createTRPCRouter({
  // ---- Company ------------------------------------------------------------

  getCompany: ownerProcedure.query(async ({ ctx }) => {
    const [org] = await ctx.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        businessPhone: organizations.businessPhone,
        logoUrl: organizations.logoUrl,
        addressLine1: organizations.addressLine1,
        addressLine2: organizations.addressLine2,
        city: organizations.city,
        region: organizations.region,
        postalCode: organizations.postalCode,
      })
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found.",
      });
    }

    return { org };
  }),

  updateCompanyLogo: ownerProcedure
    .input(z.object({ logoUrl: z.string().url().nullable() }))
    .mutation(async ({ ctx, input }) => {
      // Se está removendo o logo, apaga o blob antigo
      if (input.logoUrl === null) {
        const [org] = await ctx.db
          .select({ logoUrl: organizations.logoUrl })
          .from(organizations)
          .where(eq(organizations.id, ctx.organizationId))
          .limit(1);

        if (org?.logoUrl) {
          const { del } = await import("@vercel/blob");
          await del(org.logoUrl).catch(() => null);
        }
      }

      await ctx.db
        .update(organizations)
        .set({ logoUrl: input.logoUrl, updatedAt: new Date() })
        .where(eq(organizations.id, ctx.organizationId));

      return { ok: true as const };
    }),

  getStorageUsage: organizationProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ totalBytes: sum(documentFiles.fileSize) })
      .from(documentFiles)
      .where(eq(documentFiles.organizationId, ctx.organizationId));

    return { usedBytes: Number(row?.totalBytes ?? 0) };
  }),

  updateCompany: ownerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        businessPhone: z.string().max(50).optional().nullable(),
        addressLine1: z.string().max(255).optional().nullable(),
        addressLine2: z.string().max(255).optional().nullable(),
        city: z.string().max(100).optional().nullable(),
        region: z.string().max(100).optional().nullable(),
        postalCode: z.string().max(20).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(organizations)
        .set({
          name: input.name,
          businessPhone: input.businessPhone ?? null,
          addressLine1: input.addressLine1 ?? null,
          addressLine2: input.addressLine2 ?? null,
          city: input.city ?? null,
          region: input.region ?? null,
          postalCode: input.postalCode ?? null,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, ctx.organizationId));

      return { ok: true as const };
    }),

  // ---- Payment Modes ------------------------------------------------------

  listPaymentModes: ownerProcedure.query(async ({ ctx }) => {
    await ensureDefaultPaymentModes(ctx.db, ctx.organizationId);
    return ctx.db
      .select()
      .from(paymentModes)
      .where(eq(paymentModes.organizationId, ctx.organizationId));
  }),

  createPaymentMode: ownerProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(paymentModes)
        .values({ organizationId: ctx.organizationId, name: input.name })
        .returning();

      return created;
    }),

  updatePaymentMode: ownerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: paymentModes.id })
        .from(paymentModes)
        .where(
          and(
            eq(paymentModes.id, input.id),
            eq(paymentModes.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment mode not found.",
        });
      }

      // If marking as default, clear existing default first
      if (input.isDefault === true) {
        await ctx.db
          .update(paymentModes)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(paymentModes.organizationId, ctx.organizationId));
      }

      await ctx.db
        .update(paymentModes)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
          updatedAt: new Date(),
        })
        .where(eq(paymentModes.id, input.id));

      return { ok: true as const };
    }),

  deletePaymentMode: ownerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(paymentModes)
        .where(
          and(
            eq(paymentModes.id, input.id),
            eq(paymentModes.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),

  // ---- Expense Categories -------------------------------------------------

  listExpenseCategories: ownerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.organizationId, ctx.organizationId));
  }),

  createExpenseCategory: ownerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(expenseCategories)
        .values({
          organizationId: ctx.organizationId,
          name: input.name,
          description: input.description ?? null,
        })
        .returning();

      return created;
    }),

  updateExpenseCategory: ownerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(255).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: expenseCategories.id })
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.id, input.id),
            eq(expenseCategories.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense category not found.",
        });
      }

      await ctx.db
        .update(expenseCategories)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          updatedAt: new Date(),
        })
        .where(eq(expenseCategories.id, input.id));

      return { ok: true as const };
    }),

  deleteExpenseCategory: ownerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(expenseCategories)
        .where(
          and(
            eq(expenseCategories.id, input.id),
            eq(expenseCategories.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),

  // ---- Preferences --------------------------------------------------------

  getPreferences: ownerProcedure.query(async ({ ctx }) => {
    const [[prefs], allCurrencies] = await Promise.all([
      ctx.db
        .select()
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1),
      ctx.db
        .select({
          id: currencies.id,
          code: currencies.code,
          name: currencies.name,
          symbol: currencies.symbol,
        })
        .from(currencies),
    ]);

    return {
      prefs: prefs ?? null,
      currencies: allCurrencies,
    };
  }),

  updatePreferences: ownerProcedure
    .input(
      z.object({
        defaultCurrencyId: z.string().nullable().optional(),
        language: z.string().min(1).max(10).optional(),
        timezone: z.string().min(1).max(100).optional(),
        dateFormat: z.enum(DATE_FORMAT_VALUES).optional(),
        financialYearStart: z.enum(FINANCIAL_YEAR_VALUES).optional(),
        publicLinksExpireEnabled: z.boolean().optional(),
        publicLinksExpireDays: z.number().int().min(1).max(365).optional(),
        discountPerItem: z.boolean().optional(),
        invoiceTemplate: z.number().int().min(1).max(3).optional(),
        estimateTemplate: z.number().int().min(1).max(3).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: organizationPreferences.id })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      const values = {
        ...(input.defaultCurrencyId !== undefined && {
          defaultCurrencyId: input.defaultCurrencyId,
        }),
        ...(input.language !== undefined && { language: input.language }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.dateFormat !== undefined && { dateFormat: input.dateFormat }),
        ...(input.financialYearStart !== undefined && {
          financialYearStart: input.financialYearStart,
        }),
        ...(input.publicLinksExpireEnabled !== undefined && {
          publicLinksExpireEnabled: input.publicLinksExpireEnabled,
        }),
        ...(input.publicLinksExpireDays !== undefined && {
          publicLinksExpireDays: input.publicLinksExpireDays,
        }),
        ...(input.discountPerItem !== undefined && {
          discountPerItem: input.discountPerItem,
        }),
        ...(input.invoiceTemplate !== undefined && {
          invoiceTemplate: input.invoiceTemplate,
        }),
        ...(input.estimateTemplate !== undefined && {
          estimateTemplate: input.estimateTemplate,
        }),
        updatedAt: new Date(),
      };

      if (existing) {
        await ctx.db
          .update(organizationPreferences)
          .set(values)
          .where(
            eq(organizationPreferences.organizationId, ctx.organizationId),
          );
      } else {
        await ctx.db.insert(organizationPreferences).values({
          organizationId: ctx.organizationId,
          ...values,
        });
      }

      return { ok: true as const };
    }),

  // ---- Notifications -------------------------------------------------------

  getNotificationSettings: ownerProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(organizationNotificationSettings)
      .where(
        eq(organizationNotificationSettings.organizationId, ctx.organizationId),
      )
      .limit(1);

    return row ?? null;
  }),

  updateNotificationSettings: ownerProcedure
    .input(
      z.object({
        notifyEmail: z.email().nullable().optional(),
        invoiceViewed: z.boolean().optional(),
        estimateViewed: z.boolean().optional(),
        estimateApproved: z.boolean().optional(),
        estimateRejected: z.boolean().optional(),
        invoiceOverdue: z.boolean().optional(),
        paymentReceived: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: organizationNotificationSettings.id })
        .from(organizationNotificationSettings)
        .where(
          eq(
            organizationNotificationSettings.organizationId,
            ctx.organizationId,
          ),
        )
        .limit(1);

      const values = {
        ...(input.notifyEmail !== undefined && {
          notifyEmail: input.notifyEmail,
        }),
        ...(input.invoiceViewed !== undefined && {
          invoiceViewed: input.invoiceViewed,
        }),
        ...(input.estimateViewed !== undefined && {
          estimateViewed: input.estimateViewed,
        }),
        ...(input.estimateApproved !== undefined && {
          estimateApproved: input.estimateApproved,
        }),
        ...(input.estimateRejected !== undefined && {
          estimateRejected: input.estimateRejected,
        }),
        ...(input.invoiceOverdue !== undefined && {
          invoiceOverdue: input.invoiceOverdue,
        }),
        ...(input.paymentReceived !== undefined && {
          paymentReceived: input.paymentReceived,
        }),
        updatedAt: new Date(),
      };

      if (existing) {
        await ctx.db
          .update(organizationNotificationSettings)
          .set(values)
          .where(
            eq(
              organizationNotificationSettings.organizationId,
              ctx.organizationId,
            ),
          );
      } else {
        await ctx.db.insert(organizationNotificationSettings).values({
          organizationId: ctx.organizationId,
          ...values,
        });
      }

      return { ok: true as const };
    }),

  // ---- Billing ------------------------------------------------------------

  /**
   * Lightweight subscription status check available to all org members.
   * Used by PaymentAlertBanner in app-shell to show past_due / unpaid alerts.
   * Does NOT expose Stripe IDs, pricing, or other billing details.
   */
  getSubscriptionStatus: organizationProcedure.query(async ({ ctx }) => {
    const sub = await syncOrganizationSubscriptionStatus(
      ctx.db,
      ctx.organizationId,
    );

    return { status: sub?.status ?? null };
  }),

  /**
   * Lightweight plan summary available to all org members for entitlement checks.
   * Does NOT expose Stripe customer IDs or other billing management details.
   */
  getPlanSummary: organizationProcedure.query(async ({ ctx }) => {
    const sub = await syncOrganizationSubscriptionStatus(
      ctx.db,
      ctx.organizationId,
    );

    if (!sub) {
      return null;
    }

    return {
      plan: sub.plan,
      status: sub.status,
      billingInterval: getStripeBillingIntervalFromPriceId(sub.stripePriceId),
      canManageBilling: ctx.ability.isOwner,
    };
  }),

  getBilling: ownerProcedure.query(async ({ ctx }) => {
    const sub = await syncOrganizationSubscriptionStatus(
      ctx.db,
      ctx.organizationId,
    );

    if (!sub) {
      return null;
    }

    return {
      ...sub,
      billingInterval: getStripeBillingIntervalFromPriceId(sub.stripePriceId),
    };
  }),

  createBillingPortalSession: ownerProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const [sub] = await ctx.db
        .select({
          stripeCustomerId: organizationSubscriptions.stripeCustomerId,
        })
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, ctx.organizationId))
        .limit(1);

      if (!sub?.stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No Stripe customer found for this organization.",
        });
      }

      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe is not configured.",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: input.returnUrl,
        locale: "en",
      });

      return { url: session.url };
    }),

  // ---- Upgrade ------------------------------------------------------------

  createUpgradeSession: ownerProcedure
    .input(
      z.object({
        targetPlan: z.enum(["growth", "scale"]),
        billingInterval: z.enum(["monthly", "annual"]),
        returnUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sub = await syncOrganizationSubscriptionStatus(
        ctx.db,
        ctx.organizationId,
      );

      if (!sub?.stripeSubscriptionId && sub?.status !== "incomplete_expired") {
        const now = new Date();
        await ctx.db
          .update(organizationSubscriptions)
          .set({
            plan: input.targetPlan,
            status: "trialing",
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            stripePriceId: null,
            currentPeriodStart: sub?.currentPeriodStart ?? now,
            currentPeriodEnd: sub?.currentPeriodEnd ?? getTrialPeriodEnd(now),
            cancelAtPeriodEnd: false,
            updatedAt: now,
          })
          .where(
            eq(organizationSubscriptions.organizationId, ctx.organizationId),
          );

        return { type: "updated" as const };
      }

      const priceId = getStripePriceIdForPlan(
        input.targetPlan,
        input.billingInterval,
      );
      if (!priceId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe price not configured for this plan.",
        });
      }

      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe is not configured.",
        });
      }

      // --- Upgrading within paid plans (e.g. growth → scale) ---
      if (sub?.stripeSubscriptionId) {
        const stripeSub = await stripe.subscriptions.retrieve(
          sub.stripeSubscriptionId,
          { expand: ["items"] },
        );
        const item = stripeSub.items.data[0];
        if (!item) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not find subscription item.",
          });
        }
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          proration_behavior: "create_prorations",
          items: [{ id: item.id, price: priceId }],
        });
        return { type: "updated" as const };
      }

      // --- Upgrading from starter (new checkout session) ---
      const userEmail = ctx.session.user.email;
      if (!userEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your account has no email; cannot continue checkout.",
        });
      }

      const baseUrl = getAppBaseUrl();
      const result = await createOrganizationSubscriptionCheckout({
        organizationId: ctx.organizationId,
        plan: input.targetPlan,
        customerEmail: userEmail,
        billingInterval: input.billingInterval,
        successUrl: `${baseUrl}/app/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/app/settings/billing`,
        ...(sub?.stripeCustomerId ? { customerId: sub.stripeCustomerId } : {}),
      });

      if (result.kind === "unconfigured") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe is not fully configured for checkout.",
        });
      }

      return { type: "redirect" as const, url: result.url };
    }),

  // ---- Danger zone --------------------------------------------------------

  deleteOrganization: ownerProcedure
    .input(z.object({ confirm: z.literal("confirm") }))
    .mutation(async ({ ctx }) => {
      // Remove todos os blobs de arquivos da organização
      const { del } = await import("@vercel/blob");
      const files = await ctx.db
        .select({ storageKey: documentFiles.storageKey })
        .from(documentFiles)
        .where(eq(documentFiles.organizationId, ctx.organizationId));

      for (const file of files) {
        await del(file.storageKey).catch(() => null);
      }

      // Remove logo da org se existir
      const [org] = await ctx.db
        .select({ logoUrl: organizations.logoUrl })
        .from(organizations)
        .where(eq(organizations.id, ctx.organizationId))
        .limit(1);

      if (org?.logoUrl) {
        await del(org.logoUrl).catch(() => null);
      }

      await ctx.db
        .delete(organizations)
        .where(eq(organizations.id, ctx.organizationId));

      return { ok: true as const };
    }),

  // ---- Tax Types -----------------------------------------------------------

  listTaxTypes: ownerProcedure.query(async ({ ctx }) => {
    const [[prefs], items] = await Promise.all([
      ctx.db
        .select({ taxPerItem: organizationPreferences.taxPerItem })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1),
      ctx.db
        .select()
        .from(taxTypes)
        .where(eq(taxTypes.organizationId, ctx.organizationId))
        .orderBy(asc(taxTypes.name)),
    ]);

    return {
      taxPerItem: prefs?.taxPerItem ?? false,
      items,
    };
  }),

  updateTaxPerItem: ownerProcedure
    .input(z.object({ taxPerItem: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: organizationPreferences.id })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      if (existing) {
        await ctx.db
          .update(organizationPreferences)
          .set({ taxPerItem: input.taxPerItem, updatedAt: new Date() })
          .where(
            eq(organizationPreferences.organizationId, ctx.organizationId),
          );
      } else {
        await ctx.db.insert(organizationPreferences).values({
          organizationId: ctx.organizationId,
          taxPerItem: input.taxPerItem,
        });
      }

      return { ok: true as const };
    }),

  createTaxType: ownerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        percent: z.number().min(0).max(100),
        compoundTax: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(taxTypes).values({
        organizationId: ctx.organizationId,
        name: input.name.trim(),
        percent: String(input.percent),
        compoundTax: input.compoundTax,
      });

      return { ok: true as const };
    }),

  updateTaxType: ownerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(255).optional(),
        percent: z.number().min(0).max(100).optional(),
        compoundTax: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: taxTypes.id })
        .from(taxTypes)
        .where(
          and(
            eq(taxTypes.id, input.id),
            eq(taxTypes.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tax type not found.",
        });
      }

      await ctx.db
        .update(taxTypes)
        .set({
          ...(input.name !== undefined && { name: input.name.trim() }),
          ...(input.percent !== undefined && {
            percent: String(input.percent),
          }),
          ...(input.compoundTax !== undefined && {
            compoundTax: input.compoundTax,
          }),
          updatedAt: new Date(),
        })
        .where(eq(taxTypes.id, input.id));

      return { ok: true as const };
    }),

  deleteTaxType: ownerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(taxTypes)
        .where(
          and(
            eq(taxTypes.id, input.id),
            eq(taxTypes.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),

  // ---- Notes ---------------------------------------------------------------

  listNotes: ownerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(notes)
      .where(eq(notes.organizationId, ctx.organizationId))
      .orderBy(asc(notes.name));
  }),

  createNote: ownerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.enum(["invoice", "estimate", "payment"]),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(notes).values({
        organizationId: ctx.organizationId,
        name: input.name.trim(),
        type: input.type,
        content: input.content.trim(),
      });

      return { ok: true as const };
    }),

  updateNote: ownerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(255).optional(),
        type: z.enum(["invoice", "estimate", "payment"]).optional(),
        content: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: notes.id })
        .from(notes)
        .where(
          and(
            eq(notes.id, input.id),
            eq(notes.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
      }

      await ctx.db
        .update(notes)
        .set({
          ...(input.name !== undefined && { name: input.name.trim() }),
          ...(input.type !== undefined && { type: input.type }),
          ...(input.content !== undefined && { content: input.content.trim() }),
          updatedAt: new Date(),
        })
        .where(eq(notes.id, input.id));

      return { ok: true as const };
    }),

  deleteNote: ownerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(notes)
        .where(
          and(
            eq(notes.id, input.id),
            eq(notes.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),
});
