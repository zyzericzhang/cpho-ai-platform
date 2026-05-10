'use client';

import { Trash2 } from 'lucide-react';
import { deleteProblem } from './actions';
import { useTransition } from 'react';

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('确定要删除这道题目吗？此操作不可撤销。')) {
      startTransition(async () => {
        const result = await deleteProblem(id);
        if (result?.error) {
          alert(`删除失败: ${result.error}`);
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
      title="删除"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
