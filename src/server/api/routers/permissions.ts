// src/server/trpc/routers/permissions.ts

import { asc } from "drizzle-orm";
import { protectedProcedure, router } from "@/server/api/trpc";
import * as schema from "@/server/db/schema";
import { PERMISSION_BY_KEY } from "@/server/iam/permissions/catalog";

export const permissionsRouter = router({
  catalog: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: schema.permission.id,
        key: schema.permission.key,
        name: schema.permission.name,
        description: schema.permission.description,
      })
      .from(schema.permission)
      .orderBy(asc(schema.permission.key));

    return rows.map((row) => ({
      ...row,
      dependsOn: PERMISSION_BY_KEY.get(row.key)?.dependsOn ?? [],
    }));
  }),
});
