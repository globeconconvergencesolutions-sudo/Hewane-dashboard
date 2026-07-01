import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getCachedCampaigns, invalidateAnalyticsCache } from '@/lib/analytics-cache'
import { parseAnalyticsQueryParams, queryCampaigns } from '@/lib/analytics-query'
import logger, { errorLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const { refresh, ...queryParams } = parseAnalyticsQueryParams(searchParams)

    if (refresh) {
      invalidateAnalyticsCache()
    }

    const started = Date.now()
    const { campaigns, fromCache, cachedAt } = await getCachedCampaigns(refresh)
    const result = queryCampaigns(campaigns, queryParams)

    result.meta = {
      cachedAt: cachedAt.toISOString(),
      fromCache,
      queryMs: Date.now() - started,
    }

    logger.debug('[API] GET /api/analytics', {
      total: result.pagination.total,
      page: result.pagination.page,
      fromCache,
    })

    return NextResponse.json(result)
  } catch (error) {
    errorLogger('[API] GET /api/analytics error', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
