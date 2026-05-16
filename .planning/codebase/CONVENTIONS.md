# Conventions Map

**Date:** 2026-05-16

## Code Style & Patterns
- **Language**: TypeScript with strict typing. Implicit or explicit `any` usage is heavily discouraged.
- **File Length**: Single files must not exceed 300 lines. If they do, they must be refactored into smaller modules.
- **Naming Conventions**: Variables, functions, and components must clearly express intent. Single-letter variables are forbidden (except for iteration variables).
- **Comments**: Every function and component must have Chinese comments explaining "what it does" and "why". Every new file must have a file-level comment at the top explaining its purpose.
- **DRY Principle**: Repeated logic must be extracted into shared utility functions or components.

## UI/UX Rules
- **Aesthetics**: Dark mode first, Apple/Linear/ChatGPT-like. Professional, compact, monochrome (black/white/gray), text-first.
- **Components**: Adhere to Shadcn/ui or primitive component style. No gamified visuals or large colorful dashboard cards.
- **Edge Cases**: Every frontend page must explicitly handle loading, empty, error, permission denied, selected item, and disabled/unauthorized actions.
- **Data Display**: Use tables for data-dense pages. AI outputs use collapsible sections. Details/Settings typically go in right-side panels.

## Security & Auth
- **AI Keys**: `OPENROUTER_API_KEY` is strictly server-side. It must never leak into client bundles, PR documents, or logs.
- **Ownership**: All private/user-owned records must have `user_id` or `owner_id`.
- **Permissions**: Enforced strictly via Supabase RLS and server-side backend checks. Hidden UI does not substitute for real backend permission checks.
