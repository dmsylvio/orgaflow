import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { appPaths } from "@/lib/app-paths";
import { assertUniqueOrganizationSlug } from "@/lib/assert-unique-organization-slug";
import { getAppBaseUrl } from "@/lib/base-url";
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

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      plan: (r.plan ?? "starter") as WorkspacePlan,
      subscriptionStatus: r.subscriptionStatus ?? "active",
    }));
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
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
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
      const email = ctx.session.user.email;
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your account has no email; cannot continue checkout.",
        });
      }

      const normalizedSlug = slugifyOrganizationName();
      if (normalizedSlug.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Could not derive a valid URL slug from the organization name.",
        });
      }
      const slug = await assertUniqueOrganizationSlug(ctx.db, normalizedSlug);

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

        const isFree = input.plan === "starter";
        await tx.insert(organizationSubscriptions).values({
          organizationId: org.id,
          plan: input.plan,
          status: isFree ? "active" : "incomplete",
        });

        return org.id;
      });

      if (input.plan === "starter") {
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
          next: { type: "home" as const },
        };
      }

      const checkout = await createOrganizationSubscriptionCheckout({
        organizationId: orgId,
        plan: input.plan,
        customerEmail: email,
        successUrl: `${getAppBaseUrl()}${appPaths.home}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${getAppBaseUrl()}${appPaths.workspace}`,
        billingInterval: input.billingInterval,
      });

      if (checkout.kind === "url") {
        return {
          organizationId: orgId,
          next: { type: "redirect" as const, url: checkout.url },
        };
      }

      /**
       * Stripe em modo teste ou envs em falta: mesmo comportamento em produção e em dev.
       * O utilizador confirma manualmente para ativar a subscrição (adequado a deploys com chaves de teste).
       */
      return {
        organizationId: orgId,
        next: { type: "manual_checkout" as const },
      };
    }),

  /**
   * Marca subscrição paga como ativa quando o Checkout Stripe não foi usado (envs em falta,
   * ou fluxo manual). Disponível em qualquer ambiente — alinhado a Stripe em test mode.
   */
  completeDevPaidPlan: protectedProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);

      const [org] = await ctx.db
        .select({ ownerUserId: organizations.ownerUserId })
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org || org.ownerUserId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the organization owner can complete this step.",
        });
      }

      await ctx.db
        .update(organizationSubscriptions)
        .set({
          status: "active",
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

      return { ok: true as const };
    }),
});
