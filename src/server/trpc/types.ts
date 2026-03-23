import type { Session } from "next-auth";

import type { AbilityContext } from "@/server/iam";
import type { CurrentMembership } from "@/server/services/iam/get-current-ability";
import type { TRPCContext } from "@/server/trpc/context";

/**
 * NextAuth session after we verified `user.id` exists (JWT / DB session).
 */
export type AppSession = Session & {
  user: NonNullable<Session["user"]> & { id: string };
};

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
