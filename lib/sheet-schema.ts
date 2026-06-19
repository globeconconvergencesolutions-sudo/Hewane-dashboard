import type { SheetSourceConfig } from '@/lib/sheets-config'

/** How contact rows are laid out in a spreadsheet tab. */
export type SheetSchemaType = 'hewane' | 'google-contacts' | 'custom'

export type ContactField =
  | 'id'
  | 'name'
  | 'phone'
  | 'email'
  | 'segment'
  | 'status'
  | 'lastSent'
  | 'waMessageId'
  | 'error'
  | 'sendWhatsapp'
  | 'sendEmail'

/** Recommended Hewane tab headers (row 1). Works with positional columns A:K. */
export const HEWANE_CONTACT_HEADERS: Record<ContactField, string> = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  segment: 'segment',
  status: 'status',
  lastSent: 'lastSent',
  waMessageId: 'waMessageId',
  error: 'error',
  sendWhatsapp: 'sendWhatsapp',
  sendEmail: 'sendEmail',
}

/** Alternate Hewane headers (title case) still seen in older docs/workflows. */
export const HEWANE_CONTACT_HEADER_ALIASES: Record<ContactField, string[]> = {
  id: ['id', 'ID', 'Id'],
  name: ['name', 'Name'],
  phone: ['phone', 'Phone'],
  email: ['email', 'Email'],
  segment: ['segment', 'Segment'],
  status: ['status', 'Status'],
  lastSent: ['lastSent', 'Last Sent', 'last sent'],
  waMessageId: ['waMessageId', 'WA Message ID', 'Wa Message Id'],
  error: ['error', 'Error'],
  sendWhatsapp: ['sendWhatsapp', 'Send Whatsapp', 'Send WhatsApp'],
  sendEmail: ['sendEmail', 'Send Email'],
}

/** Common Google Contacts export header names (varies by export). */
export const GOOGLE_CONTACTS_HEADER_ALIASES: Partial<Record<ContactField, string[]>> = {
  name: ['Phonetic First Name', 'Name', 'name', 'Given Name'],
  phone: ['Phone 1 - Value', 'Phone number', 'Phone', 'phone', 'Mobile Phone'],
  email: ['E-mail 1 - Value', 'Email', 'email'],
}

export type SheetSourceConfigWithSchema = SheetSourceConfig & {
  schema?: SheetSchemaType
  /** Maps logical field → exact header text in row 1 (for n8n object reads/writes). */
  headers?: Partial<Record<ContactField, string>>
}

export function resolveSchema(source: SheetSourceConfigWithSchema): SheetSchemaType {
  if (source.schema) return source.schema
  if (source.headers && Object.keys(source.headers).length > 0) return 'custom'
  if (source.columns && Object.keys(source.columns).length > 0) return 'custom'
  return 'hewane'
}

/** Header names to try when reading a row object (n8n) or building writes. */
export function getFieldHeaderCandidates(
  field: ContactField,
  source: SheetSourceConfigWithSchema
): string[] {
  const candidates: string[] = []

  const custom = source.headers?.[field]
  if (custom) candidates.push(custom)

  const schema = resolveSchema(source)

  if (schema === 'google-contacts') {
    candidates.push(...(GOOGLE_CONTACTS_HEADER_ALIASES[field] || []))
  }

  candidates.push(...HEWANE_CONTACT_HEADER_ALIASES[field])
  candidates.push(HEWANE_CONTACT_HEADERS[field])

  return [...new Set(candidates.filter(Boolean))]
}

/** Primary header used when writing a field back to the sheet. */
export function getWriteHeader(
  field: ContactField,
  source: SheetSourceConfigWithSchema
): string {
  return getFieldHeaderCandidates(field, source)[0] || HEWANE_CONTACT_HEADERS[field]
}

/** Enrich source config sent to n8n with resolved schema metadata. */
export function enrichSourceForN8n(source: SheetSourceConfigWithSchema) {
  const schema = resolveSchema(source)
  const writeHeaders = Object.fromEntries(
    (Object.keys(HEWANE_CONTACT_HEADERS) as ContactField[]).map((field) => [
      field,
      getWriteHeader(field, source),
    ])
  )

  return {
    ...source,
    schema,
    writeHeaders,
  }
}
