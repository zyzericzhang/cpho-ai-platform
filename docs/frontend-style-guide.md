# Frontend Style Guide

Frontend work must be image/Figma-reference driven. Current visual references are the 5 screenshots in `design/`.

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

- AI Solver：`design/ChatGPT Image Apr 27, 2026, 02_57_54 PM (1).png`
- Problem Bank：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (2).png`
- Article Plaza：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (3).png`
- Personal Library：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (4).png`
- Editor：`design/ChatGPT Image Apr 27, 2026, 02_57_56 PM (5).png`

Future stable references should be copied or exported to `docs/design/screenshots/`.

## Figma-first Workflow

Every frontend issue must reference one of：

- Figma frame link
- screenshot under `docs/design/screenshots/`
- screenshot under `design/`

Every frontend PR must include：

- reference design
- implementation screenshot or preview URL
- visual differences
- changed files
- build/lint result

Codex can operate Figma when explicitly asked：create frames、import screenshots、generate alternatives、compare implementation screenshots if tool support exists。

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
