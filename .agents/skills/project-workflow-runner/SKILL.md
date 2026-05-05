---
name: project-workflow-runner
description: Run the CPHO project engineering workflow from task breakdown to issue scope, branch planning, implementation/review routing, verification, PR evidence, and merge readiness. Use when planning work, creating GitHub issues, choosing project skills, preparing PRs, or deciding whether dev/main merge criteria are met.
---

# Project Workflow Runner

## Overview

Use this skill to keep CPHO platform work aligned with the repo contract. It turns a user request into an issue-ready task, chooses the right implementation/review skill, enforces product/security/UI gates, and prepares the PR or merge handoff.

## Start Every Task

1. Run `git status --short --branch`.
2. Confirm the work is not happening directly on `main`.
3. Read `AGENTS.md`, then read only the docs relevant to the task.
4. Classify the task:
   - UI/page/tab: use `frontend-tab-builder`.
   - AI Solver flow/provider/retrieval: use `ai-solver-flow-builder`.
   - API/auth/database/storage/RLS/provider secrets: use `backend-permission-review`.
   - Browser behavior verification: use `playwright-ui-verifier`.
   - PR or merge readiness: use `pr-risk-auditor`.
5. State scope, out of scope, target user, affected modules, and acceptance criteria before coding.

## Product Gates

Always preserve these rules:

- CPHO AI Training System is a physics olympiad AI learning platform, not a generic chatbot.
- v1 has no public registration.
- Only roles are `student` and `admin`.
- Core modules are AI Solver, Problem Bank, Article Plaza, and Personal Library.
- Admin capability is embedded inside relevant modules; v1 does not need a large admin dashboard.
- No standard answer, no AI solution.
- Students cannot create, edit, or delete public Problem Bank content.
- AI Solver sessions belong to AI Solver and do not directly enter Personal Library.
- Personal document and public article are the same document object.
- Similar problems and related articles must come from real retrieval; if retrieval is not connected, the UI must say so.

## Required Docs

Read by task type:

- Product scope: `docs/product-spec.md`.
- AI Solver/provider/retrieval: `docs/ai-solver-spec.md`.
- Roles and permissions: `docs/permission-matrix.md`.
- Backend/security/RLS/storage/AI keys: `docs/backend-risk-checklist.md`.
- UI/Figma/screenshot workflow: `docs/frontend-style-guide.md`.
- Agent workflow rationale: `docs/agent-workflow-architecture.md`.

## Task Breakdown

Break work into issues that each have one primary outcome and one primary implementation agent.

Each issue must include:

- Goal: the user-visible or system-visible outcome.
- Module: AI Solver, Problem Bank, Article Plaza, Personal Library, Editor, auth, data, or app shell.
- Target user: `student`, `admin`, or both.
- Scope and out of scope.
- Affected routes, tables, storage buckets, components, or pages when known.
- Acceptance criteria.
- Verification plan.
- Risks.

Prefer thin vertical slices over broad platform rewrites. Do not create database migrations unless the task is explicitly in implementation phase.

## Issue Template Selection

Use the closest template:

- `.github/ISSUE_TEMPLATE/frontend-tab.md` for pages, tabs, visual states, Figma/screenshot-driven UI.
- `.github/ISSUE_TEMPLATE/backend-change.md` for API, auth, database, storage, RLS, permission, or secret-sensitive work.
- `.github/ISSUE_TEMPLATE/ai-solver-feature.md` for upload, extraction, confirmation, standard-answer gate, provider analysis, structured output, retrieval, or session history.

If a task spans multiple templates, split it unless the coupling is necessary for one verifiable slice.

## Branch Workflow

Use this branch model:

1. `main` is stable only.
2. `dev` is the integration branch.
3. Feature branches merge into `dev`.
4. Verified `dev` merges into `main`.
5. Never commit directly to `main`.
6. Use one primary implementation agent per feature branch.
7. Parallel coding requires separate branches or worktrees.
8. Review agents inspect/comment by default and do not push unless the user explicitly asks.

Branch names should be scoped and descriptive, for example:

- `feature/project-foundation-app-shell`
- `feature/auth-supabase-roles`
- `feature/ai-solver-data-and-upload`
- `feature/openrouter-gemini-analysis`
- `feature/problem-bank-admin-mvp`

## Implementation Loop

For implementation tasks:

1. Restate the issue in executable terms.
2. Inspect existing files before editing.
3. Make the smallest coherent change.
4. Preserve existing patterns and project rules.
5. Add focused tests or explain why tests are not available.
6. For UI, verify against Figma or `design/` screenshots and include loading, empty, error, permission denied, selected item, and disabled unauthorized action states.
7. For backend, enforce auth, role, owner scope, RLS impact, upload limits, and secret handling server-side.
8. For AI Solver, enforce confirmed standard answer before analysis and prevent hallucinated related problems/articles.
9. Run relevant verification.
10. Run `git status --short --branch` before finishing.

## Verification Gates

Run or report why unavailable:

- lint
- build
- relevant tests
- manual verification
- browser screenshot or preview URL for UI changes
- backend permission/RLS/secret review for backend or data changes

Do not treat hidden frontend controls as security. Server-side checks and RLS must carry the boundary.

## PR Preparation

Every PR must fill `.github/PULL_REQUEST_TEMPLATE.md` with:

- Goal.
- Changed files.
- Build/lint/test result or clear reason not run.
- Manual verification steps.
- Frontend reference design and implementation screenshot/preview URL when UI changed.
- Backend permission evidence when API/auth/database/storage/RLS/AI provider changed.
- AI evidence when AI Solver/provider behavior changed.
- Risks.
- Merge checklist.

Before PR handoff, use `pr-risk-auditor` and do not recommend merge if:

- build failed;
- tests were skipped without explanation;
- backend permissions changed without review;
- AI keys may be exposed;
- student/admin or owner boundaries are unclear;
- private data lacks `user_id` or `owner_id` scoping;
- frontend changed without design reference and implementation evidence.

## Merge Flow

Use this sequence:

1. Issue accepted and scoped.
2. Feature branch created from `dev`.
3. Implementation completed and verified locally.
4. PR opened from feature branch to `dev`.
5. PR evidence completed.
6. Review and risk audit completed.
7. Merge feature branch into `dev`.
8. Verify `dev`.
9. Merge `dev` into `main` only after integration verification.

## Output Format

When using this skill for planning or handoff, return:

- Task decomposition.
- Recommended issue template(s).
- Branch name.
- Required project skills.
- Acceptance criteria.
- Verification plan.
- PR evidence checklist.
- Merge blockers and risks.
