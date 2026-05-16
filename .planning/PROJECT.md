# AI Solver Agentic UI Refactor

## What This Is

A redesign of the AI Solver UI flow to transition from a monolithic "upload + result" page into a professional, multi-step "AI Learning Workspace". It breaks the experience into a Dashboard, a dedicated Upload flow, and a focused Session Workspace with side-by-step PDF preview and contextual AI chat.

## Core Value

Provide a clear, distraction-free, and logically structured workflow that clearly separates "starting a problem" from "deep-diving into an AI physics explanation."

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Top Navigation with core modules (AI Solver, Problem Bank, Article Plaza, Personal Library)
- ✓ AI Physics Parsing logic outputting 7 distinct sections (Step-by-step, Physics Picture, Models, Articles, Critical Processing, Writing, Library)
- ✓ Global App Shell structure (Top Nav + Left Nav)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Rebuild App Shell to support Page-specific Workspaces (e.g., hiding right sidebar on session pages)
- [ ] Create `/solver` Homepage: Display recent sessions, start new session, and show upload rules.
- [ ] Create `/solver/new` Upload Page: Step-by-step UI for uploading Problem and Standard Answer PDFs, then creating a session.
- [ ] Create `/solver/sessions/:id` Workspace: Dedicated view for an active/historical session.
- [ ] Implement Left Material Panel in Workspace: Tabbed PDF preview (Problem vs Answer), collapsible, with optional split-screen.
- [ ] Implement Right AI Parsing Panel: 7 collapsible accordions (Overview & Step-by-step expanded by default).
- [ ] Implement Section-level Follow-ups: A "追问本节" (Ask about this section) button on each parsing block that focuses the chat context.
- [ ] Implement Contextual Chat Thread: A chat UI pinned below the parsing blocks for follow-up questions.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Full paragraph-level follow-up buttons] — First iteration will focus on section-level context only to manage complexity.
- [Complex dashboard analytics] — The homepage should just be a simple launcher for now to maintain focus on the core solving experience.

## Context

- The platform is an academic tool for physics competitions.
- The current UI suffers from "information overload" because the upload form and the 7-block AI results share the same screen real estate before a user even begins.
- Users need to constantly refer to the original Problem and Standard Answer while reading the AI's step-by-step breakdown.
- The target aesthetic is dark mode, Apple/Linear/ChatGPT-like, text-first, and professional.

## Constraints

- **Tech Stack**: Next.js, React, TypeScript, Tailwind CSS. Shadcn/UI primitives allowed.
- **Data Integrity**: AI must strictly base explanations on the uploaded standard answer without hallucinating.
- **Language**: All user-facing UI and planning artifacts must be in Simplified Chinese.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate App Shell into Global vs Workspace | Some pages (like Session) need maximum horizontal space and cannot afford a global right sidebar. | — Pending |
| Accordion defaults | Only "Overview" and "Step-by-step" default expanded to prevent massive vertical scrolling on initial load. | — Pending |

---
*Last updated: 2026-05-16 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
