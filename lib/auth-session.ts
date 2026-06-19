import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function getServerSession(requestHeaders?: Headers) {
  return auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  })
}

export async function requireServerSession(requestHeaders?: Headers) {
  const session = await getServerSession(requestHeaders)
  if (!session?.user) {
    return null
  }
  return session
}
