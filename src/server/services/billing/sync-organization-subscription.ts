import { eq } from "drizzle-orm";
import { PLAN_TRIAL_DAYS } from "@/lib/subscription-plans";
import type { WorkspacePlan } from "@/schemas/workspace";
import type { DbClient } from "@/server/db";
import { organizationSubscriptions } from "@/server/db/schemas";

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export interface SyncedOrganizationSubscription {
  id: string;
  organizationId: string;
  plan: WorkspacePlan;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function getTrialPeriodEnd(start: Date): Date {
  return new Date(start.getTime() + PLAN_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

function shouldExpireTrial(
  sub: Pick<
    SyncedOrganizationSubscription,
    "plan" | "status" | "stripeSubscriptionId" | "currentPeriodEnd"
  >,
  now: Date,
): boolean {
  return (
    sub.plan !== "starter" &&
    sub.status === "trialing" &&
    !sub.stripeSubscriptionId &&
    !!sub.currentPeriodEnd &&
    sub.currentPeriodEnd.getTime() < now.getTime()
  );
}

export async function syncOrganizationSubscriptionStatus(
  db: DbClient,
  organizationId: string,
  now = new Date(),
): Promise<SyncedOrganizationSubscription | null> {
  const [sub] = await db
    .select()
    .from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, organizationId))
    .limit(1);

  if (!sub) return null;

  const normalized = {
    ...sub,
    plan: sub.plan as WorkspacePlan,
    status: sub.status as SubscriptionStatus,
  };

  if (!shouldExpireTrial(normalized, now)) {
    return normalized;
  }

  const [updated] = await db
    .update(organizationSubscriptions)
    .set({
      status: "incomplete_expired",
      updatedAt: now,
    })
    .where(eq(organizationSubscriptions.organizationId, organizationId))
    .returning();

  return updated
    ? {
        ...updated,
        plan: updated.plan as WorkspacePlan,
        status: updated.status as SubscriptionStatus,
      }
    : {
        ...normalized,
        status: "incomplete_expired",
        updatedAt: now,
      };
}
