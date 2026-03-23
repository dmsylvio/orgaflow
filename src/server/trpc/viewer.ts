import { getCurrentAbility } from "@/server/services/iam/get-current-ability";
import type { TRPCContext } from "@/server/trpc/context";
import { getSessionUserId } from "@/server/trpc/utils";

/**
 * Payload for `viewer`: session user plus optional org membership/ability.
 * Intended for use after `protectedProcedure` (guaranteed session user id).
 */
export async function buildViewerPayload(ctx: TRPCContext) {
  const userId = getSessionUserId(ctx);
  const user = ctx.session?.user ?? null;

  const organizationId = ctx.organizationId?.trim() ?? null;

  if (!organizationId) {
    return {
      user,
      organizationId: null as string | null,
      membership: null,
      ability: null,
    };
  }

  const result = await getCurrentAbility({
    db: ctx.db,
    userId,
    organizationId,
  });

  return {
    user,
    organizationId,
    membership: result.membership,
    ability: result.ability,
  };
}
