# Testing Map

**Date:** 2026-05-16

## Testing Framework & Setup
- **Automated Tests**: No formal automated test suite (Jest/Vitest) is currently set up for the frontend or backend (no `*.test.ts` or `*.spec.ts` files found).
- **UI/E2E Testing**: E2E or UI testing is primarily handled via custom scripts and tools like the `playwright-ui-verifier` skill. There is a `.playwright-cli/` directory present, which stores UI interaction definitions/logs for verification.
- **Manual QA**: There is a `qa/` directory storing screenshots and manual verification steps (e.g., `qa/issue-11`).
- **Dev Verification**: Frontend acceptance relies heavily on local `npm run dev` with screenshots/recordings attached to PRs.

## Current Practices
- PRs must include manual verification steps, screenshots/screen recordings of UI implementation, and notes on backend permission checks before merging.
- Agentic testing is encouraged via specialized skills (`playwright-ui-verifier`).
- Strict TypeScript compiler checks (`tsc`) and ESLint (`eslint .`) are the primary static safety nets.
