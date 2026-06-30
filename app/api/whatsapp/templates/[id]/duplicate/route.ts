import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { duplicateWhatsAppTemplate } from "@/lib/whatsapp-templates";
import { errorLogger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const template = await duplicateWhatsAppTemplate(session.user.id, id);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to duplicate template";
    errorLogger("[API] POST /api/whatsapp/templates/[id]/duplicate error", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
