import "server-only";

import { AI_SOLVER_PROVIDER_LIMITS, DEFAULT_OPENROUTER_BASE_URL, DEFAULT_OPENROUTER_MODEL } from "./config";
import type { OpenAiCompatibleMessage } from "./multimodal-messages";

export class AiSolverProviderError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, options: { code: string; status?: number }) {
    super(message);
    this.name = "AiSolverProviderError";
    this.code = options.code;
    this.status = options.status;
  }
}

export type OpenRouterChatCompletionOptions = {
  messages: OpenAiCompatibleMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: Record<string, unknown>;
  plugins?: Array<Record<string, unknown>>;
  reasoning?: {
    effort: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
    exclude?: boolean;
  };
  signal?: AbortSignal;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export function getOpenRouterServerConfig() {
  return {
    baseUrl: process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL,
    model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
    apiKey: process.env.OPENROUTER_API_KEY || "",
  };
}

export class OpenRouterChatCompletionClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey: string;

  constructor(config = getOpenRouterServerConfig()) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.model = config.model;
    this.apiKey = config.apiKey;
  }

  get configured() {
    return this.apiKey.length > 0;
  }

  get modelId() {
    return this.model;
  }

  async complete(options: OpenRouterChatCompletionOptions) {
    if (!this.apiKey) {
      throw new AiSolverProviderError("AI provider is not configured.", { code: "provider_not_configured" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_SOLVER_PROVIDER_LIMITS.requestTimeoutMs);
    const signal = options.signal ?? controller.signal;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 1800,
          response_format: options.responseFormat ?? { type: "json_object" },
          reasoning: options.reasoning ?? { effort: "minimal", exclude: true },
          ...(options.plugins ? { plugins: options.plugins } : {}),
        }),
        signal,
      });

      if (!response.ok) {
        throw new AiSolverProviderError("AI provider request failed.", {
          code: "provider_request_failed",
          status: response.status,
        });
      }

      const payload = (await response.json()) as OpenRouterResponse;
      const content = payload.choices?.[0]?.message?.content;

      if (!content) {
        throw new AiSolverProviderError("AI provider returned an empty response.", {
          code: "provider_empty_response",
        });
      }

      return content;
    } catch (error) {
      if (error instanceof AiSolverProviderError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new AiSolverProviderError("AI provider request timed out.", {
          code: "provider_timeout",
        });
      }

      throw new AiSolverProviderError("AI provider request could not be completed.", {
        code: "provider_unavailable",
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
