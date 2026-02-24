// src/server/trpc/routers/permissions.ts

import { asc } from "drizzle-orm";
import { protectedProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";

export const permissionsRouter = router({
  catalog: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: schema.permission.id,
        key: schema.permission.key,
        name: schema.permission.name,
        description: schema.permission.description,
      })
      .from(schema.permission)
      .orderBy(asc(schema.permission.key));
  }),
});
