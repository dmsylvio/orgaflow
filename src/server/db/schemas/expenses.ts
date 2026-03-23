import { relations } from "drizzle-orm";
import { date, index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { currencies } from "./currencies";
import { customers } from "./customers";
import { expenseCategories } from "./expense-categories";
import { organizations } from "./organizations";
import { paymentModes } from "./payment-modes";
import { users } from "./users";

export const expenses = pgTable(
  "expenses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => expenseCategories.id, {
      onDelete: "set null",
    }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    paymentModeId: text("payment_mode_id").references(() => paymentModes.id, {
      onDelete: "set null",
    }),
    currencyId: text("currency_id").references(() => currencies.id, {
      onDelete: "restrict",
    }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    expenseDate: date("expense_date").notNull(),
    notes: text("notes"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("expenses_org_idx").on(table.organizationId),
    index("expenses_category_idx").on(table.categoryId),
    index("expenses_customer_idx").on(table.customerId),
    index("expenses_date_idx").on(table.expenseDate),
  ],
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  organization: one(organizations, {
    fields: [expenses.organizationId],
    references: [organizations.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  customer: one(customers, {
    fields: [expenses.customerId],
    references: [customers.id],
  }),
  paymentMode: one(paymentModes, {
    fields: [expenses.paymentModeId],
    references: [paymentModes.id],
  }),
  currency: one(currencies, {
    fields: [expenses.currencyId],
    references: [currencies.id],
  }),
  createdBy: one(users, {
    fields: [expenses.createdById],
    references: [users.id],
  }),
}));
