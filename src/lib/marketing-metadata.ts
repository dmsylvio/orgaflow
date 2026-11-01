import type { Metadata } from "next";

interface MarketingMetadataInput {
  /** Page title. Rendered as "<title> | Orgaflow" unless `absolute` is set. */
  title: string;
  description: string;
  path: string;
  absolute?: boolean;
}

export function marketingMetadata({
  title,
  description,
  path,
  absolute = false,
}: MarketingMetadataInput): Metadata {
  const fullTitle = absolute ? title : `${title} | Orgaflow`;

  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/twitter-image"],
    },
  };
}
