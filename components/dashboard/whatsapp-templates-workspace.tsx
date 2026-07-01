"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  extractMetaVariables,
  slugifyMetaTemplateName,
} from "@/lib/whatsapp-template-utils";
import { TEMPLATE_VARIABLES, WHATSAPP_TEMPLATE_STATUSES, DEFAULT_WHATSAPP_TEMPLATE_LANGUAGE } from "@/lib/constants";
import type {
  VariableMapping,
  VariableSource,
  WhatsAppTemplateRecord,
  WhatsAppTemplateStatus,
} from "@/lib/whatsapp-template-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { PageHero } from "@/components/dashboard/page-hero";
import { ExportActions } from "@/components/dashboard/export-actions";
import { MetaWhatsAppStatusBanner } from "@/components/dashboard/meta-whatsapp-status-banner";
import { useToast } from "@/hooks/use-toast";
import { useExportDownload } from "@/hooks/use-export-download";
import { useIntegrationsStatus } from "@/hooks/use-integrations-status";
import type { ExportFormat } from "@/lib/export-formats";
import {
  Plus,
  Copy,
  Send,
  Sparkles,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "all" | WhatsAppTemplateStatus;

type FormState = {
  displayName: string;
  metaTemplateName: string;
  body: string;
  exampleValues: string[];
  variableMapping: VariableMapping[];
};

const EMPTY_FORM: FormState = {
  displayName: "",
  metaTemplateName: "",
  body: "",
  exampleValues: [],
  variableMapping: [],
};

function statusBadgeVariant(status: WhatsAppTemplateStatus) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "rejected":
      return "danger" as const;
    case "paused":
      return "secondary" as const;
    default:
      return "muted" as const;
  }
}

function statusLabel(status: WhatsAppTemplateStatus) {
  return WHATSAPP_TEMPLATE_STATUSES.find((s) => s.id === status)?.label ?? status;
}

function buildFormFromBody(body: string, displayName = ""): Pick<FormState, "body" | "exampleValues" | "variableMapping"> {
  const variables = extractMetaVariables(body);
  const variableMapping: VariableMapping[] = variables.map((meta, index) => {
    const preset = TEMPLATE_VARIABLES.find((v) => v.label === meta);
    return {
      meta,
      source: preset?.defaultSource ?? (index === 0 ? "name" : index === 1 ? "segment" : "custom"),
      customValue: index > 1 ? `Sample ${index + 1}` : undefined,
    };
  });
  const exampleValues = variableMapping.map((entry, index) => {
    if (entry.source === "name") return "John";
    if (entry.source === "segment") return "Students";
    return entry.customValue ?? `Sample ${index + 1}`;
  });
  return { body, exampleValues, variableMapping };
}

export function WhatsAppTemplatesWorkspace() {
  const { toast } = useToast();
  const { integrations } = useIntegrationsStatus();
  const meta = integrations?.meta;
  const canSubmitToMeta = meta?.canSubmitTemplates ?? false;

  const [templates, setTemplates] = useState<WhatsAppTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [manualMetaName, setManualMetaName] = useState(false);
  const { downloadExport, exporting } = useExportDownload();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/templates?syncPending=true");
      if (!res.ok) throw new Error("Failed to load");
      setTemplates(await res.json());
    } catch {
      toast({
        title: "Could not load templates",
        description: "Check your database connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = useMemo(() => {
    if (activeTab === "all") return templates;
    return templates.filter((t) => t.status === activeTab);
  }, [templates, activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    for (const status of WHATSAPP_TEMPLATE_STATUSES) {
      counts[status.id] = templates.filter((t) => t.status === status.id).length;
    }
    return counts;
  }, [templates]);

  const handleExport = (format: ExportFormat) => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (activeTab !== "all") params.set("status", activeTab);
    downloadExport(format, {
      url: `/api/whatsapp/templates/export?${params.toString()}`,
      filenameBase: "hewane-whatsapp-templates",
    });
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setManualMetaName(false);
    setShowForm(true);
  };

  const openEditForm = (template: WhatsAppTemplateRecord) => {
    setEditingId(template.id);
    setFormData({
      displayName: template.displayName,
      metaTemplateName: template.metaTemplateName,
      body: template.body,
      exampleValues: template.exampleValues,
      variableMapping: template.variableMapping,
    });
    setManualMetaName(true);
    setShowForm(true);
  };

  const updateBody = (body: string) => {
    const built = buildFormFromBody(body, formData.displayName);
    setFormData((prev) => ({
      ...prev,
      body,
      exampleValues: built.exampleValues,
      variableMapping: built.variableMapping,
      metaTemplateName:
        manualMetaName || editingId
          ? prev.metaTemplateName
          : slugifyMetaTemplateName(prev.displayName || "hewane_template"),
    }));
  };

  const updateDisplayName = (displayName: string) => {
    setFormData((prev) => ({
      ...prev,
      displayName,
      metaTemplateName:
        manualMetaName || editingId ? prev.metaTemplateName : slugifyMetaTemplateName(displayName),
    }));
  };

  const insertVariable = (variable: string) => {
    updateBody(`${formData.body}${variable}`);
  };

  const updateExampleValue = (index: number, value: string) => {
    setFormData((prev) => {
      const exampleValues = [...prev.exampleValues];
      exampleValues[index] = value;
      return { ...prev, exampleValues };
    });
  };

  const updateMappingSource = (index: number, source: VariableSource) => {
    setFormData((prev) => {
      const variableMapping = [...prev.variableMapping];
      variableMapping[index] = { ...variableMapping[index], source };
      return { ...prev, variableMapping };
    });
  };

  const handleSaveDraft = async () => {
    if (!formData.displayName.trim() || !formData.body.trim()) return;

    setSaving(true);
    try {
      const payload = {
        displayName: formData.displayName.trim(),
        metaTemplateName: formData.metaTemplateName.trim(),
        body: formData.body.trim(),
        category: "MARKETING",
        language: DEFAULT_WHATSAPP_TEMPLATE_LANGUAGE,
        exampleValues: formData.exampleValues,
        variableMapping: formData.variableMapping,
      };

      const res = await fetch(
        editingId ? `/api/whatsapp/templates/${editingId}` : "/api/whatsapp/templates",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed");

      setShowForm(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      await fetchTemplates();
      toast({
        title: editingId ? "Draft updated" : "Draft saved",
        description: `"${payload.displayName}" is ready to submit to Meta.`,
      });
    } catch (error) {
      toast({
        title: "Could not save draft",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitToMeta = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/whatsapp/templates/${id}/submit`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submit failed");
      await fetchTemplates();
      toast({
        title: "Submitted to Meta",
        description: "Meta is reviewing your template. Check back shortly.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Check Meta credentials.",
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleSync = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/whatsapp/templates/${id}/sync`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Sync failed");
      await fetchTemplates();
      toast({
        title: "Status updated",
        description: `Template is now ${statusLabel(result.status).toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Could not refresh status",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/whatsapp/templates/${id}/duplicate`, { method: "POST" });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Duplicate failed");
      }
      await fetchTemplates();
      toast({ title: "Template duplicated", description: "Edit the copy and submit with a new Meta name." });
    } catch (error) {
      toast({
        title: "Could not duplicate",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleCopyBody = async (template: WhatsAppTemplateRecord) => {
    try {
      await navigator.clipboard.writeText(template.body);
      toast({ title: "Copied to clipboard", description: template.displayName });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Meta WhatsApp"
        title="Message Templates"
        description="Draft marketing templates, submit them to Meta for approval, then use verified templates in broadcast campaigns."
        actions={
          <>
            <ExportActions
              variant="hero"
              onExport={handleExport}
              exporting={exporting}
              disabled={loading || templates.length === 0}
            />
            <Button
              onClick={openCreateForm}
              className="bg-[#E8B825] text-[#1a1a2e] hover:bg-[#f0c84a]"
            >
              <Plus className="mr-2 size-4" />
              New draft
            </Button>
          </>
        }
      />

      {meta ? <MetaWhatsAppStatusBanner meta={meta} /> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted/50"
          )}
        >
          All ({tabCounts.all})
        </button>
        {WHATSAPP_TEMPLATE_STATUSES.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50"
            )}
          >
            {tab.label} ({tabCounts[tab.id] ?? 0})
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={loading} className="ml-auto">
          <RefreshCw className={cn("mr-2 size-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {showForm ? (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{editingId ? "Edit draft" : "Create draft template"}</CardTitle>
              <CardDescription>
                Use Meta placeholders {"{{1}}"}, {"{{2}}"}, … Category defaults to Marketing. Submit when ready
                for Meta review.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display name</label>
                <Input
                  placeholder="Term 2 concert reminder"
                  value={formData.displayName}
                  onChange={(e) => updateDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Meta template name</label>
                <Input
                  placeholder="hewane_term2_concert"
                  value={formData.metaTemplateName}
                  onChange={(e) => {
                    setManualMetaName(true);
                    setFormData((prev) => ({ ...prev, metaTemplateName: e.target.value }));
                  }}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Lowercase, numbers, underscores only.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message body</label>
              <Textarea
                className="min-h-36 font-mono text-sm"
                placeholder="Hello {{1}}, join us for our Term 2 concert on {{2}}!"
                value={formData.body}
                onChange={(e) => updateBody(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => insertVariable(v.label)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary"
                  title={v.description}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {formData.variableMapping.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="text-sm font-medium">Variables & example values (required by Meta)</p>
                {formData.variableMapping.map((mapping, index) => (
                  <div key={mapping.meta} className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center">
                      <Badge variant="muted" className="font-mono">
                        {mapping.meta}
                      </Badge>
                    </div>
                    <Select
                      value={mapping.source}
                      onChange={(e) => updateMappingSource(index, e.target.value as VariableSource)}
                    >
                      <option value="name">Contact name</option>
                      <option value="segment">Segment</option>
                      <option value="custom">Custom static text</option>
                    </Select>
                    <Input
                      placeholder="Example value for Meta"
                      value={formData.exampleValues[index] ?? ""}
                      onChange={(e) => updateExampleValue(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveDraft} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update draft" : "Save draft"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="group border-border/80 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base leading-snug">{template.displayName}</CardTitle>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {template.metaTemplateName}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(template.status)}>{statusLabel(template.status)}</Badge>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {template.category}
                  </Badge>
                  {template.variableMapping.slice(0, 4).map((v) => (
                    <Badge key={v.meta} variant="muted" className="font-mono text-[10px]">
                      {v.meta}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 line-clamp-4 text-sm text-muted-foreground">{template.body}</p>

                {template.rejectionReason ? (
                  <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                    {template.rejectionReason}
                  </p>
                ) : null}

                {template.status === "pending" ? (
                  <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    Meta review can take a few minutes up to 48 hours.
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {template.status === "approved" ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/broadcast?templateId=${encodeURIComponent(template.id)}`}>
                        <Send className="mr-1.5 size-3.5" />
                        Use in broadcast
                      </Link>
                    </Button>
                  ) : null}

                  {template.status === "draft" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitToMeta(template.id)}
                        disabled={!canSubmitToMeta || actionId === template.id}
                      >
                        Submit to Meta
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditForm(template)}>
                        <FileEdit className="mr-1.5 size-3.5" />
                        Edit
                      </Button>
                    </>
                  ) : null}

                  {template.status === "pending" || template.status === "paused" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(template.id)}
                      disabled={!canSubmitToMeta || actionId === template.id}
                    >
                      <RefreshCw className="mr-1.5 size-3.5" />
                      Refresh status
                    </Button>
                  ) : null}

                  {template.status === "rejected" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template.id)}
                      disabled={actionId === template.id}
                    >
                      Duplicate &amp; fix
                    </Button>
                  ) : null}

                  <Button variant="ghost" size="sm" onClick={() => handleCopyBody(template)}>
                    <Copy className="mr-1.5 size-3.5" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
              <Sparkles className="size-8" />
            </div>
            <h3 className="text-lg font-semibold">
              {activeTab === "all" ? "No templates yet" : `No ${statusLabel(activeTab as WhatsAppTemplateStatus).toLowerCase()} templates`}
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create a marketing draft, submit it to Meta for approval, then use it in broadcast campaigns.
            </p>
            {activeTab === "all" || activeTab === "draft" ? (
              <Button className="mt-6" onClick={openCreateForm}>
                <Plus className="mr-2 size-4" />
                Create draft
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/80 bg-muted/20 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-4 text-emerald-600" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="font-medium text-foreground">1. Draft</p>
            Write your message with {"{{1}}"}, {"{{2}}"} placeholders and example values.
          </div>
          <div>
            <p className="font-medium text-foreground">2. Submit</p>
            We send the template to Meta via API. Status becomes Pending until Meta approves.
          </div>
          <div>
            <p className="font-medium text-foreground">3. Broadcast</p>
            Only Approved templates appear in Broadcast. Meta sends the verified message.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
