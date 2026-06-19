import { ContactsWorkspace } from "@/components/dashboard/contacts-workspace";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Contacts",
  description: "Search, filter, sync, and validate Hewane contact lists from Google Sheets.",
  path: "/contacts",
  noIndex: true,
});

export default function ContactsPage() {
  return <ContactsWorkspace />;
}