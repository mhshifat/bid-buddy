/**
 * GitHub OAuth Provider Implementation.
 *
 * Implements the OAuthProvider strategy for GitHub OAuth2 flow.
 * Handles authorization URL generation, code-to-token exchange,
 * and user profile retrieval from GitHub's API.
 */

import { ExternalServiceError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import type { OAuthProvider } from "./oauth-provider";
import type { OAuthProviderConfig, OAuthTokenResult, OAuthUserProfile } from "./types";

// -----------------------------------------------------------------------------
// GitHub API Endpoints
// -----------------------------------------------------------------------------

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

// -----------------------------------------------------------------------------
// GitHub API Response Types (eliminates `any`)
// -----------------------------------------------------------------------------

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

// -----------------------------------------------------------------------------
// GitHub Provider Class
// -----------------------------------------------------------------------------

export class GitHubProvider implements OAuthProvider {
  readonly name = "github";
  private readonly config: OAuthProviderConfig;

  constructor(config: OAuthProviderConfig) {
    this.config = config;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: "read:user user:email",
      state,
    });

    return `${GITHUB_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<OAuthTokenResult> {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new ExternalServiceError(
        "GitHub",
        new Error(`Token exchange failed with status ${response.status}`)
      );
    }

    const data = (await response.json()) as GitHubTokenResponse;

    if (data.error) {
      throw new ExternalServiceError(
        "GitHub",
        new Error(
          `Token exchange error: ${data.error_description ?? data.error}`
        )
      );
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      scope: data.scope,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    const [userResponse, emailsResponse] = await Promise.all([
      fetch(GITHUB_USER_URL, { headers: authHeaders }),
      fetch(GITHUB_EMAILS_URL, { headers: authHeaders }),
    ]);

    if (!userResponse.ok) {
      throw new ExternalServiceError(
        "GitHub",
        new Error(`User profile fetch failed with status ${userResponse.status}`)
      );
    }

    const userData = (await userResponse.json()) as GitHubUserResponse;

    // Resolve email: prefer public email, then primary verified from /user/emails
    let email = userData.email;

    if (!email && emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as GitHubEmailResponse[];
      const primaryEmail = emails.find((e) => e.primary && e.verified);
      email = primaryEmail?.email ?? emails[0]?.email ?? null;
    }

    if (!email) {
      throw new ExternalServiceError(
        "GitHub",
        new Error(
          "Could not retrieve email from GitHub profile. Ensure your GitHub account has a verified email."
        )
      );
    }

    logger.debug("GitHub profile retrieved", {
      githubId: String(userData.id),
      login: userData.login,
    });

    return {
      id: String(userData.id),
      email,
      name: userData.name ?? userData.login,
      avatarUrl: userData.avatar_url ?? null,
    };
  }
}

// -----------------------------------------------------------------------------
// Factory Function
// -----------------------------------------------------------------------------

/**
 * Creates a configured GitHubProvider instance from environment variables.
 * Throws if required env vars are missing.
 */
export function createGitHubProvider(): GitHubProvider {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ??
    "http://localhost:3000/api/auth/github/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set."
    );
  }

  return new GitHubProvider({ clientId, clientSecret, redirectUri });
}

