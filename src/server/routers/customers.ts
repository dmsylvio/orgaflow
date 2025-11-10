import { z } from "zod";
import { orgProcedure, requirePermissions, router } from "../trpc";

export const customersRouter = router({
  list: orgProcedure
    .use(requirePermissions(["customer:view"]))
    .input(z.object({ q: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const q = input?.q?.trim() ?? "";
      return ctx.prisma.customer.findMany({
        where: {
          orgId: ctx.orgId,
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                  { phone: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      // const q = input?.q?.trim() ?? "";
      // return ctx.prisma.customer.findMany({
      //   where: {
      //     orgId: ctx.orgId,
      //     ...(q
      //       ? {
      //           OR: [
      //             { name: { contains: q, mode: "insensitive" } },
      //             { email: { contains: q, mode: "insensitive" } },
      //             { phone: { contains: q, mode: "insensitive" } },
      //           ],
      //         }
      //       : {}),
      //   },
      //   orderBy: { createdAt: "desc" },
      //   take: 50,
      // });
    }),

  create: orgProcedure
    .use(requirePermissions(["customer:create"]))
    .input(
      z.object({
        name: z.string().min(1),
        email: z
          .email()
          .optional()
          .or(z.literal("").transform(() => undefined)),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, phone, notes } = input;
      return ctx.prisma.customer.create({
        data: {
          orgId: ctx.orgId,
          name,
          email: email || undefined,
          phone,
          notes,
        },
      });
    }),
});
