import { AI_SOLVER_LIMITS, AI_SOLVER_UPLOAD_BUCKET, getOpenRouterConfig } from "./config";
import type {
  AiSolverAnalysisResult,
  AiSolverConfirmationInput,
  AiSolverCreateMessageInput,
  AiSolverImageContextMetadata,
  AiSolverMaterialContextMetadata,
  AiSolverMessage,
  AiSolverProviderImageContext,
  AiSolverProviderMaterialContext,
  AiSolverSession,
  ExtractedMaterial,
  MaterialRole,
  UploadedMaterial,
  UploadedMaterialKind,
} from "./types";

type Store = {
  sessions: Map<string, AiSolverSession>;
  uploads: Map<string, UploadedMaterial>;
  extractions: Map<string, ExtractedMaterial>;
  imageContents: Map<string, string>;
  materialContents: Map<string, string>;
  analysisResults: Map<string, AiSolverAnalysisResult>;
  messages: Map<string, AiSolverMessage>;
};

const globalStore = globalThis as typeof globalThis & {
  __cphoAiSolverStore?: Store;
};

export const store =
  globalStore.__cphoAiSolverStore ??
  (globalStore.__cphoAiSolverStore = {
    sessions: new Map<string, AiSolverSession>(),
    uploads: new Map<string, UploadedMaterial>(),
    extractions: new Map<string, ExtractedMaterial>(),
    imageContents: new Map<string, string>(),
    materialContents: new Map<string, string>(),
    analysisResults: new Map<string, AiSolverAnalysisResult>(),
    messages: new Map<string, AiSolverMessage>(),
  });

store.imageContents ??= new Map<string, string>();
store.materialContents ??= new Map<string, string>();
store.analysisResults ??= new Map<string, AiSolverAnalysisResult>();
store.messages ??= new Map<string, AiSolverMessage>();

export function createSession(userId: string, title = "Untitled AI Solver session") {
  const now = new Date().toISOString();
  const session: AiSolverSession = {
    id: crypto.randomUUID(),
    userId,
    title,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  store.sessions.set(session.id, session);
  return session;
}

export function requireOwnedSession(sessionId: string, userId: string) {
  const session = store.sessions.get(sessionId);

  if (!session || session.userId !== userId) {
    throw new Error("AI Solver session was not found for the current user.");
  }

  return session;
}

export function addUploadedMaterial(input: {
  sessionId: string;
  userId: string;
  role: MaterialRole;
  kind: UploadedMaterialKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  providerDataUrl?: string;
}) {
  requireOwnedSession(input.sessionId, input.userId);
  validateProviderContentInput(input);

  const now = new Date().toISOString();
  const uploadId = crypto.randomUUID();
  const storagePath = `${input.userId}/${input.sessionId}/${crypto.randomUUID()}-${sanitizePathPart(input.fileName)}`;
  const upload: UploadedMaterial = {
    id: uploadId,
    sessionId: input.sessionId,
    userId: input.userId,
    role: input.role,
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    storagePath,
    createdAt: now,
  };

  if (input.kind === "image") {
    upload.imageContext = toImageContextMetadata(upload, now);
  }

  if (input.providerDataUrl) {
    upload.providerContext = toMaterialContextMetadata(upload, now);
    store.materialContents.set(upload.id, input.providerDataUrl);
    if (input.kind === "image") {
      store.imageContents.set(upload.id, input.providerDataUrl);
    }
  }

  store.uploads.set(upload.id, upload);
  upsertExtractionPlaceholder(input.sessionId, input.userId);

  const session = requireOwnedSession(input.sessionId, input.userId);
  store.sessions.set(session.id, {
    ...session,
    status: "extraction_placeholder",
    updatedAt: now,
  });

  return upload;
}

export function requireOwnedUpload(uploadId: string, userId: string) {
  const upload = store.uploads.get(uploadId);

  if (!upload || upload.userId !== userId) {
    throw new Error("AI Solver upload was not found for the current user.");
  }

  requireOwnedSession(upload.sessionId, userId);
  return upload;
}

export function getOwnedUploads(sessionId: string, userId: string) {
  requireOwnedSession(sessionId, userId);

  return Array.from(store.uploads.values()).filter(
    (upload) => upload.sessionId === sessionId && upload.userId === userId,
  );
}

export function getOwnedExtraction(sessionId: string, userId: string) {
  requireOwnedSession(sessionId, userId);
  const extraction = store.extractions.get(sessionId);

  if (!extraction || extraction.userId !== userId) {
    throw new Error("AI Solver extraction was not found for the current user.");
  }

  return extraction;
}

export function collectProviderSafeImageContexts(sessionId: string, userId: string): AiSolverProviderImageContext[] {
  const uploads = getOwnedUploads(sessionId, userId);

  return uploads.flatMap((upload) => {
    if (upload.kind !== "image") {
      return [];
    }

    const dataUrl = store.imageContents.get(upload.id);
    if (!upload.imageContext || !dataUrl) {
      return [];
    }

    return [{ ...upload.imageContext, dataUrl }];
  });
}

export function collectProviderSafeMaterialContexts(
  sessionId: string,
  userId: string,
): AiSolverProviderMaterialContext[] {
  const uploads = getOwnedUploads(sessionId, userId);

  return uploads.flatMap((upload) => {
    const dataUrl = store.materialContents.get(upload.id);
    if (!upload.providerContext || !dataUrl) {
      return [];
    }

    return [{ ...upload.providerContext, dataUrl, kind: upload.kind }];
  });
}

export function confirmExtraction(input: AiSolverConfirmationInput, userId: string) {
  const session = requireOwnedSession(input.sessionId, userId);
  const now = new Date().toISOString();
  const standardAnswer = input.standardAnswer.trim();

  const extraction: ExtractedMaterial = {
    id: store.extractions.get(input.sessionId)?.id ?? crypto.randomUUID(),
    sessionId: input.sessionId,
    userId,
    problemText: input.problemText.trim(),
    diagramNotes: input.diagramNotes.trim(),
    standardAnswer,
    extractionStatus: "not_connected",
    isStandardAnswerConfirmed: input.confirmStandardAnswer && standardAnswer.length > 0,
    createdAt: store.extractions.get(input.sessionId)?.createdAt ?? now,
    updatedAt: now,
  };

  store.extractions.set(input.sessionId, extraction);
  store.sessions.set(session.id, {
    ...session,
    status: extraction.isStandardAnswerConfirmed ? "confirmed" : "extraction_placeholder",
    updatedAt: now,
  });

  return extraction;
}

export function assertAnalysisGate(sessionId: string, userId: string) {
  requireOwnedSession(sessionId, userId);
  const uploads = getOwnedUploads(sessionId, userId);
  const hasCombinedMaterial = uploads.some((upload) => upload.role === "combined");
  const hasProblemMaterial = hasCombinedMaterial || uploads.some((upload) => upload.role === "problem");
  const hasAnswerMaterial = hasCombinedMaterial || uploads.some((upload) => upload.role === "answer");

  if (!hasProblemMaterial) {
    throw new Error("Upload problem material before AI analysis.");
  }

  if (!hasAnswerMaterial) {
    throw new Error("No standard answer, no AI solution. Upload standard-answer material before analysis.");
  }

  return {
    allowed: true,
    providerReady: getOpenRouterConfig().hasApiKey,
    retrievalStatus: {
      similarProblems: "not_connected",
      relatedArticles: "not_connected",
    },
  };
}

export function persistAnalysisResult(
  sessionId: string,
  userId: string,
  result: Omit<AiSolverAnalysisResult, "sessionId" | "userId" | "createdAt" | "updatedAt">,
) {
  requireOwnedSession(sessionId, userId);
  const now = new Date().toISOString();
  const existing = store.analysisResults.get(sessionId);
  const analysisResult: AiSolverAnalysisResult = {
    ...result,
    sessionId,
    userId,
    retrieval_status: {
      similar_problems: result.retrieval_status.similar_problems ?? "not_connected",
      related_articles: result.retrieval_status.related_articles ?? "not_connected",
    },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  store.analysisResults.set(sessionId, analysisResult);
  return analysisResult;
}

export function getOwnedAnalysisResult(sessionId: string, userId: string) {
  requireOwnedSession(sessionId, userId);
  const result = store.analysisResults.get(sessionId);

  if (!result || result.userId !== userId) {
    return null;
  }

  return result;
}

export function createAiSolverMessage(input: AiSolverCreateMessageInput, userId: string) {
  requireOwnedSession(input.sessionId, userId);
  validateMessageParent(input, userId);
  validateMessageContext(input, userId);

  const message: AiSolverMessage = {
    id: crypto.randomUUID(),
    sessionId: input.sessionId,
    userId,
    parentMessageId: input.parentMessageId ?? null,
    kind: input.kind,
    content: input.content.trim(),
    context: input.context,
    createdAt: new Date().toISOString(),
  };

  if (!message.content) {
    throw new Error("AI Solver follow-up message content is required.");
  }

  store.messages.set(message.id, message);
  return message;
}

export function createFollowUpUserMessage(
  input: Omit<AiSolverCreateMessageInput, "kind">,
  userId: string,
) {
  return createAiSolverMessage({ ...input, kind: "user" }, userId);
}

export function createFollowUpAssistantMessage(
  input: Omit<AiSolverCreateMessageInput, "kind">,
  userId: string,
) {
  return createAiSolverMessage({ ...input, kind: "assistant" }, userId);
}

export function getOwnedMessages(sessionId: string, userId: string) {
  requireOwnedSession(sessionId, userId);

  return Array.from(store.messages.values())
    .filter((message) => message.sessionId === sessionId && message.userId === userId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function getStorageBucket() {
  return AI_SOLVER_UPLOAD_BUCKET;
}

function upsertExtractionPlaceholder(sessionId: string, userId: string) {
  if (store.extractions.has(sessionId)) {
    return;
  }

  const now = new Date().toISOString();
  store.extractions.set(sessionId, {
    id: crypto.randomUUID(),
    sessionId,
    userId,
    problemText: "Problem content is provided by uploaded multimodal materials.",
    diagramNotes: "Diagram context is provided by uploaded multimodal materials when present.",
    standardAnswer: "Standard answer is provided by uploaded answer materials.",
    extractionStatus: "not_connected",
    isStandardAnswerConfirmed: true,
    createdAt: now,
    updatedAt: now,
  });
}

function sanitizePathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toImageContextMetadata(upload: UploadedMaterial, createdAt: string): AiSolverImageContextMetadata {
  return {
    uploadId: upload.id,
    sessionId: upload.sessionId,
    userId: upload.userId,
    role: upload.role,
    mimeType: upload.mimeType,
    fileName: upload.fileName,
    sizeBytes: upload.sizeBytes,
    storagePath: upload.storagePath,
    createdAt,
  };
}

function toMaterialContextMetadata(upload: UploadedMaterial, createdAt: string): AiSolverMaterialContextMetadata {
  return {
    uploadId: upload.id,
    sessionId: upload.sessionId,
    userId: upload.userId,
    role: upload.role,
    mimeType: upload.mimeType,
    fileName: upload.fileName,
    sizeBytes: upload.sizeBytes,
    storagePath: upload.storagePath,
    createdAt,
  };
}

function validateProviderContentInput(input: {
  kind: UploadedMaterialKind;
  mimeType: string;
  sizeBytes: number;
  providerDataUrl?: string;
}) {
  if (input.kind === "docx") {
    if (input.providerDataUrl) {
      throw new Error("DOCX uploads do not include provider-bound multimodal context.");
    }
    return;
  }

  if (input.kind === "image" && input.sizeBytes > AI_SOLVER_LIMITS.maxImageSizeBytes) {
    throw new Error("Each image must be 10 MB or smaller.");
  }

  if (input.providerDataUrl && !input.providerDataUrl.startsWith(`data:${input.mimeType};base64,`)) {
    throw new Error("Provider material context must match the uploaded MIME type.");
  }
}

function validateMessageParent(input: AiSolverCreateMessageInput, userId: string) {
  if (!input.parentMessageId) {
    return;
  }

  const parent = store.messages.get(input.parentMessageId);
  if (!parent || parent.userId !== userId || parent.sessionId !== input.sessionId) {
    throw new Error("AI Solver follow-up parent was not found for the current user and session.");
  }
}

function validateMessageContext(input: AiSolverCreateMessageInput, userId: string) {
  if (input.context.type === "follow_up") {
    const contextParent = store.messages.get(input.context.parentMessageId);
    if (!contextParent || contextParent.userId !== userId || contextParent.sessionId !== input.sessionId) {
      throw new Error("AI Solver follow-up context was not found for the current user and session.");
    }
  }

  if (input.context.type === "selected_text") {
    const { startOffset, endOffset, text } = input.context.selection;
    if (startOffset < 0 || endOffset < startOffset || text.trim().length === 0) {
      throw new Error("Selected text context must include a valid non-empty span.");
    }
  }
}
