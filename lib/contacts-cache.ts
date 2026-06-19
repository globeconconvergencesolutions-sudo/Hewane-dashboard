import { getAllContacts } from '@/lib/sheet-data'
import type { Contact } from '@/lib/types'
import logger from '@/lib/logger'

const CACHE_TTL_MS = 60_000

type ContactsCacheEntry = {
  contacts: Contact[]
  fetchedAt: number
}

let cache: ContactsCacheEntry | null = null
let inflight: Promise<Contact[]> | null = null

export async function getCachedContacts(forceRefresh = false): Promise<{
  contacts: Contact[]
  fromCache: boolean
  cachedAt: Date
}> {
  const now = Date.now()

  if (
    !forceRefresh &&
    cache &&
    now - cache.fetchedAt < CACHE_TTL_MS
  ) {
    return {
      contacts: cache.contacts,
      fromCache: true,
      cachedAt: new Date(cache.fetchedAt),
    }
  }

  if (!forceRefresh && inflight) {
    const contacts = await inflight
    return {
      contacts,
      fromCache: Boolean(cache),
      cachedAt: new Date(cache?.fetchedAt ?? now),
    }
  }

  inflight = getAllContacts()
    .then((contacts) => {
      cache = { contacts, fetchedAt: Date.now() }
      logger.info(`[ContactsCache] Refreshed ${contacts.length} contacts`)
      return contacts
    })
    .finally(() => {
      inflight = null
    })

  const contacts = await inflight
  return {
    contacts,
    fromCache: false,
    cachedAt: new Date(cache!.fetchedAt),
  }
}

export function invalidateContactsCache() {
  cache = null
  inflight = null
}
