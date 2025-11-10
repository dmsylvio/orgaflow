export const ORG_HEADER_NAME = "x-org-id";
const COOKIE_NAME = "current_org_id";

// parse simples de cookies a partir do header "cookie"
function readCookieFromHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";"); // "a=1; b=2"
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (!k) continue;
    if (k.trim() === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/**
 * Resolve orgId por ordem:
 * 1) header x-org-id
 * 2) cookie current_org_id
 */
export function resolveOrgIdFromHeaders(headers: Headers) {
  // 1) header
  const h = headers.get(ORG_HEADER_NAME);
  if (h && h.trim()) return h.trim();

  // 2) cookie
  const cookieHeader = headers.get("cookie");
  const c = readCookieFromHeader(cookieHeader, COOKIE_NAME);
  if (c && c.trim()) return c.trim();

  return null;
}
