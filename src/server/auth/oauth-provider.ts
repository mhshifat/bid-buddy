/**
 * OAuth Provider Interface (Strategy Pattern).
 *
 * Defines the contract for any OAuth provider implementation.
 * New providers (Google, GitLab, etc.) can be added by implementing
 * this interface without modifying existing code.
 */

import type { OAuthTokenResult, OAuthUserProfile } from "./types";

export interface OAuthProvider {
  /** Unique name identifying this provider (e.g., "github", "google"). */
  readonly name: string;

  /**
   * Generates the authorization URL to redirect the user to.
   * @param state - CSRF protection state token.
   * @returns Full authorization URL with query parameters.
   */
  getAuthorizationUrl(state: string): string;

  /**
   * Exchanges an authorization code for an access token.
   * @param code - The authorization code from the OAuth callback.
   * @returns Token result with access token and metadata.
   */
  exchangeCodeForToken(code: string): Promise<OAuthTokenResult>;

  /**
   * Fetches the authenticated user's profile from the provider.
   * @param accessToken - The access token obtained from token exchange.
   * @returns Normalized user profile data.
   */
  getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
}

