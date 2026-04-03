import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";
import { taskStages } from "./task-stages";
import { users } from "./users";

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_SOURCE_TYPES = ["manual", "automation"] as const;
export type TaskSourceType = (typeof TASK_SOURCE_TYPES)[number];

export const TASK_LINKED_DOCUMENT_TYPES = ["invoice", "estimate"] as const;
export type TaskLinkedDocumentType = (typeof TASK_LINKED_DOCUMENT_TYPES)[number];

export const tasks = pgTable(
  "tasks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    stageId: text("stage_id").references(() => taskStages.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    priority: text("priority")
      .$type<TaskPriority>()
      .notNull()
      .default("medium"),
    estimatedDurationMinutes: integer("estimated_duration_minutes"),
    dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
    ownerId: text("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sourceType: text("source_type")
      .$type<TaskSourceType>()
      .notNull()
      .default("manual"),
    sourceEvent: text("source_event"),
    sourceId: text("source_id"),
    linkedDocumentType: text("linked_document_type").$type<TaskLinkedDocumentType>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tasks_org_idx").on(table.organizationId),
    index("tasks_stage_idx").on(table.stageId),
  ],
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  stage: one(taskStages, {
    fields: [tasks.stageId],
    references: [taskStages.id],
  }),
  owner: one(users, {
    fields: [tasks.ownerId],
    references: [users.id],
  }),
}));
