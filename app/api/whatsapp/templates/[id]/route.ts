import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getWhatsAppTemplateById, updateWhatsAppTemplate } from "@/lib/whatsapp-templates";
import { errorLogger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const template = await getWhatsAppTemplateById(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    errorLogger("[API] GET /api/whatsapp/templates/[id] error", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const template = await updateWhatsAppTemplate(id, body);
    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update template";
    errorLogger("[API] PATCH /api/whatsapp/templates/[id] error", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
