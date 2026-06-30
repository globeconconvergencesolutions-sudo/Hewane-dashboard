import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { isMetaWhatsAppConfigured } from "@/lib/app-config";
import {
  createWhatsAppTemplate,
  listWhatsAppTemplates,
  syncAllPendingWhatsAppTemplates,
} from "@/lib/whatsapp-templates";
import type { WhatsAppTemplateStatus } from "@/lib/whatsapp-template-types";
import logger, { errorLogger } from "@/lib/logger";

const VALID_STATUSES = new Set<WhatsAppTemplateStatus>([
  "draft",
  "pending",
  "approved",
  "rejected",
  "paused",
]);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const statusParam = request.nextUrl.searchParams.get("status");
    const syncPending = request.nextUrl.searchParams.get("syncPending") === "true";

    if (syncPending && isMetaWhatsAppConfigured()) {
      await syncAllPendingWhatsAppTemplates();
    }

    const status =
      statusParam && VALID_STATUSES.has(statusParam as WhatsAppTemplateStatus)
        ? (statusParam as WhatsAppTemplateStatus)
        : undefined;

    const templates = await listWhatsAppTemplates(status);
    logger.debug("[API] GET /api/whatsapp/templates", { count: templates.length, status });
    return NextResponse.json(templates);
  } catch (error) {
    errorLogger("[API] GET /api/whatsapp/templates error", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const template = await createWhatsAppTemplate(session.user.id, {
      displayName: body.displayName,
      metaTemplateName: body.metaTemplateName,
      body: body.body,
      category: body.category,
      language: body.language,
      variableMapping: body.variableMapping,
      exampleValues: body.exampleValues,
    });

    logger.info("[API] WhatsApp template draft created", { id: template.id });
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create template";
    errorLogger("[API] POST /api/whatsapp/templates error", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
