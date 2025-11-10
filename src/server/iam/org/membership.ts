import { prisma } from "@/lib/prisma";

export async function isOrgOwner(orgId: string, userId: string) {
  const m = await prisma.organizationMember.findFirst({
    where: { orgId, userId },
    select: { isOwner: true },
  });
  return Boolean(m?.isOwner);
}

/**
 * Verifica se (userId) é membro da org.
 */
export async function ensureMembership(orgId: string, userId: string) {
  const member = await prisma.organizationMember.findFirst({
    where: { orgId, userId },
    select: { id: true },
  });
  return Boolean(member);
}
