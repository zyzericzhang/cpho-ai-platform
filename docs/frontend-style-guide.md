# Frontend Style Guide

Frontend work must be Figma-first, Build-web-app-assisted, and Vercel-preview-backed. The canonical design file is:

```text
https://www.figma.com/design/CjqygT7bVO6wEZOKjLOyyJ/cpho-ai-platform?node-id=0-1&t=x0oQGJwauCyLvW9W-1
```

The current Figma canvas is `Round 1 - CPHO Core Screens`. The 5 screenshots in `design/` are local fallback references when Figma is unavailable or when a PR needs static evidence. Vercel preview URLs are the preferred shareable implementation reference once the app exists.

## Visual Standard

- dark mode first
- Apple / Linear / ChatGPT-like
- mostly black, white, gray
- professional academic tool feeling
- text-first hierarchy
- minimal icons
- compact controls
- no large colorful dashboard cards
- no playful gamification

## Layout Pattern

Desktop-first application layout：

```text
top module navigation
left sidebar
main content area
right detail/settings/action panel when useful
```

Module expectations：

- AI Solver：workflow page, upload -> confirm -> structured analysis, collapsible result sections。
- Problem Bank：searchable database, filters, table, preview, right selected-problem panel。
- Article Plaza：article list + reading pane + right article info/actions。
- Personal Library：file/document system, tabs, table, folders/problem sets/documents。
- Editor：serious rich text writing tool, toolbar, problem reference blocks, right settings/actions。

## Reference Screenshots

Canonical Figma file：

- File：`cpho-ai-platform`
- Key：`CjqygT7bVO6wEZOKjLOyyJ`
- Canvas：`Round 1 - CPHO Core Screens`
- Root node：`0:1`
- URL：`https://www.figma.com/design/CjqygT7bVO6wEZOKjLOyyJ/cpho-ai-platform?node-id=0-1&t=x0oQGJwauCyLvW9W-1`

Known Figma frames：

- App Shell / Navigation：`3:2`
- AI Solver / Upload Confirm Analysis：`3:42`
- Problem Bank / Table Detail：`3:123`
- Article Plaza / Reader Detail：present in the same canvas
- Personal Library / Table Detail：`3:322`
- Editor / Rich Text Publish：`3:427`

Local fallback screenshots：

- AI Solver：`design/ChatGPT Image Apr 27, 2026, 02_57_54 PM (1).png`
- Problem Bank：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (2).png`
- Article Plaza：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (3).png`
- Personal Library：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (4).png`
- Editor：`design/ChatGPT Image Apr 27, 2026, 02_57_56 PM (5).png`

Future stable references should be copied or exported to `docs/design/screenshots/`.

## Figma + Build Web App + Vercel Workflow

Every frontend issue should reference the canonical Figma file and the target frame node. If Figma is unavailable, it must reference one local screenshot under `design/` or `docs/design/screenshots/`.

Before implementation：

- Use the Figma plugin/skill to read the target frame structure.
- Translate Figma into project components rather than copying generated code blindly.
- Preserve CPHO product rules even when a visual frame is incomplete.

During implementation：

- Use Build web app/Codex to iterate the actual Next.js UI in the repo.
- Keep generated UI changes inside the project stack：Next.js, React, TypeScript, Tailwind CSS, and local component primitives.
- Do not let Build web app introduce public registration, generic chatbot behavior, fake retrieval data, or client-side AI secrets.

After implementation：

- Include the reference Figma frame or fallback screenshot.
- Include an implementation screenshot and, when available, a Vercel preview URL.
- visual differences
- changed files
- build/lint result

Codex should use Figma plugin/skill when explicitly asked to inspect, create, edit, or compare Figma frames. Frontend PRs should use `figma-design-review` when visual fidelity is part of acceptance. Vercel preview is evidence for review, not a replacement for local lint/build or product/security checks.

## Component Rules

- Use tables for data-heavy views。
- Use collapsible sections for structured AI output。
- Use right-side panels for metadata, settings, and actions when useful。
- Use small, composable components。
- Prefer Tailwind CSS and established project primitives。
- Avoid unnecessary animation。
- Do not introduce new UI libraries without explaining why。

## Required States

Each implemented page must handle：

- loading
- empty
- error
- permission denied
- selected item
- disabled unauthorized action

Disabled UI is only a visual aid; server permissions still decide.
