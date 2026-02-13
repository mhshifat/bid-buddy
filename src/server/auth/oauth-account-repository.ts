/**
 * OAuth Account Repository – handles database operations for OAuth accounts.
 *
 * Manages the link between external OAuth providers (GitHub, etc.)
 * and internal User records.
 */

import { prisma } from "@/server/db/prisma";
import { DatabaseError } from "@/server/lib/errors";

interface CreateOAuthAccountInput {
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: number;
}

interface UpdateOAuthAccountInput {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: number;
}

export class OAuthAccountRepository {
  /**
   * Finds an OAuth account by provider name and provider-specific user ID.
   * Includes the linked user and tenant.
   */
  async findByProviderAccount(provider: string, providerAccountId: string) {
    try {
      return await prisma.oAuthAccount.findUnique({
        where: {
          provider_provider_account_id: {
            provider,
            provider_account_id: providerAccountId,
          },
        },
        include: {
          user: {
            include: {
              tenant: true,
            },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError(
        "find OAuth account",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Creates a new OAuth account linked to a user.
   */
  async create(data: CreateOAuthAccountInput) {
    try {
      return await prisma.oAuthAccount.create({
        data: {
          user_id: data.userId,
          provider: data.provider,
          provider_account_id: data.providerAccountId,
          access_token: data.accessToken ?? null,
          refresh_token: data.refreshToken ?? null,
          token_type: data.tokenType ?? null,
          scope: data.scope ?? null,
          expires_at: data.expiresAt ?? null,
        },
      });
    } catch (error) {
      throw new DatabaseError(
        "create OAuth account",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Updates an existing OAuth account's tokens and metadata.
   */
  async update(id: string, data: UpdateOAuthAccountInput) {
    try {
      return await prisma.oAuthAccount.update({
        where: { id },
        data: {
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
          token_type: data.tokenType,
          scope: data.scope,
          expires_at: data.expiresAt,
        },
      });
    } catch (error) {
      throw new DatabaseError(
        "update OAuth account",
        error instanceof Error ? error : undefined
      );
    }
  }
}

export const oauthAccountRepository = new OAuthAccountRepository();

