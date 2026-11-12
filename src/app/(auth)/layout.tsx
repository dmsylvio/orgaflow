import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import type { ReactNode } from "react";
import MainLogo from "@/components/logo";
import { ClientApprovalCard } from "@/components/marketing/product-mockups";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

const POINTS = [
  "Estimates clients approve from a link",
  "One-click invoices and payment tracking",
  "Tasks that start themselves when a client says yes",
];

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh bg-background">
      {/* ── Brand panel ── */}
      <aside className="relative hidden min-h-dvh w-[46%] shrink-0 flex-col overflow-hidden bg-[#070A1A] text-white lg:flex">
        <div aria-hidden className="app-aurora absolute inset-0" />
        <div aria-hidden className="app-grid absolute inset-0" />

        <div className="relative flex flex-1 flex-col px-12 py-10 xl:px-16">
          <NextLink href="/" aria-label="Orgaflow home" className="w-fit">
            <MainLogo className="h-auto w-32 fill-white" />
          </NextLink>

          <div className="my-auto py-10">
            <h2 className="max-w-md text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] xl:text-5xl">
              From the first quote to the{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
                finished job
              </span>
            </h2>
            <ul className="mt-8 flex flex-col gap-3">
              {POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            {/* Product vignette */}
            <div aria-hidden className="relative mt-12 max-w-sm">
              <ClientApprovalCard className="relative z-10 rotate-[-2deg]" />
              <div className="absolute -right-16 -top-8 z-20 flex items-center gap-3 rounded-2xl border border-white/60 bg-white px-3.5 py-3 text-slate-900 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] xl:-right-24">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <CircleDollarSign className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold">
                    Payment received
                  </p>
                  <p className="text-[11px] text-slate-500">
                    INV-0142 · $860.00
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-10 z-20 flex items-center gap-3 rounded-2xl border border-white/60 bg-white px-3.5 py-3 text-slate-900 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] xl:-right-16">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold">Task created</p>
                  <p className="text-[11px] text-slate-500">Assigned to Dana</p>
                </div>
              </div>
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Free plan forever. No credit card needed.
          </p>
        </div>
      </aside>

      {/* ── Form panel ── */}
      <div className="relative flex flex-1 flex-col">
        <div
          aria-hidden
          className="app-grid-light pointer-events-none absolute inset-x-0 top-0 h-80"
        />
        <div className="relative flex items-center justify-between px-6 py-5 lg:px-10">
          <NextLink
            href="/"
            aria-label="Orgaflow home"
            className="lg:invisible"
          >
            <MainLogo className="h-auto w-28 fill-foreground" />
          </NextLink>
          <NextLink
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </NextLink>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 pb-16 pt-4">
          <main
            id="auth-main"
            aria-label="Authentication"
            className="app-fade-in w-full max-w-[420px]"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
