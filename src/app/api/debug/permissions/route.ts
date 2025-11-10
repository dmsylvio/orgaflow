import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPermissionsForOrg } from "@/server/iam/ability/resolver";
import { assertOrgMembership } from "@/server/iam/guards/requireMember";
import { assertOrgResolved } from "@/server/iam/guards/requireOrg";
import { resolveOrgIdFromHeaders } from "@/server/iam/org/resolveTenant";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const orgId = resolveOrgIdFromHeaders(req.headers);
  try {
    const resolved = assertOrgResolved(orgId);
    await assertOrgMembership(resolved, (session.user as any).id);

    const perms = await getUserPermissionsForOrg(
      resolved,
      (session.user as any).id,
    );
    return NextResponse.json({
      orgId: resolved,
      permissions: Array.from(perms),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "BAD_REQUEST", code: e?.code },
      { status: 400 },
    );
  }
}
