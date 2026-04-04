import { z } from "zod";

export const RECURRING_FREQUENCIES = [
  "every_hour",
  "every_2_hours",
  "every_day",
  "every_week",
  "every_15_days",
  "every_month",
  "every_6_months",
  "every_year",
] as const;

export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  every_hour: "Every Hour",
  every_2_hours: "Every 2 Hours",
  every_day: "Every Day at midnight",
  every_week: "Every Week",
  every_15_days: "Every 15 Days at midnight",
  every_month: "On the 1st of every month",
  every_6_months: "Every 6 Months",
  every_year: "Every Year (Jan 1st)",
};

export const recurringLineItemSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  unitPrice: z.string().trim().min(1),
});

export const recurringInvoiceUpsertSchema = z.object({
  name: z.string().trim().min(1).max(200),
  customerId: z.string().trim().min(1),
  frequency: z.enum(RECURRING_FREQUENCIES),
  startDate: z.string().trim().min(1),
  limitType: z.enum(["none", "date", "count"]),
  limitDate: z.string().trim().nullable().optional(),
  limitCount: z.number().int().min(1).nullable().optional(),
  dueDaysOffset: z.number().int().min(0).nullable().optional(),
  sendAutomatically: z.boolean().optional(),
  notes: z.string().trim().max(20000).nullable().optional(),
  items: z.array(recurringLineItemSchema).min(1),
  discount: z.string().nullable().optional(),
  discountFixed: z.boolean().optional(),
  taxIds: z.array(z.string()).optional(),
});

export type RecurringInvoiceUpsertInput = z.infer<
  typeof recurringInvoiceUpsertSchema
>;
