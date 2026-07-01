"use client";

import { CheckCircle2, RefreshCw, XCircle, MessageSquareText, PlugZap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { IntegrationsStatus } from "@/lib/app-config";
import {
  metaWhatsAppStatusDescription,
  metaWhatsAppStatusLabel,
} from "@/lib/meta-whatsapp-status-copy";
import { cn } from "@/lib/utils";

export function MetaWhatsAppIntegrationsCard({
  integrations,
  loading,
  verifying,
  onRefresh,
  onVerify,
  compact = false,
}: {
  integrations: IntegrationsStatus | null;
  loading?: boolean;
  verifying?: boolean;
  onRefresh?: () => void;
  onVerify?: () => Promise<unknown>;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader className={compact ? "pb-2" : undefined}>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-14 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!integrations) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Could not load Meta WhatsApp integration status.
        </CardContent>
      </Card>
    );
  }

  const { meta } = integrations;
  const status = meta.connectionStatus;
  const ready = status === "connected";
  const canTest = meta.credentialsReady && Boolean(onVerify);

  const badgeVariant =
    status === "connected" ? "success" : status === "failed" ? "danger" : "warning";

  const panelClass =
    status === "connected"
      ? "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      : status === "failed"
        ? "border-red-200/80 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20"
        : "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20";

  const iconWrapClass =
    status === "connected"
      ? "bg-emerald-100 text-emerald-700"
      : status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className={cn(compact && "pb-3")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Meta WhatsApp templates</CardTitle>
            <CardDescription>
              {ready
                ? "Live connection verified against Meta Graph API for template submit and status sync."
                : "Configure real credentials, then test the connection before submitting templates."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {canTest ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={verifying}
                onClick={() => {
                  void onVerify?.();
                }}
              >
                <PlugZap className="mr-2 size-4" />
                {verifying ? "Testing…" : "Test connection"}
              </Button>
            ) : null}
            {onRefresh ? (
              <Button type="button" variant="ghost" size="icon" onClick={onRefresh} title="Refresh status">
                <RefreshCw className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={cn("flex items-start gap-3 rounded-xl border px-3 py-3", panelClass)}>
          <div className={cn("rounded-lg p-2", iconWrapClass)}>
            <MessageSquareText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Template management API</p>
              <Badge variant={badgeVariant} className="text-[10px]">
                {metaWhatsAppStatusLabel(status)}
              </Badge>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              WHATSAPP_WABA_ID · WHATSAPP_ACCESS_TOKEN
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{metaWhatsAppStatusDescription(meta)}</p>
            {meta.verifiedAt ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Last verified {new Date(meta.verifiedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          {ready ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="size-4 shrink-0 text-amber-600" />
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Sending WhatsApp broadcasts still runs through n8n — this Meta connection is only for template
          submit and approval sync from the dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
