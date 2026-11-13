"use client";

import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronsUpDown,
  CornerDownLeft,
  FileText,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import MainLogo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { appPaths } from "@/lib/app-paths";
import { signOutAndRedirect, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  "/app": LayoutDashboard,
  "/app/customers": Users,
  "/app/items": ShoppingBag,
  "/app/estimates": FileText,
  "/app/invoices": BookOpen,
  "/app/recurring-invoices": RefreshCw,
  "/app/tasks": ListTodo,
  "/app/schedule": CalendarDays,
  "/app/expenses": Wallet,
  "/app/payments": Receipt,
  "/app/reports": BarChart3,
  "/app/settings": Settings,
};

/** Section titles for the numeric groups defined in `server/iam/menu.ts`. */
const GROUP_LABELS: Record<number, string> = {
  0: "Workspace",
  1: "Sales & work",
  2: "Insights",
};

const CREATE_ACTIONS = [
  { href: "/app/estimates/create", label: "New estimate", Icon: FileText },
  { href: "/app/invoices/create", label: "New invoice", Icon: BookOpen },
  {
    href: "/app/recurring-invoices/create",
    label: "New recurring invoice",
    Icon: RefreshCw,
  },
];

export interface ShellWorkspace {
  name: string;
  plan: string | null;
}

interface AppShellProps {
  children: ReactNode;
  workspace: ShellWorkspace;
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(`${href}/`);
}

function initialOf(value?: string | null) {
  return value?.trim()?.[0]?.toUpperCase() ?? "?";
}

function UserAvatar({
  name,
  size = "sm",
}: {
  name?: string | null;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground",
        size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs",
      )}
    >
      {initialOf(name)}
    </span>
  );
}

function UserMenuItems() {
  return (
    <>
      <DropdownMenuItem asChild>
        <NextLink href="/app/settings/account" className="cursor-pointer">
          <Settings className="h-4 w-4" />
          Account settings
        </NextLink>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <NextLink href={appPaths.workspace} className="cursor-pointer">
          <ChevronsUpDown className="h-4 w-4" />
          Switch workspace
        </NextLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="cursor-pointer text-destructive focus:text-destructive"
        onSelect={() => void signOutAndRedirect("/")}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </DropdownMenuItem>
    </>
  );
}

function UserDropdown({
  name,
  email,
  align = "end",
  side = "bottom",
  children,
}: {
  name?: string | null;
  email?: string | null;
  align?: "start" | "end";
  side?: "top" | "bottom";
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={8}
        className="w-60"
      >
        <DropdownMenuLabel className="flex items-center gap-2.5 font-normal">
          <UserAvatar name={name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {name}
            </p>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const PAYMENT_ALERT_STATUSES = new Set(["past_due", "unpaid"]);

function PaymentAlertBanner() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.settings.getSubscriptionStatus.queryOptions());
  if (!data?.status || !PAYMENT_ALERT_STATUSES.has(data.status)) return null;

  const isPastDue = data.status === "past_due";

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/20 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
      </span>
      <p className="flex-1 text-sm text-amber-900">
        {isPastDue
          ? "Your last payment failed. Update your payment method to keep access."
          : "Your subscription is unpaid. Please update your payment method."}
      </p>
      <NextLink
        href="/app/settings/billing"
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
      >
        Fix payment
      </NextLink>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Command palette (⌘K)                                                 */
/* ------------------------------------------------------------------ */

type NavEntry = { key: string; href: string; label: string };

function CommandPalette({
  open,
  onOpenChange,
  navItems,
  settingsItems,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavEntry[];
  settingsItems: NavEntry[];
}) {
  const router = useRouter();

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const itemClass =
    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 aria-selected:bg-accent aria-selected:text-accent-foreground";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command menu"
      overlayClassName="ui-fade fixed inset-0 z-[130] bg-black/40"
      contentClassName="ui-pop fixed left-1/2 top-[14vh] z-[131] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Command.Input
          autoFocus
          placeholder="Search pages and actions…"
          className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          ESC
        </kbd>
      </div>
      <Command.List className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">
          No results.
        </Command.Empty>

        <Command.Group
          heading="Create"
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          {CREATE_ACTIONS.map(({ href, label, Icon }) => (
            <Command.Item
              key={href}
              value={label}
              onSelect={() => go(href)}
              className={itemClass}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group
          heading="Go to"
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item.href] ?? ArrowUpRight;
            return (
              <Command.Item
                key={item.key}
                value={`go ${item.label}`}
                onSelect={() => go(item.href)}
                className={itemClass}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
              </Command.Item>
            );
          })}
        </Command.Group>

        {settingsItems.length > 0 ? (
          <Command.Group
            heading="Settings"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            {settingsItems.map((item) => (
              <Command.Item
                key={item.key}
                value={`settings ${item.label}`}
                onSelect={() => go(item.href)}
                className={itemClass}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Settings className="h-3.5 w-3.5" />
                </span>
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
      <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CornerDownLeft className="h-3 w-3" /> to open
        </span>
        <span>
          <kbd className="font-semibold">↑↓</kbd> to navigate
        </span>
      </div>
    </Command.Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export function AppShell({ children, workspace }: AppShellProps) {
  const trpc = useTRPC();
  const pathname = usePathname();
  const inSettings = pathname.startsWith("/app/settings");
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Close the mobile sidebar on navigation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is an intentional trigger
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Avoid double scroll: the shell is h-dvh (visible viewport, so mobile
  // browser bars never hide the bottom of the page) and <main> scrolls.
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // ⌘K / Ctrl+K opens the command palette.
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setPaletteOpen((open) => !open);
    }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

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
    enabled: inSettings || paletteOpen,
  });

  const activeItem = items?.find((item) =>
    isNavItemActive(pathname, item.href),
  );
  const activeSetting = settingsItems?.find((item) =>
    isNavItemActive(pathname, item.href),
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <NextLink href="/app" aria-label="Dashboard">
          <MainLogo className="h-auto w-[6.25rem] fill-foreground" />
        </NextLink>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav
        aria-label="Main"
        className="flex flex-1 flex-col overflow-y-auto px-3 pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isPending ? (
          <div className="flex flex-col gap-1.5 px-1 py-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="app-shimmer h-8 rounded-md" />
            ))}
          </div>
        ) : null}
        {isError ? (
          <p className="px-2 text-xs text-destructive">Could not load menu.</p>
        ) : null}

        {items?.map((item, index) => {
          const prev = items[index - 1];
          const startsNewGroup = !prev || prev.group !== item.group;
          const groupLabel = GROUP_LABELS[item.group];
          const active = isNavItemActive(pathname, item.href);
          const Icon = NAV_ICONS[item.href];

          return (
            <div key={item.key}>
              {startsNewGroup ? (
                <p
                  className={cn(
                    "px-3 pb-1 text-[11px] font-medium text-muted-foreground/80",
                    prev ? "pt-5" : "pt-3",
                    !groupLabel && "sr-only",
                  )}
                >
                  {groupLabel ?? "More"}
                </p>
              ) : null}
              <NextLink
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                ) : null}
                <span className="truncate">{item.label}</span>
              </NextLink>
            </div>
          );
        })}
      </nav>

      {/* Bottom: plan + user */}
      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        {workspace.plan === "starter" ? (
          <NextLink
            href="/app/settings/billing"
            className="block rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:bg-muted"
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Upgrade to
              Growth
            </p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              Unlimited documents, task board, and your branding.
            </p>
          </NextLink>
        ) : null}

        {session?.user ? (
          <UserDropdown
            name={session.user.name}
            email={session.user.email}
            side="top"
            align="start"
          >
            <button
              type="button"
              aria-label="User menu"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
            >
              <UserAvatar name={session.user.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {session.user.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {session.user.email}
                </span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </UserDropdown>
        ) : null}
      </div>
    </>
  );

  const newMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Create
        </DropdownMenuLabel>
        {CREATE_ACTIONS.map(({ href, label, Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <NextLink href={href} className="cursor-pointer">
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </NextLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Main sidebar: fixed slide-in on mobile, static on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out",
          "md:relative md:translate-x-0 md:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-2 text-sm"
          >
            <span className="hidden truncate text-muted-foreground sm:inline">
              {workspace.name}
            </span>
            {activeItem ? (
              <>
                <span aria-hidden className="hidden text-border sm:inline">
                  /
                </span>
                <NextLink
                  href={activeItem.href}
                  className="truncate font-semibold text-foreground"
                >
                  {activeItem.label}
                </NextLink>
              </>
            ) : null}
            {inSettings && activeSetting ? (
              <>
                <span aria-hidden className="text-border">
                  /
                </span>
                <span className="truncate text-muted-foreground">
                  {activeSetting.label}
                </span>
              </>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 w-60 items-center gap-2 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search or jump to…</span>
              <kbd className="rounded border border-border bg-muted px-1.5 text-[10px] font-semibold">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              aria-label="Search"
              onClick={() => setPaletteOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            {newMenu}
            {session?.user ? (
              <UserDropdown name={session.user.name} email={session.user.email}>
                <button
                  type="button"
                  aria-label="User menu"
                  className="rounded-full ring-2 ring-transparent transition hover:ring-primary/20"
                >
                  <UserAvatar name={session.user.name} size="md" />
                </button>
              </UserDropdown>
            ) : null}
          </div>
        </header>

        <div className="flex min-w-0 flex-1 overflow-hidden">
          {/* Settings sidebar (desktop) */}
          {inSettings ? (
            <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
              <div className="px-5 pb-2 pt-6">
                <p className="text-sm font-semibold text-foreground">
                  Settings
                </p>
              </div>
              <nav
                aria-label="Settings sections"
                className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </NextLink>
                  );
                })}
              </nav>
            </aside>
          ) : null}

          <main className="relative flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <PaymentAlertBanner />

            {/* Settings nav (mobile) */}
            {inSettings ? (
              <div className="relative shrink-0 border-b border-border md:hidden">
                {settingsPending ? (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <Spinner className="size-3.5 text-primary" />
                  </div>
                ) : null}
                {settingsItems && settingsItems.length > 0 ? (
                  <nav
                    aria-label="Settings sections"
                    className="flex gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {settingsItems.map((item) => {
                      const active = isNavItemActive(pathname, item.href);
                      return (
                        <NextLink
                          key={item.key}
                          href={item.href}
                          className={cn(
                            "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {item.label}
                        </NextLink>
                      );
                    })}
                  </nav>
                ) : null}
              </div>
            ) : null}

            <div
              key={pathname}
              className="app-fade-in relative flex min-w-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]"
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        navItems={items ?? []}
        settingsItems={settingsItems ?? []}
      />
    </div>
  );
}
