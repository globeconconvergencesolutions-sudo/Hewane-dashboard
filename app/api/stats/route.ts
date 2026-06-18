import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSheetData } from "@/lib/sheets";
import { DashboardStats } from "@/lib/types";
import { SHEET_TABS } from "@/lib/constants";
import logger, { errorLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    logger.debug("[API] GET /api/stats called");

    // Get contacts count
    let totalContacts = 0;
    try {
      const contactsData = await getSheetData(`${SHEET_TABS.CONTACTS}!A:K`);
      totalContacts = Math.max(0, contactsData.length - 1); // Subtract header row
    } catch (error) {
      logger.warn("[API] Failed to fetch contacts", error);
    }

    // Get analytics data for this month
    let messagesThisMonth = 0;
    let deliveredThisMonth = 0;
    let failedThisMonth = 0;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    try {
      const analyticsData = await getSheetData(`${SHEET_TABS.ANALYTICS}!A:K`);
      // Skip header row
      analyticsData.slice(1).forEach((row) => {
        const dateStr = row[1]; // date column
        if (dateStr) {
          const date = new Date(dateStr);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            messagesThisMonth += parseInt(row[5], 10) || 0; // totalSent
            deliveredThisMonth += parseInt(row[6], 10) || 0; // delivered
            failedThisMonth += parseInt(row[7], 10) || 0; // failed
          }
        }
      });
    } catch (error) {
      logger.warn("[API] Failed to fetch analytics", error);
    }

    // Calculate success rate
    const totalProcessed = messagesThisMonth;
    const successRate =
      totalProcessed > 0
        ? `${((deliveredThisMonth / totalProcessed) * 100).toFixed(1)}%`
        : "N/A";

    // Get last sync from SyncLog
    let lastSync: Date | null = null;
    let syncHealth: "healthy" | "warning" | "error" = "healthy";
    try {
      const syncLogData = await getSheetData(`${SHEET_TABS.SYNC_LOG}!A:E`);
      if (syncLogData.length > 1) {
        const lastRow = syncLogData[syncLogData.length - 1];
        lastSync = new Date(lastRow[0]);
        const lastStatus = lastRow[3];
        syncHealth = lastStatus === "failed" ? "error" : "healthy";

        // Check if last sync was more than 24 hours ago
        const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSync > 24) {
          syncHealth = "warning";
        }
      }
    } catch (error) {
      logger.warn("[API] Failed to fetch sync log", error);
      syncHealth = "error";
    }

    const stats: DashboardStats = {
      totalContacts,
      messagesThisMonth,
      deliveredThisMonth,
      failedThisMonth,
      successRate,
      lastSync,
      syncHealth,
      workflowStatus: "running", // TODO: Check n8n status
    };

    logger.info("[API] Stats returned successfully", stats);
    return NextResponse.json(stats);
  } catch (error) {
    errorLogger("[API] GET /api/stats error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
