import { getAppBaseUrl } from "@/lib/base-url";

const baseUrl = getAppBaseUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How is Orgaflow different from FreshBooks or QuickBooks?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Orgaflow is built around the estimate-to-payment workflow. It combines quoting, invoicing, task management, and automations in one place — without the accounting complexity.",
          },
        },
        {
          "@type": "Question",
          name: "Can clients sign estimates electronically?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Every estimate gets a secure shareable link where clients can review and approve with one click — no account required.",
          },
        },
        {
          "@type": "Question",
          name: "What happens after the 15-day trial?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "After your trial you can choose any plan. Your data is never deleted. If you don't upgrade, your account moves to a read-only state.",
          },
        },
        {
          "@type": "Question",
          name: "Does Orgaflow support multiple currencies?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can configure your organization's default currency and set per-client currencies for international work.",
          },
        },
        {
          "@type": "Question",
          name: "Is Orgaflow good for solo freelancers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. The Starter plan is built for one-person operations, and many features scale with you as your team grows.",
          },
        },
        {
          "@type": "Question",
          name: "Can I import my existing clients and invoices?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can add clients individually or in bulk, and the platform is designed to get you running in under 5 minutes.",
          },
        },
      ],
    },
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Orgaflow",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "hello@orgaflow.io",
      },
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/#app`,
      name: "Orgaflow",
      url: baseUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "CRM, estimates, invoices, payments, tasks, and workflow automations for small businesses.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      publisher: { "@id": `${baseUrl}/#organization` },
    },
  ],
};

export function JsonLd() {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safe static content
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
