import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/base-url";
import { COMPETITORS } from "@/lib/competitors";
import { ROADMAP_ITEMS } from "@/lib/roadmap";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppBaseUrl();

  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...COMPETITORS.map(({ slug }) => ({
      url: `${baseUrl}/compare/${slug}`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/roadmap`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookie-policy`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...ROADMAP_ITEMS.map(({ slug }) => ({
      url: `${baseUrl}/roadmap/${slug}`,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
