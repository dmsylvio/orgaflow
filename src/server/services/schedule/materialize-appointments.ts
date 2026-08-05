import "server-only";

import { and, eq, isNull, lt, or } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import { appointments, items, scheduleSeries } from "@/server/db/schemas";
import { expandOccurrences, type RecurrenceRule } from "./expand-occurrences";

/** How far ahead occurrences are kept materialized. */
export const MATERIALIZATION_HORIZON_DAYS = 90;

/** Safety valve so a single run can never flood the table. */
const MAX_OCCURRENCES_PER_RUN = 400;

export type MaterializeResult = {
  created: number;
  seriesCompleted: boolean;
};

/**
 * Creates the appointment rows for one series up to the rolling horizon.
 *
 * Safe to call repeatedly: the `appointments_series_slot_unique` index makes
 * duplicate slots a no-op, which also protects against the scheduler running
 * on more than one instance.
 */
export async function materializeSeries(
  db: DbClient,
  seriesId: string,
  now: Date = new Date(),
): Promise<MaterializeResult> {
  const [series] = await db
    .select()
    .from(scheduleSeries)
    .where(eq(scheduleSeries.id, seriesId))
    .limit(1);

  if (!series || series.status !== "active") {
    return { created: 0, seriesCompleted: false };
  }

  const horizon = addDays(now, MATERIALIZATION_HORIZON_DAYS);

  // Resume where the last run stopped; a brand-new series starts at its own
  // start date so past occurrences are backfilled and visible on the calendar.
  const from = series.materializedUntil ?? startOfDayUtc(series.startDate);

  if (from >= horizon) {
    return { created: 0, seriesCompleted: false };
  }

  const rule: RecurrenceRule = {
    frequency: series.frequency,
    weekdays: series.weekdays,
    monthDay: series.monthDay,
    startDate: series.startDate,
    endDate: series.endDate,
    startTime: series.startTime,
    endTime: series.endTime,
    allDay: series.allDay,
    timezone: series.timezone,
  };

  const remaining =
    series.maxOccurrences !== null
      ? Math.max(0, series.maxOccurrences - series.generatedCount)
      : null;

  if (remaining === 0) {
    await completeSeries(db, series.id, now);
    return { created: 0, seriesCompleted: true };
  }

  const limit = Math.min(
    remaining ?? MAX_OCCURRENCES_PER_RUN,
    MAX_OCCURRENCES_PER_RUN,
  );
  const occurrences = expandOccurrences(rule, from, horizon, limit);

  let itemName: string | null = null;
  if (series.itemId) {
    const [item] = await db
      .select({ name: items.name })
      .from(items)
      .where(eq(items.id, series.itemId))
      .limit(1);
    itemName = item?.name ?? null;
  }

  let created = 0;

  if (occurrences.length > 0) {
    const inserted = await db
      .insert(appointments)
      .values(
        occurrences.map((occurrence) => ({
          organizationId: series.organizationId,
          seriesId: series.id,
          customerId: series.customerId,
          title: series.title,
          description: series.description,
          location: series.location,
          allDay: series.allDay,
          startsAt: occurrence.startsAt,
          endsAt: occurrence.endsAt,
          assignedUserId: series.assignedUserId,
          billingMode: series.billingMode,
          billingTrigger: series.billingTrigger,
          itemId: series.itemId,
          currencyId: series.currencyId,
          itemName,
          quantity: series.quantity,
          unitPrice: series.unitPrice,
          total: multiply(series.quantity, series.unitPrice),
          createdByUserId: series.createdByUserId,
        })),
      )
      // Slots already materialized by an earlier run are skipped.
      .onConflictDoNothing()
      .returning({ id: appointments.id });

    created = inserted.length;
  }

  const generatedCount = series.generatedCount + created;
  const reachedMax =
    series.maxOccurrences !== null && generatedCount >= series.maxOccurrences;
  const pastEndDate =
    series.endDate !== null && startOfDayUtc(series.endDate) < now;

  await db
    .update(scheduleSeries)
    .set({
      generatedCount,
      materializedUntil: horizon,
      status: reachedMax || pastEndDate ? "completed" : series.status,
      updatedAt: now,
    })
    .where(eq(scheduleSeries.id, series.id));

  return { created, seriesCompleted: reachedMax || pastEndDate };
}

/**
 * Extends the horizon for every active series that needs it.
 * Called hourly by the scheduler job.
 */
export async function materializeDueSeries(
  db: DbClient,
  now: Date = new Date(),
): Promise<{ processed: number; created: number }> {
  const refreshBefore = addDays(now, MATERIALIZATION_HORIZON_DAYS - 1);

  const due = await db
    .select({ id: scheduleSeries.id })
    .from(scheduleSeries)
    .where(
      and(
        eq(scheduleSeries.status, "active"),
        or(
          isNull(scheduleSeries.materializedUntil),
          lt(scheduleSeries.materializedUntil, refreshBefore),
        ),
      ),
    );

  let created = 0;

  for (const row of due) {
    try {
      const result = await materializeSeries(db, row.id, now);
      created += result.created;
    } catch (error) {
      console.error(
        `[schedule] Failed to materialize series ${row.id}:`,
        error,
      );
    }
  }

  return { processed: due.length, created };
}

async function completeSeries(
  db: DbClient,
  seriesId: string,
  now: Date,
): Promise<void> {
  await db
    .update(scheduleSeries)
    .set({ status: "completed", updatedAt: now })
    .where(eq(scheduleSeries.id, seriesId));
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfDayUtc(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1));
}

function multiply(quantity: string, price: string): string {
  return (Number(quantity || "0") * Number(price || "0")).toFixed(3);
}
