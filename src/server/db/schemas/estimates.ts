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
import { estimateStatusEnum } from "./enum";
import { estimateItems } from "./estimate-items";
import { organizations } from "./organizations";

export const estimates = pgTable(
  "estimates",
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
    customerSequenceNumber: integer("customer_sequence_number"),
    estimateDate: date("estimate_date").notNull(),
    expiryDate: date("expiry_date"),
    estimateNumber: text("estimate_number").notNull(),
    status: estimateStatusEnum("status").notNull().default("DRAFT"),
    taxPerItem: boolean("tax_per_item").notNull().default(false),
    discountPerItem: boolean("discount_per_item").notNull().default(false),
    discountFixed: boolean("discount_fixed").notNull().default(false),
    notes: text("notes"),
    discount: numeric("discount", { precision: 12, scale: 2 }),
    discountVal: numeric("discount_val", { precision: 12, scale: 2 }),
    subTotal: numeric("sub_total", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    tax: numeric("tax", { precision: 12, scale: 2 }).notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }),
    baseDiscountVal: numeric("base_discount_val", { precision: 12, scale: 2 }),
    baseSubTotal: numeric("base_sub_total", { precision: 12, scale: 2 }),
    baseTotal: numeric("base_total", { precision: 12, scale: 2 }),
    baseTax: numeric("base_tax", { precision: 12, scale: 2 }),
    salesTax: numeric("sales_tax", { precision: 8, scale: 4 }),
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
    index("estimates_org_idx").on(table.organizationId),
    index("estimates_customer_idx").on(table.customerId),
    uniqueIndex("estimates_org_sequence_unique").on(
      table.organizationId,
      table.sequenceNumber,
    ),
    uniqueIndex("estimates_org_number_unique").on(
      table.organizationId,
      table.estimateNumber,
    ),
  ],
);

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [estimates.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [estimates.customerId],
    references: [customers.id],
  }),
  currency: one(currencies, {
    fields: [estimates.currencyId],
    references: [currencies.id],
  }),
  items: many(estimateItems),
}));
