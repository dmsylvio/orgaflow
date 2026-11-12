import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic redirects based on the presence of the session cookie only.
 * Every protected page and API still validates the session on the server.
 * (Signed-in users are sent away from /login and /register by those pages,
 * which check the real session, so a stale cookie can't cause a loop.)
 */
export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname, search } = nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (pathname.startsWith("/app") && !hasSession) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/login?next=${next}`, nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
