export type MaterialRole = "problem" | "answer" | "combined";

export type UploadedMaterialKind = "image" | "pdf" | "docx";

export type UploadedMaterial = {
  id: string;
  sessionId: string;
  userId: string;
  role: MaterialRole;
  kind: UploadedMaterialKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
};

export type AiSolverSession = {
  id: string;
  userId: string;
  title: string;
  status: "draft" | "extraction_placeholder" | "confirmed";
  createdAt: string;
  updatedAt: string;
};

export type ExtractedMaterial = {
  id: string;
  sessionId: string;
  userId: string;
  problemText: string;
  diagramNotes: string;
  standardAnswer: string;
  extractionStatus: "not_connected";
  isStandardAnswerConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AiSolverConfirmationInput = {
  sessionId: string;
  problemText: string;
  diagramNotes: string;
  standardAnswer: string;
  confirmStandardAnswer: boolean;
};
