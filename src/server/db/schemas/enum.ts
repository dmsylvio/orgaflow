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
