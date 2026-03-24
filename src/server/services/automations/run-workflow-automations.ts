import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import {
  automationRules,
  customers,
  estimates,
  invoices,
  organizationMembers,
  organizations,
  taskStages,
  tasks,
} from "@/server/db/schemas";
import {
  getOrganizationPlan,
  planAtLeast,
} from "@/server/services/billing/get-organization-plan";
import { ensureDefaultTaskStages } from "@/server/services/workspace/ensure-default-task-stages";

type TriggerDocument = "invoice" | "estimate";

export type RunWorkflowAutomationsInput = {
  organizationId: string;
  triggerDocument: TriggerDocument;
  /** New status that was reached (e.g. "PAID", "APPROVED", "VOID"). */
  triggerStatus: string;
  /** Invoice/Estimate id. */
  documentId: string;
  /** User that caused the change (or null for public views). */
  actorUserId: string | null;
  /** When the status was reached. */
  triggeredAt: Date;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPlainTextAsHtml(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacePlaceholder(
  template: string,
  key: string,
  value: string | null | undefined,
): string {
  if (value === null || value === undefined) return template;
  const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, "g");
  return template.replace(pattern, value);
}

function renderTemplate(
  template: string,
  context: {
    invoiceNumber?: string | null;
    estimateNumber?: string | null;
    customerName?: string | null;
  },
): string {
  let result = template;
  result = replacePlaceholder(result, "invoice.number", context.invoiceNumber);
  result = replacePlaceholder(
    result,
    "estimate.number",
    context.estimateNumber,
  );
  result = replacePlaceholder(result, "customer.name", context.customerName);
  return result;
}

function domainEventName(document: TriggerDocument, status: string): string {
  if (document === "invoice") {
    switch (status) {
      case "DRAFT":
        return "invoice_created";
      case "PENDING":
        return "invoice_pending";
      case "SENT":
        return "invoice_sent";
      case "VIEWED":
        return "invoice_viewed";
      case "PAID":
        return "invoice_paid";
      case "OVERDUE":
        return "invoice_overdue";
      case "VOID":
        return "invoice_voided";
      default:
        return "invoice_updated";
    }
  }

  switch (status) {
    case "DRAFT":
      return "estimate_created";
    case "SENT":
      return "estimate_sent";
    case "VIEWED":
      return "estimate_viewed";
    case "APPROVED":
      return "estimate_approved";
    case "REJECTED":
      return "estimate_rejected";
    case "EXPIRED":
      return "estimate_expired";
    default:
      return "estimate_updated";
  }
}

function statusesToMatch(document: TriggerDocument, status: string): string[] {
  // The invoice lifecycle uses "VOID", while the automations UI currently
  // exposes "CANCELLED". Match both so rules work as expected.
  if (document === "invoice" && status === "VOID") {
    return ["VOID", "CANCELLED"];
  }
  return [status];
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
    ),
  );
}

async function isOrganizationMember(
  db: DbClient,
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);
  return row !== undefined;
}

export async function runWorkflowAutomations(
  db: DbClient,
  input: RunWorkflowAutomationsInput,
): Promise<{ createdTasks: number }> {
  try {
    const plan = await getOrganizationPlan(db, input.organizationId);
    if (!planAtLeast(plan, "scale")) return { createdTasks: 0 };

    const rules = await db
      .select({
        id: automationRules.id,
        taskStageId: automationRules.taskStageId,
        taskTitleTemplate: automationRules.taskTitleTemplate,
        taskDescriptionTemplate: automationRules.taskDescriptionTemplate,
        assignStrategy: automationRules.assignStrategy,
        assignedUserId: automationRules.assignedUserId,
        dueDateOffsetDays: automationRules.dueDateOffsetDays,
      })
      .from(automationRules)
      .where(
        and(
          eq(automationRules.organizationId, input.organizationId),
          eq(automationRules.isEnabled, true),
          eq(automationRules.triggerDocument, input.triggerDocument),
          inArray(
            automationRules.triggerStatus,
            statusesToMatch(input.triggerDocument, input.triggerStatus),
          ),
        ),
      );

    if (rules.length === 0) return { createdTasks: 0 };

    const [org] = await db
      .select({ ownerUserId: organizations.ownerUserId })
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1);

    const orgOwnerUserId = org?.ownerUserId ?? null;

    const context =
      input.triggerDocument === "invoice"
        ? await (async () => {
            const [row] = await db
              .select({
                invoiceNumber: invoices.invoiceNumber,
                customerName: customers.displayName,
              })
              .from(invoices)
              .innerJoin(customers, eq(invoices.customerId, customers.id))
              .where(
                and(
                  eq(invoices.id, input.documentId),
                  eq(invoices.organizationId, input.organizationId),
                ),
              )
              .limit(1);
            return row
              ? {
                  invoiceNumber: row.invoiceNumber,
                  estimateNumber: null,
                  customerName: row.customerName,
                }
              : null;
          })()
        : await (async () => {
            const [row] = await db
              .select({
                estimateNumber: estimates.estimateNumber,
                customerName: customers.displayName,
              })
              .from(estimates)
              .innerJoin(customers, eq(estimates.customerId, customers.id))
              .where(
                and(
                  eq(estimates.id, input.documentId),
                  eq(estimates.organizationId, input.organizationId),
                ),
              )
              .limit(1);
            return row
              ? {
                  invoiceNumber: null,
                  estimateNumber: row.estimateNumber,
                  customerName: row.customerName,
                }
              : null;
          })();

    if (!context) return { createdTasks: 0 };

    await ensureDefaultTaskStages(db, input.organizationId);
    const [systemStage] = await db
      .select({ id: taskStages.id })
      .from(taskStages)
      .where(
        and(
          eq(taskStages.organizationId, input.organizationId),
          eq(taskStages.isSystem, true),
        ),
      )
      .limit(1);

    const systemStageId = systemStage?.id ?? null;
    const sourceEvent = domainEventName(
      input.triggerDocument,
      input.triggerStatus,
    );

    let createdTasks = 0;

    for (const rule of rules) {
      const rawTitle = renderTemplate(rule.taskTitleTemplate, context).trim();
      if (!rawTitle) continue;

      const rawDescription = rule.taskDescriptionTemplate
        ? renderTemplate(rule.taskDescriptionTemplate, context).trim()
        : null;

      const description = rawDescription
        ? formatPlainTextAsHtml(rawDescription)
        : null;

      const dueDate =
        rule.dueDateOffsetDays !== null && rule.dueDateOffsetDays !== undefined
          ? addDaysUtc(input.triggeredAt, rule.dueDateOffsetDays)
          : null;

      let stageId: string | null = systemStageId;
      if (rule.taskStageId) {
        const [stage] = await db
          .select({ id: taskStages.id })
          .from(taskStages)
          .where(
            and(
              eq(taskStages.id, rule.taskStageId),
              eq(taskStages.organizationId, input.organizationId),
            ),
          )
          .limit(1);
        stageId = stage?.id ?? systemStageId;
      }

      let ownerId: string | null = null;
      if (rule.assignedUserId) {
        const ok = await isOrganizationMember(
          db,
          input.organizationId,
          rule.assignedUserId,
        );
        ownerId = ok ? rule.assignedUserId : null;
      } else if (rule.assignStrategy === "organization_owner") {
        ownerId = orgOwnerUserId;
      } else {
        ownerId = input.actorUserId ?? orgOwnerUserId;
      }

      if (ownerId) {
        const ok = await isOrganizationMember(
          db,
          input.organizationId,
          ownerId,
        );
        ownerId = ok ? ownerId : null;
      }

      await db.insert(tasks).values({
        organizationId: input.organizationId,
        stageId,
        title: rawTitle,
        description,
        dueDate,
        ownerId,
        sourceType: "automation",
        sourceEvent,
        sourceId: input.documentId,
      });

      createdTasks += 1;
    }

    return { createdTasks };
  } catch (err) {
    console.error("runWorkflowAutomations failed", err);
    return { createdTasks: 0 };
  }
}
