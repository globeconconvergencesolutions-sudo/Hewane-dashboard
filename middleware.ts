import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Better Auth handles session validation through cookies
  // Allow all routes - Better Auth protects through session cookies
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static assets and public files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
