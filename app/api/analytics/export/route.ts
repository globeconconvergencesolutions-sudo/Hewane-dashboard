import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getCachedCampaigns } from '@/lib/analytics-cache'
import {
  parseAnalyticsQueryParams,
  queryCampaignsForExport,
} from '@/lib/analytics-query'
import {
  buildExportResponse,
  exportErrorResponse,
  parseExportFormat,
} from '@/lib/export-formats'
import { buildAnalyticsExportTable } from '@/lib/export-rows'
import logger, { errorLogger } from '@/lib/logger'

const ANALYTICS_HEADERS = [
  'id',
  'date',
  'time',
  'campaignName',
  'messageType',
  'totalSent',
  'delivered',
  'failed',
  'emailFallback',
  'successRate',
  'contactGroup',
]

function campaignsToRows(
  items: Awaited<ReturnType<typeof queryCampaignsForExport>>
): string[][] {
  return items.map((campaign) => [
    campaign.id,
    campaign.date instanceof Date
      ? campaign.date.toISOString().slice(0, 10)
      : String(campaign.date).slice(0, 10),
    campaign.time,
    campaign.campaignName,
    campaign.messageType,
    String(campaign.totalSent),
    String(campaign.delivered),
    String(campaign.failed),
    String(campaign.emailFallback),
    campaign.successRate,
    campaign.contactGroup,
  ])
}

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

    const { refresh, ...queryParams } = parseAnalyticsQueryParams(searchParams)
    const { campaigns } = await getCachedCampaigns(refresh)
    const items = queryCampaignsForExport(campaigns, queryParams)

    logger.debug('[API] GET /api/analytics/export called', {
      format,
      rows: items.length,
    })

    const table = buildAnalyticsExportTable(ANALYTICS_HEADERS, campaignsToRows(items))
    return await buildExportResponse(table, format)
  } catch (error) {
    errorLogger('[API] GET /api/analytics/export error', error)
    return exportErrorResponse(error, 'analytics')
  }
}
