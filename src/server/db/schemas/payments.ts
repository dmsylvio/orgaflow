import { relations } from "drizzle-orm";
import {
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
import { organizations } from "./organizations";
import { paymentModes } from "./payment-modes";
import { users } from "./users";

export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** Auto-incremented per org. Display as PAY-000001 in the UI. */
    sequenceNumber: integer("sequence_number").notNull(),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    paymentModeId: text("payment_mode_id").references(() => paymentModes.id, {
      onDelete: "set null",
    }),
    currencyId: text("currency_id").references(() => currencies.id, {
      onDelete: "restrict",
    }),
    amount: numeric("amount", { precision: 13, scale: 3 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    invoiceRef: text("invoice_ref"),
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
    index("payments_org_idx").on(table.organizationId),
    index("payments_customer_idx").on(table.customerId),
    index("payments_date_idx").on(table.paymentDate),
    uniqueIndex("payments_org_sequence_unique").on(
      table.organizationId,
      table.sequenceNumber,
    ),
  ],
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  paymentMode: one(paymentModes, {
    fields: [payments.paymentModeId],
    references: [paymentModes.id],
  }),
  currency: one(currencies, {
    fields: [payments.currencyId],
    references: [currencies.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdById],
    references: [users.id],
  }),
}));
