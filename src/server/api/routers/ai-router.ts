/**
 * AI tRPC router – exposes AI analysis and proposal generation endpoints.
 * All AI-generated data is persisted to the ai_insights table for caching.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure } from "../trpc";
import { getAiService } from "@/server/ai";
import { AiRepository } from "@/server/ai/ai-repository";
import { logger } from "@/server/lib/logger";
import { eventBus } from "@/server/events";
import { generateCorrelationId } from "@/server/lib/correlation-id";
import type { AiAnalysis, Job, InsightType, PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const analyseJobInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const generateProposalInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const analyseClientInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const interviewPrepInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const bidStrategyInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const skillGapInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const scopeEstimateInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const discoveryQuestionsInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const contractAdvisorInputSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const insightTypeEnum = z.enum([
  "BID_STRATEGY",
  "INTERVIEW_PREP",
  "SKILL_GAP",
  "SCOPE_ESTIMATE",
  "DISCOVERY_QUESTIONS",
  "CONTRACT_ADVISOR",
  "PROPOSAL_VARIATIONS",
  "CLIENT_INTELLIGENCE",
  "FOLLOW_UP_MESSAGE",
  "SMART_ALERTS",
  "STYLE_TRAINER",
  "WEEKLY_DIGEST",
  "WIN_PATTERNS",
  "PROFILE_OPTIMIZER",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Save an AI insight and return its id. Fire-and-forget friendly. */
async function persistInsight(
  prisma: PrismaClient,
  params: {
    tenantId: string;
    insightType: InsightType;
    result: unknown;
    jobId?: string | null;
    proposalId?: string | null;
  }
): Promise<string> {
  const repo = new AiRepository(prisma);
  return repo.saveInsight({
    tenantId: params.tenantId,
    insightType: params.insightType,
    result: params.result,
    jobId: params.jobId,
    proposalId: params.proposalId,
  });
}

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

type JobForAnalysis = Job & {
  analyses: Pick<AiAnalysis, "fit_score" | "strengths" | "matched_skills" | "suggested_rate">[];
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const aiRouter = createRouter({
  /**
   * Retrieve the most recently cached AI insight for a given type + scope.
   * Returns null if nothing has been generated yet.
   */
  getCachedInsight: publicProcedure
    .input(
      z.object({
        insightType: insightTypeEnum,
        jobId: z.string().optional(),
        proposalId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Derive tenant from job or proposal if provided
      let tenantId: string | null = null;

      if (input.jobId) {
        const job = await ctx.prisma.job.findUnique({
          where: { id: input.jobId },
          select: { tenant_id: true },
        });
        tenantId = job?.tenant_id ?? null;
      } else if (input.proposalId) {
        const proposal = await ctx.prisma.proposal.findUnique({
          where: { id: input.proposalId },
          select: { tenant_id: true },
        });
        tenantId = proposal?.tenant_id ?? null;
      } else {
        // Tenant-level insights: get first tenant
        const tenant = await ctx.prisma.tenant.findFirst({ select: { id: true } });
        tenantId = tenant?.id ?? null;
      }

      if (!tenantId) return null;

      const repo = new AiRepository(ctx.prisma as unknown as PrismaClient);
      const insight = await repo.getLatestInsight({
        tenantId,
        insightType: input.insightType as InsightType,
        jobId: input.jobId ?? null,
        proposalId: input.proposalId ?? null,
      });

      if (!insight) return null;

      return {
        id: insight.id,
        result: insight.result,
        createdAt: insight.createdAt.toISOString(),
      };
    }),

  /**
   * Run a comprehensive AI job fit analysis.
   * Analyses the job for fit, fake probability, and win probability.
   */
  analyseJob: publicProcedure
    .input(analyseJobInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      // TODO: Replace with actual tenant from auth context
      const tenantId = job.tenant_id;

      const aiService = getAiService();

      // Emit analysis started event
      eventBus.emit("ai:analysisStarted", {
        jobId: job.id,
        jobTitle: job.title,
        analysisType: "JOB_FIT",
      }, tenantId);

      try {
        const { analysisId, result } = await aiService.analyseJob(
          {
            jobId: job.id,
            title: job.title,
            description: job.description,
            jobType: job.job_type,
            experienceLevel: job.experience_level,
            budgetMin: job.budget_min ? Number(job.budget_min) : null,
            budgetMax: job.budget_max ? Number(job.budget_max) : null,
            hourlyRateMin: job.hourly_rate_min ? Number(job.hourly_rate_min) : null,
            hourlyRateMax: job.hourly_rate_max ? Number(job.hourly_rate_max) : null,
            estimatedDuration: job.estimated_duration,
            clientCountry: job.client_country,
            clientRating: job.client_rating ? Number(job.client_rating) : null,
            clientTotalSpent: job.client_total_spent ? Number(job.client_total_spent) : null,
            clientTotalHires: job.client_total_hires,
            clientTotalPosted: job.client_total_posted,
            clientHireRate: job.client_hire_rate ? Number(job.client_hire_rate) : null,
            clientPaymentVerified: job.client_payment_verified,
            proposalsCount: job.proposals_count,
            connectsRequired: job.connects_required,
            skillsRequired: job.skills_required,
            category: job.category,
            postedAt: job.posted_at,
          },
          tenantId
        );

        // Emit analysis complete event
        eventBus.emit("ai:analysisComplete", {
          jobId: job.id,
          jobTitle: job.title,
          analysisType: "JOB_FIT",
          analysisId,
          fitScore: result.fitScore,
          fakeProbability: result.fakeProbability,
          winProbability: result.winProbability,
          recommendation: result.recommendation,
        }, tenantId);

        return {
          analysisId,
          fitScore: result.fitScore,
          winProbability: result.winProbability,
          fakeProbability: result.fakeProbability,
          recommendation: result.recommendation,
          reasoning: result.reasoning,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          suggestedRate: result.suggestedRate,
          suggestedDuration: result.suggestedDuration,
          keyPoints: result.keyPoints,
          redFlags: result.redFlags,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
        };
      } catch (error) {
        // Emit analysis failed event
        eventBus.emit("ai:analysisFailed", {
          jobId: job.id,
          jobTitle: job.title,
          analysisType: "JOB_FIT",
          error: error instanceof Error ? error.message : "Unknown error",
          correlationId: ctx.correlationId ?? generateCorrelationId(),
        }, tenantId);

        throw error;
      }
    }),

  /**
   * Generate an AI-powered proposal for a job.
   */
  generateProposal: publicProcedure
    .input(generateProposalInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
        include: {
          analyses: {
            take: 1,
            orderBy: { created_at: "desc" },
            select: {
              fit_score: true,
              strengths: true,
              matched_skills: true,
              suggested_rate: true,
            },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const tenantId = job.tenant_id;
      const typedJob = job as JobForAnalysis;

      const latestAnalysis = typedJob.analyses[0] ?? null;

      const analysisContext = latestAnalysis
        ? {
            fitScore: latestAnalysis.fit_score,
            strengths: latestAnalysis.strengths,
            matchedSkills: latestAnalysis.matched_skills,
            suggestedRate: latestAnalysis.suggested_rate
              ? Number(latestAnalysis.suggested_rate)
              : null,
          }
        : null;

      // ---------------------------------------------------------------
      // Fetch user's GitHub repos (stored as JSON in github_profiles)
      // ---------------------------------------------------------------
      const githubProfile = await ctx.prisma.githubProfile.findFirst({
        where: { tenant_id: tenantId },
        select: { top_repos: true },
      });

      type StoredRepoShape = {
        name: string;
        fullName: string;
        url: string;
        description: string | null;
        language: string | null;
        topics: string[];
        stars: number;
        forks?: number;
        pushedAt?: string;
      };

      const githubRepos: import("@/server/ai/types").GitHubRepoContext[] =
        Array.isArray(githubProfile?.top_repos)
          ? (githubProfile.top_repos as StoredRepoShape[]).map((r) => ({
              name: r.name,
              fullName: r.fullName,
              url: r.url,
              description: r.description ?? null,
              language: r.language ?? null,
              topics: Array.isArray(r.topics) ? r.topics : [],
              stars: r.stars ?? 0,
            }))
          : [];

      const aiService = getAiService();

      // TODO: Replace with actual user from auth context
      const userId = ctx.userId ?? "placeholder-user";

      const { proposalId, result } = await aiService.generateProposal(
        {
          jobTitle: job.title,
          jobDescription: job.description,
          jobType: job.job_type,
          skillsRequired: job.skills_required,
          budgetMin: job.budget_min ? Number(job.budget_min) : null,
          budgetMax: job.budget_max ? Number(job.budget_max) : null,
          hourlyRateMin: job.hourly_rate_min ? Number(job.hourly_rate_min) : null,
          hourlyRateMax: job.hourly_rate_max ? Number(job.hourly_rate_max) : null,
          estimatedDuration: job.estimated_duration,
          analysisContext,
          githubRepos,
        },
        job.id,
        tenantId,
        userId
      );

      // Emit proposal generated event
      eventBus.emit("proposal:generated", {
        proposalId,
        jobId: job.id,
        jobTitle: job.title,
        aiGenerated: true,
      }, tenantId);

      return {
        proposalId,
        coverLetter: result.coverLetter,
        proposedRate: result.proposedRate,
        proposedDuration: result.proposedDuration,
        keySellingPoints: result.keySellingPoints,
        questionsForClient: result.questionsForClient,
        relevantRepos: result.relevantRepos ?? [],
      };
    }),

  /**
   * Analyse the client behind a job for trustworthiness.
   */
  analyseClient: publicProcedure
    .input(analyseClientInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const tenantId = job.tenant_id;

      const aiService = getAiService();

      const { noteId, result } = await aiService.analyseClient(
        job.id,
        tenantId,
        {
          clientCountry: job.client_country,
          clientRating: job.client_rating ? Number(job.client_rating) : null,
          clientTotalSpent: job.client_total_spent ? Number(job.client_total_spent) : null,
          clientTotalHires: job.client_total_hires,
          clientTotalPosted: job.client_total_posted,
          clientHireRate: job.client_hire_rate ? Number(job.client_hire_rate) : null,
          clientPaymentVerified: job.client_payment_verified,
          clientMemberSince: job.client_member_since,
        }
      );

      return {
        noteId,
        trustScore: result.trustScore,
        riskLevel: result.riskLevel,
        insights: result.insights,
        redFlags: result.redFlags,
        recommendation: result.recommendation,
      };
    }),

  /**
   * Generate interview prep questions and answers for a job.
   */
  interviewPrep: publicProcedure
    .input(interviewPrepInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const tenantId = job.tenant_id;
      const aiService = getAiService();

      const { result } = await aiService.generateInterviewPrep(
        {
          jobTitle: job.title,
          jobDescription: job.description,
          jobType: job.job_type,
          skillsRequired: job.skills_required,
          experienceLevel: job.experience_level,
        },
        tenantId
      );

      const interviewPrepResult = {
        questions: result.questions,
        overallTips: result.overallTips,
        communicationAdvice: result.communicationAdvice,
      };

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId,
        insightType: "INTERVIEW_PREP",
        result: interviewPrepResult,
        jobId: job.id,
      });

      return interviewPrepResult;
    }),

  /**
   * Generate a comprehensive bid strategy for a job.
   */
  bidStrategy: publicProcedure
    .input(bidStrategyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
        include: {
          analyses: {
            take: 1,
            orderBy: { created_at: "desc" },
            select: {
              fit_score: true,
              win_probability: true,
              recommendation: true,
              suggested_rate: true,
            },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const tenantId = job.tenant_id;
      const aiService = getAiService();

      const latestAnalysis = (job as Job & { analyses: { fit_score: number | null; win_probability: number | null; recommendation: string | null; suggested_rate: unknown }[] }).analyses[0] ?? null;

      const analysisContext = latestAnalysis
        ? {
            fitScore: latestAnalysis.fit_score,
            winProbability: latestAnalysis.win_probability,
            recommendation: latestAnalysis.recommendation,
            suggestedRate: latestAnalysis.suggested_rate
              ? Number(latestAnalysis.suggested_rate)
              : null,
          }
        : null;

      const { result } = await aiService.generateBidStrategy(
        {
          jobTitle: job.title,
          jobDescription: job.description,
          jobType: job.job_type,
          skillsRequired: job.skills_required,
          budgetMin: job.budget_min ? Number(job.budget_min) : null,
          budgetMax: job.budget_max ? Number(job.budget_max) : null,
          hourlyRateMin: job.hourly_rate_min ? Number(job.hourly_rate_min) : null,
          hourlyRateMax: job.hourly_rate_max ? Number(job.hourly_rate_max) : null,
          estimatedDuration: job.estimated_duration,
          clientCountry: job.client_country,
          clientTotalSpent: job.client_total_spent ? Number(job.client_total_spent) : null,
          clientTotalHires: job.client_total_hires,
          clientHireRate: job.client_hire_rate ? Number(job.client_hire_rate) : null,
          clientPaymentVerified: job.client_payment_verified,
          proposalsCount: job.proposals_count,
          connectsRequired: job.connects_required,
          experienceLevel: job.experience_level,
          analysisContext,
        },
        tenantId
      );

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId,
        insightType: "BID_STRATEGY",
        result,
        jobId: job.id,
      });

      return result;
    }),

  /**
   * Analyse skill gaps between freelancer profile and job requirements.
   */
  skillGap: publicProcedure
    .input(skillGapInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const tenantId = job.tenant_id;
      const aiService = getAiService();

      const { result } = await aiService.analyseSkillGap(
        {
          jobTitle: job.title,
          jobDescription: job.description,
          skillsRequired: job.skills_required,
          experienceLevel: job.experience_level,
        },
        tenantId
      );

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId,
        insightType: "SKILL_GAP",
        result,
        jobId: job.id,
      });

      return result;
    }),

  /**
   * Estimate project scope — break down job into tasks, milestones, hours.
   */
  scopeEstimate: publicProcedure
    .input(scopeEstimateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const tenantId = job.tenant_id;
      const aiService = getAiService();

      const { result } = await aiService.estimateScope(
        {
          jobTitle: job.title,
          jobDescription: job.description,
          jobType: job.job_type,
          skillsRequired: job.skills_required,
          budgetMin: job.budget_min ? Number(job.budget_min) : null,
          budgetMax: job.budget_max ? Number(job.budget_max) : null,
          hourlyRateMin: job.hourly_rate_min ? Number(job.hourly_rate_min) : null,
          hourlyRateMax: job.hourly_rate_max ? Number(job.hourly_rate_max) : null,
          estimatedDuration: job.estimated_duration,
          experienceLevel: job.experience_level,
        },
        tenantId
      );

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId,
        insightType: "SCOPE_ESTIMATE",
        result,
        jobId: job.id,
      });

      return result;
    }),

  /**
   * Generate strategic discovery questions to ask the client.
   */
  discoveryQuestions: publicProcedure
    .input(discoveryQuestionsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const tenantId = job.tenant_id;
      const aiService = getAiService();

      const { result } = await aiService.generateDiscoveryQuestions(
        {
          jobTitle: job.title,
          jobDescription: job.description,
          jobType: job.job_type,
          skillsRequired: job.skills_required,
          budgetMin: job.budget_min ? Number(job.budget_min) : null,
          budgetMax: job.budget_max ? Number(job.budget_max) : null,
          estimatedDuration: job.estimated_duration,
          experienceLevel: job.experience_level,
          clientCountry: job.client_country,
          clientTotalSpent: job.client_total_spent ? Number(job.client_total_spent) : null,
          clientTotalHires: job.client_total_hires,
          clientPaymentVerified: job.client_payment_verified,
        },
        tenantId
      );

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId,
        insightType: "DISCOVERY_QUESTIONS",
        result,
        jobId: job.id,
      });

      return result;
    }),

  /**
   * Contract & negotiation advice for a job.
   */
  contractAdvisor: publicProcedure
    .input(contractAdvisorInputSchema)
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const tenantId = job.tenant_id;
      const aiService = getAiService();

      const { result } = await aiService.adviseContract(
        {
          jobTitle: job.title,
          jobDescription: job.description,
          jobType: job.job_type,
          skillsRequired: job.skills_required,
          budgetMin: job.budget_min ? Number(job.budget_min) : null,
          budgetMax: job.budget_max ? Number(job.budget_max) : null,
          hourlyRateMin: job.hourly_rate_min ? Number(job.hourly_rate_min) : null,
          hourlyRateMax: job.hourly_rate_max ? Number(job.hourly_rate_max) : null,
          estimatedDuration: job.estimated_duration,
          experienceLevel: job.experience_level,
          clientCountry: job.client_country,
          clientTotalSpent: job.client_total_spent ? Number(job.client_total_spent) : null,
          clientTotalHires: job.client_total_hires,
          clientHireRate: job.client_hire_rate ? Number(job.client_hire_rate) : null,
          clientPaymentVerified: job.client_payment_verified,
          proposalsCount: job.proposals_count,
        },
        tenantId
      );

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId,
        insightType: "CONTRACT_ADVISOR",
        result,
        jobId: job.id,
      });

      return result;
    }),

  /**
   * Generate a follow-up message for a submitted proposal.
   */
  followUpMessage: publicProcedure
    .input(z.object({ proposalId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.prisma.proposal.findUnique({
        where: { id: input.proposalId },
        include: { job: true },
      });

      if (!proposal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const daysSince = Math.floor(
        (Date.now() - new Date(proposal.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const aiService = getAiService();
      const { result } = await aiService.generateFollowUp(
        {
          jobTitle: proposal.job.title,
          jobDescription: proposal.job.description,
          proposalCoverLetter: proposal.cover_letter,
          proposalSentAt: proposal.created_at,
          proposalStatus: proposal.status,
          daysSinceSubmission: daysSince,
        },
        proposal.job.tenant_id
      );

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId: proposal.job.tenant_id,
        insightType: "FOLLOW_UP_MESSAGE",
        result,
        proposalId: proposal.id,
        jobId: proposal.job_id,
      });

      return result;
    }),

  /**
   * Generate 3 proposal tone variations for a job.
   */
  proposalVariations: publicProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
        include: {
          analyses: {
            take: 1,
            orderBy: { created_at: "desc" },
            select: { fit_score: true, strengths: true, matched_skills: true, suggested_rate: true },
          },
        },
      });

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      const typedJob = job as JobForAnalysis;
      const latestAnalysis = typedJob.analyses[0] ?? null;
      const analysisContext = latestAnalysis
        ? {
            fitScore: latestAnalysis.fit_score,
            strengths: latestAnalysis.strengths,
            matchedSkills: latestAnalysis.matched_skills,
            suggestedRate: latestAnalysis.suggested_rate ? Number(latestAnalysis.suggested_rate) : null,
          }
        : null;

      const aiService = getAiService();
      const { result } = await aiService.generateProposalVariations(
        {
          jobTitle: job.title,
          jobDescription: job.description,
          jobType: job.job_type,
          skillsRequired: job.skills_required,
          budgetMin: job.budget_min ? Number(job.budget_min) : null,
          budgetMax: job.budget_max ? Number(job.budget_max) : null,
          hourlyRateMin: job.hourly_rate_min ? Number(job.hourly_rate_min) : null,
          hourlyRateMax: job.hourly_rate_max ? Number(job.hourly_rate_max) : null,
          estimatedDuration: job.estimated_duration,
          analysisContext,
        },
        job.tenant_id
      );

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId: job.tenant_id,
        insightType: "PROPOSAL_VARIATIONS",
        result,
        jobId: job.id,
      });

      return result;
    }),

  /**
   * Generate a weekly performance digest.
   */
  weeklyDigest: publicProcedure.mutation(async ({ ctx }) => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      jobsCaptured,
      proposalsSent,
      proposalsWon,
      proposalsRejected,
    ] = await ctx.prisma.$transaction([
      ctx.prisma.job.count({ where: { created_at: { gte: oneWeekAgo } } }),
      ctx.prisma.proposal.count({ where: { status: "SENT", created_at: { gte: oneWeekAgo } } }),
      ctx.prisma.proposal.count({ where: { status: "ACCEPTED", created_at: { gte: oneWeekAgo } } }),
      ctx.prisma.proposal.count({ where: { status: "REJECTED", created_at: { gte: oneWeekAgo } } }),
    ]);

    const connectsAgg = await ctx.prisma.connectsLedger.aggregate({
      _sum: { amount: true },
      where: { transaction_type: "BID_SPENT", created_at: { gte: oneWeekAgo } },
    });

    const analysisAgg = await ctx.prisma.aiAnalysis.aggregate({
      _avg: { fit_score: true, win_probability: true },
      where: { created_at: { gte: oneWeekAgo } },
    });

    const earningsAgg = await ctx.prisma.project.aggregate({
      _sum: { total_earned: true },
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    });

    const activeProjects = await ctx.prisma.project.count({ where: { status: "ACTIVE" } });

    const skills = await ctx.prisma.skill.findMany({ select: { name: true } });

    const aiService = getAiService();
    const { result } = await aiService.generateWeeklyDigest({
      totalJobsCaptured: jobsCaptured,
      totalProposalsSent: proposalsSent,
      totalProposalsWon: proposalsWon,
      totalProposalsRejected: proposalsRejected,
      connectsSpent: connectsAgg._sum?.amount ?? 0,
      topJobCategories: [],
      avgFitScore: analysisAgg._avg.fit_score ?? null,
      avgWinProbability: analysisAgg._avg.win_probability ?? null,
      totalEarnings: earningsAgg._sum.total_earned ? Number(earningsAgg._sum.total_earned) : 0,
      activeProjects,
      skills: skills.map((s) => s.name),
    });

    // Persist weekly digest
    const tenant = await ctx.prisma.tenant.findFirst({ select: { id: true } });
    if (tenant) {
      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId: tenant.id,
        insightType: "WEEKLY_DIGEST",
        result,
      });
    }

    return result;
  }),

  /**
   * Analyse win/loss patterns from proposal history.
   */
  winPatterns: publicProcedure.mutation(async ({ ctx }) => {
    const proposals = await ctx.prisma.proposal.findMany({
      where: { status: { in: ["ACCEPTED", "REJECTED"] } },
      include: { job: { select: { title: true, job_type: true, skills_required: true, category: true } } },
    });

    type ProposalWithJob = typeof proposals[number];

    const winning = proposals
      .filter((p: ProposalWithJob) => p.status === "ACCEPTED")
      .map((p: ProposalWithJob) => ({
        jobTitle: p.job.title,
        jobType: p.job.job_type,
        skills: p.job.skills_required,
        rate: p.proposed_rate ? Number(p.proposed_rate) : null,
        category: p.job.category,
        coverLetterLength: p.cover_letter.length,
      }));

    const losing = proposals
      .filter((p: ProposalWithJob) => p.status === "REJECTED")
      .map((p: ProposalWithJob) => ({
        jobTitle: p.job.title,
        jobType: p.job.job_type,
        skills: p.job.skills_required,
        rate: p.proposed_rate ? Number(p.proposed_rate) : null,
        category: p.job.category,
        coverLetterLength: p.cover_letter.length,
      }));

    const skills = await ctx.prisma.skill.findMany({ select: { name: true } });

    const aiService = getAiService();
    const { result } = await aiService.analyzeWinPatterns({
      winningProposals: winning,
      losingProposals: losing,
      freelancerSkills: skills.map((s) => s.name),
    });

    // Persist win patterns
    const tenant = await ctx.prisma.tenant.findFirst({ select: { id: true } });
    if (tenant) {
      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId: tenant.id,
        insightType: "WIN_PATTERNS",
        result,
      });
    }

    return result;
  }),

  /**
   * Optimise freelancer's Upwork profile.
   */
  profileOptimizer: publicProcedure.mutation(async ({ ctx }) => {
    const upworkProfile = await ctx.prisma.upworkProfile.findFirst();
    const skills = await ctx.prisma.skill.findMany();
    const githubProfile = await ctx.prisma.githubProfile.findFirst();

    const acceptedCount = await ctx.prisma.proposal.count({ where: { status: "ACCEPTED" } });
    const totalSent = await ctx.prisma.proposal.count({ where: { status: { in: ["SENT", "ACCEPTED", "REJECTED"] } } });
    const winRate = totalSent > 0 ? Math.round((acceptedCount / totalSent) * 100) : 0;

    const winningJobs = await ctx.prisma.proposal.findMany({
      where: { status: "ACCEPTED" },
      include: { job: { select: { job_type: true } } },
    });
    const winningJobTypes = [...new Set(winningJobs.map((p) => p.job.job_type))];

    const topLanguages: string[] = [];
    if (githubProfile?.top_languages && typeof githubProfile.top_languages === "object") {
      const langs = githubProfile.top_languages as Record<string, unknown>[];
      if (Array.isArray(langs)) {
        for (const l of langs) {
          if (typeof l === "object" && l !== null && "name" in l && typeof l.name === "string") {
            topLanguages.push(l.name);
          }
        }
      }
    }

    const tenantId = upworkProfile?.tenant_id ?? skills[0]?.tenant_id ?? "";

    const yearsExp: Record<string, number> = {};
    for (const s of skills) {
      if (s.years_experience !== null) yearsExp[s.name] = Number(s.years_experience);
    }

    const aiService = getAiService();
    const { result } = await aiService.optimizeProfile(
      {
        currentTitle: upworkProfile?.title ?? null,
        currentBio: upworkProfile?.overview ?? null,
        skills: skills.map((s) => s.name),
        primarySkills: skills.filter((s) => s.is_primary).map((s) => s.name),
        yearsExperience: yearsExp,
        winningJobTypes,
        topLanguages,
        totalProposals: totalSent,
        winRate,
      },
      tenantId
    );

    if (tenantId) {
      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId,
        insightType: "PROFILE_OPTIMIZER",
        result,
      });
    }

    return result;
  }),

  /**
   * Generate client relationship intelligence report from a Client record.
   */
  clientIntelligence: publicProcedure
    .input(z.object({ clientId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.findUnique({
        where: { id: input.clientId },
        include: {
          projects: {
            select: { title: true, budget: true, status: true },
            take: 20,
          },
        },
      });

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      }

      const aiService = getAiService();
      const { result } = await aiService.analyzeClientIntelligence({
        clientName: client.name,
        clientCountry: client.country ?? null,
        clientRating: client.upwork_rating ? Number(client.upwork_rating) : null,
        clientTotalSpent: client.total_spent ? Number(client.total_spent) : null,
        clientTotalHires: client.total_hires ?? null,
        clientHireRate: null,
        clientPaymentVerified: client.payment_verified,
        clientMemberSince: client.created_at,
        jobs: client.projects.map((p) => ({
          title: p.title,
          budget: p.budget ? Number(p.budget) : null,
          status: p.status,
          skillsRequired: [],
        })),
      });

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId: client.tenant_id,
        insightType: "CLIENT_INTELLIGENCE",
        result,
      });

      return result;
    }),

  /**
   * Generate client relationship intelligence from a job's embedded client data.
   * This is more practical since client info is stored inline on each job.
   */
  clientIntelligenceFromJob: publicProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      // Find other jobs with same client_country + client data to build a richer profile
      const relatedJobs = await ctx.prisma.job.findMany({
        where: {
          tenant_id: job.tenant_id,
          client_country: job.client_country,
          id: { not: job.id },
        },
        select: { title: true, budget_max: true, status: true, skills_required: true },
        take: 20,
      });

      const allJobs = [
        {
          title: job.title,
          budget: job.budget_max ? Number(job.budget_max) : null,
          status: job.status,
          skillsRequired: job.skills_required,
        },
        ...relatedJobs.map((j) => ({
          title: j.title,
          budget: j.budget_max ? Number(j.budget_max) : null,
          status: j.status,
          skillsRequired: j.skills_required,
        })),
      ];

      const aiService = getAiService();
      const { result } = await aiService.analyzeClientIntelligence({
        clientName: null,
        clientCountry: job.client_country,
        clientRating: job.client_rating ? Number(job.client_rating) : null,
        clientTotalSpent: job.client_total_spent ? Number(job.client_total_spent) : null,
        clientTotalHires: job.client_total_hires,
        clientHireRate: job.client_hire_rate ? Number(job.client_hire_rate) : null,
        clientPaymentVerified: job.client_payment_verified,
        clientMemberSince: job.client_member_since,
        jobs: allJobs,
      });

      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId: job.tenant_id,
        insightType: "CLIENT_INTELLIGENCE",
        result,
        jobId: job.id,
      });

      return result;
    }),

  /**
   * Generate smart alerts from pipeline data.
   */
  smartAlerts: publicProcedure.mutation(async ({ ctx }) => {
    const recentJobs = await ctx.prisma.job.findMany({
      orderBy: { created_at: "desc" },
      take: 20,
      include: {
        analyses: {
          take: 1,
          orderBy: { created_at: "desc" },
          select: { fit_score: true, win_probability: true },
        },
      },
    });

    const pendingProposals = await ctx.prisma.proposal.findMany({
      where: { status: { in: ["DRAFT", "SENT"] } },
      include: { job: { select: { title: true } } },
    });

    const skills = await ctx.prisma.skill.findMany({ select: { name: true } });

    const analysisAgg = await ctx.prisma.aiAnalysis.aggregate({
      _avg: { fit_score: true },
    });

    const totalSent = await ctx.prisma.proposal.count({ where: { status: { in: ["SENT", "ACCEPTED", "REJECTED"] } } });
    const totalWon = await ctx.prisma.proposal.count({ where: { status: "ACCEPTED" } });
    const avgWinRate = totalSent > 0 ? Math.round((totalWon / totalSent) * 100) : 0;

    const connectsAgg = await ctx.prisma.connectsLedger.aggregate({
      _sum: { amount: true },
      where: { transaction_type: "PURCHASE" },
    });

    const aiService = getAiService();
    const { result } = await aiService.generateSmartAlerts({
      recentJobs: recentJobs.map((j) => ({
        id: j.id,
        title: j.title,
        fitScore: j.analyses[0]?.fit_score ?? null,
        winProbability: j.analyses[0]?.win_probability ?? null,
        postedAt: j.posted_at?.toISOString() ?? null,
        skillsRequired: j.skills_required,
        budgetMax: j.budget_max ? Number(j.budget_max) : null,
      })),
      pendingProposals: pendingProposals.map((p) => ({
        proposalId: p.id,
        jobId: p.job_id,
        jobTitle: p.job.title,
        daysSinceSubmission: Math.floor(
          (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
        status: p.status,
      })),
      freelancerSkills: skills.map((s) => s.name),
      avgFitScore: analysisAgg._avg.fit_score ?? null,
      avgWinRate,
      connectsBalance: connectsAgg._sum?.amount ?? 0,
    });

    // Persist smart alerts
    const tenantForAlerts = await ctx.prisma.tenant.findFirst({ select: { id: true } });
    if (tenantForAlerts) {
      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId: tenantForAlerts.id,
        insightType: "SMART_ALERTS",
        result,
      });
    }

    return result;
  }),

  /**
   * Analyse the freelancer's writing style from past proposals.
   */
  styleTrainer: publicProcedure.mutation(async ({ ctx }) => {
    const proposals = await ctx.prisma.proposal.findMany({
      where: { status: { in: ["ACCEPTED", "REJECTED", "SENT"] } },
      include: { job: { select: { title: true, job_type: true } } },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    if (proposals.length === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "You need at least 1 proposal to analyse your writing style.",
      });
    }

    const skills = await ctx.prisma.skill.findMany({ select: { name: true } });

    const aiService = getAiService();
    const { result } = await aiService.analyzeWritingStyle({
      sampleProposals: proposals.map((p) => ({
        coverLetter: p.cover_letter,
        wasAccepted: p.status === "ACCEPTED",
        jobType: p.job.job_type,
        jobTitle: p.job.title,
      })),
      freelancerSkills: skills.map((s) => s.name),
    });

    // Persist style trainer
    const tenantForStyle = await ctx.prisma.tenant.findFirst({ select: { id: true } });
    if (tenantForStyle) {
      await persistInsight(ctx.prisma as unknown as PrismaClient, {
        tenantId: tenantForStyle.id,
        insightType: "STYLE_TRAINER",
        result,
      });
    }

    return result;
  }),

  /**
   * AI health check – verifies provider connectivity.
   */
  healthCheck: publicProcedure.query(async () => {
    try {
      const aiService = getAiService();
      const status = await aiService.healthCheck();
      return {
        status: status.healthy ? ("ok" as const) : ("degraded" as const),
        provider: status.provider,
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      };
    } catch (error) {
      logger.error("AI health check failed", error instanceof Error ? error : undefined);
      return {
        status: "error" as const,
        provider: "groq",
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      };
    }
  }),

  /**
   * List AI analyses for a specific job.
   */
  listByJob: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const analyses = await ctx.prisma.aiAnalysis.findMany({
        where: { job_id: input.jobId },
        orderBy: { created_at: "desc" },
      });

      return analyses.map((a: AiAnalysis) => ({
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
        tokensUsed: a.tokens_used,
        createdAt: a.created_at,
      }));
    }),
});

