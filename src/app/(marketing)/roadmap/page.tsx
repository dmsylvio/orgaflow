import type { Metadata } from "next";
import NextLink from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { marketingMetadata } from "@/lib/marketing-metadata";
import {
  COLUMNS,
  EFFORT_CONFIG,
  ROADMAP_ITEMS,
  STATUS_CONFIG,
} from "@/lib/roadmap";

export const metadata: Metadata = marketingMetadata({
  title: "Product Roadmap",
  description:
    "See what Orgaflow has shipped, what's in progress, and what's planned next for its estimate, invoice, and workflow software.",
  path: "/roadmap",
});

export default function RoadmapPage() {
  const lastUpdated = "August 5, 2026 (v1.11.0)";

  return (
    <div className="overflow-hidden">
      <PageHero
        eyebrow="Roadmap"
        title="What's shipped and what's next."
        note={`Last updated: ${lastUpdated}`}
      >
        The roadmap is public, so you can see what's being built before you rely
        on it. Priorities can change as we hear from customers.
      </PageHero>

      {/* Legend */}
      <section className="mx-auto max-w-7xl px-6 pb-6 pt-8">
        <div className="flex flex-wrap items-center justify-center gap-5">
          {COLUMNS.map(({ status, title, description }) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-sm font-medium text-foreground">
                  {title}
                </span>
                <span className="text-sm text-muted-foreground">
                  — {description}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Board */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-4 items-start lg:grid-cols-4">
          {COLUMNS.map(({ status, title }) => {
            const cfg = STATUS_CONFIG[status];
            const items = ROADMAP_ITEMS.filter((i) => i.status === status);

            return (
              <div key={status}>
                {/* Column header */}
                <div className="mb-4 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  <h2 className="font-semibold text-foreground">{title}</h2>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="roadmap-cards-container flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
                  {items.map(
                    ({
                      id,
                      slug,
                      Icon,
                      title: itemTitle,
                      description,
                      effort,
                      category,
                    }) => {
                      const effortCfg = EFFORT_CONFIG[effort];

                      return (
                        <NextLink
                          key={id}
                          href={`/roadmap/${slug}`}
                          className="block rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary"
                        >
                          {/* Top row */}
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span
                              className={`mt-0.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge} ${cfg.text}`}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <h3 className="mb-1 text-sm font-semibold text-foreground">
                            {itemTitle}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-xs leading-snug text-muted-foreground">
                            {description}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-muted px-2 py-px text-[10px] text-muted-foreground">
                              {category}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${effortCfg.color}`}
                            >
                              {effortCfg.label}
                            </span>
                          </div>
                        </NextLink>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feedback CTA */}
      <section className="border-t border-border bg-muted/40 py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            Missing something?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Our roadmap is shaped by customer feedback. If there's a feature you
            need that isn't here, we want to hear about it.
          </p>
          <Button asChild className="shadow-md shadow-primary/20">
            <NextLink href="/contact">Request a feature</NextLink>
          </Button>
        </div>
      </section>
    </div>
  );
}
