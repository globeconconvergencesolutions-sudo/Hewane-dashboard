import { google } from "googleapis";
import { JWT } from "google-auth-library";
import logger from "@/lib/logger";

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
let jwtClient: JWT | null = null;

function initializeSheets() {
  if (sheetsClient && jwtClient) return { sheetsClient, jwtClient };

  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
    }

    // Parse the service account key (handle newlines)
    const keyData = JSON.parse(serviceAccountKey.replace(/\\n/g, "\n"));

    jwtClient = new JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    sheetsClient = google.sheets({ version: "v4", auth: jwtClient });
    logger.debug("[Sheets] Client initialized successfully");
  } catch (error) {
    logger.error("[Sheets] Failed to initialize", error);
    throw error;
  }

  return { sheetsClient, jwtClient };
}

export async function getSheetData(
  range: string,
  spreadsheetId?: string
): Promise<any[][]> {
  const { sheetsClient } = initializeSheets();
  const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;

  if (!sheetId) {
    throw new Error("GOOGLE_SHEETS_ID not configured");
  }

  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return response.data.values || [];
  } catch (error) {
    logger.error(`[Sheets] Failed to read ${range}`, error);
    throw error;
  }
}

export async function appendSheetData(
  range: string,
  values: any[][],
  spreadsheetId?: string
): Promise<void> {
  const { sheetsClient } = initializeSheets();
  const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;

  if (!sheetId) {
    throw new Error("GOOGLE_SHEETS_ID not configured");
  }

  try {
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    logger.debug(`[Sheets] Appended data to ${range}`);
  } catch (error) {
    logger.error(`[Sheets] Failed to append to ${range}`, error);
    throw error;
  }
}

export async function updateSheetData(
  range: string,
  values: any[][],
  spreadsheetId?: string
): Promise<void> {
  const { sheetsClient } = initializeSheets();
  const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;

  if (!sheetId) {
    throw new Error("GOOGLE_SHEETS_ID not configured");
  }

  try {
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    logger.debug(`[Sheets] Updated data in ${range}`);
  } catch (error) {
    logger.error(`[Sheets] Failed to update ${range}`, error);
    throw error;
  }
}

export async function clearSheetData(
  range: string,
  spreadsheetId?: string
): Promise<void> {
  const { sheetsClient } = initializeSheets();
  const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;

  if (!sheetId) {
    throw new Error("GOOGLE_SHEETS_ID not configured");
  }

  try {
    await sheetsClient.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range,
    });

    logger.debug(`[Sheets] Cleared data in ${range}`);
  } catch (error) {
    logger.error(`[Sheets] Failed to clear ${range}`, error);
    throw error;
  }
}
