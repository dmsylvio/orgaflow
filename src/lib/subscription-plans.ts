import type {
  WorkspaceBillingInterval,
  WorkspacePlan,
} from "@/schemas/workspace";

export const ANNUAL_DISCOUNT_PERCENT = 30;
export const PLAN_TRIAL_DAYS = 15;

export type WorkspaceSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

const ACCESSIBLE_WORKSPACE_STATUS_SET = new Set<WorkspaceSubscriptionStatus>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateAnnualPrice(monthlyPrice: number): number {
  return roundCurrency(
    monthlyPrice * 12 * ((100 - ANNUAL_DISCOUNT_PERCENT) / 100),
  );
}

export const WORKSPACE_PLAN_PRICES: Record<
  WorkspacePlan,
  Record<WorkspaceBillingInterval, number>
> = {
  starter: {
    monthly: 9.99,
    annual: calculateAnnualPrice(9.99),
  },
  growth: {
    monthly: 24.99,
    annual: calculateAnnualPrice(24.99),
  },
  scale: {
    monthly: 44.99,
    annual: calculateAnnualPrice(44.99),
  },
};

export function getWorkspacePlanPrice(
  plan: WorkspacePlan,
  interval: WorkspaceBillingInterval,
): number {
  return WORKSPACE_PLAN_PRICES[plan][interval];
}

export function formatUsdPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatWorkspacePlanPrice(
  plan: WorkspacePlan,
  interval: WorkspaceBillingInterval,
): string {
  return formatUsdPrice(getWorkspacePlanPrice(plan, interval));
}

export function isWorkspaceAccessible(status: string): boolean {
  return ACCESSIBLE_WORKSPACE_STATUS_SET.has(
    status as WorkspaceSubscriptionStatus,
  );
}
