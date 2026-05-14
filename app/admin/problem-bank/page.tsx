import { getAdminProblems } from './actions';
import { ProblemForm } from './problem-form';
import { DeleteButton } from './delete-button';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { AdminProblemSummary } from '@/lib/problem-bank/types';

export default async function ProblemBankAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q;
  const result = await getAdminProblems(query);
  const problems = 'problems' in result ? result.problems : null;
  const error = 'error' in result ? result.error : null;

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-8">题库管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Problem List and Search */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">题目列表</h2>
            <form className="relative w-64">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="搜索题目..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {error && <div className="p-4 bg-red-900/20 border border-red-900 text-red-400 rounded-md">{error}</div>}

          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">题目名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">试卷 / 机构</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {problems?.map((problem: AdminProblemSummary) => (
                  <tr key={problem.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-400">{problem.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{problem.papers?.title || '未归属'}</div>
                      <div className="text-xs text-gray-500">{problem.papers?.organization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {problem.category && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
                          {problem.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
                        {problem.status === 'draft' ? '草稿' : problem.status === 'archived' ? '已归档' : '已发布'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(problem.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/problem-bank/edit/${problem.id}`} className="text-indigo-400 hover:text-indigo-300 mr-4">
                        编辑
                      </Link>
                      <DeleteButton id={problem.id} />
                    </td>
                  </tr>
                ))}
                {(!problems || problems.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      未找到相关题目
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Add Problem Form */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg h-fit">
          <ProblemForm />
        </div>
      </div>
    </div>
  );
}
