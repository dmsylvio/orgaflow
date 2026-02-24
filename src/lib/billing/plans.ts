export type PlanKey = "free" | "growth" | "enterprise";
export type BillingInterval = "month" | "year";

export const planLimits: Record<PlanKey, {
  companies: number;
  invoices: number;
  estimates: number;
  users: number;
}> = {
  free: { companies: 1, invoices: 100, estimates: 100, users: 2 },
  growth: { companies: 5, invoices: 5000, estimates: 5000, users: Infinity },
  enterprise: {
    companies: 10,
    invoices: 20000,
    estimates: 20000,
    users: Infinity,
  },
};
