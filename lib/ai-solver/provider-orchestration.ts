import "server-only";

import { normalizeAnalysisResult, parseProviderJson } from "./analysis-schema";
import {
  buildAiSolverUserContent,
  getDroppedImageWarnings,
  getDroppedMaterialWarnings,
  type OpenAiCompatibleMessage,
} from "./multimodal-messages";
import { AiSolverProviderError, OpenRouterChatCompletionClient } from "./openrouter-client";
import type { AiSolverAnalysisInput, AiSolverAnalysisResult, AiSolverSectionKey } from "./types";

const AI_SOLVER_TASKS: AiSolverTaskTemplate[] = [
  {
    id: "derive_solution_steps",
    sectionKey: "step_by_step_derivation",
    objective: "按标准答案重建学生可跟随的逐步推导。",
    targetCharLimit: 5000,
  },
  {
    id: "reconstruct_physical_reasoning",
    sectionKey: "physical_reasoning_reconstruction",
    objective: "解释物理图景、关键假设、边界条件和方法选择。",
    targetCharLimit: 5000,
  },
  {
    id: "explain_related_models",
    sectionKey: "related_models_similar_problems",
    objective: "总结模型归类说明；相似题记录只能透传服务端 retrieval。",
    targetCharLimit: 5000,
  },
  {
    id: "summarize_related_articles",
    sectionKey: "related_articles",
    objective: "生成相关文章导读；文章记录只能透传服务端 retrieval。",
    targetCharLimit: 5000,
  },
  {
    id: "extract_key_handling",
    sectionKey: "key_handling",
    objective: "提炼关键处理、易错点和标准答案中的转折。",
    targetCharLimit: 5000,
  },
  {
    id: "draft_article_plan",
    sectionKey: "write_article",
    objective: "生成学习文章提纲和可插入模块，不直接扩写成全文。",
    targetCharLimit: 5000,
  },
  {
    id: "suggest_library_metadata",
    sectionKey: "add_to_personal_library",
    objective: "生成收藏标签与归档笔记建议，不直接执行保存。",
    targetCharLimit: 5000,
  },
];

type AiSolverTaskTemplate = {
  id: string;
  sectionKey: AiSolverSectionKey;
  objective: string;
  targetCharLimit: number;
};

type AiSolverTaskPlan = {
  planVersion: "v1";
  materialAssessment: string;
  warnings: string[];
  tasks: AiSolverTaskTemplate[];
};

type AiSolverTaskOutput = {
  section_key: AiSolverSectionKey;
  section_value: unknown;
  warnings?: string[];
};

export async function runAiSolverAnalysis(input: AiSolverAnalysisInput): Promise<AiSolverAnalysisResult> {
  assertConfirmedAnalysisInput(input);

  const client = new OpenRouterChatCompletionClient();
  const warnings = [...getDroppedImageWarnings(input.images), ...getDroppedMaterialWarnings(input.materials)];

  if (!client.configured) {
    return buildOfflineFallback(input, client.modelId, warnings);
  }

  try {
    const taskPlan = createTaskPlan(input);
    const taskOutputs: AiSolverTaskOutput[] = [];

    for (const task of taskPlan.tasks) {
      taskOutputs.push(await generateTaskOutput(client, input, task));
    }

    const finalPayload = assembleTaskOutputs(taskOutputs);

    return normalizeAnalysisResult(finalPayload, {
      model: client.modelId,
      providerRan: true,
      offlineFallback: false,
      retrieval: input.retrieval,
      warnings: [...warnings, ...taskPlan.warnings, ...collectTaskWarnings(taskOutputs)],
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

function createTaskPlan(input: AiSolverAnalysisInput): AiSolverTaskPlan {
  return {
    planVersion: "v1",
    materialAssessment: "题目材料与标准答案材料已通过服务端 gate，按固定七板块任务模板执行。",
    warnings: buildPlannerWarnings(input),
    tasks: AI_SOLVER_TASKS,
  };
}

async function generateTaskOutput(
  client: OpenRouterChatCompletionClient,
  input: AiSolverAnalysisInput,
  task: AiSolverTaskTemplate,
) {
  const taskPayload = await completeJsonWithRepair(client, {
    messages: [
      taskSystemMessage(),
      {
        role: "user",
        content: [
          ...buildAiSolverUserContent(input),
          {
            type: "text",
            text: [
              "Generate exactly one AI Solver task result.",
              `task_id=${task.id}`,
              `section_key=${task.sectionKey}`,
              `objective=${task.objective}`,
              `target_char_limit=${task.targetCharLimit}`,
              "Return strict JSON with keys: section_key, section_value, warnings.",
              getSectionValueShape(task.sectionKey),
              "Do not expand or mutate similar problem/article retrieval records.",
              "If retrieval is unavailable, preserve empty arrays for retrieval-backed sections.",
            ].join("\n"),
          },
        ],
      },
    ],
    maxTokens: 6000,
    responseFormat: { type: "json_object" },
    plugins: pdfPlugins(),
  }, `${task.id} task output`);

  return normalizeTaskOutput(task, taskPayload);
}

function taskSystemMessage(): OpenAiCompatibleMessage {
  return {
    role: "system",
    content: [
      "You are generating exactly one planned task for a physics olympiad AI Solver.",
      "Use the uploaded standard-answer material as the source of truth.",
      "Complete only the requested section and respect the declared character limit.",
      "Never fabricate similar problem records or related article records.",
      "Actual retrieval records are provided only by the server, not by the model.",
      "Do not mention provider names or environment variables.",
      "Return strict JSON only.",
    ].join("\n"),
  };
}

function buildOfflineFallback(input: AiSolverAnalysisInput, model: string, warnings: string[]) {
  return normalizeAnalysisResult(
    {
      sections: {
        step_by_step_derivation:
          "Offline fallback: provider was not called because server-side AI configuration is incomplete.",
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
        "Server-side AI configuration is incomplete; returned explicit offline fallback and provider.ran=false.",
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

export function toSafeProviderError(error: unknown) {
  const normalized = normalizeProviderError(error);
  return {
    error: normalized.message,
    code: normalized.code,
    status: normalized.status,
  };
}

function normalizeTaskOutput(task: AiSolverTaskTemplate, raw: unknown): AiSolverTaskOutput {
  const root = isRecord(raw) ? raw : {};
  const warnings = Array.isArray(root.warnings)
    ? root.warnings.filter((warning): warning is string => typeof warning === "string")
    : [];

  return {
    section_key: task.sectionKey,
    section_value: root.section_value ?? root.sectionValue ?? "",
    warnings,
  };
}

function collectTaskWarnings(outputs: AiSolverTaskOutput[]) {
  return outputs.flatMap((output) => output.warnings ?? []);
}

function getSectionValueShape(sectionKey: AiSolverSectionKey) {
  switch (sectionKey) {
    case "related_models_similar_problems":
      return "section_value must be { model_explanation: string, similar_problems: [] } unless server retrieval records are supplied.";
    case "related_articles":
      return "section_value must be { summary: string, articles: [] } unless server retrieval records are supplied.";
    case "write_article":
      return "section_value must be { suggested_outline: string, insertable_blocks: string[] }.";
    case "add_to_personal_library":
      return "section_value must be { suggested_tags: string[], suggested_note: string }.";
    default:
      return "section_value must be a string.";
  }
}

function pdfPlugins() {
  return [
    {
      id: "file-parser",
      pdf: {
        engine: "native",
      },
    },
    {
      id: "response-healing",
    },
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function completeJsonWithRepair(
  client: OpenRouterChatCompletionClient,
  options: Parameters<OpenRouterChatCompletionClient["complete"]>[0],
  label: string,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const firstPass = await client.complete(options);

      try {
        return parseProviderJson(firstPass);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "AI provider returned non-JSON content.") {
          throw error;
        }

        const repaired = await client.complete({
          messages: [
            {
              role: "system",
              content: [
                "You repair malformed AI JSON responses.",
                "Do not add facts, claims, recommendations, database records, or missing content.",
                "Only convert the supplied content into one valid JSON object that preserves the original meaning as closely as possible.",
                "Return JSON only.",
              ].join("\n"),
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: [
                    `Repair this malformed ${label} response into one valid JSON object.`,
                    "Do not invent or enrich anything.",
                    "",
                    "<malformed_json_like_response>",
                    firstPass,
                    "</malformed_json_like_response>",
                  ].join("\n"),
                },
              ],
            },
          ],
          maxTokens: options.maxTokens,
          responseFormat: { type: "json_object" },
        });

        return parseProviderJson(repaired);
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function assembleTaskOutputs(outputs: AiSolverTaskOutput[]) {
  const sections = Object.fromEntries(
    AI_SOLVER_TASKS.map((task) => {
      const output = outputs.find((item) => item.section_key === task.sectionKey);
      return [task.sectionKey, output?.section_value ?? ""];
    }),
  );

  return { sections };
}

function buildPlannerWarnings(input: AiSolverAnalysisInput) {
  const warnings: string[] = [];

  if (!input.materials?.some((material) => material.role === "problem" || material.role === "combined")) {
    warnings.push("Planning template did not receive provider-safe problem materials.");
  }

  if (!input.materials?.some((material) => material.role === "answer" || material.role === "combined")) {
    warnings.push("Planning template did not receive provider-safe standard-answer materials.");
  }

  return warnings;
}
