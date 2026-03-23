import { Layers } from "lucide-react";
import type { ReactNode } from "react";

const TRUST_FEATURES = [
  "Multi-tenant workspaces",
  "Team collaboration",
  "Built-in invoicing",
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex shrink-0 flex-col justify-between overflow-hidden bg-sidebar px-8 py-10 lg:min-h-0 lg:w-[44%] lg:px-12 lg:py-14">
        {/* Background decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/4 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-white/4 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            Orgaflow
          </span>
        </div>

        {/* Headline */}
        <div className="relative hidden lg:block">
          <blockquote className="space-y-5">
            <p className="text-2xl font-medium leading-snug text-sidebar-foreground/90 xl:text-3xl">
              Customers, estimates, invoices, and payments — one workspace for
              your team.
            </p>
            <footer className="flex flex-col gap-3">
              <span className="text-sm text-sidebar-foreground/55">
                Everything your business needs to run smoothly
              </span>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {TRUST_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-xs text-sidebar-foreground/60">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-muted/20 px-4 py-12 lg:py-0">
        <main
          id="auth-main"
          aria-label="Authentication"
          className="w-full max-w-sm"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
