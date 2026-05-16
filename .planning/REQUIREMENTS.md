# Requirements: AI Solver Agentic UI Refactor

**Defined:** 2026-05-16
**Core Value:** Provide a clear, distraction-free, and logically structured workflow that clearly separates "starting a problem" from "deep-diving into an AI physics explanation."

## v1 Requirements

### Application Shell

- [ ] **APP-01**: Implement two-tier App Shell (Global Shell + Page-specific Workspace) to allow hiding the global right sidebar on Session pages.

### Solver Homepage

- [ ] **HOME-01**: Create `/solver` landing page.
- [ ] **HOME-02**: Display "Start New Session" prominent CTA.
- [ ] **HOME-03**: Display recent session history list.
- [ ] **HOME-04**: Display upload rules/instructions explicitly.

### Upload Flow

- [ ] **UPL-01**: Create `/solver/new` upload page.
- [ ] **UPL-02**: Implement step 1: Problem document upload.
- [ ] **UPL-03**: Implement step 2: Standard Answer document upload.
- [ ] **UPL-04**: Trigger session creation and redirect user to `/solver/sessions/:id` upon completion.

### Session Workspace

- [ ] **SESS-01**: Create `/solver/sessions/:id` dedicated workspace page.
- [ ] **SESS-02**: Implement Left Material Panel for PDF preview.
- [ ] **SESS-03**: Support tabs in Material Panel for toggling between Problem and Standard Answer.
- [ ] **SESS-04**: Implement collapse/expand toggle for the Left Material Panel.
- [ ] **SESS-05**: Implement Right AI Parsing Panel with 7 categorical accordions.
- [ ] **SESS-06**: Default only "Overview" and "Step-by-step" to expanded; others collapsed.
- [ ] **SESS-07**: Add "追问本节" (Ask about this section) button to each parsing block.
- [ ] **SESS-08**: Add fixed Chat UI below the parsing panel, populated with the context of the active section.

## v2 Requirements

### Workspace Enhancements

- **SESS-09**: Support side-by-side split screen view for Problem and Standard Answer in the Left Material Panel.
- **SESS-10**: Paragraph-level contextual follow-up buttons inside the AI parsing blocks.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-turn chat memory across different sessions | Each session should be contained to its specific problem. |
| Automatic PDF OCR processing on frontend | Handled by backend/AI, UI just needs to pass the file. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| APP-01 | Phase 1 | Pending |
| HOME-01 | Phase 2 | Pending |
| HOME-02 | Phase 2 | Pending |
| HOME-03 | Phase 2 | Pending |
| HOME-04 | Phase 2 | Pending |
| UPL-01 | Phase 3 | Pending |
| UPL-02 | Phase 3 | Pending |
| UPL-03 | Phase 3 | Pending |
| UPL-04 | Phase 3 | Pending |
| SESS-01 | Phase 4 | Pending |
| SESS-02 | Phase 4 | Pending |
| SESS-03 | Phase 4 | Pending |
| SESS-04 | Phase 4 | Pending |
| SESS-05 | Phase 4 | Pending |
| SESS-06 | Phase 4 | Pending |
| SESS-07 | Phase 5 | Pending |
| SESS-08 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-16*
*Last updated: 2026-05-16 after initial definition*
