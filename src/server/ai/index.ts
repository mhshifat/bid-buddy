/**
 * AI module barrel export.
 */

export type { AiProvider } from "./ai-provider";
export { GroqProvider, getGroqProvider } from "./groq-provider";
export { AiService, getAiService } from "./ai-service";
export { AiRepository } from "./ai-repository";
export type {
  AiChatMessage,
  AiCompletionOptions,
  AiCompletionResult,
  JobAnalysisInput,
  FreelancerContext,
  JobFitAnalysisResult,
  ProposalGenerationInput,
  ProposalGenerationResult,
  ClientAnalysisInput,
  ClientAnalysisResult,
} from "./types";

