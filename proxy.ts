import { auth } from "@/lib/auth-server";

export default auth((req) => {
  // Auth middleware - NextAuth handles redirects
  // All routes except /login require authentication
});

export const config = {
  matcher: [
    // Protect all dashboard routes except login
    "/",
    "/(dashboard)/:path*",
    "/api/:path*",
  ],
};
