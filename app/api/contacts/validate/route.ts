import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getPublicSheetsConfigForN8n } from "@/lib/sheets-config-n8n";
import { getIntegrationsStatus, getN8nValidateWebhookUrl } from "@/lib/app-config";
import { isSheetsConfigured } from "@/lib/sheets-config";
import { parseN8nValidationResponse } from "@/lib/validation";
import logger, { errorLogger } from "@/lib/logger";

function n8nErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("fetch failed")) {
      return "Could not reach n8n. Check N8N_VALIDATE_WEBHOOK_URL and that your n8n server is online.";
    }
    return error.message;
  }
  return "Validation failed";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getIntegrationsStatus(isSheetsConfigured());
    if (status.n8n.validateDisabledReason) {
      return NextResponse.json({ error: status.n8n.validateDisabledReason }, { status: 503 });
    }

    logger.debug("[API] POST /api/contacts/validate called");

    const n8nUrl = getN8nValidateWebhookUrl()!;
    const sheetsConfig = await getPublicSheetsConfigForN8n();
    if (!sheetsConfig) {
      return NextResponse.json({ error: "Google Sheets not configured" }, { status: 503 });
    }

    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "validate",
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

    const n8nResult = await response.json();
    const report = parseN8nValidationResponse(n8nResult);

    logger.info("[API] Validation result", {
      valid: report.valid,
      invalidContacts: report.summary.invalidContacts,
      sourcesChecked: report.summary.sourcesChecked,
    });

    return NextResponse.json(report);
  } catch (error) {
    const message = n8nErrorMessage(error);
    errorLogger("[API] POST /api/contacts/validate error", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
