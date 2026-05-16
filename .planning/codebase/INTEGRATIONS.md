# Integrations Map

**Date:** 2026-05-16

## External APIs & Services
1. **Supabase**
   - Location: `@supabase/supabase-js` and `@supabase/ssr` dependencies.
   - Purpose: Authentication (Auth), Postgres Database, and Object Storage. Row Level Security (RLS) is used as an explicitly mentioned security measure in project docs.
   - Config: `/lib/supabase/` and `/supabase/migrations/`.

2. **OpenRouter / Gemini 3**
   - Location: `lib/ai-solver/openrouter-client.ts`, `lib/ai-solver/provider-orchestration.ts`.
   - Purpose: AI Provider for the CPHO AI Solver platform. Uses OpenRouter with OpenAI-compatible chat completion interface to access Gemini 3 models.
   - Notes: Keys (`OPENROUTER_API_KEY`) are kept server-side only. Models are explicitly managed.

## Authentication Providers
- **Supabase Auth**: Mentioned in product specs and dependencies. Manages Student and Admin roles with session tokens.

## Storage
- **Supabase Storage**: For uploaded user documents/images before processing in the AI solver. Validated via `lib/ai-solver/upload-validation.ts`.
