import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, lt, or } from "drizzle-orm/sql/expressions";
import { orgProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";
import {
  createCustomerInput,
  getCustomerByIdInput,
  listCustomersInput,
  updateCustomerInput,
} from "@/validations/customer.schema";

const customerFields = {
  id: schema.customer.id,
  name: schema.customer.name,
  email: schema.customer.email,
  phone: schema.customer.phone,
  notes: schema.customer.notes,
  createdAt: schema.customer.createdAt,
  updatedAt: schema.customer.updatedAt,
} as const;

function requireAbility(abilities: Set<string>, ability: string) {
  if (!abilities.has(ability))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
}

export const customersRouter = router({
  list: orgProcedure.input(listCustomersInput).query(async ({ ctx, input }) => {
    const abilities = await ctx.getPermissions();
    requireAbility(abilities, "customer:view");

    const base = eq(schema.customer.orgId, ctx.orgId);
    const q = input.q?.trim();
    const where = q
      ? and(
          base,
          or(
            ilike(schema.customer.name, `%${q}%`),
            ilike(schema.customer.email, `%${q}%`),
            ilike(schema.customer.phone, `%${q}%`),
          ),
        )
      : base;

    const take = input.limit + 1;
    const cursorWhere = input.cursor
      ? and(where, lt(schema.customer.id, input.cursor))
      : where;

    const rows = await ctx.db
      .select(customerFields)
      .from(schema.customer)
      .where(cursorWhere)
      .orderBy(desc(schema.customer.createdAt))
      .limit(take);

    const items = rows.slice(0, input.limit);
    const nextCursor =
      rows.length > input.limit ? rows[input.limit]?.id : undefined;

    return { items, nextCursor };
  }),

  getById: orgProcedure
    .input(getCustomerByIdInput)
    .query(async ({ ctx, input }) => {
      const abilities = await ctx.getPermissions();
      requireAbility(abilities, "customer:view");

      const [row] = await ctx.db
        .select(customerFields)
        .from(schema.customer)
        .where(
          and(
            eq(schema.customer.id, input.id),
            eq(schema.customer.orgId, ctx.orgId),
          ),
        )
        .limit(1);

      if (!row)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      return row;
    }),

  create: orgProcedure
    .input(createCustomerInput)
    .mutation(async ({ ctx, input }) => {
      const abilities = await ctx.getPermissions();
      requireAbility(abilities, "customer:create");

      const [created] = await ctx.db
        .insert(schema.customer)
        .values({
          orgId: ctx.orgId,
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          notes: input.notes ?? null,
        })
        .returning(customerFields);

      if (!created)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create customer",
        });
      return created;
    }),

  update: orgProcedure
    .input(updateCustomerInput)
    .mutation(async ({ ctx, input }) => {
      const abilities = await ctx.getPermissions();
      requireAbility(abilities, "customer:edit");

      const [updated] = await ctx.db
        .update(schema.customer)
        .set({
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          notes: input.notes ?? null,
        })
        .where(
          and(
            eq(schema.customer.id, input.id),
            eq(schema.customer.orgId, ctx.orgId),
          ),
        )
        .returning(customerFields);

      if (!updated)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      return updated;
    }),

  delete: orgProcedure
    .input(getCustomerByIdInput)
    .mutation(async ({ ctx, input }) => {
      const abilities = await ctx.getPermissions();
      requireAbility(abilities, "customer:delete");

      const [row] = await ctx.db
        .select({ id: schema.customer.id })
        .from(schema.customer)
        .where(
          and(
            eq(schema.customer.id, input.id),
            eq(schema.customer.orgId, ctx.orgId),
          ),
        )
        .limit(1);

      if (!row)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });

      await ctx.db
        .delete(schema.customer)
        .where(eq(schema.customer.id, input.id));
      return { ok: true };
    }),
});
