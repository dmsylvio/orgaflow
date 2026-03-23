import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { estimateItemDiscountTypeEnum } from "./enum";
import { estimates } from "./estimates";
import { items } from "./items";
import { organizations } from "./organizations";

export const estimateItems = pgTable(
  "estimate_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    estimateId: text("estimate_id")
      .notNull()
      .references(() => estimates.id, { onDelete: "cascade" }),
    itemId: text("item_id").references(() => items.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    unitName: text("unit_name"),
    quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    discountType: estimateItemDiscountTypeEnum("discount_type")
      .notNull()
      .default("fixed"),
    discount: numeric("discount", { precision: 12, scale: 2 }),
    discountVal: numeric("discount_val", { precision: 12, scale: 2 }),
    tax: numeric("tax", { precision: 12, scale: 2 }),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }),
    baseDiscountVal: numeric("base_discount_val", { precision: 12, scale: 2 }),
    basePrice: numeric("base_price", { precision: 12, scale: 2 }),
    baseTax: numeric("base_tax", { precision: 12, scale: 2 }),
    baseTotal: numeric("base_total", { precision: 12, scale: 2 }),
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
    index("estimate_items_org_idx").on(table.organizationId),
    index("estimate_items_estimate_idx").on(table.estimateId),
    index("estimate_items_item_idx").on(table.itemId),
  ],
);

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  organization: one(organizations, {
    fields: [estimateItems.organizationId],
    references: [organizations.id],
  }),
  estimate: one(estimates, {
    fields: [estimateItems.estimateId],
    references: [estimates.id],
  }),
  item: one(items, {
    fields: [estimateItems.itemId],
    references: [items.id],
  }),
}));
