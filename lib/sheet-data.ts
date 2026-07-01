import {
  appendSheetData,
  getSheetData,
  resolveTabName,
} from '@/lib/sheets'
import {
  buildA1Range,
  getPrimaryWriteSource,
  getSourcesForType,
  type SheetDataType,
  type SheetSourceConfig,
} from '@/lib/sheets-config'
import { resolveSchema } from '@/lib/sheet-schema'
import { GOOGLE_SHEETS_COLUMNS, SHEET_TABS } from '@/lib/constants'
import type { Campaign, Contact, MessageTemplate, SyncLog } from '@/lib/types'
import logger from '@/lib/logger'

type Row = string[]

const CONTACT_COLUMN_KEYS = GOOGLE_SHEETS_COLUMNS[SHEET_TABS.CONTACTS]
const ANALYTICS_COLUMN_KEYS = GOOGLE_SHEETS_COLUMNS[SHEET_TABS.ANALYTICS]
const TEMPLATE_COLUMN_KEYS = GOOGLE_SHEETS_COLUMNS[SHEET_TABS.TEMPLATES]
const SYNC_LOG_COLUMN_KEYS = GOOGLE_SHEETS_COLUMNS[SHEET_TABS.SYNC_LOG]

function getColumnIndex(
  key: string,
  defaults: string[],
  overrides?: Partial<Record<string, number>>,
  schema?: ReturnType<typeof resolveSchema>
) {
  if (overrides && key in overrides && overrides[key] !== undefined) {
    return overrides[key] as number
  }
  if (schema === 'google-contacts' || schema === 'custom') {
    return -1
  }
  return defaults.indexOf(key)
}

function cell(row: Row, index: number) {
  return index >= 0 ? row[index] || '' : ''
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function formatKenyaPhone(phone: string) {
  let digits = phone.replace(/\D/g, '')
  if (!digits) return phone
  if (digits.startsWith('0') && digits.length === 10) digits = '254' + digits.slice(1)
  else if (digits.length === 9 && !digits.startsWith('254')) digits = '254' + digits
  return digits
}

async function fetchSourceRows(source: SheetSourceConfig, silent = false): Promise<Row[]> {
  const tab = await resolveTabName(source.spreadsheetId, source.gid, source.tab)
  const range = buildA1Range(tab, source.range || 'A:Z')
  try {
    return await getSheetData(range, source.spreadsheetId, { silent })
  } catch {
    return []
  }
}

async function fetchAllSourceRows(
  dataType: SheetDataType,
  options?: { silent?: boolean }
): Promise<Array<{ source: SheetSourceConfig; rows: Row[] }>> {
  const sources = getSourcesForType(dataType)
  if (sources.length === 0) return []

  const silent = options?.silent ?? false
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const rows = await fetchSourceRows(source, silent)
        return { source, rows }
      } catch (error) {
        if (!silent) {
          logger.warn(`[Sheets] Failed to read ${dataType} from ${source.label}`, error)
        }
        return { source, rows: [] as Row[] }
      }
    })
  )
  return results
}

export function parseContactRow(
  row: Row,
  source: SheetSourceConfig,
  rowNumber: number
): Contact | null {
  const columns = source.columns || {}
  const schema = resolveSchema(source)
  const col = (field: string) =>
    getColumnIndex(field, CONTACT_COLUMN_KEYS, columns, schema)

  const rawName = cell(row, col('name'))
  const rawPhone = cell(row, col('phone'))

  if (!rawName && !rawPhone) return null

  const phone = rawPhone ? formatKenyaPhone(rawPhone) : ''
  const name = rawName || (phone ? `Contact ${phone.slice(-4)}` : '')

  const defaultSendWhatsapp = schema === 'hewane' ? 'No' : 'Yes'
  const defaultSendEmail = schema === 'hewane' ? 'No' : 'Yes'

  const id = cell(row, col('id')) || `${source.spreadsheetId}:${rowNumber}`

  return {
    id,
    name,
    phone,
    email: cell(row, col('email')) || undefined,
    segment: cell(row, col('segment')),
    status: (cell(row, col('status')) || '') as Contact['status'],
    lastSent: (() => {
      const value = cell(row, col('lastSent'))
      return value ? new Date(value) : undefined
    })(),
    waMessageId: cell(row, col('waMessageId')) || undefined,
    error: cell(row, col('error')) || undefined,
    sendWhatsapp: (cell(row, col('sendWhatsapp')) || defaultSendWhatsapp) as Contact['sendWhatsapp'],
    sendEmail: (cell(row, col('sendEmail')) || defaultSendEmail) as Contact['sendEmail'],
    sourceSpreadsheetId: source.spreadsheetId,
    sourceLabel: source.label,
    sourceTab: source.tab,
  }
}

export async function getAllContacts(): Promise<Contact[]> {
  const batches = await fetchAllSourceRows('contacts')
  const merged = new Map<string, Contact>()

  for (const { source, rows } of batches) {
    rows.slice(1).forEach((row, index) => {
      const contact = parseContactRow(row, source, index + 2)
      if (!contact) return

      const dedupeKey =
        normalizePhone(contact.phone) ||
        `${contact.sourceSpreadsheetId}:${contact.id}`

      if (!merged.has(dedupeKey)) {
        merged.set(dedupeKey, contact)
      }
    })
  }

  return Array.from(merged.values())
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  const batches = await fetchAllSourceRows('analytics', { silent: true })
  const campaigns: Campaign[] = []

  for (const { source, rows } of batches) {
    rows.slice(1).forEach((row, index) => {
      const rowNumber = index + 2
      const campaignName = cell(row, getColumnIndex('campaignName', ANALYTICS_COLUMN_KEYS))
      const dateRaw = cell(row, getColumnIndex('date', ANALYTICS_COLUMN_KEYS))
      const idRaw = cell(row, getColumnIndex('id', ANALYTICS_COLUMN_KEYS))
      const totalSent =
        parseInt(cell(row, getColumnIndex('totalSent', ANALYTICS_COLUMN_KEYS)), 10) || 0

      if (!campaignName && !idRaw && !dateRaw && totalSent === 0) return

      campaigns.push({
        id: idRaw || `${source.spreadsheetId}:${rowNumber}`,
        date: dateRaw ? new Date(dateRaw) : new Date(0),
        time: cell(row, getColumnIndex('time', ANALYTICS_COLUMN_KEYS)),
        campaignName: campaignName || `Campaign ${rowNumber}`,
        messageType: (cell(row, getColumnIndex('messageType', ANALYTICS_COLUMN_KEYS)) ||
          'custom') as Campaign['messageType'],
        totalSent,
        delivered: parseInt(cell(row, getColumnIndex('delivered', ANALYTICS_COLUMN_KEYS)), 10) || 0,
        failed: parseInt(cell(row, getColumnIndex('failed', ANALYTICS_COLUMN_KEYS)), 10) || 0,
        emailFallback:
          parseInt(cell(row, getColumnIndex('emailFallback', ANALYTICS_COLUMN_KEYS)), 10) || 0,
        successRate: cell(row, getColumnIndex('successRate', ANALYTICS_COLUMN_KEYS)) || '0%',
        contactGroup: cell(row, getColumnIndex('contactGroup', ANALYTICS_COLUMN_KEYS)) || 'All',
      })
    })
  }

  return campaigns.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function getAllTemplates(): Promise<MessageTemplate[]> {
  const batches = await fetchAllSourceRows('templates')
  const templates: MessageTemplate[] = []

  for (const { rows } of batches) {
    rows.slice(1).forEach((row) => {
      const variablesRaw = cell(row, getColumnIndex('variables', TEMPLATE_COLUMN_KEYS))
      let variables: string[] = []
      if (variablesRaw) {
        try {
          variables = JSON.parse(variablesRaw)
        } catch {
          variables = variablesRaw.split(',').map((v) => v.trim()).filter(Boolean)
        }
      }

      templates.push({
        id: cell(row, getColumnIndex('id', TEMPLATE_COLUMN_KEYS)),
        name: cell(row, getColumnIndex('name', TEMPLATE_COLUMN_KEYS)),
        body: cell(row, getColumnIndex('body', TEMPLATE_COLUMN_KEYS)),
        variables,
        createdAt: (() => {
          const value = cell(row, getColumnIndex('createdAt', TEMPLATE_COLUMN_KEYS))
          return value ? new Date(value) : new Date()
        })(),
        lastUsed: (() => {
          const value = cell(row, getColumnIndex('lastUsed', TEMPLATE_COLUMN_KEYS))
          return value ? new Date(value) : undefined
        })(),
      })
    })
  }

  return templates
}

export async function getAllSyncLogs(): Promise<SyncLog[]> {
  const batches = await fetchAllSourceRows('syncLog', { silent: true })
  const logs: SyncLog[] = []

  for (const { rows } of batches) {
    rows.slice(1).forEach((row) => {
      logs.push({
        timestamp: new Date(cell(row, getColumnIndex('timestamp', SYNC_LOG_COLUMN_KEYS))),
        action: cell(row, getColumnIndex('action', SYNC_LOG_COLUMN_KEYS)) as SyncLog['action'],
        contactsAffected:
          parseInt(cell(row, getColumnIndex('contactsAffected', SYNC_LOG_COLUMN_KEYS)), 10) || 0,
        status: cell(row, getColumnIndex('status', SYNC_LOG_COLUMN_KEYS)) as SyncLog['status'],
        error: cell(row, getColumnIndex('error', SYNC_LOG_COLUMN_KEYS)) || undefined,
      })
    })
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export async function appendTemplateRow(values: string[]) {
  const source = getPrimaryWriteSource('templates')
  if (!source) throw new Error('No templates sheet configured')

  const tab = await resolveTabName(source.spreadsheetId, source.gid, source.tab)
  await appendSheetData(buildA1Range(tab, source.range || 'A:F'), [values], source.spreadsheetId)
}

export async function getContactSourceCount(): Promise<number> {
  const batches = await fetchAllSourceRows('contacts')
  return batches.reduce((total, batch) => total + Math.max(0, batch.rows.length - 1), 0)
}

export async function getLatestSyncLog(): Promise<SyncLog | null> {
  const logs = await getAllSyncLogs()
  return logs[0] ?? null
}

export async function getAnalyticsExportRows(): Promise<Row[]> {
  const batches = await fetchAllSourceRows('analytics', { silent: true })
  const combined: Row[] = []

  for (const { rows } of batches) {
    if (rows.length === 0) continue
    if (combined.length === 0) {
      combined.push(...rows)
    } else {
      combined.push(...rows.slice(1))
    }
  }

  return combined
}
