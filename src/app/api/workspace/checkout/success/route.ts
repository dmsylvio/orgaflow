import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { appPaths } from "@/lib/app-paths";
import { db } from "@/server/db";
import { organizationMembers } from "@/server/db/schemas";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/server/trpc/constants";
import { auth } from "../../../../../../auth";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export async function GET(request: NextRequest) {
  const authSession = await auth();
  const userId =
    authSession?.user && "id" in authSession.user
      ? (authSession.user as { id: string }).id
      : null;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.redirect(new URL(appPaths.workspace, request.url));
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(new URL(appPaths.workspace, request.url));
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const organizationId = checkoutSession.metadata?.organizationId?.trim();

  if (
    !organizationId ||
    checkoutSession.mode !== "subscription" ||
    checkoutSession.status !== "complete"
  ) {
    return NextResponse.redirect(new URL(appPaths.workspace, request.url));
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
    return NextResponse.redirect(new URL(appPaths.workspace, request.url));
  }

  const response = NextResponse.redirect(new URL(appPaths.home, request.url));
  response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
