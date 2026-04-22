import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { isWorkspaceAccessible } from "@/lib/subscription-plans";
import { can, type PermissionKey } from "@/server/iam";
import {
  getOrganizationPlan,
  planAtLeast,
  type SubscriptionPlan,
} from "@/server/services/billing/get-organization-plan";
import { syncOrganizationSubscriptionStatus } from "@/server/services/billing/sync-organization-subscription";
import { getCurrentAbility } from "@/server/services/iam/get-current-ability";
import type { TRPCContext } from "@/server/trpc/context";
import type {
  AppSession,
  OrganizationMemberTRPCContext,
} from "@/server/trpc/types";

export {
  ACTIVE_ORGANIZATION_COOKIE,
  ACTIVE_ORGANIZATION_HEADER,
} from "@/server/trpc/constants";
export { createTRPCContext, type TRPCContext } from "@/server/trpc/context";
export type {
  AppSession,
  AuthenticatedTRPCContext,
  OrganizationMemberTRPCContext,
} from "@/server/trpc/types";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const zodError = error.cause instanceof ZodError ? error.cause : null;

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError,
      },
    };
  },
});

const timingMiddleware = t.middleware(async ({ next, path, type }) => {
  const start = Date.now();

  if (process.env.NODE_ENV === "development") {
    console.log(`[tRPC] ${type} ${path} → start`);
  }

  const result = await next();

  if (process.env.NODE_ENV === "development") {
    console.log(`[tRPC] ${type} ${path} → done (${Date.now() - start}ms)`);
  }

  return result;
});

const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const session = ctx.session;
  const userId =
    session?.user && "id" in session.user ? session.user.id : undefined;

  if (!userId || !session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: session as AppSession,
    },
  });
});

const organizationMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.organizationId?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization was provided.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      organizationId: ctx.organizationId.trim(),
    },
  });
});

const organizationMemberMiddleware = t.middleware(async ({ ctx, next }) => {
  const session = ctx.session;
  const userId =
    session?.user && "id" in session.user ? session.user.id : undefined;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in.",
    });
  }

  const organizationId = ctx.organizationId;
  if (!organizationId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization was provided.",
    });
  }

  const result = await getCurrentAbility({
    db: ctx.db,
    userId,
    organizationId,
  });

  if (!result.membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization.",
    });
  }

  const sub = await syncOrganizationSubscriptionStatus(ctx.db, organizationId);
  if (!isWorkspaceAccessible(sub?.status ?? "active")) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Billing must be completed before this organization can be used.",
    });
  }

  const nextCtx: OrganizationMemberTRPCContext = {
    ...ctx,
    session: session as AppSession,
    organizationId,
    membership: result.membership,
    ability: result.ability,
  };

  return next({ ctx: nextCtx });
});

const ownerOnlyMiddleware = t.middleware(({ ctx, next }) => {
  const { ability } = ctx as OrganizationMemberTRPCContext;
  if (!ability.isOwner) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the organization owner can perform this action.",
    });
  }
  return next();
});

/**
 * Chain after {@link ownerProcedure} or {@link organizationProcedure} to require a minimum plan.
 */
export function requirePlan(minPlan: SubscriptionPlan) {
  return t.middleware(async ({ ctx, next }) => {
    const { db, organizationId } = ctx as OrganizationMemberTRPCContext;
    const plan = await getOrganizationPlan(db, organizationId);
    if (!planAtLeast(plan, minPlan)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature requires the ${minPlan} plan or higher.`,
      });
    }
    return next();
  });
}

/**
 * Chain after {@link organizationProcedure} to require a specific permission (owner bypasses).
 */
export function requirePermission(permission: PermissionKey) {
  return t.middleware(({ ctx, next }) => {
    const { ability } = ctx as OrganizationMemberTRPCContext;
    if (!can(ability, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      });
    }
    return next();
  });
}

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware);

/**
 * Signed-in user + active organization (header or cookie) + verified membership + `ability`.
 */
export const organizationProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware)
  .use(organizationMiddleware)
  .use(organizationMemberMiddleware);

/** Same as {@link organizationProcedure}, restricted to organization owner. */
export const ownerProcedure = organizationProcedure.use(ownerOnlyMiddleware);

/** Low-level instance for advanced middleware or testing. */
export const trpcInstance = t;
