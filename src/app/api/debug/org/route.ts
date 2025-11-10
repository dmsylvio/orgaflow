import { NextResponse } from "next/server";
import { resolveOrgIdFromHeaders } from "@/server/iam/org/resolveTenant";

export async function GET(req: Request) {
  const resolvedOrgId = resolveOrgIdFromHeaders(req.headers);
  return NextResponse.json({
    receivedHeader: req.headers.get("x-org-id"),
    resolvedOrgId,
    cookies: req.headers.get("cookie") ?? null,
  });
}
