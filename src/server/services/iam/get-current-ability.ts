import { and, eq } from "drizzle-orm";

import type { DbClient } from "@/server/db";
import { organizationMembers, rolePermissions } from "@/server/db/schemas";
import {
  type AbilityContext,
  createAbility,
  isPermissionKey,
  type PermissionKey,
} from "@/server/iam";

export type CurrentMembership = typeof organizationMembers.$inferSelect;

export type CurrentAbilityResult = {
  membership: CurrentMembership | null;
  permissions: PermissionKey[];
  ability: AbilityContext;
};

/**
 * Resolves membership, role permissions, and {@link AbilityContext} for the user in the active organization.
 */
export async function getCurrentAbility(params: {
  db: DbClient;
  userId: string;
  organizationId: string;
}): Promise<CurrentAbilityResult> {
  const [membership] = await params.db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, params.organizationId),
        eq(organizationMembers.userId, params.userId),
      ),
    )
    .limit(1);

  if (!membership) {
    return {
      membership: null,
      permissions: [],
      ability: createAbility({
        isOwner: false,
        permissions: [],
        isAuthenticated: true,
      }),
    };
  }

  if (membership.isOwner) {
    return {
      membership,
      permissions: [],
      ability: createAbility({
        isOwner: true,
        permissions: [],
        isAuthenticated: true,
      }),
    };
  }

  if (!membership.roleId) {
    return {
      membership,
      permissions: [],
      ability: createAbility({
        isOwner: false,
        permissions: [],
        isAuthenticated: true,
      }),
    };
  }

  const rows = await params.db
    .select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, membership.roleId));

  const permissionKeys = rows
    .map((r) => r.permission)
    .filter((p): p is PermissionKey => isPermissionKey(p));

  return {
    membership,
    permissions: permissionKeys,
    ability: createAbility({
      isOwner: false,
      permissions: permissionKeys,
      isAuthenticated: true,
    }),
  };
}
