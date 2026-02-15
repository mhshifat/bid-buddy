/**
 * Notification system types.
 *
 * Defines the contracts for notification channels, payloads, and results.
 */

// ============================================================================
// Notification Channel (matches Prisma enum)
// ============================================================================

export type NotificationChannel = "DESKTOP" | "SMS" | "WHATSAPP" | "IN_APP";

// ============================================================================
// Notification Payload — what gets sent to providers
// ============================================================================

export interface NotificationPayload {
  tenantId: string;
  userId?: string;
  title: string;
  body: string;
  jobId?: string;
  jobUrl?: string;
  matchPercentage?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Notification Result — what providers return
// ============================================================================

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Alert Preference (camelCase entity for frontend/service layer)
// ============================================================================

export interface AlertPreferenceEntity {
  id: string;
  tenantId: string;
  userId: string;
  isEnabled: boolean;

  // Auto-scan
  autoScanEnabled: boolean;
  scanIntervalMinutes: number;

  // Match
  minMatchPercentage: number;
  categories: string[];
  targetSkills: string[];

  // Channels
  channels: NotificationChannel[];

  // Desktop
  desktopEnabled: boolean;
  pushSubscription: Record<string, unknown> | null;

  // SMS
  smsEnabled: boolean;
  smsPhoneNumber: string | null;
  smsCountryCode: string | null;
  smsVerified: boolean;

  // WhatsApp (Meta Cloud API)
  whatsappEnabled: boolean;
  whatsappPhoneNumber: string | null;
  whatsappCountryCode: string | null;
  whatsappVerified: boolean;
  whatsappAccessToken: string | null;
  whatsappPhoneNumberId: string | null;
}

// ============================================================================
// Job Match Alert — data passed to the notification service
// ============================================================================

export interface JobMatchAlert {
  jobId: string;
  jobTitle: string;
  jobUrl: string;
  matchPercentage: number;
  matchedSkills: string[];
  category: string | null;
  recommendation: string | null;
  fitScore: number;
}

// ============================================================================
// Notification Provider Interface (Strategy pattern)
// ============================================================================

export interface NotificationProvider {
  /** Channel this provider handles */
  readonly channel: NotificationChannel;

  /** Human-readable name */
  readonly name: string;

  /** Send a notification */
  send(payload: NotificationPayload, config: Record<string, unknown>): Promise<NotificationResult>;

  /** Check if this provider is properly configured */
  healthCheck(): Promise<boolean>;
}


