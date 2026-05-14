import { createServerClient } from '@/lib/supabase/server';
import { Problem } from '@/lib/problem-bank/types';
import { notFound } from 'next/navigation';
import { PostgrestError } from '@supabase/supabase-js';
import Link from 'next/link';
import { ActionButtons } from './action-buttons';
import { FileText, Search } from 'lucide-react';

type ProblemDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const supabase = await createServerClient();
  const resolvedParams = await params;
  
  const { data: problem, error } = await supabase
    .from('problems')
    .select(`
      *,
      papers (
        *,
        source_pdf_storage_path,
        answer_pdf_storage_path
      )
    `)
    .eq('id', resolvedParams.id)
    .single() as { data: Problem | null, error: PostgrestError | null };

  if (error || !problem) {
    console.error('Error fetching problem:', error);
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: libraryItem } = user ? await supabase
    .from('personal_library_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', resolvedParams.id)
    .eq('item_type', 'problem')
    .single() : { data: null };

  const isAlreadyInLibrary = !!libraryItem;

  let signedPdfUrl = null;
  let signedAnswerPdfUrl = null;
  if (problem.papers?.source_pdf_storage_path) {
    const { data } = await supabase.storage
      .from('problem-bank-papers')
      .createSignedUrl(problem.papers.source_pdf_storage_path, 60 * 10);
    signedPdfUrl = data?.signedUrl ?? null;
  }
  if (problem.papers?.answer_pdf_storage_path) {
    const { data } = await supabase.storage
      .from('problem-bank-papers')
      .createSignedUrl(problem.papers.answer_pdf_storage_path, 60 * 10);
    signedAnswerPdfUrl = data?.signedUrl ?? null;
  }
  
  return (
    <div className="container mx-auto p-4 text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
        {problem.papers && (
            <div className='text-gray-400'>
                来自: <Link href="#" className="text-indigo-400 hover:underline">{problem.papers.title}</Link>
            </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {problem.category && <span className="px-3 py-1 text-sm font-semibold text-white bg-gray-600 rounded-full">{problem.category}</span>}
          {problem.topics?.map(topic => (
            <span key={topic} className="px-3 py-1 text-sm text-gray-300 bg-gray-700 rounded-full">{topic}</span>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <main className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2 mb-4">题干</h2>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
              {problem.problem_statement}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2 mb-4">标准答案</h2>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
              {problem.standard_answer}
            </div>
          </section>

          {/* PB-5: Related Content */}
          <section className="pt-8 border-t border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-indigo-400" />
                  相似题目
                </h3>
                <div className="p-8 rounded-xl bg-gray-900/50 border border-dashed border-gray-800 flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-gray-500 mb-2">真实检索未接入</p>
                  <p className="text-xs text-gray-600">类似题目推荐功能将在后续版本上线</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  相关文章
                </h3>
                <div className="p-8 rounded-xl bg-gray-900/50 border border-dashed border-gray-800 flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-gray-500 mb-2">真实检索未接入</p>
                  <p className="text-xs text-gray-600">相关知识点文章推荐功能将在后续版本上线</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside className="md:col-span-1 space-y-6">
            <div className="p-4 rounded-lg bg-gray-800">
                <h3 className="text-lg font-semibold mb-4">操作</h3>
                <ActionButtons problemId={problem.id} isAlreadyInLibrary={isAlreadyInLibrary} />
            </div>

            {problem.papers && (
                <div className="p-4 rounded-lg bg-gray-800">
                    <h3 className="text-lg font-semibold mb-4">相关试卷</h3>
                    <p className="text-gray-300">{problem.papers.title}</p>
                    <p className="text-sm text-gray-400">{problem.papers.organization}</p>
                    {signedPdfUrl && (
                        <a href={signedPdfUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center mt-4 px-4 py-2 border border-indigo-500 text-indigo-400 font-semibold rounded-md hover:bg-indigo-500 hover:text-white transition-colors">
                            查看试卷 PDF
                        </a>
                    )}
                    {signedAnswerPdfUrl && (
                        <a href={signedAnswerPdfUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center mt-3 px-4 py-2 border border-zinc-600 text-zinc-200 font-semibold rounded-md hover:bg-zinc-700 transition-colors">
                            查看答案 PDF
                        </a>
                    )}
                </div>
            )}
        </aside>
      </div>
    </div>
  );
}
