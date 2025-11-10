import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "../permissions/catalog";
import { applyOverrides, expandPermissions } from "./expand";

/**
 * Coleta permissions do usuário em uma org via roles + overrides, com expansão.
 */
export async function getUserPermissionsForOrg(orgId: string, userId: string) {
  // Via roles
  const roles = await prisma.userRole.findMany({
    where: { orgId, userId },
    select: {
      role: {
        select: {
          RolePermission: {
            select: {
              permission: { select: { key: true } },
            },
          },
        },
      },
    },
  });

  const keys = new Set<PermissionKey>();
  for (const r of roles) {
    for (const rp of r.role.RolePermission) {
      keys.add(rp.permission.key as PermissionKey);
    }
  }

  // Overrides
  const overrides = await prisma.userPermissionOverride.findMany({
    where: { orgId, userId },
    select: {
      mode: true, // "allow" | "deny"
      permission: { select: { key: true } },
    },
  });

  // Expande + aplica overrides + re-expande
  const expanded = expandPermissions(keys);
  const withOverrides = applyOverrides(
    expanded,
    overrides.map((o) => ({
      key: o.permission.key as PermissionKey,
      mode: o.mode,
    })),
  );

  return withOverrides; // Set<PermissionKey>
}

export function hasAllPermissions(userPerms: Set<string>, required: string[]) {
  return required.every((r) => userPerms.has(r));
}

export function hasAnyPermission(userPerms: Set<string>, candidates: string[]) {
  return candidates.some((r) => userPerms.has(r));
}
