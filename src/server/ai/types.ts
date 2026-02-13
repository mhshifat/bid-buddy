/**
 * AI subsystem types.
 * All properties use camelCase per project conventions.
 */

// ---------------------------------------------------------------------------
// Chat / Completion
// ---------------------------------------------------------------------------

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  model: string;
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** If true, parse the response as JSON. */
  jsonMode?: boolean;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  finishReason: string;
}

// ---------------------------------------------------------------------------
// Job Analysis
// ---------------------------------------------------------------------------

export interface JobAnalysisInput {
  jobId: string;
  title: string;
  description: string;
  jobType: string;
  experienceLevel: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  clientCountry: string | null;
  clientRating: number | null;
  clientTotalSpent: number | null;
  clientTotalHires: number | null;
  clientTotalPosted: number | null;
  clientHireRate: number | null;
  clientPaymentVerified: boolean;
  proposalsCount: number | null;
  connectsRequired: number | null;
  skillsRequired: string[];
  category: string | null;
  postedAt: Date | null;
}

export interface FreelancerContext {
  skills: string[];
  primarySkills: string[];
  yearsExperience: Record<string, number>;
}

export interface JobFitAnalysisResult {
  fitScore: number;
  winProbability: number;
  fakeProbability: number;
  recommendation: "BID" | "SKIP" | "CAUTIOUS";
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  suggestedRate: number | null;
  suggestedDuration: string | null;
  keyPoints: string[];
  redFlags: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

// ---------------------------------------------------------------------------
// Proposal Generation
// ---------------------------------------------------------------------------

export interface ProposalGenerationInput {
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  skillsRequired: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  /** Latest AI analysis for context, if available. */
  analysisContext: {
    fitScore: number | null;
    strengths: string[];
    matchedSkills: string[];
    suggestedRate: number | null;
  } | null;
}

export interface ProposalGenerationResult {
  coverLetter: string;
  proposedRate: number | null;
  proposedDuration: string | null;
  keySellingPoints: string[];
  questionsForClient: string[];
}

// ---------------------------------------------------------------------------
// Client Analysis
// ---------------------------------------------------------------------------

export interface ClientAnalysisInput {
  clientCountry: string | null;
  clientRating: number | null;
  clientTotalSpent: number | null;
  clientTotalHires: number | null;
  clientTotalPosted: number | null;
  clientHireRate: number | null;
  clientPaymentVerified: boolean;
  clientMemberSince: Date | null;
}

export interface ClientAnalysisResult {
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  insights: string[];
  redFlags: string[];
  recommendation: string;
}

