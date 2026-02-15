/**
 * Notification Service — orchestrates sending notifications across channels.
 *
 * Follows the Service pattern. Uses Strategy pattern for providers.
 * The service resolves which channels to use per user preference,
 * fans out to each provider, and logs every attempt.
 */

import type { PrismaClient } from "@prisma/client";
import pLimit from "p-limit";
import { logger } from "@/server/lib/logger";
import { generateCorrelationId } from "@/server/lib/correlation-id";
import { NotificationRepository } from "./notification-repository";
import type {
  NotificationProvider,
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
  AlertPreferenceEntity,
  JobMatchAlert,
} from "./types";

// Providers
import { InAppNotificationProvider } from "./providers/in-app-provider";
import { DesktopNotificationProvider } from "./providers/desktop-provider";
import { SmsNotificationProvider } from "./providers/sms-provider";
import { WhatsAppNotificationProvider } from "./providers/whatsapp-provider";

// ============================================================================
// Service
// ============================================================================

const NOTIFICATION_CONCURRENCY = 3;

export class NotificationService {
  private readonly repository: NotificationRepository;
  private readonly providers: Map<NotificationChannel, NotificationProvider>;
  private readonly limit = pLimit(NOTIFICATION_CONCURRENCY);

  constructor(prisma: PrismaClient) {
    this.repository = new NotificationRepository(prisma);

    // Register all providers
    this.providers = new Map<NotificationChannel, NotificationProvider>();
    this.providers.set("IN_APP", new InAppNotificationProvider());
    this.providers.set("DESKTOP", new DesktopNotificationProvider());
    this.providers.set("SMS", new SmsNotificationProvider());
    this.providers.set("WHATSAPP", new WhatsAppNotificationProvider());
  }

  // --------------------------------------------------------------------------
  // Core: Send Job Match Notifications
  // --------------------------------------------------------------------------

  /**
   * Evaluate a newly analyzed job against all tenant users' alert preferences
   * and send notifications to matching users.
   */
  async processJobMatchAlerts(
    tenantId: string,
    alert: JobMatchAlert,
  ): Promise<void> {
    const correlationId = generateCorrelationId();

    logger.info(
      `Processing job match alerts for "${alert.jobTitle}" (fit: ${alert.fitScore}%)`,
      { tenantId, correlationId },
    );

    try {
      // Get all active preferences for this tenant
      const preferences = await this.repository.getActivePreferencesForTenant(tenantId);

      if (preferences.length === 0) {
        logger.debug("No active alert preferences for tenant", { tenantId });
        return;
      }

      // Fan out to each user whose preferences match
      const tasks = preferences.map((pref) =>
        this.limit(() => this.evaluateAndNotify(pref, alert, correlationId)),
      );

      await Promise.all(tasks);

      logger.info(
        `Job match alert processing complete for "${alert.jobTitle}"`,
        { tenantId, correlationId, userCount: String(preferences.length) },
      );
    } catch (error) {
      logger.error(
        `Failed to process job match alerts for "${alert.jobTitle}"`,
        error instanceof Error ? error : undefined,
        { tenantId, correlationId },
      );
    }
  }

  // --------------------------------------------------------------------------
  // Evaluate a single user's preferences and notify
  // --------------------------------------------------------------------------

  private async evaluateAndNotify(
    pref: AlertPreferenceEntity,
    alert: JobMatchAlert,
    correlationId: string,
  ): Promise<void> {
    // Check if fit score meets the user's minimum threshold
    if (alert.fitScore < pref.minMatchPercentage) {
      logger.info(
        `[NOTIFY] SKIP user ${pref.userId}: fitScore ${alert.fitScore}% < threshold ${pref.minMatchPercentage}%`,
        { correlationId },
      );
      return;
    }

    // Check category match (if categories are configured)
    if (pref.categories.length > 0 && alert.category) {
      const categoryMatch = pref.categories.some(
        (cat) => cat.toLowerCase() === alert.category!.toLowerCase(),
      );
      if (!categoryMatch) {
        logger.info(
          `[NOTIFY] SKIP user ${pref.userId}: category "${alert.category}" not in [${pref.categories.join(", ")}]`,
          { correlationId },
        );
        return;
      }
    }

    // Skill overlap is informational — we do NOT block notifications based on it.
    // The fitScore from AI already factors in skill relevance.
    if (pref.targetSkills.length > 0 && alert.matchedSkills.length > 0) {
      const skillOverlap = alert.matchedSkills.some((skill) =>
        pref.targetSkills.some(
          (target) => target.toLowerCase() === skill.toLowerCase(),
        ),
      );
      if (!skillOverlap) {
        logger.info(
          `[NOTIFY] Note: no direct skill overlap for user ${pref.userId}, ` +
          `but fitScore ${alert.fitScore}% meets threshold. Sending anyway. ` +
          `Job skills: [${alert.matchedSkills.slice(0, 5).join(", ")}], ` +
          `User skills: [${pref.targetSkills.slice(0, 5).join(", ")}]`,
          { correlationId },
        );
      }
    }

    logger.info(
      `[NOTIFY] MATCH for user ${pref.userId}: fitScore ${alert.fitScore}% >= ${pref.minMatchPercentage}%, ` +
      `desktop=${pref.desktopEnabled}, sms=${pref.smsEnabled}, whatsapp=${pref.whatsappEnabled}, ` +
      `pushSub=${pref.pushSubscription ? "yes" : "NO"}`,
      { correlationId },
    );

    // Check if already notified for this job
    const alreadyNotified = await this.repository.hasNotificationBeenSentForJob(pref.userId, alert.jobId);
    if (alreadyNotified) {
      logger.info(`[NOTIFY] SKIP user ${pref.userId}: already notified for job ${alert.jobId}`, { correlationId });
      return;
    }

    // Build notification payload
    const payload: NotificationPayload = {
      tenantId: pref.tenantId,
      userId: pref.userId,
      title: `🎯 ${alert.fitScore}% Match: ${alert.jobTitle}`,
      body: this.buildNotificationBody(alert),
      jobId: alert.jobId,
      jobUrl: alert.jobUrl,
      matchPercentage: alert.fitScore,
    };

    // Send to all enabled channels
    const channelTasks: Promise<void>[] = [];

    // Always send in-app notification
    channelTasks.push(this.sendToChannel("IN_APP", payload, pref, correlationId));

    if (pref.desktopEnabled) {
      if (!pref.pushSubscription) {
        logger.warn(
          `[NOTIFY] Desktop enabled but no push subscription for user ${pref.userId}. ` +
          `User needs to toggle Desktop off/on in Settings to register.`,
          { correlationId },
        );
      }
      channelTasks.push(this.sendToChannel("DESKTOP", payload, pref, correlationId));
    } else {
      logger.info(`[NOTIFY] Desktop not enabled for user ${pref.userId}`, { correlationId });
    }

    if (pref.smsEnabled && pref.smsPhoneNumber) {
      channelTasks.push(this.sendToChannel("SMS", payload, pref, correlationId));
    }

    if (pref.whatsappEnabled && pref.whatsappPhoneNumber) {
      channelTasks.push(this.sendToChannel("WHATSAPP", payload, pref, correlationId));
    }

    if (channelTasks.length === 1) {
      logger.info(
        `[NOTIFY] Only IN_APP channel active for user ${pref.userId}. ` +
        `Enable Desktop/SMS/WhatsApp in Settings for external notifications.`,
        { correlationId },
      );
    }

    await Promise.all(channelTasks);
  }

  // --------------------------------------------------------------------------
  // Send to a specific channel
  // --------------------------------------------------------------------------

  private async sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload,
    pref: AlertPreferenceEntity,
    correlationId: string,
  ): Promise<void> {
    const provider = this.providers.get(channel);
    if (!provider) {
      logger.warn(`No provider registered for channel: ${channel}`);
      return;
    }

    // Build channel-specific config
    const config = this.getChannelConfig(channel, pref);

    try {
      const result = await provider.send(payload, config);

      // Log the notification attempt
      await this.repository.logNotification({
        tenantId: payload.tenantId,
        userId: payload.userId,
        jobId: payload.jobId,
        channel,
        title: payload.title,
        body: payload.body,
        matchPercentage: payload.matchPercentage,
        result,
        correlationId,
      });

      if (result.success) {
        logger.info(`Notification sent via ${channel} for job "${payload.title}"`, {
          correlationId,
        });
      } else {
        logger.warn(`Notification failed via ${channel}: ${result.error}`, {
          correlationId,
        });
      }
    } catch (error) {
      const failResult: NotificationResult = {
        success: false,
        channel,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      await this.repository.logNotification({
        tenantId: payload.tenantId,
        jobId: payload.jobId,
        channel,
        title: payload.title,
        body: payload.body,
        matchPercentage: payload.matchPercentage,
        result: failResult,
        correlationId,
      });

      logger.error(
        `Notification error via ${channel}`,
        error instanceof Error ? error : undefined,
        { correlationId },
      );
    }
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private getChannelConfig(
    channel: NotificationChannel,
    pref: AlertPreferenceEntity,
  ): Record<string, unknown> {
    switch (channel) {
      case "DESKTOP":
        return { pushSubscription: pref.pushSubscription ? JSON.stringify(pref.pushSubscription) : null };
      case "SMS":
        return {
          phoneNumber: pref.smsCountryCode && pref.smsPhoneNumber
            ? `${pref.smsCountryCode}${pref.smsPhoneNumber}`
            : pref.smsPhoneNumber,
        };
      case "WHATSAPP":
        return {
          phoneNumber: pref.whatsappCountryCode && pref.whatsappPhoneNumber
            ? `${pref.whatsappCountryCode}${pref.whatsappPhoneNumber}`
            : pref.whatsappPhoneNumber,
          whatsappAccessToken: pref.whatsappAccessToken,
          whatsappPhoneNumberId: pref.whatsappPhoneNumberId,
        };
      case "IN_APP":
      default:
        return {};
    }
  }

  private buildNotificationBody(alert: JobMatchAlert): string {
    const parts: string[] = [];

    if (alert.recommendation) {
      parts.push(`Recommendation: ${alert.recommendation}`);
    }

    if (alert.matchedSkills.length > 0) {
      parts.push(`Matched skills: ${alert.matchedSkills.slice(0, 5).join(", ")}`);
    }

    if (alert.category) {
      parts.push(`Category: ${alert.category}`);
    }

    return parts.join(" · ") || "A new Upwork job matches your alert criteria.";
  }

  // --------------------------------------------------------------------------
  // Test a Single Channel
  // --------------------------------------------------------------------------

  /**
   * Send a test notification on a specific channel for a specific user.
   * Returns the actual result so the caller can report success/failure.
   */
  async testChannel(
    tenantId: string,
    userId: string,
    channel: NotificationChannel,
    pref: AlertPreferenceEntity,
  ): Promise<NotificationResult> {
    const provider = this.providers.get(channel);
    if (!provider) {
      return { success: false, channel, error: `No provider for channel: ${channel}` };
    }

    const payload: NotificationPayload = {
      tenantId,
      userId,
      title: "🔔 Bid Buddy — Test Notification",
      body: "If you see this, your notification channel is working!",
      jobId: "test",
      jobUrl: "/dashboard",
      matchPercentage: 95,
    };

    const config = this.getChannelConfig(channel, pref);

    try {
      const result = await provider.send(payload, config);

      // Log the test attempt
      await this.repository.logNotification({
        tenantId,
        userId,
        jobId: "test",
        channel,
        title: payload.title,
        body: payload.body,
        matchPercentage: 95,
        result,
        correlationId: generateCorrelationId(),
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return { success: false, channel, error: errorMsg };
    }
  }

  // --------------------------------------------------------------------------
  // Provider Health Check
  // --------------------------------------------------------------------------

  async checkProviderHealth(channel: NotificationChannel): Promise<boolean> {
    const provider = this.providers.get(channel);
    if (!provider) return false;
    try {
      return await provider.healthCheck();
    } catch {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Repository Pass-through (for tRPC router)
  // --------------------------------------------------------------------------

  getRepository(): NotificationRepository {
    return this.repository;
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

import { prisma } from "@/server/db/prisma";

let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (notificationServiceInstance) {
    return notificationServiceInstance;
  }

  notificationServiceInstance = new NotificationService(
    prisma as unknown as PrismaClient,
  );
  return notificationServiceInstance;
}

