import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import logger from '@/lib/logger'
import { getSheetsConfig, isSheetsConfigured as configIsReady } from '@/lib/sheets-config'

let sheetsClient: ReturnType<typeof google.sheets> | null = null
let jwtClient: JWT | null = null
const tabNameCache = new Map<string, string>()

function getServiceAccountCredentials() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL

  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured')
  }

  const trimmedKey = serviceAccountKey.trim()

  if (trimmedKey.startsWith('{')) {
    const keyData = JSON.parse(trimmedKey.replace(/\\n/g, '\n'))
    return {
      email: keyData.client_email,
      key: keyData.private_key,
    }
  }

  if (!serviceAccountEmail) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL is required when GOOGLE_SERVICE_ACCOUNT_KEY contains only the private key'
    )
  }

  return {
    email: serviceAccountEmail,
    key: trimmedKey.replace(/\\n/g, '\n'),
  }
}

function initializeSheets() {
  if (sheetsClient && jwtClient) return { sheetsClient, jwtClient }

  const credentials = getServiceAccountCredentials()

  jwtClient = new JWT({
    email: credentials.email,
    key: credentials.key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  sheetsClient = google.sheets({ version: 'v4', auth: jwtClient })
  logger.debug('[Sheets] Client initialized successfully')

  return { sheetsClient, jwtClient }
}

export function isSheetsConfigured() {
  return configIsReady()
}

export async function resolveTabName(
  spreadsheetId: string,
  gid?: number,
  tab?: string
): Promise<string> {
  if (tab) return tab
  if (!gid) {
    throw new Error(`Sheet source for ${spreadsheetId} requires "tab" or "gid"`)
  }

  const cacheKey = `${spreadsheetId}:${gid}`
  const cached = tabNameCache.get(cacheKey)
  if (cached) return cached

  const { sheetsClient } = initializeSheets()
  const metadata = await sheetsClient.spreadsheets.get({ spreadsheetId })
  const match = metadata.data.sheets?.find((sheet) => sheet.properties?.sheetId === gid)

  const title = match?.properties?.title
  if (!title) {
    throw new Error(`Could not resolve tab gid ${gid} in spreadsheet ${spreadsheetId}`)
  }

  tabNameCache.set(cacheKey, title)
  return title
}

export async function listSpreadsheetTabs(spreadsheetId: string) {
  const { sheetsClient } = initializeSheets()
  const metadata = await sheetsClient.spreadsheets.get({ spreadsheetId })

  return (
    metadata.data.sheets?.map((sheet) => ({
      title: sheet.properties?.title || '',
      gid: sheet.properties?.sheetId || 0,
      index: sheet.properties?.index || 0,
    })) || []
  )
}

export async function getSheetData(
  range: string,
  spreadsheetId?: string,
  options?: { silent?: boolean }
): Promise<any[][]> {
  const config = getSheetsConfig()
  const sheetId =
    spreadsheetId ||
    config?.primarySpreadsheetId ||
    process.env.GOOGLE_SHEETS_ID?.trim()

  if (!sheetId) {
    logger.warn('[Sheets] No spreadsheet configured — returning empty data')
    return []
  }

  const { sheetsClient } = initializeSheets()

  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    })

    return response.data.values || []
  } catch (error) {
    if (options?.silent) {
      logger.debug(`[Sheets] Optional read skipped for ${range}`)
    } else {
      logger.error(`[Sheets] Failed to read ${range}`, error)
    }
    throw error
  }
}

export async function appendSheetData(
  range: string,
  values: any[][],
  spreadsheetId?: string
): Promise<void> {
  const config = getSheetsConfig()
  const sheetId =
    spreadsheetId ||
    config?.primarySpreadsheetId ||
    process.env.GOOGLE_SHEETS_ID?.trim()

  if (!sheetId) {
    throw new Error('No spreadsheet configured for write operation')
  }

  const { sheetsClient } = initializeSheets()

  try {
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    })

    logger.debug(`[Sheets] Appended data to ${range}`)
  } catch (error) {
    logger.error(`[Sheets] Failed to append to ${range}`, error)
    throw error
  }
}

export async function updateSheetData(
  range: string,
  values: any[][],
  spreadsheetId?: string
): Promise<void> {
  const config = getSheetsConfig()
  const sheetId =
    spreadsheetId ||
    config?.primarySpreadsheetId ||
    process.env.GOOGLE_SHEETS_ID?.trim()

  if (!sheetId) {
    throw new Error('No spreadsheet configured for write operation')
  }

  const { sheetsClient } = initializeSheets()

  try {
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    })

    logger.debug(`[Sheets] Updated data in ${range}`)
  } catch (error) {
    logger.error(`[Sheets] Failed to update ${range}`, error)
    throw error
  }
}

export async function clearSheetData(
  range: string,
  spreadsheetId?: string
): Promise<void> {
  const config = getSheetsConfig()
  const sheetId =
    spreadsheetId ||
    config?.primarySpreadsheetId ||
    process.env.GOOGLE_SHEETS_ID?.trim()

  if (!sheetId) {
    throw new Error('No spreadsheet configured for write operation')
  }

  const { sheetsClient } = initializeSheets()

  try {
    await sheetsClient.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range,
    })

    logger.debug(`[Sheets] Cleared data in ${range}`)
  } catch (error) {
    logger.error(`[Sheets] Failed to clear ${range}`, error)
    throw error
  }
}
