import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getPublicSheetsConfigForN8n } from '@/lib/sheets-config-n8n'
import { invalidateContactsCache } from '@/lib/contacts-cache'
import { getIntegrationsStatus, getN8nSyncWebhookUrl } from '@/lib/app-config'
import { isSheetsConfigured } from '@/lib/sheets-config'
import logger, { errorLogger } from '@/lib/logger'

function n8nErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('fetch failed')) {
      return 'Could not reach n8n. Check N8N_WORKFLOW_A_URL and that your n8n tunnel/server is online.'
    }
    return error.message
  }
  return 'Sync failed'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = getIntegrationsStatus(isSheetsConfigured())
    if (status.n8n.syncDisabledReason) {
      return NextResponse.json({ error: status.n8n.syncDisabledReason }, { status: 503 })
    }

    logger.debug('[API] POST /api/sync called')

    const n8nUrl = getN8nSyncWebhookUrl()!
    const sheetsConfig = await getPublicSheetsConfigForN8n()
    if (!sheetsConfig) {
      return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 503 })
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync',
        timestamp: new Date().toISOString(),
        sheetsConfig,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`n8n responded with status ${response.status}${text ? `: ${text.slice(0, 200)}` : ''}`)
    }

    const result = await response.json().catch(() => ({ status: 'accepted' }))

    logger.info('[API] Sync triggered successfully')
    invalidateContactsCache()

    return NextResponse.json({
      ok: true,
      message: 'Sync workflow completed.',
      result,
    })
  } catch (error) {
    const message = n8nErrorMessage(error)
    errorLogger('[API] POST /api/sync error', error)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
