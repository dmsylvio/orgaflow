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
import { subscriptionPlanEnum, subscriptionStatusEnum } from "./enum";
import { organizations } from "./organizations";

export const organizationSubscriptions = pgTable(
  "organization_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    plan: subscriptionPlanEnum("plan").default("starter").notNull(),
    status: subscriptionStatusEnum("status").default("active").notNull(),

    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),

    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
      mode: "date",
    }),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
      mode: "date",
    }),

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
  (table) => [
    uniqueIndex("organization_subscriptions_org_unique").on(
      table.organizationId,
    ),
    uniqueIndex("organization_subscriptions_customer_unique").on(
      table.stripeCustomerId,
    ),
    uniqueIndex("organization_subscriptions_subscription_unique").on(
      table.stripeSubscriptionId,
    ),
    index("organization_subscriptions_org_idx").on(table.organizationId),
  ],
);

export const organizationSubscriptionsRelations = relations(
  organizationSubscriptions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationSubscriptions.organizationId],
      references: [organizations.id],
    }),
  }),
);
