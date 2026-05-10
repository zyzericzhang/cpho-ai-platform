type PageProps = {
  params: { sessionId: string };
};

export default function AiSolverSessionPage({ params }: PageProps) {
  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6">AI Solver Session</h1>
      <p>
        This is a placeholder page for AI Solver Session ID:
        <span className="font-mono text-indigo-400 ml-2">{params.sessionId}</span>
      </p>
      <p className="mt-4 text-gray-400">
        The full UI for the AI Solver has not been implemented yet.
      </p>
    </div>
  );
}
