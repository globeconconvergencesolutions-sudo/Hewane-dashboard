import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { buildExportResponse, exportErrorResponse, parseExportFormat } from '@/lib/export-formats'
import { buildSheetTemplatesExportTable } from '@/lib/export-rows'
import { getAllTemplates } from '@/lib/sheet-data'
import { errorLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const format = parseExportFormat(request.nextUrl.searchParams.get('format'))
    if (!format) {
      return NextResponse.json(
        { error: 'Invalid format. Use csv, excel, pdf, or sheets.' },
        { status: 400 }
      )
    }

    const templates = await getAllTemplates()
    return await buildExportResponse(buildSheetTemplatesExportTable(templates), format)
  } catch (error) {
    errorLogger('[API] GET /api/templates/export error', error)
    return exportErrorResponse(error, 'templates')
  }
}
