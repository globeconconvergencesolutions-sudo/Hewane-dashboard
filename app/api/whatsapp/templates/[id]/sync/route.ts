import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { isMetaWhatsAppConfigured } from "@/lib/app-config";
import { syncWhatsAppTemplateStatus } from "@/lib/whatsapp-templates";
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
            "Meta WhatsApp is not configured. Set WHATSAPP_WABA_ID and WHATSAPP_ACCESS_TOKEN on the server.",
        },
        { status: 503 }
      );
    }

    const { id } = await context.params;
    const template = await syncWhatsAppTemplateStatus(id);
    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync template status";
    errorLogger("[API] POST /api/whatsapp/templates/[id]/sync error", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
