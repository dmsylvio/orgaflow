import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  automationRules,
  ESTIMATE_TRIGGER_STATUSES,
  INVOICE_TRIGGER_STATUSES,
} from "@/server/db/schemas";
import { createTRPCRouter, ownerProcedure, requirePlan } from "@/server/trpc/init";

const TRIGGER_DOCUMENTS = ["invoice", "estimate"] as const;
const ASSIGN_STRATEGIES = ["document_owner", "organization_owner"] as const;
const MAX_RULES = 10;

const ALL_STATUSES = [
  ...INVOICE_TRIGGER_STATUSES,
  ...ESTIMATE_TRIGGER_STATUSES,
] as const;

// Cross-validation: status must belong to the selected document type
function validateTriggerPair(
  doc: string,
  status: string,
): asserts status is string {
  const allowed =
    doc === "invoice"
      ? (INVOICE_TRIGGER_STATUSES as readonly string[])
      : (ESTIMATE_TRIGGER_STATUSES as readonly string[]);

  if (!allowed.includes(status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Status "${status}" is not valid for document type "${doc}".`,
    });
  }
}

const ruleInputSchema = z.object({
  triggerDocument: z.enum(TRIGGER_DOCUMENTS),
  triggerStatus: z.enum(ALL_STATUSES),
  taskTitleTemplate: z.string().min(1).max(500),
  taskDescriptionTemplate: z.string().max(1000).optional().nullable(),
  taskStageId: z.string().min(1).optional().nullable(),
  assignStrategy: z.enum(ASSIGN_STRATEGIES).default("document_owner"),
  dueDateOffsetDays: z.number().int().min(0).max(365).optional().nullable(),
});

export const automationsRouter = createTRPCRouter({
  listRules: ownerProcedure.use(requirePlan("scale")).query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(automationRules)
      .where(eq(automationRules.organizationId, ctx.organizationId))
      .orderBy(asc(automationRules.createdAt));
  }),

  createRule: ownerProcedure
    .use(requirePlan("scale"))
    .input(ruleInputSchema)
    .mutation(async ({ ctx, input }) => {
      validateTriggerPair(input.triggerDocument, input.triggerStatus);

      const existing = await ctx.db
        .select({ id: automationRules.id })
        .from(automationRules)
        .where(eq(automationRules.organizationId, ctx.organizationId));

      if (existing.length >= MAX_RULES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum of ${MAX_RULES} automation rules allowed.`,
        });
      }

      await ctx.db.insert(automationRules).values({
        organizationId: ctx.organizationId,
        triggerDocument: input.triggerDocument,
        triggerStatus: input.triggerStatus,
        taskTitleTemplate: input.taskTitleTemplate.trim(),
        taskDescriptionTemplate: input.taskDescriptionTemplate?.trim() ?? null,
        taskStageId: input.taskStageId ?? null,
        assignStrategy: input.assignStrategy,
        dueDateOffsetDays: input.dueDateOffsetDays ?? null,
        isEnabled: true,
      });

      return { ok: true as const };
    }),

  updateRule: ownerProcedure
    .use(requirePlan("scale"))
    .input(
      z.object({
        id: z.string().min(1),
        isEnabled: z.boolean().optional(),
      }).merge(ruleInputSchema.partial()),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.triggerDocument && input.triggerStatus) {
        validateTriggerPair(input.triggerDocument, input.triggerStatus);
      }

      const [existing] = await ctx.db
        .select({ id: automationRules.id })
        .from(automationRules)
        .where(
          and(
            eq(automationRules.id, input.id),
            eq(automationRules.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found." });
      }

      await ctx.db
        .update(automationRules)
        .set({
          ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
          ...(input.triggerDocument !== undefined && {
            triggerDocument: input.triggerDocument,
          }),
          ...(input.triggerStatus !== undefined && {
            triggerStatus: input.triggerStatus,
          }),
          ...(input.taskTitleTemplate !== undefined && {
            taskTitleTemplate: input.taskTitleTemplate.trim(),
          }),
          ...(input.taskDescriptionTemplate !== undefined && {
            taskDescriptionTemplate:
              input.taskDescriptionTemplate?.trim() ?? null,
          }),
          ...(input.taskStageId !== undefined && {
            taskStageId: input.taskStageId ?? null,
          }),
          ...(input.assignStrategy !== undefined && {
            assignStrategy: input.assignStrategy,
          }),
          ...(input.dueDateOffsetDays !== undefined && {
            dueDateOffsetDays: input.dueDateOffsetDays ?? null,
          }),
          updatedAt: new Date(),
        })
        .where(eq(automationRules.id, input.id));

      return { ok: true as const };
    }),

  deleteRule: ownerProcedure
    .use(requirePlan("scale"))
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(automationRules)
        .where(
          and(
            eq(automationRules.id, input.id),
            eq(automationRules.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),
});
