import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSheetData, appendSheetData } from "@/lib/sheets";
import { MessageTemplate } from "@/lib/types";
import { SHEET_TABS } from "@/lib/constants";
import logger, { errorLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    logger.debug("[API] GET /api/templates called");

    const templatesData = await getSheetData(`${SHEET_TABS.TEMPLATES}!A:F`);
    
    // Parse templates (skip header row)
    const templates: MessageTemplate[] = templatesData.slice(1).map((row) => ({
      id: row[0] || "",
      name: row[1] || "",
      body: row[2] || "",
      variables: row[3] ? JSON.parse(row[3]) : [],
      createdAt: row[4] ? new Date(row[4]) : new Date(),
      lastUsed: row[5] ? new Date(row[5]) : undefined,
    }));

    logger.info(`[API] Returned ${templates.length} templates`);
    return NextResponse.json(templates);
  } catch (error) {
    errorLogger("[API] GET /api/templates error", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

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
    logger.debug("[API] POST /api/templates called", { name: body.name });

    const templateId = `template_${Date.now()}`;
    
    const newTemplate: MessageTemplate = {
      id: templateId,
      name: body.name,
      body: body.body,
      variables: body.variables || [],
      createdAt: new Date(),
    };

    // Append to Google Sheets
    await appendSheetData(`${SHEET_TABS.TEMPLATES}!A:F`, [
      [
        templateId,
        body.name,
        body.body,
        JSON.stringify(body.variables || []),
        new Date().toISOString(),
      ],
    ]);

    logger.info("[API] Template created", newTemplate);
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    errorLogger("[API] POST /api/templates error", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
