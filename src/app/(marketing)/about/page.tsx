import {
  ArrowRight,
  Globe,
  Heart,
  Lightbulb,
  Shield,
  Target,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us — Orgaflow",
  description:
    "Learn about the team and mission behind Orgaflow — the client workflow platform built for small businesses.",
};

const VALUES = [
  {
    Icon: Target,
    title: "Simplicity first",
    description:
      "We believe powerful software shouldn't be complicated. Every feature we build is designed to reduce friction, not add it.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    Icon: Heart,
    title: "Customer obsessed",
    description:
      "Our customers are small business owners with real problems. We talk to them every week and build what actually matters.",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    Icon: Shield,
    title: "Trust & transparency",
    description:
      "No dark patterns, no hidden fees, no lock-in. We earn trust by being honest about what we are and what we're not.",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    Icon: Zap,
    title: "Move fast, ship quality",
    description:
      "We ship every week. But speed never comes at the cost of reliability — our uptime speaks for itself.",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    border: "border-amber-100",
  },
];

const TEAM = [
  {
    name: "Alex Rivera",
    role: "Co-founder & CEO",
    bio: "Former product manager at Stripe. Obsessed with making complex workflows simple.",
    avatar: "AR",
    avatarBg: "bg-blue-100 text-blue-700",
  },
  {
    name: "Priya Nair",
    role: "Co-founder & CTO",
    bio: "Ex-Shopify engineer. Built payment infrastructure at scale. Loves distributed systems.",
    avatar: "PN",
    avatarBg: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Lucas Mendes",
    role: "Head of Design",
    bio: "8 years designing SaaS products. Believes that great UX is the product's most important feature.",
    avatar: "LM",
    avatarBg: "bg-rose-100 text-rose-700",
  },
  {
    name: "Emma Fitzgerald",
    role: "Head of Customer Success",
    bio: "Helped 500+ small businesses move from spreadsheets to modern software. She's seen it all.",
    avatar: "EF",
    avatarBg: "bg-violet-100 text-violet-700",
  },
  {
    name: "David Park",
    role: "Lead Engineer",
    bio: "Full-stack developer with 10 years of experience. TypeScript evangelist and coffee addict.",
    avatar: "DP",
    avatarBg: "bg-amber-100 text-amber-700",
  },
  {
    name: "Sofia Torres",
    role: "Marketing & Growth",
    bio: "Scaled three B2B SaaS companies from 0 to 10,000 customers. Data-driven storyteller.",
    avatar: "ST",
    avatarBg: "bg-cyan-100 text-cyan-700",
  },
];

const MILESTONES = [
  {
    year: "2022",
    title: "The idea",
    description:
      "Alex and Priya spent a year interviewing small business owners. The pain was clear: too many disconnected tools.",
  },
  {
    year: "2023",
    title: "First version launched",
    description:
      "After 8 months of building, Orgaflow launched in private beta with 50 pilot customers.",
  },
  {
    year: "2024",
    title: "Public launch & growth",
    description:
      "Opened to the public. Hit 1,000 businesses in 90 days. Closed seed funding of $3.2M.",
  },
  {
    year: "2025",
    title: "Scaling up",
    description:
      "Surpassed 2,000 businesses, launched workflow automations, and expanded the team to 18 people.",
  },
];

const STATS = [
  { value: "2,000+", label: "Businesses served" },
  { value: "18", label: "Team members" },
  { value: "3", label: "Countries" },
  { value: "$12M+", label: "Invoices processed" },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative pb-20 pt-20 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute right-0 top-48 h-48 w-48 rounded-full bg-violet-200/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            About us
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            We're building for the{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              backbone of the economy
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Small and medium businesses create the majority of jobs and drive
            local economies. We believe they deserve software as good as what
            enterprises use — without the enterprise price tag or complexity.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-sm sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-background px-6 py-10 text-center">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-muted/40 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                Our story
              </p>
              <h2 className="mb-6 text-4xl font-bold text-foreground sm:text-5xl">
                Born from frustration, built with purpose
              </h2>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  In 2022, our founders Alex and Priya spent a full year
                  visiting small businesses — plumbers, designers, consultants,
                  contractors. The pattern was always the same: quotes in Google
                  Docs, invoices in Excel, payments tracked via email, tasks
                  written on sticky notes.
                </p>
                <p>
                  These businesses weren't failing for lack of talent or
                  ambition. They were failing because their tools weren't built
                  for them. Enterprise software was too complex and too
                  expensive. Generic apps didn't connect the dots.
                </p>
                <p>
                  So we built Orgaflow — a platform where every piece of the
                  client workflow connects naturally, from the first estimate to
                  the final payment. No bolt-ons. No integrations that break.
                  Just one place where your business actually runs.
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-6">
              {MILESTONES.map(({ year, title, description }, i) => (
                <div key={year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {year}
                    </div>
                    {i < MILESTONES.length - 1 && (
                      <div className="mt-2 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="pb-8">
                    <h3 className="mb-1 font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              What we stand for
            </p>
            <h2 className="text-4xl font-bold text-foreground sm:text-5xl">
              Our values
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {VALUES.map(({ Icon, title, description, iconColor, iconBg, border }) => (
              <div
                key={title}
                className={`flex gap-5 rounded-2xl border ${border} bg-background p-7 shadow-sm`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-muted/40 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              The people
            </p>
            <h2 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
              Meet the team
            </h2>
            <p className="mx-auto max-w-xl text-base text-muted-foreground">
              A small, focused team spread across three time zones — united by
              the mission to help small businesses thrive.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map(({ name, role, bio, avatar, avatarBg }) => (
              <div
                key={name}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold ${avatarBg}`}
                >
                  {avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{name}</h3>
                  <p className="text-xs font-medium text-primary">{role}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {bio}
                </p>
              </div>
            ))}
          </div>

          {/* Hiring */}
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <Users className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h3 className="mb-2 text-xl font-bold text-foreground">
              We're hiring!
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Join us in building the future of small business software. We're a
              remote-first team that values autonomy, impact, and fun.
            </p>
            <Button variant="outline" asChild>
              <NextLink href="/contact">
                View open roles
                <ArrowRight className="ml-2 h-4 w-4" />
              </NextLink>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission CTA */}
      <section className="py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-20 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            </div>
            <div className="relative">
              <Globe className="mx-auto mb-5 h-12 w-12 text-white/80" />
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                Our mission
              </h2>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/75">
                To give every small business on the planet access to a
                world-class client workflow platform — so they can focus on what
                they do best, not on juggling software.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="bg-white px-8 text-primary hover:bg-white/90"
                >
                  <NextLink href="/register">
                    Join us today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </NextLink>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="text-white/80 hover:bg-white/15 hover:text-white"
                >
                  <NextLink href="/contact">Get in touch</NextLink>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
