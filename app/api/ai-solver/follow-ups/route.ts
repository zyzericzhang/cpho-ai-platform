import { NextRequest, NextResponse } from "next/server";
import { AI_SOLVER_SECTION_KEYS } from "@/lib/ai-solver/analysis-schema";
import { runAiSolverFollowUp } from "@/lib/ai-solver/follow-up-provider";
import {
  assertAnalysisGate,
  collectProviderSafeMaterialContexts,
  createFollowUpAssistantMessage,
  createFollowUpUserMessage,
  getOwnedAnalysisResult,
  getOwnedExtraction,
  getOwnedMessages,
} from "@/lib/ai-solver/local-store";
import { toSafeProviderError } from "@/lib/ai-solver/provider-orchestration";
import { getRequestUserId } from "@/lib/ai-solver/request-auth";
import type { AiSolverAnalysisResult, AiSolverMessage, AiSolverMessageContext } from "@/lib/ai-solver/types";

type FollowUpPostBody = {
  sessionId?: string;
  prompt?: string;
  content?: string;
  parentMessageId?: string | null;
  context?: AiSolverMessageContext;
};

export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId();
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const messages = getOwnedMessages(sessionId, userId);
    return NextResponse.json({ messages: messages.map(toClientMessage) });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId();
    const body = (await request.json()) as FollowUpPostBody;

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const prompt = (body.prompt ?? body.content ?? "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required." }, { status: 400 });
    }

    assertAnalysisGate(body.sessionId, userId);
    const extraction = getOwnedExtraction(body.sessionId, userId);
    const analysis = getOwnedAnalysisResult(body.sessionId, userId);

    if (!analysis) {
      return NextResponse.json({ error: "Run structured analysis before follow-up Q&A." }, { status: 409 });
    }

    const context = normalizeContext(body.context);
    const parentMessageId = body.parentMessageId ?? getContextParentMessageId(context);
    const existingMessages = getOwnedMessages(body.sessionId, userId);
    const parentChain = collectParentChain(existingMessages, parentMessageId);
    const materials = collectProviderSafeMaterialContexts(body.sessionId, userId);
    const userMessage = createFollowUpUserMessage(
      {
        sessionId: body.sessionId,
        parentMessageId,
        content: prompt,
        context,
      },
      userId,
    );
    const followUp = await runAiSolverFollowUp({
      analysisInput: {
        problemText: extraction.problemText,
        diagramNotes: extraction.diagramNotes,
        standardAnswer: extraction.standardAnswer,
        materials,
      },
      analysisResult: analysis,
      context,
      prompt,
      messageHistory: parentChain,
    });
    const assistantMessage = createFollowUpAssistantMessage(
      {
        sessionId: body.sessionId,
        parentMessageId: userMessage.id,
        content: followUp.answer,
        context: { type: "follow_up", parentMessageId: userMessage.id },
      },
      userId,
    );

    return NextResponse.json({
      messages: {
        user: toClientMessage(userMessage),
        assistant: toClientMessage(assistantMessage),
      },
      provider: followUp.provider,
      retrieval_status: analysis.retrieval_status,
    });
  } catch (error) {
    const providerError = toSafeProviderError(error);

    if (providerError.code !== "analysis_failed") {
      return NextResponse.json(providerError, { status: providerError.status ?? 502 });
    }

    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}

function normalizeContext(context: AiSolverMessageContext | undefined): AiSolverMessageContext {
  if (!context) {
    return { type: "whole_analysis" };
  }

  if (context.type === "whole_analysis") {
    return context;
  }

  if (context.type === "section" && isSectionKey(context.sectionKey)) {
    return context;
  }

  if (context.type === "selected_text" && context.selection.text.trim()) {
    if (context.selection.sectionKey && !isSectionKey(context.selection.sectionKey)) {
      throw new Error("Selected text sectionKey is not a valid AI Solver section.");
    }

    return context;
  }

  if (context.type === "follow_up" && context.parentMessageId) {
    return context;
  }

  throw new Error("Follow-up context is invalid.");
}

function getContextParentMessageId(context: AiSolverMessageContext) {
  return context.type === "follow_up" ? context.parentMessageId : null;
}

function collectParentChain(messages: AiSolverMessage[], parentMessageId: string | null | undefined) {
  if (!parentMessageId) {
    return [];
  }

  const byId = new Map(messages.map((message) => [message.id, message]));
  const chain: AiSolverMessage[] = [];
  let currentId: string | null | undefined = parentMessageId;

  while (currentId) {
    const message = byId.get(currentId);
    if (!message) {
      break;
    }

    chain.unshift(message);
    currentId = message.parentMessageId;
  }

  return chain;
}

function isSectionKey(value: unknown): value is keyof AiSolverAnalysisResult["sections"] {
  return typeof value === "string" && AI_SOLVER_SECTION_KEYS.includes(value as keyof AiSolverAnalysisResult["sections"]);
}

function toClientMessage(message: AiSolverMessage) {
  return {
    id: message.id,
    sessionId: message.sessionId,
    parentMessageId: message.parentMessageId,
    kind: message.kind,
    content: message.content,
    context: message.context,
    createdAt: message.createdAt,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "AI Solver follow-up request is not allowed.";
}
