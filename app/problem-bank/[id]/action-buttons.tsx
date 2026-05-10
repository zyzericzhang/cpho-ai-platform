'use client';

import { useTransition } from 'react';
import { sendToAiSolver, togglePersonalLibrary } from './actions';

export function ActionButtons({ problemId, isAlreadyInLibrary }: { problemId: string, isAlreadyInLibrary: boolean }) {
    const [isSolverPending, startSolverTransition] = useTransition();
    const [isLibraryPending, startLibraryTransition] = useTransition();

    const handleSendToSolver = () => {
        startSolverTransition(async () => {
            try {
                await sendToAiSolver(problemId);
            } catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    };

    const handleToggleLibrary = () => {
        startLibraryTransition(async () => {
            try {
                await togglePersonalLibrary(problemId);
            } catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    };

    return (
        <div className="flex flex-col space-y-3">
            <button 
                onClick={handleSendToSolver}
                disabled={isSolverPending}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none disabled:bg-gray-500"
            >
                {isSolverPending ? '正在创建会话...' : '发送至 AI Solver'}
            </button>
            <button 
                onClick={handleToggleLibrary}
                disabled={isLibraryPending}
                className={`w-full px-4 py-2 font-semibold rounded-md shadow-md focus:outline-none disabled:bg-gray-500 ${
                    isAlreadyInLibrary 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
            >
                {isLibraryPending 
                    ? (isAlreadyInLibrary ? '正在移除...' : '正在添加...')
                    : (isAlreadyInLibrary ? '已在学习库' : '添加到个人学习库')
                }
            </button>
        </div>
    );
}
