import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organization } from "./organization";

export const role = pgTable(
  "role",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("role_org_key_unique").on(table.orgId, table.key),
    index("role_org_idx").on(table.orgId),
  ],
);

export const roleRelations = relations(role, ({ one }) => ({
  org: one(organization, {
    fields: [role.orgId],
    references: [organization.id],
  }),
}));
