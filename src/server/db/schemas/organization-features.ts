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

export const FEATURE_KEYS = ["kanban"] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const organizationFeatures = pgTable(
  "organization_features",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").$type<FeatureKey>().notNull(),
    enabled: boolean("enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("org_features_unique").on(
      table.organizationId,
      table.featureKey,
    ),
  ],
);

export const organizationFeaturesRelations = relations(
  organizationFeatures,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationFeatures.organizationId],
      references: [organizations.id],
    }),
  }),
);
