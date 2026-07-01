import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { buildExportResponse, exportErrorResponse, parseExportFormat } from '@/lib/export-formats'
import { buildWhatsAppTemplatesExportTable } from '@/lib/export-rows'
import { listWhatsAppTemplates } from '@/lib/whatsapp-templates'
import type { WhatsAppTemplateStatus } from '@/lib/whatsapp-template-types'
import { errorLogger } from '@/lib/logger'

const VALID_STATUSES = new Set<WhatsAppTemplateStatus>([
  'draft',
  'pending',
  'approved',
  'rejected',
  'paused',
])

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = parseExportFormat(searchParams.get('format'))
    if (!format) {
      return NextResponse.json(
        { error: 'Invalid format. Use csv, excel, pdf, or sheets.' },
        { status: 400 }
      )
    }

    const statusParam = searchParams.get('status')
    const status =
      statusParam && statusParam !== 'all' && VALID_STATUSES.has(statusParam as WhatsAppTemplateStatus)
        ? (statusParam as WhatsAppTemplateStatus)
        : undefined
    const templates = await listWhatsAppTemplates(status)

    return await buildExportResponse(buildWhatsAppTemplatesExportTable(templates), format)
  } catch (error) {
    errorLogger('[API] GET /api/whatsapp/templates/export error', error)
    return exportErrorResponse(error, 'whatsapp-templates')
  }
}
