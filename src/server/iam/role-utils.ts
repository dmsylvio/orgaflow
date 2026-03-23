import {
  groupPermissionsForDisplay,
  normalizeRolePermissions,
} from "./permission-utils";
import type { PermissionKey } from "./permissions";

export function prepareRolePermissionsForSave(
  selectedPermissions: PermissionKey[],
): PermissionKey[] {
  return normalizeRolePermissions(selectedPermissions);
}

export function getAssignablePermissionGroups() {
  return groupPermissionsForDisplay().map((entry) => ({
    ...entry,
    permissions: entry.permissions.filter((p) => !p.ownerOnly),
  }));
}
