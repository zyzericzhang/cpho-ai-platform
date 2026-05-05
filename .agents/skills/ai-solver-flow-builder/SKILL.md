---
name: ai-solver-flow-builder
description: Build or review the AI Solver workflow for the CPHO platform, including upload, standard-answer validation, text extraction, structured solution generation, session saving, and retrieval boundaries.
---

# AI Solver Flow Builder

Use this skill when implementing AI Solver upload, extraction, confirmation, provider calls, structured result sections, or session behavior.

## Required Reading

1. `docs/product-spec.md`
2. `docs/ai-solver-spec.md`
3. `docs/backend-risk-checklist.md`

## Hard Product Rules

- No standard answer, no AI solution。
- AI output must use fixed collapsible sections。
- AI solution history belongs inside AI Solver。
- Related problems and related articles must come from real database retrieval, not model hallucination。
- Uploaded files must be bound to the current user or selected public problem。
- AI API calls must run server-side only。
- OpenRouter/Gemini provider details must not appear in UI code。

## Required Sections

- Step-by-step derivation
- Physical reasoning reconstruction
- Related models / similar problems
- Related articles
- Key handling
- Write article
- Add to personal library

## Before Finishing

Confirm:

- no-standard-answer gate exists server-side
- session ownership is scoped by `user_id`
- uploaded materials are private and owner-scoped
- `OPENROUTER_API_KEY` is not client-side
- retrieval is either real or explicitly marked `not_connected`

Return:

- changed files
- tests/build/lint result
- preview steps
- risks
