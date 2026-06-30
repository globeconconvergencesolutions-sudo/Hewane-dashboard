"use client";

import { CheckCircle2, RefreshCw, XCircle, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { IntegrationsStatus } from "@/lib/app-config";
import { cn } from "@/lib/utils";

export function MetaWhatsAppIntegrationsCard({
  integrations,
  loading,
  onRefresh,
  compact = false,
}: {
  integrations: IntegrationsStatus | null;
  loading?: boolean;
  onRefresh?: () => void;
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
  const ready = meta.configured;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className={cn(compact && "pb-3")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Meta WhatsApp templates</CardTitle>
            <CardDescription>
              {ready
                ? "Template submit and status sync use the Meta Graph API directly from the dashboard."
                : "Configure WABA ID and access token to submit templates for Meta review."}
            </CardDescription>
          </div>
          {onRefresh ? (
            <Button type="button" variant="ghost" size="icon" onClick={onRefresh} title="Refresh status">
              <RefreshCw className="size-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-3 py-3",
            ready
              ? "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
              : "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
          )}
        >
          <div
            className={cn(
              "rounded-lg p-2",
              ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
            )}
          >
            <MessageSquareText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Template management API</p>
              <Badge variant={ready ? "success" : "warning"} className="text-[10px]">
                {ready ? "Connected" : "Not configured"}
              </Badge>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              WHATSAPP_WABA_ID · WHATSAPP_ACCESS_TOKEN
            </p>
            {!ready && meta.disabledReason ? (
              <p className="mt-1 text-xs text-amber-900 dark:text-amber-200">{meta.disabledReason}</p>
            ) : null}
          </div>
          {ready ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="size-4 shrink-0 text-amber-600" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
