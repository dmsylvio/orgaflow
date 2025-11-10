import {
  getUserPermissionsForOrg,
  hasAllPermissions,
} from "../ability/resolver";
import { isOrgOwner } from "../org/membership";

/**
 * Exige um conjunto de permissions (todas).
 * Dono da org (isOwner=true) tem bypass DENTRO dessa org.
 */
export async function assertPermissions(params: {
  orgId: string;
  userId: string;
  required: string[];
}) {
  const { orgId, userId, required } = params;

  // Dono da org: bypass
  if (await isOrgOwner(orgId, userId)) return true;

  // Caso comum: verificar permissões por roles/overrides
  const userPerms = await getUserPermissionsForOrg(orgId, userId);
  const ok = hasAllPermissions(userPerms, required);
  if (ok) return true;

  const err = new Error("Permissões insuficientes");
  // @ts-expect-error
  err.code = "PERMISSION_DENIED";
  // @ts-expect-error
  err.missing = required.filter((p) => !userPerms.has(p));
  throw err;
}
