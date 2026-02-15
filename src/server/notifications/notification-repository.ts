/**
 * Notification Repository — database operations for alert preferences and logs.
 *
 * Follows the Repository pattern. All Prisma interactions for the notification
 * domain live here — the service layer never touches Prisma directly.
 */

import type { PrismaClient } from "@prisma/client";
import { logger } from "@/server/lib/logger";
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

    return this.mapToEntity(pref);
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

    return prefs.map((p) => this.mapToEntity(p));
  }

  /**
   * Upsert (create or update) alert preferences for a user.
   */
  async upsertPreference(
    tenantId: string,
    userId: string,
    data: Partial<Omit<AlertPreferenceEntity, "id" | "tenantId" | "userId">>,
  ): Promise<AlertPreferenceEntity> {
    const dbData = this.mapToDbFields(data);

    const result = await this.prisma.alertPreference.upsert({
      where: { user_id: userId },
      create: {
        tenant_id: tenantId,
        user_id: userId,
        ...dbData,
      },
      update: dbData,
    });

    return this.mapToEntity(result);
  }

  // --------------------------------------------------------------------------
  // Notification Logs
  // --------------------------------------------------------------------------

  /**
   * Log a notification attempt (sent or failed).
   */
  async logNotification(params: {
    tenantId: string;
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
  private mapToEntity(pref: any): AlertPreferenceEntity {
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
      pushSubscription: pref.push_subscription as Record<string, unknown> | null,
      smsEnabled: pref.sms_enabled,
      smsPhoneNumber: pref.sms_phone_number,
      smsCountryCode: pref.sms_country_code,
      smsVerified: pref.sms_verified,
      whatsappEnabled: pref.whatsapp_enabled,
      whatsappPhoneNumber: pref.whatsapp_phone_number,
      whatsappCountryCode: pref.whatsapp_country_code,
      whatsappVerified: pref.whatsapp_verified,
    };
  }

  private mapToDbFields(data: Partial<Omit<AlertPreferenceEntity, "id" | "tenantId" | "userId">>): Record<string, unknown> {
    const dbData: Record<string, unknown> = {};

    if (data.isEnabled !== undefined) dbData.is_enabled = data.isEnabled;
    if (data.autoScanEnabled !== undefined) dbData.auto_scan_enabled = data.autoScanEnabled;
    if (data.scanIntervalMinutes !== undefined) dbData.scan_interval_minutes = data.scanIntervalMinutes;
    if (data.minMatchPercentage !== undefined) dbData.min_match_percentage = data.minMatchPercentage;
    if (data.categories !== undefined) dbData.categories = data.categories;
    if (data.targetSkills !== undefined) dbData.target_skills = data.targetSkills;
    if (data.channels !== undefined) dbData.channels = data.channels;
    if (data.desktopEnabled !== undefined) dbData.desktop_enabled = data.desktopEnabled;
    if (data.pushSubscription !== undefined) dbData.push_subscription = data.pushSubscription;
    if (data.smsEnabled !== undefined) dbData.sms_enabled = data.smsEnabled;
    if (data.smsPhoneNumber !== undefined) dbData.sms_phone_number = data.smsPhoneNumber;
    if (data.smsCountryCode !== undefined) dbData.sms_country_code = data.smsCountryCode;
    if (data.smsVerified !== undefined) dbData.sms_verified = data.smsVerified;
    if (data.whatsappEnabled !== undefined) dbData.whatsapp_enabled = data.whatsappEnabled;
    if (data.whatsappPhoneNumber !== undefined) dbData.whatsapp_phone_number = data.whatsappPhoneNumber;
    if (data.whatsappCountryCode !== undefined) dbData.whatsapp_country_code = data.whatsappCountryCode;
    if (data.whatsappVerified !== undefined) dbData.whatsapp_verified = data.whatsappVerified;

    return dbData;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}


