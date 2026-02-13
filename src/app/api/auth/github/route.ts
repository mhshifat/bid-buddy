/**
 * GET /api/auth/github
 *
 * Initiates the GitHub OAuth flow by:
 *   1. Generating a CSRF state token
 *   2. Storing it in an HTTP-only cookie
 *   3. Redirecting the user to GitHub's authorization page
 */

import crypto from "crypto";
import { NextResponse } from "next/server";
import { createGitHubProvider } from "@/server/auth/github-provider";
import { setOAuthStateCookie } from "@/server/auth/session-cookie";

export async function GET(): Promise<NextResponse> {
  const state = crypto.randomBytes(32).toString("hex");

  await setOAuthStateCookie(state);

  const provider = createGitHubProvider();
  const authUrl = provider.getAuthorizationUrl(state);

  return NextResponse.redirect(authUrl);
}

