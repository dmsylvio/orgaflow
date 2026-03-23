import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";

/**
 * Tenant-scoped customer. `display_name` is the primary label in UI/lists.
 * `prefix` + `name` are optional structured fields (e.g. legal entity name).
 */
export const customers = pgTable(
  "customers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    primaryContactName: text("primary_contact_name"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    prefix: text("prefix"),
    name: text("name"),
    state: text("state"),
    city: text("city"),
    address: text("address"),
    zipCode: text("zip_code"),
    addressPhone: text("address_phone"),
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
    index("customers_org_idx").on(table.organizationId),
    index("customers_org_display_name_idx").on(
      table.organizationId,
      table.displayName,
    ),
    index("customers_org_email_idx").on(table.organizationId, table.email),
  ],
);

export const customersRelations = relations(customers, ({ one }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
}));
