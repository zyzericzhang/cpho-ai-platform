export type Problem = {
  id: string;
  paper_id: string | null;
  title: string;
  problem_statement: string;
  standard_answer: string;
  category: string | null;
  topics: string[] | null;
  model_tags: string[] | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  uploader_id: string;
  papers: Paper | null; // For joining data
};

export type AdminProblemSummary = Pick<Problem, "id" | "title" | "category" | "created_at" | "status"> & {
  papers: Pick<Paper, "id" | "title" | "organization"> | null;
};

export type Paper = {
  id: string;
  title: string;
  organization: string | null;
  published_at: string | null;
  source_pdf_storage_path: string | null;
  answer_pdf_storage_path: string | null;
  created_at: string;
  uploader_id: string;
};
