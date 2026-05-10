export type Problem = {
  id: string;
  paper_id: string | null;
  title: string;
  problem_statement: string;
  standard_answer: string;
  category: string | null;
  topics: string[] | null;
  model_tags: string[] | null;
  created_at: string;
  uploader_id: string;
  papers: Paper | null; // For joining data
};

export type Paper = {
  id: string;
  title: string;
  organization: string | null;
  published_at: string | null;
  source_pdf_storage_path: string | null;
  created_at: string;
  uploader_id: string;
};
