/**
 * Guard genérico: exige orgId resolvida.
 * Retorna o orgId (string). Lança erro se ausente.
 */
export function assertOrgResolved(orgId: string | null) {
  if (orgId) return orgId;
  const err = new Error("Organization não resolvida");
  // @ts-expect-error
  err.code = "ORG_NOT_RESOLVED";
  throw err;
}
