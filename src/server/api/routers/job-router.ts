/**
 * Job tRPC router - handles all job-related operations.
 */

import { z } from "zod";
import type { PrismaClient, Job, AiAnalysis, Proposal, JobTag, JobNote } from "@prisma/client";
import { createRouter, publicProcedure } from "../trpc";
import { eventBus } from "@/server/events";
import { logger } from "@/server/lib/logger";
import { JourneyService } from "@/server/journey/journey-service";
import type { TrpcContext } from "../trpc";

// ============================================================================
// Default Tenant Helper
// ============================================================================

const DEFAULT_TENANT_SLUG = "default";

/**
 * Returns a valid tenant ID for the current request.
 * Priority: authenticated user's tenant → default tenant (auto-created).
 */
async function resolveTenantId(ctx: TrpcContext): Promise<string> {
  // 1. Use authenticated tenant if available
  if (ctx.tenantId) {
    return ctx.tenantId;
  }

  // 2. Find or create the default tenant
  let tenant = await ctx.prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (!tenant) {
    logger.info("Creating default tenant for first-time setup");
    tenant = await ctx.prisma.tenant.create({
      data: {
        name: "My Workspace",
        slug: DEFAULT_TENANT_SLUG,
      },
      select: { id: true },
    });
  }

  return tenant.id;
}

const jobFilterSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z
    .enum([
      "NEW",
      "ANALYZED",
      "SHORTLISTED",
      "BIDDING",
      "BID_SENT",
      "INTERVIEWING",
      "ACCEPTED",
      "REJECTED",
      "EXPIRED",
      "SKIPPED",
      "FLAGGED",
    ])
    .optional(),
  jobType: z.enum(["HOURLY", "FIXED_PRICE"]).optional(),
  experienceLevel: z.enum(["ENTRY", "INTERMEDIATE", "EXPERT"]).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["posted_at", "budget_max", "connects_required", "created_at"])
    .default("created_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  isFlaggedFake: z.boolean().optional(),
  isDuplicate: z.boolean().optional(),
});

const createJobSchema = z.object({
  upworkJobId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  jobType: z.enum(["HOURLY", "FIXED_PRICE"]),
  experienceLevel: z.enum(["ENTRY", "INTERMEDIATE", "EXPERT"]).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  hourlyRateMin: z.number().optional(),
  hourlyRateMax: z.number().optional(),
  estimatedDuration: z.string().optional(),
  jobUrl: z.string().url(),
  clientCountry: z.string().optional(),
  clientRating: z.number().min(0).max(5).optional(),
  clientTotalSpent: z.number().optional(),
  clientTotalHires: z.number().optional(),
  clientTotalPosted: z.number().optional(),
  clientHireRate: z.number().optional(),
  clientMemberSince: z.string().optional(),
  clientPaymentVerified: z.boolean().default(false),
  proposalsCount: z.number().optional(),
  connectsRequired: z.number().optional(),
  isFeatured: z.boolean().default(false),
  postedAt: z.string().optional(),
  skillsRequired: z.array(z.string()).default([]),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  rawData: z.record(z.string(), z.unknown()).optional(),
});

type JobWithAnalysesAndCount = Job & {
  analyses: Pick<AiAnalysis, "fit_score" | "fake_probability" | "win_probability" | "recommendation">[];
  _count: { proposals: number };
};

type JobWithRelations = Job & {
  analyses: AiAnalysis[];
  proposals: Proposal[];
  tags: JobTag[];
  notes: JobNote[];
  duplicate_of: { id: string; title: string } | null;
  duplicates: { id: string; title: string }[];
};

export const jobRouter = createRouter({
  /**
   * List jobs with pagination, filtering, and sorting.
   */
  list: publicProcedure.input(jobFilterSchema).query(async ({ ctx, input }) => {
    const skip = (input.page - 1) * input.pageSize;

    // Build where clause dynamically
    const where: Record<string, unknown> = {};

    // Scope to the user's tenant (or default tenant)
    const tenantId = await resolveTenantId(ctx);
    where.tenant_id = tenantId;

    if (input.status) {
      where.status = input.status;
    }
    if (input.jobType) {
      where.job_type = input.jobType;
    }
    if (input.experienceLevel) {
      where.experience_level = input.experienceLevel;
    }
    if (input.isFlaggedFake !== undefined) {
      where.is_flagged_fake = input.isFlaggedFake;
    }
    if (input.isDuplicate !== undefined) {
      where.is_duplicate = input.isDuplicate;
    }
    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: "insensitive" as const } },
        { description: { contains: input.search, mode: "insensitive" as const } },
      ];
    }

    const [items, total] = await ctx.prisma.$transaction([
      ctx.prisma.job.findMany({
        where,
        skip,
        take: input.pageSize,
        orderBy: { [input.sortBy]: input.sortDirection },
        include: {
          analyses: {
            take: 1,
            orderBy: { created_at: "desc" },
            select: {
              fit_score: true,
              fake_probability: true,
              win_probability: true,
              recommendation: true,
            },
          },
          _count: {
            select: { proposals: true },
          },
        },
      }),
      ctx.prisma.job.count({ where }),
    ]);

    const totalPages = Math.ceil(total / input.pageSize);

    return {
      items: (items as JobWithAnalysesAndCount[]).map((job) => ({
        id: job.id,
        upworkJobId: job.upwork_job_id,
        title: job.title,
        description:
          job.description.length > 200
            ? `${job.description.substring(0, 200)}...`
            : job.description,
        jobType: job.job_type,
        experienceLevel: job.experience_level,
        budgetMin: job.budget_min ? Number(job.budget_min) : null,
        budgetMax: job.budget_max ? Number(job.budget_max) : null,
        hourlyRateMin: job.hourly_rate_min ? Number(job.hourly_rate_min) : null,
        hourlyRateMax: job.hourly_rate_max ? Number(job.hourly_rate_max) : null,
        estimatedDuration: job.estimated_duration,
        jobUrl: job.job_url,
        clientCountry: job.client_country,
        clientRating: job.client_rating ? Number(job.client_rating) : null,
        clientTotalSpent: job.client_total_spent
          ? Number(job.client_total_spent)
          : null,
        clientPaymentVerified: job.client_payment_verified,
        proposalsCount: job.proposals_count,
        connectsRequired: job.connects_required,
        isFeatured: job.is_featured,
        isDuplicate: job.is_duplicate,
        isFlaggedFake: job.is_flagged_fake,
        status: job.status,
        postedAt: job.posted_at,
        capturedAt: job.captured_at,
        skillsRequired: job.skills_required,
        category: job.category,
        latestAnalysis: job.analyses[0]
          ? {
              fitScore: job.analyses[0].fit_score,
              fakeProbability: job.analyses[0].fake_probability,
              winProbability: job.analyses[0].win_probability,
              recommendation: job.analyses[0].recommendation,
            }
          : null,
        proposalCount: job._count.proposals,
      })),
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages,
      hasNext: input.page < totalPages,
      hasPrevious: input.page > 1,
    };
  }),

  /**
   * Get a single job by ID with full details.
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.id },
        include: {
          analyses: {
            orderBy: { created_at: "desc" },
          },
          proposals: {
            orderBy: { created_at: "desc" },
          },
          tags: true,
          notes: {
            orderBy: { created_at: "desc" },
          },
          duplicate_of: {
            select: { id: true, title: true },
          },
          duplicates: {
            select: { id: true, title: true },
          },
        },
      });

      if (!job) {
        return null;
      }

      const typedJob = job as JobWithRelations;

      return {
        id: typedJob.id,
        upworkJobId: typedJob.upwork_job_id,
        title: typedJob.title,
        description: typedJob.description,
        jobType: typedJob.job_type,
        experienceLevel: typedJob.experience_level,
        budgetMin: typedJob.budget_min ? Number(typedJob.budget_min) : null,
        budgetMax: typedJob.budget_max ? Number(typedJob.budget_max) : null,
        hourlyRateMin: typedJob.hourly_rate_min ? Number(typedJob.hourly_rate_min) : null,
        hourlyRateMax: typedJob.hourly_rate_max ? Number(typedJob.hourly_rate_max) : null,
        estimatedDuration: typedJob.estimated_duration,
        jobUrl: typedJob.job_url,
        clientCountry: typedJob.client_country,
        clientRating: typedJob.client_rating ? Number(typedJob.client_rating) : null,
        clientTotalSpent: typedJob.client_total_spent
          ? Number(typedJob.client_total_spent)
          : null,
        clientTotalHires: typedJob.client_total_hires,
        clientTotalPosted: typedJob.client_total_posted,
        clientHireRate: typedJob.client_hire_rate
          ? Number(typedJob.client_hire_rate)
          : null,
        clientMemberSince: typedJob.client_member_since,
        clientPaymentVerified: typedJob.client_payment_verified,
        proposalsCount: typedJob.proposals_count,
        connectsRequired: typedJob.connects_required,
        isFeatured: typedJob.is_featured,
        isDuplicate: typedJob.is_duplicate,
        isFlaggedFake: typedJob.is_flagged_fake,
        status: typedJob.status,
        postedAt: typedJob.posted_at,
        capturedAt: typedJob.captured_at,
        skillsRequired: typedJob.skills_required,
        category: typedJob.category,
        subcategory: typedJob.subcategory,
        analyses: typedJob.analyses.map((a: AiAnalysis) => ({
          id: a.id,
          analysisType: a.analysis_type,
          fitScore: a.fit_score,
          fakeProbability: a.fake_probability,
          winProbability: a.win_probability,
          recommendation: a.recommendation,
          reasoning: a.reasoning,
          strengths: a.strengths,
          weaknesses: a.weaknesses,
          suggestedRate: a.suggested_rate ? Number(a.suggested_rate) : null,
          suggestedDuration: a.suggested_duration,
          keyPoints: a.key_points,
          redFlags: a.red_flags,
          matchedSkills: a.matched_skills,
          missingSkills: a.missing_skills,
          modelUsed: a.model_used,
          createdAt: a.created_at,
        })),
        proposals: typedJob.proposals.map((p: Proposal) => ({
          id: p.id,
          status: p.status,
          coverLetter: p.cover_letter,
          proposedRate: p.proposed_rate ? Number(p.proposed_rate) : null,
          proposedDuration: p.proposed_duration,
          aiGenerated: p.ai_generated,
          createdAt: p.created_at,
        })),
        tags: typedJob.tags.map((t: JobTag) => t.tag),
        notes: typedJob.notes.map((n: JobNote) => ({
          id: n.id,
          content: n.content,
          createdAt: n.created_at,
        })),
        duplicateOf: typedJob.duplicate_of,
        duplicates: typedJob.duplicates,
      };
    }),

  /**
   * Create a new job (primarily used by the browser extension).
   */
  create: publicProcedure
    .input(createJobSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      // Upsert: skip if this Upwork job was already captured for this tenant
      const existing = await ctx.prisma.job.findUnique({
        where: {
          tenant_id_upwork_job_id: {
            tenant_id: tenantId,
            upwork_job_id: input.upworkJobId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        logger.info(`Job already captured: ${input.upworkJobId}`, {
          correlationId: ctx.correlationId,
        });
        return { id: existing.id, alreadyExists: true };
      }

      const job = await ctx.prisma.job.create({
        data: {
          tenant_id: tenantId,
          upwork_job_id: input.upworkJobId,
          title: input.title,
          description: input.description,
          job_type: input.jobType,
          experience_level: input.experienceLevel,
          budget_min: input.budgetMin,
          budget_max: input.budgetMax,
          hourly_rate_min: input.hourlyRateMin,
          hourly_rate_max: input.hourlyRateMax,
          estimated_duration: input.estimatedDuration,
          job_url: input.jobUrl,
          client_country: input.clientCountry,
          client_rating: input.clientRating,
          client_total_spent: input.clientTotalSpent,
          client_total_hires: input.clientTotalHires,
          client_total_posted: input.clientTotalPosted,
          client_hire_rate: input.clientHireRate,
          client_member_since: input.clientMemberSince
            ? new Date(input.clientMemberSince)
            : undefined,
          client_payment_verified: input.clientPaymentVerified,
          proposals_count: input.proposalsCount,
          connects_required: input.connectsRequired,
          is_featured: input.isFeatured,
          posted_at: input.postedAt ? new Date(input.postedAt) : undefined,
          skills_required: input.skillsRequired,
          category: input.category,
          subcategory: input.subcategory,
          raw_data: input.rawData ? JSON.parse(JSON.stringify(input.rawData)) : undefined,
        },
      });

      // Emit real-time event for job capture
      eventBus.emit("job:captured", {
        jobId: job.id,
        title: job.title,
        jobType: job.job_type as "HOURLY" | "FIXED_PRICE",
        jobUrl: job.job_url,
        skillsRequired: job.skills_required,
        capturedAt: job.captured_at.toISOString(),
      }, tenantId);

      // Log journey: job discovered
      const journeyService = new JourneyService(ctx.prisma as unknown as PrismaClient);
      await journeyService.onJobCaptured({
        tenantId,
        jobId: job.id,
        jobTitle: job.title,
        source: "Upwork",
      });

      return { id: job.id };
    }),

  /**
   * Update job status.
   */
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "NEW",
          "ANALYZED",
          "SHORTLISTED",
          "BIDDING",
          "BID_SENT",
          "INTERVIEWING",
          "ACCEPTED",
          "REJECTED",
          "EXPIRED",
          "SKIPPED",
          "FLAGGED",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch the existing job to get the old status and title
      const existingJob = await ctx.prisma.job.findUnique({
        where: { id: input.id },
        select: { status: true, title: true, tenant_id: true },
      });

      await ctx.prisma.job.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      // Emit real-time event for status change
      if (existingJob) {
        eventBus.emit("job:statusChanged", {
          jobId: input.id,
          title: existingJob.title,
          previousStatus: existingJob.status,
          newStatus: input.status,
        }, existingJob.tenant_id);

        // Log journey activity
        const journeyService = new JourneyService(ctx.prisma as unknown as PrismaClient);
        await journeyService.onJobStatusChanged({
          tenantId: existingJob.tenant_id,
          jobId: input.id,
          oldStatus: existingJob.status,
          newStatus: input.status,
          jobTitle: existingJob.title,
        });
      }

      return { success: true };
    }),

  /**
   * Get AI analysis scores for jobs by their Upwork job IDs.
   * Used by the browser extension to show Quick-Score badges on Upwork pages.
   */
  scoresByUpworkIds: publicProcedure
    .input(z.object({ upworkJobIds: z.array(z.string()).max(50) }))
    .query(async ({ ctx, input }) => {
      if (input.upworkJobIds.length === 0) return [];

      const jobs = await ctx.prisma.job.findMany({
        where: { upwork_job_id: { in: input.upworkJobIds } },
        select: {
          upwork_job_id: true,
          analyses: {
            take: 1,
            orderBy: { created_at: "desc" },
            select: {
              fit_score: true,
              win_probability: true,
              recommendation: true,
            },
          },
        },
      });

      return jobs.map((j) => ({
        upworkJobId: j.upwork_job_id,
        fitScore: j.analyses[0]?.fit_score ?? null,
        winProbability: j.analyses[0]?.win_probability ?? null,
        recommendation: j.analyses[0]?.recommendation ?? null,
      }));
    }),

  /**
   * Check which Upwork job IDs already exist in the database.
   * Used by the browser extension auto-scan to deduplicate before sending.
   */
  checkExisting: publicProcedure
    .input(z.object({ upworkJobIds: z.array(z.string()).max(100) }))
    .query(async ({ ctx, input }) => {
      if (input.upworkJobIds.length === 0) return [];

      const tenantId = await resolveTenantId(ctx);

      const existing = await ctx.prisma.job.findMany({
        where: {
          tenant_id: tenantId,
          upwork_job_id: { in: input.upworkJobIds },
        },
        select: { upwork_job_id: true },
      });

      return existing.map((j) => j.upwork_job_id);
    }),

  /**
   * Get job stats for the dashboard.
   */
  stats: publicProcedure.query(async ({ ctx }) => {
    const [
      totalJobs,
      newJobs,
      shortlistedJobs,
      bidsSent,
      activeInterviews,
      acceptedJobs,
      flaggedFake,
    ] = await ctx.prisma.$transaction([
      ctx.prisma.job.count(),
      ctx.prisma.job.count({ where: { status: "NEW" } }),
      ctx.prisma.job.count({ where: { status: "SHORTLISTED" } }),
      ctx.prisma.job.count({ where: { status: "BID_SENT" } }),
      ctx.prisma.job.count({ where: { status: "INTERVIEWING" } }),
      ctx.prisma.job.count({ where: { status: "ACCEPTED" } }),
      ctx.prisma.job.count({ where: { is_flagged_fake: true } }),
    ]);

    return {
      totalJobs,
      newJobs,
      shortlistedJobs,
      bidsSent,
      activeInterviews,
      acceptedJobs,
      flaggedFake,
    };
  }),
});
