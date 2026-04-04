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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { currencies } from "./currencies";
import { customers } from "./customers";
import { invoiceStatusEnum } from "./enum";
import { invoiceItems } from "./invoice-items";
import { organizations } from "./organizations";
import { recurringInvoiceTemplates } from "./recurring-invoice-templates";

export const invoices = pgTable(
  "invoices",
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
    sequenceNumber: integer("sequence_number").notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date"),
    invoiceNumber: text("invoice_number").notNull(),
    status: invoiceStatusEnum("status").notNull().default("DRAFT"),
    publicLinkToken: text("public_link_token"),
    publicLinkCreatedAt: timestamp("public_link_created_at", {
      withTimezone: true,
      mode: "date",
    }),
    taxPerItem: boolean("tax_per_item").notNull().default(false),
    discountPerItem: boolean("discount_per_item").notNull().default(false),
    discountFixed: boolean("discount_fixed").notNull().default(false),
    notes: text("notes"),
    discount: numeric("discount", { precision: 13, scale: 3 }),
    discountVal: numeric("discount_val", { precision: 13, scale: 3 }),
    subTotal: numeric("sub_total", { precision: 13, scale: 3 }).notNull(),
    total: numeric("total", { precision: 13, scale: 3 }).notNull(),
    tax: numeric("tax", { precision: 13, scale: 3 }).notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }),
    baseDiscountVal: numeric("base_discount_val", { precision: 13, scale: 3 }),
    baseSubTotal: numeric("base_sub_total", { precision: 13, scale: 3 }),
    baseTotal: numeric("base_total", { precision: 13, scale: 3 }),
    baseTax: numeric("base_tax", { precision: 13, scale: 3 }),
    salesTax: numeric("sales_tax", { precision: 8, scale: 4 }),
    recurringTemplateId: text("recurring_template_id").references(
      () => recurringInvoiceTemplates.id,
      { onDelete: "set null" },
    ),
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
    index("invoices_org_idx").on(table.organizationId),
    index("invoices_customer_idx").on(table.customerId),
    uniqueIndex("invoices_org_sequence_unique").on(
      table.organizationId,
      table.sequenceNumber,
    ),
    uniqueIndex("invoices_org_number_unique").on(
      table.organizationId,
      table.invoiceNumber,
    ),
    uniqueIndex("invoices_public_link_token_unique").on(table.publicLinkToken),
    index("invoices_recurring_template_idx").on(table.recurringTemplateId),
  ],
);

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  currency: one(currencies, {
    fields: [invoices.currencyId],
    references: [currencies.id],
  }),
  items: many(invoiceItems),
}));
