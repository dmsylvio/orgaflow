import { prisma } from "@/lib/prisma";

export async function canInviteToOrg(
  userId: string,
  orgId: string,
  getPermissions: () => Promise<Set<string>>,
) {
  // owner bypass
  const membership = await prisma.organizationMember.findUnique({
    where: { organization_member_unique: { orgId, userId } },
    select: { isOwner: true },
  });
  if (!membership) return false;
  if (membership.isOwner) return true;

  const perms = await getPermissions();
  // ajuste a chave conforme seu catálogo
  return perms.has("member:invite");
}
