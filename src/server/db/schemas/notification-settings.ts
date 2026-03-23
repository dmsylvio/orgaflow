import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const organizationNotificationSettings = pgTable(
  "organization_notification_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),

    organizationId: text("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Destination
    notifyEmail: text("notify_email"),

    // Document interactions
    invoiceViewed: boolean("invoice_viewed").default(false).notNull(),
    estimateViewed: boolean("estimate_viewed").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("org_notification_settings_org_unique").on(table.organizationId),
  ],
);

export const organizationNotificationSettingsRelations = relations(
  organizationNotificationSettings,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationNotificationSettings.organizationId],
      references: [organizations.id],
    }),
  }),
);
