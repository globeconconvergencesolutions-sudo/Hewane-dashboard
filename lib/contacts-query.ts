import type {
  Contact,
  ContactsFacets,
  ContactsPagination,
  PaginatedContactsResponse,
} from '@/lib/types'

export type ContactSortField = 'name' | 'phone' | 'segment' | 'status' | 'sourceLabel'

export type ContactsQueryParams = {
  page?: number
  pageSize?: number
  q?: string
  segment?: string
  source?: string
  status?: string
  whatsapp?: string
  sort?: ContactSortField
  order?: 'asc' | 'desc'
}

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
export const EXPORT_MAX_ROWS = 50_000

function normalizeStatus(status: Contact['status']) {
  return status || 'Pending'
}

function matchesSearch(contact: Contact, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    contact.name,
    contact.phone,
    contact.email,
    contact.segment,
    contact.sourceLabel,
    contact.sourceTab,
    contact.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q) || contact.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
}

function compareContacts(
  a: Contact,
  b: Contact,
  sort: ContactSortField,
  order: 'asc' | 'desc'
) {
  const pick = (c: Contact) => {
    switch (sort) {
      case 'phone':
        return c.phone
      case 'segment':
        return c.segment || ''
      case 'status':
        return normalizeStatus(c.status)
      case 'sourceLabel':
        return c.sourceLabel || c.sourceSpreadsheetId || ''
      default:
        return c.name || ''
    }
  }

  const result = pick(a).localeCompare(pick(b), undefined, { sensitivity: 'base' })
  return order === 'desc' ? -result : result
}

function buildFacets(contacts: Contact[]): ContactsFacets {
  const segmentMap = new Map<string, number>()
  const sourceMap = new Map<string, { label: string; count: number }>()
  const statusMap = new Map<string, number>()
  let whatsappYes = 0
  let whatsappNo = 0

  for (const contact of contacts) {
    const segment = contact.segment?.trim() || 'General'
    segmentMap.set(segment, (segmentMap.get(segment) || 0) + 1)

    const sourceKey = contact.sourceSpreadsheetId || contact.sourceLabel || 'unknown'
    const sourceLabel = contact.sourceLabel || 'Unknown source'
    const existing = sourceMap.get(sourceKey)
    if (existing) existing.count += 1
    else sourceMap.set(sourceKey, { label: sourceLabel, count: 1 })

    const status = normalizeStatus(contact.status)
    statusMap.set(status, (statusMap.get(status) || 0) + 1)

    if (contact.sendWhatsapp === 'Yes') whatsappYes += 1
    else whatsappNo += 1
  }

  return {
    segments: [...segmentMap.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    sources: [...sourceMap.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => b.count - a.count),
    statuses: [...statusMap.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    whatsapp: { yes: whatsappYes, no: whatsappNo },
  }
}

export function parseContactsQueryParams(
  searchParams: URLSearchParams
): ContactsQueryParams & { refresh: boolean } {
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  )

  const sortParam = searchParams.get('sort')
  const sort: ContactSortField =
    sortParam === 'phone' ||
    sortParam === 'segment' ||
    sortParam === 'status' ||
    sortParam === 'sourceLabel'
      ? sortParam
      : 'name'

  return {
    page,
    pageSize,
    q: searchParams.get('q') || undefined,
    segment: searchParams.get('segment') || undefined,
    source: searchParams.get('source') || undefined,
    status: searchParams.get('status') || undefined,
    whatsapp: searchParams.get('whatsapp') || undefined,
    sort,
    order: searchParams.get('order') === 'desc' ? 'desc' : 'asc',
    refresh: searchParams.get('refresh') === 'true',
  }
}

export function queryContacts(
  contacts: Contact[],
  params: ContactsQueryParams
): PaginatedContactsResponse {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const sort = params.sort ?? 'name'
  const order = params.order ?? 'asc'

  let filtered = contacts.filter((contact) => {
    if (params.q && !matchesSearch(contact, params.q)) return false
    if (params.segment && params.segment !== 'all') {
      const segment = contact.segment?.trim() || 'General'
      if (segment !== params.segment) return false
    }
    if (params.source && params.source !== 'all') {
      const sourceKey = contact.sourceSpreadsheetId || contact.sourceLabel || ''
      if (sourceKey !== params.source) return false
    }
    if (params.status && params.status !== 'all') {
      if (normalizeStatus(contact.status) !== params.status) return false
    }
    if (params.whatsapp && params.whatsapp !== 'all') {
      if (contact.sendWhatsapp !== params.whatsapp) return false
    }
    return true
  })

  filtered = [...filtered].sort((a, b) => compareContacts(a, b, sort, order))

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
    facets: buildFacets(contacts),
    meta: {
      cachedAt: new Date().toISOString(),
      fromCache: false,
    },
  }
}

export function queryContactsForExport(
  contacts: Contact[],
  params: Omit<ContactsQueryParams, 'page' | 'pageSize'>
) {
  return queryContacts(contacts, {
    ...params,
    page: 1,
    pageSize: EXPORT_MAX_ROWS,
  }).items
}
