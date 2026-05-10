'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
  
  // 1. Create the Paper record
  const paperResult = await supabase.from('papers').insert({
    title: formData.get('paperTitle') as string,
    organization: formData.get('organization') as string,
    published_at: formData.get('publishedAt') as string,
    uploader_id: user.id,
  }).select('id').single();

  if (paperResult.error) {
    console.error('Error creating paper:', paperResult.error);
    return { error: paperResult.error.message };
  }
  
  const paperId = paperResult.data.id;

  // 2. Upload the PDF (if provided)
  const paperPdf = formData.get('paperPdf') as File;
  if (paperPdf && paperPdf.size > 0) {
    const filePath = `${user.id}/${paperId}/${paperPdf.name}`;
    const { error: uploadError } = await supabase.storage
      .from('problem-bank-papers')
      .upload(filePath, paperPdf);
      
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return { error: uploadError.message };
    }
    
    // Update paper with the storage path
    const { error: updateError } = await supabase
      .from('papers')
      .update({ source_pdf_storage_path: filePath })
      .eq('id', paperId);

    if (updateError) {
      console.error('Error updating paper with PDF path:', updateError);
      return { error: updateError.message };
    }
  }

  // 3. Create the Problem record
  const topics = (formData.get('topics') as string)?.split(',').map(t => t.trim()).filter(Boolean);

  const problemResult = await supabase.from('problems').insert({
    paper_id: paperId,
    title: formData.get('problemTitle') as string,
    problem_statement: formData.get('problemStatement') as string,
    standard_answer: formData.get('standardAnswer') as string,
    category: formData.get('category') as string,
    topics: topics,
    uploader_id: user.id,
  });

  if (problemResult.error) {
    console.error('Error creating problem:', problemResult.error);
    return { error: problemResult.error.message };
  }

  revalidatePath('/admin/problem-bank');
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
  
  return { problems: data };
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
        title: formData.get('paperTitle') as string,
        organization: formData.get('organization') as string,
        published_at: formData.get('publishedAt') as string,
      })
      .eq('id', existing.paper_id);

    if (paperError) return { error: paperError.message };
  }

  // 3. Update Problem
  const topics = (formData.get('topics') as string)?.split(',').map(t => t.trim()).filter(Boolean);
  
  const { error: problemError } = await supabase
    .from('problems')
    .update({
      title: formData.get('problemTitle') as string,
      problem_statement: formData.get('problemStatement') as string,
      standard_answer: formData.get('standardAnswer') as string,
      category: formData.get('category') as string,
      topics: topics,
    })
    .eq('id', id);

  if (problemError) return { error: problemError.message };

  revalidatePath('/admin/problem-bank');
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
        .select('source_pdf_storage_path')
        .eq('id', problem.paper_id)
        .single();

      if (paper?.source_pdf_storage_path) {
        await supabase.storage
          .from('problem-bank-papers')
          .remove([paper.source_pdf_storage_path]);
      }

      await supabase.from('papers').delete().eq('id', problem.paper_id);
    }
  }

  revalidatePath('/admin/problem-bank');
  return { success: true };
}
