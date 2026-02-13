/**
 * Groq AI Provider Implementation.
 *
 * Implements the AiProvider strategy for Groq's ultra-fast inference API.
 * Uses the official groq-sdk package.
 *
 * Model: meta-llama/llama-4-scout-17b-16e-instruct
 */

import Groq from "groq-sdk";
import { ExternalServiceError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import type { AiProvider } from "./ai-provider";
import type { AiCompletionOptions, AiCompletionResult } from "./types";

const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export class GroqProvider implements AiProvider {
  readonly name = "groq";
  readonly defaultModel = DEFAULT_MODEL;

  private readonly client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const model = options.model || this.defaultModel;

    try {
      logger.debug(`Groq completion request – model: ${model}`, {
        messageCount: String(options.messages.length),
        temperature: String(options.temperature ?? 0.7),
        jsonMode: String(options.jsonMode ?? false),
      });

      const response = await this.client.chat.completions.create({
        model,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        ...(options.jsonMode
          ? { response_format: { type: "json_object" as const } }
          : {}),
      });

      const choice = response.choices[0];

      if (!choice?.message?.content) {
        throw new Error("Groq returned an empty response");
      }

      const result: AiCompletionResult = {
        content: choice.message.content,
        model: response.model,
        tokensUsed: response.usage?.total_tokens ?? 0,
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        finishReason: choice.finish_reason ?? "unknown",
      };

      logger.debug(
        `Groq completion done – tokens: ${result.tokensUsed} (${result.promptTokens}p / ${result.completionTokens}c)`
      );

      return result;
    } catch (error) {
      // Re-throw our own errors as-is
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      logger.error(
        "Groq completion failed",
        error instanceof Error ? error : undefined
      );

      throw new ExternalServiceError(
        "Groq AI",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      });
      return !!response.choices[0]?.message?.content;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Factory & Singleton
// ---------------------------------------------------------------------------

let groqProviderInstance: GroqProvider | null = null;

/**
 * Returns a singleton GroqProvider instance.
 * Throws if GROQ_API_KEY is not set.
 */
export function getGroqProvider(): GroqProvider {
  if (groqProviderInstance) {
    return groqProviderInstance;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing required environment variable: GROQ_API_KEY must be set."
    );
  }

  groqProviderInstance = new GroqProvider(apiKey);
  return groqProviderInstance;
}

