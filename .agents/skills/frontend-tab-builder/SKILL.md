---
name: frontend-tab-builder
description: Build or revise a frontend page/tab for the CPHO AI platform using the dark Apple/Linear/ChatGPT-like UI standard. Use for AI Solver, Problem Bank, Article Plaza, Library, Editor, and Admin pages.
---

# Frontend Tab Builder

Use this skill when creating or revising a frontend page, tab, or major UI state.

## Before Coding

Read:

1. `docs/product-spec.md`
2. `docs/frontend-style-guide.md`
3. the referenced Figma frame or screenshot

Restate:

- target user
- page goal
- primary actions
- loading/empty/error/permission states
- acceptance criteria

## Design Rules

- Mostly black, white, gray。
- Text-first hierarchy。
- Minimal icons。
- No large colorful dashboard cards。
- Professional academic tool feeling。
- Use tables for data-heavy views。
- Use collapsible sections for structured AI output。
- Use right-side panels for detail/settings/actions when useful。
- Desktop-first, responsive enough for tablet/narrow browser。

## Implementation Rules

- Use Tailwind CSS and existing project primitives。
- Keep components small and module-scoped。
- Add loading, empty, error, permission denied, selected, and disabled states。
- Avoid unnecessary animation。
- Do not introduce new UI libraries without explaining why。
- Never rely on hidden UI for security。

## Before Finishing

Run or report why unavailable:

- lint
- build
- relevant tests

Return:

- changed files
- preview steps or URL
- implementation screenshot path if possible
- visual differences from reference
- risks
