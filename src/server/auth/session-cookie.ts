/**
 * Session Cookie Helpers.
 *
 * Centralises all cookie read/write operations for authentication.
 * Uses HTTP-only, Secure (in production), SameSite=Lax cookies.
 */

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "bb_session";
const OAUTH_STATE_COOKIE_NAME = "bb_oauth_state";

// -----------------------------------------------------------------------------
// Session Cookie
// -----------------------------------------------------------------------------

/**
 * Sets the session cookie with the given token and expiry.
 */
export async function setSessionCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Reads the session token from the cookie. Returns null if absent.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Clears the session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// -----------------------------------------------------------------------------
// OAuth State Cookie (CSRF protection)
// -----------------------------------------------------------------------------

/**
 * Stores a short-lived state token for OAuth CSRF protection.
 */
export async function setOAuthStateCookie(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
}

/**
 * Reads the OAuth state cookie.
 */
export async function getOAuthStateCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value ?? null;
}

/**
 * Clears the OAuth state cookie after validation.
 */
export async function clearOAuthStateCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
}

