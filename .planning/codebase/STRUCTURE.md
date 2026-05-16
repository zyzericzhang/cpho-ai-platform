# Structure Map

**Date:** 2026-05-16

## Directory Layout
- `/app/` - Next.js App Router pages, layouts, and API routes.
  - `/app/admin/` - Admin features.
  - `/app/ai-solver/` - AI Solver user interface.
  - `/app/api/ai-solver/` - Server endpoints for AI operations.
  - `/app/login/` - Authentication flows.
  - `/app/problem-bank/` - Problem Bank interface.
- `/components/` - Shared UI components (`app-shell.tsx`). Uses Tailwind and likely Shadcn UI or equivalent.
- `/lib/` - Shared business logic and external clients.
  - `/lib/ai-solver/` - Deep AI orchestration logic, schemas, configurations, openrouter client.
  - `/lib/supabase/` - Supabase client initialization.
- `/supabase/migrations/` - Database schemas and migrations.
- `/docs/` - Source of truth for product specs, permission matrix, UI styles.
- `/.agents/skills/` - Custom agent workflow scripts/skills specific to CPHO.

## Key Entry Points
- `app/layout.tsx` - Global Next.js app wrapper.
- `app/page.tsx` - Platform landing/dashboard.
- `components/app-shell.tsx` - Main layout shell containing sidebars and top navigation logic.
- `lib/ai-solver/provider-orchestration.ts` - Entry point for initiating AI solution workflows.
