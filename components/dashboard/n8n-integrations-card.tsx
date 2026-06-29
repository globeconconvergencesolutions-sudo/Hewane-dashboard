"use client";

import Link from "next/link";
import { CheckCircle2, RefreshCw, ShieldCheck, Send, Upload, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { IntegrationsStatus } from "@/lib/app-config";
import { cn } from "@/lib/utils";

type WorkflowRow = {
  id: string;
  label: string;
  envVar: string;
  webhook: string;
  icon: typeof ShieldCheck;
  configured: boolean;
  disabledReason: string | null;
  href: string;
};

function buildRows(integrations: IntegrationsStatus): WorkflowRow[] {
  const { n8n } = integrations;
  return [
    {
      id: "validate",
      label: "Validate contacts",
      envVar: "N8N_VALIDATE_WEBHOOK_URL",
      webhook: "hewane-validate",
      icon: ShieldCheck,
      configured: n8n.validateConfigured,
      disabledReason: n8n.validateDisabledReason,
      href: "/contacts",
    },
    {
      id: "sync",
      label: "Sync sheets",
      envVar: "N8N_WORKFLOW_A_URL",
      webhook: "hewane-sheets-sync",
      icon: Upload,
      configured: n8n.syncConfigured,
      disabledReason: n8n.syncDisabledReason,
      href: "/contacts",
    },
    {
      id: "broadcast",
      label: "WhatsApp broadcast",
      envVar: "N8N_WORKFLOW_B_URL",
      webhook: "hewane-broadcast-trigger",
      icon: Send,
      configured: n8n.broadcastConfigured,
      disabledReason: n8n.broadcastDisabledReason,
      href: "/broadcast",
    },
  ];
}

export function N8nIntegrationsCard({
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
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!integrations) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Could not load n8n integration status.
        </CardContent>
      </Card>
    );
  }

  const rows = buildRows(integrations);
  const allReady = rows.every((row) => row.configured && !row.disabledReason);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className={cn(compact && "pb-3")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">n8n automations</CardTitle>
            <CardDescription>
              {allReady
                ? "Validate, sync, and broadcast webhooks are configured."
                : "Some workflows need environment variables on the server."}
            </CardDescription>
          </div>
          {onRefresh ? (
            <Button type="button" variant="ghost" size="icon" onClick={onRefresh} title="Refresh status">
              <RefreshCw className="size-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => {
          const ready = row.configured && !row.disabledReason;
          const Icon = row.icon;
          return (
            <div
              key={row.id}
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
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{row.label}</p>
                  <Badge variant={ready ? "success" : "warning"} className="text-[10px]">
                    {ready ? "Ready" : "Not configured"}
                  </Badge>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {row.webhook}
                </p>
                {!ready && row.disabledReason ? (
                  <p className="mt-1 text-xs text-amber-900 dark:text-amber-200">{row.disabledReason}</p>
                ) : null}
              </div>
              {ready ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="size-4 shrink-0 text-amber-600" />
              )}
            </div>
          );
        })}

        {!compact ? (
          <p className="pt-2 text-xs text-muted-foreground">
            Configure env vars in Netlify or <code>.env.local</code>, then redeploy.{" "}
            <Link href="/help" className="text-primary hover:underline">
              Help &amp; Guide
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
