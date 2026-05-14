import "server-only";

import { AI_SOLVER_PROVIDER_LIMITS } from "./config";
import { parseProviderJson } from "./analysis-schema";
import { buildAiSolverUserContent, type OpenAiCompatibleMessage } from "./multimodal-messages";
import { AiSolverProviderError, OpenRouterChatCompletionClient } from "./openrouter-client";
import type {
  AiSolverAnalysisInput,
  AiSolverAnalysisResult,
  AiSolverAnalysisSectionKey,
  AiSolverMessage,
  AiSolverMessageContext,
} from "./types";

type RunFollowUpInput = {
  analysisInput: AiSolverAnalysisInput;
  analysisResult: AiSolverAnalysisResult;
  context: AiSolverMessageContext;
  prompt: string;
  messageHistory: AiSolverMessage[];
};

type FollowUpResult = {
  answer: string;
  provider: {
    ran: boolean;
    model: string;
    offlineFallback: boolean;
  };
};

export async function runAiSolverFollowUp(input: RunFollowUpInput): Promise<FollowUpResult> {
  if (!input.analysisInput.standardAnswer.trim()) {
    throw new Error("No standard answer, no AI solution. Confirm a non-empty standard answer before follow-up Q&A.");
  }

  const client = new OpenRouterChatCompletionClient();

  if (!client.configured) {
    return {
      answer:
        "Offline fallback: provider was not called because server-side AI configuration is incomplete. The follow-up question was saved in the AI Solver thread, but a generated answer requires provider configuration.",
      provider: {
        ran: false,
        model: client.modelId,
        offlineFallback: true,
      },
    };
  }

  try {
    const raw = await client.complete({
      messages: [
        followUpSystemMessage(),
        {
          role: "user",
          content: [
            ...buildAiSolverUserContent(input.analysisInput),
            {
              type: "text",
              text: `${buildFollowUpPrompt(input)}\n\nReturn exactly one JSON object with an answer string. Do not use Markdown fences or any preamble.`,
            },
          ],
        },
      ],
      maxTokens: Math.min(1400, AI_SOLVER_PROVIDER_LIMITS.maxFollowUpTokens),
      responseFormat: { type: "json_object" },
      plugins: [
        {
          id: "file-parser",
          pdf: {
            engine: "native",
          },
        },
        {
          id: "response-healing",
        },
      ],
    });
    const parsed = parseProviderJson(raw);
    const answer = getAnswer(parsed);

    if (!answer) {
      throw new AiSolverProviderError("AI provider returned an empty follow-up answer.", {
        code: "provider_empty_response",
      });
    }

    return {
      answer,
      provider: {
        ran: true,
        model: client.modelId,
        offlineFallback: false,
      },
    };
  } catch (error) {
    if (error instanceof AiSolverProviderError) {
      throw error;
    }

    if (error instanceof Error && error.message === "AI provider returned non-JSON content.") {
      throw new AiSolverProviderError("AI provider returned an invalid structured response.", {
        code: "provider_invalid_json",
      });
    }

    throw new AiSolverProviderError("AI Solver follow-up failed before a safe answer could be produced.", {
      code: "follow_up_failed",
    });
  }
}

function followUpSystemMessage(): OpenAiCompatibleMessage {
  return {
    role: "system",
    content: [
      "You answer threaded follow-up questions for a physics olympiad AI Solver.",
      "Use the confirmed problem text, diagram notes, standard answer, current structured analysis, and thread context.",
      "Do not overwrite or regenerate the original seven-section analysis.",
      "Never fabricate similar problem records or related article records.",
      "Return JSON only with this shape: {\"answer\":\"...\"}.",
      "Do not mention provider names, API keys, environment variables, or internal payloads.",
    ].join("\n"),
  };
}

function buildFollowUpPrompt(input: RunFollowUpInput) {
  return [
    "Current structured analysis JSON:",
    JSON.stringify(input.analysisResult),
    "",
    "Follow-up focus:",
    describeContext(input.context, input.analysisResult),
    "",
    "Prior thread messages in parent chain:",
    JSON.stringify(
      input.messageHistory.map((message) => ({
        id: message.id,
        parentMessageId: message.parentMessageId,
        kind: message.kind,
        content: message.content,
        context: message.context,
        createdAt: message.createdAt,
      })),
    ),
    "",
    "User follow-up question:",
    input.prompt.trim(),
    "",
    "Answer the follow-up directly. Keep retrieval-backed record arrays unchanged and empty unless the server supplied records.",
  ].join("\n");
}

function describeContext(context: AiSolverMessageContext, result: AiSolverAnalysisResult) {
  if (context.type === "whole_analysis") {
    return "Whole analysis.";
  }

  if (context.type === "section") {
    return `Section ${context.sectionKey}: ${JSON.stringify(getSection(result, context.sectionKey))}`;
  }

  if (context.type === "selected_text") {
    return [
      `Selected text${context.selection.sectionKey ? ` from ${context.selection.sectionKey}` : ""}:`,
      context.selection.text,
      `Offsets: ${context.selection.startOffset}-${context.selection.endOffset}`,
    ].join("\n");
  }

  return `Reply to prior message ${context.parentMessageId}.`;
}

function getSection(result: AiSolverAnalysisResult, key: AiSolverAnalysisSectionKey) {
  return result.sections[key];
}

function getAnswer(input: unknown) {
  if (typeof input === "string") {
    return input.trim();
  }

  if (isRecord(input) && typeof input.answer === "string") {
    return input.answer.trim();
  }

  if (isRecord(input) && typeof input.content === "string") {
    return input.content.trim();
  }

  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
