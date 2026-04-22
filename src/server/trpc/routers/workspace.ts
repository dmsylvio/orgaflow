import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { appPaths } from "@/lib/app-paths";
import { assertUniqueOrganizationSlug } from "@/lib/assert-unique-organization-slug";
import { getAppBaseUrl } from "@/lib/base-url";
import {
  getDefaultStripeBillingInterval,
  getStripeBillingIntervalFromPriceId,
} from "@/lib/stripe-subscription-prices";
import { isWorkspaceAccessible } from "@/lib/subscription-plans";
import type { WorkspacePlan } from "@/schemas/workspace";
import { createOrganizationInputSchema } from "@/schemas/workspace";
import {
  currencies,
  languages,
  organizationMembers,
  organizationNotificationSettings,
  organizationPreferences,
  organizationSubscriptions,
  organizations,
} from "@/server/db/schemas";
import {
  getTrialPeriodEnd,
  syncOrganizationSubscriptionStatus,
} from "@/server/services/billing/sync-organization-subscription";
import { ensureDefaultCurrencies } from "@/server/services/workspace/ensure-default-currencies";
import { ensureDefaultLanguages } from "@/server/services/workspace/ensure-default-languages";
import { slugifyOrganizationName } from "@/server/services/workspace/slugify";
import { createOrganizationSubscriptionCheckout } from "@/server/stripe/organization-checkout";
import {
  ACTIVE_ORGANIZATION_COOKIE,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

export const workspaceRouter = createTRPCRouter({
  listMyOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const userId = getSessionUserId(ctx);

    const rows = await ctx.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        isOwner: organizationMembers.isOwner,
        plan: organizationSubscriptions.plan,
        subscriptionStatus: organizationSubscriptions.status,
      })
      .from(organizationMembers)
      .innerJoin(
        organizations,
        eq(organizationMembers.organizationId, organizations.id),
      )
      .leftJoin(
        organizationSubscriptions,
        eq(organizationSubscriptions.organizationId, organizations.id),
      )
      .where(eq(organizationMembers.userId, userId));

    return Promise.all(
      rows.map(async (r) => {
        const sub = await syncOrganizationSubscriptionStatus(ctx.db, r.id);
        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          isOwner: r.isOwner,
          plan: (sub?.plan ?? r.plan ?? "starter") as WorkspacePlan,
          subscriptionStatus: sub?.status ?? r.subscriptionStatus ?? "active",
        };
      }),
    );
  }),

  listCurrencies: protectedProcedure.query(async ({ ctx }) => {
    await ensureDefaultCurrencies(ctx.db);
    return ctx.db
      .select({
        id: currencies.id,
        code: currencies.code,
        name: currencies.name,
        symbol: currencies.symbol,
      })
      .from(currencies)
      .orderBy(asc(currencies.code));
  }),

  listLanguages: protectedProcedure.query(async ({ ctx }) => {
    await ensureDefaultLanguages(ctx.db);
    return ctx.db
      .select({
        code: languages.code,
        name: languages.name,
      })
      .from(languages)
      .orderBy(asc(languages.name));
  }),

  setActiveOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);

      const [member] = await ctx.db
        .select({
          id: organizationMembers.id,
          subscriptionStatus: organizationSubscriptions.status,
        })
        .from(organizationMembers)
        .leftJoin(
          organizationSubscriptions,
          eq(
            organizationSubscriptions.organizationId,
            organizationMembers.organizationId,
          ),
        )
        .where(
          and(
            eq(organizationMembers.organizationId, input.organizationId),
            eq(organizationMembers.userId, userId),
          ),
        )
        .limit(1);

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization.",
        });
      }

      const sub = await syncOrganizationSubscriptionStatus(
        ctx.db,
        input.organizationId,
      );
      const subscriptionStatus =
        sub?.status ?? member.subscriptionStatus ?? "active";

      if (!isWorkspaceAccessible(subscriptionStatus)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Billing must be completed before this organization can be opened.",
        });
      }

      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, input.organizationId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
      });

      return { ok: true as const };
    }),

  createOrganization: protectedProcedure
    .input(createOrganizationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const isStarterPlan = input.plan === "starter";

      const normalizedSlug = slugifyOrganizationName();
      if (normalizedSlug.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Could not derive a valid URL slug from the organization name.",
        });
      }
      const slug = await assertUniqueOrganizationSlug(ctx.db, normalizedSlug);

      const now = new Date();
      const trialEndsAt = isStarterPlan ? null : getTrialPeriodEnd(now);

      const orgId = await ctx.db.transaction(async (tx) => {
        const [currency] = await tx
          .select({ id: currencies.id })
          .from(currencies)
          .where(eq(currencies.id, input.defaultCurrencyId))
          .limit(1);

        if (!currency) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid default currency.",
          });
        }

        const line2 = input.addressLine2.trim();
        const reg = input.region.trim();
        const phone = input.businessPhone.trim();

        const [org] = await tx
          .insert(organizations)
          .values({
            name: input.name.trim(),
            slug,
            ownerUserId: userId,
            addressLine1: input.addressLine1.trim(),
            addressLine2: line2.length > 0 ? line2 : null,
            city: input.city.trim(),
            region: reg.length > 0 ? reg : null,
            postalCode: input.postalCode.trim(),
            businessPhone: phone.length > 0 ? phone : null,
          })
          .returning({ id: organizations.id });

        if (!org) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create organization.",
          });
        }

        await tx.insert(organizationMembers).values({
          organizationId: org.id,
          userId,
          isOwner: true,
        });

        await tx.insert(organizationPreferences).values({
          organizationId: org.id,
          defaultCurrencyId: input.defaultCurrencyId,
          language: input.languageCode,
          timezone: "UTC",
          dateFormat: "DD/MM/YYYY",
          financialYearStart: "january-december",
          publicLinksExpireEnabled: true,
          publicLinksExpireDays: 7,
          discountPerItem: false,
          taxPerItem: false,
        });

        await tx.insert(organizationNotificationSettings).values({
          organizationId: org.id,
          notifyEmail: null,
          invoiceViewed: false,
          estimateViewed: false,
        });

        await tx.insert(organizationSubscriptions).values({
          organizationId: org.id,
          plan: input.plan,
          status: isStarterPlan ? "active" : "trialing",
          stripePriceId: null,
          currentPeriodStart: isStarterPlan ? null : now,
          currentPeriodEnd: trialEndsAt,
        });

        return org.id;
      });

      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, orgId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
      });

      return {
        organizationId: orgId,
        next: { type: "redirect" as const, url: appPaths.home },
      };
    }),

  resumeOrganizationCheckout: protectedProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const [org] = await ctx.db
        .select({
          isOwner: organizationMembers.isOwner,
          plan: organizationSubscriptions.plan,
          status: organizationSubscriptions.status,
          stripeCustomerId: organizationSubscriptions.stripeCustomerId,
          stripePriceId: organizationSubscriptions.stripePriceId,
        })
        .from(organizationMembers)
        .leftJoin(
          organizationSubscriptions,
          eq(
            organizationSubscriptions.organizationId,
            organizationMembers.organizationId,
          ),
        )
        .where(
          and(
            eq(organizationMembers.organizationId, input.organizationId),
            eq(organizationMembers.userId, userId),
          ),
        )
        .limit(1);

      if (!org) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization.",
        });
      }

      if (!org.isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only the organization owner can complete billing for this workspace.",
        });
      }

      const syncedSub = await syncOrganizationSubscriptionStatus(
        ctx.db,
        input.organizationId,
      );
      const syncedStatus = syncedSub?.status ?? org.status ?? "active";

      if (isWorkspaceAccessible(syncedStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This organization already has an active subscription.",
        });
      }

      const plan = (syncedSub?.plan ?? org.plan ?? "starter") as WorkspacePlan;
      if (plan === "starter") {
        await ctx.db
          .update(organizationSubscriptions)
          .set({
            status: "active",
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            stripePriceId: null,
            updatedAt: new Date(),
          })
          .where(
            eq(organizationSubscriptions.organizationId, input.organizationId),
          );

        const cookieStore = await cookies();
        cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, input.organizationId, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 365,
        });

        return { url: appPaths.home };
      }

      const billingInterval =
        getStripeBillingIntervalFromPriceId(
          syncedSub?.stripePriceId ?? org.stripePriceId,
        ) ?? getDefaultStripeBillingInterval();

      const email = ctx.session.user.email;
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your account has no email; cannot continue checkout.",
        });
      }

      const checkout = await createOrganizationSubscriptionCheckout({
        organizationId: input.organizationId,
        plan,
        customerEmail: email,
        ...(org.stripeCustomerId ? { customerId: org.stripeCustomerId } : {}),
        successUrl: `${getAppBaseUrl()}/api/workspace/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${getAppBaseUrl()}${appPaths.workspace}`,
        billingInterval,
      });

      if (checkout.kind !== "url") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe is not fully configured for checkout.",
        });
      }

      return { url: checkout.url };
    }),
});
