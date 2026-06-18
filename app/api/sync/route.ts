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

    logger.debug("[API] POST /api/sync called");

    const n8nUrl = process.env.N8N_WORKFLOW_A_URL;
    if (!n8nUrl) {
      throw new Error("N8N_WORKFLOW_A_URL not configured");
    }

    // Call n8n Workflow A with action: "sync"
    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync",
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status ${response.status}`);
    }

    const result = await response.json();
    logger.info("[API] Sync triggered successfully", result);
    return NextResponse.json(result);
  } catch (error) {
    errorLogger("[API] POST /api/sync error", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
