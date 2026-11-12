import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";
import { COMPETITORS } from "@/lib/competitors";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "Orgaflow vs FreshBooks, QuickBooks & Jobber: Honest Comparison",
  description:
    "Compare Orgaflow with FreshBooks, QuickBooks Online, and Jobber on price, team members, estimate approval, invoicing, task boards, and automations, including where each one is the better fit.",
  path: "/compare",
});

export default function ComparePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Compare", path: "/compare" }]} />
      <PageHero
        eyebrow="Compare"
        title="Orgaflow vs. the tools you're weighing"
      >
        A side-by-side look at price, team size, and features, including the
        things other tools do that Orgaflow doesn't.
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal className="rounded-3xl border border-border bg-white p-4 sm:p-8">
          <ComparisonTable />
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          Head-to-head comparisons
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {COMPETITORS.map(({ slug, name, category, summary }, i) => (
            <Reveal as="li" key={slug} delay={i * 80}>
              <NextLink
                href={`/compare/${slug}`}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_48px_-28px_rgba(79,70,229,0.55)]"
              >
                <p className="text-sm font-semibold text-muted-foreground">
                  {category}
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">
                  Orgaflow vs {name}
                </h3>
                <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {summary}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-primary">
                  Read comparison
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </NextLink>
            </Reveal>
          ))}
        </ul>
      </section>

      <CtaBand title="See for yourself, free." />
    </>
  );
}
