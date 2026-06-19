import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getPublicSheetsConfigForN8n } from "@/lib/sheets-config-n8n";
import { ValidationResult } from "@/lib/types";
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

    logger.debug("[API] POST /api/contacts/validate called");

    const n8nUrl = process.env.N8N_WORKFLOW_A_URL;
    if (!n8nUrl) {
      throw new Error("N8N_WORKFLOW_A_URL not configured");
    }

    const sheetsConfig = await getPublicSheetsConfigForN8n();
    if (!sheetsConfig) {
      return NextResponse.json(
        { error: "Google Sheets not configured" },
        { status: 503 }
      );
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
      throw new Error(`n8n responded with status ${response.status}`);
    }

    const n8nResult = await response.json();
    const result: ValidationResult = {
      valid: n8nResult.invalidCount === 0,
      errors: (n8nResult.invalidContacts || []).flatMap(
        (c: { row: number; name: string; phone: string; errors: string[]; source?: string }) =>
          c.errors.map((err: string) =>
            `${c.source ? `[${c.source}] ` : ""}Row ${c.row} (${c.name || c.phone}): ${err}`
          )
      ),
      warnings:
        n8nResult.invalidCount > 0
          ? [`${n8nResult.invalidCount} invalid contact(s) across ${n8nResult.sourceSummaries?.length || 1} sheet(s)`]
          : [],
    };

    logger.info("[API] Validation result", result);
    return NextResponse.json({ ...result, details: n8nResult });
  } catch (error) {
    errorLogger("[API] POST /api/contacts/validate error", error);
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 500 }
    );
  }
}
