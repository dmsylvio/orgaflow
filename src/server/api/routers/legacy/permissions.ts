// src/server/trpc/routers/permissions.ts
import { router, protectedProcedure } from "../../trpc";

export const permissionsRouter = router({
  catalog: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.permission.findMany({
      select: { id: true, key: true, name: true, description: true },
      orderBy: { key: "asc" },
    });
  }),
});
