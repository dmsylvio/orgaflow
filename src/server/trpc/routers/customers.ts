import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { customers } from "@/server/db/schemas";
import { getOrganizationPlan } from "@/server/services/billing/get-organization-plan";
import { getUsageLimit } from "@/server/services/billing/plan-limits";
import {
  createTRPCRouter,
  organizationProcedure,
  requirePermission,
} from "@/server/trpc/init";

const customerInputSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(160),
  primaryContactName: z.string().trim().max(160).nullable().optional(),
  email: z
    .string()
    .trim()
    .max(255)
    .email("Enter a valid email address.")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(80).nullable().optional(),
  website: z.string().trim().max(255).nullable().optional(),
  prefix: z.string().trim().max(80).nullable().optional(),
  name: z.string().trim().max(160).nullable().optional(),
  state: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  zipCode: z.string().trim().max(40).nullable().optional(),
  addressPhone: z.string().trim().max(80).nullable().optional(),
});

function nullableString(value: string | null | undefined): string | null {
  const nextValue = value?.trim() ?? "";
  return nextValue.length > 0 ? nextValue : null;
}

export const customersRouter = createTRPCRouter({
  list: organizationProcedure
    .use(requirePermission("customer:view"))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: customers.id,
          displayName: customers.displayName,
          primaryContactName: customers.primaryContactName,
          email: customers.email,
          phone: customers.phone,
          website: customers.website,
          prefix: customers.prefix,
          name: customers.name,
          state: customers.state,
          city: customers.city,
          address: customers.address,
          zipCode: customers.zipCode,
          addressPhone: customers.addressPhone,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt,
        })
        .from(customers)
        .where(eq(customers.organizationId, ctx.organizationId))
        .orderBy(asc(customers.displayName), asc(customers.createdAt));
    }),

  getUsage: organizationProcedure
    .use(requirePermission("customer:view"))
    .query(async ({ ctx }) => {
      const plan = await getOrganizationPlan(ctx.db, ctx.organizationId);
      const limit = getUsageLimit(plan, "customers");
      const [row] = await ctx.db
        .select({ total: count(customers.id) })
        .from(customers)
        .where(eq(customers.organizationId, ctx.organizationId));

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
    .use(requirePermission("customer:create"))
    .input(customerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const plan = await getOrganizationPlan(ctx.db, ctx.organizationId);
      const limit = getUsageLimit(plan, "customers");

      if (limit !== null) {
        const [row] = await ctx.db
          .select({ total: count(customers.id) })
          .from(customers)
          .where(eq(customers.organizationId, ctx.organizationId));

        const total = Number(row?.total ?? 0);

        if (total >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You reached the limit of ${limit} customers for the Starter plan. Upgrade to continue creating customers.`,
          });
        }
      }

      const [created] = await ctx.db
        .insert(customers)
        .values({
          organizationId: ctx.organizationId,
          displayName: input.displayName,
          primaryContactName: nullableString(input.primaryContactName),
          email: nullableString(input.email),
          phone: nullableString(input.phone),
          website: nullableString(input.website),
          prefix: nullableString(input.prefix),
          name: nullableString(input.name),
          state: nullableString(input.state),
          city: nullableString(input.city),
          address: nullableString(input.address),
          zipCode: nullableString(input.zipCode),
          addressPhone: nullableString(input.addressPhone),
        })
        .returning({ id: customers.id, displayName: customers.displayName });

      return {
        ok: true as const,
        id: created.id,
        displayName: created.displayName,
      };
    }),

  update: organizationProcedure
    .use(requirePermission("customer:edit"))
    .input(
      customerInputSchema.extend({
        id: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(customers)
        .set({
          displayName: input.displayName,
          primaryContactName: nullableString(input.primaryContactName),
          email: nullableString(input.email),
          phone: nullableString(input.phone),
          website: nullableString(input.website),
          prefix: nullableString(input.prefix),
          name: nullableString(input.name),
          state: nullableString(input.state),
          city: nullableString(input.city),
          address: nullableString(input.address),
          zipCode: nullableString(input.zipCode),
          addressPhone: nullableString(input.addressPhone),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(customers.id, input.id),
            eq(customers.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),

  delete: organizationProcedure
    .use(requirePermission("customer:delete"))
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(customers)
        .where(
          and(
            eq(customers.id, input.id),
            eq(customers.organizationId, ctx.organizationId),
          ),
        );

      return { ok: true as const };
    }),
});
