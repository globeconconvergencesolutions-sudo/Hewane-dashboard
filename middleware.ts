import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = ['/sign-in', '/sign-up']
const sessionCookieNames = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
]

const PUBLIC_FILE =
  /\.(?:ico|png|svg|jpg|jpeg|gif|webp|webmanifest|txt|xml)$|^(?:\/favicon\.ico|\/manifest\.webmanifest|\/robots\.txt|\/sitemap\.xml)$/

function isPublicPath(pathname: string) {
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true
  }
  if (pathname.startsWith('/api/auth')) {
    return true
  }
  if (PUBLIC_FILE.test(pathname)) {
    return true
  }
  return false
}

function hasSessionCookie(request: NextRequest) {
  return sessionCookieNames.some((name) => Boolean(request.cookies.get(name)?.value))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = hasSessionCookie(request)

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
