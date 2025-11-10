import { ensureMembership } from "../org/membership";

/**
 * Guard genérico: exige que usuário seja membro da org (salvo Super Admin).
 */
export async function assertOrgMembership(orgId: string, userId: string) {
  const ok = await ensureMembership(orgId, userId);
  if (ok) return true;
  const err = new Error("Usuário não é membro da organização");
  // @ts-expect-error
  err.code = "ORG_FORBIDDEN";
  throw err;
}
