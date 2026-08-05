import "server-only";

import { formatInTimeZone } from "date-fns-tz";
import { and, eq, inArray, isNotNull, isNull, lte, ne } from "drizzle-orm";
import { type DbClient, db as defaultDb } from "@/server/db";
import {
  appointments,
  customers,
  organizationPreferences,
  scheduleSeries,
} from "@/server/db/schemas";
import { runWorkflowAutomations } from "@/server/services/automations/run-workflow-automations";
import {
  createInvoiceFromLines,
  type InvoiceLineInput,
} from "@/server/services/invoices/create-invoice-from-lines";
import { sendInvoiceEmail } from "@/server/services/invoices/send-invoice-email";

export type BillingPeriod = "weekly" | "biweekly" | "monthly";

export type BillingRunResult = {
  invoicesCreated: number;
  appointmentsBilled: number;
  blocked: number;
};

type BillableAppointment = {
  id: string;
  organizationId: string;
  customerId: string | null;
  currencyId: string | null;
  seriesId: string | null;
  title: string;
  itemId: string | null;
  itemName: string | null;
  quantity: string;
  unitPrice: string;
  total: string;
  startsAt: Date;
  status: string;
  billingTrigger: string;
};

type ScheduleBillingPrefs = {
  paymentTermDays: number;
  autoSend: boolean;
};

const DEFAULT_PAYMENT_TERM_DAYS = 7;

/**
 * Bills every appointment configured for `per_appointment` whose trigger fired.
 * Each appointment becomes its own invoice.
 */
export async function billPerAppointment(
  db: DbClient,
  now: Date = new Date(),
): Promise<BillingRunResult> {
  const rows = (await db
    .select({
      id: appointments.id,
      organizationId: appointments.organizationId,
      customerId: appointments.customerId,
      currencyId: appointments.currencyId,
      seriesId: appointments.seriesId,
      title: appointments.title,
      itemId: appointments.itemId,
      itemName: appointments.itemName,
      quantity: appointments.quantity,
      unitPrice: appointments.unitPrice,
      total: appointments.total,
      startsAt: appointments.startsAt,
      status: appointments.status,
      billingTrigger: appointments.billingTrigger,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.billingMode, "per_appointment"),
        isNull(appointments.invoiceId),
        isNull(appointments.billingBlockedAt),
        isNotNull(appointments.customerId),
        isNotNull(appointments.currencyId),
        ne(appointments.status, "cancelled"),
        ne(appointments.status, "no_show"),
      ),
    )) as BillableAppointment[];

  const result: BillingRunResult = {
    invoicesCreated: 0,
    appointmentsBilled: 0,
    blocked: 0,
  };
  const prefsCache = new Map<string, ScheduleBillingPrefs>();

  for (const appointment of rows) {
    if (!triggerFired(appointment, now)) continue;

    try {
      const invoiceDate = formatInTimeZone(now, "UTC", "yyyy-MM-dd");
      const issued = await issueScheduleInvoice(db, {
        organizationId: appointment.organizationId,
        // Guarded by the isNotNull filters above.
        customerId: appointment.customerId as string,
        currencyId: appointment.currencyId as string,
        invoiceDate,
        lines: [toLine(appointment)],
        now,
        prefsCache,
      });

      if (!issued.ok) {
        await blockAppointment(db, appointment.id, issued.message, now);
        result.blocked += 1;
        continue;
      }

      await db
        .update(appointments)
        .set({
          invoiceId: issued.invoiceId,
          invoicedAt: now,
          billingBlockedReason: null,
          billingBlockedAt: null,
          updatedAt: now,
        })
        .where(eq(appointments.id, appointment.id));

      await runWorkflowAutomations(db, {
        organizationId: appointment.organizationId,
        triggerDocument: "invoice",
        triggerStatus: issued.status,
        documentId: issued.invoiceId,
        actorUserId: null,
        triggeredAt: now,
      });

      result.invoicesCreated += 1;
      result.appointmentsBilled += 1;
    } catch (error) {
      console.error(
        `[schedule] Failed to bill appointment ${appointment.id}:`,
        error,
      );
    }
  }

  return result;
}

/**
 * Bills `consolidated` series: every appointment of a closed billing period
 * lands on a single invoice, one line per appointment.
 */
export async function billConsolidatedPeriods(
  db: DbClient,
  now: Date = new Date(),
): Promise<BillingRunResult> {
  const seriesRows = await db
    .select({
      id: scheduleSeries.id,
      organizationId: scheduleSeries.organizationId,
      customerId: scheduleSeries.customerId,
      currencyId: scheduleSeries.currencyId,
      billingPeriod: scheduleSeries.billingPeriod,
      billingTrigger: scheduleSeries.billingTrigger,
      timezone: scheduleSeries.timezone,
      startDate: scheduleSeries.startDate,
      dueDaysOffset: scheduleSeries.dueDaysOffset,
      title: scheduleSeries.title,
    })
    .from(scheduleSeries)
    .where(
      and(
        eq(scheduleSeries.billingMode, "consolidated"),
        isNotNull(scheduleSeries.customerId),
        isNotNull(scheduleSeries.currencyId),
      ),
    );

  const result: BillingRunResult = {
    invoicesCreated: 0,
    appointmentsBilled: 0,
    blocked: 0,
  };
  const prefsCache = new Map<string, ScheduleBillingPrefs>();

  for (const series of seriesRows) {
    const period = (series.billingPeriod ?? "monthly") as BillingPeriod;

    const pending = (await db
      .select({
        id: appointments.id,
        organizationId: appointments.organizationId,
        customerId: appointments.customerId,
        currencyId: appointments.currencyId,
        seriesId: appointments.seriesId,
        title: appointments.title,
        itemId: appointments.itemId,
        itemName: appointments.itemName,
        quantity: appointments.quantity,
        unitPrice: appointments.unitPrice,
        total: appointments.total,
        startsAt: appointments.startsAt,
        status: appointments.status,
        billingTrigger: appointments.billingTrigger,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.seriesId, series.id),
          isNull(appointments.invoiceId),
          isNull(appointments.billingBlockedAt),
          lte(appointments.endsAt, now),
          ne(appointments.status, "cancelled"),
          ne(appointments.status, "no_show"),
        ),
      )) as BillableAppointment[];

    if (pending.length === 0) continue;

    // Group by the period each appointment falls into.
    const buckets = new Map<string, BillableAppointment[]>();
    for (const appointment of pending) {
      if (
        series.billingTrigger === "on_completion" &&
        appointment.status !== "completed"
      ) {
        continue;
      }

      const bucketKey = periodKey(
        appointment.startsAt,
        period,
        series.timezone,
        series.startDate,
      );
      const list = buckets.get(bucketKey) ?? [];
      list.push(appointment);
      buckets.set(bucketKey, list);
    }

    for (const [bucketKey, group] of buckets) {
      // Only bill once the period is fully in the past.
      if (!isPeriodClosed(bucketKey, period, series.timezone, now)) continue;

      try {
        const invoiceDate = formatInTimeZone(
          now,
          series.timezone,
          "yyyy-MM-dd",
        );
        const issued = await issueScheduleInvoice(db, {
          organizationId: series.organizationId,
          customerId: series.customerId as string,
          currencyId: series.currencyId as string,
          invoiceDate,
          dueDaysOffset: series.dueDaysOffset,
          notes: `${series.title} — ${bucketKey}`,
          lines: group.map((appointment) =>
            toLine(appointment, series.timezone),
          ),
          now,
          prefsCache,
        });

        if (!issued.ok) {
          await blockAppointments(
            db,
            group.map((a) => a.id),
            issued.message,
            now,
          );
          result.blocked += group.length;
          continue;
        }

        await db
          .update(appointments)
          .set({
            invoiceId: issued.invoiceId,
            invoicedAt: now,
            billingBlockedReason: null,
            billingBlockedAt: null,
            updatedAt: now,
          })
          .where(
            inArray(
              appointments.id,
              group.map((a) => a.id),
            ),
          );

        await runWorkflowAutomations(db, {
          organizationId: series.organizationId,
          triggerDocument: "invoice",
          triggerStatus: issued.status,
          documentId: issued.invoiceId,
          actorUserId: null,
          triggeredAt: now,
        });

        result.invoicesCreated += 1;
        result.appointmentsBilled += group.length;
      } catch (error) {
        console.error(
          `[schedule] Failed to bill period ${bucketKey} of series ${series.id}:`,
          error,
        );
      }
    }
  }

  return result;
}

/**
 * Bills one appointment immediately, ignoring its trigger.
 *
 * Used by the manual "generate invoice" action and right after an appointment
 * is marked completed, so the user sees the invoice without waiting for cron.
 */
export async function billAppointmentById(
  db: DbClient,
  organizationId: string,
  appointmentId: string,
  now: Date = new Date(),
): Promise<
  | { ok: true; invoiceId: string; alreadyBilled: boolean }
  | { ok: false; message: string }
> {
  const [appointment] = (await db
    .select({
      id: appointments.id,
      organizationId: appointments.organizationId,
      customerId: appointments.customerId,
      currencyId: appointments.currencyId,
      seriesId: appointments.seriesId,
      title: appointments.title,
      itemId: appointments.itemId,
      itemName: appointments.itemName,
      quantity: appointments.quantity,
      unitPrice: appointments.unitPrice,
      total: appointments.total,
      startsAt: appointments.startsAt,
      status: appointments.status,
      billingTrigger: appointments.billingTrigger,
      invoiceId: appointments.invoiceId,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.organizationId, organizationId),
      ),
    )
    .limit(1)) as (BillableAppointment & { invoiceId: string | null })[];

  if (!appointment) {
    return { ok: false, message: "Appointment not found." };
  }

  if (appointment.invoiceId) {
    return { ok: true, invoiceId: appointment.invoiceId, alreadyBilled: true };
  }

  if (!appointment.customerId || !appointment.currencyId) {
    return {
      ok: false,
      message: "Set a customer and a price before billing this appointment.",
    };
  }

  const issued = await issueScheduleInvoice(db, {
    organizationId: appointment.organizationId,
    customerId: appointment.customerId,
    currencyId: appointment.currencyId,
    invoiceDate: formatInTimeZone(now, "UTC", "yyyy-MM-dd"),
    lines: [toLine(appointment)],
    now,
  });

  if (!issued.ok) {
    await blockAppointment(db, appointment.id, issued.message, now);
    return { ok: false, message: issued.message };
  }

  await db
    .update(appointments)
    .set({
      invoiceId: issued.invoiceId,
      invoicedAt: now,
      billingBlockedReason: null,
      billingBlockedAt: null,
      updatedAt: now,
    })
    .where(eq(appointments.id, appointment.id));

  await runWorkflowAutomations(db, {
    organizationId: appointment.organizationId,
    triggerDocument: "invoice",
    triggerStatus: issued.status,
    documentId: issued.invoiceId,
    actorUserId: null,
    triggeredAt: now,
  });

  return { ok: true, invoiceId: issued.invoiceId, alreadyBilled: false };
}

export async function runScheduleBilling(
  db: DbClient = defaultDb,
  now: Date = new Date(),
): Promise<BillingRunResult> {
  const perAppointment = await billPerAppointment(db, now);
  const consolidated = await billConsolidatedPeriods(db, now);

  return {
    invoicesCreated:
      perAppointment.invoicesCreated + consolidated.invoicesCreated,
    appointmentsBilled:
      perAppointment.appointmentsBilled + consolidated.appointmentsBilled,
    blocked: perAppointment.blocked + consolidated.blocked,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a schedule invoice with the org payment term (default 7 days) and,
 * when enabled, emails it to the customer immediately.
 *
 * Customers without an email keep the invoice as a draft so it can be sent
 * by hand — same behaviour as recurring invoices.
 */
async function issueScheduleInvoice(
  db: DbClient,
  input: {
    organizationId: string;
    customerId: string;
    currencyId: string;
    invoiceDate: string;
    /** Overrides the org payment term when set on a series. */
    dueDaysOffset?: number | null;
    notes?: string | null;
    lines: InvoiceLineInput[];
    now: Date;
    prefsCache?: Map<string, ScheduleBillingPrefs>;
  },
): Promise<
  | {
      ok: true;
      invoiceId: string;
      invoiceNumber: string;
      status: "DRAFT" | "SENT";
    }
  | { ok: false; reason: "no_lines" | "plan_limit_reached"; message: string }
> {
  const prefs = await getScheduleBillingPrefs(
    db,
    input.organizationId,
    input.prefsCache,
  );
  const termDays =
    input.dueDaysOffset !== null && input.dueDaysOffset !== undefined
      ? input.dueDaysOffset
      : prefs.paymentTermDays;
  const dueDate = addDaysToDayString(input.invoiceDate, termDays);

  const created = await createInvoiceFromLines(db, {
    organizationId: input.organizationId,
    customerId: input.customerId,
    currencyId: input.currencyId,
    invoiceDate: input.invoiceDate,
    dueDate,
    notes: input.notes,
    lines: input.lines,
  });

  if (!created.ok) return created;

  let status: "DRAFT" | "SENT" = "DRAFT";

  if (prefs.autoSend) {
    const contact = await getCustomerContact(db, input.customerId);
    if (contact) {
      const sent = await sendInvoiceEmail(db, {
        invoiceId: created.invoiceId,
        invoiceNumber: created.invoiceNumber,
        customerDisplayName: contact.displayName,
        customerEmail: contact.email,
        dueDate,
        sentAt: input.now,
      });
      if (sent) status = "SENT";
    }
  }

  return {
    ok: true,
    invoiceId: created.invoiceId,
    invoiceNumber: created.invoiceNumber,
    status,
  };
}

async function getScheduleBillingPrefs(
  db: DbClient,
  organizationId: string,
  cache?: Map<string, ScheduleBillingPrefs>,
): Promise<ScheduleBillingPrefs> {
  const cached = cache?.get(organizationId);
  if (cached) return cached;

  const [row] = await db
    .select({
      paymentTermDays: organizationPreferences.schedulePaymentTermDays,
      autoSend: organizationPreferences.scheduleAutoSendInvoices,
    })
    .from(organizationPreferences)
    .where(eq(organizationPreferences.organizationId, organizationId))
    .limit(1);

  const prefs: ScheduleBillingPrefs = {
    paymentTermDays: row?.paymentTermDays ?? DEFAULT_PAYMENT_TERM_DAYS,
    autoSend: row?.autoSend ?? true,
  };

  cache?.set(organizationId, prefs);
  return prefs;
}

async function getCustomerContact(
  db: DbClient,
  customerId: string,
): Promise<{ displayName: string; email: string | null } | null> {
  const [row] = await db
    .select({
      displayName: customers.displayName,
      email: customers.email,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  return row ?? null;
}

function triggerFired(appointment: BillableAppointment, now: Date): boolean {
  switch (appointment.billingTrigger) {
    // Retired: this used to return true unconditionally, which invoiced every
    // occurrence as soon as it was materialized — up to 90 days of visits at
    // once. Rows created while it was selectable now bill on completion.
    case "on_schedule":
    case "on_completion":
      return appointment.status === "completed";
    case "period_end":
      return appointment.startsAt <= now;
    default:
      return false;
  }
}

function toLine(
  appointment: BillableAppointment,
  timezone = "UTC",
): InvoiceLineInput {
  const day = formatInTimeZone(appointment.startsAt, timezone, "yyyy-MM-dd");
  const name = appointment.itemName ?? appointment.title;

  return {
    itemId: appointment.itemId,
    name,
    description: `${appointment.title} — ${day}`,
    quantity: appointment.quantity,
    price: appointment.unitPrice,
    total: appointment.total,
  };
}

async function blockAppointment(
  db: DbClient,
  appointmentId: string,
  reason: string,
  now: Date,
): Promise<void> {
  await blockAppointments(db, [appointmentId], reason, now);
}

async function blockAppointments(
  db: DbClient,
  appointmentIds: string[],
  reason: string,
  now: Date,
): Promise<void> {
  if (appointmentIds.length === 0) return;

  await db
    .update(appointments)
    .set({
      billingBlockedReason: reason,
      billingBlockedAt: now,
      updatedAt: now,
    })
    .where(inArray(appointments.id, appointmentIds));
}

/** Stable identifier for the billing period an instant belongs to. */
export function periodKey(
  value: Date,
  period: BillingPeriod,
  timezone: string,
  anchorDay: string,
): string {
  if (period === "monthly") {
    return formatInTimeZone(value, timezone, "yyyy-MM");
  }

  const day = formatInTimeZone(value, timezone, "yyyy-MM-dd");
  const blockSize = period === "weekly" ? 7 : 14;
  const anchor = dayStringToUtc(anchorDay);
  const current = dayStringToUtc(day);

  const daysApart = Math.floor(
    (current.getTime() - anchor.getTime()) / 86_400_000,
  );
  const blockIndex = Math.floor(daysApart / blockSize);
  const blockStart = new Date(anchor);
  blockStart.setUTCDate(blockStart.getUTCDate() + blockIndex * blockSize);

  return utcToDayString(blockStart);
}

function isPeriodClosed(
  key: string,
  period: BillingPeriod,
  timezone: string,
  now: Date,
): boolean {
  const today = formatInTimeZone(now, timezone, "yyyy-MM-dd");

  if (period === "monthly") {
    return key < today.slice(0, 7);
  }

  const blockSize = period === "weekly" ? 7 : 14;
  const blockStart = dayStringToUtc(key);
  const blockEnd = new Date(blockStart);
  blockEnd.setUTCDate(blockEnd.getUTCDate() + blockSize);

  return utcToDayString(blockEnd) <= today;
}

function dayStringToUtc(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1));
}

function utcToDayString(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDayString(day: string, days: number): string {
  const value = dayStringToUtc(day);
  value.setUTCDate(value.getUTCDate() + days);
  return utcToDayString(value);
}
