import type { Metadata } from "next";
import NextLink from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "About the Company and Founder",
  description:
    "Orgaflow is founder-led estimate and invoice software for small businesses, built and supported by Sylvio Lima through Orgaflow LLC in Tampa, Florida.",
  path: "/about",
});

const MILESTONES = [
  {
    when: "2025",
    title: "Started on nights and weekends",
    body: "Orgaflow began as a side project to help small businesses stay organized.",
  },
  {
    when: "November 2025",
    title: "Orgaflow LLC formed",
    body: "The side project became a long-term product.",
  },
  {
    when: "2026",
    title: "Live",
    body: "Orgaflow launched, and new releases keep improving the path from quote to payment.",
  },
];

const VALUES = [
  {
    title: "Keep it simple",
    body: "Every feature should remove a step from your day, not add one.",
  },
  {
    title: "Build from real problems",
    body: "Small business owners shape what gets built, and the feedback loop stays short.",
  },
  {
    title: "Be honest",
    body: "No dark patterns or hidden fees. The public roadmap shows what is finished and what isn't.",
  },
  {
    title: "Get the basics right",
    body: "Speed, reliability, and clear details matter more than a long feature list.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero title="Organization + flow.">
        That's where the name comes from, and it's still the goal: keep work
        moving from quote to payment, without enterprise complexity or pricing.
      </PageHero>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[3fr_2fr] lg:gap-20">
        <div>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Why Orgaflow exists
          </h2>
          <div className="mt-6 flex max-w-2xl flex-col gap-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              Orgaflow started with a personal goal: build a product I could
              own, grow, and improve for the long term. Looking at the market, I
              saw a gap for small businesses just getting started. Most tools
              were too expensive, too complex, or not connected end to end.
            </p>
            <p>
              So I started building in my free time, on nights and weekends. The
              focus was the day-to-day: staying organized, sending professional
              estimates and invoices, and keeping work moving.
            </p>
            <p>
              Orgaflow is live today, and making it fast, clear, and useful is
              still the whole job.
            </p>
          </div>
        </div>

        <ol className="self-start rounded-3xl bg-muted p-6">
          {MILESTONES.map(({ when, title, body }) => (
            <li key={title} className="pb-8 last:pb-0">
              <p className="text-sm font-semibold text-primary">{when}</p>
              <h3 className="mt-1 text-lg font-bold">{title}</h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-3 rounded-[2rem] sm:mx-5 bg-copy-pink">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Sylvio Lima
            </h2>
            <p className="mt-2 font-semibold">Founder and owner</p>
          </div>
          <p className="text-lg leading-relaxed">
            I'm a full-stack developer with more than 10 years of experience,
            from enterprise government systems to SaaS platforms and client
            websites. I build and support Orgaflow myself, so when you write in,
            you reach me.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          How we work
        </h2>
        <dl className="mt-10 grid gap-x-12 md:grid-cols-2">
          {VALUES.map(({ title, body }) => (
            <div key={title} className="border-t border-foreground/15 py-5">
              <dt className="text-lg font-bold">{title}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                {body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-3 rounded-[2rem] sm:mx-5 mb-5 bg-canary">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Try it on your next job.
          </h2>
          <div className="flex shrink-0 flex-wrap items-center gap-5">
            <Button
              size="lg"
              asChild
              className="h-12 rounded-full bg-foreground px-7 text-base text-background hover:bg-foreground/85"
            >
              <NextLink href="/register">Start free</NextLink>
            </Button>
            <NextLink
              href="/contact"
              className="font-semibold underline decoration-2 underline-offset-4"
            >
              Contact us
            </NextLink>
          </div>
        </div>
      </section>
    </>
  );
}
