import { eq } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import { organizationSubscriptions } from "@/server/db/schemas";

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
  const [sub] = await db
    .select({ plan: organizationSubscriptions.plan })
    .from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, organizationId))
    .limit(1);
  return (sub?.plan as SubscriptionPlan) ?? "starter";
}
