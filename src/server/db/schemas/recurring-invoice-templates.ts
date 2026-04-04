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
  recurringFrequencyEnum,
  recurringLimitTypeEnum,
  recurringStatusEnum,
} from "./enum";
import { organizations } from "./organizations";
import { recurringInvoiceTemplateItems } from "./recurring-invoice-template-items";

export const recurringInvoiceTemplates = pgTable(
  "recurring_invoice_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    currencyId: text("currency_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    frequency: recurringFrequencyEnum("frequency").notNull(),
    startDate: date("start_date").notNull(),
    nextRunAt: timestamp("next_run_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    limitType: recurringLimitTypeEnum("limit_type").notNull().default("none"),
    limitDate: date("limit_date"),
    limitCount: integer("limit_count"),
    generatedCount: integer("generated_count").notNull().default(0),
    status: recurringStatusEnum("status").notNull().default("active"),
    sendAutomatically: boolean("send_automatically").notNull().default(false),
    dueDaysOffset: integer("due_days_offset"),
    notes: text("notes"),
    discount: numeric("discount", { precision: 13, scale: 3 }),
    discountFixed: boolean("discount_fixed").notNull().default(false),
    subTotal: numeric("sub_total", { precision: 13, scale: 3 })
      .notNull()
      .default("0.000"),
    total: numeric("total", { precision: 13, scale: 3 })
      .notNull()
      .default("0.000"),
    tax: numeric("tax", { precision: 13, scale: 3 })
      .notNull()
      .default("0.000"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ri_templates_org_idx").on(table.organizationId),
    index("ri_templates_customer_idx").on(table.customerId),
    index("ri_templates_next_run_idx").on(table.nextRunAt),
  ],
);

export const recurringInvoiceTemplatesRelations = relations(
  recurringInvoiceTemplates,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [recurringInvoiceTemplates.organizationId],
      references: [organizations.id],
    }),
    customer: one(customers, {
      fields: [recurringInvoiceTemplates.customerId],
      references: [customers.id],
    }),
    currency: one(currencies, {
      fields: [recurringInvoiceTemplates.currencyId],
      references: [currencies.id],
    }),
    items: many(recurringInvoiceTemplateItems),
  }),
);
