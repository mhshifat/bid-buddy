/**
 * Next.js Middleware – route protection based on session cookie.
 *
 * This middleware performs lightweight cookie-existence checks.
 * Full session validation happens in tRPC context / server components.
 *
 * Rules:
 *   - Auth routes (/login): redirect to /dashboard if session cookie exists
 *   - Protected routes:     redirect to /login if no session cookie
 *   - Public routes:        always pass through
 */

import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "bb_session";

/** Routes that require authentication (everything under these prefixes). */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/jobs",
  "/proposals",
  "/projects",
  "/clients",
  "/ai-analysis",
  "/analytics",
  "/github",
  "/settings",
];

/** Routes only accessible to unauthenticated users. */
const AUTH_ONLY_ROUTES = ["/login"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = !!request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // If user is on auth-only page and already has a session, send to dashboard
  if (AUTH_ONLY_ROUTES.some((r) => pathname === r) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If accessing a protected route without a session cookie, send to login
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *   - API routes (handled by their own auth)
     *   - Static assets (_next/static, _next/image, favicon, images)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

