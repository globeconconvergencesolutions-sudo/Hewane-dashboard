import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-session'
import { getCachedContacts, invalidateContactsCache } from '@/lib/contacts-cache'
import { parseContactsQueryParams, queryContacts } from '@/lib/contacts-query'
import logger, { errorLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const { refresh, ...queryParams } = parseContactsQueryParams(searchParams)

    if (refresh) {
      invalidateContactsCache()
    }

    const started = Date.now()
    const { contacts, fromCache, cachedAt } = await getCachedContacts(refresh)
    const result = queryContacts(contacts, queryParams)

    result.meta = {
      cachedAt: cachedAt.toISOString(),
      fromCache,
      queryMs: Date.now() - started,
    }

    logger.debug('[API] GET /api/contacts', {
      total: result.pagination.total,
      page: result.pagination.page,
      fromCache,
    })

    return NextResponse.json(result)
  } catch (error) {
    errorLogger('[API] GET /api/contacts error', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request.headers)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    logger.debug('[API] POST /api/contacts called', { contactName: body.name })

    return NextResponse.json(
      { message: 'Add contact endpoint - not yet implemented' },
      { status: 501 }
    )
  } catch (error) {
    errorLogger('[API] POST /api/contacts error', error)
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 })
  }
}
