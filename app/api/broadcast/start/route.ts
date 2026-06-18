import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import logger, { errorLogger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
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
    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        campaignId: `campaign_${Date.now()}`,
        campaignName: body.campaignName,
        messageType: body.messageType,
        templateId: body.templateId,
        messageBody: body.messageBody,
        contactGroup: body.contactGroup,
        deliverySpeed: body.deliverySpeed,
        emailFallback: body.emailFallback,
        timestamp: new Date().toISOString(),
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
