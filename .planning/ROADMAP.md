# Roadmap: AI Solver Agentic UI Refactor

## Overview

Redesigning the AI Solver workflow from a single monolithic form into a multi-step, focused professional workspace. We will start by updating the global App Shell, then construct the Dashboard, Upload Flow, and finally the dedicated Session Workspace with dual-panel layout and contextual threaded chat.

## Phases

- [ ] **Phase 1: App Shell & Layout Foundation** - Support page-specific workspaces.
- [ ] **Phase 2: Solver Homepage** - Landing page with dashboard and upload rules.
- [ ] **Phase 3: Upload Flow** - Step-by-step document upload process.
- [ ] **Phase 4: Session Workspace Layout & Materials** - Core layout and Left Material Panel with PDF preview tabs.
- [ ] **Phase 5: AI Parsing Panel & Contextual Chat** - Right-side accordions and section-specific follow-up chat.

## Phase Details

### Phase 1: App Shell & Layout Foundation
**Goal**: Update the global layout structure so that specific pages (like the Session Workspace) can hide the global right sidebar and maximize horizontal screen real estate.
**Depends on**: Nothing
**Requirements**: APP-01
**Success Criteria**:
  1. Top Navigation is preserved.
  2. The application supports a layout mode where the right sidebar is hidden on designated routes.
**Plans**: 1 plan

Plans:
- [ ] 01-01: Update layout components to support global vs workspace modes.

### Phase 2: Solver Homepage
**Goal**: Create a landing dashboard for the `/solver` route so users don't see a giant form immediately.
**Depends on**: Phase 1
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04
**Success Criteria**:
  1. User navigating to `/solver` sees a "Start New Session" CTA.
  2. Recent history is displayed.
  3. Upload rules are clearly visible.
**Plans**: 1 plan

Plans:
- [ ] 02-01: Build the Solver Homepage dashboard.

### Phase 3: Upload Flow
**Goal**: Isolate the document upload process into its own dedicated step-by-step view (`/solver/new`).
**Depends on**: Phase 2
**Requirements**: UPL-01, UPL-02, UPL-03, UPL-04
**Success Criteria**:
  1. User can navigate to `/solver/new`.
  2. User uploads Problem PDF.
  3. User uploads Standard Answer PDF.
  4. System redirects to `/solver/sessions/:id` after submission.
**Plans**: 1 plan

Plans:
- [ ] 03-01: Implement the multi-step document upload component.

### Phase 4: Session Workspace Layout & Materials
**Goal**: Build the core layout of the dedicated Session Workspace (`/solver/sessions/:id`), focusing on the left-hand material viewer.
**Depends on**: Phase 3
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06
**Success Criteria**:
  1. Workspace view loads without global right sidebar.
  2. Left Material Panel previews PDFs and supports toggling between Problem and Answer tabs.
  3. Left Material Panel is collapsible.
  4. Right AI Parsing Panel renders 7 accordion blocks (Overview and Step-by-step expanded by default).
**Plans**: 2 plans

Plans:
- [ ] 04-01: Build the Session Workspace shell and Left Material Panel.
- [ ] 04-02: Build the Right AI Parsing Panel structure with 7 accordions.

### Phase 5: AI Parsing Panel & Contextual Chat
**Goal**: Add interactive capabilities to the AI Parsing Panel, specifically the ability to ask follow-up questions contextually about a specific section.
**Depends on**: Phase 4
**Requirements**: SESS-07, SESS-08
**Success Criteria**:
  1. User sees "追问本节" on each parsed section.
  2. Clicking "追问本节" populates the pinned chat box with the relevant context.
  3. Chat UI persists at the bottom of the right panel.
**Plans**: 1 plan

Plans:
- [ ] 05-01: Implement contextual follow-up buttons and threaded chat UI.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Shell & Layout Foundation | 0/1 | Not started | - |
| 2. Solver Homepage | 0/1 | Not started | - |
| 3. Upload Flow | 0/1 | Not started | - |
| 4. Session Workspace Layout & Materials | 0/2 | Not started | - |
| 5. AI Parsing Panel & Contextual Chat | 0/1 | Not started | - |
