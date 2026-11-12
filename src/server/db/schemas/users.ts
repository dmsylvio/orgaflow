import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { authAccounts, authSessions } from "./auth";
import { organizationMembers } from "./organization-members";
import { userEmailPreferences } from "./user-email-preferences";

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    image: text("image"),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    /**
     * @deprecated Legacy NextAuth bcrypt hash, kept for rollback only.
     * Passwords now live in `auth_accounts` (provider "credential").
     */
    password: text("password"),
    emailVerified: boolean("email_verified").default(false).notNull(),
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
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const usersRelations = relations(users, ({ many, one }) => ({
  authAccounts: many(authAccounts),
  authSessions: many(authSessions),
  organizationMembers: many(organizationMembers),
  emailPreferences: one(userEmailPreferences, {
    fields: [users.id],
    references: [userEmailPreferences.userId],
  }),
}));
