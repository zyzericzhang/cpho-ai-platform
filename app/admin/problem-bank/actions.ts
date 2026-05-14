'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { AdminProblemSummary } from '@/lib/problem-bank/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PROBLEM_BANK_PDF_MAX_BYTES = 25 * 1024 * 1024;

const problemMutationSchema = z.object({
  paperTitle: z.string().trim().min(5, '试卷标题至少需要5个字符'),
  organization: z.string().trim().optional().default(''),
  publishedAt: z.string().trim().optional().default(''),
  problemTitle: z.string().trim().min(5, '题目名称至少需要5个字符'),
  problemStatement: z.string().trim().min(20, '题干描述至少需要20个字符'),
  standardAnswer: z.string().trim().min(10, '标准答案至少需要10个字符'),
  category: z.string().trim().optional().default(''),
  topics: z.string().trim().optional().default(''),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

export async function createProblem(formData: FormData) {
  const user = await verifyAdmin();
  const supabase = await createServerClient();
  const parsed = parseProblemMutation(formData);

  if (!parsed.success) {
    return { error: parsed.error };
  }

  const paperPdfResult = parseOptionalPaperPdf(formData);
  if (!paperPdfResult.success) {
    return { error: paperPdfResult.error };
  }
  const answerPdfResult = parseOptionalAnswerPdf(formData);
  if (!answerPdfResult.success) {
    return { error: answerPdfResult.error };
  }

  const input = parsed.data;
  
  // 1. Create the Paper record
  const paperResult = await supabase.from('papers').insert({
    title: input.paperTitle,
    organization: toNullableText(input.organization),
    published_at: toNullableText(input.publishedAt),
    uploader_id: user.id,
  }).select('id').single();

  if (paperResult.error) {
    console.error('Error creating paper:', paperResult.error);
    return { error: paperResult.error.message };
  }
  
  const paperId = paperResult.data.id;

  // 2. Upload the PDF (if provided)
  const paperPdf = paperPdfResult.file;
  const answerPdf = answerPdfResult.file;
  let uploadedPdfPath: string | null = null;
  let uploadedAnswerPdfPath: string | null = null;
  if (paperPdf) {
    const filePath = `${user.id}/${paperId}/problem-${sanitizeFileName(paperPdf.name)}`;
    const { error: uploadError } = await supabase.storage
      .from('problem-bank-papers')
      .upload(filePath, paperPdf);
      
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      await supabase.from('papers').delete().eq('id', paperId);
      return { error: uploadError.message };
    }

    uploadedPdfPath = filePath;
  }

  if (answerPdf) {
    const filePath = `${user.id}/${paperId}/answer-${sanitizeFileName(answerPdf.name)}`;
    const { error: uploadError } = await supabase.storage
      .from('problem-bank-papers')
      .upload(filePath, answerPdf);

    if (uploadError) {
      console.error('Error uploading answer PDF:', uploadError);
      if (uploadedPdfPath) {
        await supabase.storage.from('problem-bank-papers').remove([uploadedPdfPath]);
      }
      await supabase.from('papers').delete().eq('id', paperId);
      return { error: uploadError.message };
    }

    uploadedAnswerPdfPath = filePath;
  }

  if (uploadedPdfPath || uploadedAnswerPdfPath) {
    const { error: updateError } = await supabase
      .from('papers')
      .update({
        source_pdf_storage_path: uploadedPdfPath,
        answer_pdf_storage_path: uploadedAnswerPdfPath,
      })
      .eq('id', paperId);

    if (updateError) {
      console.error('Error updating paper with PDF path:', updateError);
      await removeUploadedPaperFiles(supabase, [uploadedPdfPath, uploadedAnswerPdfPath]);
      await supabase.from('papers').delete().eq('id', paperId);
      return { error: updateError.message };
    }
  }

  // 3. Create the Problem record
  const problemResult = await supabase.from('problems').insert({
    paper_id: paperId,
    title: input.problemTitle,
    problem_statement: input.problemStatement,
    standard_answer: input.standardAnswer,
    category: toNullableText(input.category),
    topics: parseTopics(input.topics),
    status: input.status,
    uploader_id: user.id,
  });

  if (problemResult.error) {
    console.error('Error creating problem:', problemResult.error);
    await removeUploadedPaperFiles(supabase, [uploadedPdfPath, uploadedAnswerPdfPath]);
    await supabase.from('papers').delete().eq('id', paperId);
    return { error: problemResult.error.message };
  }

  revalidatePath('/admin/problem-bank');
  revalidatePath('/problem-bank');
  return { success: true };
}

export async function getAdminProblems(query?: string) {
  await verifyAdmin();
  const supabase = await createServerClient();
  
  let supabaseQuery = supabase
    .from('problems')
    .select(`
      id,
      title,
      category,
      status,
      created_at,
      papers (
        id,
        title,
        organization
      )
    `)
    .order('created_at', { ascending: false });

  if (query) {
    supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
  }

  const { data, error } = await supabaseQuery;
  
  if (error) {
    console.error('Error fetching admin problems:', error);
    return { error: error.message };
  }
  
  const problems: AdminProblemSummary[] = (data ?? []).map((problem) => ({
    ...problem,
    papers: Array.isArray(problem.papers) ? problem.papers[0] ?? null : problem.papers,
  }));

  return { problems };
}

export async function getProblemForEdit(id: string) {
  await verifyAdmin();
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('problems')
    .select(`
      *,
      papers (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching problem for edit:', error);
    return { error: error.message };
  }
  
  return { problem: data };
}

export async function updateProblem(id: string, formData: FormData) {
  await verifyAdmin();
  const supabase = await createServerClient();
  const parsed = parseProblemMutation(formData);

  if (!parsed.success) {
    return { error: parsed.error };
  }

  const input = parsed.data;

  // 1. Get existing problem to find paper_id
  const { data: existing } = await supabase
    .from('problems')
    .select('paper_id')
    .eq('id', id)
    .single();

  // 2. Update Paper if it exists
  if (existing?.paper_id) {
    const { error: paperError } = await supabase
      .from('papers')
      .update({
        title: input.paperTitle,
        organization: toNullableText(input.organization),
        published_at: toNullableText(input.publishedAt),
      })
      .eq('id', existing.paper_id);

    if (paperError) return { error: paperError.message };
  }

  // 3. Update Problem
  const { error: problemError } = await supabase
    .from('problems')
    .update({
      title: input.problemTitle,
      problem_statement: input.problemStatement,
      standard_answer: input.standardAnswer,
      category: toNullableText(input.category),
      topics: parseTopics(input.topics),
      status: input.status,
    })
    .eq('id', id);

  if (problemError) return { error: problemError.message };

  revalidatePath('/admin/problem-bank');
  revalidatePath('/problem-bank');
  revalidatePath(`/problem-bank/${id}`);
  return { success: true };
}

export async function deleteProblem(id: string) {
  await verifyAdmin();
  const supabase = await createServerClient();

  // 1. Get paper info to check if we should delete storage
  const { data: problem } = await supabase
    .from('problems')
    .select('paper_id')
    .eq('id', id)
    .single();

  // 2. Delete the problem
  const { error } = await supabase.from('problems').delete().eq('id', id);
  if (error) return { error: error.message };

  // 3. Optional: Cleanup paper if it has no other problems
  if (problem?.paper_id) {
    const { count } = await supabase
      .from('problems')
      .select('*', { count: 'exact', head: true })
      .eq('paper_id', problem.paper_id);

    if (count === 0) {
      // Get storage path before deleting paper
      const { data: paper } = await supabase
        .from('papers')
        .select('source_pdf_storage_path, answer_pdf_storage_path')
        .eq('id', problem.paper_id)
        .single();

      await removeUploadedPaperFiles(supabase, [
        paper?.source_pdf_storage_path ?? null,
        paper?.answer_pdf_storage_path ?? null,
      ]);

      await supabase.from('papers').delete().eq('id', problem.paper_id);
    }
  }

  revalidatePath('/admin/problem-bank');
  revalidatePath('/problem-bank');
  return { success: true };
}

function parseProblemMutation(formData: FormData):
  | { success: true; data: z.infer<typeof problemMutationSchema> }
  | { success: false; error: string } {
  const parsed = problemMutationSchema.safeParse({
    paperTitle: formData.get('paperTitle'),
    organization: formData.get('organization'),
    publishedAt: formData.get('publishedAt'),
    problemTitle: formData.get('problemTitle'),
    problemStatement: formData.get('problemStatement'),
    standardAnswer: formData.get('standardAnswer'),
    category: formData.get('category'),
    topics: formData.get('topics'),
    status: formData.get('status') || 'published',
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? '题库表单校验失败。',
    };
  }

  return { success: true, data: parsed.data };
}

function parseOptionalPaperPdf(formData: FormData):
  | { success: true; file: File | null }
  | { success: false; error: string } {
  const paperPdf = formData.get('paperPdf');

  if (!(paperPdf instanceof File) || paperPdf.size === 0) {
    return { success: true, file: null };
  }

  const normalizedName = paperPdf.name.toLowerCase();
  if (paperPdf.type !== 'application/pdf' || !normalizedName.endsWith('.pdf')) {
    return { success: false, error: '试卷附件仅支持 PDF 文件。' };
  }

  if (paperPdf.size > PROBLEM_BANK_PDF_MAX_BYTES) {
    return { success: false, error: '试卷 PDF 不能超过 25MB。' };
  }

  return { success: true, file: paperPdf };
}

function parseOptionalAnswerPdf(formData: FormData):
  | { success: true; file: File | null }
  | { success: false; error: string } {
  const answerPdf = formData.get('answerPdf');

  if (!(answerPdf instanceof File) || answerPdf.size === 0) {
    return { success: true, file: null };
  }

  const normalizedName = answerPdf.name.toLowerCase();
  if (answerPdf.type !== 'application/pdf' || !normalizedName.endsWith('.pdf')) {
    return { success: false, error: '答案附件仅支持 PDF 文件。' };
  }

  if (answerPdf.size > PROBLEM_BANK_PDF_MAX_BYTES) {
    return { success: false, error: '答案 PDF 不能超过 25MB。' };
  }

  return { success: true, file: answerPdf };
}

function toNullableText(value: string) {
  return value.trim() ? value.trim() : null;
}

function parseTopics(value: string) {
  return value
    .split(',')
    .map((topic) => topic.trim())
    .filter(Boolean);
}

function sanitizeFileName(name: string) {
  const sanitized = name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized || 'paper.pdf';
}

async function removeUploadedPaperFiles(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  paths: Array<string | null>,
) {
  const compactPaths = paths.filter((path): path is string => Boolean(path));

  if (compactPaths.length > 0) {
    await supabase.storage.from('problem-bank-papers').remove(compactPaths);
  }
}
