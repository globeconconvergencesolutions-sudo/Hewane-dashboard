import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getIntegrationsStatus } from "@/lib/app-config";
import { isSheetsConfigured } from "@/lib/sheets-config";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getIntegrationsStatus(isSheetsConfigured()));
}
