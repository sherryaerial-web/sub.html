# Teacher Room Rental OB Writeback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated teachers create, waitlist, repeat, and cancel room rentals from the practice calendar while safely writing confirmed rentals to Omcean Booking.

**Architecture:** Extend the existing practice calendar with a separate rental form and add an isolated rental transaction model in new Sheets. GAS owns OB catalog resolution, live conflict checks, POST/cancel calls, FIFO waitlist reconciliation, lower-priority practice displacement, notification, and cache invalidation; the frontend never receives credentials or decides final availability.

**Tech Stack:** Google Apps Script, Google Sheets, vanilla HTML/CSS/JavaScript, Node.js `node:test`, Omcean Booking REST API.

**Spec:** `docs/superpowers/specs/2026-09-09-teacher-room-rental-ob-writeback-design.md`

## Global Constraints

- Rental duration comes only from the selected OB rental class `duration`; there is no editable duration or end-time field.
- Priority is formal OB course, OB rental, teacher practice, student practice.
- Formal courses and rentals reserve 15 minutes before and after.
- OB and formal Sheet writes are not executed during automated tests.
- Existing Sheet columns and numeric indexes remain unchanged; new transactional data uses new Sheets.
- API tokens remain in Apps Script Script Properties and never enter frontend responses or tracked files.
- GitHub push, `clasp push --force`, production GAS deployment, formal Sheet creation, and formal OB writes need separate explicit approval.

---

### Task 1: Rental catalog and isolated Sheet contract

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `normalizeRentalClassCatalog_(rawClasses) -> RentalClass[]`
- Produces: `ensureRentalStructureUnlocked_(spreadsheet) -> {series, requests, audit, mappings}`
- Produces: `getRentalCatalog_(session) -> {classes, rooms, instructor}`

- [ ] **Step 1: Write failing backend tests**

Add tests that provide literal OB class fixtures and assert only names containing `場地租借` or `場租` survive with exact `classId`, `name`, and numeric `duration`; assert 150 minutes remains available. Add a structure test that reruns setup and proves existing practice and CourseList values are unchanged.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test --test-name-pattern='rental catalog|rental structure' tests/backend-core.test.js`

Expected: FAIL because rental functions and Sheet constants do not exist.

- [ ] **Step 3: Implement catalog and Sheet model**

Add new Sheet names and append-only header arrays for `教室租借系列`, `教室租借需求`, `教室租借操作紀錄`, and `OB租借對照`. Normalize OB classes with their existing duration instead of parsing minutes from labels. Resolve rooms and instructors to stable IDs; ambiguous or missing mappings return an explicit blocked result.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command and require zero failures.

- [ ] **Step 5: Commit**

Commit message: `feat: add isolated room rental catalog and sheets`

### Task 2: Preview and create one rental safely

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: Task 1 catalog and Sheet model.
- Produces: `previewTeacherRental_(session, request) -> RentalPreview`
- Produces: `createTeacherRental_(session, request) -> RentalMutationResult`
- Produces: `postObRentalCalendar_(payload, requestId) -> CalendarDetail`

- [ ] **Step 1: Write failing tests for preview and direct creation**

Cover literal 60 and 150 minute classes, exact 15-minute boundaries, different rooms, live-OB failure, an ordinary course conflict, an existing rental conflict, lower-priority teacher/student practice summaries, OB 201, OB 409, and a second identical submit. Assert OB payload contains `classId`, `classTime`, `classRoomId`, one `instructorId`, and private UUID but no `courseId` or end time.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern='rental preview|rental creation|rental OB payload' tests/backend-core.test.js`

Expected: FAIL because preview and mutation functions do not exist.

- [ ] **Step 3: Implement locked preview and transaction**

Validate future Taipei date/time and selected server catalog class. Re-read live OB inside `withScriptLock_`. Return `requiresImpactConfirmation` plus affected records when only lower-priority practice conflicts. Persist a UUID request, POST OB once, require 201 plus Calendar ID, then mark established. Turn formal/rental conflicts into local waitlists without POST. Before retrying an uncertain write, search live OB for the private UUID and canonical fields.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command and require zero failures.

- [ ] **Step 5: Commit**

Commit message: `feat: create teacher rentals through OB safely`

### Task 3: Displace lower-priority practice and notify

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: established rental result from Task 2.
- Produces: `applyRentalPracticeDisplacementUnlocked_(...) -> {teacherBookings, studentGroups}`
- Produces: rental inbox events through the existing notification helpers.

- [ ] **Step 1: Write failing displacement tests**

Assert OB failure leaves every practice row unchanged. Assert OB success marks overlapping teacher bookings `衝突取消`, marks overlapping student groups `時段異動待處理`, preserves participants and history, notifies affected teachers, and notifies only 冠蓉 and Tako for student follow-up. Assert unrelated rows remain byte-for-byte unchanged.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern='rental displaces|rental preserves practice|rental student follow-up' tests/backend-core.test.js`

Expected: FAIL because displacement is not implemented.

- [ ] **Step 3: Implement precise lower-priority updates**

Use booking/group UUIDs for exact row updates, append audit records, and create notification events after the OB transaction succeeds. Leave student participants intact for manual contact and do not touch CourseList.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command and require zero failures.

- [ ] **Step 5: Commit**

Commit message: `feat: reconcile rentals with autonomous practice`

### Task 4: FIFO waitlist, recurrence, and cancellation

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: Task 2 creation transaction and Task 3 displacement.
- Produces: `reconcileRentalWaitlist_(options) -> RentalReconcileResult`
- Produces: `cancelTeacherRental_(session, request) -> RentalMutationResult`
- Produces: one request per occurrence for weekly series.

- [ ] **Step 1: Write failing lifecycle tests**

Cover FIFO ordering, first-item failure blocking later items, expiry, weekly end-date validation, mixed established/waitlisted weeks, OB 429 stopping a batch, cancel waitlist without OB, cancel established through the idempotent cancel endpoint, cancel failure preserving established state, cancel-this occurrence, and stop-this-and-future.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern='rental waitlist|rental recurrence|rental cancellation' tests/backend-core.test.js`

Expected: FAIL because lifecycle handlers do not exist.

- [ ] **Step 3: Implement lifecycle operations**

Order overlapping candidates by creation timestamp then request UUID. Recheck live OB before every promotion. Expand weekly requests only through the explicit end date. Stop on 429 and leave untouched rows pending. Cancel established items through `/v1/calendar/{id}/cancel`, update local state only after a 200 response, invalidate the affected day, and then consider the next candidate.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command and require zero failures.

- [ ] **Step 5: Commit**

Commit message: `feat: manage rental waitlists recurrence and cancellation`

### Task 5: Authenticated routes and teacher UI

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Test: `tests/backend-core.test.js`
- Test: `tests/frontend-contract.test.js`
- Test: `tests/responsive-contract.test.js`

**Interfaces:**
- Consumes: Task 1-4 service functions.
- Produces authenticated actions `getRentalCatalog`, `previewTeacherRental`, `createTeacherRental`, `cancelTeacherRental`, and admin/manual reconciliation.
- Produces frontend rental button, dialog, impact confirmation, and personal rental controls.

- [ ] **Step 1: Write failing route and UI tests**

Assert every mutation requires a valid session and ignores forged teacher names. Assert the practice page has separate `自主練習` and `租借教室` actions, rental course options show server duration, no editable duration/end control appears, recurrence requires an end date, previews show affected names, double submission is disabled, other teachers cannot cancel, and 320/375/390/430px layouts keep native fields inside the dialog.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern='teacher rental|rental dialog|rental mobile' tests/backend-core.test.js tests/frontend-contract.test.js tests/responsive-contract.test.js`

Expected: FAIL because routes and controls are absent.

- [ ] **Step 3: Wire authenticated API dispatcher and UI**

Add protected POST routes. Render the rental catalog from backend data. Compute the displayed end time from selected duration for confirmation only. Require preview/impact acknowledgement before final mutation. Refresh the selected practice date after success and expose cancel-only controls for the signed-in owner.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command and require zero failures.

- [ ] **Step 5: Commit**

Commit message: `feat: add teacher room rental workflow`

### Task 6: Release verification without production mutation

**Files:**
- Modify: `README.md` only if the existing local verification commands are incomplete.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified branch ready for user review, without push, deploy, Sheet creation, or OB write.

- [ ] **Step 1: Run syntax and complete automated suite**

Run: `node --check tests/backend-core.test.js`

Run: `node --test tests/*.test.js`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run practice release and mobile checks**

Run: `node tests/run-practice-release-check.mjs`

Run: `node tests/student-practice-mobile-layout-check.mjs`

Expected: both commands exit 0 and report no overflow or contract failure.

- [ ] **Step 3: Inspect safety and diff**

Run: `git diff --check`

Run: `git status --short`

Confirm no API secret, formal Sheet export, generated credential, or unrelated file entered the diff.

- [ ] **Step 4: Report for user review**

State files changed, test counts, branch name, that no formal Sheet/OB mutation occurred, and that GitHub/GAS remain undeployed.

