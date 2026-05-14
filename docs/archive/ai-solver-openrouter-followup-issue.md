# [AI Solver] OpenRouter Gemini multimodal orchestration and threaded follow-up Q&A

## Purpose

This issue is a handoff context for the next `ai-solver-flow-builder` implementation pass. It captures the full planning discussion for AI Solver provider orchestration, multimodal input, long-answer generation, and follow-up Q&A.

Do not treat AI Solver as a generic chatbot. Every answer must stay bound to one physics olympiad problem, its confirmed standard answer, uploaded materials, and the structured AI Solver session.

## Target Branch

- `feature/openrouter-gemini-multimodal`

## Background

The current AI Solver direction is:

- OpenRouter is the provider gateway.
- The approved model id is `google/gemini-3.1-pro-preview`.
- The model id must come from `OPENROUTER_MODEL`; do not hardcode provider details in UI.
- `OPENROUTER_API_KEY` is server-side only.
- The app must support multimodal image input for AI analysis and follow-up Q&A.
- Gemini output can be short, so the analysis flow should not depend on one large completion.
- The user explicitly wants threaded Q&A, section text selection Q&A, and model-driven task decomposition before final answer assembly.

Important availability note: as of the planning discussion on 2026-05-09, OpenRouter search results still showed `google/gemini-3-pro-preview`, but also indicated "Going away March 26, 2026." The 2026-05-09 OpenRouter models endpoint did not list `google/gemini-3-pro-preview` and did list `google/gemini-3.1-pro-preview`; the product owner explicitly approved switching to `google/gemini-3.1-pro-preview`.

## Product Rules

- No standard answer, no AI solution.
- AI API calls must run server-side only.
- AI Solver sessions belong to AI Solver and do not directly enter Personal Library.
- Follow-up Q&A must remain inside the AI Solver session.
- Related problems and related articles must come from real retrieval.
- If retrieval is not connected, return empty records and show `not_connected`; the model must not invent problem ids, article titles, authors, or source papers.
- Uploaded materials must be scoped to the current user/session.
- Students cannot create, edit, or delete public Problem Bank content.

## Flow Step

- [x] upload
- [x] extraction placeholder
- [x] user confirmation
- [x] standard-answer gate
- [ ] provider analysis orchestration
- [ ] multimodal provider input
- [ ] structured result assembly
- [ ] threaded follow-up Q&A
- [ ] selected-text Q&A
- [ ] session history persistence
- [ ] retrieval boundary enforcement

## Scope

### 1. Model-driven decomposition before structured analysis

Implement server-side orchestration that avoids relying on a single long Gemini completion.

Required flow:

1. Validate the AI Solver session owner.
2. Validate confirmed non-empty standard answer server-side.
3. Build a context package from:
   - `problem_text`
   - `diagram_notes`
   - `standard_answer`
   - uploaded image context or image references
   - retrieval status
4. Call the model once to create a task decomposition plan.
5. Allow the model to split the analysis into more subtasks than the fixed 7 sections when useful.
6. Execute section/subtask calls separately.
7. Merge subtask outputs into the required 7 fixed sections.
8. Normalize final output into `AiSolverAnalysisResult`.

The decomposition plan should be treated as a provider implementation detail. UI receives only progress state and the final structured result unless explicit debugging mode is added later.

### 2. Required final AI Solver sections

Final output must preserve these fixed sections:

1. `step_by_step_derivation`
2. `physical_reasoning_reconstruction`
3. `related_models_similar_problems`
4. `related_articles`
5. `key_handling`
6. `write_article`
7. `add_to_personal_library`

The model may decompose internally into more subtasks, but the final assembled result must fit this schema.

### 3. Multimodal input

Support image context in both initial analysis and follow-up Q&A.

Implementation notes:

- Image uploads should be included as OpenAI-compatible multimodal content parts when available.
- Do not send raw PDF/DOCX files directly to the final analysis provider in v1.
- If using image data URLs, enforce size limits and avoid logging them.
- Prefer stable user/session-scoped references internally if the implementation moves from local store to Supabase Storage.
- Any image context must be owner-scoped and bound to the current AI Solver session.

### 4. Threaded follow-up Q&A

Add follow-up questions after analysis. This must be threaded, not only a flat single chat.

Requirements:

- Users can ask follow-up questions from the analysis result.
- Follow-up Q&A must preserve the full problem context:
  - session id
  - `problem_text`
  - `diagram_notes`
  - confirmed `standard_answer`
  - uploaded image context or image references
  - current structured analysis
  - selected section context when applicable
  - parent follow-up message chain
- A follow-up can reply to:
  - the whole analysis
  - one fixed section
  - a selected text span inside one section
  - a prior follow-up answer
- Store enough parent/child linkage to render a threaded tree.
- Follow-up answers must not overwrite the original 7-section analysis.
- Follow-up Q&A remains inside AI Solver and does not automatically create Personal Library documents.

Suggested data shape for threaded messages:

```ts
type AiSolverMessage = {
  id: string;
  sessionId: string;
  userId: string;
  parentMessageId: string | null;
  role: "user" | "assistant";
  kind: "follow_up" | "selection_question";
  sectionKey?: keyof AiSolverAnalysisSections;
  selectedText?: string;
  question?: string;
  answer?: string;
  createdAt: string;
};
```

Exact persistence design can differ, but it must support a threaded parent-child relationship.

### 5. Selected-text Q&A inside the 7 sections

The user must be able to select text inside any of the 7 analysis sections and ask a targeted question about that selected text.

Requirements:

- Section content remains selectable.
- When a text span is selected, expose an action such as `Ask about selection`.
- The follow-up payload must include:
  - `sessionId`
  - `sectionKey`
  - `selectedText`
  - optional user question
  - parent message id when replying inside an existing thread
- The model answer must use both the selected text and the full problem context.
- If no text is selected, users can still ask a normal follow-up about the whole problem.

UI placement should be consistent with the project style: dark mode first, compact, professional, text-first. Prefer a right-side panel or inline thread affordance over a generic chatbot layout.

## Out of Scope

- Public registration.
- Generic chatbot behavior unrelated to the active physics problem.
- Real OCR/PDF/DOCX extraction unless explicitly added in a separate issue.
- Real Problem Bank or Article Plaza retrieval unless explicitly added in a separate issue.
- Automatic Personal Library document creation from follow-up answers.
- Student creation or mutation of public Problem Bank content.
- Switching to a different Gemini model without product owner approval.

## Acceptance Criteria

- [ ] Analysis cannot run without a confirmed non-empty standard answer.
- [ ] The analyze route verifies session ownership server-side.
- [ ] OpenRouter calls are server-side only.
- [ ] `OPENROUTER_API_KEY` is never exposed to client code, logs, screenshots, or error responses.
- [ ] `OPENROUTER_MODEL` controls the model id.
- [ ] The approved model id is `google/gemini-3.1-pro-preview`, controlled by `OPENROUTER_MODEL`.
- [ ] Initial analysis uses a model-generated decomposition plan before section/subtask calls.
- [ ] The model may create more subtasks than 7 sections.
- [ ] Server-side assembly returns the exact fixed 7-section schema.
- [ ] Multimodal image context is included for initial analysis when image uploads exist.
- [ ] Multimodal image context is available to follow-up Q&A.
- [ ] Follow-up Q&A supports threaded parent/child messages.
- [ ] Follow-up questions preserve full problem, standard answer, image, and analysis context.
- [ ] Selected text inside analysis sections can be used as targeted Q&A context.
- [ ] Selected-text Q&A also preserves the full problem context.
- [ ] Follow-up answers do not overwrite the original structured analysis.
- [ ] Similar problems are not hallucinated.
- [ ] Related articles are not hallucinated.
- [ ] Retrieval status remains `not_connected` unless real retrieval is implemented.
- [ ] Provider raw errors are normalized before reaching the client.
- [ ] The UI does not expose provider internals.

## Manual Verification

1. Create an AI Solver session.
2. Upload at least one supported image.
3. Confirm or edit:
   - problem text
   - diagram notes
   - standard answer
4. Attempt analysis before confirming standard answer and verify it is rejected.
5. Confirm standard answer and run analysis.
6. Verify the server performs decomposition and multiple provider calls.
7. Verify the final response renders as 7 fixed collapsible sections.
8. Verify related problems/articles are empty with `not_connected` if retrieval is not connected.
9. Ask a follow-up question about the whole analysis.
10. Ask a follow-up question replying to the previous assistant answer.
11. Select text inside a section and ask about the selected span.
12. Verify selected-text answer references the selected span and the full problem context.
13. Verify threaded Q&A renders parent-child relationships.
14. Verify image context is included for follow-up when image uploads exist.
15. Inspect client bundle or code paths to confirm no OpenRouter key exposure.

## Verification Commands

Run or document why unavailable:

```bash
npm run lint
npm run build
```

If tests exist or are added for AI Solver provider orchestration, run the relevant test command and include results in PR evidence.

## Backend and Security Review Notes

Use `backend-permission-review` before PR handoff.

Required checks:

- Can one user read another user's AI Solver sessions?
- Can one user read another user's uploaded files?
- Can one user read another user's follow-up messages?
- Can one user reply inside another user's thread?
- Can AI analysis or follow-up run without confirmed standard answer?
- Is any API key exposed through `NEXT_PUBLIC_`, client code, logs, screenshots, or error responses?
- Are image data URLs or storage URLs accidentally logged?
- Are provider errors normalized?
- Is there a rate-limit or usage-limit plan for multi-call analysis and follow-up?

## UI Notes

Use `frontend-tab-builder` for UI implementation.

Expected UI behavior:

- Add an `Ask follow-up` control near the AI Solver result area.
- Preserve the fixed 7 collapsible sections.
- Make section text selectable.
- Show an `Ask about selection` action after selecting text.
- Render threaded follow-up Q&A inside the AI Solver context, likely in a right panel or section-attached thread area.
- Do not make the interface look like a general-purpose chat app.
- Keep dark mode first, compact, Apple/Linear/ChatGPT-like, black/white/gray, text-first.

## AI Cost and Latency Risks

This feature intentionally adds multiple model calls:

- one decomposition call;
- multiple section/subtask calls;
- optional merge/normalization call;
- follow-up calls;
- selected-text Q&A calls.

Mitigations to consider:

- cap maximum subtasks;
- cap selected text length;
- cap follow-up question length;
- cap thread context depth or summarize older thread branches;
- show progress per section/subtask;
- handle partial failures by returning warnings and preserving completed sections;
- avoid resending large images unnecessarily when a stable storage reference or summarized visual context is enough.

## PR Evidence Checklist

The PR must include:

- changed files;
- build/lint/test result or clear reason not run;
- manual verification steps;
- browser screenshot/recording or local preview notes for UI changes;
- backend permission/RLS/secret review;
- AI evidence:
  - model id source is `OPENROUTER_MODEL`;
  - OpenRouter key is server-only;
  - decomposition plan is used;
  - multiple subtask calls are assembled into 7 sections;
  - image context is sent for multimodal analysis/follow-up;
  - retrieval is not fabricated;
  - threaded follow-up preserves session context.

## Open Questions For Implementation

These were not fully specified and should be resolved before or during implementation:

1. Should follow-up Q&A be persisted immediately in Supabase `ai_messages`, or can the first pass use the existing local session store?
2. Should selected-text answers appear in a global right panel, inline under the selected section, or both?
3. What is the maximum allowed number of decomposition subtasks per analysis?
4. What is the maximum depth for threaded Q&A before older context should be summarized?
5. Should every follow-up resend image content, or only when the question or selected section needs diagram context?
6. Should failed subtasks be retryable individually from the UI?
7. Should analysis progress be streamed, polled, or returned only after all subtasks complete?
