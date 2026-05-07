import { AI_SOLVER_UPLOAD_BUCKET, getOpenRouterConfig } from "./config";
import type {
  AiSolverConfirmationInput,
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
  });

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
}) {
  requireOwnedSession(input.sessionId, input.userId);

  const now = new Date().toISOString();
  const upload: UploadedMaterial = {
    id: crypto.randomUUID(),
    sessionId: input.sessionId,
    userId: input.userId,
    role: input.role,
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    storagePath: `${input.userId}/${input.sessionId}/${crypto.randomUUID()}-${sanitizePathPart(input.fileName)}`,
    createdAt: now,
  };

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
  const extraction = store.extractions.get(sessionId);

  if (!extraction?.isStandardAnswerConfirmed || extraction.standardAnswer.trim().length === 0) {
    throw new Error("No standard answer, no AI solution. Confirm a non-empty standard answer before analysis.");
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
    problemText: "",
    diagramNotes: "Extraction is not connected yet. Confirm or edit diagram notes manually.",
    standardAnswer: "",
    extractionStatus: "not_connected",
    isStandardAnswerConfirmed: false,
    createdAt: now,
    updatedAt: now,
  });
}

function sanitizePathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}
