import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { currencies } from "./currencies";
import { customers } from "./customers";
import {
  appointmentStatusEnum,
  scheduleBillingModeEnum,
  scheduleBillingTriggerEnum,
} from "./enum";
import { invoices } from "./invoices";
import { items } from "./items";
import { organizations } from "./organizations";
import { scheduleSeries } from "./schedule-series";
import { users } from "./users";

/**
 * A single calendar occurrence. Standalone events have `seriesId = null`;
 * recurring ones are materialized from a `schedule_series` by the scheduler job.
 *
 * Pricing is frozen per occurrence so later catalog changes never rewrite
 * what was agreed for an appointment that already happened.
 */
export const appointments = pgTable(
  "appointments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    seriesId: text("series_id").references(() => scheduleSeries.id, {
      onDelete: "set null",
    }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "restrict",
    }),

    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),

    allDay: boolean("all_day").notNull().default(false),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    status: appointmentStatusEnum("status").notNull().default("scheduled"),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
      mode: "date",
    }),
    /** Reserved for staff assignment; propagated from the series but not yet exposed in the UI. */
    assignedUserId: text("assigned_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    /** True once this occurrence was edited on its own; series edits skip it. */
    detachedFromSeries: boolean("detached_from_series")
      .notNull()
      .default(false),

    billingMode: scheduleBillingModeEnum("billing_mode")
      .notNull()
      .default("none"),
    billingTrigger: scheduleBillingTriggerEnum("billing_trigger")
      .notNull()
      .default("on_completion"),
    itemId: text("item_id").references(() => items.id, {
      onDelete: "set null",
    }),
    currencyId: text("currency_id").references(() => currencies.id, {
      onDelete: "restrict",
    }),
    itemName: text("item_name"),
    quantity: numeric("quantity", { precision: 13, scale: 3 })
      .notNull()
      .default("1.000"),
    unitPrice: numeric("unit_price", { precision: 13, scale: 3 })
      .notNull()
      .default("0.000"),
    total: numeric("total", { precision: 13, scale: 3 })
      .notNull()
      .default("0.000"),

    invoiceId: text("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),
    invoicedAt: timestamp("invoiced_at", {
      withTimezone: true,
      mode: "date",
    }),
    /** Set when automatic billing failed (e.g. Starter invoice cap reached). */
    billingBlockedReason: text("billing_blocked_reason"),
    billingBlockedAt: timestamp("billing_blocked_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("appointments_org_idx").on(table.organizationId),
    index("appointments_starts_at_idx").on(table.startsAt),
    index("appointments_org_range_idx").on(
      table.organizationId,
      table.startsAt,
    ),
    index("appointments_series_idx").on(table.seriesId),
    index("appointments_customer_idx").on(table.customerId),
    index("appointments_invoice_idx").on(table.invoiceId),
    // Guards against the scheduler materializing the same occurrence twice.
    // Rows with a null seriesId are exempt, since Postgres treats nulls as distinct.
    uniqueIndex("appointments_series_slot_unique").on(
      table.seriesId,
      table.startsAt,
    ),
  ],
);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  organization: one(organizations, {
    fields: [appointments.organizationId],
    references: [organizations.id],
  }),
  series: one(scheduleSeries, {
    fields: [appointments.seriesId],
    references: [scheduleSeries.id],
  }),
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
  item: one(items, {
    fields: [appointments.itemId],
    references: [items.id],
  }),
  currency: one(currencies, {
    fields: [appointments.currencyId],
    references: [currencies.id],
  }),
  assignedUser: one(users, {
    fields: [appointments.assignedUserId],
    references: [users.id],
  }),
  invoice: one(invoices, {
    fields: [appointments.invoiceId],
    references: [invoices.id],
  }),
}));
