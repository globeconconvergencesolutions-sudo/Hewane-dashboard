import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
    const { executionId } = body;
    
    if (!executionId) {
      return NextResponse.json(
        { error: "executionId required" },
        { status: 400 }
      );
    }

    logger.debug("[API] POST /api/broadcast/pause called", { executionId });

    const n8nBaseUrl = process.env.N8N_BASE_URL;
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nBaseUrl || !n8nApiKey) {
      throw new Error("n8n credentials not configured");
    }

    // Call n8n REST API to stop execution (pause)
    const response = await fetch(
      `${n8nBaseUrl}/api/v1/executions/${executionId}/stop`,
      {
        method: "POST",
        headers: {
          "X-N8N-API-KEY": n8nApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`n8n API responded with status ${response.status}`);
    }

    const result = await response.json();
    logger.info("[API] Broadcast paused", result);
    return NextResponse.json(result);
  } catch (error) {
    errorLogger("[API] POST /api/broadcast/pause error", error);
    return NextResponse.json(
      { error: "Failed to pause broadcast" },
      { status: 500 }
    );
  }
}
