/**
 * WhatsApp Notification Provider — Meta WhatsApp Cloud API.
 *
 * Uses Meta's free Cloud API instead of Twilio. Each user can connect their
 * own WhatsApp Business number by providing:
 *
 *   1. A Meta App access token  (stored per-user in alert_preferences)
 *   2. A phone number ID        (stored per-user in alert_preferences)
 *
 * Setup guide for the user:
 *   1. Go to https://developers.facebook.com → Create App → "Business" type
 *   2. Add the "WhatsApp" product
 *   3. In WhatsApp > API Setup, copy:
 *      - Phone number ID
 *      - Temporary / permanent access token
 *   4. Add the recipient number (their own phone) to the test numbers list
 *   5. Paste the token + phone number ID into Bid Buddy Settings
 *
 * API endpoint:
 *   POST https://graph.facebook.com/v21.0/{phone_number_id}/messages
 *
 * Free tier: 1,000 service-initiated conversations per month.
 */

import { logger } from "@/server/lib/logger";
import type {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
} from "../types";

// Meta Graph API version
const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class WhatsAppNotificationProvider implements NotificationProvider {
  readonly channel = "WHATSAPP" as const;
  readonly name = "meta-whatsapp-cloud";

  async send(
    payload: NotificationPayload,
    config: Record<string, unknown>,
  ): Promise<NotificationResult> {
    try {
      const accessToken = config.whatsappAccessToken as string | undefined;
      const phoneNumberId = config.whatsappPhoneNumberId as string | undefined;
      const recipientNumber = config.phoneNumber as string | undefined;

      // Validate required config
      if (!accessToken || !phoneNumberId) {
        return {
          success: false,
          channel: this.channel,
          error:
            "WhatsApp not configured. Enter your Meta Cloud API access token and Phone Number ID in Settings.",
        };
      }

      if (!recipientNumber) {
        return {
          success: false,
          channel: this.channel,
          error: "No recipient phone number configured for WhatsApp notifications.",
        };
      }

      // Normalize the phone number: remove spaces, dashes, and the "+" prefix
      // Meta expects the number in international format without the "+" (e.g. "14155238886")
      const normalizedNumber = recipientNumber
        .replace(/[\s\-()]/g, "")
        .replace(/^\+/, "");

      // Build the message body
      const messageBody = [
        `🎯 *${payload.title}*`,
        "",
        payload.body,
        "",
        payload.jobUrl ? `🔗 View job: ${payload.jobUrl}` : "",
      ]
        .filter((line) => line !== undefined && line !== "")
        .join("\n");

      // Call Meta Cloud API
      const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalizedNumber,
          type: "text",
          text: {
            preview_url: true,
            body: messageBody,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const metaError =
          (errorData as Record<string, Record<string, string>>)?.error?.message ||
          `HTTP ${response.status} ${response.statusText}`;
        logger.error("Meta WhatsApp Cloud API error", undefined, {
          status: String(response.status),
          error: metaError,
        });
        return {
          success: false,
          channel: this.channel,
          error: `Meta API error: ${metaError}`,
        };
      }

      const data = (await response.json()) as {
        messages?: Array<{ id: string }>;
      };
      const messageId = data?.messages?.[0]?.id;

      logger.info("WhatsApp message sent via Meta Cloud API", {
        messageId: messageId ?? "unknown",
        to: normalizedNumber.slice(0, 4) + "****",
      });

      return {
        success: true,
        channel: this.channel,
        messageId: messageId ?? undefined,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        "WhatsApp notification failed",
        error instanceof Error ? error : undefined,
      );
      return { success: false, channel: this.channel, error: errorMsg };
    }
  }

  /**
   * Health check — we can't check per-user tokens at the provider level,
   * so we just report healthy. The actual send() will return meaningful errors.
   */
  async healthCheck(): Promise<boolean> {
    // Meta Cloud API doesn't require global env vars — tokens are per-user.
    // Always report healthy since validation happens at send() time.
    return true;
  }
}
