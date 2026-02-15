/**
 * Notification Repository — database operations for alert preferences and logs.
 *
 * Follows the Repository pattern. All Prisma interactions for the notification
 * domain live here — the service layer never touches Prisma directly.
 */

import type { PrismaClient } from "@prisma/client";
import { logger } from "@/server/lib/logger";
import { encrypt, decrypt, isEncrypted } from "@/server/lib/encryption";
import type {
  AlertPreferenceEntity,
  NotificationChannel,
  NotificationResult,
} from "./types";

// ============================================================================
// Repository
// ============================================================================

export class NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // --------------------------------------------------------------------------
  // Alert Preferences
  // --------------------------------------------------------------------------

  /**
   * Get the alert preference for a specific user.
   */
  async getPreferenceByUserId(userId: string): Promise<AlertPreferenceEntity | null> {
    const pref = await this.prisma.alertPreference.findUnique({
      where: { user_id: userId },
    });

    if (!pref) return null;

    return await this.mapToEntity(pref);
  }

  /**
   * Get all active alert preferences for a tenant (for fan-out notifications).
   */
  async getActivePreferencesForTenant(tenantId: string): Promise<AlertPreferenceEntity[]> {
    const prefs = await this.prisma.alertPreference.findMany({
      where: {
        tenant_id: tenantId,
        is_enabled: true,
      },
    });

    return await Promise.all(prefs.map((p) => this.mapToEntity(p)));
  }

  /**
   * Upsert (create or update) alert preferences for a user.
   */
  async upsertPreference(
    tenantId: string,
    userId: string,
    data: Partial<Omit<AlertPreferenceEntity, "id" | "tenantId" | "userId">>,
  ): Promise<AlertPreferenceEntity> {
    const dbData = await this.mapToDbFields(data);

    const result = await this.prisma.alertPreference.upsert({
      where: { user_id: userId },
      create: {
        tenant_id: tenantId,
        user_id: userId,
        ...dbData,
      },
      update: dbData,
    });

    return await this.mapToEntity(result);
  }

  // --------------------------------------------------------------------------
  // Notification Logs
  // --------------------------------------------------------------------------

  /**
   * Log a notification attempt (sent or failed).
   */
  async logNotification(params: {
    tenantId: string;
    userId?: string;
    jobId?: string;
    channel: NotificationChannel;
    title: string;
    body: string;
    matchPercentage?: number;
    result: NotificationResult;
    correlationId?: string;
  }): Promise<void> {
    try {
      await this.prisma.notificationLog.create({
        data: {
          tenant_id: params.tenantId,
          user_id: params.userId,
          job_id: params.jobId,
          channel: params.channel,
          title: params.title,
          body: params.body,
          match_percentage: params.matchPercentage,
          status: params.result.success ? "sent" : "failed",
          error_message: params.result.error,
          correlation_id: params.correlationId,
          sent_at: params.result.success ? new Date() : null,
        },
      });
    } catch (error) {
      logger.error(
        "Failed to log notification",
        error instanceof Error ? error : undefined,
        { correlationId: params.correlationId },
      );
    }
  }

  /**
   * Check if a notification for the same job was already sent to the user.
   */
  async hasNotificationBeenSentForJob(
    userId: string,
    jobId: string,
  ): Promise<boolean> {
    const count = await this.prisma.notificationLog.count({
      where: {
        user_id: userId,
        job_id: jobId,
        status: "sent",
      },
    });
    return count > 0;
  }

  /**
   * Get recent notification logs for a tenant (paginated).
   */
  async getNotificationHistory(
    tenantId: string,
    page: number,
    pageSize: number,
  ) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificationLog.findMany({
        where: { tenant_id: tenantId },
        orderBy: { created_at: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.notificationLog.count({
        where: { tenant_id: tenantId },
      }),
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        userId: log.user_id,
        channel: log.channel,
        title: log.title,
        body: log.body,
        matchPercentage: log.match_percentage,
        status: log.status,
        errorMessage: log.error_message,
        correlationId: log.correlation_id,
        sentAt: log.sent_at,
        createdAt: log.created_at,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // --------------------------------------------------------------------------
  // Mapping Helpers
  // --------------------------------------------------------------------------

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async mapToEntity(pref: any): Promise<AlertPreferenceEntity> {
    return {
      id: pref.id,
      tenantId: pref.tenant_id,
      userId: pref.user_id,
      isEnabled: pref.is_enabled,
      autoScanEnabled: pref.auto_scan_enabled,
      scanIntervalMinutes: pref.scan_interval_minutes,
      minMatchPercentage: pref.min_match_percentage,
      categories: pref.categories ?? [],
      targetSkills: pref.target_skills ?? [],
      channels: pref.channels ?? [],
      desktopEnabled: pref.desktop_enabled,
      pushSubscription: await this.getPushSubscription(pref.push_subscription),
      smsEnabled: pref.sms_enabled,
      smsPhoneNumber: pref.sms_phone_number,
      smsCountryCode: pref.sms_country_code,
      smsVerified: pref.sms_verified,
      whatsappEnabled: pref.whatsapp_enabled,
      whatsappPhoneNumber: pref.whatsapp_phone_number,
      whatsappCountryCode: pref.whatsapp_country_code,
      whatsappVerified: pref.whatsapp_verified,
      whatsappAccessToken: pref.whatsapp_access_token ? await this.decryptWhatsAppToken(pref.whatsapp_access_token) : null,
      whatsappPhoneNumberId: pref.whatsapp_phone_number_id ? await this.decryptWhatsAppToken(pref.whatsapp_phone_number_id) : null,
    };
  }

  private async mapToDbFields(data: Partial<Omit<AlertPreferenceEntity, "id" | "tenantId" | "userId">>): Promise<Record<string, unknown>> {
    const dbData: Record<string, unknown> = {};

    if (data.isEnabled !== undefined) dbData.is_enabled = data.isEnabled;
    if (data.autoScanEnabled !== undefined) dbData.auto_scan_enabled = data.autoScanEnabled;
    if (data.scanIntervalMinutes !== undefined) dbData.scan_interval_minutes = data.scanIntervalMinutes;
    if (data.minMatchPercentage !== undefined) dbData.min_match_percentage = data.minMatchPercentage;
    if (data.categories !== undefined) dbData.categories = data.categories;
    if (data.targetSkills !== undefined) dbData.target_skills = data.targetSkills;
    if (data.channels !== undefined) dbData.channels = data.channels;
    if (data.desktopEnabled !== undefined) dbData.desktop_enabled = data.desktopEnabled;
    if (data.pushSubscription !== undefined) dbData.push_subscription = data.pushSubscription ? await this.encryptPushSubscription(JSON.stringify(data.pushSubscription)) : null;
    if (data.smsEnabled !== undefined) dbData.sms_enabled = data.smsEnabled;
    if (data.smsPhoneNumber !== undefined) dbData.sms_phone_number = data.smsPhoneNumber;
    if (data.smsCountryCode !== undefined) dbData.sms_country_code = data.smsCountryCode;
    if (data.smsVerified !== undefined) dbData.sms_verified = data.smsVerified;
    if (data.whatsappEnabled !== undefined) dbData.whatsapp_enabled = data.whatsappEnabled;
    if (data.whatsappPhoneNumber !== undefined) dbData.whatsapp_phone_number = data.whatsappPhoneNumber;
    if (data.whatsappCountryCode !== undefined) dbData.whatsapp_country_code = data.whatsappCountryCode;
    if (data.whatsappVerified !== undefined) dbData.whatsapp_verified = data.whatsappVerified;
    if (data.whatsappAccessToken !== undefined) dbData.whatsapp_access_token = await this.encryptWhatsAppToken(data.whatsappAccessToken);
    if (data.whatsappPhoneNumberId !== undefined) dbData.whatsapp_phone_number_id = await this.encryptWhatsAppToken(data.whatsappPhoneNumberId);

    return dbData;
  }

  /**
   * Get push subscription, handling both encrypted strings and existing JSON objects.
   */
  private async getPushSubscription(pushSubscriptionData: any): Promise<Record<string, unknown> | null> {
    if (!pushSubscriptionData) return null;

    // If it's already an object (existing unencrypted data), return it directly
    if (typeof pushSubscriptionData === 'object' && !Array.isArray(pushSubscriptionData)) {
      return pushSubscriptionData as Record<string, unknown>;
    }

    // If it's a string, it might be encrypted or plain JSON
    if (typeof pushSubscriptionData === 'string') {
      try {
        // Try to decrypt it first
        const decrypted = await this.decryptPushSubscription(pushSubscriptionData);
        if (decrypted) {
          // Parse the decrypted JSON string
          return JSON.parse(decrypted);
        }
      } catch (error) {
        // If decryption fails, try to parse it as plain JSON
        try {
          return JSON.parse(pushSubscriptionData);
        } catch (parseError) {
          logger.warn("Failed to parse push subscription as JSON", { error: parseError });
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Decrypt a push subscription for use.
   */
  private async decryptPushSubscription(encryptedSubscription: string | null): Promise<string | null> {
    if (!encryptedSubscription) return null;
    try {
      // Check if it looks like encrypted data
      if (!isEncrypted(encryptedSubscription)) {
        // If not encrypted, treat as plain text (backward compatibility)
        logger.warn("Found unencrypted push subscription, treating as plain text");
        return encryptedSubscription;
      }
      // Try to decrypt
      const decrypted = await decrypt(encryptedSubscription);
      return decrypted;
    } catch (error) {
      // If decryption fails, it might be plain text that looks encrypted
      logger.warn("Failed to decrypt push subscription, treating as plain text for backward compatibility", {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return encryptedSubscription;
    }
  }

  /**
   * Encrypt a push subscription for secure storage.
   */
  private async encryptPushSubscription(subscription: string | null): Promise<string | null> {
    if (!subscription) return null;
    try {
      return await encrypt(subscription);
    } catch (error) {
      logger.error("Failed to encrypt push subscription", error instanceof Error ? error : undefined);
      throw new Error("Failed to encrypt push subscription");
    }
  }

  /**
   * Encrypt a WhatsApp token for secure storage.
   */
  private async encryptWhatsAppToken(token: string | null): Promise<string | null> {
    if (!token) return null;
    try {
      return await encrypt(token);
    } catch (error) {
      logger.error("Failed to encrypt WhatsApp token", error instanceof Error ? error : undefined);
      throw new Error("Failed to encrypt WhatsApp credentials");
    }
  }

  /**
   * Decrypt a WhatsApp token for use.
   */
  private async decryptWhatsAppToken(encryptedToken: string | null): Promise<string | null> {
    if (!encryptedToken) return null;
    try {
      // Check if it looks like encrypted data
      if (!isEncrypted(encryptedToken)) {
        // If not encrypted, treat as plain text (backward compatibility)
        logger.warn("Found unencrypted WhatsApp token, treating as plain text");
        return encryptedToken;
      }
      // Try to decrypt
      const decrypted = await decrypt(encryptedToken);
      return decrypted;
    } catch (error) {
      // If decryption fails, it might be plain text that looks encrypted
      logger.warn("Failed to decrypt WhatsApp token, treating as plain text for backward compatibility", {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return encryptedToken;
    }
  }

  /* eslint-enable @typescript-eslint/no-explicit-any */
}


