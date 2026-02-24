import { TRPCError } from "@trpc/server";

/**
 * Guard genérico: exige orgId resolvida.
 * Retorna o orgId (string). Lança erro se ausente.
 */
export function assertOrgResolved(orgId: string | null | undefined) {
  if (!orgId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Organization not set",
    });
  }

  return orgId;
}
