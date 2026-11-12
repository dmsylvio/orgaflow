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
import { signOut, useSession } from "next-auth/react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import MainLogo from "@/components/logo";
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

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

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
        "app-gradient flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-[0_4px_12px_-4px_rgba(99,102,241,0.8)]",
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
        onSelect={() => void signOut({ callbackUrl: "/" })}
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
    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 aria-selected:bg-accent aria-selected:text-accent-foreground";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command menu"
      overlayClassName="ui-fade fixed inset-0 z-[130] bg-[#070A1A]/55 backdrop-blur-sm"
      contentClassName="ui-pop fixed left-1/2 top-[14vh] z-[131] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-20px_rgba(30,27,75,0.5)]"
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
              <span className="app-gradient flex h-7 w-7 items-center justify-center rounded-lg text-white">
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
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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

  // Avoid double scroll: the shell is h-screen and <main> scrolls.
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
  const planLabel = workspace.plan ? PLAN_LABELS[workspace.plan] : null;

  const sidebarContent = (
    <>
      <div
        aria-hidden
        className="app-aurora pointer-events-none absolute inset-0"
      />

      {/* Logo */}
      <div className="relative flex h-16 shrink-0 items-center justify-between px-5">
        <NextLink href="/app" aria-label="Dashboard">
          <MainLogo className="h-auto w-[6.5rem] fill-white" />
        </NextLink>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Workspace switcher */}
      <div className="relative px-3">
        <NextLink
          href={appPaths.workspace}
          className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5 transition-colors hover:border-white/15 hover:bg-white/[0.07]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(251,146,60,0.8)]">
            {initialOf(workspace.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              {workspace.name}
            </span>
            <span className="block truncate text-[11px] text-sidebar-foreground/60">
              {planLabel ? `${planLabel} plan` : "Workspace"}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/40 transition-colors group-hover:text-white" />
        </NextLink>
      </div>

      {/* Search */}
      <div className="relative px-3 pt-3">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-left text-sm text-sidebar-foreground/50 transition-colors hover:border-white/15 hover:text-sidebar-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1">Search…</span>
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav
        aria-label="Main"
        className="relative flex flex-1 flex-col overflow-y-auto px-3 pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isPending ? (
          <div className="flex flex-col gap-1.5 px-1 py-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded-lg bg-white/[0.04]"
              />
            ))}
          </div>
        ) : null}
        {isError ? (
          <p className="px-2 text-xs text-rose-300">Could not load menu.</p>
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
                    "px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/35",
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
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-indigo-500/25 via-violet-500/15 to-transparent text-white"
                    : "text-sidebar-foreground/65 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-300 to-violet-400 shadow-[0_0_12px_rgba(165,180,252,0.9)]"
                  />
                ) : null}
                {Icon ? (
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      active
                        ? "text-indigo-300"
                        : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/80",
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
      <div className="relative shrink-0 space-y-2 p-3">
        {workspace.plan === "starter" ? (
          <NextLink
            href="/app/settings/billing"
            className="block overflow-hidden rounded-xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent p-3.5 transition-colors hover:border-indigo-300/40"
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" /> Upgrade to
              Growth
            </p>
            <p className="mt-1 text-[11px] leading-snug text-sidebar-foreground/60">
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
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
            >
              <UserAvatar name={session.user.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-white">
                  {session.user.name}
                </span>
                <span className="block truncate text-[11px] text-sidebar-foreground/50">
                  {session.user.email}
                </span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/40" />
            </button>
          </UserDropdown>
        ) : null}
      </div>
    </>
  );

  const newMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="app-gradient flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(99,102,241,0.8)] transition-all hover:shadow-[0_10px_22px_-8px_rgba(139,92,246,0.9)] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </button>
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-[#070A1A]/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Main sidebar: fixed slide-in on mobile, static on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[17rem] shrink-0 flex-col overflow-hidden bg-sidebar transition-transform duration-300 ease-out",
          "md:relative md:translate-x-0 md:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground md:hidden"
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
              className="hidden h-9 w-60 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/30 hover:text-foreground lg:flex"
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
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
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
            <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border/70 bg-card/60 md:flex">
              <div className="px-5 pb-2 pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent font-semibold text-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.15)]"
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
            <div
              aria-hidden
              className="app-grid-light pointer-events-none absolute inset-x-0 top-0 h-72"
            />
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
                            "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                            active
                              ? "app-gradient text-white"
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
              className="app-fade-in relative flex min-w-0 flex-1 flex-col"
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
