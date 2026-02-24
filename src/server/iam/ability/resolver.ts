// src/server/iam/ability/resolver.ts

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  type Ability,
  PERMISSIONS,
  type PermissionKey,
} from "../permissions/catalog";
import { expandPermissionKeysToAbilities } from "./expand";

/**
 * Retorna as abilities efetivas do usuário em uma organização.
 * Regras:
 * - Owner da org recebe TODAS as abilities do catálogo.
 * - Somatória de permissions via roles + overrides (allow/deny).
 */
export async function getUserAbilitiesForOrg(
  orgId: string,
  userId: string,
): Promise<Set<Ability>> {
  // 1) membership
  const membershipRows = await db
    .select({ isOwner: schema.organizationMember.isOwner })
    .from(schema.organizationMember)
    .where(
      and(
        eq(schema.organizationMember.orgId, orgId),
        eq(schema.organizationMember.userId, userId),
      ),
    )
    .limit(1);
  const membership = membershipRows[0];
  if (!membership) return new Set<Ability>();

  // 2) base: se owner => todas
  if (membership.isOwner) {
    return new Set<Ability>(PERMISSIONS.flatMap((p) => p.abilities));
  }

  // 3) permissions via roles
  const userRoles = await db
    .select({ roleId: schema.userRole.roleId })
    .from(schema.userRole)
    .where(
      and(eq(schema.userRole.orgId, orgId), eq(schema.userRole.userId, userId)),
    );
  const roleIds = userRoles.map((r) => r.roleId);

  let rolePermissionKeys: PermissionKey[] = [];
  if (roleIds.length) {
    const rolePerms = await db
      .select({ key: schema.permission.key })
      .from(schema.rolePermission)
      .innerJoin(
        schema.permission,
        eq(schema.rolePermission.permissionId, schema.permission.id),
      )
      .where(inArray(schema.rolePermission.roleId, roleIds));
    rolePermissionKeys = rolePerms.map((rp) => rp.key as PermissionKey);
  }

  // 4) overrides do usuário
  const overrides = await db
    .select({
      key: schema.permission.key,
      mode: schema.userPermissionOverride.mode,
    })
    .from(schema.userPermissionOverride)
    .innerJoin(
      schema.permission,
      eq(schema.userPermissionOverride.permissionId, schema.permission.id),
    )
    .where(
      and(
        eq(schema.userPermissionOverride.orgId, orgId),
        eq(schema.userPermissionOverride.userId, userId),
      ),
    );

  const allowKeys: PermissionKey[] = [];
  const denyKeys: PermissionKey[] = [];

  for (const ov of overrides) {
    const k = ov.key as PermissionKey;
    if (ov.mode === "allow") allowKeys.push(k);
    else denyKeys.push(k);
  }

  // 5) agrega e expande
  const effectiveKeys = new Set<PermissionKey>([
    ...rolePermissionKeys,
    ...allowKeys,
  ]);
  // aplica deny no nível de permission (remove a permission negada e suas abilities derivadas)
  for (const k of denyKeys) effectiveKeys.delete(k);

  return expandPermissionKeysToAbilities(effectiveKeys);
}
