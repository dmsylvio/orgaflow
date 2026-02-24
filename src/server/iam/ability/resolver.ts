// src/server/iam/ability/resolver.ts
import { prisma } from "@/lib/prisma";
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
  const membership = await prisma.organizationMember.findUnique({
    where: { organization_member_unique: { orgId, userId } },
    select: { isOwner: true },
  });
  if (!membership) return new Set<Ability>();

  // 2) base: se owner => todas
  if (membership.isOwner) {
    return new Set<Ability>(PERMISSIONS.flatMap((p) => p.abilities));
  }

  // 3) permissions via roles
  const rolePerms = await prisma.rolePermission.findMany({
    where: { role: { UserRole: { some: { orgId, userId } } } },
    select: { permission: { select: { key: true } } },
  });
  const rolePermissionKeys = rolePerms.map(
    (rp) => rp.permission.key as PermissionKey,
  );

  // 4) overrides do usuário
  const overrides = await prisma.userPermissionOverride.findMany({
    where: { orgId, userId },
    select: { permission: { select: { key: true } }, mode: true },
  });

  const allowKeys: PermissionKey[] = [];
  const denyKeys: PermissionKey[] = [];

  for (const ov of overrides) {
    const k = ov.permission.key as PermissionKey;
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
