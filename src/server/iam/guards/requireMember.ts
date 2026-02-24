import { TRPCError } from "@trpc/server";
import { ensureMembership } from "../org/membership";

/**
 * Guard genérico: exige que usuário seja membro da org (salvo Super Admin).
 */
export async function assertOrgMembership(orgId: string, userId: string) {
  const ok = await ensureMembership(orgId, userId);
  if (ok) return true;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "User is not a member of the organization",
  });
}
