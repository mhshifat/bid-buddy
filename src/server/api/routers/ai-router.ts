/**
 * AI tRPC router – exposes AI analysis and proposal generation endpoints.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure } from "../trpc";
import { getAiService } from "@/server/ai";
import { logger } from "@/server/lib/logger";
import { eventBus } from "@/server/events";
import { generateCorrelationId } from "@/server/lib/correlation-id";
import type { AiAnalysis, Job } from "@prisma/client";

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

      return {
        questions: result.questions,
        overallTips: result.overallTips,
        communicationAdvice: result.communicationAdvice,
      };
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

