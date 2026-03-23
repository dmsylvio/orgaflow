import { and, eq } from "drizzle-orm";
import type { DbClient } from "@/server/db";
import { organizationFeatures } from "@/server/db/schemas";
import { appMenu, filterMenuByAbility, settingsMenu } from "@/server/iam";
import { createTRPCRouter, organizationProcedure } from "@/server/trpc/init";

async function getEnabledFeatures(
  db: DbClient,
  organizationId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ featureKey: organizationFeatures.featureKey })
    .from(organizationFeatures)
    .where(
      and(
        eq(organizationFeatures.organizationId, organizationId),
        eq(organizationFeatures.enabled, true),
      ),
    );

  return new Set(rows.map((r) => r.featureKey as string));
}

export const iamRouter = createTRPCRouter({
  /** Main app menu (`/app/*`) filtered by ability and enabled features. */
  navigation: organizationProcedure.query(async ({ ctx }) => {
    const enabledFeatures = await getEnabledFeatures(ctx.db, ctx.organizationId);
    return filterMenuByAbility({
      items: appMenu,
      ability: ctx.ability,
      isAuthenticated: true,
      enabledFeatures,
    });
  }),

  /** Settings sidebar (`/app/settings/*`): flat list, no numeric `group`. */
  settingsNavigation: organizationProcedure.query(async ({ ctx }) => {
    const enabledFeatures = await getEnabledFeatures(ctx.db, ctx.organizationId);
    return filterMenuByAbility({
      items: settingsMenu,
      ability: ctx.ability,
      isAuthenticated: true,
      enabledFeatures,
    });
  }),

  /** UI summary: ability + membership flags (no sensitive data). */
  session: organizationProcedure.query(({ ctx }) => {
    return {
      isOwner: ctx.membership.isOwner,
      roleId: ctx.membership.roleId,
      ability: {
        isOwner: ctx.ability.isOwner,
        permissions: ctx.ability.permissions,
      },
    };
  }),
});
