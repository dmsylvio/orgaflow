import "server-only";

import { TRPCError } from "@trpc/server";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  isNull,
  lt,
  lte,
  ne,
  or,
} from "drizzle-orm";
import { z } from "zod";
import {
  appointmentUpsertSchema,
  SCHEDULE_FREQUENCIES,
  scheduleSeriesUpsertSchema,
} from "@/schemas/schedule";
import {
  appointments,
  currencies,
  customers,
  invoices,
  items,
  organizationPreferences,
  scheduleSeries,
} from "@/server/db/schemas";
import { can } from "@/server/iam/ability";
import { billAppointmentById } from "@/server/services/schedule/bill-appointments";
import {
  addMinutesToTime,
  expandOccurrences,
  type Occurrence,
} from "@/server/services/schedule/expand-occurrences";
import { materializeSeries } from "@/server/services/schedule/materialize-appointments";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

const DEFAULT_START_TIME = "09:00";

/** How far ahead a recurring slot is probed for clashes, and how many to report. */
const CONFLICT_PROBE_DAYS = 400;
const CONFLICT_PROBE_OCCURRENCES = 8;
const CONFLICT_RESULT_LIMIT = 10;

export const scheduleRouter = createTRPCRouter({
  /** Everything needed to render the create/edit dialogs. */
  getFormMeta: organizationProcedure
    .use(requirePermission("schedule:view"))
    .query(async ({ ctx }) => {
      const [preferences] = await ctx.db
        .select({
          timezone: organizationPreferences.timezone,
          defaultCurrencyId: organizationPreferences.defaultCurrencyId,
        })
        .from(organizationPreferences)
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      const [customerRows, itemRows, currencyRows] = await Promise.all([
        ctx.db
          .select({ id: customers.id, name: customers.displayName })
          .from(customers)
          .where(eq(customers.organizationId, ctx.organizationId))
          .orderBy(asc(customers.displayName)),
        ctx.db
          .select({
            id: items.id,
            name: items.name,
            price: items.price,
          })
          .from(items)
          .where(eq(items.organizationId, ctx.organizationId))
          .orderBy(asc(items.name)),
        ctx.db
          .select({
            id: currencies.id,
            code: currencies.code,
            symbol: currencies.symbol,
            precision: currencies.precision,
            thousandSeparator: currencies.thousandSeparator,
            decimalSeparator: currencies.decimalSeparator,
            swapCurrencySymbol: currencies.swapCurrencySymbol,
          })
          .from(currencies),
      ]);

      const defaultCurrency =
        currencyRows.find((c) => c.id === preferences?.defaultCurrencyId) ??
        currencyRows[0] ??
        null;

      return {
        timezone: preferences?.timezone ?? "UTC",
        defaultCurrency,
        customers: customerRows,
        items: itemRows,
      };
    }),

  /** Appointments overlapping a window, for the calendar grid. */
  listRange: organizationProcedure
    .use(requirePermission("schedule:view"))
    .input(
      z.object({
        from: z.coerce.date(),
        to: z.coerce.date(),
        customerId: z.string().trim().min(1).nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(appointments.organizationId, ctx.organizationId),
        gte(appointments.startsAt, input.from),
        lt(appointments.startsAt, input.to),
      ];

      if (input.customerId) {
        conditions.push(eq(appointments.customerId, input.customerId));
      }

      const canSeePrices = can(ctx.ability, "schedule:view-prices");

      const rows = await ctx.db
        .select({
          id: appointments.id,
          seriesId: appointments.seriesId,
          title: appointments.title,
          description: appointments.description,
          location: appointments.location,
          allDay: appointments.allDay,
          startsAt: appointments.startsAt,
          endsAt: appointments.endsAt,
          status: appointments.status,
          customerId: appointments.customerId,
          customerName: customers.displayName,
          billingMode: appointments.billingMode,
          total: appointments.total,
          invoiceId: appointments.invoiceId,
          invoiceNumber: invoices.invoiceNumber,
          billingBlockedReason: appointments.billingBlockedReason,
        })
        .from(appointments)
        .leftJoin(customers, eq(appointments.customerId, customers.id))
        .leftJoin(invoices, eq(appointments.invoiceId, invoices.id))
        .where(and(...conditions))
        .orderBy(asc(appointments.startsAt));

      return rows.map((row) => ({
        ...row,
        total: canSeePrices ? row.total : null,
      }));
    }),

  /**
   * Appointments that overlap the slot being edited. Purely advisory: two teams
   * can legitimately work at the same hour, so the UI warns instead of blocking.
   */
  checkConflicts: organizationProcedure
    .use(requirePermission("schedule:view"))
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        allDay: z.boolean(),
        startTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullish(),
        endTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullish(),
        repeats: z.boolean().default(false),
        frequency: z.enum(SCHEDULE_FREQUENCIES).nullish(),
        weekdays: z.array(z.number().int().min(0).max(6)).nullish(),
        endDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullish(),
        excludeAppointmentId: z.string().trim().min(1).nullish(),
        excludeSeriesId: z.string().trim().min(1).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timezone } = await resolveOrgDefaults(ctx.db, ctx.organizationId);
      const startTime = input.startTime ?? DEFAULT_START_TIME;

      let intervals: Occurrence[];

      if (input.repeats && input.frequency) {
        const windowStart = fromZonedTime(`${input.date}T00:00:00`, timezone);
        const windowEnd = new Date(windowStart);
        windowEnd.setUTCDate(windowEnd.getUTCDate() + CONFLICT_PROBE_DAYS);

        intervals = expandOccurrences(
          {
            frequency: input.frequency,
            weekdays: input.weekdays ?? null,
            monthDay:
              input.frequency === "monthly"
                ? Number(input.date.slice(8, 10))
                : null,
            startDate: input.date,
            endDate: input.endDate ?? null,
            startTime: input.allDay ? null : startTime,
            endTime: input.allDay ? null : (input.endTime ?? null),
            allDay: input.allDay,
            timezone,
          },
          windowStart,
          windowEnd,
          CONFLICT_PROBE_OCCURRENCES,
        );
      } else {
        intervals = [
          resolveInstants(
            input.date,
            input.allDay,
            startTime,
            input.endTime,
            timezone,
          ),
        ];
      }

      if (intervals.length === 0) return [];

      const overlaps = intervals.map((interval) =>
        and(
          lt(appointments.startsAt, interval.endsAt),
          gt(appointments.endsAt, interval.startsAt),
        ),
      );

      const conditions = [
        eq(appointments.organizationId, ctx.organizationId),
        ne(appointments.status, "cancelled"),
        or(...overlaps),
      ];

      if (input.excludeAppointmentId) {
        conditions.push(ne(appointments.id, input.excludeAppointmentId));
      }

      if (input.excludeSeriesId) {
        conditions.push(
          or(
            isNull(appointments.seriesId),
            ne(appointments.seriesId, input.excludeSeriesId),
          ),
        );
      }

      return ctx.db
        .select({
          id: appointments.id,
          title: appointments.title,
          startsAt: appointments.startsAt,
          endsAt: appointments.endsAt,
          allDay: appointments.allDay,
          customerName: customers.displayName,
        })
        .from(appointments)
        .leftJoin(customers, eq(appointments.customerId, customers.id))
        .where(and(...conditions))
        .orderBy(asc(appointments.startsAt))
        .limit(CONFLICT_RESULT_LIMIT);
    }),

  /** One appointment plus the recurrence of its series, for the edit dialog. */
  getById: organizationProcedure
    .use(requirePermission("schedule:view"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: appointments.id,
          seriesId: appointments.seriesId,
          customerId: appointments.customerId,
          title: appointments.title,
          description: appointments.description,
          location: appointments.location,
          allDay: appointments.allDay,
          startsAt: appointments.startsAt,
          endsAt: appointments.endsAt,
          status: appointments.status,
          billingMode: appointments.billingMode,
          billingTrigger: appointments.billingTrigger,
          itemId: appointments.itemId,
          quantity: appointments.quantity,
          unitPrice: appointments.unitPrice,
          invoiceId: appointments.invoiceId,
          detachedFromSeries: appointments.detachedFromSeries,
          seriesFrequency: scheduleSeries.frequency,
          seriesWeekdays: scheduleSeries.weekdays,
          seriesStartDate: scheduleSeries.startDate,
          seriesEndDate: scheduleSeries.endDate,
          seriesBillingPeriod: scheduleSeries.billingPeriod,
        })
        .from(appointments)
        .leftJoin(scheduleSeries, eq(appointments.seriesId, scheduleSeries.id))
        .where(
          and(
            eq(appointments.id, input.id),
            eq(appointments.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appointment not found.",
        });
      }

      return row;
    }),

  /**
   * What a delete would actually remove. An occurrence billed ahead of time
   * keeps its invoice after the delete, so the confirmation has to say how many
   * are in that state before the user commits to it.
   */
  previewDelete: organizationProcedure
    .use(requirePermission("schedule:delete"))
    .input(
      z.object({
        id: z.string().trim().min(1),
        scope: z.enum(["one", "future"]).default("one"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const existing = await requireAppointment(
        ctx.db,
        ctx.organizationId,
        input.id,
      );

      if (input.scope === "one" || !existing.seriesId) {
        return {
          total: 1,
          invoiced: existing.invoiceId ? 1 : 0,
        };
      }

      const rows = await ctx.db
        .select({ invoiceId: appointments.invoiceId })
        .from(appointments)
        .where(
          and(
            eq(appointments.organizationId, ctx.organizationId),
            eq(appointments.seriesId, existing.seriesId),
            gte(appointments.startsAt, existing.startsAt),
          ),
        );

      return {
        total: rows.length,
        invoiced: rows.filter((row) => row.invoiceId !== null).length,
      };
    }),

  createAppointment: organizationProcedure
    .use(requirePermission("schedule:create"))
    .input(appointmentUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const { timezone, currencyId } = await resolveOrgDefaults(
        ctx.db,
        ctx.organizationId,
      );

      const { startsAt, endsAt } = resolveInstants(
        input.date,
        input.allDay,
        input.startTime ?? DEFAULT_START_TIME,
        input.endTime,
        timezone,
      );

      const pricing = await resolvePricing(ctx.db, ctx.organizationId, input);

      const [created] = await ctx.db
        .insert(appointments)
        .values({
          organizationId: ctx.organizationId,
          customerId: input.customerId ?? null,
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          allDay: input.allDay,
          startsAt,
          endsAt,
          billingMode: input.billingMode,
          billingTrigger: input.billingTrigger,
          itemId: pricing.itemId,
          itemName: pricing.itemName,
          currencyId: input.billingMode === "none" ? null : currencyId,
          quantity: pricing.quantity,
          unitPrice: pricing.unitPrice,
          total: pricing.total,
          createdByUserId: userId,
        })
        .returning({ id: appointments.id });

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create the appointment.",
        });
      }

      return { ok: true as const, id: created.id };
    }),

  /**
   * Edits a single occurrence, or this one plus every later occurrence of the
   * same series. Occurrences that were already invoiced keep their billed
   * figures untouched and are reported back so the UI can say so.
   */
  updateAppointment: organizationProcedure
    .use(requirePermission("schedule:edit"))
    .input(
      appointmentUpsertSchema.and(
        z.object({
          id: z.string().min(1),
          scope: z.enum(["one", "future"]).default("one"),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await requireAppointment(
        ctx.db,
        ctx.organizationId,
        input.id,
      );

      const { timezone, currencyId } = await resolveOrgDefaults(
        ctx.db,
        ctx.organizationId,
      );
      const pricing = await resolvePricing(ctx.db, ctx.organizationId, input);
      const startTime = input.startTime ?? DEFAULT_START_TIME;

      const shared = {
        customerId: input.customerId ?? null,
        title: input.title,
        description: input.description ?? null,
        location: input.location ?? null,
        allDay: input.allDay,
        billingMode: input.billingMode,
        billingTrigger: input.billingTrigger,
        itemId: pricing.itemId,
        itemName: pricing.itemName,
        currencyId: input.billingMode === "none" ? null : currencyId,
        quantity: pricing.quantity,
        unitPrice: pricing.unitPrice,
        total: pricing.total,
        updatedAt: new Date(),
      };

      if (input.scope === "one" || !existing.seriesId) {
        if (existing.invoiceId) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This appointment was already invoiced. Void the invoice before editing it.",
          });
        }

        const { startsAt, endsAt } = resolveInstants(
          input.date,
          input.allDay,
          startTime,
          input.endTime,
          timezone,
        );

        await ctx.db
          .update(appointments)
          .set({
            ...shared,
            startsAt,
            endsAt,
            // Editing one occurrence detaches it, so series edits leave it alone.
            detachedFromSeries: existing.seriesId !== null,
          })
          .where(
            and(
              eq(appointments.id, input.id),
              eq(appointments.organizationId, ctx.organizationId),
            ),
          );

        return { ok: true as const, updated: 1, skippedInvoiced: 0 };
      }

      const seriesId = existing.seriesId;

      // Future occurrences keep their own calendar day and only take the new
      // wall-clock time, so the recurrence pattern itself stays intact.
      const future = await ctx.db
        .select({ id: appointments.id, startsAt: appointments.startsAt })
        .from(appointments)
        .where(
          and(
            eq(appointments.organizationId, ctx.organizationId),
            eq(appointments.seriesId, seriesId),
            gte(appointments.startsAt, existing.startsAt),
            eq(appointments.detachedFromSeries, false),
          ),
        );

      const editable = await ctx.db
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.organizationId, ctx.organizationId),
            eq(appointments.seriesId, seriesId),
            gte(appointments.startsAt, existing.startsAt),
            eq(appointments.detachedFromSeries, false),
            isNull(appointments.invoiceId),
          ),
        );
      const editableIds = new Set(editable.map((row) => row.id));

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(scheduleSeries)
          .set({
            customerId: input.customerId ?? null,
            title: input.title,
            description: input.description ?? null,
            location: input.location ?? null,
            allDay: input.allDay,
            startTime: input.allDay ? null : startTime,
            endTime: input.allDay
              ? null
              : (input.endTime ?? addMinutesToTime(startTime, 60)),
            billingMode: input.billingMode,
            billingTrigger: input.billingTrigger,
            itemId: pricing.itemId,
            currencyId: input.billingMode === "none" ? null : currencyId,
            quantity: pricing.quantity,
            unitPrice: pricing.unitPrice,
            updatedAt: shared.updatedAt,
          })
          .where(
            and(
              eq(scheduleSeries.id, seriesId),
              eq(scheduleSeries.organizationId, ctx.organizationId),
            ),
          );

        for (const row of future) {
          if (!editableIds.has(row.id)) continue;

          const day = formatInTimeZone(row.startsAt, timezone, "yyyy-MM-dd");
          const { startsAt, endsAt } = resolveInstants(
            day,
            input.allDay,
            startTime,
            input.endTime,
            timezone,
          );

          await tx
            .update(appointments)
            .set({ ...shared, startsAt, endsAt })
            .where(eq(appointments.id, row.id));
        }
      });

      return {
        ok: true as const,
        updated: editableIds.size,
        skippedInvoiced: future.length - editableIds.size,
      };
    }),

  setStatus: organizationProcedure
    .use(requirePermission("schedule:edit"))
    .input(
      z.object({
        id: z.string().trim().min(1),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await requireAppointment(
        ctx.db,
        ctx.organizationId,
        input.id,
      );

      const now = new Date();

      await ctx.db
        .update(appointments)
        .set({
          status: input.status,
          completedAt: input.status === "completed" ? now : null,
          cancelledAt: input.status === "cancelled" ? now : null,
          updatedAt: now,
        })
        .where(
          and(
            eq(appointments.id, input.id),
            eq(appointments.organizationId, ctx.organizationId),
          ),
        );

      // Bill right away so the invoice shows up without waiting for the cron.
      let billing: { invoiceId: string } | null = null;
      if (
        input.status === "completed" &&
        existing.billingMode === "per_appointment" &&
        existing.billingTrigger === "on_completion" &&
        !existing.invoiceId
      ) {
        const result = await billAppointmentById(
          ctx.db,
          ctx.organizationId,
          input.id,
          now,
        );
        if (result.ok) billing = { invoiceId: result.invoiceId };
      }

      return { ok: true as const, billing };
    }),

  billNow: organizationProcedure
    .use(requirePermission("schedule:bill"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await billAppointmentById(
        ctx.db,
        ctx.organizationId,
        input.id,
      );

      if (!result.ok) {
        throw new TRPCError({ code: "FORBIDDEN", message: result.message });
      }

      return {
        ok: true as const,
        invoiceId: result.invoiceId,
        alreadyBilled: result.alreadyBilled,
      };
    }),

  /**
   * Removes either a single occurrence or every occurrence from this one
   * onwards. Invoices are never touched: dropping a schedule entry must not
   * erase what was already billed to the customer.
   */
  deleteAppointment: organizationProcedure
    .use(requirePermission("schedule:delete"))
    .input(
      z.object({
        id: z.string().trim().min(1),
        scope: z.enum(["one", "future"]).default("one"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await requireAppointment(
        ctx.db,
        ctx.organizationId,
        input.id,
      );

      if (input.scope === "one" || !existing.seriesId) {
        await ctx.db
          .delete(appointments)
          .where(
            and(
              eq(appointments.id, input.id),
              eq(appointments.organizationId, ctx.organizationId),
            ),
          );

        return { ok: true as const, deleted: 1, seriesEnded: false };
      }

      const removed = await ctx.db
        .delete(appointments)
        .where(
          and(
            eq(appointments.organizationId, ctx.organizationId),
            eq(appointments.seriesId, existing.seriesId),
            gte(appointments.startsAt, existing.startsAt),
          ),
        )
        .returning({ id: appointments.id });

      // Without closing the series the hourly job would simply recreate
      // everything that was just deleted.
      await endSeriesBefore(
        ctx.db,
        ctx.organizationId,
        existing.seriesId,
        existing.startsAt,
      );

      return {
        ok: true as const,
        deleted: removed.length,
        seriesEnded: true,
      };
    }),

  // ---- Series ---------------------------------------------------------------

  listSeries: organizationProcedure
    .use(requirePermission("schedule:view"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: scheduleSeries.id,
          title: scheduleSeries.title,
          frequency: scheduleSeries.frequency,
          weekdays: scheduleSeries.weekdays,
          status: scheduleSeries.status,
          startDate: scheduleSeries.startDate,
          endDate: scheduleSeries.endDate,
          billingMode: scheduleSeries.billingMode,
          billingPeriod: scheduleSeries.billingPeriod,
          generatedCount: scheduleSeries.generatedCount,
          customerName: customers.displayName,
        })
        .from(scheduleSeries)
        .leftJoin(customers, eq(scheduleSeries.customerId, customers.id))
        .where(eq(scheduleSeries.organizationId, ctx.organizationId))
        .orderBy(desc(scheduleSeries.createdAt));
    }),

  createSeries: organizationProcedure
    .use(requirePermission("schedule:create"))
    .input(scheduleSeriesUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const { timezone, currencyId } = await resolveOrgDefaults(
        ctx.db,
        ctx.organizationId,
      );

      const pricing = await resolvePricing(ctx.db, ctx.organizationId, input);
      const startTime = input.allDay
        ? null
        : (input.startTime ?? DEFAULT_START_TIME);

      const [created] = await ctx.db
        .insert(scheduleSeries)
        .values({
          organizationId: ctx.organizationId,
          customerId: input.customerId ?? null,
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          frequency: input.frequency,
          weekdays: input.weekdays ?? null,
          monthDay: input.monthDay ?? null,
          startTime,
          endTime: input.allDay
            ? null
            : (input.endTime ?? addMinutesToTime(startTime ?? "09:00", 60)),
          allDay: input.allDay,
          timezone,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          maxOccurrences: input.maxOccurrences ?? null,
          billingMode: input.billingMode,
          billingTrigger: input.billingTrigger,
          billingPeriod: input.billingPeriod ?? null,
          itemId: pricing.itemId,
          currencyId: input.billingMode === "none" ? null : currencyId,
          quantity: pricing.quantity,
          unitPrice: pricing.unitPrice,
          dueDaysOffset: input.dueDaysOffset ?? null,
          createdByUserId: userId,
        })
        .returning({ id: scheduleSeries.id });

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create the series.",
        });
      }

      // Fill the calendar immediately instead of waiting for the next cron pass.
      const materialized = await materializeSeries(ctx.db, created.id);

      return {
        ok: true as const,
        id: created.id,
        occurrencesCreated: materialized.created,
      };
    }),

  setSeriesStatus: organizationProcedure
    .use(requirePermission("schedule:edit"))
    .input(
      z.object({
        id: z.string().trim().min(1),
        status: z.enum(["active", "paused", "completed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireSeries(ctx.db, ctx.organizationId, input.id);

      await ctx.db
        .update(scheduleSeries)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(scheduleSeries.id, input.id),
            eq(scheduleSeries.organizationId, ctx.organizationId),
          ),
        );

      if (input.status === "active") {
        await materializeSeries(ctx.db, input.id);
      }

      return { ok: true as const };
    }),

  deleteSeries: organizationProcedure
    .use(requirePermission("schedule:delete"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await requireSeries(ctx.db, ctx.organizationId, input.id);

      const now = new Date();

      // Keep history: only future, uninvoiced occurrences are removed.
      await ctx.db
        .delete(appointments)
        .where(
          and(
            eq(appointments.organizationId, ctx.organizationId),
            eq(appointments.seriesId, input.id),
            gte(appointments.startsAt, now),
          ),
        );

      await ctx.db
        .delete(scheduleSeries)
        .where(
          and(
            eq(scheduleSeries.id, input.id),
            eq(scheduleSeries.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),

  /** Appointments that could not be billed automatically. */
  listBillingIssues: organizationProcedure
    .use(requirePermission("schedule:view"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: appointments.id,
          title: appointments.title,
          startsAt: appointments.startsAt,
          reason: appointments.billingBlockedReason,
          customerName: customers.displayName,
        })
        .from(appointments)
        .leftJoin(customers, eq(appointments.customerId, customers.id))
        .where(
          and(
            eq(appointments.organizationId, ctx.organizationId),
            lte(appointments.billingBlockedAt, new Date()),
          ),
        )
        .orderBy(desc(appointments.startsAt))
        .limit(50);
    }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type DbFromContext = Parameters<typeof materializeSeries>[0];

async function resolveOrgDefaults(
  db: DbFromContext,
  organizationId: string,
): Promise<{ timezone: string; currencyId: string | null }> {
  const [preferences] = await db
    .select({
      timezone: organizationPreferences.timezone,
      defaultCurrencyId: organizationPreferences.defaultCurrencyId,
    })
    .from(organizationPreferences)
    .where(eq(organizationPreferences.organizationId, organizationId))
    .limit(1);

  return {
    timezone: preferences?.timezone ?? "UTC",
    currencyId: preferences?.defaultCurrencyId ?? null,
  };
}

async function requireAppointment(
  db: DbFromContext,
  organizationId: string,
  id: string,
) {
  const [row] = await db
    .select({
      id: appointments.id,
      seriesId: appointments.seriesId,
      startsAt: appointments.startsAt,
      invoiceId: appointments.invoiceId,
      billingMode: appointments.billingMode,
      billingTrigger: appointments.billingTrigger,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Appointment not found.",
    });
  }

  return row;
}

/**
 * Closes a series just before the given instant, so the hourly materializer
 * stops producing occurrences that were deliberately deleted while everything
 * already on the calendar before the cutoff stays put.
 */
async function endSeriesBefore(
  db: DbFromContext,
  organizationId: string,
  seriesId: string,
  cutoff: Date,
): Promise<void> {
  const [series] = await db
    .select({
      timezone: scheduleSeries.timezone,
      startDate: scheduleSeries.startDate,
    })
    .from(scheduleSeries)
    .where(
      and(
        eq(scheduleSeries.id, seriesId),
        eq(scheduleSeries.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!series) return;

  const cutoffDay = formatInTimeZone(cutoff, series.timezone, "yyyy-MM-dd");
  const lastKeptDay = previousDay(cutoffDay);

  await db
    .update(scheduleSeries)
    .set({
      status: "completed",
      endDate: lastKeptDay < series.startDate ? series.startDate : lastKeptDay,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(scheduleSeries.id, seriesId),
        eq(scheduleSeries.organizationId, organizationId),
      ),
    );
}

function previousDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const value = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1));
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

async function requireSeries(
  db: DbFromContext,
  organizationId: string,
  id: string,
) {
  const [row] = await db
    .select({ id: scheduleSeries.id })
    .from(scheduleSeries)
    .where(
      and(
        eq(scheduleSeries.id, id),
        eq(scheduleSeries.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Series not found." });
  }

  return row;
}

/** Converts a wall-clock day/time in the org timezone into UTC instants. */
function resolveInstants(
  day: string,
  allDay: boolean,
  startTime: string,
  endTime: string | null | undefined,
  timezone: string,
): { startsAt: Date; endsAt: Date } {
  if (allDay) {
    const startsAt = fromZonedTime(`${day}T00:00:00`, timezone);
    const endsAt = new Date(startsAt);
    endsAt.setUTCDate(endsAt.getUTCDate() + 1);
    return { startsAt, endsAt };
  }

  const resolvedEnd = endTime ?? addMinutesToTime(startTime, 60);
  const startsAt = fromZonedTime(`${day}T${startTime}:00`, timezone);
  let endsAt = fromZonedTime(`${day}T${resolvedEnd}:00`, timezone);

  if (endsAt <= startsAt) {
    endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  }

  return { startsAt, endsAt };
}

/** Freezes the catalog price onto the appointment. */
async function resolvePricing(
  db: DbFromContext,
  organizationId: string,
  input: {
    billingMode: string;
    itemId?: string | null;
    quantity: string;
    unitPrice: string;
  },
): Promise<{
  itemId: string | null;
  itemName: string | null;
  quantity: string;
  unitPrice: string;
  total: string;
}> {
  if (input.billingMode === "none") {
    return {
      itemId: null,
      itemName: null,
      quantity: "1.000",
      unitPrice: "0.000",
      total: "0.000",
    };
  }

  let itemName: string | null = null;

  if (input.itemId) {
    const [item] = await db
      .select({ id: items.id, name: items.name })
      .from(items)
      .where(
        and(
          eq(items.id, input.itemId),
          eq(items.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!item) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "The selected item does not exist in this workspace.",
      });
    }

    itemName = item.name;
  }

  const quantity = toDecimal(input.quantity);
  const unitPrice = toDecimal(input.unitPrice);
  const total = (Number(quantity) * Number(unitPrice)).toFixed(3);

  return {
    itemId: input.itemId ?? null,
    itemName,
    quantity,
    unitPrice,
    total,
  };
}

function toDecimal(value: string): string {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed)) return "0.000";
  return parsed.toFixed(3);
}
