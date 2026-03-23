import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { appPaths } from "@/lib/app-paths";
import { db } from "@/server/db";
import { organizationMembers } from "@/server/db/schemas";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/server/trpc/constants";
import { auth } from "../../../../../auth";
import { AppShell } from "./app-shell";

/**
 * `/app` root: requires session (parent layout) + active org cookie + membership.
 */
export default async function AppHomeLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId =
    session.user && "id" in session.user
      ? (session.user as { id: string }).id
      : null;
  if (!userId) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const orgId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value?.trim();
  if (!orgId) {
    redirect(appPaths.workspace);
  }

  const [member] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!member) {
    redirect(appPaths.workspace);
  }

  return <AppShell>{children}</AppShell>;
}
