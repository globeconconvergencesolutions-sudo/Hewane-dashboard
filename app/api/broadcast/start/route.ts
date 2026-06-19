import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getPublicSheetsConfigForN8n } from "@/lib/sheets-config-n8n";
import logger, { errorLogger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    logger.debug("[API] POST /api/broadcast/start called", {
      campaignName: body.campaignName,
    });

    const n8nUrl = process.env.N8N_WORKFLOW_B_URL;
    if (!n8nUrl) {
      throw new Error("N8N_WORKFLOW_B_URL not configured");
    }

    // Call n8n Workflow B with campaign details
    const sheetsConfig = await getPublicSheetsConfigForN8n()

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        campaignId: `campaign_${Date.now()}`,
        campaignName: body.campaignName,
        messageType: body.messageType,
        templateId: body.templateId,
        messageBody: body.messageBody,
        contactGroup: body.contactGroup,
        deliverySpeed: body.deliverySpeed,
        emailFallback: body.emailFallback,
        timestamp: new Date().toISOString(),
        sheetsConfig,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status ${response.status}`);
    }

    const result = await response.json();
    logger.info("[API] Broadcast started", result);
    return NextResponse.json(result);
  } catch (error) {
    errorLogger("[API] POST /api/broadcast/start error", error);
    return NextResponse.json(
      { error: "Failed to start broadcast" },
      { status: 500 }
    );
  }
}
