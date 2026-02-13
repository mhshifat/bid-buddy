/**
 * AI Analysis Service.
 *
 * Orchestrates AI operations by combining the provider, prompts, and repository.
 * Follows the Service pattern — business logic lives here, not in routers.
 */

import type { PrismaClient } from "@prisma/client";
import { logger } from "@/server/lib/logger";
import { AppError, ExternalServiceError } from "@/server/lib/errors";
import type { AiProvider } from "./ai-provider";
import { AiRepository } from "./ai-repository";
import {
  buildJobFitPrompt,
  buildProposalPrompt,
  buildClientAnalysisPrompt,
  buildInterviewPrepPrompt,
  buildBidStrategyPrompt,
  buildSkillGapPrompt,
} from "./prompts";
import type {
  JobAnalysisInput,
  FreelancerContext,
  JobFitAnalysisResult,
  ProposalGenerationInput,
  ProposalGenerationResult,
  ClientAnalysisInput,
  ClientAnalysisResult,
  InterviewPrepInput,
  InterviewPrepResult,
  BidStrategyInput,
  BidStrategyResult,
  SkillGapInput,
  SkillGapResult,
} from "./types";

// ---------------------------------------------------------------------------
// JSON parsing helper
// ---------------------------------------------------------------------------

function safeParseJson<T>(raw: string, label: string): T {
  try {
    // Strip markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    return JSON.parse(cleaned) as T;
  } catch (error) {
    logger.error(`Failed to parse AI JSON response for ${label}`, error instanceof Error ? error : undefined);
    throw new AppError({
      message: `AI returned invalid JSON for ${label}: ${(error instanceof Error ? error.message : String(error))}`,
      userMessage:
        "The AI returned an unexpected response. Please try again.",
      statusCode: 502,
    });
  }
}

// ---------------------------------------------------------------------------
// Service Implementation
// ---------------------------------------------------------------------------

export class AiService {
  private readonly repository: AiRepository;

  constructor(
    private readonly provider: AiProvider,
    prisma: PrismaClient
  ) {
    this.repository = new AiRepository(prisma);
  }

  // -----------------------------------------------------------------------
  // Job Fit Analysis
  // -----------------------------------------------------------------------

  /**
   * Runs a comprehensive job fit analysis using AI.
   * Returns the analysis result and saves it to the database.
   */
  async analyseJob(
    job: JobAnalysisInput,
    tenantId: string,
    freelancerOverride?: FreelancerContext
  ): Promise<{ analysisId: string; result: JobFitAnalysisResult }> {
    const startTime = Date.now();

    logger.info(`Starting job analysis for job ${job.jobId}`, {
      tenantId,
      provider: this.provider.name,
    });

    // Resolve freelancer context
    const freelancer =
      freelancerOverride ??
      (await this.repository.getFreelancerSkills(tenantId));

    // Build prompt & call AI
    const messages = buildJobFitPrompt(job, freelancer);

    const completion = await this.provider.complete({
      model: this.provider.defaultModel,
      messages,
      temperature: 0.4,
      jsonMode: true,
    });

    const result = safeParseJson<JobFitAnalysisResult>(
      completion.content,
      "job_fit_analysis"
    );

    // Validate score ranges
    result.fitScore = clamp(result.fitScore, 0, 100);
    result.winProbability = clamp(result.winProbability, 0, 100);
    result.fakeProbability = clamp(result.fakeProbability, 0, 100);

    // Persist analysis
    const analysisId = await this.repository.saveJobAnalysis({
      jobId: job.jobId,
      tenantId,
      analysisType: "JOB_FIT",
      fitScore: result.fitScore,
      winProbability: result.winProbability,
      fakeProbability: result.fakeProbability,
      recommendation: result.recommendation,
      reasoning: result.reasoning,
      strengths: result.strengths ?? [],
      weaknesses: result.weaknesses ?? [],
      suggestedRate: result.suggestedRate,
      suggestedDuration: result.suggestedDuration,
      keyPoints: result.keyPoints ?? [],
      redFlags: result.redFlags ?? [],
      matchedSkills: result.matchedSkills ?? [],
      missingSkills: result.missingSkills ?? [],
      modelUsed: completion.model,
      tokensUsed: completion.tokensUsed,
      promptTokens: completion.promptTokens,
      completionTokens: completion.completionTokens,
    });

    // Update job status & flags
    await this.repository.updateJobFromAnalysis(job.jobId, result);

    const duration = Date.now() - startTime;
    logger.info(
      `Job analysis complete for ${job.jobId} in ${duration}ms — recommendation: ${result.recommendation}`,
      { analysisId, tokensUsed: String(completion.tokensUsed) }
    );

    return { analysisId, result };
  }

  // -----------------------------------------------------------------------
  // Proposal Generation
  // -----------------------------------------------------------------------

  /**
   * Generates an AI-powered proposal for a job.
   * Returns the generated content and saves a draft proposal.
   */
  async generateProposal(
    input: ProposalGenerationInput,
    jobId: string,
    tenantId: string,
    userId: string,
    freelancerOverride?: FreelancerContext
  ): Promise<{ proposalId: string; result: ProposalGenerationResult }> {
    const startTime = Date.now();

    logger.info(`Starting proposal generation for job ${jobId}`, {
      tenantId,
      provider: this.provider.name,
    });

    const freelancer =
      freelancerOverride ??
      (await this.repository.getFreelancerSkills(tenantId));

    const messages = buildProposalPrompt(input, freelancer);

    const completion = await this.provider.complete({
      model: this.provider.defaultModel,
      messages,
      temperature: 0.7,
      jsonMode: true,
    });

    const result = safeParseJson<ProposalGenerationResult>(
      completion.content,
      "proposal_generation"
    );

    // Persist draft proposal
    const proposalId = await this.repository.saveProposal({
      jobId,
      tenantId,
      userId,
      coverLetter: result.coverLetter,
      proposedRate: result.proposedRate,
      proposedDuration: result.proposedDuration,
      aiGenerated: true,
      aiVersion: `${this.provider.name}/${completion.model}`,
    });

    const duration = Date.now() - startTime;
    logger.info(
      `Proposal generated for job ${jobId} in ${duration}ms`,
      { proposalId, tokensUsed: String(completion.tokensUsed) }
    );

    return { proposalId, result };
  }

  // -----------------------------------------------------------------------
  // Client Analysis
  // -----------------------------------------------------------------------

  /**
   * Analyses a client profile for trustworthiness.
   * Results are saved as a job note.
   */
  async analyseClient(
    jobId: string,
    tenantId: string,
    client: ClientAnalysisInput
  ): Promise<{ noteId: string; result: ClientAnalysisResult }> {
    const startTime = Date.now();

    logger.info(`Starting client analysis for job ${jobId}`, {
      tenantId,
      provider: this.provider.name,
    });

    const messages = buildClientAnalysisPrompt(client);

    const completion = await this.provider.complete({
      model: this.provider.defaultModel,
      messages,
      temperature: 0.3,
      jsonMode: true,
    });

    const result = safeParseJson<ClientAnalysisResult>(
      completion.content,
      "client_analysis"
    );

    result.trustScore = clamp(result.trustScore, 0, 100);

    const noteId = await this.repository.saveClientAnalysisAsNote(
      jobId,
      tenantId,
      result
    );

    const duration = Date.now() - startTime;
    logger.info(
      `Client analysis complete for job ${jobId} in ${duration}ms — trust: ${result.trustScore}`,
      { noteId, tokensUsed: String(completion.tokensUsed) }
    );

    return { noteId, result };
  }

  // -----------------------------------------------------------------------
  // Interview Prep
  // -----------------------------------------------------------------------

  /**
   * Generates interview questions and suggested answers for a job.
   */
  async generateInterviewPrep(
    input: InterviewPrepInput,
    tenantId: string,
    freelancerOverride?: FreelancerContext
  ): Promise<{ result: InterviewPrepResult }> {
    const startTime = Date.now();

    logger.info(`Starting interview prep for job "${input.jobTitle}"`, {
      tenantId,
      provider: this.provider.name,
    });

    const freelancer =
      freelancerOverride ??
      (await this.repository.getFreelancerSkills(tenantId));

    const messages = buildInterviewPrepPrompt(input, freelancer);

    const completion = await this.provider.complete({
      model: this.provider.defaultModel,
      messages,
      temperature: 0.6,
      jsonMode: true,
    });

    const result = safeParseJson<InterviewPrepResult>(
      completion.content,
      "interview_prep"
    );

    const duration = Date.now() - startTime;
    logger.info(
      `Interview prep complete for "${input.jobTitle}" in ${duration}ms — ${result.questions.length} questions`,
      { tokensUsed: String(completion.tokensUsed) }
    );

    return { result };
  }

  // -----------------------------------------------------------------------
  // Bid Strategy
  // -----------------------------------------------------------------------

  /**
   * Generates a comprehensive bid strategy for a job.
   */
  async generateBidStrategy(
    input: BidStrategyInput,
    tenantId: string,
    freelancerOverride?: FreelancerContext
  ): Promise<{ result: BidStrategyResult }> {
    const startTime = Date.now();

    logger.info(`Starting bid strategy for "${input.jobTitle}"`, {
      tenantId,
      provider: this.provider.name,
    });

    const freelancer =
      freelancerOverride ??
      (await this.repository.getFreelancerSkills(tenantId));

    const messages = buildBidStrategyPrompt(input, freelancer);

    const completion = await this.provider.complete({
      model: this.provider.defaultModel,
      messages,
      temperature: 0.5,
      jsonMode: true,
    });

    const result = safeParseJson<BidStrategyResult>(
      completion.content,
      "bid_strategy"
    );

    const duration = Date.now() - startTime;
    logger.info(
      `Bid strategy complete for "${input.jobTitle}" in ${duration}ms — recommended rate: $${result.recommendedRate}`,
      { tokensUsed: String(completion.tokensUsed) }
    );

    return { result };
  }

  // -----------------------------------------------------------------------
  // Skill Gap Analysis
  // -----------------------------------------------------------------------

  /**
   * Analyses the freelancer's skill gaps for a specific job.
   */
  async analyseSkillGap(
    input: SkillGapInput,
    tenantId: string,
    freelancerOverride?: FreelancerContext
  ): Promise<{ result: SkillGapResult }> {
    const startTime = Date.now();

    logger.info(`Starting skill gap analysis for "${input.jobTitle}"`, {
      tenantId,
      provider: this.provider.name,
    });

    const freelancer =
      freelancerOverride ??
      (await this.repository.getFreelancerSkills(tenantId));

    const messages = buildSkillGapPrompt(input, freelancer);

    const completion = await this.provider.complete({
      model: this.provider.defaultModel,
      messages,
      temperature: 0.3,
      jsonMode: true,
    });

    const result = safeParseJson<SkillGapResult>(
      completion.content,
      "skill_gap"
    );

    result.overallReadiness = clamp(result.overallReadiness, 0, 100);

    const duration = Date.now() - startTime;
    logger.info(
      `Skill gap analysis complete for "${input.jobTitle}" in ${duration}ms — readiness: ${result.overallReadiness}%`,
      { tokensUsed: String(completion.tokensUsed) }
    );

    return { result };
  }

  // -----------------------------------------------------------------------
  // Health Check
  // -----------------------------------------------------------------------

  /**
   * Checks if the AI provider is healthy and reachable.
   */
  async healthCheck(): Promise<{ provider: string; healthy: boolean }> {
    const healthy = await this.provider.healthCheck();
    return { provider: this.provider.name, healthy };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Factory – Creates the default AiService singleton
// ---------------------------------------------------------------------------

import { getGroqProvider } from "./groq-provider";
import { prisma } from "@/server/db/prisma";

let aiServiceInstance: AiService | null = null;

/**
 * Returns a singleton AiService backed by Groq.
 */
export function getAiService(): AiService {
  if (aiServiceInstance) {
    return aiServiceInstance;
  }

  const provider = getGroqProvider();
  aiServiceInstance = new AiService(provider, prisma as unknown as PrismaClient);
  return aiServiceInstance;
}

