import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { getSheetData } from "@/lib/sheets";
import { Campaign } from "@/lib/types";
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

    logger.debug("[API] GET /api/analytics called");

    const analyticsData = await getSheetData(`${SHEET_TABS.ANALYTICS}!A:K`);
    
    // Parse campaigns (skip header row)
    const campaigns: Campaign[] = analyticsData.slice(1).map((row) => ({
      id: row[0] || "",
      date: row[1] ? new Date(row[1]) : new Date(),
      time: row[2] || "",
      campaignName: row[3] || "",
      messageType: row[4] as "template" | "custom",
      totalSent: parseInt(row[5], 10) || 0,
      delivered: parseInt(row[6], 10) || 0,
      failed: parseInt(row[7], 10) || 0,
      emailFallback: parseInt(row[8], 10) || 0,
      successRate: row[9] || "0%",
      contactGroup: row[10] || "",
    }));

    logger.info(`[API] Returned ${campaigns.length} campaigns`);
    return NextResponse.json(campaigns);
  } catch (error) {
    errorLogger("[API] GET /api/analytics error", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
