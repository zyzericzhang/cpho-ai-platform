import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/ai-solver/local-store";
import { getRequestUserId } from "@/lib/ai-solver/request-auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId();
    const body = (await request.json().catch(() => ({}))) as { title?: string };
    const session = createSession(userId, body.title);

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to create AI Solver session.";
}
