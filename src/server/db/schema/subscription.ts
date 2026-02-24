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
import { user } from "./user";

export const subscription = pgTable(
  "subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    plan: text("plan").notNull(),
    status: text("status").notNull(),
    interval: text("interval").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
      mode: "date",
    }),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("subscription_org_unique").on(table.orgId),
    uniqueIndex("subscription_stripe_sub_unique").on(
      table.stripeSubscriptionId,
    ),
    index("subscription_user_idx").on(table.userId),
  ],
);

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  org: one(organization, {
    fields: [subscription.orgId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}));
