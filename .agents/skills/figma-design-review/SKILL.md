---
name: figma-design-review
description: Review CPHO frontend work against Figma frames, design screenshots, or reference images. Use when checking visual acceptance, layout fidelity, dark-mode style, responsive behavior, and UI consistency before frontend merge.
---

# Figma Design Review

## name

figma-design-review

## description

Review CPHO AI Training System frontend changes against the approved Figma frame, design screenshot, or `design/` reference. This skill is for visual acceptance review, not product implementation.

## when to use

- A frontend issue provides a Figma frame, screenshot, or `design/` reference.
- A PR changes AI Solver, Problem Bank, Article Plaza, Personal Library, Editor, or admin UI.
- The user asks whether the implementation matches the design.
- A screenshot or preview URL needs visual review before merge.
- Layout, spacing, typography, dark theme, responsive behavior, or interaction states may have regressed.

## required checks

- Read `docs/frontend-style-guide.md` before judging visual fit.
- Identify the exact Figma frame, screenshot, or `design/` reference used as the visual source of truth.
- Compare first viewport structure: sidebar, top nav, main content, right panel, hierarchy, density, and primary actions.
- Check CPHO style constraints: dark mode first, Apple/Linear/ChatGPT-like, black/white/gray, text-first, compact, professional.
- Confirm the UI avoids large colorful dashboard cards, game-like visuals, decorative gradients, and heavy illustrative treatment.
- Verify data-heavy views use tables or dense lists where appropriate.
- Verify AI output is organized into collapsible sections when relevant.
- Check loading, empty, error, disabled, selected, permission-denied, and unauthenticated states when visible in the changed surface.
- Check text clipping, overflow, overlap, truncation, and button label fit at desktop and narrow viewport sizes when screenshots are available.
- Confirm any similar-problem or related-article UI clearly shows `not connected` when real database retrieval is not wired.
- Confirm screenshots, preview URL, or explicit manual inspection notes are available for frontend PR evidence.

## forbidden actions

- Do not implement product code as part of a design review unless the user explicitly asks for fixes.
- Do not approve frontend work without a Figma frame, screenshot, preview URL, or clear statement that visual evidence is missing.
- Do not accept frontend-hidden restrictions as security or permission enforcement.
- Do not invent missing product behavior, problem data, related articles, or similar problems.
- Do not relax the core rule: No standard answer, no AI solution.
- Do not introduce new UI libraries, assets, or design systems during review.
- Do not judge only from code when the requested review is visual and a runnable preview or screenshot is available.

## required output format

Return:

- visual source reviewed
- implementation evidence reviewed
- match summary
- blocking visual issues
- non-blocking visual issues
- missing states or evidence
- responsive/layout notes
- permission/security UI concerns
- required fixes
- merge recommendation
