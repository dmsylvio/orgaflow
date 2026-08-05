import { z } from "zod";

export const SCHEDULE_FREQUENCIES = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

export const SCHEDULE_FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  daily: "Every day",
  weekly: "Every week",
  biweekly: "Every two weeks",
  monthly: "Every month",
};

export const BILLING_MODES = [
  "none",
  "per_appointment",
  "consolidated",
] as const;

export type BillingMode = (typeof BILLING_MODES)[number];

export const BILLING_MODE_LABELS: Record<BillingMode, string> = {
  none: "Do not bill",
  per_appointment: "One invoice per appointment",
  consolidated: "One invoice per billing period",
};

/** Every value the `schedule_billing_trigger` enum accepts, including retired ones. */
export const BILLING_TRIGGERS = [
  "manual",
  "on_schedule",
  "on_completion",
  "period_end",
] as const;

export type BillingTrigger = (typeof BILLING_TRIGGERS)[number];

/**
 * What users are allowed to pick.
 *
 * `on_schedule` is withheld: it invoiced an occurrence the moment it was
 * materialized, so a weekly series billed roughly three months of future visits
 * in one go, dated the day the job ran. Deleting those visits then stranded the
 * invoices. The enum value stays for rows created before it was pulled.
 */
export const SELECTABLE_BILLING_TRIGGERS = [
  "manual",
  "on_completion",
  "period_end",
] as const;

export type SelectableBillingTrigger =
  (typeof SELECTABLE_BILLING_TRIGGERS)[number];

export const BILLING_TRIGGER_LABELS: Record<BillingTrigger, string> = {
  manual: "Only when I click bill",
  on_schedule: "As soon as it is scheduled",
  on_completion: "When it is marked completed",
  period_end: "When the billing period closes",
};

export const BILLING_PERIODS = ["weekly", "biweekly", "monthly"] as const;

export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  weekly: "Weekly",
  biweekly: "Every two weeks",
  monthly: "Monthly",
};

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

const dayString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.");

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the HH:MM format.");

const billingFields = {
  billingMode: z.enum(BILLING_MODES).default("none"),
  billingTrigger: z.enum(SELECTABLE_BILLING_TRIGGERS).default("on_completion"),
  itemId: z.string().trim().min(1).nullable().optional(),
  quantity: z.string().trim().min(1).default("1"),
  unitPrice: z.string().trim().min(1).default("0"),
};

const sharedFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  location: z.string().trim().max(500).nullable().optional(),
  customerId: z.string().trim().min(1).nullable().optional(),
  allDay: z.boolean().default(false),
  startTime: timeString.nullable().optional(),
  endTime: timeString.nullable().optional(),
};

/** A one-off calendar entry. */
export const appointmentUpsertSchema = z
  .object({
    ...sharedFields,
    ...billingFields,
    date: dayString,
  })
  .refine((value) => value.allDay || value.startTime !== null, {
    message: "Timed appointments need a start time.",
    path: ["startTime"],
  })
  .refine((value) => value.billingMode === "none" || value.customerId, {
    message: "Pick a customer to bill this appointment.",
    path: ["customerId"],
  });

export type AppointmentUpsertInput = z.infer<typeof appointmentUpsertSchema>;

/** A repeating rule that materializes appointments. */
export const scheduleSeriesUpsertSchema = z
  .object({
    ...sharedFields,
    ...billingFields,
    frequency: z.enum(SCHEDULE_FREQUENCIES),
    weekdays: z.array(z.number().int().min(0).max(6)).nullable().optional(),
    monthDay: z.number().int().min(1).max(31).nullable().optional(),
    startDate: dayString,
    endDate: dayString.nullable().optional(),
    maxOccurrences: z.number().int().min(1).max(1000).nullable().optional(),
    billingPeriod: z.enum(BILLING_PERIODS).nullable().optional(),
    dueDaysOffset: z.number().int().min(0).max(365).nullable().optional(),
  })
  .refine((value) => value.allDay || value.startTime !== null, {
    message: "Timed appointments need a start time.",
    path: ["startTime"],
  })
  .refine((value) => value.billingMode === "none" || value.customerId, {
    message: "Pick a customer to bill this series.",
    path: ["customerId"],
  })
  .refine(
    (value) =>
      value.billingMode !== "consolidated" || Boolean(value.billingPeriod),
    {
      message: "Consolidated billing needs a billing period.",
      path: ["billingPeriod"],
    },
  )
  .refine(
    (value) =>
      value.frequency !== "weekly" ||
      (value.weekdays !== null &&
        value.weekdays !== undefined &&
        value.weekdays.length > 0),
    {
      message: "Pick at least one weekday.",
      path: ["weekdays"],
    },
  )
  .refine(
    (value) =>
      value.frequency !== "biweekly" ||
      (value.weekdays !== null &&
        value.weekdays !== undefined &&
        value.weekdays.length > 0),
    {
      message: "Pick at least one weekday.",
      path: ["weekdays"],
    },
  )
  .refine(
    (value) =>
      !value.endDate || !value.startDate || value.endDate >= value.startDate,
    {
      message: "The end date cannot be before the start date.",
      path: ["endDate"],
    },
  );

export type ScheduleSeriesUpsertInput = z.infer<
  typeof scheduleSeriesUpsertSchema
>;
