import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { getSheetData } from "@/lib/sheets";
import { Contact } from "@/lib/types";
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

    logger.debug("[API] GET /api/contacts called");

    const contactsData = await getSheetData(`${SHEET_TABS.CONTACTS}!A:K`);
    
    // Parse contacts (skip header row)
    const contacts: Contact[] = contactsData.slice(1).map((row) => ({
      id: row[0] || "",
      name: row[1] || "",
      phone: row[2] || "",
      email: row[3] || "",
      segment: row[4] || "",
      status: row[5] || "",
      lastSent: row[6] ? new Date(row[6]) : undefined,
      waMessageId: row[7] || "",
      error: row[8] || "",
      sendWhatsapp: row[9] || "No",
      sendEmail: row[10] || "No",
    }));

    logger.info(`[API] Returned ${contacts.length} contacts`);
    return NextResponse.json(contacts);
  } catch (error) {
    errorLogger("[API] GET /api/contacts error", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
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
    logger.debug("[API] POST /api/contacts called", { contactName: body.name });

    // TODO: Implement adding new contact
    // For now, return placeholder
    return NextResponse.json(
      { message: "Add contact endpoint - not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    errorLogger("[API] POST /api/contacts error", error);
    return NextResponse.json(
      { error: "Failed to add contact" },
      { status: 500 }
    );
  }
}
