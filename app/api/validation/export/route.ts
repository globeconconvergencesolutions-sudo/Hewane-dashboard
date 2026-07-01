import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { buildExportResponse, exportErrorResponse, parseExportFormat } from '@/lib/export-formats'
import { buildValidationExportTable } from '@/lib/export-rows'
import type { ContactValidationReport } from '@/lib/validation'
import { errorLogger } from '@/lib/logger'

function isValidationReport(value: unknown): value is ContactValidationReport {
  if (!value || typeof value !== 'object') return false
  const report = value as ContactValidationReport
  return Boolean(report.summary && Array.isArray(report.sources) && report.overallHealth)
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    if (!isValidationReport(body)) {
      return NextResponse.json({ error: 'Invalid validation report payload' }, { status: 400 })
    }

    return await buildExportResponse(buildValidationExportTable(body), format)
  } catch (error) {
    errorLogger('[API] POST /api/validation/export error', error)
    return exportErrorResponse(error, 'validation')
  }
}
