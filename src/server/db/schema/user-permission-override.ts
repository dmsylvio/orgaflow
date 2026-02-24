import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organization } from "./organization";
import { permission } from "./permission";
import { user } from "./user";

export const overrideMode = pgEnum("override_mode", ["allow", "deny"]);

export const userPermissionOverride = pgTable(
  "user_permission_override",
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
    permissionId: text("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
    mode: overrideMode("mode").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_permission_override_unique").on(
      table.orgId,
      table.userId,
      table.permissionId,
    ),
    index("user_permission_override_org_idx").on(table.orgId),
    index("user_permission_override_user_idx").on(table.userId),
    index("user_permission_override_perm_idx").on(table.permissionId),
  ],
);

export const userPermissionOverrideRelations = relations(
  userPermissionOverride,
  ({ one }) => ({
    org: one(organization, {
      fields: [userPermissionOverride.orgId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [userPermissionOverride.userId],
      references: [user.id],
    }),
    permission: one(permission, {
      fields: [userPermissionOverride.permissionId],
      references: [permission.id],
    }),
  }),
);
