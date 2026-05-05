# Backend Risk Checklist

Use this checklist for backend, database, storage, auth, AI provider, and full-stack PRs.

## Critical Blockers

- [ ] Can a student call an admin-only API?
- [ ] Can one user read another user's AI Solver sessions?
- [ ] Can one user read another user's private documents?
- [ ] Can one user read another user's library items?
- [ ] Can one user read another user's uploaded files?
- [ ] Can one user modify or delete another user's data?
- [ ] Can AI analysis run without confirmed standard answer?
- [ ] Is any API key exposed through `NEXT_PUBLIC_`, client code, logs, screenshots, or error responses?
- [ ] Can the AI model invent related problems or articles instead of using retrieval?

If any answer is yes, the PR must not merge.

## Auth and Role Checks

- [ ] Every protected route reads current session server-side。
- [ ] Every admin route checks `role = 'admin'` server-side。
- [ ] Frontend hiding is not treated as security。
- [ ] Role writes are restricted to controlled admin/server paths。

## Ownership Checks

- [ ] Every private user-owned table has `user_id` or `owner_id`。
- [ ] Reads are scoped by owner。
- [ ] Updates/deletes are scoped by owner。
- [ ] Nested writes validate both parent ownership and target ownership。

## Supabase RLS Checks

- [ ] RLS is enabled on every app table。
- [ ] owner-only policies exist for private data。
- [ ] admin-only policies exist for Problem Bank mutations。
- [ ] public reads are limited to `status = 'published'` or `visibility = 'public'`。
- [ ] Tests or manual SQL checks prove student/admin boundaries。

## File Upload Checks

- [ ] Supported AI Solver uploads only：1-10 images, 1 PDF, 1 DOCX。
- [ ] `.doc` is rejected。
- [ ] MIME, extension, size, and count are validated server-side。
- [ ] AI Solver uploads go to private storage。
- [ ] Storage paths include user/session scoping。

## AI Cost and Abuse Checks

- [ ] AI calls happen server-side only。
- [ ] `OPENROUTER_API_KEY` is server-only。
- [ ] `OPENROUTER_MODEL` controls model id。
- [ ] Rate limit or usage-limit plan exists。
- [ ] Provider errors are normalized before client response。

## Required Review Output

Backend reviews must return：

- critical blockers
- high risks
- medium risks
- missing tests
- required fixes
- manual verification steps
- merge recommendation
