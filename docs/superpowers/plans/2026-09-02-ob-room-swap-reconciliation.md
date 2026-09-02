# OB Room Swap Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect A/B and C/D OB course swaps during sync, require administrator confirmation, preserve all leave/claim state, and update effective course mappings plus notifications safely.

**Architecture:** Compare the current `CourseList` snapshot with the normalized incoming OB rows before replacement, persist unambiguous and manual-review candidates in a system-owned `課程調整` sheet, and expose candidates in a new admin tab. Confirmation runs under the existing script lock, revalidates both OB and leave rows, writes only effective mapping fields by substitute ID, records an audit group, then sends consolidated OneSignal notifications without rolling back successful data changes when notification delivery fails.

**Tech Stack:** Google Apps Script V8, Google Sheets, static HTML/CSS/JavaScript PWA, Node.js `node:test`, OneSignal Web Push.

**Spec:** `docs/superpowers/specs/2026-09-02-ob-room-swap-reconciliation-design.md`

## Global Constraints

- OB remains read-only for this feature; the system must not create, delete, or edit OB courses.
- Automatic pairing is limited to `A ↔ B` and `C ↔ D` on the same date; start times may differ.
- Detection creates a candidate only. No leave, invitation, claim, VVIP, or payroll mapping changes until a course administrator confirms.
- Existing human-entered Sheet rows must never be cleared, moved, or whole-sheet overwritten.
- Existing `請假代課紀錄` columns keep their indexes; any new columns are appended to the right.
- Every mutation resolves exact substitute IDs and Calendar IDs, runs under the script lock, and rolls back the whole confirmation group when a Sheet write fails.
- Push failure does not roll back a confirmed swap, but must create an administrator-visible failure record.
- Development uses targeted tests; one full test run happens before production release.

---

### Task 1: Add swap data contracts and pure detection logic

**Files:**
- Modify: `Code.gs` near `SHEETS`, `SHEET_HEADERS`, `ensureSystemStructure_`, and the OB course normalization helpers
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: normalized CourseList rows shaped as `[日期, 時間, 課程, 指導者, OB Calendar ID, OB Class ID, OB 老師 ID, 是否代課, 最後同步時間]`
- Produces: `detectCourseAdjustmentCandidates_(beforeRows, afterRows) -> Array<CourseAdjustmentCandidate>`
- Produces: `getCourseAdjustmentRoomPair_(room) -> "A/B" | "C/D" | ""`
- Produces: system sheet `課程調整` with append-only headers

- [ ] **Step 1: Write failing backend tests for supported and rejected pairings**

Add focused tests whose fixtures include:

```js
const beforeRows = [
  ['2026/09/18', '18:30', 'C－空環 Lv.1', '老師甲', 'cal-c', 'class-ring', 'teacher-a', '否', 'old'],
  ['2026/09/18', '18:45', 'D－舞綢 Lv.2', '老師乙', 'cal-d', 'class-silk', 'teacher-b', '否', 'old'],
];
const afterRows = [
  ['2026/09/18', '18:30', 'C－舞綢 Lv.2', '老師乙', 'cal-c', 'class-silk', 'teacher-b', '否', 'new'],
  ['2026/09/18', '18:45', 'D－空環 Lv.1', '老師甲', 'cal-d', 'class-ring', 'teacher-a', '否', 'new'],
];
```

Assert one C/D candidate is produced even though times differ. Add A/B coverage and assert A/C, single-row edits, missing IDs, three-way ambiguity, different dates, and non-crossed class identities do not produce an auto-confirmable candidate.

- [ ] **Step 2: Run the focused tests and observe the expected failure**

Run:

```bash
node --test --test-name-pattern='course adjustment|room swap' tests/backend-core.test.js
```

Expected: FAIL because the new sheet contract and detection helpers do not exist.

- [ ] **Step 3: Add the data model and detection helpers**

Add:

```js
SHEETS.COURSE_ADJUSTMENTS = '課程調整';
SHEET_HEADERS.COURSE_ADJUSTMENTS = [
  '調課群組 ID', '偵測版本', '日期', '教室配對', '調整前 JSON', '調整後 JSON',
  '建議配對 JSON', '狀態', '判斷原因', '建立時間', '確認時間', '確認者',
  '忽略原因', '通知狀態', '通知錯誤'
];
```

Implement deterministic candidate IDs from the two sorted Calendar IDs plus the incoming sync timestamp/version. Course identity comparison must prefer Class ID and fall back to the course name without an A-D prefix plus instructor identity. Return `auto` only for a unique two-way crossing inside one allowed room pair; return no candidate for unrelated edits.

- [ ] **Step 4: Extend structure setup without changing existing column indexes**

Update `ensureSystemStructure_()` to create or append-validate `課程調整`. Append these columns to `SHEET_HEADERS.LEAVES` only after the existing index 27 fields:

```js
'調課群組 ID', '調課確認時間', '調課確認者'
```

Do not repurpose `替代 OB Calendar ID` or `實際開始時間`; they remain the effective mapping fields.

- [ ] **Step 5: Run focused backend tests**

Run the same `node --test --test-name-pattern` command. Expected: PASS.

- [ ] **Step 6: Commit the self-contained contract and detector**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: detect paired OB room adjustments"
```

### Task 2: Integrate detection into safe OB sync

**Files:**
- Modify: `Code.gs` in `syncCourseListFromApi`, snapshot/restore helpers, and audit handling
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `detectCourseAdjustmentCandidates_(beforeRows, afterRows)` from Task 1
- Produces: `persistCourseAdjustmentCandidatesUnlocked_(sheet, candidates, actor, syncVersion)`
- Extends: `syncCourseListFromApi(sessionToken)` result with `courseAdjustmentCandidates`

- [ ] **Step 1: Write failing tests for sync-time candidate persistence**

Test that sync reads old CourseList rows before replacement, writes normalized new rows, appends one candidate to `課程調整`, and returns a count. Verify a duplicate synchronization does not append the same candidate again. Inject a candidate-sheet write failure and assert CourseList is restored from its snapshot and no partial adjustment row remains.

- [ ] **Step 2: Run focused sync tests and observe failure**

```bash
node --test --test-name-pattern='sync.*course adjustment|course adjustment.*sync' tests/backend-core.test.js
```

Expected: FAIL because synchronization does not persist candidates.

- [ ] **Step 3: Compare old and incoming rows inside the existing lock**

Within `syncCourseListFromApi`, after acquiring the lock and before replacing CourseList:

```js
var beforeRows = sheet.getDataRange().getValues().slice(1).filter(function(row) {
  return cleanText_(row[4]);
});
var adjustmentCandidates = detectCourseAdjustmentCandidates_(beforeRows, rows);
```

Capture snapshots for both CourseList and `課程調整`; persist candidate groups and CourseList in one guarded transition. On any write failure restore both snapshots before throwing.

- [ ] **Step 4: Include candidate count in sync output and audit**

Return:

```js
{
  status: 'success',
  count: normalized.length,
  dateFrom: range.dateFrom,
  dateTo: range.dateTo,
  courseAdjustmentCandidates: adjustmentCandidates.length
}
```

The normal sync audit reason records the candidate count without changing the existing successful row count.

- [ ] **Step 5: Run focused backend tests**

Run the sync pattern command. Expected: PASS.

- [ ] **Step 6: Commit sync integration**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: capture room swaps during OB sync"
```

### Task 3: Add administrator confirmation, dismissal, and atomic remapping

**Files:**
- Modify: `Code.gs` in `doPost`, admin dashboard construction, leave-row conversion, reconciliation, push helpers, and setup
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `getPendingCourseAdjustments_(session) -> Array<AdminCourseAdjustment>`
- Produces: `confirmCourseAdjustment_(session, adjustmentGroupId, manualMappings) -> ConfirmationResult`
- Produces: `dismissCourseAdjustment_(session, adjustmentGroupId, reason) -> { adjustmentGroupId, status }`
- Consumes: optional `manualMappings` JSON array of `{ substituteId, effectiveCalendarId }`

- [ ] **Step 1: Write failing tests for every leave-state combination**

Cover:

```text
two pending / one claimed + one pending / two claimed / only one leave row
```

For every case assert original course, original time, original Calendar ID, invitation state, invited teachers, and substitute teacher are unchanged. Assert only `替代 OB Calendar ID`, `實際開始時間`, computed delay minutes, and the three appended adjustment metadata columns change.

- [ ] **Step 2: Add failing validation and rollback tests**

Assert confirmation rejects stale CourseList data, a crossed room pair outside A/B or C/D, duplicate effective Calendar IDs, missing substitute IDs, already finalized payroll months, and a group already confirmed or dismissed. Inject the second leave-row write failure and assert the first row plus adjustment status are restored.

- [ ] **Step 3: Run confirmation tests and observe failure**

```bash
node --test --test-name-pattern='confirm course adjustment|dismiss course adjustment' tests/backend-core.test.js
```

Expected: FAIL because the actions do not exist.

- [ ] **Step 4: Implement exact-ID confirmation under one script lock**

Resolve the adjustment group, re-read current CourseList and leave rows, build mappings from the confirmed candidate or explicit manual mapping, and validate the whole group before writing. Update exact rows by substitute ID, set the group status to `已確認`, append one group audit plus one audit per affected substitute ID, and ensure `getObExpectation_`, `toAdminLeaveItem_`, VVIP resolution, and payroll Calendar-ID resolution all prefer the effective replacement ID.

- [ ] **Step 5: Recalculate time and delay occupation safely**

For mapped rows set `實際開始時間` from the effective OB course and recompute `延後分鐘數` relative to the original time. Re-run the existing delay-occupation relationship only when the confirmed new time changes the overlap result; use substitute IDs for exact affected rows and never create a second payroll source.

- [ ] **Step 6: Implement notifications after the committed mutation**

Group affected claimed rows by substitute teacher and call `sendPushAfterMutationSafely_` once per teacher with a message containing each course's date, original time/room, and new time/room. Store `已送出`, `未設定`, or `失敗` plus the error in the adjustment row. Push failure does not throw after the Sheet transition succeeds.

- [ ] **Step 7: Add protected POST actions and dashboard data**

Add `confirmCourseAdjustment` and `dismissCourseAdjustment` to `doPost` with `course_admin` enforcement. Include pending/manual-review course adjustments in `getAdminDashboard_()` without altering unrelated dashboard arrays.

- [ ] **Step 8: Run focused backend tests**

Run both confirmation and detection test patterns. Expected: PASS.

- [ ] **Step 9: Commit administrator mutation flow**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: confirm room swaps without resetting claims"
```

### Task 4: Add the mobile-friendly adjustment confirmation UI

**Files:**
- Modify: `index.html` admin tab markup, reminder counts, dashboard rendering, action delegation, and responsive CSS
- Test: `tests/frontend-contract.test.js`
- Test: `tests/morandi-visual-contract.test.js`

**Interfaces:**
- Consumes: `adminDashboard.courseAdjustments`
- Calls: `confirmCourseAdjustment` with `{ adjustmentGroupId, mappings }`
- Calls: `dismissCourseAdjustment` with `{ adjustmentGroupId, reason }`

- [ ] **Step 1: Write failing frontend contract tests**

Assert the admin tab has `data-admin-tab="courseAdjustments"`, capability `course_admin`, a queue badge, reminder integration, before/after fields for both rows, and buttons for confirm, manual pairing, and dismiss. Assert POST calls use the exact action names and dashboard refreshes after success.

- [ ] **Step 2: Run focused frontend tests and observe failure**

```bash
node --test --test-name-pattern='course adjustment|room swap' tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
```

Expected: FAIL because the tab and renderers do not exist.

- [ ] **Step 3: Add the tab, reminder, and count**

Insert `調課確認` beside `待處理 OB`, include `data-admin-count="courseAdjustments"`, and add it to `buildAdminReminderItems()` when pending count is greater than zero. The normal OB sync completion notice includes `發現 N 組待確認調課` when applicable.

- [ ] **Step 4: Render candidate cards for desktop and mobile**

Each card presents two compact rows:

```text
原 C 18:30 → 新 D 18:45
原 D 18:45 → 新 C 18:30
```

Show course, original teacher, substitute teacher, claim status, and Calendar IDs in expandable details. Manual mapping uses same-date OB choices limited to the candidate's room pair. Dismissal requires a reason dialog.

- [ ] **Step 5: Implement delegated actions and refresh behavior**

Disable the clicked button while sending, surface stale-data and validation errors in the existing notice, and refresh only the admin dashboard after success. Confirmation text reports whether teacher push was sent or needs manual follow-up.

- [ ] **Step 6: Run frontend contract tests**

Run the focused frontend command. Expected: PASS.

- [ ] **Step 7: Commit the UI**

```bash
git add index.html tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
git commit -m "feat: add course adjustment confirmation workspace"
```

### Task 5: Cross-flow regression and production release

**Files:**
- Verify: `Code.gs`, `index.html`, all test files
- Update only if required by failures: `tests/backend-core.test.js`, `tests/frontend-contract.test.js`, `tests/morandi-visual-contract.test.js`, `tests/pwa-contract.test.js`

**Interfaces:**
- Consumes all prior tasks
- Produces a production-ready GitHub main commit and a new immutable GAS version on the existing deployment ID

- [ ] **Step 1: Run targeted cross-flow tests**

```bash
node --test --test-name-pattern='course adjustment|room swap|replacement calendar|reconcile OB|VVIP|payroll|delay' tests/backend-core.test.js tests/frontend-contract.test.js
```

Expected: PASS.

- [ ] **Step 2: Run the complete suite once**

```bash
node --test --test-reporter=dot tests/*.test.js
```

Expected: exit code 0.

- [ ] **Step 3: Run static and visual verification**

```bash
git diff --check
node tests/visual-check.mjs
```

Inspect at least one desktop and one mobile screenshot of `調課確認`, including a one-claimed/one-pending fixture. Confirm no horizontal overflow, clipped controls, or inaccessible action labels.

- [ ] **Step 4: Verify release scope and data safety**

Confirm the final diff contains only the design/plan and intended `Code.gs`, `index.html`, and related tests. Confirm no setup function has been run against production and no formal Sheet rows were modified during development.

- [ ] **Step 5: Fast-forward GitHub main**

Fetch `origin/main`, verify the feature branch contains it without unrelated conflicts, then push the verified HEAD to `main`. Record the resulting commit hash.

- [ ] **Step 6: Deploy the existing GAS Web App safely**

Copy `Code.gs` byte-for-byte into the known release workspace, run `clasp push --force`, create a new immutable version, and update only deployment:

```text
AKfycbyJADHe_DZdNIbfv_KPewAcBekEond-5Fw63i-RWCd1mHl_O9uGAQ-LTnzENZshjnhe
```

Do not execute `setupSystemStructure` or any Sheet migration automatically. The production UI should display a clear one-time administrator setup requirement until the administrator explicitly authorizes creation of `課程調整` and appended leave headers.

- [ ] **Step 7: Verify production without mutating Sheet data**

Confirm the live GitHub Pages HTML contains `courseAdjustments`, confirm clasp reports the new deployment version, and perform only read-only health checks. Report Git commit, GAS version, tests, and exact Sheet impact.
