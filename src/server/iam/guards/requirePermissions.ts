// src/server/iam/guards/requirePermissions.ts
import { TRPCError } from "@trpc/server";

/**
 * Garante que o usuário possua TODAS as abilities requeridas.
 * Uso: no resolver tRPC, chame await requirePermissions(ctx, ["customer:view"])
 */
export async function requirePermissions(
  ctx: { getPermissions: () => Promise<Set<string>> },
  required: string[],
) {
  const abilities = await ctx.getPermissions();
  const lacks = required.filter((r) => !abilities.has(r));
  if (lacks.length) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Missing abilities: ${lacks.join(", ")}`,
    });
  }
}
