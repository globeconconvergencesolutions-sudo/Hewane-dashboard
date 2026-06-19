import { Analytics } from "@vercel/analytics/next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = createMetadata();

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.language}>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <JsonLd />
        {children}
        <Toaster position="top-right" richColors />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
