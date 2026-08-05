import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { currencies } from "./currencies";
import { customers } from "./customers";
import {
  scheduleBillingModeEnum,
  scheduleBillingPeriodEnum,
  scheduleBillingTriggerEnum,
  scheduleFrequencyEnum,
  scheduleSeriesStatusEnum,
} from "./enum";
import { items } from "./items";
import { organizations } from "./organizations";
import { users } from "./users";

/**
 * Recurrence rule for a repeating appointment (e.g. "cleaning every Tue and Fri").
 * Individual occurrences are materialized as rows in `appointments`.
 */
export const scheduleSeries = pgTable(
  "schedule_series",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "restrict",
    }),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),

    frequency: scheduleFrequencyEnum("frequency").notNull(),
    /** ISO weekdays (0 = Sunday … 6 = Saturday). Used by weekly/biweekly. */
    weekdays: integer("weekdays").array(),
    /** Day of month (1–31). Used by monthly; clamped to the last valid day. */
    monthDay: integer("month_day"),

    /** Wall-clock times in `timezone`, so occurrences survive DST shifts. */
    startTime: text("start_time"),
    endTime: text("end_time"),
    allDay: boolean("all_day").notNull().default(false),
    /** Snapshot of the org timezone, so editing org preferences cannot shift history. */
    timezone: text("timezone").notNull().default("UTC"),

    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    /** Optional cap on how many occurrences the series ever creates. */
    maxOccurrences: integer("max_occurrences"),
    generatedCount: integer("generated_count").notNull().default(0),
    /** Occurrences exist up to this instant; the cron extends the rolling window. */
    materializedUntil: timestamp("materialized_until", {
      withTimezone: true,
      mode: "date",
    }),

    status: scheduleSeriesStatusEnum("status").notNull().default("active"),
    /** Reserved for staff assignment; not yet exposed in the UI. */
    assignedUserId: text("assigned_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    billingMode: scheduleBillingModeEnum("billing_mode")
      .notNull()
      .default("none"),
    billingTrigger: scheduleBillingTriggerEnum("billing_trigger")
      .notNull()
      .default("on_completion"),
    billingPeriod: scheduleBillingPeriodEnum("billing_period"),
    itemId: text("item_id").references(() => items.id, {
      onDelete: "set null",
    }),
    currencyId: text("currency_id").references(() => currencies.id, {
      onDelete: "restrict",
    }),
    quantity: numeric("quantity", { precision: 13, scale: 3 })
      .notNull()
      .default("1.000"),
    unitPrice: numeric("unit_price", { precision: 13, scale: 3 })
      .notNull()
      .default("0.000"),
    /** Days added to the invoice date to compute its due date. */
    dueDaysOffset: integer("due_days_offset"),

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
    index("schedule_series_org_idx").on(table.organizationId),
    index("schedule_series_customer_idx").on(table.customerId),
    index("schedule_series_status_idx").on(table.status),
    index("schedule_series_materialized_idx").on(table.materializedUntil),
  ],
);

export const scheduleSeriesRelations = relations(scheduleSeries, ({ one }) => ({
  organization: one(organizations, {
    fields: [scheduleSeries.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [scheduleSeries.customerId],
    references: [customers.id],
  }),
  item: one(items, {
    fields: [scheduleSeries.itemId],
    references: [items.id],
  }),
  currency: one(currencies, {
    fields: [scheduleSeries.currencyId],
    references: [currencies.id],
  }),
  assignedUser: one(users, {
    fields: [scheduleSeries.assignedUserId],
    references: [users.id],
  }),
}));
