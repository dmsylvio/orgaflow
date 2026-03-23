import type { PermissionKey } from "./permissions";

export type AbilityContext = {
  isOwner: boolean;
  permissions: PermissionKey[];
  isAuthenticated?: boolean;
};

export function createAbility(input: AbilityContext): AbilityContext {
  return {
    isOwner: input.isOwner,
    permissions: Array.from(new Set(input.permissions)),
    isAuthenticated: input.isAuthenticated,
  };
}

export function can(
  ability: AbilityContext,
  permission: PermissionKey,
): boolean {
  if (ability.isOwner) return true;
  return ability.permissions.includes(permission);
}

export function canAny(
  ability: AbilityContext,
  permissions: PermissionKey[],
): boolean {
  if (ability.isOwner) return true;
  return permissions.some((p) => ability.permissions.includes(p));
}

export function canAll(
  ability: AbilityContext,
  permissions: PermissionKey[],
): boolean {
  if (ability.isOwner) return true;
  return permissions.every((p) => ability.permissions.includes(p));
}
