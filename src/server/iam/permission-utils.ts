import { PERMISSION_GROUP_LABELS, sortGroupKeys } from "./permission-groups";
import {
  getPermissionDefinition,
  isPermissionKey,
  PERMISSION_DEFINITIONS,
  type PermissionDefinition,
  type PermissionKey,
} from "./permissions";

export function isOwnerOnlyPermission(permissionKey: PermissionKey): boolean {
  return getPermissionDefinition(permissionKey)?.ownerOnly === true;
}

/**
 * Expands dependencies recursively (cycles are skipped safely).
 */
export function expandPermissionDependencies(
  selectedPermissions: PermissionKey[],
): PermissionKey[] {
  const result = new Set<PermissionKey>();
  const visiting = new Set<PermissionKey>();

  function visit(key: PermissionKey) {
    if (result.has(key)) return;
    if (visiting.has(key)) return;

    visiting.add(key);
    const def = getPermissionDefinition(key);
    const deps = def?.dependencies ?? [];
    for (const dep of deps) {
      visit(dep);
    }
    visiting.delete(key);
    result.add(key);
  }

  for (const key of selectedPermissions) {
    visit(key);
  }

  return [...result];
}

export function filterAssignablePermissions(
  selectedPermissions: PermissionKey[],
): PermissionKey[] {
  return selectedPermissions.filter(
    (key) => isPermissionKey(key) && !isOwnerOnlyPermission(key),
  );
}

/**
 * Drops non-assignable keys, expands dependencies, deduplicates, and sorts.
 */
export function normalizeRolePermissions(
  selectedPermissions: PermissionKey[],
): PermissionKey[] {
  const assignable = filterAssignablePermissions(selectedPermissions);
  const expanded = expandPermissionDependencies(assignable);
  const unique = Array.from(new Set(expanded));
  unique.sort((a, b) => a.localeCompare(b));
  return unique;
}

export type PermissionGroupForDisplay = {
  groupId: string;
  groupLabel: string;
  permissions: PermissionDefinition[];
};

export function groupPermissionsForDisplay(): PermissionGroupForDisplay[] {
  const byGroup = new Map<string, PermissionDefinition[]>();
  for (const def of PERMISSION_DEFINITIONS) {
    const list = byGroup.get(def.group) ?? [];
    list.push(def);
    byGroup.set(def.group, list);
  }

  const groupIds = sortGroupKeys([...byGroup.keys()]);

  return groupIds.map((groupId) => ({
    groupId,
    groupLabel:
      PERMISSION_GROUP_LABELS[
        groupId as keyof typeof PERMISSION_GROUP_LABELS
      ] ?? groupId,
    permissions: (byGroup.get(groupId) ?? [])
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label)),
  }));
}
