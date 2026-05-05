---
name: pr-risk-auditor
description: Audit a PR before merge. Summarize changed files, acceptance criteria coverage, tests, build result, preview status, security risks, data risks, and manual verification steps.
---

# PR Risk Auditor

Use this skill before merging any PR.

## Review Inputs

- PR description
- changed files
- linked issue acceptance criteria
- test/build/lint output
- frontend screenshots or preview URL if UI changed
- backend permission notes if backend changed

## Output Required

1. PR goal
2. Changed files grouped by area
3. Acceptance criteria coverage
4. Tests run
5. Build/lint result
6. Preview/deployment status
7. Security risks
8. Data/permission risks
9. AI-provider/cost risks
10. Missing tests
11. Manual verification checklist
12. Merge recommendation

## Do Not Approve Merge If

- build failed
- tests were not run without explanation
- backend permissions changed without review
- AI API keys may be exposed
- student/admin boundaries are unclear
- user-owned data is not scoped by `user_id` or `owner_id`
- frontend changed without reference design and implementation screenshot/preview
