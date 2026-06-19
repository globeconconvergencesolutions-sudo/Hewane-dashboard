import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/sign-in"],
        disallow: [
          "/api/",
          "/contacts",
          "/broadcast",
          "/templates",
          "/analytics",
          "/settings",
          "/help",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
