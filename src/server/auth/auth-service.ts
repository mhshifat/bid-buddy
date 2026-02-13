/**
 * Auth Service – orchestrates the full OAuth login flow.
 *
 * Handles the end-to-end process:
 *   1. Exchange OAuth code for access token
 *   2. Retrieve user profile from provider
 *   3. Find or create user (+ tenant for new users)
 *   4. Create session
 *
 * New users automatically get their own tenant where they are OWNER.
 */

import { prisma } from "@/server/db/prisma";
import { logger } from "@/server/lib/logger";
import { generateCorrelationId } from "@/server/lib/correlation-id";
import { sessionService } from "./session-service";
import { oauthAccountRepository } from "./oauth-account-repository";
import type { OAuthProvider } from "./oauth-provider";
import type { RequestMetadata } from "./types";

export class AuthService {
  /**
   * Handles the complete OAuth callback flow for any provider.
   * Returns a session token + expiry on success.
   */
  async handleOAuthLogin(
    provider: OAuthProvider,
    code: string,
    metadata?: RequestMetadata
  ): Promise<{ token: string; expiresAt: Date }> {
    const correlationId = generateCorrelationId();

    logger.info(`OAuth login attempt via ${provider.name}`, { correlationId });

    // Step 1: Exchange authorization code for access token
    const tokenResult = await provider.exchangeCodeForToken(code);

    // Step 2: Get user profile from the OAuth provider
    const profile = await provider.getUserProfile(tokenResult.accessToken);

    logger.info(`OAuth profile retrieved: ${profile.email}`, { correlationId });

    // Step 3: Find existing OAuth account or register new user
    const existingAccount = await oauthAccountRepository.findByProviderAccount(
      provider.name,
      profile.id
    );

    let userId: string;

    if (existingAccount) {
      userId = await this.handleReturningUser(
        existingAccount.id,
        existingAccount.user_id,
        profile,
        tokenResult,
        correlationId
      );
    } else {
      userId = await this.handleNewUser(
        provider.name,
        profile,
        tokenResult,
        correlationId
      );
    }

    // Step 4: Create session
    const session = await sessionService.createSession(userId, metadata);

    logger.info(`Session created for user ${userId}`, { correlationId });

    return session;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Updates tokens and profile for a returning user.
   */
  private async handleReturningUser(
    oauthAccountId: string,
    userId: string,
    profile: { name: string; avatarUrl: string | null },
    tokenResult: {
      accessToken: string;
      refreshToken?: string;
      tokenType: string;
      scope: string;
      expiresIn?: number;
    },
    correlationId: string
  ): Promise<string> {
    // Update OAuth tokens
    await oauthAccountRepository.update(oauthAccountId, {
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      tokenType: tokenResult.tokenType,
      scope: tokenResult.scope,
      expiresAt: tokenResult.expiresIn
        ? Math.floor(Date.now() / 1000) + tokenResult.expiresIn
        : undefined,
    });

    // Refresh user profile data
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: profile.name,
        avatar_url: profile.avatarUrl,
        email_verified: true,
      },
    });

    logger.info(`Existing user signed in: ${userId}`, { correlationId });

    return userId;
  }

  /**
   * Creates a new tenant, user, and OAuth account in a single transaction.
   */
  private async handleNewUser(
    providerName: string,
    profile: { id: string; email: string; name: string; avatarUrl: string | null },
    tokenResult: {
      accessToken: string;
      refreshToken?: string;
      tokenType: string;
      scope: string;
      expiresIn?: number;
    },
    correlationId: string
  ): Promise<string> {
    const result = await prisma.$transaction(async (tx) => {
      // Create a personal workspace (tenant) for the new user
      const tenant = await tx.tenant.create({
        data: {
          name: `${profile.name}'s Workspace`,
          slug: this.generateTenantSlug(profile.name),
        },
      });

      // Create the user as OWNER of the new tenant
      const user = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          email: profile.email,
          name: profile.name,
          avatar_url: profile.avatarUrl,
          role: "OWNER",
          is_active: true,
          email_verified: true,
        },
      });

      // Link the OAuth account
      await tx.oAuthAccount.create({
        data: {
          user_id: user.id,
          provider: providerName,
          provider_account_id: profile.id,
          access_token: tokenResult.accessToken,
          refresh_token: tokenResult.refreshToken ?? null,
          token_type: tokenResult.tokenType,
          scope: tokenResult.scope,
          expires_at: tokenResult.expiresIn
            ? Math.floor(Date.now() / 1000) + tokenResult.expiresIn
            : null,
        },
      });

      return user;
    });

    logger.info(`New user registered: ${result.id}`, { correlationId });

    return result.id;
  }

  /**
   * Generates a URL-safe tenant slug from a display name.
   */
  private generateTenantSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }
}

export const authService = new AuthService();

