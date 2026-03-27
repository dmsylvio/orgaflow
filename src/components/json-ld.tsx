import { getAppBaseUrl } from "@/lib/base-url";

const baseUrl = getAppBaseUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
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
