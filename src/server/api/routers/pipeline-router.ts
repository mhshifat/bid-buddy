/**
 * Pipeline tRPC router — unified journey tracking from job discovery to delivery.
 *
 * Features:
 *   - Full pipeline view (all jobs grouped by phase)
 *   - Pipeline stats and conversion rates
 *   - Job timeline (activity feed for a single job)
 *   - Convert accepted job to project
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { createRouter, publicProcedure } from "../trpc";
import { JourneyService } from "@/server/journey/journey-service";
import { logger } from "@/server/lib/logger";
import type { TrpcContext } from "../trpc";

// ---------------------------------------------------------------------------
// Default Tenant Helper (same pattern as other routers)
// ---------------------------------------------------------------------------

const DEFAULT_TENANT_SLUG = "default";

async function resolveTenantId(ctx: TrpcContext): Promise<string> {
  if (ctx.tenantId) return ctx.tenantId;

  let tenant = await ctx.prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (!tenant) {
    tenant = await ctx.prisma.tenant.create({
      data: { name: "Default Tenant", slug: DEFAULT_TENANT_SLUG },
      select: { id: true },
    });
  }

  return tenant.id;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const pipelineRouter = createRouter({
  /**
   * Get the full pipeline: all jobs grouped by their current journey phase.
   */
  overview: publicProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenantId(ctx);
    const journeyService = new JourneyService(ctx.prisma as unknown as PrismaClient);
    return journeyService.getPipeline(tenantId);
  }),

  /**
   * Get pipeline stats: phase counts + conversion rates.
   */
  stats: publicProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenantId(ctx);
    const journeyService = new JourneyService(ctx.prisma as unknown as PrismaClient);
    return journeyService.getPipelineStats(tenantId);
  }),

  /**
   * Get the timeline (activity feed) for a specific job.
   */
  jobTimeline: publicProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const journeyService = new JourneyService(ctx.prisma as unknown as PrismaClient);
      const activities = await journeyService.getJobTimeline(input.jobId);

      return activities.map((a) => ({
        id: a.id,
        phase: a.phase,
        title: a.title,
        description: a.description,
        metadata: a.metadata,
        createdAt: a.created_at.toISOString(),
      }));
    }),

  /**
   * Convert an accepted job into a project.
   * Links Job → Proposal → Project together.
   */
  convertToProject: publicProcedure
    .input(
      z.object({
        jobId: z.string().min(1),
        clientId: z.string().min(1),
        proposalId: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        budget: z.number().optional(),
        hourlyRate: z.number().optional(),
        estimatedHours: z.number().optional(),
        startDate: z.string().optional(),
        deadline: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      // Fetch the job
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
        select: {
          id: true,
          title: true,
          description: true,
          job_type: true,
          budget_max: true,
          hourly_rate_max: true,
          status: true,
        },
      });

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      // Fetch the proposal if provided
      let proposal: { id: string; proposed_rate: unknown } | null = null;
      if (input.proposalId) {
        proposal = await ctx.prisma.proposal.findUnique({
          where: { id: input.proposalId },
          select: { id: true, proposed_rate: true },
        });
      }

      // Create the project
      const project = await ctx.prisma.project.create({
        data: {
          tenant_id: tenantId,
          client_id: input.clientId,
          job_id: input.jobId,
          proposal_id: input.proposalId ?? null,
          title: input.title ?? job.title,
          description: input.description ?? job.description,
          job_type: job.job_type,
          budget: input.budget ?? (job.budget_max ? Number(job.budget_max) : null),
          hourly_rate:
            input.hourlyRate ??
            (proposal?.proposed_rate ? Number(proposal.proposed_rate) : null) ??
            (job.hourly_rate_max ? Number(job.hourly_rate_max) : null),
          estimated_hours: input.estimatedHours ?? null,
          start_date: input.startDate ? new Date(input.startDate) : new Date(),
          deadline: input.deadline ? new Date(input.deadline) : null,
          status: "ACTIVE",
        },
      });

      // Auto-advance job to ACCEPTED if not already
      if (job.status !== "ACCEPTED") {
        await ctx.prisma.job.update({
          where: { id: input.jobId },
          data: { status: "ACCEPTED" },
        });
      }

      // Log journey activity
      const journeyService = new JourneyService(ctx.prisma as unknown as PrismaClient);
      await journeyService.logActivity({
        tenantId,
        jobId: input.jobId,
        proposalId: input.proposalId ?? null,
        projectId: project.id,
        phase: "PROJECT_STARTED",
        title: "Project started",
        description: `Created project "${project.title}" from accepted job.`,
        metadata: { projectId: project.id, clientId: input.clientId },
      });

      logger.info(`Converted job ${input.jobId} to project ${project.id}`);

      return {
        projectId: project.id,
        projectTitle: project.title,
      };
    }),

  /**
   * Record a payment for a project journey.
   */
  recordPayment: publicProcedure
    .input(
      z.object({
        jobId: z.string().min(1),
        projectId: z.string().min(1),
        amount: z.number().positive(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);
      const journeyService = new JourneyService(ctx.prisma as unknown as PrismaClient);

      await journeyService.logActivity({
        tenantId,
        jobId: input.jobId,
        projectId: input.projectId,
        phase: "PAYMENT_RECEIVED",
        title: `Payment received: $${input.amount.toLocaleString()}`,
        description: input.description ?? `Received $${input.amount.toLocaleString()} payment.`,
        metadata: { amount: input.amount },
      });

      return { success: true };
    }),

  /**
   * Record feedback received (project completed + reviewed).
   */
  recordFeedback: publicProcedure
    .input(
      z.object({
        jobId: z.string().min(1),
        projectId: z.string().min(1),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);
      const journeyService = new JourneyService(ctx.prisma as unknown as PrismaClient);

      await journeyService.logActivity({
        tenantId,
        jobId: input.jobId,
        projectId: input.projectId,
        phase: "FEEDBACK_RECEIVED",
        title: `Feedback: ${input.rating}/5 stars`,
        description: input.feedback ?? `Received ${input.rating}/5 star rating.`,
        metadata: { rating: input.rating, feedback: input.feedback },
      });

      return { success: true };
    }),
});

