import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizationSubscriptions } from "./billing";
import { invitations } from "./invitations";
import { organizationMembers } from "./organization-members";
import { users } from "./users";

export const organizations = pgTable(
  "organizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    ownerUserId: text("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text("city"),
    region: text("region"),
    postalCode: text("postal_code"),
    businessPhone: text("business_phone"),
    logoUrl: text("logo_url"),
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
  (table) => [uniqueIndex("organization_slug_unique").on(table.slug)],
);

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [organizations.ownerUserId],
      references: [users.id],
    }),
    members: many(organizationMembers),
    subscriptions: many(organizationSubscriptions),
    invitations: many(invitations),
  }),
);
