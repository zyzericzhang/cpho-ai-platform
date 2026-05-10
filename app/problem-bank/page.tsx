import { createServerClient } from '@/lib/supabase/server';
import { Problem } from '@/lib/problem-bank/types';
import Link from 'next/link';
import { Search, Filter, Tag } from 'lucide-react';
import { PostgrestError } from '@supabase/supabase-js';

export default async function ProblemBankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; topic?: string }>;
}) {
  const supabase = await createServerClient();
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q;
  const category = resolvedSearchParams.category;
  const topic = resolvedSearchParams.topic;

  let supabaseQuery = supabase
    .from('problems')
    .select(`
      id,
      title,
      category,
      topics,
      papers (
        title,
        organization
      )
    `)
    .order('created_at', { ascending: false });

  if (query) {
    supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
  }
  if (category) {
    supabaseQuery = supabaseQuery.eq('category', category);
  }
  if (topic) {
    supabaseQuery = supabaseQuery.contains('topics', [topic]);
  }

  const { data: problems, error } = await supabaseQuery as { data: Problem[] | null, error: PostgrestError | null };

  // Fetch unique categories and topics for filters
  const { data: filterData } = await supabase
    .from('problems')
    .select('category, topics');
  
  const categories = Array.from(new Set(filterData?.map(p => p.category).filter(Boolean)));
  const topics = Array.from(new Set(filterData?.flatMap(p => p.topics || []).filter(Boolean)));

  return (
    <div className="container mx-auto p-4 text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">题库</h1>
        <p className="text-gray-400 text-sm">探索公共物理竞赛题目，开启 AI 学习之旅。</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Filters */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg sticky top-4">
            <div className="flex items-center gap-2 mb-6 font-semibold border-b border-gray-800 pb-2">
              <Filter className="h-4 w-4" />
              <span>筛选</span>
            </div>

            <form className="space-y-6">
              {/* Text Search */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">搜索题目</label>
                <div className="relative">
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="输入关键词..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">题目分类</label>
                <select 
                  name="category" 
                  defaultValue={category || ''}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
                >
                  <option value="">全部分类</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">知识点</label>
                <select 
                  name="topic" 
                  defaultValue={topic || ''}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
                >
                  <option value="">全部知识点</option>
                  {topics.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors shadow-lg shadow-indigo-500/20">
                应用筛选
              </button>
              
              {(query || category || topic) && (
                <Link href="/problem-bank" className="block text-center text-xs text-gray-400 hover:text-white transition-colors">
                  清除所有筛选
                </Link>
              )}
            </form>
          </div>
        </aside>

        {/* Main: Problem List */}
        <main className="lg:col-span-3 space-y-4">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-900 text-red-400 rounded-md">
              加载题目时出错，请稍后重试。
            </div>
          )}
          
          {(!problems || problems.length === 0) ? (
            <div className="py-20 text-center bg-gray-900/50 border border-dashed border-gray-800 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full mb-4 text-gray-500">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-gray-400">未找到相关题目，尝试更换筛选条件。</p>
            </div>
          ) : (
            problems.map((problem) => (
              <Link 
                href={`/problem-bank/${problem.id}`} 
                key={problem.id} 
                className="group block p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-gray-100 group-hover:text-indigo-400 transition-colors">{problem.title}</h2>
                  {problem.category && (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 rounded">
                      {problem.category}
                    </span>
                  )}
                </div>
                
                {problem.papers && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <span className="hover:underline cursor-pointer">{problem.papers.title}</span>
                    <span className="text-gray-700">•</span>
                    <span>{problem.papers.organization}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {problem.topics?.map(topic => (
                    <div key={topic} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-800/50 border border-gray-700/50 rounded-md">
                      <Tag className="h-3 w-3" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </Link>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
