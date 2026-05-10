---
name: agentic-harness-orchestrator
description: Specialized skill for the Coordinator agent to manage task decomposition, git worktree provisioning, and worker delegation.
---

# Agentic Harness Orchestrator

## Overview
This skill implements the "Manager-Worker Swarm" pattern. It is used when a task is too large for a single agent turn or requires parallel execution across different modules.

## Orchestration Flow

### 1. Analysis & Decomposition
- Analyze the user request against `AGENTS.md`.
- Identify modules: `app-shell`, `ai-solver`, `problem-bank`, `library`.
- Create a Directed Acyclic Graph (DAG) of dependencies.
- Output a task list to `IMPLEMENTATION_LOG.md`.

### 2. Worktree Provisioning
For each independent task:
1. Generate a branch name: `feat/[task-slug]`.
2. Execute: `git worktree add .worktrees/[task-slug] -b feat/[task-slug]`.
3. Verify the environment (run `npm install` if necessary).

### 3. Worker Delegation
- Provide the worker agent with:
  - The path to its worktree.
  - The specific **Task Issue** (Goal, Scope, Acceptance Criteria).
  - The required **Skill** (e.g., `frontend-tab-builder`).
- Wait for worker completion or signal failure.

### 4. Integration & Cleanup
1. Run `pr-risk-auditor` on the worker's branch.
2. If successful:
   - Merge branch into `dev`.
   - Update `IMPLEMENTATION_LOG.md`.
   - Remove worktree: `git worktree remove .worktrees/[task-slug]`.
3. If failed:
   - Provide feedback to the worker for a retry.

## Critical Constraints
- **Concurrency**: Do not spawn workers that modify the same file (e.g., `package.json`) simultaneously unless handled by the Coordinator at merge time.
- **Environment**: Each worktree must have its own `.env` file (copied from root).
- **Communication**: All inter-agent communication must be written to `IMPLEMENTATION_LOG.md`.
