import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getAllCampaigns } from '@/lib/sheet-data'
import logger, { errorLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug('[API] GET /api/analytics called')

    const campaigns = await getAllCampaigns()

    logger.info(`[API] Returned ${campaigns.length} campaigns`)
    return NextResponse.json(campaigns)
  } catch (error) {
    errorLogger('[API] GET /api/analytics error', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
