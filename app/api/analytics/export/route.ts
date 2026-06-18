import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { getSheetData } from "@/lib/sheets";
import { SHEET_TABS } from "@/lib/constants";
import logger, { errorLogger } from "@/lib/logger";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const format = request.nextUrl.searchParams.get("format") || "csv";
    logger.debug("[API] GET /api/analytics/export called", { format });

    const analyticsData = await getSheetData(`${SHEET_TABS.ANALYTICS}!A:K`);
    
    if (format === "csv") {
      // CSV export
      const csv = Papa.unparse(analyticsData);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="campaigns-${Date.now()}.csv"`,
        },
      });
    } else if (format === "excel") {
      // Excel export
      const worksheet = XLSX.utils.aoa_to_sheet(analyticsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Campaigns");
      
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="campaigns-${Date.now()}.xlsx"`,
        },
      });
    } else if (format === "pdf") {
      // PDF export (simplified text-based)
      const headers = analyticsData[0] || [];
      const rows = analyticsData.slice(1) || [];
      
      let pdfContent = "CAMPAIGN ANALYTICS REPORT\n";
      pdfContent += `Generated: ${new Date().toLocaleString()}\n\n`;
      pdfContent += headers.join("\t") + "\n";
      pdfContent += rows.map((row: any[]) => row.join("\t")).join("\n");
      
      return new NextResponse(pdfContent, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="campaigns-${Date.now()}.txt"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format" },
      { status: 400 }
    );
  } catch (error) {
    errorLogger("[API] GET /api/analytics/export error", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
