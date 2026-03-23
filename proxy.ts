import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/", "/pricing"];
const AUTH_ROUTES = ["/login", "/register", "/auth/error"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const { pathname, search } = nextUrl;
  const isAuthenticated = !!req.auth;

  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);
  const isAppRoute = pathname.startsWith("/app");

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  if (!isAuthenticated && isAppRoute && !isPublicRoute) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${callbackUrl}`, nextUrl),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
