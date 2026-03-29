import "server-only";

import type { WorkspacePlan } from "@/schemas/workspace";

export type StripeBillingInterval = "monthly" | "annual";

/**
 * Intervalo de faturação padrão para sessões Checkout (subscrição).
 * `STRIPE_DEFAULT_BILLING_INTERVAL=monthly|annual` (default: monthly).
 */
export function getDefaultStripeBillingInterval(): StripeBillingInterval {
  const raw = process.env.STRIPE_DEFAULT_BILLING_INTERVAL?.trim().toLowerCase();
  if (raw === "annual" || raw === "yearly") {
    return "annual";
  }
  return "monthly";
}

function readEnv(key: string): string | null {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : null;
}

/**
 * Resolve o Price ID do Stripe para qualquer plano de subscrição.
 */
export function getStripePriceIdForPlan(
  plan: WorkspacePlan,
  interval: StripeBillingInterval = getDefaultStripeBillingInterval(),
): string | null {
  if (plan === "starter") {
    return interval === "monthly"
      ? readEnv("STRIPE_PRICE_STARTER_MONTHLY")
      : readEnv("STRIPE_PRICE_STARTER_ANNUAL");
  }

  if (plan === "growth") {
    return interval === "monthly"
      ? readEnv("STRIPE_PRICE_GROWTH_MONTHLY")
      : readEnv("STRIPE_PRICE_GROWTH_ANNUAL");
  }

  if (plan === "scale") {
    return interval === "monthly"
      ? readEnv("STRIPE_PRICE_SCALE_MONTHLY")
      : readEnv("STRIPE_PRICE_SCALE_ANNUAL");
  }

  return null;
}

export function getStripeBillingIntervalFromPriceId(
  priceId: string | null | undefined,
): StripeBillingInterval | null {
  const normalized = priceId?.trim();
  if (!normalized) return null;

  const monthlyKeys = [
    "STRIPE_PRICE_STARTER_MONTHLY",
    "STRIPE_PRICE_GROWTH_MONTHLY",
    "STRIPE_PRICE_SCALE_MONTHLY",
  ];
  const annualKeys = [
    "STRIPE_PRICE_STARTER_ANNUAL",
    "STRIPE_PRICE_GROWTH_ANNUAL",
    "STRIPE_PRICE_SCALE_ANNUAL",
  ];

  if (monthlyKeys.some((key) => readEnv(key) === normalized)) {
    return "monthly";
  }

  if (annualKeys.some((key) => readEnv(key) === normalized)) {
    return "annual";
  }

  return null;
}
