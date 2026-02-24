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
import { role } from "./role";
import { user } from "./user";

export const userRole = pgTable(
  "user_role",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_role_unique").on(table.orgId, table.userId, table.roleId),
    index("user_role_org_idx").on(table.orgId),
    index("user_role_user_idx").on(table.userId),
    index("user_role_role_idx").on(table.roleId),
  ],
);

export const userRoleRelations = relations(userRole, ({ one }) => ({
  org: one(organization, {
    fields: [userRole.orgId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
  }),
  role: one(role, {
    fields: [userRole.roleId],
    references: [role.id],
  }),
}));
