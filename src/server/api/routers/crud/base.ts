import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

type PrismaModelName =
  | "account"
  | "session"
  | "user"
  | "verificationRequest"
  | "organization"
  | "organizationMember"
  | "permission"
  | "role"
  | "rolePermission"
  | "userRole"
  | "userPermissionOverride"
  | "invitation"
  | "customer";

interface CrudOptions {
  model: PrismaModelName;
  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
}

export function createCrudRouter({ model, createSchema, updateSchema }: CrudOptions) {
  return router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return (ctx.prisma as any)[model].findMany();
    }),
    byId: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return (ctx.prisma as any)[model].findUnique({ where: { id: input.id } });
      }),
    create: protectedProcedure
      .input(createSchema)
      .mutation(async ({ ctx, input }) => {
        return (ctx.prisma as any)[model].create({ data: input });
      }),
    update: protectedProcedure
      .input(updateSchema)
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input as Record<string, unknown> & { id: string };
        return (ctx.prisma as any)[model].update({ where: { id }, data });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return (ctx.prisma as any)[model].delete({ where: { id: input.id } });
      }),
  });
}
