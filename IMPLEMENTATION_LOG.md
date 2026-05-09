# Supabase Auth & Role-based Permissions Implementation

## Plan

### 1. Environment Configuration
- Create `.env.local.example` with Supabase keys.
- User needs to set these in their local `.env.local`.

### 2. Database Schema (SQL)
- Define `profiles` table.
- Define `user_role` enum (`student`, `admin`).
- Set up RLS:
  - Users can read their own profile.
  - Public can read public profile info (username) if needed (optional for now).
  - Only service_role or manual SQL can update roles.
- Create a trigger to auto-create a profile on user signup.

### 3. Supabase Client Integration
- Create `lib/supabase/client.ts` (Browser client).
- Create `lib/supabase/server.ts` (Server client for Server Components/Actions).
- Create `lib/supabase/middleware.ts` (Auth session management).

### 4. App Shell Connection
- Modify `components/app-shell.tsx` to use `user` and `profile` from Supabase instead of local state.
- Add a simple Login/Logout UI placeholder (or a dedicated page).

### 5. Verification
- `backend-permission-review` for RLS and secret checks.
- `npm run lint` & `npm run build`.

## Status: Starting implementation...

---

# Issue #10 AI Solver OpenRouter Gemini multimodal orchestration

**Target Branch**: `feature/openrouter-gemini-multimodal`
**Integrated Commit**: `70eb116c`

| ID | Task | Branch | Status | Owner | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ASOLV-10A | Provider orchestration core | `feat/ai-solver-provider-orchestration` | Done | worker-provider | Commit `84295fd2`; server-only OpenRouter orchestration, decomposition, multimodal message construction, safe provider errors. |
| ASOLV-10B | Session, image context, and threaded message store | `feat/ai-solver-threaded-store` | Done | worker-store | Commit `7c39cb72`; owner-scoped image context, analysis persistence, threaded message helpers. |
| ASOLV-10C | Analyze and follow-up API routes | `feat/ai-solver-api-routes` | Done | worker-api | Commit `b0c826fb`; analyze/follow-up routes, persisted results, normalized errors, retrieval boundaries. |
| ASOLV-10D | AI Solver UI result, selection Q&A, and thread panel | `feat/ai-solver-threaded-ui` | Done | worker-ui | Commit `651f948f`; compact threaded AI Solver UI using local `design/` image style reference only, no Figma lookup. |
| ASOLV-10E | Integration and verification | `feat/ai-solver-verification` | Done | coordinator | Commits `165f3228`, `70eb116c`; API/UI contract fix and provider-internal fallback wording cleanup. |

## Verification Notes

- `npx tsc --noEmit`: passed in `.worktrees/ai-solver-verification`.
- `npm run lint`: passed in `.worktrees/ai-solver-verification`.
- `git diff --check`: passed in `.worktrees/ai-solver-verification`.
- `npm run build`: blocked by existing Next 16 Turbopack worktree root inference issue.
- `npx next build --webpack`: passed in `.worktrees/ai-solver-verification`.
- OpenRouter model availability check on 2026-05-09: `https://openrouter.ai/api/v1/models` did not list `google/gemini-3-pro-preview`; it did list `google/gemini-3.1-pro-preview`. Product owner approved `google/gemini-3.1-pro-preview`, and the server default now uses that model id.
- Backend/security review: no OpenRouter key/client exposure found; image data URLs remain server/local-store only; owner-scoped local-store helpers gate sessions/uploads/messages; remaining medium risk is lack of rate/usage limiting for multi-call provider flows.
