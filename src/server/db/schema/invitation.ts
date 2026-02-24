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

export const invitation = pgTable(
  "invitation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    roleId: text("role_id").references(() => role.id, { onDelete: "set null" }),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    acceptedAt: timestamp("accepted_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("invitation_org_email_unique").on(table.orgId, table.email),
    uniqueIndex("invitation_token_unique").on(table.token),
    index("invitation_org_idx").on(table.orgId),
  ],
);

export const invitationRelations = relations(invitation, ({ one }) => ({
  org: one(organization, {
    fields: [invitation.orgId],
    references: [organization.id],
  }),
  role: one(role, {
    fields: [invitation.roleId],
    references: [role.id],
  }),
  inviter: one(user, {
    fields: [invitation.invitedBy],
    references: [user.id],
  }),
}));
