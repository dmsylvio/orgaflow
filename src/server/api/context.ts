import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgFromHost } from "@/lib/tenant";
import { getUserAbilitiesForOrg } from "@/server/iam/ability/resolver";

export async function createTRPCContext() {
  // getServerSession no App Router lê automaticamente do contexto do Next.js
  // Mas no tRPC fetchRequestHandler, precisamos passar explicitamente
  // A forma mais simples é usar os headers do request para cookies
  const session = await getServerSession(authOptions);

  let orgId: string | null = null;

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? process.env.ROOT_DOMAIN ?? null;
  const orgSlug = getOrgFromHost(host, rootDomain);

  if (orgSlug) {
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    orgId = org?.id ?? null;
  }

  if (!orgId && session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeOrgId: true },
    });
    orgId = user?.activeOrgId ?? null;
  }

  // se orgId resolvida, valida membership do usuário (evita leak cross-tenant)
  if (orgId && session?.user?.id) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organization_member_unique: { orgId, userId: session.user.id },
      },
      select: { id: true },
    });
    if (!membership) orgId = null;
  }

  return {
    session,
    prisma,
    orgId,
    getPermissions: async () => {
      if (!session?.user?.id || !orgId) return new Set<string>();
      return getUserAbilitiesForOrg(orgId, (session.user as any).id);
    },
  };
}
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
