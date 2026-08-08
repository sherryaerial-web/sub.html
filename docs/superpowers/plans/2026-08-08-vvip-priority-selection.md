# VVIP Priority Selection Implementation Plan

> **For agentic workers:** Implement locally with TDD. Run only VVIP-focused tests during development; reserve the full suite for the final production deployment.

**Goal:** Add a public VVIP monthly course-intent page with cumulative four-course limits and an administrator management workspace.

**Architecture:** `vvip.html` uses form-encoded POST against the existing GAS backend. `Code.gs` reads next-month courses from the manually synchronized `CourseList`, stores VVIP records in isolated tabs, and reuses existing admin sessions for management actions.

**Tech Stack:** Google Apps Script, Google Sheets, vanilla HTML/CSS/JavaScript, Node.js test runner, Playwright for one focused mobile/desktop journey.

## Global Constraints

- Do not move or rewrite existing Sheet indexes.
- Do not expose Email in URLs or other teacher APIs.
- Same normalized Email and month may hold at most four active unique OB Calendar IDs.
- Repeat submissions accumulate; they do not overwrite prior choices.
- Writes and admin transitions use `LockService` and rollback on failure.
- During development run only VVIP-focused tests; full system tests run once immediately before production deployment.

---

### Task 1: VVIP Sheet Structure and Core Selection Rules

**Files:** Modify `Code.gs`; modify `tests/backend-core.test.js`.

- [ ] Add failing tests for idempotent creation of `VVIP選課紀錄` and `VVIP選課設定` without touching existing tabs.
- [ ] Add failing tests for Email normalization, next-month filtering, duplicate Calendar IDs, cumulative submissions, four-course limit, closed state, missing Calendar IDs, and all-or-nothing append failure.
- [ ] Implement focused helpers and public POST actions `getVvipSelection` and `submitVvipSelection`.
- [ ] Run only VVIP backend tests and commit.

### Task 2: Public VVIP Page

**Files:** Create `vvip.html`; modify `tests/frontend-contract.test.js`.

- [ ] Add failing contracts for Email POST, no query-string Email, date grouping, search, cumulative counter, four-course limit, confirmation, closed/empty/error states, and intent-not-reservation copy.
- [ ] Build the complete responsive page using the existing sea-glass design language without teacher navigation or login.
- [ ] Run only VVIP frontend contract tests and commit.

### Task 3: Administrator VVIP Workspace

**Files:** Modify `Code.gs`; modify `index.html`; modify focused backend/frontend tests.

- [ ] Add failing tests for admin-only open/close, pre-open course validation, Email search, confirmation, single-course cancellation with reason, course grouping, audit, and CSV injection protection.
- [ ] Implement admin POST actions and add a seventh `VVIP 選課` admin tab with metrics, search, status controls, cancellation and CSV download.
- [ ] Run only VVIP admin tests and commit.

### Task 4: Focused Visual and Deployment Verification

**Files:** Create `tests/vvip-visual-check.mjs`; modify `README.md`.

- [ ] Add one desktop and one mobile VVIP journey covering Email lookup, course selection, accumulated count and confirmation.
- [ ] Document Sheet tabs, open/close workflow, public page deployment, monthly manual OB sync, CSV, and member-facing caveat.
- [ ] Run VVIP backend/frontend tests, syntax checks, secret scan, and the two VVIP screenshots only.
- [ ] Inspect both screenshots and commit.

### Task 5: Deployment Gate (Do Not Run Yet)

Only when the user explicitly confirms production deployment:

- [ ] Rotate and set the exposed Omcean token.
- [ ] Run the complete system test suite once.
- [ ] Run the complete production visual suite once.
- [ ] Deploy GAS first, then publish `index.html` and `vvip.html` as a compatible pair.
- [ ] Perform live smoke tests and record rollback versions.
