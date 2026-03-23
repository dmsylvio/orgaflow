import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";
import { users } from "./users";

export const taskStages = pgTable(
  "task_stages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    slug: text("slug").notNull(),
    position: integer("position").notNull().default(0),
    isSystem: boolean("is_system").notNull().default(false),
    systemKey: text("system_key"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_stages_org_idx").on(table.organizationId),
    uniqueIndex("task_stages_org_position_unique").on(
      table.organizationId,
      table.position,
    ),
  ],
);

export const taskStagesRelations = relations(taskStages, ({ one }) => ({
  organization: one(organizations, {
    fields: [taskStages.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [taskStages.createdBy],
    references: [users.id],
  }),
}));
