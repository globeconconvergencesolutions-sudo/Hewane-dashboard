import DashboardHome from "./dashboard-home";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Overview",
  description:
    "Hewane dashboard overview — contact totals, campaign health, Google Sheets sync status, and quick actions.",
  path: "/",
  noIndex: true,
});

export default function DashboardPage() {
  return <DashboardHome />;
}
