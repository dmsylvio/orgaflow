import { getAppBaseUrl } from "@/lib/base-url";
import { HOME_FAQS } from "@/lib/marketing-faq";
import { getWorkspacePlanPrice } from "@/lib/subscription-plans";

function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safe static content
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function SiteJsonLd() {
  const baseUrl = getAppBaseUrl();

  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`,
            name: "Orgaflow",
            legalName: "Orgaflow LLC",
            url: baseUrl,
            logo: `${baseUrl}/logo.svg`,
            email: "app@orgaflow.dev",
            address: {
              "@type": "PostalAddress",
              streetAddress: "1600 E 8th Ave A200",
              addressLocality: "Tampa",
              addressRegion: "FL",
              postalCode: "33605",
              addressCountry: "US",
            },
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "app@orgaflow.dev",
            },
            sameAs: [
              "https://x.com/orgaflowapp",
              "https://www.instagram.com/orgaflow.app",
            ],
          },
          {
            "@type": "WebSite",
            "@id": `${baseUrl}/#website`,
            name: "Orgaflow",
            url: baseUrl,
            publisher: { "@id": `${baseUrl}/#organization` },
          },
          {
            "@type": "SoftwareApplication",
            "@id": `${baseUrl}/#app`,
            name: "Orgaflow",
            url: baseUrl,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Estimate and invoice software for small businesses, with client approval links, payment tracking, scheduling, and task automations.",
            offers: (["starter", "growth", "scale"] as const).map((plan) => ({
              "@type": "Offer",
              name: plan[0].toUpperCase() + plan.slice(1),
              price: getWorkspacePlanPrice(plan, "monthly").toFixed(2),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            })),
            publisher: { "@id": `${baseUrl}/#organization` },
          },
        ],
      }}
    />
  );
}

export function HomeFaqJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: HOME_FAQS.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const baseUrl = getAppBaseUrl();
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [{ name: "Home", path: "/" }, ...items].map(
          ({ name, path }, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name,
            item: `${baseUrl}${path === "/" ? "" : path}`,
          }),
        ),
      }}
    />
  );
}

export function FaqJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }}
    />
  );
}
