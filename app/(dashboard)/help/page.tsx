import { HelpGuide } from "@/components/dashboard/help-guide";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Help & Guide",
  description:
    "Staff guide for Hewane Dashboard — contacts, Google Sheets sync, WhatsApp broadcasts, templates, and troubleshooting.",
  path: "/help",
  noIndex: true,
});

export default function HelpPage() {
  return <HelpGuide />;
}
