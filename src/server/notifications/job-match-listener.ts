/**
 * Job Match Listener
 *
 * Subscribes to the EventBus and handles two event types:
 *
 * 1. "job:captured" → Auto-triggers AI analysis for newly captured jobs
 *    (so that auto-scanned jobs get analysed without manual intervention).
 *
 * 2. "ai:analysisComplete" → Evaluates if the analysis result matches any
 *    user's alert preferences and sends notifications accordingly.
 */

import { eventBus } from "@/server/events";
import { prisma } from "@/server/db/prisma";
import { logger } from "@/server/lib/logger";
import { getNotificationService } from "./notification-service";
import { getAiService } from "@/server/ai/ai-service";
import type { JobMatchAlert } from "./types";
import type { PrismaClient } from "@prisma/client";
import type {
  AiAnalysisCompletePayload,
  JobCapturedPayload,
} from "@/server/events/types";

let isListenerRegistered = false;

/**
 * In-flight set to prevent duplicate auto-analysis triggers.
 * Keys are jobIds currently being analysed.
 */
const autoAnalysisInFlight = new Set<string>();

/**
 * Register the job match alert listener on the EventBus.
 * Safe to call multiple times — only registers once (idempotent).
 */
export function registerJobMatchListener(): void {
  if (isListenerRegistered) return;
  isListenerRegistered = true;

  logger.info("Registering job match alert listener on EventBus");

  eventBus.subscribe((realtimeEvent) => {
    // -----------------------------------------------------------------------
    // Auto-Analysis: job:captured → trigger AI analysis
    // -----------------------------------------------------------------------
    if (realtimeEvent.event === "job:captured") {
      const payload = realtimeEvent.data as JobCapturedPayload;
      const tenantId = realtimeEvent.tenantId ?? "";

      // Fire-and-forget
      handleJobCaptured(payload, tenantId).catch((error) => {
        logger.error(
          "Auto-analysis listener error",
          error instanceof Error ? error : undefined,
          { tenantId },
        );
      });
    }

    // -----------------------------------------------------------------------
    // Notification: ai:analysisComplete → evaluate preferences & notify
    // -----------------------------------------------------------------------
    if (realtimeEvent.event === "ai:analysisComplete") {
      const payload = realtimeEvent.data as AiAnalysisCompletePayload;
      const tenantId = realtimeEvent.tenantId ?? "";

      // Fire-and-forget
      handleAnalysisComplete(payload, tenantId).catch((error) => {
        logger.error(
          "Job match listener error",
          error instanceof Error ? error : undefined,
          { tenantId },
        );
      });
    }
  });
}

// ============================================================================
// Auto-Analysis on Job Capture
// ============================================================================

async function handleJobCaptured(
  payload: JobCapturedPayload,
  tenantId: string,
): Promise<void> {
  const jobId = payload.jobId;

  logger.info(
    `[PIPELINE] job:captured received for "${payload.title}" (${jobId})`,
    { tenantId },
  );

  // Prevent duplicate triggers
  if (autoAnalysisInFlight.has(jobId)) {
    logger.info(`[PIPELINE] Skipping — already analysing job ${jobId}`, { tenantId });
    return;
  }

  // Check if any user in this tenant has auto-scan + alerts enabled
  const service = getNotificationService();
  const repo = service.getRepository();
  const activePrefs = await repo.getActivePreferencesForTenant(tenantId);

  if (activePrefs.length === 0) {
    logger.info(
      `[PIPELINE] No active alert preferences for tenant ${tenantId}. ` +
      `User must enable alerts in Settings (is_enabled = true).`,
      { tenantId },
    );
    return;
  }

  logger.info(
    `[PIPELINE] Auto-analysing "${payload.title}" (${jobId}) — ` +
    `${activePrefs.length} user(s) with active alerts, ` +
    `desktop enabled: ${activePrefs.some(p => p.desktopEnabled)}`,
    { tenantId },
  );

  autoAnalysisInFlight.add(jobId);

  try {
    // Fetch the full job for AI input
    const db = prisma as unknown as PrismaClient;
    const job = await db.job.findUnique({ where: { id: jobId } });

    if (!job) {
      logger.warn(`Auto-analysis: job ${jobId} not found`);
      return;
    }

    // Skip if already analysed
    const existingAnalysis = await db.aiAnalysis.findFirst({
      where: { job_id: jobId },
      select: { id: true },
    });

    if (existingAnalysis) {
      logger.info(
        `[PIPELINE] Job ${jobId} already analysed — skipping auto-analysis. ` +
        `The existing ai:analysisComplete event should have already triggered notifications.`,
        { tenantId },
      );
      return;
    }

    const aiService = getAiService();

    // Emit analysis started event (keeps the UI in sync)
    eventBus.emit(
      "ai:analysisStarted",
      {
        jobId: job.id,
        jobTitle: job.title,
        analysisType: "JOB_FIT",
      },
      tenantId,
    );

    const { analysisId, result } = await aiService.analyseJob(
      {
        jobId: job.id,
        title: job.title,
        description: job.description,
        jobType: job.job_type,
        experienceLevel: job.experience_level,
        budgetMin: job.budget_min ? Number(job.budget_min) : null,
        budgetMax: job.budget_max ? Number(job.budget_max) : null,
        hourlyRateMin: job.hourly_rate_min
          ? Number(job.hourly_rate_min)
          : null,
        hourlyRateMax: job.hourly_rate_max
          ? Number(job.hourly_rate_max)
          : null,
        estimatedDuration: job.estimated_duration,
        clientCountry: job.client_country,
        clientRating: job.client_rating ? Number(job.client_rating) : null,
        clientTotalSpent: job.client_total_spent
          ? Number(job.client_total_spent)
          : null,
        clientTotalHires: job.client_total_hires,
        clientTotalPosted: job.client_total_posted,
        clientHireRate: job.client_hire_rate
          ? Number(job.client_hire_rate)
          : null,
        clientPaymentVerified: job.client_payment_verified,
        proposalsCount: job.proposals_count,
        connectsRequired: job.connects_required,
        skillsRequired: job.skills_required,
        category: job.category,
        postedAt: job.posted_at,
      },
      tenantId,
    );

    // Emit analysis complete → the ai:analysisComplete handler below
    // picks this up and triggers notifications.
    eventBus.emit(
      "ai:analysisComplete",
      {
        jobId: job.id,
        jobTitle: job.title,
        analysisType: "JOB_FIT",
        analysisId,
        fitScore: result.fitScore,
        fakeProbability: result.fakeProbability,
        winProbability: result.winProbability,
        recommendation: result.recommendation,
      },
      tenantId,
    );

    logger.info(
      `Auto-analysis complete for "${job.title}" — fitScore: ${result.fitScore}, recommendation: ${result.recommendation}`,
      { tenantId, analysisId },
    );
  } catch (error) {
    logger.error(
      `Auto-analysis failed for job ${jobId}`,
      error instanceof Error ? error : undefined,
      { tenantId },
    );
  } finally {
    autoAnalysisInFlight.delete(jobId);
  }
}

// ============================================================================
// Notification on Analysis Complete
// ============================================================================

async function handleAnalysisComplete(
  payload: AiAnalysisCompletePayload,
  tenantId: string,
): Promise<void> {
  const fitScore = payload.fitScore ?? 0;

  logger.info(
    `[PIPELINE] ai:analysisComplete received for job ${payload.jobId} — ` +
    `fitScore: ${fitScore}%, recommendation: ${payload.recommendation ?? "N/A"}`,
    { tenantId },
  );

  // Skip if there's no meaningful fit score
  if (fitScore <= 0) {
    logger.info(
      `[PIPELINE] Skipping notification — fitScore is ${fitScore} (no meaningful score)`,
      { tenantId },
    );
    return;
  }

  // Fetch the job to get full details
  const job = await (prisma as unknown as PrismaClient).job.findUnique({
    where: { id: payload.jobId },
    select: {
      id: true,
      title: true,
      job_url: true,
      skills_required: true,
      category: true,
    },
  });

  if (!job) {
    logger.warn(`Job not found for match alert: ${payload.jobId}`);
    return;
  }

  const matchedSkills: string[] = [];
  // Extract matched skills from the analysis if available
  try {
    const analysis = await (
      prisma as unknown as PrismaClient
    ).aiAnalysis.findFirst({
      where: { id: payload.analysisId },
      select: { matched_skills: true },
    });
    if (analysis?.matched_skills) {
      matchedSkills.push(...analysis.matched_skills);
    }
  } catch {
    // Non-critical — continue with empty matched skills
  }

  const alert: JobMatchAlert = {
    jobId: job.id,
    jobTitle: job.title,
    jobUrl: job.job_url,
    matchPercentage: fitScore,
    matchedSkills:
      matchedSkills.length > 0 ? matchedSkills : job.skills_required,
    category: job.category,
    recommendation: payload.recommendation ?? null,
    fitScore,
  };

  const service = getNotificationService();
  await service.processJobMatchAlerts(tenantId, alert);
}
