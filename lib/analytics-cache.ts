import { getAllCampaigns } from '@/lib/sheet-data'
import type { Campaign } from '@/lib/types'
import logger from '@/lib/logger'

const CACHE_TTL_MS = 60_000

type AnalyticsCacheEntry = {
  campaigns: Campaign[]
  fetchedAt: number
}

let cache: AnalyticsCacheEntry | null = null
let inflight: Promise<Campaign[]> | null = null

export async function getCachedCampaigns(forceRefresh = false): Promise<{
  campaigns: Campaign[]
  fromCache: boolean
  cachedAt: Date
}> {
  const now = Date.now()

  if (!forceRefresh && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return {
      campaigns: cache.campaigns,
      fromCache: true,
      cachedAt: new Date(cache.fetchedAt),
    }
  }

  if (!forceRefresh && inflight) {
    const campaigns = await inflight
    return {
      campaigns,
      fromCache: Boolean(cache),
      cachedAt: new Date(cache?.fetchedAt ?? now),
    }
  }

  inflight = getAllCampaigns()
    .then((campaigns) => {
      cache = { campaigns, fetchedAt: Date.now() }
      logger.info(`[AnalyticsCache] Refreshed ${campaigns.length} campaigns`)
      return campaigns
    })
    .finally(() => {
      inflight = null
    })

  const campaigns = await inflight
  return {
    campaigns,
    fromCache: false,
    cachedAt: new Date(cache!.fetchedAt),
  }
}

export function invalidateAnalyticsCache() {
  cache = null
  inflight = null
}
