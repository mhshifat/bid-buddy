/**
 * AI Analysis Repository.
 *
 * Handles all database operations for AI analyses and related records.
 * Follows the Repository pattern to encapsulate data-access logic.
 */

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import type { JobFitAnalysisResult, ClientAnalysisResult } from "./types";

// ---------------------------------------------------------------------------
// Types for repository input
// ---------------------------------------------------------------------------

export interface SaveJobAnalysisParams {
  jobId: string;
  tenantId: string;
  analysisType: "JOB_FIT" | "FAKE_DETECTION" | "DUPLICATE_CHECK" | "PROPOSAL_REVIEW" | "CLIENT_ANALYSIS";
  fitScore: number | null;
  winProbability: number | null;
  fakeProbability: number | null;
  recommendation: string;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  suggestedRate: number | null;
  suggestedDuration: string | null;
  keyPoints: string[];
  redFlags: string[];
  matchedSkills: string[];
  missingSkills: string[];
  modelUsed: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
}

export interface SaveProposalParams {
  jobId: string;
  tenantId: string;
  userId: string;
  coverLetter: string;
  proposedRate: number | null;
  proposedDuration: string | null;
  aiGenerated: boolean;
  aiVersion: string | null;
}

// ---------------------------------------------------------------------------
// Repository Implementation
// ---------------------------------------------------------------------------

export class AiRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Saves a job analysis result to the database.
   */
  async saveJobAnalysis(params: SaveJobAnalysisParams): Promise<string> {
    try {
      const analysis = await this.prisma.aiAnalysis.create({
        data: {
          job_id: params.jobId,
          tenant_id: params.tenantId,
          analysis_type: params.analysisType,
          fit_score: params.fitScore,
          win_probability: params.winProbability,
          fake_probability: params.fakeProbability,
          recommendation: params.recommendation,
          reasoning: params.reasoning,
          strengths: params.strengths,
          weaknesses: params.weaknesses,
          suggested_rate: params.suggestedRate,
          suggested_duration: params.suggestedDuration,
          key_points: params.keyPoints,
          red_flags: params.redFlags,
          matched_skills: params.matchedSkills,
          missing_skills: params.missingSkills,
          model_used: params.modelUsed,
          tokens_used: params.tokensUsed,
          raw_response: {
            promptTokens: params.promptTokens,
            completionTokens: params.completionTokens,
          },
        },
      });

      return analysis.id;
    } catch (error) {
      logger.error("Failed to save AI analysis", error instanceof Error ? error : undefined);
      throw new DatabaseError(
        "saveJobAnalysis",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Updates job flags based on AI analysis (fake flag, status).
   */
  async updateJobFromAnalysis(
    jobId: string,
    result: JobFitAnalysisResult
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        status: "ANALYZED",
      };

      // Flag job if high fake probability
      if (result.fakeProbability >= 70) {
        updateData.is_flagged_fake = true;
      }

      await this.prisma.job.update({
        where: { id: jobId },
        data: updateData,
      });
    } catch (error) {
      logger.error("Failed to update job from analysis", error instanceof Error ? error : undefined);
      throw new DatabaseError(
        "updateJobFromAnalysis",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Saves a generated proposal to the database.
   */
  async saveProposal(params: SaveProposalParams): Promise<string> {
    try {
      const proposal = await this.prisma.proposal.create({
        data: {
          job_id: params.jobId,
          tenant_id: params.tenantId,
          user_id: params.userId,
          cover_letter: params.coverLetter,
          proposed_rate: params.proposedRate,
          proposed_duration: params.proposedDuration,
          ai_generated: params.aiGenerated,
          ai_version: params.aiVersion ? 1 : null,
          status: "DRAFT",
        },
      });

      return proposal.id;
    } catch (error) {
      logger.error("Failed to save proposal", error instanceof Error ? error : undefined);
      throw new DatabaseError(
        "saveProposal",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Fetches user skills for the freelancer context.
   */
  async getFreelancerSkills(tenantId: string): Promise<{
    skills: string[];
    primarySkills: string[];
    yearsExperience: Record<string, number>;
  }> {
    try {
      const skills = await this.prisma.skill.findMany({
        where: { tenant_id: tenantId },
        orderBy: [{ is_primary: "desc" }, { proficiency: "desc" }],
      });

      const allSkills = skills.map((s) => s.name);
      const primarySkills = skills
        .filter((s) => s.is_primary)
        .map((s) => s.name);

      const yearsExperience: Record<string, number> = {};
      for (const s of skills) {
        if (s.years_experience !== null) {
          yearsExperience[s.name] = Number(s.years_experience);
        }
      }

      return { skills: allSkills, primarySkills, yearsExperience };
    } catch (error) {
      logger.error("Failed to fetch freelancer skills", error instanceof Error ? error : undefined);
      throw new DatabaseError(
        "getFreelancerSkills",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Saves a client analysis to the database (stored as a job note with metadata).
   */
  async saveClientAnalysisAsNote(
    jobId: string,
    _tenantId: string,
    result: ClientAnalysisResult
  ): Promise<string> {
    try {
      const content = [
        `**Client Trust Score:** ${result.trustScore}/100`,
        `**Risk Level:** ${result.riskLevel}`,
        "",
        "**Insights:**",
        ...result.insights.map((i) => `• ${i}`),
        "",
        "**Red Flags:**",
        ...(result.redFlags.length > 0
          ? result.redFlags.map((f) => `⚠️ ${f}`)
          : ["None identified"]),
        "",
        `**Recommendation:** ${result.recommendation}`,
      ].join("\n");

      const note = await this.prisma.jobNote.create({
        data: {
          job_id: jobId,
          content,
        },
      });

      return note.id;
    } catch (error) {
      logger.error("Failed to save client analysis note", error instanceof Error ? error : undefined);
      throw new DatabaseError(
        "saveClientAnalysisAsNote",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

