"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  Layers,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Receipt,
  RefreshCw,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { type ReactNode, useEffect, useState } from "react";
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
import MainLogo from "@/components/logo";

const NAV_ICONS: Record<string, ReactNode> = {
  "/app": <LayoutDashboard className="h-4 w-4" />,
  "/app/customers": <Users className="h-4 w-4" />,
  "/app/items": <ShoppingBag className="h-4 w-4" />,
  "/app/estimates": <FileText className="h-4 w-4" />,
  "/app/invoices": <BookOpen className="h-4 w-4" />,
  "/app/recurring-invoices": <RefreshCw className="h-4 w-4" />,
  "/app/tasks": <ListTodo className="h-4 w-4" />,
  "/app/expenses": <Wallet className="h-4 w-4" />,
  "/app/payments": <Receipt className="h-4 w-4" />,
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

function UserAvatar({ name }: { name?: string | null }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
      {initial}
    </span>
  );
}

interface UserDropdownProps {
  name?: string | null;
  email?: string | null;
  /** Variante visual: sidebar (fundo sidebar) ou header (fundo background) */
  variant?: "sidebar" | "header";
}

function UserDropdown({ name, email, variant = "sidebar" }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menu do usuário"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
            variant === "sidebar"
              ? "hover:bg-sidebar-accent/60"
              : "hover:bg-accent/60",
          )}
        >
          <UserAvatar name={name} />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate text-xs font-medium",
                variant === "sidebar"
                  ? "text-sidebar-foreground/80"
                  : "text-foreground/80",
              )}
            >
              {name}
            </p>
            <p
              className={cn(
                "truncate text-[10px]",
                variant === "sidebar"
                  ? "text-sidebar-foreground/40"
                  : "text-muted-foreground",
              )}
            >
              {email}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={6}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold leading-none">{name}</p>
          <p className="mt-1 text-xs leading-none text-muted-foreground">
            {email}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <NextLink href="/app/settings/account" className="cursor-pointer">
            <Settings className="h-4 w-4" />
            Account Settings
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const PAYMENT_ALERT_STATUSES = new Set(["past_due", "unpaid"]);

function PaymentAlertBanner() {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.settings.getSubscriptionStatus.queryOptions(),
  );
  if (!data?.status || !PAYMENT_ALERT_STATUSES.has(data.status)) return null;

  const isPastDue = data.status === "past_due";

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-50 px-4 py-2.5 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
      <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">
        {isPastDue
          ? "Your last payment failed. Update your payment method to keep access."
          : "Your subscription is unpaid. Please update your payment method."}
      </p>
      <NextLink
        href="/app/settings/billing"
        className="shrink-0 rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Fix payment
      </NextLink>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const trpc = useTRPC();
  const pathname = usePathname();
  const inSettings = pathname.startsWith("/app/settings");
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fecha sidebar ao navegar
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname é usado como trigger intencional
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Impede scroll do body quando o drawer mobile está aberto
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2.5">
          <MainLogo className="w-24 h-auto fill-white"/>
        </div>
        {/* Botão fechar — visível apenas no mobile */}
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
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
          <p className="px-2 text-xs text-destructive">Could not load menu.</p>
        ) : null}

        {items?.map((item, index) => {
          const prev = items[index - 1];
          const startsNewGroup = Boolean(prev && prev.group !== item.group);
          const active = isNavItemActive(pathname, item.href);
          const icon = NAV_ICONS[item.href];

          return (
            <div
              key={item.key}
              className={startsNewGroup ? "mt-6" : undefined}
            >
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
      <div className="shrink-0 space-y-0.5 border-t border-sidebar-border p-3">
        <NextLink
          href={appPaths.workspace}
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span>Switch workspace</span>
        </NextLink>

        {session?.user ? (
          <UserDropdown
            name={session.user.name}
            email={session.user.email}
            variant="sidebar"
          />
        ) : null}
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* ── BACKDROP MOBILE ── */}
      {sidebarOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* ── SIDEBAR PRINCIPAL ──
          Mobile: posição fixed, slide-in da esquerda controlado por sidebarOpen
          Desktop: estático, sempre visível */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-sidebar transition-transform duration-300 ease-in-out",
          "md:relative md:translate-x-0 md:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── COLUNA DIREITA (header mobile + settings sidebar + conteúdo) ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header mobile — visível apenas abaixo de md */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4 md:hidden">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo centralizado no mobile */}
          <div className="flex items-center gap-2">
            <MainLogo className="w-24 h-auto fill-white"/>
          </div>

          {/* Avatar do usuário no canto direito do header mobile */}
          {session?.user ? (
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Menu do usuário"
                    className="rounded-full"
                  >
                    <UserAvatar name={session.user.name} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="w-56"
                >
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-semibold leading-none">
                      {session.user.name}
                    </p>
                    <p className="mt-1 text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NextLink
                      href="/app/settings/account"
                      className="cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      Account Settings
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </header>

        {/* Área de conteúdo com settings sidebar opcional */}
        <div className="flex min-w-0 flex-1 overflow-hidden">
          {/* ── SETTINGS SIDEBAR — desktop apenas ── */}
          {inSettings ? (
            <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-background md:flex">
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

          {/* ── CONTEÚDO PRINCIPAL ── */}
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <PaymentAlertBanner />

            {/* ── SETTINGS NAV MOBILE — abas horizontais com scroll ── */}
            {inSettings ? (
              <div className="shrink-0 border-b border-border md:hidden">
                {settingsPending ? (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <Spinner className="size-3.5 text-primary" />
                  </div>
                ) : null}
                {settingsItems && settingsItems.length > 0 ? (
                  <nav
                    aria-label="Settings sections"
                    className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {settingsItems.map((item) => {
                      const active = isNavItemActive(pathname, item.href);
                      return (
                        <NextLink
                          key={item.key}
                          href={item.href}
                          className={cn(
                            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
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

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
