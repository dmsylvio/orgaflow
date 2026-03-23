import { eq } from "drizzle-orm";
import { BookOpen, FileText, TrendingUp, Users } from "lucide-react";
import { cookies } from "next/headers";
import NextLink from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { appPaths } from "@/lib/app-paths";
import { db } from "@/server/db";
import { organizations } from "@/server/db/schemas";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/server/trpc/constants";

const STAT_CARDS = [
  {
    label: "Customers",
    value: "—",
    icon: Users,
    iconColor: "bg-blue-500/10 text-blue-600",
    href: "/app/customers",
  },
  {
    label: "Open estimates",
    value: "—",
    icon: FileText,
    iconColor: "bg-violet-500/10 text-violet-600",
    href: "/app/estimates",
  },
  {
    label: "Invoices",
    value: "—",
    icon: BookOpen,
    iconColor: "bg-emerald-500/10 text-emerald-600",
    href: "/app/invoices",
  },
  {
    label: "Revenue",
    value: "—",
    icon: TrendingUp,
    iconColor: "bg-amber-500/10 text-amber-600",
    href: "/app/reports",
  },
];

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

  return (
    <div className="p-6 md:p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        {orgName ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back —{" "}
            <span className="font-medium text-foreground">{orgName}</span>
          </p>
        ) : null}
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, iconColor }) => (
          <Card
            key={label}
            className="transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
          >
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconColor}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="mb-8" />

      {/* Activity placeholder */}
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Activity timeline, recent customers, and open invoices will appear
          here.
        </p>
        <NextLink
          href={appPaths.workspace}
          className="mt-3 inline-block text-sm font-medium text-primary transition-colors hover:underline"
        >
          Switch organization
        </NextLink>
      </div>
    </div>
  );
}
