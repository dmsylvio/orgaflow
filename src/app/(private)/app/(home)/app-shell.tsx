"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  Layers,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { appPaths } from "@/lib/app-paths";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const GROUP_LABELS: Record<number, string> = {
  0: "Overview",
  1: "Customers & catalog",
  2: "Documents",
  3: "System",
};

const NAV_ICONS: Record<string, ReactNode> = {
  "/app": <LayoutDashboard className="h-4 w-4" />,
  "/app/customers": <Users className="h-4 w-4" />,
  "/app/items": <ShoppingBag className="h-4 w-4" />,
  "/app/estimates": <FileText className="h-4 w-4" />,
  "/app/invoices": <BookOpen className="h-4 w-4" />,
  "/app/reports": <BarChart3 className="h-4 w-4" />,
  "/app/settings": <Settings className="h-4 w-4" />,
};

interface AppShellProps {
  children: ReactNode;
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(`${href}/`);
}

function UserInitial({ name }: { name?: string | null }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
      {initial}
    </span>
  );
}

export function AppShell({ children }: AppShellProps) {
  const trpc = useTRPC();
  const pathname = usePathname();
  const inSettings = pathname.startsWith("/app/settings");
  const { data: session } = useSession();

  const {
    data: items,
    isPending,
    isError,
  } = useQuery(trpc.iam.navigation.queryOptions());

  const {
    data: settingsItems,
    isPending: settingsPending,
    isError: settingsError,
  } = useQuery({
    ...trpc.iam.settingsNavigation.queryOptions(),
    enabled: inSettings,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Main sidebar */}
      <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shadow-sm shadow-primary/30">
            <Layers className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Orgaflow
          </span>
        </div>

        {/* Nav */}
        <nav
          aria-label="Main"
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
        >
          {isPending ? (
            <div className="flex items-center gap-2 px-2 py-4">
              <Spinner className="size-3.5 text-sidebar-primary" />
              <span className="text-xs text-sidebar-foreground/40">
                Loading…
              </span>
            </div>
          ) : null}
          {isError ? (
            <p className="px-2 text-xs text-destructive">
              Could not load menu.
            </p>
          ) : null}

          {items?.map((item, index) => {
            const prev = items[index - 1];
            const showGroupTitle =
              !prev || prev.group !== item.group || index === 0;
            const groupTitle = GROUP_LABELS[item.group];
            const active = isNavItemActive(pathname, item.href);
            const icon = NAV_ICONS[item.href];

            return (
              <div key={item.key}>
                {showGroupTitle && groupTitle ? (
                  <p
                    className={cn(
                      "mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30",
                      index === 0 ? "mt-0" : "mt-4",
                    )}
                  >
                    {groupTitle}
                  </p>
                ) : null}
                <NextLink
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  {icon ? (
                    <span
                      className={cn(
                        "shrink-0",
                        active ? "text-sidebar-primary" : "opacity-50",
                      )}
                    >
                      {icon}
                    </span>
                  ) : null}
                  <span className="truncate">{item.label}</span>
                  {active ? (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-primary" />
                  ) : null}
                </NextLink>
              </div>
            );
          })}
        </nav>

        {/* Bottom: workspace switch + user */}
        <div className="border-t border-sidebar-border p-3 space-y-0.5">
          <NextLink
            href={appPaths.workspace}
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>Switch workspace</span>
          </NextLink>

          {session?.user ? (
            <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
              <UserInitial name={session.user.name} />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-sidebar-foreground/80">
                  {session.user.name}
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/40">
                  {session.user.email}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Settings secondary sidebar */}
      {inSettings ? (
        <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-background">
          <div className="flex h-14 items-center border-b border-border px-4">
            <span className="text-sm font-semibold text-foreground">
              Settings
            </span>
          </div>
          <nav
            aria-label="Settings sections"
            className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
          >
            {settingsPending ? (
              <div className="flex items-center gap-2 px-2 py-3">
                <Spinner className="size-4 text-primary" />
              </div>
            ) : null}
            {settingsError ? (
              <p className="px-2 text-xs text-destructive">
                Could not load settings.
              </p>
            ) : null}
            {settingsItems?.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <NextLink
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  {item.label}
                </NextLink>
              );
            })}
          </nav>
        </aside>
      ) : null}

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
