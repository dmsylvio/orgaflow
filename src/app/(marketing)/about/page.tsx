import { ArrowRight, Globe, Heart, Shield, Target, Zap } from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind Orgaflow LLC - a founder-led client workflow platform built for small businesses.",
  keywords: [
    "about Orgaflow",
    "small business software",
    "invoicing company",
    "workflow automation startup",
    "client management platform",
  ],
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About - Orgaflow",
    description:
      "The story behind Orgaflow LLC - a founder-led client workflow platform built for small businesses.",
    url: "/about",
    type: "website",
  },
  twitter: {
    title: "About - Orgaflow",
    description:
      "The story behind Orgaflow LLC - a founder-led client workflow platform built for small businesses.",
  },
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
      "We build for small business owners with real day-to-day problems. We listen, iterate, and focus on what actually matters.",
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
    title: "Craft & quality",
    description:
      "We care about the fundamentals: performance, reliability, and details that make the product feel effortless.",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    border: "border-amber-100",
  },
];

const TEAM = [
  {
    name: "Sylvio Lima",
    role: "Founder & Owner",
    bio: "I'm a full-stack developer with 10+ years of experience building web products - from enterprise government systems to SaaS platforms and client-facing websites. I specialize in TypeScript, React/Next.js, Node.js, and PostgreSQL, and I take pride in shipping things that actually work in production.",
    avatar: "SL",
    avatarBg: "bg-primary/10 text-primary",
  },
];

const MILESTONES = [
  {
    year: "2025",
    title: "Nights and weekends",
    description:
      "Orgaflow starts as a side project, built after work with a focus on helping small businesses stay organized.",
  },
  {
    year: "Nov25",
    title: "Orgaflow LLC",
    description:
      "In November 2025, Orgaflow LLC is formed and the project becomes a long-term product with a clear mission.",
  },
  {
    year: "2026",
    title: "Live",
    description:
      "Orgaflow goes live and keeps improving the core quote-to-payment experience.",
  },
  {
    year: "Now",
    title: "Keep improving",
    description:
      "Polishing onboarding, reliability, and the details that make Orgaflow feel effortless day to day.",
  },
];

const STATS = [
  { value: "Live", label: "Stage" },
  { value: "Nov 2025", label: "Orgaflow LLC" },
  { value: "1", label: "Team member" },
  { value: "10+ yrs", label: "Founder experience" },
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
            About Orgaflow
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Orgaflow means{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              Organization + Flow
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Orgaflow is a founder-led client workflow platform built for small
            businesses. The goal is simple: keep work moving from quote to
            payment, without enterprise complexity or pricing.
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
                Built for independence, built for small businesses
              </h2>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Orgaflow started with a personal goal: build a product I could
                  own, grow, and improve long-term - without selling my time to
                  other people. As I looked at the market, I saw a huge gap for
                  small businesses that are just getting started: most tools
                  were either too expensive, too complex, or not connected end
                  to end.
                </p>
                <p>
                  I began building Orgaflow in my free time - nights after work
                  and weekends - always looking for ways to make the day-to-day
                  simpler: staying organized, sending professional estimates and
                  invoices, and keeping work moving from quote to payment.
                </p>
                <p>
                  The name is short for Organization + Flow. Today, Orgaflow LLC
                  is live, and I'm focused on making the core experience fast,
                  clear, and genuinely useful for small businesses.
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
            {VALUES.map(
              ({ Icon, title, description, iconColor, iconBg, border }) => (
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
                    <h3 className="mb-2 font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-muted/40 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              The founder
            </p>
            <h2 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
              Meet the founder
            </h2>
            <p className="mx-auto max-w-xl text-base text-muted-foreground">
              Orgaflow is currently built and supported by one person. That
              keeps the feedback loop short and the product focused.
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

          {/* Live */}
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <Zap className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h3 className="mb-2 text-xl font-bold text-foreground">
              We're live
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Orgaflow is live. If you'd like help getting started or want to
              share feedback, we'd love to hear from you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" asChild>
                <NextLink href="/register">
                  Create an account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </NextLink>
              </Button>
              <Button variant="ghost" asChild>
                <NextLink href="/contact">Get in touch</NextLink>
              </Button>
            </div>
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
                To make high-quality, easy-to-use workflow software accessible
                to every small business - especially the ones just getting
                started.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="bg-white px-8 text-primary hover:bg-white/90"
                >
                  <NextLink href="/register">
                    Get started
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
