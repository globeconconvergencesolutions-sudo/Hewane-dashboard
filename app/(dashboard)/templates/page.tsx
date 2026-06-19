"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageTemplate } from "@/lib/types";
import { TEMPLATE_VARIABLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHero } from "@/components/dashboard/page-hero";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Send, Sparkles, X } from "lucide-react";

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{[^}]+\}\}/g) || [];
  return [...new Set(matches)];
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", body: "" });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/templates");
      if (res.ok) {
        setTemplates(await res.json());
      } else {
        throw new Error("Failed to load");
      }
    } catch {
      toast({
        title: "Could not load templates",
        description: "Check that your Google Sheets Templates tab is configured.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !formData.body.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          body: formData.body.trim(),
          variables: extractVariables(formData.body),
        }),
      });

      if (!res.ok) throw new Error("Create failed");

      setFormData({ name: "", body: "" });
      setShowForm(false);
      await fetchTemplates();
      toast({ title: "Template created", description: `"${formData.name}" is ready to use.` });
    } catch {
      toast({
        title: "Could not create template",
        description: "Ensure the Templates sheet tab exists on your primary spreadsheet.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (template: MessageTemplate) => {
    try {
      await navigator.clipboard.writeText(template.body);
      toast({ title: "Copied to clipboard", description: template.name });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleDuplicate = async (template: MessageTemplate) => {
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (copy)`,
          body: template.body,
          variables: template.variables,
        }),
      });
      if (!res.ok) throw new Error("Duplicate failed");
      await fetchTemplates();
      toast({ title: "Template duplicated" });
    } catch {
      toast({ title: "Could not duplicate template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({ ...prev, body: `${prev.body}${variable}` }));
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Message library"
        title="Message Templates"
        description="Build reusable WhatsApp messages with personalization variables for faster campaigns."
        actions={
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#E8B825] text-[#1a1a2e] hover:bg-[#f0c84a]"
          >
            <Plus className="mr-2 size-4" />
            New template
          </Button>
        }
      />

      {showForm ? (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Create template</CardTitle>
              <CardDescription>
                Use {"{{name}}"}, {"{{segment}}"}, or numbered placeholders for dynamic content.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Template name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Textarea
              className="min-h-36 font-mono text-sm"
              placeholder="Hello {{name}}, your lesson is scheduled for…"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
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
            <div className="flex gap-2">
              <Button onClick={handleCreateTemplate} disabled={saving}>
                {saving ? "Saving…" : "Create template"}
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
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="group border-border/80 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{template.name}</CardTitle>
                  <Sparkles className="size-4 shrink-0 text-[#E8B825]" />
                </div>
                {template.variables.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {template.variables.slice(0, 4).map((v) => (
                      <Badge key={v} variant="muted" className="font-mono text-[10px]">
                        {v}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardHeader>
              <CardContent>
                <p className="mb-4 line-clamp-4 text-sm text-muted-foreground">{template.body}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/broadcast?templateId=${encodeURIComponent(template.id)}`}>
                      <Send className="mr-1.5 size-3.5" />
                      Use
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(template)}>
                    <Copy className="mr-1.5 size-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                    disabled={saving}
                  >
                    Duplicate
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
            <h3 className="text-lg font-semibold">No templates yet</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create your first reusable message to speed up broadcasts and keep messaging consistent.
            </p>
            <Button className="mt-6" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 size-4" />
              Create template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
