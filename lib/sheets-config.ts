import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { SHEET_TABS } from '@/lib/constants'
import type { ContactField, SheetSchemaType } from '@/lib/sheet-schema'

export type SheetDataType = 'contacts' | 'analytics' | 'templates' | 'syncLog'

export type SheetSourceConfig = {
  /** Google Spreadsheet ID (from the /d/{id}/edit URL) */
  spreadsheetId: string
  /** Tab name, e.g. "Contacts" — use this OR gid */
  tab?: string
  /** Tab gid from URL #gid= — resolved to tab name at runtime if tab is omitted */
  gid?: number
  /** Column range within the tab, e.g. "A:K" */
  range?: string
  /** Human-readable label shown in the UI */
  label?: string
  /**
   * Row layout preset:
   * - hewane: recommended A:K columns (id, name, phone, …)
   * - google-contacts: Google Contacts export headers
   * - custom: use headers/columns overrides below
   */
  schema?: SheetSchemaType
  /** Maps logical field → exact header cell text in row 1 (for n8n + non-standard sheets) */
  headers?: Partial<Record<ContactField, string>>
  /** Optional per-source column index overrides (0-based positional reads in dashboard) */
  columns?: Partial<Record<string, number>>
}

export type SheetsConfig = {
  /** Used for writes (new templates, sync log) when type-specific sources are not set */
  primarySpreadsheetId?: string
  contacts: SheetSourceConfig[]
  analytics: SheetSourceConfig[]
  templates: SheetSourceConfig[]
  syncLog: SheetSourceConfig[]
}

const DEFAULT_RANGES: Record<SheetDataType, string> = {
  contacts: 'A:K',
  analytics: 'A:K',
  templates: 'A:F',
  syncLog: 'A:E',
}

const DEFAULT_TABS: Record<SheetDataType, string> = {
  contacts: SHEET_TABS.CONTACTS,
  analytics: SHEET_TABS.ANALYTICS,
  templates: SHEET_TABS.TEMPLATES,
  syncLog: SHEET_TABS.SYNC_LOG,
}

function normalizeSource(
  source: SheetSourceConfig,
  dataType: SheetDataType
): SheetSourceConfig {
  return {
    ...source,
    range: source.range || DEFAULT_RANGES[dataType],
    label: source.label || source.tab || source.spreadsheetId,
  }
}

function legacyFallbackConfig(): SheetsConfig | null {
  const legacyId = process.env.GOOGLE_SHEETS_ID?.trim()
  if (!legacyId) return null

  const legacySource = (tab: string, dataType: SheetDataType): SheetSourceConfig => ({
    spreadsheetId: legacyId,
    tab,
    range: DEFAULT_RANGES[dataType],
  })

  return {
    primarySpreadsheetId: legacyId,
    contacts: [legacySource(SHEET_TABS.CONTACTS, 'contacts')],
    analytics: [legacySource(SHEET_TABS.ANALYTICS, 'analytics')],
    templates: [legacySource(SHEET_TABS.TEMPLATES, 'templates')],
    syncLog: [legacySource(SHEET_TABS.SYNC_LOG, 'syncLog')],
  }
}

function loadConfigFile(): Partial<SheetsConfig> | null {
  const configPath = resolve(process.cwd(), 'sheets.config.json')
  if (!existsSync(configPath)) return null

  try {
    return JSON.parse(readFileSync(configPath, 'utf8')) as Partial<SheetsConfig>
  } catch {
    return null
  }
}

function loadEnvConfig(): Partial<SheetsConfig> | null {
  const raw = process.env.GOOGLE_SHEETS_CONFIG?.trim()
  if (!raw) return null

  try {
    return JSON.parse(raw) as Partial<SheetsConfig>
  } catch {
    throw new Error('GOOGLE_SHEETS_CONFIG is set but contains invalid JSON')
  }
}

function mergeConfig(
  base: Partial<SheetsConfig> | null,
  override: Partial<SheetsConfig> | null
): SheetsConfig | null {
  if (!base && !override) return null

  return {
    primarySpreadsheetId:
      override?.primarySpreadsheetId ||
      base?.primarySpreadsheetId ||
      override?.contacts?.[0]?.spreadsheetId ||
      base?.contacts?.[0]?.spreadsheetId,
    contacts: override?.contacts ?? base?.contacts ?? [],
    analytics: override?.analytics ?? base?.analytics ?? [],
    templates: override?.templates ?? base?.templates ?? [],
    syncLog: override?.syncLog ?? base?.syncLog ?? [],
  }
}

let cachedConfig: SheetsConfig | null | undefined

export function getSheetsConfig(): SheetsConfig | null {
  if (cachedConfig !== undefined) return cachedConfig

  const fileConfig = loadConfigFile()
  const envConfig = loadEnvConfig()
  const merged = mergeConfig(fileConfig, envConfig) || legacyFallbackConfig()

  if (!merged) {
    cachedConfig = null
    return null
  }

  // Fill operational tabs from primary spreadsheet when not explicitly configured
  const primaryId = merged.primarySpreadsheetId || merged.contacts[0]?.spreadsheetId

  for (const dataType of ['analytics', 'templates', 'syncLog'] as const) {
    if (merged[dataType].length === 0 && primaryId) {
      merged[dataType] = [
        {
          spreadsheetId: primaryId,
          tab: DEFAULT_TABS[dataType],
          range: DEFAULT_RANGES[dataType],
          label: DEFAULT_TABS[dataType],
        },
      ]
    }
  }

  cachedConfig = {
    ...merged,
    contacts: merged.contacts.map((s) => normalizeSource(s, 'contacts')),
    analytics: merged.analytics.map((s) => normalizeSource(s, 'analytics')),
    templates: merged.templates.map((s) => normalizeSource(s, 'templates')),
    syncLog: merged.syncLog.map((s) => normalizeSource(s, 'syncLog')),
  }

  return cachedConfig
}

export function isSheetsConfigured(): boolean {
  const config = getSheetsConfig()
  return Boolean(config && config.contacts.length > 0)
}

export function getSourcesForType(dataType: SheetDataType): SheetSourceConfig[] {
  const config = getSheetsConfig()
  if (!config) return []
  return config[dataType]
}

export function getPrimaryWriteSource(dataType: SheetDataType): SheetSourceConfig | null {
  const sources = getSourcesForType(dataType)
  if (sources.length > 0) return sources[0]

  const config = getSheetsConfig()
  if (!config?.primarySpreadsheetId) return null

  return normalizeSource(
    {
      spreadsheetId: config.primarySpreadsheetId,
      tab: DEFAULT_TABS[dataType],
      range: DEFAULT_RANGES[dataType],
    },
    dataType
  )
}

/** Public config for n8n / settings (no secrets) */
export function getPublicSheetsConfig() {
  const config = getSheetsConfig()
  if (!config) return null

  return {
    primarySpreadsheetId: config.primarySpreadsheetId,
    contacts: config.contacts,
    analytics: config.analytics,
    templates: config.templates,
    syncLog: config.syncLog,
  }
}

export function buildA1Range(tab: string, range: string) {
  return `'${tab.replace(/'/g, "''")}'!${range}`
}
