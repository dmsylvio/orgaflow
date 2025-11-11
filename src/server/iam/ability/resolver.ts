// src/server/iam/ability/resolver.ts
import { prisma } from "@/lib/prisma";
import {
  expandAsOwner,
  resolveEffectiveAbilities,
} from "@/server/iam/ability/expand";
import type { AbilityKey, AnyAbility } from "@/server/iam/permissions/catalog";

/**
 * Retorna o conjunto de permissões efetivas do usuário NA org.
 * - Se não for membro: Set vazio
 * - Se isOwner: todas as abilities (owner bypass)
 * - Caso contrário: roles + overrides (allow/deny)
 */
export async function getUserPermissionsForOrg(
  orgId: string,
  userId: string,
): Promise<Set<AbilityKey>> {
  // 1) Checa membership
  const membership = await prisma.organizationMember.findUnique({
    where: { organization_member_unique: { orgId, userId } },
    select: { isOwner: true },
  });

  if (!membership) return new Set<AbilityKey>();
  if (membership.isOwner) return expandAsOwner();

  // 2) Coleta roles do usuário nessa org
  const roles = await prisma.userRole.findMany({
    where: { orgId, userId },
    select: { roleId: true },
  });
  const roleIds = roles.map((r) => r.roleId);

  // 3) Coleta permissions associadas às roles
  const rolePerms = roleIds.length
    ? await prisma.rolePermission.findMany({
        where: { roleId: { in: roleIds } },
        select: { permission: { select: { key: true } } },
      })
    : [];

  // Importante: nosso catálogo/DB usa chaves CONCRETAS (sem wildcards).
  // Tipamos como AnyAbility porque o resolvedor aceita ambos.
  const rolesAbilities: AnyAbility[] = rolePerms.map(
    (rp) => rp.permission.key as AbilityKey,
  );

  // 4) Overrides do usuário (allow/deny) nessa org
  const overrides = await prisma.userPermissionOverride.findMany({
    where: { orgId, userId },
    select: { mode: true, permission: { select: { key: true } } },
  });

  const allow: AnyAbility[] = [];
  const deny: AnyAbility[] = [];

  for (const o of overrides) {
    const key = o.permission.key as AbilityKey;
    if (o.mode === "allow") allow.push(key);
    else deny.push(key);
  }

  // 5) Resolve (roles + allow) - deny
  const effective = resolveEffectiveAbilities(rolesAbilities, allow, deny, {
    ownerBypass: false,
  });

  return effective;
}

/** Helper: checa se usuário possui TODAS as permissões requeridas */
export async function hasAllPermissions(
  orgId: string,
  userId: string,
  required: AbilityKey[],
): Promise<boolean> {
  const set = await getUserPermissionsForOrg(orgId, userId);
  return required.every((p) => set.has(p));
}

/** Helper: checa se usuário possui QUALQUER uma das permissões requeridas */
export async function hasAnyPermission(
  orgId: string,
  userId: string,
  required: AbilityKey[],
): Promise<boolean> {
  const set = await getUserPermissionsForOrg(orgId, userId);
  return required.some((p) => set.has(p));
}
