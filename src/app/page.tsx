"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  Users,
  Zap,
} from "lucide-react";
import NextLink from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    Icon: Users,
    title: "Customer management",
    description:
      "Centralized CRM scoped per workspace. Track contacts, history, and activity.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    Icon: FileText,
    title: "Estimates & approvals",
    description:
      "Create professional estimates and get client approval via a secure public link.",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    Icon: BookOpen,
    title: "Invoicing",
    description:
      "Convert estimates to invoices in one click. PDF export included.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    Icon: Zap,
    title: "Workflow automations",
    description:
      "Trigger task creation automatically when invoice is paid or estimate is approved.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    Icon: BarChart3,
    title: "Reports",
    description:
      "Revenue, outstanding invoices, and conversion rates at a glance.",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    Icon: CheckCircle2,
    title: "Task board",
    description:
      "Lightweight Kanban to track deliverables linked to your documents.",
    color: "bg-cyan-500/10 text-cyan-600",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Orgaflow
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <NextLink href="/login">Sign in</NextLink>
            </Button>
            <Button size="sm" asChild>
              <NextLink href="/register">Get started free</NextLink>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-b from-primary/6 via-primary/2 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 py-28 text-center">
          <Badge variant="soft" className="mb-6 px-3 py-1 text-xs">
            Multi-tenant SaaS for SMBs
          </Badge>
          <h1 className="mx-auto mb-5 max-w-3xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Customers, estimates, <span className="text-primary">invoices</span>
            {" — "}one workspace
          </h1>
          <p className="mx-auto mb-9 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Orgaflow brings your entire client workflow into a single platform:
            from quote to approval, invoice to payment, task to delivery.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <NextLink href="/register">
                Start for free
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </NextLink>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <NextLink href="/login">Sign in</NextLink>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Everything your team needs
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            One platform for the complete client workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, description, color }) => (
            <Card
              key={title}
              className="transition-all duration-200 hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-14 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5 blur-3xl"
          />
          <h2 className="mb-3 text-2xl font-bold text-primary-foreground">
            Ready to streamline your workflow?
          </h2>
          <p className="mb-7 text-primary-foreground/75">
            Join businesses already managing their clients with Orgaflow.
          </p>
          <Button
            variant="secondary"
            size="lg"
            asChild
            className="relative z-10"
          >
            <NextLink href="/register">
              Create free account
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </NextLink>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary">
              <Layers className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Orgaflow
            </span>
          </div>
          <div className="flex gap-4">
            <NextLink
              href="/login"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </NextLink>
            <NextLink
              href="/register"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Register
            </NextLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
