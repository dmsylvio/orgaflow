import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { invoiceItemDiscountTypeEnum } from "./enum";
import { invoices } from "./invoices";
import { items } from "./items";
import { organizations } from "./organizations";

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    itemId: text("item_id").references(() => items.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    unitName: text("unit_name"),
    quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
    price: numeric("price", { precision: 13, scale: 3 }).notNull(),
    discountType: invoiceItemDiscountTypeEnum("discount_type")
      .notNull()
      .default("fixed"),
    discount: numeric("discount", { precision: 13, scale: 3 }),
    discountVal: numeric("discount_val", { precision: 13, scale: 3 }),
    tax: numeric("tax", { precision: 13, scale: 3 }),
    total: numeric("total", { precision: 13, scale: 3 }).notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }),
    baseDiscountVal: numeric("base_discount_val", { precision: 13, scale: 3 }),
    basePrice: numeric("base_price", { precision: 13, scale: 3 }),
    baseTax: numeric("base_tax", { precision: 13, scale: 3 }),
    baseTotal: numeric("base_total", { precision: 13, scale: 3 }),
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
    index("invoice_items_org_idx").on(table.organizationId),
    index("invoice_items_invoice_idx").on(table.invoiceId),
    index("invoice_items_item_idx").on(table.itemId),
  ],
);

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceItems.organizationId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  item: one(items, {
    fields: [invoiceItems.itemId],
    references: [items.id],
  }),
}));
