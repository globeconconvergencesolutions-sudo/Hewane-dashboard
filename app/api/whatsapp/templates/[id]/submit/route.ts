import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getMetaWhatsAppDisabledMessage, isMetaWhatsAppConfigured } from "@/lib/app-config";
import { submitWhatsAppTemplate } from "@/lib/whatsapp-templates";
import { errorLogger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isMetaWhatsAppConfigured()) {
      return NextResponse.json(
        {
          error:
            getMetaWhatsAppDisabledMessage() ??
            "Meta WhatsApp is not configured. Set WHATSAPP_WABA_ID and WHATSAPP_ACCESS_TOKEN on the server.",
        },
        { status: 503 }
      );
    }

    const { id } = await context.params;
    const template = await submitWhatsAppTemplate(id);
    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit template";
    errorLogger("[API] POST /api/whatsapp/templates/[id]/submit error", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
