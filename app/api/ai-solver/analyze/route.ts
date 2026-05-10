import { NextRequest, NextResponse } from "next/server";
import {
  assertAnalysisGate,
  collectProviderSafeImageContexts,
  getOwnedExtraction,
  persistAnalysisResult,
} from "@/lib/ai-solver/local-store";
import { runAiSolverAnalysis, toSafeProviderError } from "@/lib/ai-solver/provider-orchestration";
import { getRequestUserId } from "@/lib/ai-solver/request-auth";
import type { AiSolverAnalysisResult, AiSolverImageContext } from "@/lib/ai-solver/types";

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId();
    const body = (await request.json()) as { sessionId?: string };

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const gate = assertAnalysisGate(body.sessionId, userId);
    const extraction = getOwnedExtraction(body.sessionId, userId);
    const imageContexts = collectProviderSafeImageContexts(body.sessionId, userId);
    const analysis = await runAiSolverAnalysis({
      problemText: extraction.problemText,
      diagramNotes: extraction.diagramNotes,
      standardAnswer: extraction.standardAnswer,
      images: imageContexts.map(toProviderImageInput),
    });
    const persistedAnalysis = persistAnalysisResult(body.sessionId, userId, analysis);

    return NextResponse.json({
      gate,
      analysis: toClientAnalysis(persistedAnalysis),
      provider: {
        configured: gate.providerReady,
        ran: persistedAnalysis.provider?.ran ?? false,
        offlineFallback: persistedAnalysis.provider?.offlineFallback ?? false,
      },
    });
  } catch (error) {
    const providerError = toSafeProviderError(error);

    if (providerError.code !== "analysis_failed") {
      return NextResponse.json(providerError, { status: providerError.status ?? 502 });
    }

    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "AI Solver analysis is not allowed.";
}

function toProviderImageInput(image: { mimeType: string; dataUrl: string }): AiSolverImageContext {
  if (!image.mimeType.startsWith("image/")) {
    throw new Error("Stored image context is not a supported image MIME type.");
  }

  return {
    mimeType: image.mimeType as `image/${string}`,
    data: image.dataUrl,
  };
}

function toClientAnalysis(analysis: AiSolverAnalysisResult) {
  return {
    sessionId: analysis.sessionId,
    sections: analysis.sections,
    retrieval_status: analysis.retrieval_status,
    warnings: analysis.warnings,
    provider: analysis.provider,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
}
