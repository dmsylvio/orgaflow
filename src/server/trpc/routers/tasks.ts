import "server-only";

import { TRPCError } from "@trpc/server";
import { asc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { organizationFeatures, taskStages } from "@/server/db/schemas";
import { ensureDefaultTaskStages } from "@/server/services/workspace/ensure-default-task-stages";
import { createTRPCRouter, ownerProcedure } from "@/server/trpc/init";
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

  listStages: ownerProcedure.query(async ({ ctx }) => {
    await ensureDefaultTaskStages(ctx.db, ctx.organizationId);
    return ctx.db
      .select()
      .from(taskStages)
      .where(eq(taskStages.organizationId, ctx.organizationId))
      .orderBy(asc(taskStages.position));
  }),

  createStage: ownerProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
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
        slug: slugify(name),
        position: nextPos,
        isSystem: false,
        createdBy: userId,
      });

      return { ok: true as const };
    }),

  updateStage: ownerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100),
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

      const name = input.name.trim();
      await ctx.db
        .update(taskStages)
        .set({ name, slug: slugify(name), updatedAt: new Date() })
        .where(eq(taskStages.id, input.id));

      return { ok: true as const };
    }),

  reorderStages: ownerProcedure
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

      await ctx.db.transaction(async (tx) => {
        for (const [i, id] of input.orderedIds.entries()) {
          await tx
            .update(taskStages)
            .set({ position: basePosition + i, updatedAt: new Date() })
            .where(eq(taskStages.id, id));
        }
      });

      return { ok: true as const };
    }),

  deleteStage: ownerProcedure
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
          .where(
            gt(taskStages.position, stage.position),
          );
      });

      return { ok: true as const };
    }),

  // ---- Feature toggle -------------------------------------------------------

  getKanbanEnabled: ownerProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ enabled: organizationFeatures.enabled })
      .from(organizationFeatures)
      .where(eq(organizationFeatures.organizationId, ctx.organizationId))
      .limit(1);
    return { enabled: row?.enabled ?? false };
  }),

  setKanbanEnabled: ownerProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: organizationFeatures.id })
        .from(organizationFeatures)
        .where(eq(organizationFeatures.organizationId, ctx.organizationId))
        .limit(1);

      if (existing) {
        await ctx.db
          .update(organizationFeatures)
          .set({ enabled: input.enabled, updatedAt: new Date() })
          .where(
            eq(organizationFeatures.organizationId, ctx.organizationId),
          );
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
});
