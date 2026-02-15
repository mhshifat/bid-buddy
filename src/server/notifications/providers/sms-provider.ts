/**
 * SMS Notification Provider (Twilio).
 *
 * Strategy pattern implementation — can be swapped for MessageBird, Vonage, etc.
 * by creating a new class implementing NotificationProvider.
 *
 * Environment variables required:
 *   TWILIO_ACCOUNT_SID  — Twilio account SID
 *   TWILIO_AUTH_TOKEN    — Twilio auth token
 *   TWILIO_PHONE_NUMBER  — Twilio phone number (sender)
 */

import { logger } from "@/server/lib/logger";
import type {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Lazy-load twilio to avoid import errors when package isn't installed yet
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
    logger.warn("twilio package not installed. SMS notifications disabled.");
    return null;
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export class SmsNotificationProvider implements NotificationProvider {
  readonly channel = "SMS" as const;
  readonly name = "twilio-sms";

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
          error: "SMS not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in environment.",
        };
      }

      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) {
        return {
          success: false,
          channel: this.channel,
          error: "TWILIO_PHONE_NUMBER not configured.",
        };
      }

      const toNumber = config.phoneNumber as string | undefined;
      if (!toNumber) {
        return {
          success: false,
          channel: this.channel,
          error: "No phone number configured for SMS notifications.",
        };
      }

      const messageBody = [
        `🎯 ${payload.title}`,
        payload.body,
        payload.jobUrl ? `View: ${payload.jobUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const message = await client.messages.create({
        body: messageBody,
        from: fromNumber,
        to: toNumber,
      });

      return {
        success: true,
        channel: this.channel,
        messageId: message.sid,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error("SMS notification failed", error instanceof Error ? error : undefined);
      return { success: false, channel: this.channel, error: errorMsg };
    }
  }

  async healthCheck(): Promise<boolean> {
    return (
      !!process.env.TWILIO_ACCOUNT_SID &&
      !!process.env.TWILIO_AUTH_TOKEN &&
      !!process.env.TWILIO_PHONE_NUMBER
    );
  }
}
