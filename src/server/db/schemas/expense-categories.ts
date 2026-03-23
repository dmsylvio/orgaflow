import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";

export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("expense_categories_org_idx").on(table.organizationId)],
);

export const expenseCategoriesRelations = relations(
  expenseCategories,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [expenseCategories.organizationId],
      references: [organizations.id],
    }),
  }),
);
