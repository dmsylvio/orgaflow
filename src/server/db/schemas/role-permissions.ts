import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { roles } from "./roles";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.roleId, table.permission],
    }),
    index("role_permissions_role_id_idx").on(table.roleId),
  ],
);

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
  }),
);
