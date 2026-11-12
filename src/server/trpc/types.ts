import type { CurrentSession } from "@/server/auth/session";
import type { AbilityContext } from "@/server/iam";
import type { CurrentMembership } from "@/server/services/iam/get-current-ability";
import type { TRPCContext } from "@/server/trpc/context";

/** Better Auth session for a signed-in user (`user.id` always present). */
export type AppSession = CurrentSession;

/** After `authMiddleware` — user is guaranteed signed in with `user.id`. */
export type AuthenticatedTRPCContext = TRPCContext & {
  session: AppSession;
};

/** After `organizationMemberMiddleware` — membership and ability resolved. */
export type OrganizationMemberTRPCContext = AuthenticatedTRPCContext & {
  organizationId: string;
  membership: CurrentMembership;
  ability: AbilityContext;
};
