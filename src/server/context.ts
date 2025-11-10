import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPermissionsForOrg } from "./iam/ability/resolver";
import { resolveOrgIdFromHeaders } from "./iam/org/resolveTenant";

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await getServerSession(authOptions);
  const orgId = resolveOrgIdFromHeaders(opts.headers);

  return {
    headers: opts.headers,
    session,
    prisma,
    orgId,
    getPermissions: async () => {
      if (!session?.user?.id || !orgId) return new Set<string>();
      return getUserPermissionsForOrg(orgId, (session.user as any).id);
    },
  };
}
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
