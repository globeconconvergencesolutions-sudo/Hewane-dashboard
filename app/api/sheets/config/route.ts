import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getPublicSheetsConfig } from '@/lib/sheets-config'
import { listSpreadsheetTabs } from '@/lib/sheets'
import logger, { errorLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = getPublicSheetsConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'Google Sheets not configured' },
        { status: 503 }
      )
    }

    logger.debug('[API] GET /api/sheets/config called')

    const spreadsheetIds = Array.from(
      new Set([
        ...(config.primarySpreadsheetId ? [config.primarySpreadsheetId] : []),
        ...config.contacts.map((s) => s.spreadsheetId),
        ...config.analytics.map((s) => s.spreadsheetId),
        ...config.templates.map((s) => s.spreadsheetId),
        ...config.syncLog.map((s) => s.spreadsheetId),
      ])
    )

    const tabsBySpreadsheet: Record<string, Awaited<ReturnType<typeof listSpreadsheetTabs>>> = {}

    for (const spreadsheetId of spreadsheetIds) {
      try {
        tabsBySpreadsheet[spreadsheetId] = await listSpreadsheetTabs(spreadsheetId)
      } catch (error) {
        logger.warn(`[API] Could not list tabs for ${spreadsheetId}`, error)
        tabsBySpreadsheet[spreadsheetId] = []
      }
    }

    return NextResponse.json({
      config,
      tabsBySpreadsheet,
    })
  } catch (error) {
    errorLogger('[API] GET /api/sheets/config error', error)
    return NextResponse.json({ error: 'Failed to load sheets config' }, { status: 500 })
  }
}
