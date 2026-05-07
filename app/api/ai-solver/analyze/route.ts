import { NextRequest, NextResponse } from "next/server";
import { OPENROUTER_CONFIG } from "@/lib/ai-solver/config";
import { assertAnalysisGate } from "@/lib/ai-solver/local-store";
import { getRequestUserId } from "@/lib/ai-solver/request-auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId();
    const body = (await request.json()) as { sessionId?: string };

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const gate = assertAnalysisGate(body.sessionId, userId);

    return NextResponse.json({
      gate,
      provider: {
        configured: OPENROUTER_CONFIG.hasApiKey,
      },
      message: "Analysis provider call is intentionally deferred to the OpenRouter/Gemini implementation issue.",
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "AI Solver analysis is not allowed.";
}
