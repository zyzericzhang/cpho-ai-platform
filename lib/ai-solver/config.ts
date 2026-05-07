export const AI_SOLVER_UPLOAD_BUCKET = "ai-solver-uploads";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "google/gemini-3.1-pro-preview";

export function getOpenRouterConfig() {
  return {
    baseUrl: process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL,
    model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
    hasApiKey: Boolean(process.env.OPENROUTER_API_KEY),
  };
}

export const AI_SOLVER_LIMITS = {
  maxImageCount: 10,
  maxImageSizeBytes: 10 * 1024 * 1024,
  maxPdfSizeBytes: 25 * 1024 * 1024,
  maxDocxSizeBytes: 15 * 1024 * 1024,
};
