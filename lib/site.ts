const DEFAULT_SITE_URL = "https://dashboard.hewaneschoolofmusic.com";

export const siteConfig = {
  name: "Hewane School of Music Dashboard",
  shortName: "Hewane Dashboard",
  description:
    "Staff dashboard for Hewane School of Music — manage contacts, WhatsApp broadcast campaigns, message templates, and campaign analytics synced with Google Sheets.",
  tagline: "WhatsApp broadcast & contact management for Hewane staff",
  locale: "en_KE",
  language: "en",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? DEFAULT_SITE_URL,
  supportEmail: "support@hewane.com",
  organization: {
    name: "Hewane School of Music",
    legalName: "Hewane School of Music",
  },
  keywords: [
    "Hewane School of Music",
    "WhatsApp broadcast",
    "contact management",
    "Google Sheets sync",
    "music school dashboard",
    "Kenya",
    "campaign analytics",
  ],
  themeColor: "#1a1a2e",
  brand: {
    purple: "#7D3F7E",
    gold: "#E8B825",
    dark: "#1a1a2e",
    light: "#f8f7f4",
  },
} as const;

export function absoluteUrl(path = "/") {
  const base = siteConfig.url.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function pageTitle(segment?: string) {
  if (!segment) return siteConfig.name;
  return `${segment} | ${siteConfig.shortName}`;
}

export const defaultOpenGraph = {
  type: "website" as const,
  locale: siteConfig.locale,
  siteName: siteConfig.name,
  title: siteConfig.name,
  description: siteConfig.description,
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "Hewane School of Music — Staff Broadcast Dashboard",
    },
  ],
};

export const defaultTwitter = {
  card: "summary_large_image" as const,
  title: siteConfig.name,
  description: siteConfig.description,
  images: ["/og-image.png"],
};
