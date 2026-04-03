import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import {
  currencies,
  customers,
  documentFiles,
  estimateItems,
  estimates,
  invoiceItems,
  invoices,
  organizationFeatures,
  TASK_PRIORITIES,
  taskStages,
  tasks,
} from "@/server/db/schemas";
import { can } from "@/server/iam/ability";
import { ensureDefaultTaskStages } from "@/server/services/workspace/ensure-default-task-stages";
import {
  createTRPCRouter,
  organizationProcedure,
  ownerProcedure,
  requirePermission,
  requirePlan,
} from "@/server/trpc/init";
import { getSessionUserId } from "@/server/trpc/utils";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const tasksRouter = createTRPCRouter({
  // ---- Stages ---------------------------------------------------------------

  listStages: ownerProcedure
    .use(requirePlan("scale"))
    .query(async ({ ctx }) => {
      await ensureDefaultTaskStages(ctx.db, ctx.organizationId);
      return ctx.db
        .select()
        .from(taskStages)
        .where(eq(taskStages.organizationId, ctx.organizationId))
        .orderBy(asc(taskStages.position));
    }),

  createStage: ownerProcedure
    .use(requirePlan("scale"))
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = getSessionUserId(ctx);
      const name = input.name.trim();

      const [last] = await ctx.db
        .select({ pos: taskStages.position })
        .from(taskStages)
        .where(eq(taskStages.organizationId, ctx.organizationId))
        .orderBy(sql`${taskStages.position} desc`)
        .limit(1);

      const nextPos = last !== undefined ? last.pos + 1 : 0;

      await ctx.db.insert(taskStages).values({
        organizationId: ctx.organizationId,
        name,
        color: input.color ?? null,
        slug: slugify(name),
        position: nextPos,
        isSystem: false,
        createdBy: userId,
      });

      return { ok: true as const };
    }),

  updateStage: ownerProcedure
    .use(requirePlan("scale"))
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        color: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: taskStages.id })
        .from(taskStages)
        .where(eq(taskStages.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stage not found." });
      }

      const name = input.name?.trim();
      await ctx.db
        .update(taskStages)
        .set({
          ...(name !== undefined && { name, slug: slugify(name) }),
          ...(input.color !== undefined && { color: input.color }),
          updatedAt: new Date(),
        })
        .where(eq(taskStages.id, input.id));

      return { ok: true as const };
    }),

  reorderStages: ownerProcedure
    .use(requirePlan("scale"))
    .input(
      z.object({
        // ordered list of stage ids (must NOT include the system stage)
        orderedIds: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stages = await ctx.db
        .select()
        .from(taskStages)
        .where(eq(taskStages.organizationId, ctx.organizationId))
        .orderBy(asc(taskStages.position));

      const systemStage = stages.find((s) => s.isSystem);
      const customStages = stages.filter((s) => !s.isSystem);

      // Validate: orderedIds must cover exactly the custom stages
      const customIds = new Set(customStages.map((s) => s.id));
      const inputSet = new Set(input.orderedIds);
      if (
        input.orderedIds.length !== customStages.length ||
        ![...inputSet].every((id) => customIds.has(id))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "orderedIds must contain exactly all custom stage IDs.",
        });
      }

      // System stage is always position 0; custom stages start at 1
      const basePosition = systemStage ? 1 : 0;
      const updatedAt = new Date();

      await ctx.db.transaction(async (tx) => {
        // Move custom stages to a temporary negative range first so the
        // unique (organization_id, position) index never collides mid-reorder.
        for (const [i, id] of input.orderedIds.entries()) {
          await tx
            .update(taskStages)
            .set({ position: -(i + 1), updatedAt })
            .where(
              and(
                eq(taskStages.id, id),
                eq(taskStages.organizationId, ctx.organizationId),
              ),
            );
        }

        for (const [i, id] of input.orderedIds.entries()) {
          await tx
            .update(taskStages)
            .set({ position: basePosition + i, updatedAt })
            .where(
              and(
                eq(taskStages.id, id),
                eq(taskStages.organizationId, ctx.organizationId),
              ),
            );
        }
      });

      return { ok: true as const };
    }),

  deleteStage: ownerProcedure
    .use(requirePlan("scale"))
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [stage] = await ctx.db
        .select()
        .from(taskStages)
        .where(eq(taskStages.id, input.id))
        .limit(1);

      if (!stage || stage.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stage not found." });
      }

      if (stage.isSystem) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The default stage cannot be deleted.",
        });
      }

      // After deletion, close the gap in positions
      await ctx.db.transaction(async (tx) => {
        await tx.delete(taskStages).where(eq(taskStages.id, input.id));

        // Shift down positions of all stages after the deleted one
        await tx
          .update(taskStages)
          .set({
            position: sql`${taskStages.position} - 1`,
            updatedAt: new Date(),
          })
          .where(gt(taskStages.position, stage.position));
      });

      return { ok: true as const };
    }),

  // ---- Feature toggle -------------------------------------------------------

  getKanbanEnabled: ownerProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ enabled: organizationFeatures.enabled })
      .from(organizationFeatures)
      .where(
        and(
          eq(organizationFeatures.organizationId, ctx.organizationId),
          eq(organizationFeatures.featureKey, "kanban"),
        ),
      )
      .limit(1);
    return { enabled: row?.enabled ?? false };
  }),

  setKanbanEnabled: ownerProcedure
    .use(requirePlan("scale"))
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: organizationFeatures.id })
        .from(organizationFeatures)
        .where(
          and(
            eq(organizationFeatures.organizationId, ctx.organizationId),
            eq(organizationFeatures.featureKey, "kanban"),
          ),
        )
        .limit(1);

      if (existing) {
        await ctx.db
          .update(organizationFeatures)
          .set({ enabled: input.enabled, updatedAt: new Date() })
          .where(eq(organizationFeatures.organizationId, ctx.organizationId));
      } else {
        await ctx.db.insert(organizationFeatures).values({
          organizationId: ctx.organizationId,
          featureKey: "kanban",
          enabled: input.enabled,
        });
      }

      if (input.enabled) {
        await ensureDefaultTaskStages(ctx.db, ctx.organizationId);
      }

      return { ok: true as const };
    }),

  // ---- Tasks ----------------------------------------------------------------

  listTasks: organizationProcedure
    .use(requirePermission("task:view"))
    .use(requirePlan("scale"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: tasks.id,
          stageId: tasks.stageId,
          title: tasks.title,
          description: tasks.description,
          priority: tasks.priority,
          estimatedDurationMinutes: tasks.estimatedDurationMinutes,
          dueDate: tasks.dueDate,
          ownerId: tasks.ownerId,
          sourceType: tasks.sourceType,
          sourceId: tasks.sourceId,
          sourceEvent: tasks.sourceEvent,
          linkedDocumentType: tasks.linkedDocumentType,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .where(eq(tasks.organizationId, ctx.organizationId))
        .orderBy(asc(tasks.createdAt));
    }),

  createTask: organizationProcedure
    .use(requirePermission("task:create"))
    .use(requirePlan("scale"))
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(2000).optional().nullable(),
        priority: z.enum(TASK_PRIORITIES).default("medium"),
        stageId: z.string().min(1).optional().nullable(),
        estimatedDurationMinutes: z
          .number()
          .int()
          .min(1)
          .max(525600)
          .optional()
          .nullable(),
        dueDate: z.coerce.date().optional().nullable(),
        linkedDocumentId: z.string().min(1).optional().nullable(),
        linkedDocumentType: z.enum(["invoice", "estimate"]).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // If no stageId given, default to the system stage
      let stageId = input.stageId ?? null;
      if (!stageId) {
        const [systemStage] = await ctx.db
          .select({ id: taskStages.id })
          .from(taskStages)
          .where(
            and(
              eq(taskStages.organizationId, ctx.organizationId),
              eq(taskStages.isSystem, true),
            ),
          )
          .limit(1);
        stageId = systemStage?.id ?? null;
      }

      const [created] = await ctx.db
        .insert(tasks)
        .values({
          organizationId: ctx.organizationId,
          title: input.title.trim(),
          description: input.description?.trim() ?? null,
          priority: input.priority,
          stageId,
          estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
          dueDate: input.dueDate ?? null,
          sourceType: "manual",
          sourceId: input.linkedDocumentId ?? null,
          linkedDocumentType: input.linkedDocumentType ?? null,
        })
        .returning({ id: tasks.id });

      return created;
    }),

  updateTask: organizationProcedure
    .use(requirePermission("task:edit"))
    .use(requirePlan("scale"))
    .input(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(2000).optional().nullable(),
        priority: z.enum(TASK_PRIORITIES).optional(),
        stageId: z.string().min(1).optional().nullable(),
        estimatedDurationMinutes: z
          .number()
          .int()
          .min(1)
          .max(525600)
          .optional()
          .nullable(),
        dueDate: z.coerce.date().optional().nullable(),
        linkedDocumentId: z.string().min(1).optional().nullable(),
        linkedDocumentType: z.enum(["invoice", "estimate"]).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.id, input.id),
            eq(tasks.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      await ctx.db
        .update(tasks)
        .set({
          ...(input.title !== undefined && { title: input.title.trim() }),
          ...(input.description !== undefined && {
            description: input.description?.trim() ?? null,
          }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.stageId !== undefined && {
            stageId: input.stageId ?? null,
          }),
          ...(input.estimatedDurationMinutes !== undefined && {
            estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
          }),
          ...(input.dueDate !== undefined && {
            dueDate: input.dueDate ?? null,
          }),
          ...(input.linkedDocumentId !== undefined && {
            sourceId: input.linkedDocumentId ?? null,
          }),
          ...(input.linkedDocumentType !== undefined && {
            linkedDocumentType: input.linkedDocumentType ?? null,
          }),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, input.id));

      return { ok: true as const };
    }),

  getLinkedDocument: organizationProcedure
    .use(requirePermission("task:view"))
    .use(requirePlan("scale"))
    .input(z.object({ taskId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .select({
          sourceId: tasks.sourceId,
          linkedDocumentType: tasks.linkedDocumentType,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.id, input.taskId),
            eq(tasks.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!task?.sourceId || !task.linkedDocumentType) return null;

      const { sourceId, linkedDocumentType } = task;

      if (linkedDocumentType === "invoice") {
        const canViewPrices = can(ctx.ability, "invoice:view-prices");

        const [invoice] = await ctx.db
          .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            status: invoices.status,
            invoiceDate: invoices.invoiceDate,
            dueDate: invoices.dueDate,
            notes: invoices.notes,
            subTotal: invoices.subTotal,
            total: invoices.total,
            tax: invoices.tax,
            customerName: customers.displayName,
            customerEmail: customers.email,
            currencyCode: currencies.code,
            currencySymbol: currencies.symbol,
            currencyPrecision: currencies.precision,
            currencyThousandSeparator: currencies.thousandSeparator,
            currencyDecimalSeparator: currencies.decimalSeparator,
            currencySwapSymbol: currencies.swapCurrencySymbol,
          })
          .from(invoices)
          .innerJoin(customers, eq(invoices.customerId, customers.id))
          .innerJoin(currencies, eq(invoices.currencyId, currencies.id))
          .where(
            and(
              eq(invoices.id, sourceId),
              eq(invoices.organizationId, ctx.organizationId),
            ),
          )
          .limit(1);

        if (!invoice) return null;

        const lineItems = await ctx.db
          .select({
            id: invoiceItems.id,
            name: invoiceItems.name,
            description: invoiceItems.description,
            unitName: invoiceItems.unitName,
            quantity: invoiceItems.quantity,
            price: invoiceItems.price,
            total: invoiceItems.total,
          })
          .from(invoiceItems)
          .where(
            and(
              eq(invoiceItems.organizationId, ctx.organizationId),
              eq(invoiceItems.invoiceId, sourceId),
            ),
          )
          .orderBy(asc(invoiceItems.createdAt));

        const files = await ctx.db
          .select({
            id: documentFiles.id,
            fileName: documentFiles.fileName,
            storageKey: documentFiles.storageKey,
            mimeType: documentFiles.mimeType,
            fileSize: documentFiles.fileSize,
          })
          .from(documentFiles)
          .where(
            and(
              eq(documentFiles.resourceType, "invoice"),
              eq(documentFiles.resourceId, sourceId),
              eq(documentFiles.organizationId, ctx.organizationId),
            ),
          )
          .orderBy(asc(documentFiles.createdAt));

        return {
          type: "invoice" as const,
          document: {
            id: invoice.id,
            number: invoice.invoiceNumber,
            status: invoice.status,
            date: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            notes: invoice.notes,
            subTotal: canViewPrices ? invoice.subTotal : null,
            total: canViewPrices ? invoice.total : null,
            tax: canViewPrices ? invoice.tax : null,
            customer: { displayName: invoice.customerName, email: invoice.customerEmail },
            currency: {
              code: invoice.currencyCode,
              symbol: invoice.currencySymbol,
              precision: invoice.currencyPrecision,
              thousandSeparator: invoice.currencyThousandSeparator,
              decimalSeparator: invoice.currencyDecimalSeparator,
              swapCurrencySymbol: invoice.currencySwapSymbol,
            },
            items: canViewPrices
              ? lineItems
              : lineItems.map((item) => ({ ...item, price: null, total: null })),
            files,
          },
        };
      }

      // estimate
      const canViewPrices = can(ctx.ability, "estimate:view-prices");

      const [estimate] = await ctx.db
        .select({
          id: estimates.id,
          estimateNumber: estimates.estimateNumber,
          status: estimates.status,
          estimateDate: estimates.estimateDate,
          expiryDate: estimates.expiryDate,
          notes: estimates.notes,
          subTotal: estimates.subTotal,
          total: estimates.total,
          tax: estimates.tax,
          customerName: customers.displayName,
          customerEmail: customers.email,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
          currencyPrecision: currencies.precision,
          currencyThousandSeparator: currencies.thousandSeparator,
          currencyDecimalSeparator: currencies.decimalSeparator,
          currencySwapSymbol: currencies.swapCurrencySymbol,
        })
        .from(estimates)
        .innerJoin(customers, eq(estimates.customerId, customers.id))
        .innerJoin(currencies, eq(estimates.currencyId, currencies.id))
        .where(
          and(
            eq(estimates.id, sourceId),
            eq(estimates.organizationId, ctx.organizationId),
          ),
        )
        .limit(1);

      if (!estimate) return null;

      const lineItems = await ctx.db
        .select({
          id: estimateItems.id,
          name: estimateItems.name,
          description: estimateItems.description,
          unitName: estimateItems.unitName,
          quantity: estimateItems.quantity,
          price: estimateItems.price,
          total: estimateItems.total,
        })
        .from(estimateItems)
        .where(
          and(
            eq(estimateItems.organizationId, ctx.organizationId),
            eq(estimateItems.estimateId, sourceId),
          ),
        )
        .orderBy(asc(estimateItems.createdAt));

      const files = await ctx.db
        .select({
          id: documentFiles.id,
          fileName: documentFiles.fileName,
          storageKey: documentFiles.storageKey,
          mimeType: documentFiles.mimeType,
          fileSize: documentFiles.fileSize,
        })
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.resourceType, "estimate"),
            eq(documentFiles.resourceId, sourceId),
            eq(documentFiles.organizationId, ctx.organizationId),
          ),
        )
        .orderBy(asc(documentFiles.createdAt));

      return {
        type: "estimate" as const,
        document: {
          id: estimate.id,
          number: estimate.estimateNumber,
          status: estimate.status,
          date: estimate.estimateDate,
          expiryDate: estimate.expiryDate,
          notes: estimate.notes,
          subTotal: canViewPrices ? estimate.subTotal : null,
          total: canViewPrices ? estimate.total : null,
          tax: canViewPrices ? estimate.tax : null,
          customer: { displayName: estimate.customerName, email: estimate.customerEmail },
          currency: {
            code: estimate.currencyCode,
            symbol: estimate.currencySymbol,
            precision: estimate.currencyPrecision,
            thousandSeparator: estimate.currencyThousandSeparator,
            decimalSeparator: estimate.currencyDecimalSeparator,
            swapCurrencySymbol: estimate.currencySwapSymbol,
          },
          items: canViewPrices
            ? lineItems
            : lineItems.map((item) => ({ ...item, price: null, total: null })),
          files,
        },
      };
    }),

  deleteTask: organizationProcedure
    .use(requirePermission("task:delete"))
    .use(requirePlan("scale"))
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(tasks)
        .where(
          and(
            eq(tasks.id, input.id),
            eq(tasks.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),
});
