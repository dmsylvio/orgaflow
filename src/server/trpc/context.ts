import { db } from "@/server/db";
import {
  ACTIVE_ORGANIZATION_COOKIE,
  ACTIVE_ORGANIZATION_HEADER,
} from "@/server/trpc/constants";
import { auth } from "../../../auth";

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

/**
 * Resolves active organization id: header wins, then cookie.
 */
export function getOrganizationIdFromHeaders(headers: Headers): string | null {
  const byHeader = headers.get(ACTIVE_ORGANIZATION_HEADER);
  if (byHeader?.trim()) {
    return byHeader.trim();
  }

  return getCookieValue(headers.get("cookie"), ACTIVE_ORGANIZATION_COOKIE);
}

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth();

  return {
    db,
    session,
    headers: opts.headers,
    organizationId: getOrganizationIdFromHeaders(opts.headers),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
