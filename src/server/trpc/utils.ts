import { TRPCError } from "@trpc/server";

import type { TRPCContext } from "@/server/trpc/context";

/**
 * User id for the current session. Call only after `authMiddleware` (e.g. inside `protectedProcedure`).
 */
export function getSessionUserId(ctx: Pick<TRPCContext, "session">): string {
  const session = ctx.session;
  const id =
    session?.user && "id" in session.user ? session.user.id : undefined;
  if (!id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid session.",
    });
  }
  return id;
}
