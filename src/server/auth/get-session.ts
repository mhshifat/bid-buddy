/**
 * Server-side session retrieval utility.
 *
 * Use this in:
 * - Server Components  (to gate rendering or show user info)
 * - Route Handlers     (to guard API endpoints)
 * - tRPC context       (to populate userId / tenantId)
 *
 * It reads the session cookie and validates against the database.
 */

import { getSessionToken } from "./session-cookie";
import { sessionService } from "./session-service";
import type { SessionWithUser } from "./types";

/**
 * Returns the current authenticated session, or null if unauthenticated.
 * Safe to call in any server context where `cookies()` is available.
 */
export async function getServerSession(): Promise<SessionWithUser | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  return sessionService.validateSession(token);
}

