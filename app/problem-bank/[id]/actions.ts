'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function sendToAiSolver(problemId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 1. Fetch problem details
  const { data: problem, error: fetchError } = await supabase
    .from('problems')
    .select('title, problem_statement, standard_answer')
    .eq('id', problemId)
    .single();

  if (fetchError || !problem) {
    throw new Error('Problem not found');
  }

  // 2. Create AI Solver Session
  const { data: session, error: sessionError } = await supabase
    .from('ai_solver_sessions')
    .insert({
      user_id: user.id,
      title: `[题库] ${problem.title}`,
      status: 'confirmed',
    })
    .select('id')
    .single();

  if (sessionError) {
    console.error('Error creating solver session:', sessionError);
    throw new Error('Failed to create AI Solver session.');
  }

  // 3. Pre-fill extracted materials
  const { error: extractionError } = await supabase
    .from('extracted_materials')
    .insert({
      session_id: session.id,
      user_id: user.id,
      problem_text: problem.problem_statement,
      standard_answer: problem.standard_answer,
      is_standard_answer_confirmed: true,
    });

  if (extractionError) {
    console.error('Error creating extracted materials:', extractionError);
    throw new Error('Failed to initialize session data.');
  }

  redirect(`/ai-solver/${session.id}`);
}

export async function togglePersonalLibrary(problemId: string) {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if the item already exists in the library
  const { data: existingItem, error: fetchError } = await supabase
    .from('personal_library_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', problemId)
    .eq('item_type', 'problem')
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
    console.error('Error checking library:', fetchError);
    throw new Error('Could not access personal library.');
  }

  if (existingItem) {
    // Item exists, so remove it
    const { error: deleteError } = await supabase
      .from('personal_library_items')
      .delete()
      .eq('id', existingItem.id);
    
    if (deleteError) {
      console.error('Error removing from library:', deleteError);
      throw new Error('Could not remove item from library.');
    }
  } else {
    // Item does not exist, so add it
    const { error: insertError } = await supabase
      .from('personal_library_items')
      .insert({
        user_id: user.id,
        item_id: problemId,
        item_type: 'problem',
      });

    if (insertError) {
      console.error('Error adding to library:', insertError);
      throw new Error('Could not add item to library.');
    }
  }

  revalidatePath(`/problem-bank/${problemId}`);
}
