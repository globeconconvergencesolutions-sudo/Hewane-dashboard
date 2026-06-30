import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { listWhatsAppTemplates } from "@/lib/whatsapp-templates";
import { errorLogger } from "@/lib/logger";

/** @deprecated Use GET /api/whatsapp/templates */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await listWhatsAppTemplates();
    const legacy = templates.map((t) => ({
      id: t.id,
      name: t.displayName,
      body: t.body,
      variables: t.variableMapping.map((v) => v.meta),
      createdAt: t.createdAt,
      lastUsed: t.approvedAt ?? undefined,
      status: t.status,
      metaTemplateName: t.metaTemplateName,
    }));

    return NextResponse.json(legacy);
  } catch (error) {
    errorLogger("[API] GET /api/templates error", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

/** @deprecated Use POST /api/whatsapp/templates */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Use POST /api/whatsapp/templates to create Meta message templates." },
    { status: 410 }
  );
}
