import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAbilitiesForOrg } from "./iam/ability/resolver";

export async function createTRPCContext() {
  // getServerSession no App Router lê automaticamente do contexto do Next.js
  // Mas no tRPC fetchRequestHandler, precisamos passar explicitamente
  // A forma mais simples é usar os headers do request para cookies
  const session = await getServerSession(authOptions);

  let orgId: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeOrgId: true },
    });
    orgId = user?.activeOrgId ?? null;
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
