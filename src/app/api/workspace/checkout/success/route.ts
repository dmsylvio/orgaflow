import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { appPaths } from "@/lib/app-paths";
import { getAppBaseUrl } from "@/lib/base-url";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { organizationMembers } from "@/server/db/schemas";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/server/trpc/constants";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export async function GET(request: NextRequest) {
  const authSession = await getCurrentSession();
  const userId =
    authSession?.user && "id" in authSession.user
      ? (authSession.user as { id: string }).id
      : null;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", getAppBaseUrl()));
  }

  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.redirect(new URL(appPaths.workspace, getAppBaseUrl()));
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(new URL(appPaths.workspace, getAppBaseUrl()));
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const organizationId = checkoutSession.metadata?.organizationId?.trim();

  if (
    !organizationId ||
    checkoutSession.mode !== "subscription" ||
    checkoutSession.status !== "complete"
  ) {
    return NextResponse.redirect(new URL(appPaths.workspace, getAppBaseUrl()));
  }

  const [member] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!member) {
    return NextResponse.redirect(new URL(appPaths.workspace, getAppBaseUrl()));
  }

  const response = NextResponse.redirect(
    new URL(appPaths.home, getAppBaseUrl()),
  );
  response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
