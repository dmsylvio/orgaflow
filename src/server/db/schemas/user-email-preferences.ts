import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { users } from "./users";

export const userEmailPreferences = pgTable("user_email_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  emailProductUpdates: boolean("email_product_updates").notNull().default(true),
  emailTips: boolean("email_tips").notNull().default(true),
  onboardingD1SentAt: timestamp("onboarding_d1_sent_at", {
    withTimezone: true,
    mode: "date",
  }),
  onboardingD3SentAt: timestamp("onboarding_d3_sent_at", {
    withTimezone: true,
    mode: "date",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const userEmailPreferencesRelations = relations(
  userEmailPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userEmailPreferences.userId],
      references: [users.id],
    }),
  }),
);
