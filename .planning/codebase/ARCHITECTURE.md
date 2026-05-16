# Architecture Map

**Date:** 2026-05-16

## High-Level Pattern
- **Frontend / Backend Split**: Next.js App Router serves as both the frontend UI and the backend API layer. Server Components (RSC) and Server Actions/API Routes are heavily used for data mutation and AI provider requests.
- **AI Agentic Architecture**: The AI Solver module (`lib/ai-solver`) is modular, using a provider orchestration strategy.
  - Features file-based schemas (`analysis-schema.ts`), structured generation, multimodal message parsing (`multimodal-messages.ts`).

## Core Subsystems
1. **AI Solver (`lib/ai-solver` & `app/ai-solver`)**
   - **Orchestration**: `provider-orchestration.ts` orchestrates prompts, contexts, and API calls.
   - **Client**: `openrouter-client.ts` abstracts communication with OpenRouter (Gemini).
   - **State**: Locally synced to `local-store.ts` for session persistency before entering global records.
2. **Problem Bank & Article Plaza**
   - Public knowledge repositories (`app/problem-bank/`), strictly partitioned from private user data. Admin role handles content.
3. **Data Layer**
   - Supabase SSR manages data access with strict Server-Side RLS to isolate `student` and `admin` permissions.

## Data Flow
- User Action -> Next.js Frontend Component -> Server Action / Route Handler (`app/api/`) -> Backend Logic (`lib/ai-solver/` or Supabase queries) -> External Service (OpenRouter) -> Return via Response (possibly streamed) -> State Updated (`lib/ai-solver/local-store.ts`).
