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

export const scheduleFrequencyEnum = pgEnum("schedule_frequency", [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);

export const scheduleSeriesStatusEnum = pgEnum("schedule_series_status", [
  "active",
  "paused",
  "completed",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
]);

/**
 * `per_appointment` bills each occurrence on its own invoice.
 * `consolidated` groups every billable occurrence of a period onto one invoice.
 */
export const scheduleBillingModeEnum = pgEnum("schedule_billing_mode", [
  "none",
  "per_appointment",
  "consolidated",
]);

export const scheduleBillingTriggerEnum = pgEnum("schedule_billing_trigger", [
  "manual",
  "on_schedule",
  "on_completion",
  "period_end",
]);

export const scheduleBillingPeriodEnum = pgEnum("schedule_billing_period", [
  "weekly",
  "biweekly",
  "monthly",
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
