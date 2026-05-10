import type { AiSolverAnalysisResult } from "./types";

export type AiSolverAnalysisResultInput = Omit<
  AiSolverAnalysisResult,
  "sessionId" | "userId" | "createdAt" | "updatedAt"
>;

export function createEmptyAnalysisResultInput(): AiSolverAnalysisResultInput {
  return {
    sections: {
      step_by_step_derivation: "",
      physical_reasoning_reconstruction: "",
      related_models_similar_problems: {
        model_explanation: "",
        similar_problems: [],
      },
      related_articles: {
        summary: "",
        articles: [],
      },
      key_handling: "",
      write_article: {
        suggested_outline: "",
        insertable_blocks: [],
      },
      add_to_personal_library: {
        suggested_tags: [],
        suggested_note: "",
      },
    },
    retrieval_status: {
      similar_problems: "not_connected",
      related_articles: "not_connected",
    },
    warnings: [],
  };
}
