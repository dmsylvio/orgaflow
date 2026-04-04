import type { RecurringFrequency } from "@/schemas/recurring-invoice";

/**
 * Calculates the next run timestamp for a recurring invoice template.
 * All non-hourly frequencies are normalized to 00:00 UTC.
 */
export function calculateNextRunAt(
  frequency: RecurringFrequency,
  from: Date,
): Date {
  const d = new Date(from);

  switch (frequency) {
    case "every_hour": {
      d.setUTCHours(d.getUTCHours() + 1);
      return d;
    }
    case "every_2_hours": {
      d.setUTCHours(d.getUTCHours() + 2);
      return d;
    }
    case "every_day": {
      d.setUTCDate(d.getUTCDate() + 1);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case "every_week": {
      d.setUTCDate(d.getUTCDate() + 7);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case "every_15_days": {
      d.setUTCDate(d.getUTCDate() + 15);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case "every_month": {
      // 1st of next month at 00:00 UTC
      d.setUTCMonth(d.getUTCMonth() + 1, 1);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case "every_6_months": {
      // 1st day of month +6 months at 00:00 UTC
      d.setUTCMonth(d.getUTCMonth() + 6, 1);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case "every_year": {
      // Jan 1 of next year at 00:00 UTC
      d.setUTCFullYear(d.getUTCFullYear() + 1, 0, 1);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
  }
}

/**
 * Computes the initial nextRunAt from a startDate string (YYYY-MM-DD).
 * For hourly frequencies, uses current time + offset.
 * For daily+ frequencies, uses start-of-day UTC on the startDate.
 */
export function calculateInitialNextRunAt(
  frequency: RecurringFrequency,
  startDate: string,
): Date {
  const isHourly =
    frequency === "every_hour" || frequency === "every_2_hours";

  if (isHourly) {
    return calculateNextRunAt(frequency, new Date());
  }

  // Parse startDate as UTC midnight
  const [year, month, day] = startDate.split("-").map(Number);
  const base = new Date(
    Date.UTC(year!, month! - 1, day!, 0, 0, 0, 0),
  );

  // If startDate is in the past or today, advance to the next occurrence
  if (base <= new Date()) {
    return calculateNextRunAt(frequency, base);
  }

  return base;
}
