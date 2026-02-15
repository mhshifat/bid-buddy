/**
 * In-App Notification Provider.
 *
 * Uses the existing EventBus to push real-time notifications
 * to connected clients via SSE.
 */

import { eventBus } from "@/server/events";
import { logger } from "@/server/lib/logger";
import type {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from "../types";

export class InAppNotificationProvider implements NotificationProvider {
  readonly channel = "IN_APP" as const;
  readonly name = "in-app-event-bus";

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      eventBus.emit("alert:jobMatch", {
        jobId: payload.jobId ?? "",
        title: payload.title,
        body: payload.body,
        matchPercentage: payload.matchPercentage ?? 0,
        jobUrl: payload.jobUrl ?? "",
      }, payload.tenantId);

      return { success: true, channel: this.channel };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("In-app notification failed", error instanceof Error ? error : undefined);
      return { success: false, channel: this.channel, error: errorMsg };
    }
  }

  async healthCheck(): Promise<boolean> {
    return true; // EventBus is always available
  }
}

