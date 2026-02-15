/**
 * Desktop (Web Push) Notification Provider.
 *
 * Uses the web-push library to send push notifications via VAPID protocol.
 * The push subscription is stored per-user in AlertPreference.push_subscription.
 *
 * Environment variables required:
 *   VAPID_PUBLIC_KEY  — public VAPID key
 *   VAPID_PRIVATE_KEY — private VAPID key
 *   VAPID_SUBJECT     — mailto: or URL identifying the app server
 */

import { logger } from "@/server/lib/logger";
import type {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Lazy-load web-push so the app doesn't crash when the package isn't installed
let webPush: any = null;
let webPushInitialised = false;

async function getWebPush(): Promise<any> {
  if (webPushInitialised) return webPush;
  webPushInitialised = true;

  try {
    // @ts-expect-error — web-push lacks type declarations
    const mod = await import("web-push");
    // Handle both CJS default and ESM named exports
    webPush = mod.default ?? mod;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@bidbuddy.app";

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      logger.info("Web Push VAPID keys configured successfully");
    } else {
      logger.warn(
        "VAPID keys not set. Desktop push notifications will fail. " +
        "Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env.",
      );
    }
  } catch (err) {
    logger.warn(
      "web-push package not available. Desktop push notifications disabled.",
    );
    webPush = null;
  }

  return webPush;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export class DesktopNotificationProvider implements NotificationProvider {
  readonly channel = "DESKTOP" as const;
  readonly name = "web-push-vapid";

  async send(
    payload: NotificationPayload,
    config: Record<string, unknown>,
  ): Promise<NotificationResult> {
    try {
      const wp = await getWebPush();
      if (!wp) {
        return {
          success: false,
          channel: this.channel,
          error:
            "Web Push not configured. Install web-push package and set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars.",
        };
      }

      const subscriptionString = config.pushSubscription as string | undefined;
      if (!subscriptionString) {
        return {
          success: false,
          channel: this.channel,
          error:
            "No push subscription registered for this user. " +
            "Please toggle Desktop Notifications off and on to re-register.",
        };
      }

      let subscription: Record<string, unknown>;
      try {
        subscription = JSON.parse(subscriptionString);
      } catch (error) {
        return {
          success: false,
          channel: this.channel,
          error: "Invalid push subscription format.",
        };
      }

      if (!subscription.endpoint) {
        return {
          success: false,
          channel: this.channel,
          error:
            "Invalid push subscription: missing endpoint. " +
            "Please toggle Desktop Notifications off and on to re-register.",
        };
      }

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: {
          url: payload.jobUrl ?? "/dashboard",
          jobId: payload.jobId,
          matchPercentage: payload.matchPercentage,
        },
      });

      const result = await wp.sendNotification(subscription, pushPayload);

      return {
        success: true,
        channel: this.channel,
        messageId: String(result.statusCode),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        "Desktop push notification failed",
        error instanceof Error ? error : undefined,
      );
      return { success: false, channel: this.channel, error: errorMsg };
    }
  }

  async healthCheck(): Promise<boolean> {
    const wp = await getWebPush();
    return wp !== null && !!process.env.VAPID_PUBLIC_KEY;
  }
}
