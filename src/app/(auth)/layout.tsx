import {
  BarChart3,
  CheckCircle2,
  FileText,
  Layers,
  Users,
  Zap,
} from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";

const FEATURES = [
  { Icon: Users,        text: "Full CRM — clients, history, and activity" },
  { Icon: FileText,     text: "Estimates & invoices with client approval" },
  { Icon: Zap,          text: "Workflow automations — zero manual handoffs" },
  { Icon: BarChart3,    text: "Reports & analytics on every number that matters" },
  { Icon: CheckCircle2, text: "Kanban task board linked to your documents" },
];

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">

      {/* ── Left: brand panel ── */}
      <div className="relative flex shrink-0 flex-col overflow-hidden border-r border-border bg-muted/30 lg:min-h-dvh lg:w-[52%]">
        {/* Blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/6 blur-[100px]" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-300/15 blur-3xl" />
        </div>

        <div className="relative flex flex-1 flex-col justify-between px-8 py-10 lg:px-14 lg:py-14">
          {/* Logo */}
          <NextLink href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
              <Layers className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Orgaflow
            </span>
          </NextLink>

          {/* Main content */}
          <div className="hidden lg:block">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Welcome to Orgaflow
            </p>
            <h2 className="mb-5 text-4xl font-bold leading-tight text-foreground xl:text-5xl">
              The smarter way to{" "}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                run your business
              </span>
            </h2>
            <p className="mb-10 max-w-md text-base leading-relaxed text-muted-foreground">
              From the first estimate to the final payment — Orgaflow connects every
              part of your client workflow in one unified platform.
            </p>

            <ul className="flex flex-col gap-3.5">
              {FEATURES.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer stats */}
          <div className="hidden lg:flex items-center gap-6">
            {[
              { value: "200+", label: "Businesses" },
              { value: "120k",  label: "Invoices" },
              { value: "4.9★", label: "Rating" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="text-lg font-bold text-foreground">{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="relative flex flex-1 flex-col bg-background">
        {/* Back link */}
        <div className="flex items-center justify-end px-8 py-5 lg:px-10">
          <NextLink
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Orgaflow
          </NextLink>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-4">
          <main
            id="auth-main"
            aria-label="Authentication"
            className="w-full max-w-[400px]"
          >
            {children}
          </main>
        </div>
      </div>

    </div>
  );
}
