import type { DbClient } from "@/server/db";
import { syncOrganizationSubscriptionStatus } from "@/server/services/billing/sync-organization-subscription";

export type SubscriptionPlan = "starter" | "growth" | "scale";

const PLAN_RANK: Record<SubscriptionPlan, number> = {
  starter: 0,
  growth: 1,
  scale: 2,
};

export function planAtLeast(
  actual: SubscriptionPlan,
  required: SubscriptionPlan,
): boolean {
  return PLAN_RANK[actual] >= PLAN_RANK[required];
}

export async function getOrganizationPlan(
  db: DbClient,
  organizationId: string,
): Promise<SubscriptionPlan> {
  const sub = await syncOrganizationSubscriptionStatus(db, organizationId);
  if (
    sub?.status === "incomplete" ||
    sub?.status === "incomplete_expired" ||
    sub?.status === "canceled" ||
    sub?.status === "paused"
  ) {
    return "starter";
  }
  return (sub?.plan as SubscriptionPlan) ?? "starter";
}
