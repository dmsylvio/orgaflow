import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { currencies } from "./currencies";
import { organizations } from "./organizations";

// ---------------------------------------------------------------------------
// Constants (shared with the application layer)
// ---------------------------------------------------------------------------

export const DATE_FORMAT_VALUES = [
  "YYYY_MMM_DD", // 2026 Mar 22
  "DD_MMM_YYYY", // 22 Mar 2026
  "DD/MM/YYYY", // 22/03/2026
  "DD.MM.YYYY", // 22.03.2026
  "DD-MM-YYYY", // 22-03-2026
  "MM/DD/YYYY", // 02/22/2026
  "YYYY/MM/DD", // 2026/03/22
  "YYYY-MM-DD", // 2026-03-22
] as const;

export type DateFormatValue = (typeof DATE_FORMAT_VALUES)[number];

export const FINANCIAL_YEAR_VALUES = [
  "january-december",
  "february-january",
  "march-february",
  "april-march",
  "may-april",
  "june-may",
  "july-june",
  "august-july",
  "september-august",
  "october-september",
  "november-october",
  "december-november",
] as const;

export type FinancialYearValue = (typeof FINANCIAL_YEAR_VALUES)[number];

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const organizationPreferences = pgTable(
  "organization_preferences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    defaultCurrencyId: text("default_currency_id").references(
      () => currencies.id,
      { onDelete: "set null" },
    ),
    language: text("language").default("en").notNull(),
    timezone: text("timezone").default("UTC").notNull(),
    dateFormat: text("date_format")
      .$type<DateFormatValue>()
      .default("DD/MM/YYYY")
      .notNull(),
    financialYearStart: text("financial_year_start")
      .$type<FinancialYearValue>()
      .default("january-december")
      .notNull(),

    publicLinksExpireEnabled: boolean("public_links_expire_enabled")
      .default(true)
      .notNull(),
    publicLinksExpireDays: integer("public_links_expire_days")
      .default(7)
      .notNull(),
    discountPerItem: boolean("discount_per_item").default(false).notNull(),
    taxPerItem: boolean("tax_per_item").default(false).notNull(),
    invoiceTemplate: integer("invoice_template").default(1).notNull(),
    estimateTemplate: integer("estimate_template").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("org_preferences_org_unique").on(table.organizationId),
  ],
);

export const organizationPreferencesRelations = relations(
  organizationPreferences,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationPreferences.organizationId],
      references: [organizations.id],
    }),
    defaultCurrency: one(currencies, {
      fields: [organizationPreferences.defaultCurrencyId],
      references: [currencies.id],
    }),
  }),
);
