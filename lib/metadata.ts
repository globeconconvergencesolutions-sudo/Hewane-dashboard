import type { Metadata } from "next";
import {
  absoluteUrl,
  defaultOpenGraph,
  defaultTwitter,
  pageTitle,
  siteConfig,
} from "@/lib/site";

type CreateMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function createMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
}: CreateMetadataOptions = {}): Metadata {
  const resolvedTitle = title ? pageTitle(title) : siteConfig.name;
  const url = absoluteUrl(path);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.shortName}`,
    },
    description,
    applicationName: siteConfig.shortName,
    authors: [{ name: siteConfig.organization.name }],
    creator: siteConfig.organization.name,
    publisher: siteConfig.organization.name,
    keywords: [...siteConfig.keywords],
    category: "business",
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    alternates: { canonical: url },
    openGraph: {
      ...defaultOpenGraph,
      title: resolvedTitle,
      description,
      url,
    },
    twitter: {
      ...defaultTwitter,
      title: resolvedTitle,
      description,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}
