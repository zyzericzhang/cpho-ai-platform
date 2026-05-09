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

export type AiSolverSectionKey =
  | "step_by_step_derivation"
  | "physical_reasoning_reconstruction"
  | "related_models_similar_problems"
  | "related_articles"
  | "key_handling"
  | "write_article"
  | "add_to_personal_library";

export type RetrievalConnectionStatus = "connected" | "not_connected";

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
  sections: AiSolverAnalysisSections;
  retrieval_status: {
    similar_problems: RetrievalConnectionStatus;
    related_articles: RetrievalConnectionStatus;
  };
  warnings: string[];
  provider: {
    ran: boolean;
    model: string;
    offlineFallback: boolean;
  };
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
  retrieval?: AiSolverRetrievalContext;
};
