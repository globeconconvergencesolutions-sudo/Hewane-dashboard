"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/dashboard/page-hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { N8nIntegrationsCard } from "@/components/dashboard/n8n-integrations-card";
import { ValidationSummaryCard } from "@/components/dashboard/validation-summary-card";
import { ValidationStatusChip } from "@/components/dashboard/validation-status-chip";
import { useIntegrationsStatus } from "@/hooks/use-integrations-status";
import { useValidationReport } from "@/hooks/use-validation-report";
import { DashboardStats } from "@/lib/types";
import {
  ArrowRight,
  BarChart3,
  MessageSquare,
  Send,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const validationReport = useValidationReport();
  const { integrations, loading: integrationsLoading, refresh: refreshIntegrations } =
    useIntegrationsStatus();

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) setStats(await res.json());
      } catch (error) {
        console.error("[Dashboard] Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const syncColor =
    stats?.syncHealth === "healthy"
      ? "text-emerald-600"
      : stats?.syncHealth === "warning"
        ? "text-amber-600"
        : "text-red-600";

  const n8nReadyCount = integrations
    ? [
        integrations.n8n.validateConfigured && !integrations.n8n.validateDisabledReason,
        integrations.n8n.syncConfigured && !integrations.n8n.syncDisabledReason,
        integrations.n8n.broadcastConfigured && !integrations.n8n.broadcastDisabledReason,
      ].filter(Boolean).length
    : 0;

  return (
    <div className="space-y-6">
      <PageHero
        title="Dashboard Overview"
        description="Monitor contacts, validation health, sheet sync, and campaign readiness."
        actions={
          <>
            <ValidationStatusChip report={validationReport} />
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/contacts">View contacts</Link>
            </Button>
            <Button asChild className="bg-[#E8B825] text-[#1a1a2e] hover:bg-[#f0c84a]">
              <Link href="/broadcast">Start broadcast</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Total contacts"
              value={stats?.totalContacts ?? 0}
              hint="Across connected sheets"
              icon={<Users className="size-5 text-primary" />}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatCard
              label="Messages this month"
              value={stats?.messagesThisMonth ?? 0}
              hint={`${stats?.deliveredThisMonth ?? 0} delivered`}
              icon={<MessageSquare className="size-5 text-emerald-700" />}
              iconClassName="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              label="Success rate"
              value={stats?.successRate ?? "N/A"}
              hint="Delivered vs sent"
              icon={<TrendingUp className="size-5 text-[#7D3F7E]" />}
              iconClassName="bg-[#7D3F7E]/10 text-[#7D3F7E]"
              valueClassName="text-[#7D3F7E]"
            />
            <StatCard
              label="Sheets sync"
              value={<span className="capitalize">{stats?.syncHealth ?? "unknown"}</span>}
              hint="Cache / sheet freshness"
              icon={<BarChart3 className="size-5" />}
              iconClassName="bg-secondary/20 text-secondary-foreground"
              valueClassName={syncColor}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Recommended flow: refresh → validate → sync → broadcast.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              {
                href: "/contacts",
                title: "Validate contacts",
                desc: "Check phones & duplicates",
                icon: ShieldCheck,
              },
              {
                href: "/contacts",
                title: "Sync sheets",
                desc: "Run n8n sync workflow",
                icon: Upload,
              },
              {
                href: "/broadcast",
                title: "Launch broadcast",
                desc: "Send WhatsApp campaigns",
                icon: Send,
              },
              {
                href: "/analytics",
                title: "View analytics",
                desc: "Track campaign performance",
                icon: BarChart3,
              },
            ].map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-start gap-4 rounded-xl border border-border/80 p-4 transition-all hover:border-primary/20 hover:bg-primary/[0.03]"
              >
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <action.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{action.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ValidationSummaryCard report={validationReport} />

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">System status</CardTitle>
              <CardDescription>Live operational snapshot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">n8n workflows</span>
                <span className="font-medium">
                  {integrationsLoading ? "…" : `${n8nReadyCount}/3 ready`}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Last cache refresh</span>
                <span className="font-medium">
                  {stats?.lastSync ? new Date(stats.lastSync).toLocaleString() : "Not yet synced"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Failed this month</span>
                <span className="font-medium text-red-600">{stats?.failedThisMonth ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <N8nIntegrationsCard
        integrations={integrations}
        loading={integrationsLoading}
        onRefresh={refreshIntegrations}
      />
    </div>
  );
}
