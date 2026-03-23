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
 * Resolve o Price ID do Stripe para planos pagos (Checkout).
 * - `growth` → STRIPE_PRICE_GROWTH_{MONTHLY|ANNUAL}
 * - `scale` → STRIPE_PRICE_SCALE_{MONTHLY|ANNUAL}
 */
export function getStripePriceIdForPaidPlan(
  plan: Exclude<WorkspacePlan, "starter">,
  interval: StripeBillingInterval = getDefaultStripeBillingInterval(),
): string | null {
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
