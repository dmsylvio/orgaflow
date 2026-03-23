import type { SubscriptionPlan } from "./get-organization-plan";

export type UsageLimitedResource = "customers" | "items";

export function getUsageLimit(
  plan: SubscriptionPlan,
  resource: UsageLimitedResource,
): number | null {
  if (resource === "customers") {
    return plan === "starter" ? 50 : null;
  }

  if (resource === "items") {
    return plan === "starter" ? 50 : null;
  }

  return null;
}
