import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getCachedContacts } from '@/lib/contacts-cache'
import {
  getAllCampaigns,
  getContactSourceCount,
  getLatestSyncLog,
} from '@/lib/sheet-data'
import { DashboardStats } from '@/lib/types'
import logger, { errorLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug('[API] GET /api/stats called')

    let totalContacts = 0
    try {
      const { contacts } = await getCachedContacts()
      totalContacts = contacts.length
    } catch (error) {
      logger.warn('[API] Failed to fetch contacts', error)
      try {
        totalContacts = await getContactSourceCount()
      } catch {
        totalContacts = 0
      }
    }

    let messagesThisMonth = 0
    let deliveredThisMonth = 0
    let failedThisMonth = 0
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    try {
      const campaigns = await getAllCampaigns()
      campaigns.forEach((campaign) => {
        if (
          campaign.date.getMonth() === currentMonth &&
          campaign.date.getFullYear() === currentYear
        ) {
          messagesThisMonth += campaign.totalSent
          deliveredThisMonth += campaign.delivered
          failedThisMonth += campaign.failed
        }
      })
    } catch (error) {
      logger.warn('[API] Failed to fetch analytics', error)
    }

    const totalProcessed = messagesThisMonth
    const successRate =
      totalProcessed > 0
        ? `${((deliveredThisMonth / totalProcessed) * 100).toFixed(1)}%`
        : 'N/A'

    let lastSync: Date | null = null
    let syncHealth: DashboardStats['syncHealth'] = 'healthy'

    try {
      const latestLog = await getLatestSyncLog()
      if (latestLog) {
        lastSync = latestLog.timestamp
        syncHealth = latestLog.status === 'failed' ? 'error' : 'healthy'

        const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
        if (hoursSinceSync > 24) {
          syncHealth = 'warning'
        }
      }
    } catch (error) {
      logger.warn('[API] Failed to fetch sync log', error)
      syncHealth = 'error'
    }

    const stats: DashboardStats = {
      totalContacts,
      messagesThisMonth,
      deliveredThisMonth,
      failedThisMonth,
      successRate,
      lastSync,
      syncHealth,
      workflowStatus: 'running',
    }

    logger.info('[API] Stats returned successfully', stats)
    return NextResponse.json(stats)
  } catch (error) {
    errorLogger('[API] GET /api/stats error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
