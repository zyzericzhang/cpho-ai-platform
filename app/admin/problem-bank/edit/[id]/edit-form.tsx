'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { updateProblem } from '../../actions';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Problem } from '@/lib/problem-bank/types';

const formSchema = z.object({
  paperTitle: z.string().min(5, '试卷标题至少需要5个字符'),
  organization: z.string().optional(),
  publishedAt: z.string().optional(),
  problemTitle: z.string().min(5, '题目名称至少需要5个字符'),
  problemStatement: z.string().min(20, '题干描述至少需要20个字符'),
  standardAnswer: z.string().min(10, '标准答案至少需要10个字符'),
  category: z.string().optional(),
  topics: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export function EditProblemForm({ problem }: { problem: Problem }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paperTitle: problem.papers?.title || '',
      organization: problem.papers?.organization || '',
      publishedAt: problem.papers?.published_at ? new Date(problem.papers.published_at).toISOString().split('T')[0] : '',
      problemTitle: problem.title || '',
      problemStatement: problem.problem_statement || '',
      standardAnswer: problem.standard_answer || '',
      category: problem.category || '',
      topics: problem.topics?.join(', ') || '',
    },
  });

  function onSubmit(values: FormSchema) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) formData.append(key, value as string);
    });

    startTransition(async () => {
      const result = await updateProblem(problem.id, formData);
      if (result?.error) {
        alert(`更新失败: ${result.error}`);
      } else {
        alert('更新成功!');
        router.push('/admin/problem-bank');
      }
    });
  }

  const inputStyles = "block w-full rounded-md border-gray-600 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-white p-2";
  const labelStyles = "block text-sm font-medium text-gray-300 mb-1";
  const errorStyles = "mt-2 text-sm text-red-400";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="border border-gray-700 p-4 rounded-md">
        <legend className="text-lg font-semibold px-2">试卷信息</legend>
        <div className="space-y-4">
          <div>
            <label htmlFor="paperTitle" className={labelStyles}>试卷标题</label>
            <input id="paperTitle" {...form.register('paperTitle')} className={inputStyles} />
            {form.formState.errors.paperTitle && <p className={errorStyles}>{form.formState.errors.paperTitle.message}</p>}
          </div>
          
          <div>
            <label htmlFor="organization" className={labelStyles}>机构</label>
            <input id="organization" {...form.register('organization')} className={inputStyles} />
          </div>

          <div>
            <label htmlFor="publishedAt" className={labelStyles}>发布时间</label>
            <input id="publishedAt" type="date" {...form.register('publishedAt')} className={inputStyles} />
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-gray-700 p-4 rounded-md">
        <legend className="text-lg font-semibold px-2">题目信息</legend>
        <div className="space-y-4">
          <div>
            <label htmlFor="problemTitle" className={labelStyles}>题目名称</label>
            <input id="problemTitle" {...form.register('problemTitle')} className={inputStyles} />
            {form.formState.errors.problemTitle && <p className={errorStyles}>{form.formState.errors.problemTitle.message}</p>}
          </div>

          <div>
            <label htmlFor="problemStatement" className={labelStyles}>题干</label>
            <textarea id="problemStatement" {...form.register('problemStatement')} className={inputStyles} rows={5} />
            {form.formState.errors.problemStatement && <p className={errorStyles}>{form.formState.errors.problemStatement.message}</p>}
          </div>

          <div>
            <label htmlFor="standardAnswer" className={labelStyles}>标准答案</label>
            <textarea id="standardAnswer" {...form.register('standardAnswer')} className={inputStyles} rows={5} />
            {form.formState.errors.standardAnswer && <p className={errorStyles}>{form.formState.errors.standardAnswer.message}</p>}
          </div>

          <div>
            <label htmlFor="category" className={labelStyles}>分类</label>
            <input id="category" {...form.register('category')} className={inputStyles} />
          </div>

          <div>
            <label htmlFor="topics" className={labelStyles}>知识点 (逗号分隔)</label>
            <input id="topics" {...form.register('topics')} className={inputStyles} />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
          取消
        </button>
        <button type="submit" disabled={isPending} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-500">
          {isPending ? '保存中...' : '保存修改'}
        </button>
      </div>
    </form>
  );
}
