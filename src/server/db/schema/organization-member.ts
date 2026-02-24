import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organization } from "./organization";
import { user } from "./user";

export const organizationMember = pgTable(
  "organization_member",
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
    isOwner: boolean("is_owner").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("organization_member_unique").on(table.orgId, table.userId),
    index("organization_member_org_idx").on(table.orgId),
    index("organization_member_user_idx").on(table.userId),
  ],
);

export const organizationMemberRelations = relations(
  organizationMember,
  ({ one }) => ({
    org: one(organization, {
      fields: [organizationMember.orgId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [organizationMember.userId],
      references: [user.id],
    }),
  }),
);
