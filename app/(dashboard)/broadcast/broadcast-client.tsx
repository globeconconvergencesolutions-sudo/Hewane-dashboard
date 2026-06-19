"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/dashboard/page-hero";
import { SEGMENTS, DELIVERY_SPEEDS } from "@/lib/constants";
import { MessageTemplate } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Pause,
  StopCircle,
  MessageSquare,
  Users,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type CampaignStatus = "idle" | "running" | "completed" | "paused" | "stopped" | "error";

type BroadcastMetrics = {
  sent: number;
  delivered: number;
  failed: number;
};

export default function BroadcastPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [campaignName, setCampaignName] = useState("");
  const [messageType, setMessageType] = useState<"template" | "custom">("template");
  const [templateId, setTemplateId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [contactGroup, setContactGroup] = useState("all");
  const [deliverySpeed, setDeliverySpeed] = useState("Standard");
  const [emailFallback, setEmailFallback] = useState(false);

  const [status, setStatus] = useState<CampaignStatus>("idle");
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BroadcastMetrics>({ sent: 0, delivered: 0, failed: 0 });
  const [statusMessage, setStatusMessage] = useState("Configure your campaign and launch when ready.");

  const [startLoading, setStartLoading] = useState(false);
  const [controlLoading, setControlLoading] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  );

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data: MessageTemplate[] = await res.json();
        setTemplates(data);
      }
    } catch {
      toast({
        title: "Could not load templates",
        description: "You can still send a custom message.",
        variant: "destructive",
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    const fromUrl = searchParams.get("templateId");
    if (fromUrl && templates.length > 0) {
      const match = templates.find((t) => t.id === fromUrl);
      if (match) {
        setMessageType("template");
        setTemplateId(match.id);
        setMessageBody(match.body);
      }
    }
  }, [searchParams, templates]);

  useEffect(() => {
    if (messageType === "template" && selectedTemplate) {
      setMessageBody(selectedTemplate.body);
    }
  }, [messageType, selectedTemplate]);

  const canStart =
    campaignName.trim().length > 0 &&
    (messageType === "custom" ? messageBody.trim().length > 0 : Boolean(templateId));

  const parseStartResponse = (result: Record<string, unknown>) => {
    const execId =
      (result.executionId as string) ||
      (result.n8nExecutionId as string) ||
      (result.execution_id as string) ||
      null;

    setExecutionId(execId);
    setCampaignId((result.campaignId as string) || null);
    setMetrics({
      sent: Number(result.totalSent ?? result.sent ?? 0),
      delivered: Number(result.delivered ?? 0),
      failed: Number(result.failed ?? 0),
    });
    setStatusMessage(
      (result.message as string) ||
        "Broadcast workflow started. Track delivery in Analytics as messages are sent."
    );
    setStatus("running");
  };

  const handleStartBroadcast = async () => {
    if (!canStart) return;

    setStartLoading(true);
    setStatusMessage("Starting campaign…");

    try {
      const res = await fetch("/api/broadcast/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: campaignName.trim(),
          messageType,
          templateId: messageType === "template" ? templateId : undefined,
          messageBody: messageBody.trim(),
          contactGroup,
          deliverySpeed,
          emailFallback,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((result.error as string) || "Failed to start broadcast");
      }

      parseStartResponse(result);
      toast({
        title: "Broadcast started",
        description: `"${campaignName}" is now running via n8n.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start broadcast";
      setStatus("error");
      setStatusMessage(message);
      toast({
        title: "Broadcast failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setStartLoading(false);
    }
  };

  const handlePause = async () => {
    if (!executionId) {
      toast({
        title: "Pause unavailable",
        description: "No n8n execution ID was returned. Configure N8N_API_KEY for live controls.",
        variant: "destructive",
      });
      return;
    }

    setControlLoading(true);
    try {
      const res = await fetch("/api/broadcast/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionId }),
      });
      if (!res.ok) throw new Error("Pause request failed");
      setStatus("paused");
      setStatusMessage("Campaign paused.");
      toast({ title: "Campaign paused" });
    } catch {
      toast({ title: "Could not pause campaign", variant: "destructive" });
    } finally {
      setControlLoading(false);
    }
  };

  const handleStop = async () => {
    if (!executionId) {
      toast({
        title: "Stop unavailable",
        description: "No n8n execution ID was returned.",
        variant: "destructive",
      });
      return;
    }

    setControlLoading(true);
    try {
      const res = await fetch("/api/broadcast/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionId }),
      });
      if (!res.ok) throw new Error("Stop request failed");
      setStatus("stopped");
      setStatusMessage("Campaign stopped.");
      toast({ title: "Campaign stopped" });
    } catch {
      toast({ title: "Could not stop campaign", variant: "destructive" });
    } finally {
      setControlLoading(false);
    }
  };

  const isRunning = status === "running";
  const progressPercent =
    metrics.sent > 0
      ? Math.min(100, Math.round(((metrics.delivered + metrics.failed) / metrics.sent) * 100))
      : isRunning
        ? 15
        : status === "completed"
          ? 100
          : 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="WhatsApp campaigns"
        title="Broadcast Campaign"
        description="Launch targeted WhatsApp messages to your contact groups with controlled delivery speed."
        actions={
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link href="/templates">Manage templates</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Campaign details</CardTitle>
              <CardDescription>
                Name your campaign, choose a template or custom message, and select recipients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign name</label>
                <Input
                  placeholder="e.g. Term 2 concert reminder"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message type</label>
                <div className="flex flex-wrap gap-2">
                  {(["template", "custom"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMessageType(type)}
                      disabled={isRunning}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        messageType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {type === "template" ? "Use template" : "Custom message"}
                    </button>
                  ))}
                </div>
              </div>

              {messageType === "template" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <Select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    disabled={isRunning || templatesLoading}
                  >
                    <option value="">
                      {templatesLoading ? "Loading templates…" : "Select a template"}
                    </option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                  {templates.length === 0 && !templatesLoading ? (
                    <p className="text-xs text-muted-foreground">
                      No templates yet.{" "}
                      <Link href="/templates" className="font-medium text-primary hover:underline">
                        Create one
                      </Link>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium">Message preview</label>
                <Textarea
                  className="min-h-32 font-mono text-sm"
                  placeholder="Your message here… Use {{name}} or {{segment}} for personalization."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  disabled={isRunning || (messageType === "template" && Boolean(templateId))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4 text-primary" />
                    Contact group
                  </label>
                  <Select
                    value={contactGroup}
                    onChange={(e) => setContactGroup(e.target.value)}
                    disabled={isRunning}
                  >
                    <option value="all">All contacts</option>
                    {SEGMENTS.map((seg) => (
                      <option key={seg} value={seg}>
                        {seg}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="size-4 text-[#E8B825]" />
                    Delivery speed
                  </label>
                  <Select
                    value={deliverySpeed}
                    onChange={(e) => setDeliverySpeed(e.target.value)}
                    disabled={isRunning}
                  >
                    {DELIVERY_SPEEDS.map((speed) => (
                      <option key={speed.label} value={speed.label}>
                        {speed.label} — {speed.description}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-muted/30 p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={emailFallback}
                  onChange={(e) => setEmailFallback(e.target.checked)}
                  disabled={isRunning}
                />
                <span>
                  <span className="block text-sm font-medium">Email fallback</span>
                  <span className="text-sm text-muted-foreground">
                    Send email when WhatsApp delivery is unavailable for a contact.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleStartBroadcast}
                  disabled={isRunning || startLoading || !canStart}
                  className="min-w-[160px] flex-1 bg-[#7D3F7E] hover:bg-[#6a356b]"
                >
                  <Send className="mr-2 size-4" />
                  {startLoading ? "Starting…" : "Start broadcast"}
                </Button>
                {isRunning ? (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePause}
                      disabled={controlLoading}
                      title="Pause campaign"
                    >
                      <Pause className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleStop}
                      disabled={controlLoading}
                      title="Stop campaign"
                    >
                      <StopCircle className="size-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                Campaign status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">{progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7D3F7E] to-[#E8B825] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 text-sm ${
                  status === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : isRunning
                      ? "border-[#7D3F7E]/20 bg-[#7D3F7E]/5 text-[#7D3F7E]"
                      : status === "completed" || status === "stopped"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-start gap-2">
                  {status === "error" ? (
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  ) : isRunning ? (
                    <span className="mt-1 size-2 shrink-0 animate-pulse rounded-full bg-[#7D3F7E]" />
                  ) : status === "completed" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  ) : null}
                  <p>{statusMessage}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={isRunning ? "default" : "muted"} className="capitalize">
                  {status}
                </Badge>
                {campaignId ? <Badge variant="outline">{campaignId}</Badge> : null}
                {executionId ? (
                  <Badge variant="secondary" title="n8n execution">
                    n8n #{executionId.slice(0, 8)}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-2 border-t pt-4 text-sm">
                {[
                  { label: "Messages sent", value: metrics.sent },
                  { label: "Delivered", value: metrics.delivered, className: "text-emerald-600" },
                  { label: "Failed", value: metrics.failed, className: "text-red-600" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-semibold ${row.className ?? ""}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Full campaign history appears in{" "}
                <Link href="/analytics" className="font-medium text-primary hover:underline">
                  Analytics
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
