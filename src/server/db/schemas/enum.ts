import { pgEnum } from "drizzle-orm/pg-core";

export const estimateItemDiscountTypeEnum = pgEnum(
  "estimate_item_discount_type",
  ["fixed", "percentage"],
);

export const invoiceItemDiscountTypeEnum = pgEnum(
  "invoice_item_discount_type",
  ["fixed", "percentage"],
);

export const estimateStatusEnum = pgEnum("estimate_status", [
  "DRAFT",
  "SENT",
  "VIEWED",
  "EXPIRED",
  "APPROVED",
  "REJECTED",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "PENDING",
  "SENT",
  "VIEWED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "VOID",
]);

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "every_hour",
  "every_2_hours",
  "every_day",
  "every_week",
  "every_15_days",
  "every_month",
  "every_6_months",
  "every_year",
]);

export const recurringLimitTypeEnum = pgEnum("recurring_limit_type", [
  "none",
  "date",
  "count",
]);

export const recurringStatusEnum = pgEnum("recurring_status", [
  "active",
  "on_hold",
  "completed",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "starter",
  "growth",
  "scale",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
]);
