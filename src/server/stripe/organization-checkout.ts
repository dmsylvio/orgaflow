import "server-only";

import Stripe from "stripe";
import {
  getStripePriceIdForPlan,
  type StripeBillingInterval,
} from "@/lib/stripe-subscription-prices";
import { PLAN_TRIAL_DAYS } from "@/lib/subscription-plans";
import type { WorkspacePlan } from "@/schemas/workspace";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export type CheckoutSessionResult =
  | { kind: "url"; url: string }
  | { kind: "unconfigured"; reason: "missing_stripe" | "missing_price" };

/**
 * Cria sessão Stripe Checkout (subscrição) para uma organização já persistida.
 */
export async function createOrganizationSubscriptionCheckout(params: {
  organizationId: string;
  plan: WorkspacePlan;
  /** Required when `customerId` is not provided. */
  customerEmail?: string;
  /** Existing Stripe customer ID — takes precedence over `customerEmail`. */
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  billingInterval?: StripeBillingInterval;
}): Promise<CheckoutSessionResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { kind: "unconfigured", reason: "missing_stripe" };
  }

  const priceId = getStripePriceIdForPlan(params.plan, params.billingInterval);
  if (!priceId) {
    return { kind: "unconfigured", reason: "missing_price" };
  }

  if (!params.customerId && !params.customerEmail) {
    return { kind: "unconfigured", reason: "missing_stripe" };
  }

  const customerField: { customer: string } | { customer_email: string } =
    params.customerId
      ? { customer: params.customerId }
      : { customer_email: params.customerEmail as string };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    locale: "en",
    currency: "usd",
    allow_promotion_codes: true,
    ...customerField,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      organizationId: params.organizationId,
      plan: params.plan,
    },
    subscription_data: {
      trial_period_days: PLAN_TRIAL_DAYS,
      metadata: {
        organizationId: params.organizationId,
        plan: params.plan,
      },
    },
  });

  if (!session.url) {
    return { kind: "unconfigured", reason: "missing_stripe" };
  }

  return { kind: "url", url: session.url };
}
