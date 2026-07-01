"use client";

import Link from "next/link";
import { AlertTriangle, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { IntegrationsStatus } from "@/lib/app-config";
import { metaWhatsAppBannerTitle, metaWhatsAppStatusDescription } from "@/lib/meta-whatsapp-status-copy";
import { cn } from "@/lib/utils";

export function MetaWhatsAppStatusBanner({ meta }: { meta: IntegrationsStatus["meta"] }) {
  const tone =
    meta.connectionStatus === "connected"
      ? "success"
      : meta.connectionStatus === "failed"
        ? "danger"
        : "warning";

  const Icon =
    meta.connectionStatus === "connected"
      ? ShieldCheck
      : meta.connectionStatus === "failed"
        ? XCircle
        : AlertTriangle;

  return (
    <Card
      className={cn(
        "shadow-sm",
        tone === "success" &&
          "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20",
        tone === "warning" &&
          "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20",
        tone === "danger" &&
          "border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-950/20"
      )}
    >
      <CardContent
        className={cn(
          "flex items-start gap-3 p-4 text-sm",
          tone === "success" && "text-emerald-900 dark:text-emerald-100",
          tone === "warning" && "text-amber-950 dark:text-amber-100",
          tone === "danger" && "text-red-950 dark:text-red-100"
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">{metaWhatsAppBannerTitle(meta)}</p>
          <p className="mt-1 opacity-90">{metaWhatsAppStatusDescription(meta)}</p>
          {meta.connectionStatus !== "connected" ? (
            <p className="mt-2">
              <Link href="/settings" className="font-medium underline">
                Open Settings
              </Link>{" "}
              to update credentials or run a connection test.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
