import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/base-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/app/",
        "/api/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/invite/",
        "/invoice/",
        "/estimate/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

