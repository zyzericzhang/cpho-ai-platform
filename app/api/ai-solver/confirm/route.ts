import { NextRequest, NextResponse } from "next/server";
import { confirmExtraction } from "@/lib/ai-solver/local-store";
import { getRequestUserId } from "@/lib/ai-solver/request-auth";
import type { AiSolverConfirmationInput } from "@/lib/ai-solver/types";

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId();
    const body = (await request.json()) as AiSolverConfirmationInput;

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const extraction = confirmExtraction(body, userId);

    return NextResponse.json({ extraction });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to confirm extracted text.";
}
