/**
 * Session Service – business logic for session management.
 *
 * Handles creation, validation, revocation, and automatic extension
 * of user sessions. Uses the SessionRepository for data access.
 */

import crypto from "crypto";
import { sessionRepository } from "./session-repository";
import { logger } from "@/server/lib/logger";
import type { SessionWithUser, AuthUser, RequestMetadata } from "./types";

/** Sessions are auto-extended when they are within this many days of expiry. */
const SESSION_REFRESH_THRESHOLD_DAYS = 7;

/** Max lifetime from first login; sessions are not extended beyond this (security). */
const SESSION_MAX_LIFETIME_DAYS = 3;

/**
 * Generates a cryptographically secure random session token.
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export class SessionService {
  /**
   * Creates a new session for a user and returns the token + expiry.
   */
  async createSession(
    userId: string,
    metadata?: RequestMetadata
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = generateSessionToken();

    const session = await sessionRepository.create({
      userId,
      token,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    logger.info("Session created", { userId });

    return {
      token: session.token,
      expiresAt: session.expires_at,
    };
  }

  /**
   * Validates a session token and returns the session + user if valid.
   * Returns null for expired, revoked, or non-existent sessions.
   * When the database is unavailable, returns null so the app can redirect to
   * login instead of crashing (graceful degradation).
   * Automatically extends sessions nearing expiry.
   */
  async validateSession(token: string): Promise<SessionWithUser | null> {
    let dbSession;
    try {
      dbSession = await sessionRepository.findByToken(token);
    } catch (error) {
      logger.warn("Session validation failed (e.g. database unavailable)", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }

    if (!dbSession) {
      return null;
    }

    try {
      // Reject expired sessions and clean up
      if (dbSession.expires_at < new Date()) {
        await sessionRepository.delete(dbSession.id);
        logger.debug("Expired session cleaned up", { sessionId: dbSession.id });
        return null;
      }

      // Reject inactive users
      if (!dbSession.user.is_active) {
        await sessionRepository.delete(dbSession.id);
        logger.warn("Session revoked for inactive user", {
          userId: dbSession.user_id,
        });
        return null;
      }

      // Auto-extend session only if within refresh threshold and under max lifetime
      const daysUntilExpiry =
        (dbSession.expires_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      const sessionAgeDays =
        (Date.now() - dbSession.created_at.getTime()) / (1000 * 60 * 60 * 24);

      if (
        daysUntilExpiry < SESSION_REFRESH_THRESHOLD_DAYS &&
        sessionAgeDays < SESSION_MAX_LIFETIME_DAYS
      ) {
        const maxExpiresAt = new Date(dbSession.created_at);
        maxExpiresAt.setDate(maxExpiresAt.getDate() + SESSION_MAX_LIFETIME_DAYS);
        await sessionRepository.extendSession(dbSession.id, maxExpiresAt);
        logger.debug("Session auto-extended", { sessionId: dbSession.id });
      }

      const user: AuthUser = {
        id: dbSession.user.id,
        tenantId: dbSession.user.tenant_id,
        email: dbSession.user.email,
        name: dbSession.user.name,
        avatarUrl: dbSession.user.avatar_url,
        role: dbSession.user.role,
        isActive: dbSession.user.is_active,
      };

      return {
        session: {
          id: dbSession.id,
          userId: dbSession.user_id,
          token: dbSession.token,
          expiresAt: dbSession.expires_at,
        },
        user,
      };
    } catch (error) {
      logger.warn("Session validation failed after fetch (e.g. database unavailable)", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Revokes a single session by its token.
   */
  async revokeSession(token: string): Promise<void> {
    await sessionRepository.deleteByToken(token);
    logger.info("Session revoked");
  }

  /**
   * Revokes all sessions for a user (e.g., on password change or security event).
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await sessionRepository.deleteByUserId(userId);
    logger.info("All sessions revoked for user", { userId });
  }

  /**
   * Cleans up expired sessions from the database.
   * Can be called periodically via a cron job.
   */
  async cleanupExpiredSessions(): Promise<number> {
    const count = await sessionRepository.deleteExpired();
    if (count > 0) {
      logger.info(`Cleaned up ${count} expired sessions`);
    }
    return count;
  }
}

export const sessionService = new SessionService();

