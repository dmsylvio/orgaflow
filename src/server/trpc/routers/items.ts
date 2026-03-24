import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import {
  currencies,
  items,
  organizationPreferences,
  units,
} from "@/server/db/schemas";
import { getOrganizationPlan } from "@/server/services/billing/get-organization-plan";
import { getUsageLimit } from "@/server/services/billing/plan-limits";
import { ensureDefaultUnits } from "@/server/services/workspace/ensure-default-units";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";

const itemInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(160),
  price: z
    .string()
    .trim()
    .min(1, "Price is required.")
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0;
    }, "Price must be a valid number greater than or equal to zero."),
  unitId: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
});

function normalizePrice(value: string): string {
  return Number(value).toString();
}

export const itemsRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("item:view"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: items.id,
          name: items.name,
          description: items.description,
          price: items.price,
          unitId: items.unitId,
          unitName: units.name,
          createdAt: items.createdAt,
          updatedAt: items.updatedAt,
        })
        .from(items)
        .leftJoin(units, eq(items.unitId, units.id))
        .where(eq(items.organizationId, ctx.organizationId))
        .orderBy(asc(items.name), asc(items.createdAt));
    }),

  listUnits: organizationProcedure
    .use(requirePermission("item:view"))
    .query(async ({ ctx }) => {
      await ensureDefaultUnits(ctx.db);

      return ctx.db
        .select({
          id: units.id,
          name: units.name,
        })
        .from(units)
        .orderBy(asc(units.name));
    }),

  getDefaultCurrency: organizationProcedure
    .use(requirePermission("item:view"))
    .query(async ({ ctx }) => {
      const [row] = await ctx.db
        .select({
          id: currencies.id,
          code: currencies.code,
          symbol: currencies.symbol,
          precision: currencies.precision,
          thousandSeparator: currencies.thousandSeparator,
          decimalSeparator: currencies.decimalSeparator,
          swapCurrencySymbol: currencies.swapCurrencySymbol,
        })
        .from(organizationPreferences)
        .innerJoin(
          currencies,
          eq(organizationPreferences.defaultCurrencyId, currencies.id),
        )
        .where(eq(organizationPreferences.organizationId, ctx.organizationId))
        .limit(1);

      return row ?? null;
    }),

  getUsage: organizationProcedure
    .use(requirePermission("item:view"))
    .query(async ({ ctx }) => {
      const plan = await getOrganizationPlan(ctx.db, ctx.organizationId);
      const limit = getUsageLimit(plan, "items");
      const [row] = await ctx.db
        .select({ total: count(items.id) })
        .from(items)
        .where(eq(items.organizationId, ctx.organizationId));

      const total = Number(row?.total ?? 0);

      return {
        plan,
        total,
        limit,
        remaining: limit === null ? null : Math.max(limit - total, 0),
        canCreate: limit === null || total < limit,
      };
    }),

  create: organizationProcedure
    .use(requirePermission("item:create"))
    .input(itemInputSchema)
    .mutation(async ({ ctx, input }) => {
      const plan = await getOrganizationPlan(ctx.db, ctx.organizationId);
      const limit = getUsageLimit(plan, "items");

      if (limit !== null) {
        const [row] = await ctx.db
          .select({ total: count(items.id) })
          .from(items)
          .where(eq(items.organizationId, ctx.organizationId));

        const total = Number(row?.total ?? 0);

        if (total >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You reached the limit of ${limit} items for the Starter plan. Upgrade to continue creating items.`,
          });
        }
      }

      const unitId = input.unitId ?? null;

      if (unitId) {
        const [unit] = await ctx.db
          .select({ id: units.id })
          .from(units)
          .where(eq(units.id, unitId))
          .limit(1);

        if (!unit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected unit was not found.",
          });
        }
      }

      const [createdItem] = await ctx.db
        .insert(items)
        .values({
          organizationId: ctx.organizationId,
          name: input.name,
          price: normalizePrice(input.price),
          unitId,
          description: input.description ?? null,
        })
        .returning({
          id: items.id,
          name: items.name,
        });

      return { ok: true as const, ...createdItem };
    }),

  update: organizationProcedure
    .use(requirePermission("item:edit"))
    .input(
      itemInputSchema.extend({
        id: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const unitId = input.unitId ?? null;

      if (unitId) {
        const [unit] = await ctx.db
          .select({ id: units.id })
          .from(units)
          .where(eq(units.id, unitId))
          .limit(1);

        if (!unit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected unit was not found.",
          });
        }
      }

      await ctx.db
        .update(items)
        .set({
          name: input.name,
          price: normalizePrice(input.price),
          unitId,
          description: input.description ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(items.id, input.id),
            eq(items.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),

  delete: organizationProcedure
    .use(requirePermission("item:delete"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(items)
        .where(
          and(
            eq(items.id, input.id),
            eq(items.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),
});
