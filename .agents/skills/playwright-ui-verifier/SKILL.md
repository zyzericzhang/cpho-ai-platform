---
name: playwright-ui-verifier
description: Verify frontend behavior using browser/Playwright-style flows for login, upload, AI Solver, Problem Bank, Article Plaza, Library, and Admin pages.
---

# Playwright UI Verifier

Use this skill when a frontend feature needs behavior or visual verification.

## Required Checks When Relevant

- student can log in
- admin can log in
- student cannot access admin page
- student can upload problem file
- student can upload standard answer file
- AI solving is blocked without standard answer
- AI solution sections can expand/collapse
- AI session appears only in user's own history
- student cannot see another user's history
- student can search Problem Bank
- article can link to a problem
- user can save item to Personal Library

## Visual Checks

- Compare against Figma frame or screenshot reference。
- Confirm dark theme, density, sidebar, top nav, main area, and right panel。
- Check text clipping, overflow, overlap, and disabled states。
- Capture desktop screenshot。
- Capture narrow viewport screenshot when layout is responsive。

## Output

Return:

- tested flows
- passing flows
- failing flows
- screenshots or preview notes
- exact repro steps for failures
- required fixes
