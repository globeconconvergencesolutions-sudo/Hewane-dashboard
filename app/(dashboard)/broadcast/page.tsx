import { Suspense } from "react";
import BroadcastPage from "./broadcast-client";
import { Skeleton } from "@/components/ui/skeleton";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Broadcast",
  description: "Launch WhatsApp broadcast campaigns to Hewane contact groups via n8n automation.",
  path: "/broadcast",
  noIndex: true,
});

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      }
    >
      <BroadcastPage />
    </Suspense>
  );
}
