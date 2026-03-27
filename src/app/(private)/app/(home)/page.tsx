import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { organizations } from "@/server/db/schemas";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/server/trpc/constants";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AppHomePage() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value?.trim();

  let orgName: string | null = null;
  if (orgId) {
    const [row] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    orgName = row?.name ?? null;
  }

  return <DashboardClient orgName={orgName} />;
}
