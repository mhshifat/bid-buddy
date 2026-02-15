/**
 * Notification tRPC router — alert preferences and notification history.
 */

import { z } from "zod";
import { createRouter, publicProcedure } from "../trpc";
import { getNotificationService } from "@/server/notifications";
import { logger } from "@/server/lib/logger";
import type { TrpcContext } from "../trpc";

// ============================================================================
// Default Tenant Helper (same pattern as job-router)
// ============================================================================

const DEFAULT_TENANT_SLUG = "default";

async function resolveTenantId(ctx: TrpcContext): Promise<string> {
  if (ctx.tenantId) return ctx.tenantId;

  let tenant = await ctx.prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (!tenant) {
    tenant = await ctx.prisma.tenant.create({
      data: { name: "My Workspace", slug: DEFAULT_TENANT_SLUG },
      select: { id: true },
    });
  }

  return tenant.id;
}

async function resolveUserId(ctx: TrpcContext): Promise<string> {
  if (ctx.userId) return ctx.userId;

  // For unauthenticated setups, find/create a default user
  const tenantId = await resolveTenantId(ctx);
  let user = await ctx.prisma.user.findFirst({
    where: { tenant_id: tenantId },
    select: { id: true },
    orderBy: { created_at: "asc" },
  });

  if (!user) {
    user = await ctx.prisma.user.create({
      data: {
        tenant_id: tenantId,
        email: "default@bidbuddy.local",
        name: "Default User",
        role: "OWNER",
      },
      select: { id: true },
    });
  }

  return user.id;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const notificationChannelSchema = z.enum(["DESKTOP", "SMS", "WHATSAPP", "IN_APP"]);

const updatePreferencesSchema = z.object({
  isEnabled: z.boolean().optional(),
  autoScanEnabled: z.boolean().optional(),
  scanIntervalMinutes: z.number().min(1).max(60).optional(),
  minMatchPercentage: z.number().min(0).max(100).optional(),
  categories: z.array(z.string()).optional(),
  targetSkills: z.array(z.string()).optional(),
  channels: z.array(notificationChannelSchema).optional(),
  desktopEnabled: z.boolean().optional(),
  pushSubscription: z.record(z.string(), z.unknown()).nullable().optional(),
  smsEnabled: z.boolean().optional(),
  smsPhoneNumber: z.string().nullable().optional(),
  smsCountryCode: z.string().nullable().optional(),
  whatsappEnabled: z.boolean().optional(),
  whatsappPhoneNumber: z.string().nullable().optional(),
  whatsappCountryCode: z.string().nullable().optional(),
});

// ============================================================================
// Router
// ============================================================================

export const notificationRouter = createRouter({
  /**
   * Get the current user's alert preferences.
   */
  getPreferences: publicProcedure.query(async ({ ctx }) => {
    const service = getNotificationService();
    const repo = service.getRepository();
    const userId = await resolveUserId(ctx);

    const pref = await repo.getPreferenceByUserId(userId);
    return pref;
  }),

  /**
   * Update (or create) the current user's alert preferences.
   */
  updatePreferences: publicProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const service = getNotificationService();
      const repo = service.getRepository();
      const tenantId = await resolveTenantId(ctx);
      const userId = await resolveUserId(ctx);

      logger.info("Updating alert preferences", {
        correlationId: ctx.correlationId,
        userId,
        tenantId,
      });

      const updated = await repo.upsertPreference(tenantId, userId, input);
      return updated;
    }),

  /**
   * Get notification history (paginated).
   */
  getHistory: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = getNotificationService();
      const repo = service.getRepository();
      const tenantId = await resolveTenantId(ctx);

      return repo.getNotificationHistory(tenantId, input.page, input.pageSize);
    }),

  /**
   * Get auto-scan config in the format the browser extension expects.
   * The extension polls this endpoint on startup and periodically to sync settings.
   */
  getAutoScanConfig: publicProcedure.query(async ({ ctx }) => {
    const service = getNotificationService();
    const repo = service.getRepository();
    const userId = await resolveUserId(ctx);

    const pref = await repo.getPreferenceByUserId(userId);

    // Return the config in the shape the extension's AutoScanConfig expects
    return {
      enabled: pref?.isEnabled && pref?.autoScanEnabled ? true : false,
      intervalMinutes: pref?.scanIntervalMinutes ?? 15,
      categories: pref?.categories ?? [],
      targetSkills: pref?.targetSkills ?? [],
      minMatchPercentage: pref?.minMatchPercentage ?? 80,
    };
  }),

  /**
   * Send a test notification on a specific channel.
   * Returns the actual result so the UI can show success or failure details.
   */
  testChannel: publicProcedure
    .input(
      z.object({
        channel: notificationChannelSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = getNotificationService();
      const repo = service.getRepository();
      const tenantId = await resolveTenantId(ctx);
      const userId = await resolveUserId(ctx);

      // Get user's current preferences (needed for channel config like phone numbers)
      const pref = await repo.getPreferenceByUserId(userId);
      if (!pref) {
        return {
          success: false,
          channel: input.channel,
          error: "No alert preferences found. Please save your settings first.",
        };
      }

      const result = await service.testChannel(tenantId, userId, input.channel, pref);

      logger.info(`Test notification on ${input.channel}: ${result.success ? "OK" : result.error}`, {
        correlationId: ctx.correlationId,
        tenantId,
      });

      return result;
    }),

  /**
   * Diagnostics — returns the current notification pipeline state
   * so the user can see why notifications may not be firing.
   */
  diagnostics: publicProcedure.query(async ({ ctx }) => {
    const service = getNotificationService();
    const repo = service.getRepository();
    const tenantId = await resolveTenantId(ctx);
    const userId = await resolveUserId(ctx);

    const pref = await repo.getPreferenceByUserId(userId);

    // Get last 5 notification logs
    const recentLogs = await repo.getNotificationHistory(tenantId, 1, 5);

    // Check provider health
    const desktopHealth = await service.checkProviderHealth("DESKTOP");

    const issues: string[] = [];

    if (!pref) {
      issues.push("No alert preferences saved. Go to Settings and save your notification preferences.");
    } else {
      if (!pref.isEnabled) {
        issues.push("Alerts are disabled. Toggle 'Enable Alerts' ON in Settings.");
      }
      if (pref.minMatchPercentage > 90) {
        issues.push(`Match threshold is very high (${pref.minMatchPercentage}%). Consider lowering to 70-80%.`);
      }
      if (pref.categories.length === 0) {
        issues.push("No categories configured. Jobs without a matching category will still be notified.");
      }
      if (pref.desktopEnabled && !pref.pushSubscription) {
        issues.push("Desktop is enabled but no push subscription registered. Toggle Desktop OFF and ON again in Settings.");
      }
      if (!pref.desktopEnabled && !pref.smsEnabled && !pref.whatsappEnabled) {
        issues.push("No external notification channels enabled. Only in-app (bell icon) notifications will work.");
      }
    }

    if (!desktopHealth) {
      issues.push("Desktop push provider is not healthy. Check VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.");
    }

    return {
      preferences: pref
        ? {
            isEnabled: pref.isEnabled,
            autoScanEnabled: pref.autoScanEnabled,
            minMatchPercentage: pref.minMatchPercentage,
            desktopEnabled: pref.desktopEnabled,
            hasPushSubscription: !!pref.pushSubscription,
            smsEnabled: pref.smsEnabled,
            whatsappEnabled: pref.whatsappEnabled,
            categories: pref.categories,
            targetSkills: pref.targetSkills,
          }
        : null,
      desktopProviderHealthy: desktopHealth,
      recentNotifications: recentLogs.items,
      issues,
    };
  }),
});

