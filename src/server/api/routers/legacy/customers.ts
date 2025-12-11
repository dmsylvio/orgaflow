// src/server/trpc/routers/customers.ts
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  listCustomersInput,
  getCustomerByIdInput,
  createCustomerInput,
  updateCustomerInput,
} from "@/validations/customer.schema";

export const customersRouter = router({
  // LIST
  // List customers for the active organization with cursor pagination
  list: protectedProcedure
    .input(listCustomersInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organização ativa não definida",
        });
      }

      const abilities = await ctx.getPermissions();
      if (!abilities.has("customer:view")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const where = {
        orgId: ctx.orgId,
        ...(input.q
          ? {
              OR: [
                { name: { contains: input.q, mode: "insensitive" as const } },
                { email: { contains: input.q, mode: "insensitive" as const } },
                { phone: { contains: input.q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      // paginação com cursor simples pelo id
      const take = input.limit + 1;
      const rows = await ctx.prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (rows.length > input.limit) {
        const last = rows.pop();
        if (last) nextCursor = last.id;
      }

      return {
        items: rows,
        nextCursor,
      };
    }),

  // GET BY ID
  // Get a single customer by id scoped to the active organization
  getById: protectedProcedure
    .input(getCustomerByIdInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organização ativa não definida",
        });
      }

      const abilities = await ctx.getPermissions();
      if (!abilities.has("customer:view")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const row = await ctx.prisma.customer.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  // CREATE
  // Create a new customer for the active organization
  create: protectedProcedure
    .input(createCustomerInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organização ativa não definida",
        });
      }

      const abilities = await ctx.getPermissions();
      if (!abilities.has("customer:create")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // email é único global no seu schema. Se preferir único por org, ajuste no Prisma depois.
      const created = await ctx.prisma.customer.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          notes: input.notes,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return created;
    }),

  // UPDATE
  // Update a customer fields, ensuring org scoping
  update: protectedProcedure
    .input(updateCustomerInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organização ativa não definida",
        });
      }

      const abilities = await ctx.getPermissions();
      if (!abilities.has("customer:edit")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // garante que pertence à org
      const exists = await ctx.prisma.customer.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!exists) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.prisma.customer.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          notes: input.notes,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updated;
    }),

  // DELETE
  // Delete a customer by id, ensuring org scoping
  delete: protectedProcedure
    .input(getCustomerByIdInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organização ativa não definida",
        });
      }

      const abilities = await ctx.getPermissions();
      if (!abilities.has("customer:delete")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // garante que pertence à org
      const exists = await ctx.prisma.customer.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!exists) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.customer.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
