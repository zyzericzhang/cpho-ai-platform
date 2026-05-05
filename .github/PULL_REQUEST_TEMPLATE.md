## Goal


## Changed Files


## Verification

- Build:
- Lint:
- Tests:
- Manual verification:

## Frontend Evidence

Required when UI changes.

- Reference Figma frame or screenshot:
- Implementation screenshot or preview URL:
- Visual differences:

## Backend / Permission Evidence

Required when API, auth, database, storage, RLS, or AI provider code changes.

- Auth checks:
- Role checks:
- Owner checks:
- RLS impact:
- File upload validation:
- Secret handling:

## AI Evidence

Required when AI Solver or provider behavior changes.

- Provider path:
- `OPENROUTER_API_KEY` server-only:
- `OPENROUTER_MODEL` config respected:
- No-standard-answer gate:
- Retrieval hallucination guard:

## Risks

- Security:
- Data/permission:
- AI cost/provider:
- UX:

## Merge Checklist

- [ ] No direct commit to `main`
- [ ] Build/lint/tests run or explicitly explained
- [ ] Frontend screenshot/preview included for UI changes
- [ ] Backend permission review included for backend changes
- [ ] No secrets committed
- [ ] Manual verification steps are reproducible
