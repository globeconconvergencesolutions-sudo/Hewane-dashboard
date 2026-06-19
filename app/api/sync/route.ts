import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getPublicSheetsConfigForN8n } from '@/lib/sheets-config-n8n'
import { invalidateContactsCache } from '@/lib/contacts-cache'
import { getAllContacts } from '@/lib/sheet-data'
import type { Contact } from '@/lib/types'
import logger, { errorLogger } from '@/lib/logger'

function toN8nContact(contact: Contact) {
  return {
    name: contact.name || contact.phone || 'Contact',
    phone: contact.phone,
    email: contact.email || '',
    segment: contact.segment || 'General',
    sendWhatsapp: contact.sendWhatsapp === 'Yes' ? 'yes' : 'no',
    sendEmail: contact.sendEmail === 'Yes' ? 'yes' : 'no',
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug('[API] POST /api/sync called')

    const n8nUrl = process.env.N8N_WORKFLOW_A_URL
    if (!n8nUrl) {
      throw new Error('N8N_WORKFLOW_A_URL not configured')
    }

    const sheetsConfig = await getPublicSheetsConfigForN8n()
    if (!sheetsConfig) {
      return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 503 })
    }

    const contacts = await getAllContacts()
    const sourceResults = []

    for (const source of sheetsConfig.contacts) {
      const sourceContacts = contacts
        .filter((contact) => contact.sourceSpreadsheetId === source.spreadsheetId)
        .map(toN8nContact)

      if (sourceContacts.length === 0) {
        sourceResults.push({
          source: source.label,
          spreadsheetId: source.spreadsheetId,
          skipped: true,
          reason: 'No contacts loaded for this source',
        })
        continue
      }

      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          timestamp: new Date().toISOString(),
          sheetId: source.spreadsheetId,
          sheetTab: source.tab,
          contacts: sourceContacts,
          sheetsConfig,
        }),
      })

      if (!response.ok) {
        throw new Error(`n8n responded with status ${response.status} for ${source.label}`)
      }

      sourceResults.push({
        source: source.label,
        spreadsheetId: source.spreadsheetId,
        result: await response.json(),
      })
    }

    logger.info('[API] Sync triggered successfully', { sources: sourceResults.length })
    invalidateContactsCache()
    return NextResponse.json({ sources: sourceResults })
  } catch (error) {
    errorLogger('[API] POST /api/sync error', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
