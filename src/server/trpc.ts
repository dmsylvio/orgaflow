import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TRPCContext } from "./context";
import { assertOrgMembership } from "./iam/guards/requireMember";
import { assertOrgResolved } from "./iam/guards/requireOrg";
import { assertPermissions } from "./iam/guards/requirePermissions";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const procedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource.",
    });
  }
  return next();
});

export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const orgId = assertOrgResolved(ctx.orgId);
  await assertOrgMembership(orgId, (ctx.session!.user as any).id);

  return next({
    ctx: { ...ctx, orgId },
  });
});

export function requirePermissions(required: string[]) {
  return t.middleware(async ({ ctx, next }) => {
    const orgId = assertOrgResolved(ctx.orgId);
    await assertPermissions({
      orgId,
      userId: (ctx.session!.user as any).id,
      required,
    });
    return next();
  });
}
