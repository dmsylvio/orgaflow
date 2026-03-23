import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";

export const taxTypes = pgTable(
  "tax_types",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    percent: numeric("percent", { precision: 8, scale: 3 }).notNull(),
    compoundTax: boolean("compound_tax").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("tax_types_org_idx").on(table.organizationId)],
);

export const taxTypesRelations = relations(taxTypes, ({ one }) => ({
  organization: one(organizations, {
    fields: [taxTypes.organizationId],
    references: [organizations.id],
  }),
}));
