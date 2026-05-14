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
  providerContext?: AiSolverMaterialContextMetadata;
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

export type AiSolverMaterialContextMetadata = {
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

export type AiSolverProviderMaterialContext = AiSolverMaterialContextMetadata & {
  dataUrl: string;
  kind: UploadedMaterialKind;
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

export type AiSolverSectionKey =
  | "step_by_step_derivation"
  | "physical_reasoning_reconstruction"
  | "related_models_similar_problems"
  | "related_articles"
  | "key_handling"
  | "write_article"
  | "add_to_personal_library";

export type AiSolverAnalysisSectionKey = AiSolverSectionKey;

export type RetrievalConnectionStatus = "connected" | "not_connected";

export type AiSolverRetrievalStatus = RetrievalConnectionStatus | "error";

export type SimilarProblemRecord = {
  id: string;
  title: string;
  source?: string;
  topicTags?: string[];
  modelTags?: string[];
};

export type RelatedArticleRecord = {
  id: string;
  title: string;
  authorName?: string;
  topicTags?: string[];
  modelTags?: string[];
};

export type AiSolverRetrievalContext = {
  similarProblems?: SimilarProblemRecord[];
  relatedArticles?: RelatedArticleRecord[];
};

export type AiSolverAnalysisSections = {
  step_by_step_derivation: string;
  physical_reasoning_reconstruction: string;
  related_models_similar_problems: {
    model_explanation: string;
    similar_problems: SimilarProblemRecord[];
  };
  related_articles: {
    summary: string;
    articles: RelatedArticleRecord[];
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

export type AiSolverAnalysisResult = {
  sessionId?: string;
  userId?: string;
  sections: AiSolverAnalysisSections;
  retrieval_status: {
    similar_problems: AiSolverRetrievalStatus;
    related_articles: AiSolverRetrievalStatus;
  };
  warnings: string[];
  provider?: {
    ran: boolean;
    model: string;
    offlineFallback: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type StoredAiSolverAnalysisResult = AiSolverAnalysisResult & {
  sessionId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type AiSolverImageContext = {
  mimeType: `image/${string}`;
  data?: string;
  url?: string;
};

export type AiSolverAnalysisInput = {
  problemText: string;
  diagramNotes: string;
  standardAnswer: string;
  images?: AiSolverImageContext[];
  materials?: AiSolverProviderMaterialContext[];
  retrieval?: AiSolverRetrievalContext;
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
