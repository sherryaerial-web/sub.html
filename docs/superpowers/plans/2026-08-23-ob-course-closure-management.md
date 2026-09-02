# OB Course Closure Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe next-day low-enrollment closure and manual next-month unclaimed-substitute closure tools without mutating formal leave/substitute data outside the explicitly selected whole-month workflow.

**Architecture:** Keep OB reads and cancellations in GAS behind administrator-only handlers, a script lock, per-stage idempotency, and append-only closure logs. Derive closure thresholds from live OB calendar detail (`customersAttending`, `points`, teacher, and course name), re-read immediately before every write, and keep automatic next-day closures independent from substitute records. Extend the invitation-round action to expose a separate manual list whose successful `onlyEmpty=true` cancellations alone close their matching substitute rows.

**Tech Stack:** Google Apps Script, Google Sheets, Omcean Booking API, static HTML/CSS/JavaScript, Node.js built-in test runner.

## Global Constraints

- Never expose the OB token in HTML, Git, logs, or Sheets; use Script Properties only.
- Do not clear, reorder, migrate, or bulk-overwrite existing formal Sheet rows or indexes.
- Do not call the live OB write endpoint during tests or implementation verification.
- Automatic next-day closure must never alter leave, substitute, or invitation rows.
- Whole-month substitute closure may update a substitute row only after its OB cancellation succeeds.
- Do not push Git, run `clasp push`, create a GAS version, or deploy until the user separately approves release.

---

### Task 1: Closure policy and OB API boundary

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `getCourseClosureRule_`, `normalizeClosureCalendarDetail_`, `fetchCalendarDetail_`, `cancelObCalendarItem_`.
- Preserves: current CourseList synchronization and existing fixed Sheet indexes.

- [ ] Write tests for 22:30 zero-person closure, general 0–1 closure, Jina/小美/卡拉 and 2-point 0–2 closure, course names containing 雙人 0–3 closure, highest-threshold precedence, and missing-field manual review.
- [ ] Write request-boundary tests proving cancellation sends `reason` and the correct `onlyEmpty` value without exposing the token.
- [ ] Run the focused tests and verify they fail for the missing behavior.
- [ ] Implement pure policy/normalization helpers plus configurable GET/cancel API clients.
- [ ] Run the focused tests until they pass.

### Task 2: Settings, logs, idempotency, and scheduler

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `關課設定`, `關課紀錄`, `getCourseClosureDashboard_`, `saveCourseClosureSettings_`, `executeNextDayClosures_`, `runCourseClosureScheduler`.
- Preserves: formal CourseList and leave/invitation sheets.

- [ ] Write fixture tests for append-only headers, manual-by-default settings, stage idempotency, immediate pre-cancel re-read, failure aggregation, and zero mutation of leave/invitation sheets.
- [ ] Run the focused tests and verify they fail for the missing behavior.
- [ ] Add structure creation, settings access, append-only logs, run summaries, readiness checks, and fixed-frequency scheduler dispatch.
- [ ] Add administrator POST handlers for preview, settings, and guarded manual execution.
- [ ] Run focused tests until they pass.

### Task 3: Whole-month unclaimed substitute closure

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `getUnclaimedSubstituteClosureCandidates_`, `closeUnclaimedSubstituteCourses_`.
- Preserves: existing invitation-round close rollback and audit behavior.

- [ ] Write tests proving ending the invitation round returns all next-month unclaimed courses, all cancellations use `onlyEmpty=true`, booked/error courses stay open, and only successful OB cancellations close their matching substitute rows.
- [ ] Run the focused tests and verify they fail for the missing behavior.
- [ ] Extend the end-round response and add the administrator batch endpoint with per-item latest-detail reads, precise row updates, audits, and result summaries.
- [ ] Run focused tests until they pass.

### Task 4: Administrator UI

**Files:**
- Modify: `index.html`
- Test: `tests/frontend-contract.test.js`
- Test: `tests/morandi-visual-contract.test.js`

**Interfaces:**
- Produces: `關課管理` tab, manual/automatic controls, 22:30/23:40 preview lists, run history, and end-round unclaimed-course checklist.
- Preserves: current administrator responsive layout and action refresh behavior.

- [ ] Write frontend contract tests for the new tab, threshold labels, manual/auto switch, confirmation guards, result feedback, and separate whole-month checklist.
- [ ] Run focused frontend tests and verify they fail for the missing UI.
- [ ] Implement rendering, handlers, busy states, confirmation text, and mobile-safe styling.
- [ ] Run focused frontend and visual-contract tests until they pass.

### Task 5: Complete verification and handoff

**Files:**
- Verify: `Code.gs`, `index.html`, test files, design and implementation plan.

- [ ] Run the complete Node test suite.
- [ ] Run GAS syntax parsing and frontend inline-script parsing.
- [ ] Inspect `git diff` for tokens, accidental Sheet index changes, destructive writes, or production commands.
- [ ] Commit the implementation locally on `feature/ob-course-closure-management` and report that formal OB/Sheet data and production remain untouched.
