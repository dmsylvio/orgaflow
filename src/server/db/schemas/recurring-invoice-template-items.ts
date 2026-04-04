import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { items } from "./items";
import { organizations } from "./organizations";
import { recurringInvoiceTemplates } from "./recurring-invoice-templates";

export const recurringInvoiceTemplateItems = pgTable(
  "recurring_invoice_template_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => recurringInvoiceTemplates.id, { onDelete: "cascade" }),
    itemId: text("item_id").references(() => items.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    unitName: text("unit_name"),
    quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
    price: numeric("price", { precision: 13, scale: 3 }).notNull(),
    total: numeric("total", { precision: 13, scale: 3 }).notNull(),
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
    index("ri_template_items_org_idx").on(table.organizationId),
    index("ri_template_items_template_idx").on(table.templateId),
  ],
);

export const recurringInvoiceTemplateItemsRelations = relations(
  recurringInvoiceTemplateItems,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [recurringInvoiceTemplateItems.organizationId],
      references: [organizations.id],
    }),
    template: one(recurringInvoiceTemplates, {
      fields: [recurringInvoiceTemplateItems.templateId],
      references: [recurringInvoiceTemplates.id],
    }),
    item: one(items, {
      fields: [recurringInvoiceTemplateItems.itemId],
      references: [items.id],
    }),
  }),
);
