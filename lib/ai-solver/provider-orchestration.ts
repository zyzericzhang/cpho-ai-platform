import "server-only";

import { AI_SOLVER_PROVIDER_LIMITS } from "./config";
import { AI_SOLVER_SECTION_KEYS, normalizeAnalysisResult, parseProviderJson } from "./analysis-schema";
import { buildAiSolverUserContent, getDroppedImageWarnings, type OpenAiCompatibleMessage } from "./multimodal-messages";
import { AiSolverProviderError, OpenRouterChatCompletionClient } from "./openrouter-client";
import type { AiSolverAnalysisInput, AiSolverAnalysisResult, AiSolverSectionKey } from "./types";

type AiSolverPlan = {
  subtasks: Array<{
    id: string;
    title: string;
    sections: AiSolverSectionKey[];
    prompt: string;
  }>;
};

export async function runAiSolverAnalysis(input: AiSolverAnalysisInput): Promise<AiSolverAnalysisResult> {
  assertConfirmedAnalysisInput(input);

  const client = new OpenRouterChatCompletionClient();
  const warnings = getDroppedImageWarnings(input.images);

  if (!client.configured) {
    return buildOfflineFallback(input, client.modelId, warnings);
  }

  try {
    const plan = await createAnalysisPlan(client, input);
    const subtaskOutputs = [];

    for (const subtask of plan.subtasks.slice(0, AI_SOLVER_PROVIDER_LIMITS.maxAnalysisSubtasks)) {
      const output = await runAnalysisSubtask(client, input, subtask);
      subtaskOutputs.push({
        id: subtask.id,
        title: subtask.title,
        sections: subtask.sections,
        output,
      });
    }

    const finalJson = await assembleFinalResult(client, input, subtaskOutputs);

    return normalizeAnalysisResult(parseProviderJson(finalJson), {
      model: client.modelId,
      providerRan: true,
      offlineFallback: false,
      retrieval: input.retrieval,
      warnings,
    });
  } catch (error) {
    throw normalizeProviderError(error);
  }
}

function assertConfirmedAnalysisInput(input: AiSolverAnalysisInput) {
  if (!input.standardAnswer.trim()) {
    throw new Error("No standard answer, no AI solution. Confirm a non-empty standard answer before analysis.");
  }
}

async function createAnalysisPlan(client: OpenRouterChatCompletionClient, input: AiSolverAnalysisInput): Promise<AiSolverPlan> {
  const content = await client.complete({
    messages: [
      systemMessage(),
      {
        role: "user",
        content: [
          ...buildAiSolverUserContent(input),
          {
            type: "text",
            text: [
              "Return a JSON plan for solving this task.",
              `Use at most ${AI_SOLVER_PROVIDER_LIMITS.maxAnalysisSubtasks} subtasks.`,
              "Each subtask must include id, title, sections, and prompt.",
              `Allowed section keys: ${AI_SOLVER_SECTION_KEYS.join(", ")}.`,
              "Do not create similar problem or article records. Retrieval records are supplied separately only.",
            ].join("\n"),
          },
        ],
      },
    ],
    maxTokens: 900,
  });

  return normalizePlan(parseProviderJson(content));
}

async function runAnalysisSubtask(
  client: OpenRouterChatCompletionClient,
  input: AiSolverAnalysisInput,
  subtask: AiSolverPlan["subtasks"][number],
) {
  return client.complete({
    messages: [
      systemMessage(),
      {
        role: "user",
        content: [
          ...buildAiSolverUserContent(input),
          {
            type: "text",
            text: [
              `Subtask: ${subtask.title}`,
              `Target sections: ${subtask.sections.join(", ")}`,
              subtask.prompt,
              "Return JSON only. Do not invent related problem or article records.",
            ].join("\n"),
          },
        ],
      },
    ],
    maxTokens: 1800,
  });
}

async function assembleFinalResult(
  client: OpenRouterChatCompletionClient,
  input: AiSolverAnalysisInput,
  subtaskOutputs: Array<{
    id: string;
    title: string;
    sections: AiSolverSectionKey[];
    output: string;
  }>,
) {
  return client.complete({
    messages: [
      systemMessage(),
      {
        role: "user",
        content: [
          ...buildAiSolverUserContent(input),
          {
            type: "text",
            text: [
              "Assemble the final AI Solver JSON result from these subtask outputs.",
              "The final object must contain sections with exactly these keys:",
              AI_SOLVER_SECTION_KEYS.join(", "),
              "For related_models_similar_problems.similar_problems and related_articles.articles, return empty arrays unless explicit retrieval records were provided by the server.",
              "Use these server retrieval counts only:",
              `similarProblems=${input.retrieval?.similarProblems?.length ?? 0}`,
              `relatedArticles=${input.retrieval?.relatedArticles?.length ?? 0}`,
              "Subtask outputs:",
              JSON.stringify(subtaskOutputs),
            ].join("\n"),
          },
        ],
      },
    ],
    maxTokens: 2600,
  });
}

function systemMessage(): OpenAiCompatibleMessage {
  return {
    role: "system",
    content: [
      "You are the AI Solver analysis engine for a physics olympiad training platform.",
      "Use the confirmed standard answer as the source of truth.",
      "Return JSON only.",
      "Never fabricate similar problem records or related article records.",
      "Actual retrieval records are provided only by the server, not by the model.",
      "Do not mention provider names or environment variables.",
    ].join("\n"),
  };
}

function normalizePlan(input: unknown): AiSolverPlan {
  const rawSubtasks = getRawSubtasks(input);
  const subtasks = rawSubtasks
    .map((item, index) => normalizeSubtask(item, index))
    .filter((item): item is AiSolverPlan["subtasks"][number] => Boolean(item))
    .slice(0, AI_SOLVER_PROVIDER_LIMITS.maxAnalysisSubtasks);

  if (subtasks.length > 0) {
    return { subtasks };
  }

  return {
    subtasks: [
      {
        id: "core-analysis",
        title: "Core structured analysis",
        sections: [...AI_SOLVER_SECTION_KEYS],
        prompt: "Produce all fixed AI Solver sections using the confirmed standard answer.",
      },
    ],
  };
}

function getRawSubtasks(input: unknown) {
  if (isRecord(input) && Array.isArray(input.subtasks)) {
    return input.subtasks;
  }

  if (isRecord(input) && isRecord(input.plan) && Array.isArray(input.plan.subtasks)) {
    return input.plan.subtasks;
  }

  return [];
}

function normalizeSubtask(input: unknown, index: number) {
  if (!isRecord(input)) return null;

  const sections = Array.isArray(input.sections)
    ? input.sections.filter((section): section is AiSolverSectionKey => isSectionKey(section))
    : [];

  return {
    id: typeof input.id === "string" && input.id ? input.id : `subtask-${index + 1}`,
    title: typeof input.title === "string" && input.title ? input.title : `Subtask ${index + 1}`,
    sections: sections.length > 0 ? sections : [...AI_SOLVER_SECTION_KEYS],
    prompt: typeof input.prompt === "string" && input.prompt ? input.prompt : "Complete the assigned AI Solver sections.",
  };
}

function buildOfflineFallback(input: AiSolverAnalysisInput, model: string, warnings: string[]) {
  return normalizeAnalysisResult(
    {
      sections: {
        step_by_step_derivation:
          "Offline fallback: provider was not called because OPENROUTER_API_KEY is not configured.",
        physical_reasoning_reconstruction:
          "Offline fallback: configure the server-side provider key to generate physical reasoning reconstruction.",
        key_handling: "Offline fallback: configure the server-side provider key to generate key handling guidance.",
        write_article: {
          suggested_outline: "Offline fallback: provider did not run, so no article outline was generated.",
          insertable_blocks: [],
        },
        add_to_personal_library: {
          suggested_tags: [],
          suggested_note: "Offline fallback: provider did not run, so no library note was generated.",
        },
      },
    },
    {
      model,
      providerRan: false,
      offlineFallback: true,
      retrieval: input.retrieval,
      warnings: [
        ...warnings,
        "OPENROUTER_API_KEY is absent; returned explicit offline fallback and provider.ran=false.",
      ],
    },
  );
}

function normalizeProviderError(error: unknown) {
  if (error instanceof AiSolverProviderError) {
    return new AiSolverProviderError(error.message, {
      code: error.code,
      status: error.status,
    });
  }

  if (error instanceof Error && error.message === "AI provider returned non-JSON content.") {
    return new AiSolverProviderError("AI provider returned an invalid structured response.", {
      code: "provider_invalid_json",
    });
  }

  return new AiSolverProviderError("AI Solver analysis failed before a safe result could be produced.", {
    code: "analysis_failed",
  });
}

function isSectionKey(value: unknown): value is AiSolverSectionKey {
  return typeof value === "string" && AI_SOLVER_SECTION_KEYS.includes(value as AiSolverSectionKey);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toSafeProviderError(error: unknown) {
  const normalized = normalizeProviderError(error);
  return {
    error: normalized.message,
    code: normalized.code,
    status: normalized.status,
  };
}
