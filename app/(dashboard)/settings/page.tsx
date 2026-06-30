"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHero } from "@/components/dashboard/page-hero";
import { authClient, useSession } from "@/lib/auth-client";
import { TIMEZONE } from "@/lib/constants";
import {
  DEFAULT_DASHBOARD_SETTINGS,
  loadDashboardSettings,
  saveDashboardSettings,
  type DashboardSettings,
} from "@/lib/dashboard-settings";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Sheet, Bell, Building2, Shield, Workflow } from "lucide-react";
import { N8nIntegrationsCard } from "@/components/dashboard/n8n-integrations-card";
import { MetaWhatsAppIntegrationsCard } from "@/components/dashboard/meta-whatsapp-integrations-card";
import { ValidationSummaryCard } from "@/components/dashboard/validation-summary-card";
import { useIntegrationsStatus } from "@/hooks/use-integrations-status";
import { useValidationReport } from "@/hooks/use-validation-report";

type SheetsConfigResponse = {
  config: {
    primarySpreadsheetId?: string;
    contacts: { label?: string; spreadsheetId: string; tab: string; schema?: string }[];
    analytics: { spreadsheetId: string; tab: string }[];
    templates: { spreadsheetId: string; tab: string }[];
    syncLog: { spreadsheetId: string; tab: string }[];
  };
  tabsBySpreadsheet: Record<string, { title: string }[]>;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();

  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS);
  const [sheetsConfig, setSheetsConfig] = useState<SheetsConfigResponse | null>(null);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const validationReport = useValidationReport();
  const { integrations, loading: integrationsLoading, refresh: refreshIntegrations } =
    useIntegrationsStatus();

  useEffect(() => {
    setSettings(loadDashboardSettings());
    setHydrated(true);
  }, []);

  const fetchSheetsConfig = useCallback(async () => {
    try {
      setSheetsLoading(true);
      const res = await fetch("/api/sheets/config");
      if (res.ok) {
        setSheetsConfig(await res.json());
      }
    } catch {
      toast({
        title: "Could not load sheet configuration",
        variant: "destructive",
      });
    } finally {
      setSheetsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSheetsConfig();
  }, [fetchSheetsConfig]);

  const handleSaveSettings = async () => {
    setSaveLoading(true);
    try {
      saveDashboardSettings(settings);
      toast({
        title: "Settings saved",
        description: "Your preferences are stored on this device.",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_DASHBOARD_SETTINGS);
    saveDashboardSettings(DEFAULT_DASHBOARD_SETTINGS);
    toast({ title: "Settings reset to defaults" });
  };

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const adminEmail = session?.user?.email ?? "admin@hewaneschoolofmusic.com";

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Configuration"
        title="Settings"
        description="Manage organization preferences, connected spreadsheets, and notification options."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                General settings
              </CardTitle>
              <CardDescription>Organization information displayed across the dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization name</label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">WhatsApp business number</label>
                <Input value="+254712345678" disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">
                  Configured in n8n / Meta Business — contact your administrator to change.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                >
                  <option value={TIMEZONE}>{TIMEZONE}</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-[#7D3F7E]" />
                Admin account
              </CardTitle>
              <CardDescription>Your signed-in credentials (managed via Better Auth).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin email</label>
                <Input type="email" value={adminEmail} disabled className="bg-muted/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Password changes and two-factor authentication are managed through your auth provider
                configuration.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-[#E8B825]" />
                Notifications
              </CardTitle>
              <CardDescription>Email notification preferences (stored locally).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.notifyOnComplete}
                  onChange={(e) =>
                    setSettings({ ...settings, notifyOnComplete: e.target.checked })
                  }
                />
                <span>
                  <span className="block text-sm font-medium">Broadcast complete</span>
                  <span className="text-sm text-muted-foreground">
                    Notify when a campaign finishes sending.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.notifyOnError}
                  onChange={(e) => setSettings({ ...settings, notifyOnError: e.target.checked })}
                />
                <span>
                  <span className="block text-sm font-medium">Errors & sync issues</span>
                  <span className="text-sm text-muted-foreground">
                    Notify on sync failures or broadcast errors.
                  </span>
                </span>
              </label>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sheet className="size-5 text-primary" />
                Connected spreadsheets
              </CardTitle>
              <CardDescription>
                Live configuration from <code className="text-xs">sheets.config.json</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sheetsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              ) : sheetsConfig ? (
                <div className="space-y-3">
                  {sheetsConfig.config.contacts.map((source, i) => (
                    <div
                      key={`${source.spreadsheetId}-${i}`}
                      className="rounded-xl border border-border/80 bg-muted/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{source.label || `Contact source ${i + 1}`}</p>
                        {source.schema ? (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {source.schema}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {source.spreadsheetId} · tab: {source.tab}
                      </p>
                    </div>
                  ))}
                  {sheetsConfig.config.primarySpreadsheetId ? (
                    <p className="text-xs text-muted-foreground">
                      Primary spreadsheet for writes:{" "}
                      <span className="font-mono">{sheetsConfig.config.primarySpreadsheetId}</span>
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Google Sheets is not configured. Add credentials and sheets.config.json.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveSettings} disabled={saveLoading}>
              {saveLoading ? "Saving…" : "Save settings"}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset defaults
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <MetaWhatsAppIntegrationsCard
            integrations={integrations}
            loading={integrationsLoading}
            onRefresh={refreshIntegrations}
            compact
          />

          <N8nIntegrationsCard
            integrations={integrations}
            loading={integrationsLoading}
            onRefresh={refreshIntegrations}
            compact
          />

          <ValidationSummaryCard report={validationReport} />

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Workflow className="size-4 text-primary" />
                Workflow pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Refresh contacts from Google Sheets</p>
              <p>2. Validate via hewane-validate webhook</p>
              <p>3. Create &amp; submit Meta templates (Templates page)</p>
              <p>4. Broadcast approved templates via hewane-broadcast-trigger</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Dashboard info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-muted-foreground">Environment</p>
                <p className="font-medium">Production dashboard</p>
              </div>
              <div>
                <p className="text-muted-foreground">Support</p>
                <p className="font-medium">support@hewane.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200/80 bg-red-50/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-red-900">Session</CardTitle>
              <CardDescription className="text-red-800/70">
                Sign out from this device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/sign-in";
                      },
                    },
                  });
                }}
              >
                <LogOut className="mr-2 size-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
