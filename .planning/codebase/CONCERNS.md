# Concerns Map

**Date:** 2026-05-16

## Technical Debt & Architecture Concerns
- **Testing Void**: Lack of standard unit/integration test suites (e.g., Jest/Vitest). High reliance on manual QA, screenshots, and visual checking, which doesn't scale well.
- **Component File Size**: Some UI components (e.g., `app-shell.tsx` is quite large) may be approaching or exceeding the 300-line limit mandated in `AGENTS.md`, and need careful monitoring or refactoring.
- **Database/RLS Confidence**: Heavy reliance on Supabase RLS for multi-tenant isolation (student vs. admin). Any misconfiguration in `supabase/migrations` can lead to cross-user data leakage. Needs constant `backend-permission-review`.

## Security Considerations
- **API Key Leakage**: Constant risk of accidentally exposing the OpenRouter API key (`OPENROUTER_API_KEY`) to the client or logging mechanisms. Must remain fully server-side.
- **Abuse Prevention**: Upload validation logic (`lib/ai-solver/upload-validation.ts`) must correctly restrict types, sizes, and ownership to prevent storage attacks or bloated processing tasks.

## Workflow Concerns
- **Agent Coordination**: Currently transitioning to a highly agentic "Get Shit Done" (GSD) workflow. Ensuring all agents correctly follow the single source of truth (`AGENTS.md` and `docs/product-spec.md`) without context drifting or hallucinating data is paramount.
