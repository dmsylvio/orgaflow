import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("organization_slug_unique").on(table.slug)],
);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    name: text("name"),
    email: text("email").notNull(),
    password: text("password").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    activeOrgId: text("active_org_id").references(() => organization.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const organizationMember = pgTable(
  "organization_member",
  {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    isOwner: boolean("is_owner").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_member_unique").on(table.orgId, table.userId),
    index("organization_member_org_idx").on(table.orgId),
    index("organization_member_user_idx").on(table.userId),
  ],
);

export const customer = pgTable(
  "customer",
  {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_org_email_unique").on(table.orgId, table.email),
    index("customer_org_idx").on(table.orgId),
  ],
);
