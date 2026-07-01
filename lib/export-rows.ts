import { GOOGLE_SHEETS_COLUMNS, SHEET_TABS } from '@/lib/constants'
import type { Contact, MessageTemplate } from '@/lib/types'
import type { ContactValidationReport } from '@/lib/validation'
import type { WhatsAppTemplateRecord } from '@/lib/whatsapp-template-types'
import type { ExportTable } from '@/lib/export-formats'

const CONTACT_HEADERS = GOOGLE_SHEETS_COLUMNS[SHEET_TABS.CONTACTS]

function formatDate(value?: Date | string | null) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

export function buildContactsExportTable(contacts: Contact[]): ExportTable {
  return {
    title: 'Hewane Contacts Export',
    sheetName: 'Contacts',
    filenameBase: 'hewane-contacts',
    headers: [...CONTACT_HEADERS, 'sourceLabel', 'sourceTab'],
    rows: contacts.map((contact) => [
      contact.id,
      contact.name,
      contact.phone,
      contact.email || '',
      contact.segment || '',
      contact.status || '',
      formatDate(contact.lastSent),
      contact.waMessageId || '',
      contact.error || '',
      contact.sendWhatsapp,
      contact.sendEmail,
      contact.sourceLabel || '',
      contact.sourceTab || '',
    ]),
  }
}

export function buildValidationExportTable(report: ContactValidationReport): ExportTable {
  const headers = [
    'Source',
    'Tab',
    'Spreadsheet ID',
    'Issue Type',
    'Row',
    'Name',
    'Phone',
    'Issue',
  ]

  const rows: string[][] = []

  for (const source of report.sources) {
    for (const row of source.invalid) {
      rows.push([
        source.label,
        source.tab,
        source.spreadsheetId,
        'Invalid',
        String(row.row),
        row.name || '',
        row.rawPhone || '',
        row.issue || '',
      ])
    }
    for (const row of source.dupes) {
      rows.push([
        source.label,
        source.tab,
        source.spreadsheetId,
        'Duplicate',
        row.row != null ? String(row.row) : '',
        row.name || '',
        row.rawPhone || '',
        row.issue || 'Duplicate phone',
      ])
    }
  }

  if (rows.length === 0) {
    rows.push([
      'Summary',
      '',
      '',
      report.valid ? 'Passed' : 'Issues found',
      '',
      '',
      '',
      report.overallHealth,
    ])
  }

  return {
    title: 'Hewane Validation Report',
    sheetName: 'Validation',
    filenameBase: 'hewane-validation-report',
    headers,
    rows,
  }
}

export function buildSheetTemplatesExportTable(templates: MessageTemplate[]): ExportTable {
  return {
    title: 'Hewane Message Templates',
    sheetName: 'Templates',
    filenameBase: 'hewane-sheet-templates',
    headers: ['id', 'name', 'body', 'variables', 'createdAt', 'lastUsed'],
    rows: templates.map((template) => [
      template.id,
      template.name,
      template.body,
      JSON.stringify(template.variables),
      formatDate(template.createdAt),
      formatDate(template.lastUsed),
    ]),
  }
}

export function buildWhatsAppTemplatesExportTable(
  templates: WhatsAppTemplateRecord[]
): ExportTable {
  return {
    title: 'Hewane WhatsApp Templates',
    sheetName: 'WhatsApp Templates',
    filenameBase: 'hewane-whatsapp-templates',
    headers: [
      'id',
      'displayName',
      'metaTemplateName',
      'status',
      'category',
      'language',
      'body',
      'submittedAt',
      'approvedAt',
      'rejectionReason',
    ],
    rows: templates.map((template) => [
      template.id,
      template.displayName,
      template.metaTemplateName,
      template.status,
      template.category,
      template.language,
      template.body,
      formatDate(template.submittedAt),
      formatDate(template.approvedAt),
      template.rejectionReason || '',
    ]),
  }
}

export function buildAnalyticsExportTable(headers: string[], rows: string[][]): ExportTable {
  return {
    title: 'Hewane Campaign Analytics Report',
    sheetName: 'Campaigns',
    filenameBase: 'hewane-campaigns',
    headers,
    rows,
  }
}
