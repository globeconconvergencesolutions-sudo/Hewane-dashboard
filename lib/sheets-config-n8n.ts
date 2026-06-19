import { getSheetsConfig, type SheetSourceConfig, type SheetsConfig } from '@/lib/sheets-config'
import { resolveTabName } from '@/lib/sheets'
import { enrichSourceForN8n } from '@/lib/sheet-schema'

async function withResolvedTab(source: SheetSourceConfig): Promise<SheetSourceConfig> {
  const tab = source.tab || (await resolveTabName(source.spreadsheetId, source.gid, source.tab))
  return enrichSourceForN8n({ ...source, tab })
}

async function resolveSources(sources: SheetSourceConfig[]) {
  return Promise.all(sources.map(withResolvedTab))
}

/** Sheets config with tab names resolved for n8n (Google Sheets node needs tab name, not gid). */
export async function getPublicSheetsConfigForN8n(): Promise<SheetsConfig | null> {
  const config = getSheetsConfig()
  if (!config) return null

  const [contacts, analytics, templates, syncLog] = await Promise.all([
    resolveSources(config.contacts),
    resolveSources(config.analytics),
    resolveSources(config.templates),
    resolveSources(config.syncLog),
  ])

  return {
    primarySpreadsheetId: config.primarySpreadsheetId,
    contacts,
    analytics,
    templates,
    syncLog,
  }
}
