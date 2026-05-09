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
  imageContext?: AiSolverImageContextMetadata;
  createdAt: string;
};

export type AiSolverImageContextMetadata = {
  uploadId: string;
  sessionId: string;
  userId: string;
  role: MaterialRole;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
};

export type AiSolverProviderImageContext = AiSolverImageContextMetadata & {
  dataUrl: string;
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

export type AiSolverAnalysisSectionKey =
  | "step_by_step_derivation"
  | "physical_reasoning_reconstruction"
  | "related_models_similar_problems"
  | "related_articles"
  | "key_handling"
  | "write_article"
  | "add_to_personal_library";

export type AiSolverRetrievalStatus = "not_connected" | "connected" | "error";

export type AiSolverAnalysisResult = {
  sessionId: string;
  userId: string;
  sections: {
    step_by_step_derivation: string;
    physical_reasoning_reconstruction: string;
    related_models_similar_problems: {
      model_explanation: string;
      similar_problems: unknown[];
    };
    related_articles: {
      summary: string;
      articles: unknown[];
    };
    key_handling: string;
    write_article: {
      suggested_outline: string;
      insertable_blocks: string[];
    };
    add_to_personal_library: {
      suggested_tags: string[];
      suggested_note: string;
    };
  };
  retrieval_status: {
    similar_problems: AiSolverRetrievalStatus;
    related_articles: AiSolverRetrievalStatus;
  };
  warnings: string[];
  createdAt: string;
  updatedAt: string;
};

export type AiSolverFollowUpKind = "user" | "assistant";

export type AiSolverSelectedTextContext = {
  sectionKey?: AiSolverAnalysisSectionKey;
  text: string;
  startOffset: number;
  endOffset: number;
};

export type AiSolverMessageContext =
  | { type: "whole_analysis" }
  | { type: "section"; sectionKey: AiSolverAnalysisSectionKey }
  | { type: "selected_text"; selection: AiSolverSelectedTextContext }
  | { type: "follow_up"; parentMessageId: string };

export type AiSolverMessage = {
  id: string;
  sessionId: string;
  userId: string;
  parentMessageId: string | null;
  kind: AiSolverFollowUpKind;
  content: string;
  context: AiSolverMessageContext;
  createdAt: string;
};

export type AiSolverCreateMessageInput = {
  sessionId: string;
  parentMessageId?: string | null;
  kind: AiSolverFollowUpKind;
  content: string;
  context: AiSolverMessageContext;
};
