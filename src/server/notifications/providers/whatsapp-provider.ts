/**
 * WhatsApp Notification Provider (Twilio WhatsApp Business API).
 *
 * Uses the same Twilio SDK as SMS but routes through the WhatsApp channel.
 * Twilio provides a WhatsApp sandbox for testing — production requires
 * an approved WhatsApp Business Profile.
 *
 * Environment variables required:
 *   TWILIO_ACCOUNT_SID       — Twilio account SID
 *   TWILIO_AUTH_TOKEN         — Twilio auth token
 *   TWILIO_WHATSAPP_NUMBER   — Twilio WhatsApp sender (e.g. "whatsapp:+14155238886")
 */

import { logger } from "@/server/lib/logger";
import type {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Lazy-load twilio
async function getTwilioClient(): Promise<any> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return null;
    }

    const twilio = await import("twilio" as any);
    const createClient = twilio.default ?? twilio;
    return createClient(accountSid, authToken);
  } catch {
    logger.warn("twilio package not installed. WhatsApp notifications disabled.");
    return null;
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export class WhatsAppNotificationProvider implements NotificationProvider {
  readonly channel = "WHATSAPP" as const;
  readonly name = "twilio-whatsapp";

  async send(
    payload: NotificationPayload,
    config: Record<string, unknown>,
  ): Promise<NotificationResult> {
    try {
      const client = await getTwilioClient();
      if (!client) {
        return {
          success: false,
          channel: this.channel,
          error: "WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in environment.",
        };
      }

      const fromNumber =
        process.env.TWILIO_WHATSAPP_NUMBER ?? "whatsapp:+14155238886"; // sandbox default
      const toNumber = config.phoneNumber as string | undefined;
      if (!toNumber) {
        return {
          success: false,
          channel: this.channel,
          error: "No phone number configured for WhatsApp notifications.",
        };
      }

      // Ensure whatsapp: prefix
      const formattedTo = toNumber.startsWith("whatsapp:")
        ? toNumber
        : `whatsapp:${toNumber}`;

      const formattedFrom = fromNumber.startsWith("whatsapp:")
        ? fromNumber
        : `whatsapp:${fromNumber}`;

      const messageBody = [
        `🎯 *${payload.title}*`,
        "",
        payload.body,
        "",
        payload.jobUrl ? `🔗 View job: ${payload.jobUrl}` : "",
      ]
        .filter((line) => line !== undefined)
        .join("\n");

      const message = await client.messages.create({
        body: messageBody,
        from: formattedFrom,
        to: formattedTo,
      });

      return {
        success: true,
        channel: this.channel,
        messageId: message.sid,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("WhatsApp notification failed", error instanceof Error ? error : undefined);
      return { success: false, channel: this.channel, error: errorMsg };
    }
  }

  async healthCheck(): Promise<boolean> {
    return (
      !!process.env.TWILIO_ACCOUNT_SID &&
      !!process.env.TWILIO_AUTH_TOKEN
    );
  }
}
