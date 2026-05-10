# Agentic Harness: Multi-Agent Orchestration Guide

This document defines the architecture and operational procedures for running large-scale, parallel engineering tasks using a **Coordinator-Worker** model within the CPHO AI platform repository.

## 1. Core Philosophy

- **Isolation over Integration**: Every sub-task happens in its own physical directory (`git worktree`).
- **State-of-Truth**: The `IMPLEMENTATION_LOG.md` acts as the global blackboard for all agents.
- **Contract-First**: Sub-tasks are defined by GitHub Issue templates before a single line of code is written.

---

## 2. Architecture Overview

### The Coordinator Agent (The Manager)
- **Responsibility**: Task decomposition, branch planning, and final merge audit.
- **Tools**: `project-workflow-runner`, `pr-risk-auditor`.
- **Location**: Operates in the **Root Repository** (the `dev` branch).

### The Worker Agents (The Coders)
- **Responsibility**: Implementing a single atomic feature or fix.
- **Tools**: `frontend-tab-builder`, `backend-permission-review`, `ai-solver-flow-builder`.
- **Location**: Operates in a **Worktree Sandbox** (e.g., `.worktrees/task-123/`).

---

## 3. Operational Workflow (The "Harness" Loop)

### Step 1: Epic Decomposition (Coordinator)
When you give a large command (e.g., "Build the AI Solver pipeline"), the Coordinator must:
1. Read `AGENTS.md` and relevant `docs/*.md`.
2. Break the request into 3-5 atomic issues.
3. Update `IMPLEMENTATION_LOG.md` with the task list.

### Step 2: Environment Provisioning (Coordinator)
For each sub-task, the Coordinator runs:
```bash
# Example for task: solver-database-schema
git worktree add .worktrees/solver-schema -b feat/solver-schema
```

### Step 3: Delegated Implementation (Workers)
Assign a sub-agent (Codex/Gemini) to the worktree path:
1. **CD** into `.worktrees/solver-schema`.
2. Run `npm install` (if dependencies changed).
3. Execute the implementation using the assigned **Skill**.
4. **Self-Verify**: Run lint/tests within that folder.
5. **Commit**: `git add . && git commit -m "feat: implement solver schema"`

### Step 4: Reconciliation (Coordinator)
The Coordinator reviews the work in the worktree:
1. Run `pr-risk-auditor` on the branch.
2. If passed, merge the branch into `dev`.
3. Cleanup:
```bash
git worktree remove .worktrees/solver-schema
git branch -d feat/solver-schema
```

---

## 4. The Global Blackboard (`IMPLEMENTATION_LOG.md`)

Maintain a log in the root to prevent agents from overlapping. Format:

| Task ID | Branch | Status | Agent | Link |
| :--- | :--- | :--- | :--- | :--- |
| #001 | `feat/auth-rls` | ✅ Merged | Gemini | [PR #12] |
| #002 | `feat/upload-api`| 🚧 In Progress | Codex | - |

---

## 5. Summary for the User
To use this "Harness", simply tell your Main Agent:
> "I want you to act as the **Coordinator**. Decompose [Large Task] into sub-tasks, set up worktrees for each, and guide sub-agents through the implementation as defined in `docs/design/implementation/agentic-harness.md`."

---
