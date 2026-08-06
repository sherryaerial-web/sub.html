# Substitute System v2.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authenticated, manually synchronized leave and hidden-invitation substitute workflow defined in the v2.1 design while preserving existing Sheet indexes.

**Architecture:** Keep `Code.gs` as a complete paste-ready Apps Script backend and `index.html` as a complete GitHub Pages frontend. Add append-only Sheet fields plus protected invitation, audit, account, and settings tabs; use session tokens, POST writes, and `LockService` for every state transition.

**Tech Stack:** Google Apps Script, Google Sheets, vanilla HTML/CSS/JavaScript, Node.js built-in test runner, Playwright.

## Global Constraints

- Rename `工作表1` to `請假代課紀錄`; preserve columns A:J and numeric indexes exactly.
- Preserve `CourseList` columns A:D and append API metadata from E onward.
- OB sync is manual only and covers today through the end of next month.
- Never expose `OMCEAN_API_TOKEN`, PIN values, PIN hashes, sessions, or salary data to the frontend.
- Uninvited teachers cannot list pending substitutes; invited teachers see all currently pending substitutes except their own leave.
- Invitation progression and closure are manual; no automatic rounds, expiry, or LINE sending.
- Writes use POST and return verified JSON results; concurrent claims allow exactly one winner.
- Salary features are outside this implementation.

---

### Task 1: Sheet Migration and Stable Data Contracts

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `ensureSystemStructure_(): Object`, `getHeaderMap_(sheet): Object`, `appendAudit_(event): void`.
- Preserves: leave indexes `r[1]` through `r[7]` and `CourseList` indexes `r[0]` through `r[3]`.

- [ ] **Step 1: Write failing migration tests**

Add tests proving that `工作表1` is renamed once, A:J headers remain unchanged, new K+ headers are appended, and rerunning migration is idempotent.

```js
test('renames the legacy leave sheet and preserves fixed headers', () => {
  const result = context.ensureSystemStructure_();
  assert.equal(result.leaveSheetName, '請假代課紀錄');
  assert.deepEqual(sheet.values[0].slice(0, 10), EXPECTED_LEAVE_HEADERS);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/backend-core.test.js`

Expected: FAIL because migration helpers and appended headers do not exist.

- [ ] **Step 3: Implement idempotent structure setup**

Add constants for all sheet names and append-only headers. Implement migration without clearing rows, create `代課邀請`, `操作紀錄`, `系統設定`, and `登入帳號` only when missing, and write only missing headers.

```js
var SHEETS = {
  COURSE_LIST: 'CourseList',
  LEAVES: '請假代課紀錄',
  LEGACY_LEAVES: '工作表1',
  INVITATIONS: '代課邀請',
  AUDIT: '操作紀錄',
  SETTINGS: '系統設定',
  ACCOUNTS: '登入帳號'
};
```

- [ ] **Step 4: Run tests and commit**

Run: `node --test tests/backend-core.test.js`

Expected: PASS for migration and existing fixed-index tests.

Commit: `feat: add substitute sheet migration`

### Task 2: Authentication, Sessions, and Authorization

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `authenticate_(teacherName, pin): Object`, `requireSession_(token): Object`, `requireAdmin_(token): Object`, `hashPin_(pin, salt): string`.
- Consumes: `登入帳號` columns for teacher, salt, PIN hash, active flag, role, failed attempts, lock time.

- [ ] **Step 1: Add failing authentication tests**

Cover valid login, invalid PIN, inactive account, temporary lock, expiring session, teacher-only response shape, and admin rejection.

```js
test('login returns a session without exposing credentials', () => {
  const response = context.authenticate_('老師甲', '1234');
  assert.ok(response.sessionToken);
  assert.equal('pinHash' in response, false);
});
```

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/backend-core.test.js --test-name-pattern="login|session|admin"`

- [ ] **Step 3: Implement guarded authentication**

Use SHA-256 with a per-account salt, random opaque session tokens stored in CacheService and Script Properties-compatible fallback, a fixed session duration, failed-attempt counters, and an admin role check. Add an administrator-only account setup helper that accepts plaintext only as an execution argument and stores only salt/hash.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tests/backend-core.test.js`

Commit: `feat: add teacher and admin authentication`

### Task 3: Manual OB Synchronization and Immutable Leave Linking

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`
- Modify: `README.md`

**Interfaces:**
- Produces: `syncCourseListFromApi(sessionToken): Object`, `normalizeCalendarItem_(item): Object` including calendar/class/instructor IDs.
- Removes: hourly trigger installation and any automatic-sync contract.

- [ ] **Step 1: Extend failing sync tests**

Test manual admin authorization, appended metadata, pagination, cancelled-class filtering, atomic replacement, and preservation of old `CourseList` on zero/invalid/error responses.

```js
test('manual sync requires admin and keeps the old snapshot on invalid data', () => {
  assert.throws(() => context.syncCourseListFromApi('teacher-session'), /管理權限/);
  assert.deepEqual(courseSheet.values, oldValues);
});
```

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/backend-core.test.js --test-name-pattern="sync|calendar"`

- [ ] **Step 3: Implement manual sync**

Remove hourly trigger setup, require an admin session, fetch all pages, normalize before obtaining the write lock, then atomically replace only the current snapshot. Keep API token lookup limited to `PropertiesService.getScriptProperties()`.

- [ ] **Step 4: Update deployment documentation and commit**

Document `OMCEAN_API_TOKEN`, structure setup, account initialization, manual sync, and the required web-app redeploy.

Run: `node --test tests/backend-core.test.js`

Commit: `feat: make Omcean synchronization manual`

### Task 4: Date-First Leave Submission and Personal Leave History

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces GET actions: `getMyCourses`, `getMyLeaves`.
- Produces POST action: `submitLeave` returning `{requested, created, duplicates, failed}`.
- Consumes: authenticated teacher identity from the session rather than a submitted teacher name.

- [ ] **Step 1: Add failing backend and frontend contract tests**

Test session-bound identity, OB calendar ID storage, duplicate protection, batches larger than old URL limits, exact result counts, date-first controls, select-all-visible dates, clear-all, and confirmation count.

```js
test('submitLeave uses the logged-in identity and reports exact counts', () => {
  const result = context.submitLeave_({ teacherName: '老師甲' }, items);
  assert.deepEqual(result, { requested: 25, created: 25, duplicates: 0, failed: 0 });
});
```

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/backend-core.test.js tests/frontend-contract.test.js`

- [ ] **Step 3: Implement `doPost` and leave APIs**

Parse `application/x-www-form-urlencoded` POST bodies, route writes through `doPost`, validate session and item count, lock duplicate checks plus append, and return per-item errors without duplicating successful rows on retry.

- [ ] **Step 4: Build the date-first leave UI**

After login, render unique dates first. Add select-all-visible and clear controls, reveal courses only after dates are selected, show total and a final course list, submit in bounded batches, and display success only when backend counts match.

- [ ] **Step 5: Add personal leave history and commit**

Render status, substitute teacher, intended course/level, OB verification, and cancellation state for the logged-in teacher.

Run: `node --test tests/backend-core.test.js tests/frontend-contract.test.js`

Commit: `feat: add authenticated date-first leave flow`

### Task 5: Hidden Invitations and Concurrent Claims

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces admin POST actions: `openInvitations`, `closeInvitations`, `pauseClaims`.
- Produces teacher GET action: `getAvailableSubstitutes`.
- Produces teacher POST action: `claimSubstitute`.

- [ ] **Step 1: Add failing invitation and claim tests**

Cover one/many invitees, uninvited access, hidden ordering, all pending classes, own-leave exclusion, global pause, audit timestamps, and exactly-one concurrent winner.

```js
test('an invited teacher sees every pending substitute except their own leave', () => {
  const rows = context.getAvailableSubstitutes_({ teacherName: '老師甲' });
  assert.ok(rows.every(row => row.originalTeacher !== '老師甲'));
});
```

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/backend-core.test.js --test-name-pattern="invite|invited|claim|pause"`

- [ ] **Step 3: Implement invitation authorization and claim locking**

Store invitations separately from leave rows, record first view once, filter server-side, and perform claim status validation plus write inside `getScriptLock()`. Never return invitation order, tiers, or other invitees.

- [ ] **Step 4: Build date-grouped claim UI and commit**

Show pending items grouped by date only for invited teachers. Refresh after conflict, remove claimed items immediately, and show a neutral empty state to uninvited teachers.

Run: `node --test tests/backend-core.test.js tests/frontend-contract.test.js`

Commit: `feat: add private substitute invitations`

### Task 6: Structured Course Changes, Difficulty, and Notes

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces: `teacherCanTeachCategory_(teacher, category): boolean`, `validateClaimChange_(claim): Object`.
- Claim payload fields: `substituteId`, `handlingType`, `actualClassId`, `actualCourseName`, `category`, `difficulty`, `note`.

- [ ] **Step 1: Add failing structured-change tests**

Test original-course reuse, existing OB class selection, new class request, mandatory cross-apparatus course and note, optional same-apparatus note, and difficulty persistence.

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/backend-core.test.js --test-name-pattern="category|difficulty|change|note"`

- [ ] **Step 3: Implement server validation and append-only writes**

Read teacher capabilities from protected account data, enforce mandatory fields server-side, and write structured values to K+ columns while preserving H as the human-readable note.

- [ ] **Step 4: Implement complete claim controls and commit**

Use a handling-type option set, searchable existing OB class selector, fields for proposed new class/category/difficulty, and an always-available optional note. Make required state visible before submission.

Run: `node --test tests/backend-core.test.js tests/frontend-contract.test.js`

Commit: `feat: capture substitute course adjustments`

### Task 7: Cancellation, Withdrawal, Admin Work Queue, and OB Reconciliation

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces teacher POST actions: `cancelLeave`, `requestLeaveCancellation`, `requestClaimWithdrawal`.
- Produces admin actions: `resolveChangeRequest`, `getAdminDashboard`, `reconcileObChanges`, `linkReplacementCalendarItem`.

- [ ] **Step 1: Add failing state-transition tests**

Cover direct cancellation only before claim/OB work, approval-required cancellation after claim, withdrawal reason requirements, reopening after admin approval, complete audit history, matching OB teacher/course, mismatch reporting, and replacement calendar ID linking.

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/backend-core.test.js --test-name-pattern="cancel|withdraw|audit|reconcile|replacement"`

- [ ] **Step 3: Implement state transition services**

Centralize allowed transitions, lock each write, append audit records, and never delete the original leave row. Reopen approved withdrawals only after clearing active claim fields and recording the prior substitute in audit history.

- [ ] **Step 4: Implement reconciliation**

Compare the latest `CourseList` snapshot by calendar ID against expected substitute teacher and class. Mark exact matches with timestamp, leave mismatches as exceptions, and allow an admin-selected replacement ID for newly created OB classes.

- [ ] **Step 5: Build admin dashboard and teacher request UI**

Create tabs for pending invitations, active invitees, OB work, cancellation/withdrawal requests, exceptions, and completed records. Include manual sync, reconcile, per-teacher close, invitation message copy, and global pause controls.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/backend-core.test.js tests/frontend-contract.test.js`

Commit: `feat: add substitute operations dashboard`

### Task 8: Full Verification and Deployment Package

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`
- Modify: `tests/visual-check.mjs`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-08-03-substitute-system-v2.md`
- Modify: `docs/superpowers/specs/2026-08-03-substitute-system-v2-design.md`
- Modify: `docs/superpowers/plans/2026-08-03-substitute-system-v2-1.md`
- Modify: `.superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-brief.md`
- Modify: `.superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-report.md`

**Interfaces:**
- Produces: approved responsive frontend redesign, manual one-time 37-teacher password import, deployment/rollback checklist, and 22 desktop/mobile visual-state screenshots.
- Consumes: imported `密碼表` tab with headers `老師` and `密碼`, exactly 37 populated rows, and the existing protected `登入帳號` sheet.

- [x] **Step 1: Apply the user-approved visual redesign**

Redesign production `index.html` with the approved sea-glass operations UI while preserving all authenticated teacher/admin routes and workflows. Mobile navigation must stay in document flow and never cover long forms.

- [x] **Step 2: Add the one-time password import with TDD**

`importTeacherAccountsFromPasswordSheet` must:

- validate all 37 rows, four-digit PINs, required headers, and duplicate names before mutation;
- hash every PIN through the existing Salt/SHA-256 account primitive and expose no Web route;
- create new accounts as active role `老師` with blank capabilities;
- update only Salt/PIN hash for an existing account while preserving role, active state, login protection, and capabilities;
- snapshot the full account target range, source PIN range, and completion property;
- compensate all three stores after any account-write, clear, or property failure, and explicitly report rollback failures;
- preserve source names/tab and clear plaintext PINs only after the account batch succeeds.

- [x] **Step 3: Extend bounded visual-state checks**

Run one continuous desktop and one continuous mobile viewport journey. Capture 11 states per viewport, covering login, date/multi-course confirmation, personal histories, cross-apparatus claim form, and six admin tabs. The result is 22 visual states/screenshots, not 22 independent end-to-end journeys. Write behavior is covered by backend unit and frontend contract tests.

- [x] **Step 4: Finalize deployment, rollback, and historical docs**

README must include teacher data preparation, first-admin ordering, password import, Sheet migration, Script Properties, GAS version/deployment, GitHub Pages commit, manual sync, compatible-pair rollback, pre-deployment Sheet restoration for legacy names, and login/read/write smoke checks. Mark v2 docs as historical and remove any actionable periodic-sync instructions.

- [x] **Step 5: Run complete automated checks**

Run:

```bash
node --check tests/backend-core.test.js
node --test tests/backend-core.test.js tests/frontend-contract.test.js
node tests/visual-check.mjs
```

Expected: all tests pass; 22 screenshots are nonblank; no horizontal overflow, clipped tested controls, or mobile-navigation overlap.

- [x] **Step 6: Inspect production, secret, and operational-doc scans**

Run:

```bash
rg -n "eyJ[A-Za-z0-9_-]{20,}|NH8fg[c]sl|OMCEAN_API_TOKEN\s*[:=]\s*['\"]|no-cors" Code.gs index.html README.md
rg -n "ScriptApp\.newTri[g]ger|everyHou[r]s\(|timeBas[e]d\(|每.{0}小時" Code.gs index.html README.md docs/superpowers .superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-brief.md .superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-report.md
rg -n "工作表1" Code.gs index.html README.md docs/superpowers .superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-brief.md .superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-report.md
git diff --check
```

Expected: no embedded token, no `no-cors`, and no periodic-sync installation instruction in production or operational docs. `工作表1` may appear only in historical/migration warnings and the intentional migration constant.

- [x] **Step 7: Update report and commit**

Record exact test counts and visual evidence in `task-8-report.md`. Commit all production, test, documentation, brief, and report changes together after fresh verification.

**Safety acceptance criteria:** an imported first administrator remains active and can access an admin route; injected account-write, PIN-clear, and completion-property failures leave no partial state; rollback failure names the store that could not be restored; existing Sheet indexes and the approved redesign remain unchanged.
