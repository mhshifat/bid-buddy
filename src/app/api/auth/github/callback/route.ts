/**
 * GET /api/auth/github/callback
 *
 * GitHub OAuth callback handler. Processes the authorization code:
 *   1. Validates the CSRF state token
 *   2. Exchanges the code for an access token
 *   3. Creates or updates the user
 *   4. Creates a session and sets the cookie
 *   5. Redirects to the dashboard
 */

import { type NextRequest, NextResponse } from "next/server";
import { createGitHubProvider } from "@/server/auth/github-provider";
import { authService } from "@/server/auth/auth-service";
import {
  getOAuthStateCookie,
  clearOAuthStateCookie,
  setSessionCookie,
} from "@/server/auth/session-cookie";
import { logger } from "@/server/lib/logger";
import { generateCorrelationId } from "@/server/lib/correlation-id";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const correlationId = generateCorrelationId();
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle user-denied or GitHub-side errors
  if (error) {
    logger.error(`GitHub OAuth error: ${error}`, undefined, { correlationId });
    return redirectToLogin(request, "github_denied");
  }

  // Validate CSRF state
  const storedState = await getOAuthStateCookie();
  await clearOAuthStateCookie();

  if (!state || !storedState || state !== storedState) {
    logger.error("OAuth state mismatch – possible CSRF attempt", undefined, {
      correlationId,
    });
    return redirectToLogin(request, "invalid_state");
  }

  if (!code) {
    logger.error("Missing OAuth authorization code", undefined, {
      correlationId,
    });
    return redirectToLogin(request, "missing_code");
  }

  try {
    const provider = createGitHubProvider();

    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const { token, expiresAt } = await authService.handleOAuthLogin(
      provider,
      code,
      { ipAddress, userAgent }
    );

    await setSessionCookie(token, expiresAt);

    logger.info("OAuth login successful, redirecting to dashboard", {
      correlationId,
    });

    return NextResponse.redirect(
      new URL("/dashboard", request.nextUrl.origin)
    );
  } catch (err) {
    logger.error(
      "OAuth callback processing failed",
      err instanceof Error ? err : undefined,
      { correlationId }
    );

    return redirectToLogin(request, "auth_failed", correlationId);
  }
}

// -----------------------------------------------------------------------------
// Helper
// -----------------------------------------------------------------------------

function redirectToLogin(
  request: NextRequest,
  error: string,
  correlationId?: string
): NextResponse {
  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("error", error);
  if (correlationId) {
    loginUrl.searchParams.set("correlationId", correlationId);
  }
  return NextResponse.redirect(loginUrl);
}

