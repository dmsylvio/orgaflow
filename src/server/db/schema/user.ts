import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organization } from "./organization";

export const user = pgTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name"),
    email: text("email").notNull(),
    password: text("password").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    activeOrgId: text("active_org_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const userRelations = relations(user, ({ one }) => ({
  activeOrg: one(organization, {
    fields: [user.activeOrgId],
    references: [organization.id],
  }),
}));
