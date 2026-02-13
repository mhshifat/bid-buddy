/**
 * Session Repository – handles all database operations for sessions.
 *
 * Follows the repository pattern to keep data-access logic isolated
 * from business logic in the session service.
 */

import { prisma } from "@/server/db/prisma";
import { DatabaseError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";

const SESSION_DURATION_DAYS = 30;

interface CreateSessionInput {
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionRepository {
  /**
   * Creates a new session with an expiry date.
   */
  async create(data: CreateSessionInput) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

      return await prisma.session.create({
        data: {
          user_id: data.userId,
          token: data.token,
          expires_at: expiresAt,
          ip_address: data.ipAddress ?? null,
          user_agent: data.userAgent ?? null,
        },
      });
    } catch (error) {
      throw new DatabaseError(
        "create session",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Finds a session by its token, including the user and tenant data.
   */
  async findByToken(token: string) {
    try {
      return await prisma.session.findUnique({
        where: { token },
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
        "find session by token",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Deletes a single session by ID.
   */
  async delete(id: string) {
    try {
      await prisma.session.delete({ where: { id } });
    } catch (error) {
      throw new DatabaseError(
        "delete session",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Deletes a single session by token. Fails silently if already deleted.
   */
  async deleteByToken(token: string) {
    try {
      await prisma.session.delete({ where: { token } });
    } catch (error) {
      logger.warn("Failed to delete session by token (may already be deleted)", {
        error: String(error),
      });
    }
  }

  /**
   * Deletes all sessions for a given user (e.g., on password change).
   */
  async deleteByUserId(userId: string) {
    try {
      await prisma.session.deleteMany({ where: { user_id: userId } });
    } catch (error) {
      throw new DatabaseError(
        "delete user sessions",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Removes all expired sessions. Returns count of deleted sessions.
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: { expires_at: { lt: new Date() } },
      });
      return result.count;
    } catch (error) {
      logger.error(
        "Failed to clean up expired sessions",
        error instanceof Error ? error : undefined
      );
      return 0;
    }
  }

  /**
   * Extends a session's expiry by SESSION_DURATION_DAYS from now.
   */
  async extendSession(id: string) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

      return await prisma.session.update({
        where: { id },
        data: { expires_at: expiresAt },
      });
    } catch (error) {
      throw new DatabaseError(
        "extend session",
        error instanceof Error ? error : undefined
      );
    }
  }
}

export const sessionRepository = new SessionRepository();

