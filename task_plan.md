# Task Plan - Decision Log

## Project North Star
“Was my reasoning good, regardless of the result?”

## System Overview
- **Frontend:** Next.js (App Router)
- **Backend:** Supabase (DB + Auth)
- **Deployment:** Vercel
- **Hosting:** Serverless (Serverless Functions for business logic)

## Core Flow
1. **Log:** User captures a decision (Title, Context, Reasoning, Options, Prediction).
2. **Lock:** System locks the "Reasoning" and "Context" fields immediately after creation.
3. **Review:** User returns later (prompted by `review_date`) to log the Outcome (Result, Impact, Lessons).
4. **History:** User views history to analyze patterns in reasoning vs. results.

---

## Phase Checklist

### 1. Blueprint (Planning & Design)
**Objectives:**
- Finalize system architecture and data models.
- Design a premium, glassmorphic UI system.
- Map out edge cases (e.g., abandoned decisions).

**Deliverables:**
- [x] Refined `gemini.md` with full schema.
- [ ] UI Component Architecture document.
- [ ] Critical User Flow diagrams.

**Exit Criteria:**
- Approved Project Constitution.
- Zero ambiguity in data relationships.

### 2. Link (Foundation & Data)
**Objectives:**
- Establish baseline infrastructure.
- Implement User Authentication.
- Secure database via RLS.

**Deliverables:**
- [ ] Initialized Next.js project.
- [ ] Supabase project with `decisions` and `outcomes` tables.
- [ ] RLS policies for user-scoped access.

**Exit Criteria:**
- User can sign up/login.
- Successfully CRUD a mock decision record from the frontend.

### 3. Architect (Logic & Core Features)
**Objectives:**
- Implement the "Immutability" logic for reasoning.
- Build the core decision capture and outcome review workflows.

**Deliverables:**
- [ ] Decision Capture Form (with immediate lock on save).
- [ ] Decision History List (filtered by status).
- [ ] Outcome Review Modal/Page.

**Exit Criteria:**
- Decisions cannot be edited after creation (except status/outcome).
- Outcomes correctly link to decisions 1:1.

### 4. Stylize (UI & UX Polish)
**Objectives:**
- Apply the high-end aesthetic.
- Implement micro-animations and transitions.

**Deliverables:**
- [ ] Global CSS with dark mode/glassmorphism tokens.
- [ ] Framer Motion (or CSS) animations for list items and modals.

**Exit Criteria:**
- Visual "WOW" factor verified by user.
- Responsive layout across all breakpoints.

### 5. Trigger (Verification & Launch)
**Objectives:**
- End-to-end verification of the thinking accountability loop.
- Production deployment.

**Deliverables:**
- [ ] Verification Report (in `walkthrough.md`).
- [ ] Deployed Vercel URL.

**Exit Criteria:**
- Zero open critical issues.
- System successfully prompts for a due review.
