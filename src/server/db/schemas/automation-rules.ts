import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizations } from "./organizations";
import { taskStages } from "./task-stages";
import { users } from "./users";

export const INVOICE_TRIGGER_STATUSES = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;

export const ESTIMATE_TRIGGER_STATUSES = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
] as const;

export type TriggerDocument = "invoice" | "estimate";
export type InvoiceTriggerStatus = (typeof INVOICE_TRIGGER_STATUSES)[number];
export type EstimateTriggerStatus = (typeof ESTIMATE_TRIGGER_STATUSES)[number];

export const automationAssignStrategyEnum = pgEnum(
  "automation_assign_strategy",
  ["document_owner", "organization_owner"],
);

export const automationRules = pgTable(
  "automation_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    isEnabled: boolean("is_enabled").notNull().default(true),
    /** "invoice" or "estimate" */
    triggerDocument: text("trigger_document")
      .$type<TriggerDocument>()
      .notNull(),
    /** Status value that fires the rule, e.g. "PAID", "APPROVED" */
    triggerStatus: text("trigger_status").notNull(),
    taskStageId: text("task_stage_id").references(() => taskStages.id, {
      onDelete: "set null",
    }),
    taskTitleTemplate: text("task_title_template").notNull(),
    taskDescriptionTemplate: text("task_description_template"),
    assignStrategy: automationAssignStrategyEnum("assign_strategy")
      .notNull()
      .default("document_owner"),
    assignedUserId: text("assigned_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    dueDateOffsetDays: integer("due_date_offset_days"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("automation_rules_org_idx").on(table.organizationId)],
);

export const automationRulesRelations = relations(
  automationRules,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [automationRules.organizationId],
      references: [organizations.id],
    }),
    taskStage: one(taskStages, {
      fields: [automationRules.taskStageId],
      references: [taskStages.id],
    }),
    assignedUser: one(users, {
      fields: [automationRules.assignedUserId],
      references: [users.id],
    }),
  }),
);
