import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";
import { units } from "./units";

export const items = pgTable(
  "items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    price: numeric("price", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    unitId: text("unit_id").references(() => units.id, {
      onDelete: "set null",
    }),
    description: text("description"),

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
    index("items_org_idx").on(table.organizationId),
    index("items_org_name_idx").on(table.organizationId, table.name),
  ],
);

export const itemsRelations = relations(items, ({ one }) => ({
  organization: one(organizations, {
    fields: [items.organizationId],
    references: [organizations.id],
  }),
  unit: one(units, {
    fields: [items.unitId],
    references: [units.id],
  }),
}));
