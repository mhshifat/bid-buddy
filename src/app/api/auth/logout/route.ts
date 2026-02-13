/**
 * POST /api/auth/logout   – API logout (returns JSON)
 * GET  /api/auth/logout   – Browser logout (redirects to /login)
 *
 * Revokes the current session and clears the session cookie.
 */

import { NextResponse } from "next/server";
import {
  getSessionToken,
  clearSessionCookie,
} from "@/server/auth/session-cookie";
import { sessionService } from "@/server/auth/session-service";
import { logger } from "@/server/lib/logger";

export async function POST(): Promise<NextResponse> {
  await revokeCurrentSession();
  return NextResponse.json({ success: true });
}

export async function GET(): Promise<NextResponse> {
  await revokeCurrentSession();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(new URL("/login", appUrl));
}

// -----------------------------------------------------------------------------
// Shared helper
// -----------------------------------------------------------------------------

async function revokeCurrentSession(): Promise<void> {
  const token = await getSessionToken();

  if (token) {
    await sessionService.revokeSession(token);
    logger.info("User logged out");
  }

  await clearSessionCookie();
}

