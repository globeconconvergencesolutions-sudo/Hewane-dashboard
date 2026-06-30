import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getPublicSheetsConfigForN8n } from "@/lib/sheets-config-n8n";
import { getIntegrationsStatus, getN8nBroadcastWebhookUrl } from "@/lib/app-config";
import { isSheetsConfigured } from "@/lib/sheets-config";
import { getApprovedWhatsAppTemplateForBroadcast } from "@/lib/whatsapp-templates";
import { extractMetaVariables } from "@/lib/whatsapp-template-utils";
import logger, { errorLogger } from "@/lib/logger";

function n8nErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("fetch failed")) {
      return "Could not reach n8n. Check N8N_WORKFLOW_B_URL and that your n8n tunnel/server is online.";
    }
    return error.message;
  }
  return "Failed to start broadcast";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getIntegrationsStatus(isSheetsConfigured());
    if (status.n8n.broadcastDisabledReason) {
      return NextResponse.json({ error: status.n8n.broadcastDisabledReason }, { status: 503 });
    }

    const body = await request.json();
    logger.debug("[API] POST /api/broadcast/start called", {
      campaignName: body.campaignName,
    });

    if (!body.templateId) {
      return NextResponse.json(
        { error: "An approved Meta template is required for broadcast." },
        { status: 400 }
      );
    }

    let template;
    try {
      template = await getApprovedWhatsAppTemplateForBroadcast(body.templateId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid template";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const templateVariables = extractMetaVariables(template.body);

    const n8nUrl = getN8nBroadcastWebhookUrl()!;
    const sheetsConfig = await getPublicSheetsConfigForN8n();
    if (!sheetsConfig) {
      return NextResponse.json({ error: "Google Sheets not configured" }, { status: 503 });
    }

    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        campaignId: `campaign_${Date.now()}`,
        campaignName: body.campaignName,
        messageType: "template",
        templateId: template.id,
        metaTemplateName: template.metaTemplateName,
        templateLanguage: template.language,
        templateVariables,
        variableMapping: template.variableMapping,
        messageBody: template.body,
        contactGroup: body.contactGroup,
        deliverySpeed: body.deliverySpeed,
        emailFallback: body.emailFallback,
        timestamp: new Date().toISOString(),
        sheetsConfig,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `n8n responded with status ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`
      );
    }

    const result = await response.json();
    logger.info("[API] Broadcast started", result);
    return NextResponse.json(result);
  } catch (error) {
    const message = n8nErrorMessage(error);
    errorLogger("[API] POST /api/broadcast/start error", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
