import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getCachedContacts } from '@/lib/contacts-cache'
import { parseContactsQueryParams, queryContactsForExport } from '@/lib/contacts-query'
import { buildExportResponse, exportErrorResponse, parseExportFormat } from '@/lib/export-formats'
import { buildContactsExportTable } from '@/lib/export-rows'
import logger, { errorLogger } from '@/lib/logger'

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

    const { refresh, ...queryParams } = parseContactsQueryParams(searchParams)
    const { contacts } = await getCachedContacts(refresh)
    const items = queryContactsForExport(contacts, queryParams)

    logger.debug('[API] GET /api/contacts/export called', {
      format,
      rows: items.length,
    })

    return await buildExportResponse(buildContactsExportTable(items), format)
  } catch (error) {
    errorLogger('[API] GET /api/contacts/export error', error)
    return exportErrorResponse(error, 'contacts')
  }
}
