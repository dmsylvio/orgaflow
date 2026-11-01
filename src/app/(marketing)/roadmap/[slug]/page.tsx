import { Check } from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { marketingMetadata } from "@/lib/marketing-metadata";
import { ROADMAP_ITEMS, STATUS_CONFIG, type Status } from "@/lib/roadmap";

type PageProps = { params: Promise<{ slug: string }> };

const DETAILS_HEADING: Record<Status, string> = {
  shipped: "What was done",
  "in-progress": "What's being built",
  planned: "What's planned",
  considering: "What we're considering",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return ROADMAP_ITEMS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = ROADMAP_ITEMS.find((entry) => entry.slug === slug);
  if (!item) return {};

  return marketingMetadata({
    title: `${item.title}: Roadmap`,
    description: item.description,
    path: `/roadmap/${slug}`,
  });
}

export default async function RoadmapItemPage({ params }: PageProps) {
  const { slug } = await params;
  const item = ROADMAP_ITEMS.find((entry) => entry.slug === slug);
  if (!item) notFound();

  const { Icon, title, description, status, category, details } = item;
  const { version, releaseDate } = item;
  const cfg = STATUS_CONFIG[status];
  const related = ROADMAP_ITEMS.filter(
    (entry) => entry.status === status && entry.slug !== slug,
  ).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:pt-14">
      <NextLink
        href="/roadmap"
        className="text-sm font-semibold text-primary underline underline-offset-4"
      >
        Back to roadmap
      </NextLink>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-medium ${cfg.badge} ${cfg.text}`}
        >
          {cfg.label}
        </span>
        <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
          {category}
        </span>
      </div>

      <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        {description}
      </p>
      {version ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Released in{" "}
          <NextLink
            href="/changelog"
            className="font-semibold text-primary underline underline-offset-4"
          >
            version {version}
          </NextLink>{" "}
          on {releaseDate}.
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          This isn't available yet, and the details may change before release.
        </p>
      )}

      <section className="mt-10 rounded-3xl bg-muted p-6 sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight">
          {DETAILS_HEADING[status]}
        </h2>
        <ul className="mt-5 flex flex-col gap-3">
          {details.map((detail) => (
            <li key={detail} className="flex items-start gap-3 leading-relaxed">
              <Check
                aria-hidden
                className={`mt-1 h-4 w-4 shrink-0 ${
                  status === "shipped"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              {detail}
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">
            More in {cfg.label}
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {related.map((entry) => (
              <li key={entry.slug}>
                <NextLink
                  href={`/roadmap/${entry.slug}`}
                  className="block rounded-2xl border border-border bg-white px-5 py-4 font-semibold transition-colors hover:border-primary"
                >
                  {entry.title}
                </NextLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-canary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <p className="text-lg font-bold">Have feedback on this?</p>
        <Button
          asChild
          className="rounded-full bg-foreground text-background hover:bg-foreground/85"
        >
          <NextLink href="/contact">Contact us</NextLink>
        </Button>
      </section>
    </article>
  );
}
