import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/base-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppBaseUrl();

  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-11-01"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date("2026-11-01"),
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
  ];
}

