/**
 * AI Provider Interface (Strategy Pattern).
 *
 * Defines the contract for any LLM provider implementation.
 * New providers (OpenAI, Anthropic, Ollama, etc.) can be added by
 * implementing this interface without modifying existing code.
 */

import type { AiCompletionOptions, AiCompletionResult } from "./types";

export interface AiProvider {
  /** Unique name identifying this provider (e.g., "groq", "openai"). */
  readonly name: string;

  /** Default model to use when none is specified. */
  readonly defaultModel: string;

  /**
   * Sends a chat completion request to the provider.
   * @returns The completion result with content and token usage.
   */
  complete(options: AiCompletionOptions): Promise<AiCompletionResult>;

  /**
   * Checks if the provider is properly configured and reachable.
   */
  healthCheck(): Promise<boolean>;
}

