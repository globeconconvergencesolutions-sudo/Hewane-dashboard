import type {
  AnalyticsFacets,
  AnalyticsSummary,
  Campaign,
  ContactsPagination,
  PaginatedAnalyticsResponse,
} from '@/lib/types'

export type CampaignSortField =
  | 'date'
  | 'campaignName'
  | 'totalSent'
  | 'delivered'
  | 'failed'
  | 'successRate'

export type AnalyticsQueryParams = {
  page?: number
  pageSize?: number
  q?: string
  messageType?: string
  contactGroup?: string
  sort?: CampaignSortField
  order?: 'asc' | 'desc'
}

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
export const EXPORT_MAX_ROWS = 50_000

function parseSuccessRate(value: string) {
  const numeric = Number.parseFloat(value.replace('%', '').trim())
  return Number.isFinite(numeric) ? numeric : 0
}

function campaignDateValue(campaign: Campaign) {
  const date = campaign.date instanceof Date ? campaign.date : new Date(campaign.date)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function matchesSearch(campaign: Campaign, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    campaign.campaignName,
    campaign.contactGroup,
    campaign.messageType,
    campaign.time,
    campaign.successRate,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

function compareCampaigns(
  a: Campaign,
  b: Campaign,
  sort: CampaignSortField,
  order: 'asc' | 'desc'
) {
  let result = 0

  switch (sort) {
    case 'campaignName':
      result = (a.campaignName || '').localeCompare(b.campaignName || '', undefined, {
        sensitivity: 'base',
      })
      break
    case 'totalSent':
      result = a.totalSent - b.totalSent
      break
    case 'delivered':
      result = a.delivered - b.delivered
      break
    case 'failed':
      result = a.failed - b.failed
      break
    case 'successRate':
      result = parseSuccessRate(a.successRate) - parseSuccessRate(b.successRate)
      break
    default:
      result = campaignDateValue(a) - campaignDateValue(b)
      break
  }

  if (result === 0) {
    result = (a.id || '').localeCompare(b.id || '')
  }

  return order === 'desc' ? -result : result
}

function buildFacets(campaigns: Campaign[]): AnalyticsFacets {
  const messageTypeMap = new Map<string, number>()
  const contactGroupMap = new Map<string, number>()

  for (const campaign of campaigns) {
    const messageType = campaign.messageType?.trim() || 'unknown'
    messageTypeMap.set(messageType, (messageTypeMap.get(messageType) || 0) + 1)

    const group = campaign.contactGroup?.trim() || 'All'
    contactGroupMap.set(group, (contactGroupMap.get(group) || 0) + 1)
  }

  return {
    messageTypes: [...messageTypeMap.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    contactGroups: [...contactGroupMap.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  }
}

function buildSummary(campaigns: Campaign[]): AnalyticsSummary {
  const totalSent = campaigns.reduce((sum, c) => sum + c.totalSent, 0)
  const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
  const totalFailed = campaigns.reduce((sum, c) => sum + c.failed, 0)
  const totalEmailFallback = campaigns.reduce((sum, c) => sum + c.emailFallback, 0)
  const avgSuccess =
    totalSent > 0 ? `${((totalDelivered / totalSent) * 100).toFixed(1)}%` : '0%'

  return {
    totalSent,
    totalDelivered,
    totalFailed,
    totalEmailFallback,
    avgSuccess,
    campaignCount: campaigns.length,
  }
}

export function parseAnalyticsQueryParams(
  searchParams: URLSearchParams
): AnalyticsQueryParams & { refresh: boolean } {
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      Number.parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) ||
        DEFAULT_PAGE_SIZE
    )
  )

  const sortParam = searchParams.get('sort')
  const sort: CampaignSortField =
    sortParam === 'campaignName' ||
    sortParam === 'totalSent' ||
    sortParam === 'delivered' ||
    sortParam === 'failed' ||
    sortParam === 'successRate'
      ? sortParam
      : 'date'

  return {
    page,
    pageSize,
    q: searchParams.get('q') || undefined,
    messageType: searchParams.get('messageType') || undefined,
    contactGroup: searchParams.get('contactGroup') || undefined,
    sort,
    order: searchParams.get('order') === 'asc' ? 'asc' : 'desc',
    refresh: searchParams.get('refresh') === 'true',
  }
}

export function queryCampaigns(
  campaigns: Campaign[],
  params: AnalyticsQueryParams
): PaginatedAnalyticsResponse {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const sort = params.sort ?? 'date'
  const order = params.order ?? 'desc'

  let filtered = campaigns.filter((campaign) => {
    if (params.q && !matchesSearch(campaign, params.q)) return false
    if (params.messageType && params.messageType !== 'all') {
      if ((campaign.messageType || 'unknown') !== params.messageType) return false
    }
    if (params.contactGroup && params.contactGroup !== 'all') {
      const group = campaign.contactGroup?.trim() || 'All'
      if (group !== params.contactGroup) return false
    }
    return true
  })

  filtered = [...filtered].sort((a, b) => compareCampaigns(a, b, sort, order))

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  const pagination: ContactsPagination = {
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  }

  return {
    items,
    pagination,
    summary: buildSummary(campaigns),
    filteredSummary: buildSummary(filtered),
    facets: buildFacets(campaigns),
    meta: {
      cachedAt: new Date().toISOString(),
      fromCache: false,
    },
  }
}

export function queryCampaignsForExport(
  campaigns: Campaign[],
  params: Omit<AnalyticsQueryParams, 'page' | 'pageSize'>
) {
  return queryCampaigns(campaigns, {
    ...params,
    page: 1,
    pageSize: EXPORT_MAX_ROWS,
  }).items
}
