import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getIntegrationsStatus, getIntegrationsStatusWithVerification } from "@/lib/app-config";
import { isSheetsConfigured } from "@/lib/sheets-config";

export async function POST() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetsConfigured = isSheetsConfigured();
  const base = getIntegrationsStatus(sheetsConfigured);

  if (!base.meta.credentialsReady) {
    return NextResponse.json(
      {
        error: "Meta WhatsApp credentials are not ready.",
        details: base.meta.disabledReason,
        meta: base.meta,
      },
      { status: 400 }
    );
  }

  const integrations = await getIntegrationsStatusWithVerification(sheetsConfigured, true);

  if (!integrations.meta.verified) {
    return NextResponse.json(
      {
        error: "Meta WhatsApp connection test failed.",
        details: integrations.meta.verifyError,
        meta: integrations.meta,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: integrations.meta.wabaName
      ? `Connected to ${integrations.meta.wabaName} on Meta.`
      : "Meta WhatsApp connection verified.",
    meta: integrations.meta,
  });
}
