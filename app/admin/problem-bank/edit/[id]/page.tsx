import { getProblemForEdit } from '../../actions';
import { EditProblemForm } from './edit-form';
import { notFound } from 'next/navigation';

export default async function EditProblemPage({
  params,
}: {
  params: { id: string };
}) {
  const { problem, error } = await getProblemForEdit(params.id);

  if (error || !problem) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-8">编辑题目</h1>
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 p-8 rounded-lg">
        <EditProblemForm problem={problem} />
      </div>
    </div>
  );
}
