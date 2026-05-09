import type {
  AiSolverAnalysisResult,
  AiSolverAnalysisSections,
  AiSolverRetrievalContext,
  RetrievalConnectionStatus,
} from "./types";

export const AI_SOLVER_SECTION_KEYS = [
  "step_by_step_derivation",
  "physical_reasoning_reconstruction",
  "related_models_similar_problems",
  "related_articles",
  "key_handling",
  "write_article",
  "add_to_personal_library",
] as const;

type JsonRecord = Record<string, unknown>;

export function createEmptyAnalysisSections(): AiSolverAnalysisSections {
  return {
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
  };
}

export function normalizeAnalysisResult(input: unknown, options: {
  model: string;
  providerRan: boolean;
  offlineFallback: boolean;
  retrieval?: AiSolverRetrievalContext;
  warnings?: string[];
}): AiSolverAnalysisResult {
  const root = isRecord(input) ? input : {};
  const rawSections = isRecord(root.sections) ? root.sections : root;
  const sections = createEmptyAnalysisSections();

  sections.step_by_step_derivation = asString(rawSections.step_by_step_derivation);
  sections.physical_reasoning_reconstruction = asString(rawSections.physical_reasoning_reconstruction);
  sections.key_handling = asString(rawSections.key_handling);

  const rawSimilar = isRecord(rawSections.related_models_similar_problems)
    ? rawSections.related_models_similar_problems
    : {};
  sections.related_models_similar_problems = {
    model_explanation: asString(rawSimilar.model_explanation),
    similar_problems: options.retrieval?.similarProblems ?? [],
  };

  const rawArticles = isRecord(rawSections.related_articles) ? rawSections.related_articles : {};
  sections.related_articles = {
    summary: asString(rawArticles.summary),
    articles: options.retrieval?.relatedArticles ?? [],
  };

  const rawWriteArticle = isRecord(rawSections.write_article) ? rawSections.write_article : {};
  sections.write_article = {
    suggested_outline: asString(rawWriteArticle.suggested_outline),
    insertable_blocks: asStringArray(rawWriteArticle.insertable_blocks),
  };

  const rawLibrary = isRecord(rawSections.add_to_personal_library)
    ? rawSections.add_to_personal_library
    : {};
  sections.add_to_personal_library = {
    suggested_tags: asStringArray(rawLibrary.suggested_tags),
    suggested_note: asString(rawLibrary.suggested_note),
  };

  const retrievalStatus = {
    similar_problems: getRetrievalStatus(options.retrieval?.similarProblems),
    related_articles: getRetrievalStatus(options.retrieval?.relatedArticles),
  };

  const warnings = [
    ...(options.warnings ?? []),
    ...getMissingSectionWarnings(sections),
    ...getRetrievalWarnings(retrievalStatus),
  ];

  return {
    sections,
    retrieval_status: retrievalStatus,
    warnings: dedupeWarnings(warnings),
    provider: {
      ran: options.providerRan,
      model: options.model,
      offlineFallback: options.offlineFallback,
    },
  };
}

export function parseProviderJson(content: string): unknown {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }

    throw new Error("AI provider returned non-JSON content.");
  }
}

function getRetrievalStatus<T>(records: T[] | undefined): RetrievalConnectionStatus {
  return records ? "connected" : "not_connected";
}

function getRetrievalWarnings(status: AiSolverAnalysisResult["retrieval_status"]) {
  const warnings: string[] = [];

  if (status.similar_problems === "not_connected") {
    warnings.push("Similar problem retrieval is not connected; similar_problems is empty by design.");
  }

  if (status.related_articles === "not_connected") {
    warnings.push("Related article retrieval is not connected; articles is empty by design.");
  }

  return warnings;
}

function getMissingSectionWarnings(sections: AiSolverAnalysisSections) {
  const warnings: string[] = [];

  if (!sections.step_by_step_derivation) warnings.push("AI output omitted step_by_step_derivation.");
  if (!sections.physical_reasoning_reconstruction) {
    warnings.push("AI output omitted physical_reasoning_reconstruction.");
  }
  if (!sections.key_handling) warnings.push("AI output omitted key_handling.");
  if (!sections.write_article.suggested_outline) warnings.push("AI output omitted write_article.suggested_outline.");
  if (!sections.add_to_personal_library.suggested_note) {
    warnings.push("AI output omitted add_to_personal_library.suggested_note.");
  }

  return warnings;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function dedupeWarnings(warnings: string[]) {
  return Array.from(new Set(warnings.filter(Boolean)));
}
