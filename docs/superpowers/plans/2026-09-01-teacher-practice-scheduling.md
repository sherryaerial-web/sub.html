# Teacher Practice Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 在現有 Sherry Aerial PWA 完成可安全內部試用的老師自主練習排程，包含單次／循環、候補、共用、管理與 OB 衝突處理。

**Architecture:** 以 GAS 與新增 Google Sheet 工作表保存自主練習資料，沿用現有登入、權限、鎖定、稽核與 OneSignal 通知。前端在同一個 index.html 新增手機優先的單日時間軸；OB CourseList 是正式課程與場租的唯一排程來源，自主練習不寫回 OB。

**Tech Stack:** Google Apps Script、Google Sheets、Vanilla HTML/CSS/JavaScript、Node.js node:test、OneSignal Web Push。

**Spec:** docs/superpowers/specs/2026-09-01-teacher-practice-scheduling-design.md

## Global Constraints

- 所有時間計算與輸出固定使用 Asia/Taipei。
- 時間以 5 分鐘為刻度、最短 15 分鐘，正式課程、場租與自主練習前後各保留 15 分鐘。
- OB 正式課程優先於場租，場租優先於自主練習。
- 自主練習只使用新工作表；不得清空、整張覆寫或搬移既有正式 Sheet 人工資料。
- 所有異動使用唯一 ID 找明確列，並在 LockService 鎖內重新驗證。
- 第一階段不建立 OB 課程、不做學生公開頁、學生扣點、Tako 代學生登記或場租申請。
- 不加入離線快取。
- GitHub main、clasp push --force 與正式 GAS 部署仍需另取得明確允許。

---

### Task 1: 自主練習資料契約與純時間規則

**Files:**
- Modify: Code.gs
- Modify: tests/backend-core.test.js

**Interfaces:**
- Produces: PRACTICE_STATUS、PRACTICE_ROLE、五組 SHEETS／SHEET_HEADERS 常數。
- Produces: parsePracticeDateTime_(dateText, timeText): Date。
- Produces: normalizePracticeInterval_(date, startTime, endTime): object。
- Produces: practiceIntervalsConflict_(left, right, bufferMinutes): boolean。
- Produces: getPracticeQuickDurationOptions_(request, blockers): array。

- [ ] **Step 1: Write failing tests**

~~~js
test('practice intervals enforce five-minute steps and fifteen-minute minimum', () => {
  const context = loadBackend();
  assert.equal(context.normalizePracticeInterval_('2026/09/10', '14:05', '14:20').startTime, '14:05');
  assert.throws(() => context.normalizePracticeInterval_('2026/09/10', '14:03', '14:20'), /5 分鐘/);
  assert.throws(() => context.normalizePracticeInterval_('2026/09/10', '14:05', '14:15'), /至少 15 分鐘/);
});

test('practice conflicts include a fifteen-minute boundary buffer', () => {
  const context = loadBackend();
  const practice = context.normalizePracticeInterval_('2026/09/10', '14:00', '15:00');
  const blocked = context.normalizePracticeInterval_('2026/09/10', '15:10', '16:10');
  const allowed = context.normalizePracticeInterval_('2026/09/10', '15:15', '16:15');
  assert.equal(context.practiceIntervalsConflict_(practice, blocked, 15), true);
  assert.equal(context.practiceIntervalsConflict_(practice, allowed, 15), false);
});
~~~

- [ ] **Step 2: Verify RED**

Run: node --test --test-name-pattern='practice intervals|practice conflicts|practice quick durations' tests/backend-core.test.js

Expected: FAIL because the practice helpers do not exist.

- [ ] **Step 3: Implement minimal constants, headers and pure helpers**

Reject malformed dates, non-5-minute inputs, end-before-start and durations under 15 minutes. Generate only 60／90／120-minute quick options and mark conflicting choices unavailable with a reason.

- [ ] **Step 4: Verify GREEN and commit**

~~~bash
node --test --test-name-pattern='practice intervals|practice conflicts|practice quick durations' tests/backend-core.test.js
git add Code.gs tests/backend-core.test.js
git commit -m "feat: define teacher practice scheduling rules"
~~~

### Task 2: 安全工作表與單日讀取模型

**Files:**
- Modify: Code.gs
- Modify: tests/backend-core.test.js
- Modify: README.md

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces: ensurePracticeStructureUnlocked_(spreadsheet): object。
- Produces: getPracticeDay_(session, date): object。
- Produces: buildPracticeDayView_(records, courseRows, date): object。

- [ ] **Step 1: Write failing tests**

Test that ensureSystemStructure_ creates only missing practice sheets, preserves every existing formal row, rejects mismatched headers, returns A／B／C／D rooms, classifies 場地租借 separately, and never emits invalid dates.

~~~js
test('practice structure adds isolated sheets without changing CourseList rows', () => {
  const fixtures = createSpreadsheetFixture({
    CourseList: [EXPECTED_COURSE_HEADERS, ['2026/09/10', '14:00', 'A－空環', '老師甲', 'cal-1']],
  });
  const context = loadBackend({ SpreadsheetApp: { getActiveSpreadsheet: () => fixtures.spreadsheet } });
  context.ensureSystemStructure_();
  assert.deepEqual(fixtures.sheets.CourseList.values[1].slice(0, 5), ['2026/09/10', '14:00', 'A－空環', '老師甲', 'cal-1']);
  assert.ok(fixtures.sheets.PracticeBookings);
});
~~~

- [ ] **Step 2: Verify RED**

Run: node --test --test-name-pattern='practice structure|practice day view' tests/backend-core.test.js

- [ ] **Step 3: Implement idempotent setup and canonical read models**

Call ensurePracticeStructureUnlocked_ from ensureSystemStructure_. Read through header assertions. Build a day response with canonical Taipei strings, room, status, participants and linked OB Calendar ID. CourseList rows containing 場地租借 are rental blockers; other valid rows are formal-course blockers.

- [ ] **Step 4: Verify GREEN, document sheets and commit**

~~~bash
node --test --test-name-pattern='practice structure|practice day view' tests/backend-core.test.js
git add Code.gs tests/backend-core.test.js README.md
git commit -m "feat: add isolated practice schedule storage"
~~~

### Task 3: 建立、加入、退出、取消與循環

**Files:**
- Modify: Code.gs
- Modify: tests/backend-core.test.js

**Interfaces:**
- Produces: createPracticeBooking_(session, input): object。
- Produces: joinPracticeBooking_(session, input): object。
- Produces: leavePracticeBooking_(session, input): object。
- Produces: updatePracticeBooking_(session, input): object。
- Produces: expandPracticeSeriesUnlocked_(spreadsheet, throughDate): object。
- Produces: findPracticeConflictsUnlocked_(request, records, courseRows): array。

- [ ] **Step 1: Write failing mutation tests**

Cover single creation, weekly series, partial-time joining, duplicate joins, self-overlap, creator handoff, last-person release, one-occurrence exception, stop-from-date and lock-time revalidation.

~~~js
test('practice creator exit keeps participants and hands ownership to earliest joiner', () => {
  const fixture = createPracticeMutationFixture();
  fixture.create('老師甲', '14:00', '16:00');
  fixture.join('老師乙', '15:00', '16:00');
  const result = fixture.leave('老師甲');
  assert.equal(result.bookingStatus, '已成立');
  assert.equal(result.newCreatorName, '老師乙');
});
~~~

- [ ] **Step 2: Verify RED**

Run: node --test --test-name-pattern='practice create|practice join|practice creator|practice recurrence' tests/backend-core.test.js

- [ ] **Step 3: Implement mutations inside one script lock**

Derive the teacher from the session unless course_admin acting mode is valid. Reload all target rows inside the lock, validate the interval and blockers, update only UUID-matched rows, and append audit rows. Never auto-join from overlap. Resolve creator handoff by earliest active join timestamp, then UUID.

- [ ] **Step 4: Implement recurrence and exceptions**

Create occurrences only through the furthest valid CourseList date and no more than the 45-day reconciliation window. Preserve single-date exceptions, skip only conflicting weeks, and never recreate explicitly cancelled occurrences.

- [ ] **Step 5: Verify GREEN and commit**

~~~bash
node --test --test-name-pattern='practice create|practice join|practice creator|practice recurrence' tests/backend-core.test.js
git add Code.gs tests/backend-core.test.js
git commit -m "feat: manage shared recurring practice bookings"
~~~

### Task 4: 候補、OB 核對與通知待辦

**Files:**
- Modify: Code.gs
- Modify: tests/backend-core.test.js
- Modify: README.md

**Interfaces:**
- Produces: createPracticeWaitlist_(session, input): object。
- Produces: reconcilePracticeBookings_(options): object。
- Produces: runScheduledPracticeReconciliation(): object。
- Produces: recordPracticeNotificationFailureUnlocked_(event): void。

- [ ] **Step 1: Write failing candidate and reconciliation tests**

Prove candidate rows require an existing OB Calendar ID, activate only after a successful current snapshot confirms disappearance, stay pending while the course exists, cancel on a higher-priority blocker, and remain untouched when OB verification fails.

~~~js
test('practice reconciliation fails closed when OB cannot be verified', () => {
  const context = loadPracticeBackendFixture({ obError: new Error('OB unavailable') });
  assert.throws(() => context.reconcilePracticeBookings_({}), /無法確認 OB/);
  assert.equal(context.fixture.bookingStatus(), '候補');
});
~~~

- [ ] **Step 2: Verify RED**

Run: node --test --test-name-pattern='practice candidate|practice reconciliation|practice notification' tests/backend-core.test.js

- [ ] **Step 3: Implement fail-closed reconciliation**

Reconcile today through 45 days. Reuse the successful CourseList sync contract and never interpret API errors or invalid empty results as cancellation. Update exact UUID rows and append audit events within one locked transition.

- [ ] **Step 4: Implement notifications and failure queue**

Notify the creator on join/leave. Notify all active participants on candidate activation, creator handoff, admin changes and conflict cancellation. A push failure must create a manager work item but must not roll back booking data.

- [ ] **Step 5: Add trigger-safe entrypoint without auto-installing a production trigger**

runScheduledPracticeReconciliation must be safe for a 10-minute GAS time trigger. Deployment must not create or modify production triggers automatically.

- [ ] **Step 6: Verify GREEN and commit**

~~~bash
node --test --test-name-pattern='practice candidate|practice reconciliation|practice notification' tests/backend-core.test.js
git add Code.gs tests/backend-core.test.js README.md
git commit -m "feat: reconcile practice bookings with OB"
~~~

### Task 5: 受保護的後端路由

**Files:**
- Modify: Code.gs
- Modify: tests/backend-core.test.js

**Interfaces:**
- Produces POST actions: getPracticeDay, createPracticeBooking, joinPracticeBooking, leavePracticeBooking, updatePracticeBooking, cancelPracticeBooking, getPracticeAdminDashboard。

- [ ] **Step 1: Write failing authorization tests**

Assert every read requires a session, teacher mutations can affect only their own participation, acting mode works only for course administrators, and admin edits require course_admin.

- [ ] **Step 2: Verify RED**

Run: node --test --test-name-pattern='practice API|practice authorization' tests/backend-core.test.js

- [ ] **Step 3: Add narrow doPost handlers**

Parse date, time, room, booking UUID, series UUID and scope explicitly. Never trust a teacher name sent by an ordinary client; derive it from the session. Return canonical read models after successful mutations.

- [ ] **Step 4: Verify GREEN and commit**

~~~bash
node --test --test-name-pattern='practice API|practice authorization' tests/backend-core.test.js
git add Code.gs tests/backend-core.test.js
git commit -m "feat: expose protected practice scheduling APIs"
~~~

### Task 6: 老師端手機時間軸

**Files:**
- Modify: index.html
- Modify: tests/frontend-contract.test.js
- Modify: tests/morandi-visual-contract.test.js

**Interfaces:**
- Produces: renderPracticeView(data)、renderPracticeTimeline(data)、openPracticeEditor(context)、submitPracticeEditor()。

- [ ] **Step 1: Write failing frontend tests**

Verify role-aware navigation contains 自主練習; the view contains date strip, room tabs, 60／90／120-minute controls, default 60, candidate copy, join copy, participants, disabled conflicts, nearest alternatives and no month-grid UI.

~~~js
test('teacher practice view uses a mobile day timeline with safe duration choices', () => {
  assert.match(html, /id=["']view-practice["']/);
  assert.match(html, /60 分鐘/);
  assert.match(html, /90 分鐘/);
  assert.match(html, /120 分鐘/);
  assert.doesNotMatch(html, /30 分鐘/);
});
~~~

- [ ] **Step 2: Verify RED**

Run: node --test --test-name-pattern='practice view|practice timeline|practice editor' tests/frontend-contract.test.js tests/morandi-visual-contract.test.js

- [ ] **Step 3: Implement the mobile-first view**

Add navigation, date strip, A／B／C／D tabs, accessible timeline buttons, status cards and bottom-sheet editor. Empty slots default to nearest 5 minutes and 60 minutes. Course cards open candidate mode; practice cards open join/detail mode. Disable invalid actions with a visible reason.

- [ ] **Step 4: Connect reads and mutations**

Call getPracticeDay on view/date/room changes. Submit through protected POST actions, use existing notices, then reload the selected day. Reuse the current acting-mode parameter helper.

- [ ] **Step 5: Verify GREEN and commit**

~~~bash
node --test --test-name-pattern='practice view|practice timeline|practice editor' tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
git add index.html tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
git commit -m "feat: add mobile teacher practice timeline"
~~~

### Task 7: 管理員自主練習工作區

**Files:**
- Modify: index.html
- Modify: tests/frontend-contract.test.js
- Modify: tests/morandi-visual-contract.test.js

**Interfaces:**
- Consumes: getPracticeAdminDashboard, updatePracticeBooking, cancelPracticeBooking。
- Produces: admin tab practice and renderPracticeAdminDashboard(data)。

- [ ] **Step 1: Write failing admin tests**

Verify course administrators see filters, creator/participants and per-person times, recurrence/candidate states, audit history, notification failures and modify/cancel actions. Ordinary teachers must not see the tab.

- [ ] **Step 2: Verify RED**

Run: node --test --test-name-pattern='practice admin' tests/frontend-contract.test.js tests/morandi-visual-contract.test.js

- [ ] **Step 3: Implement admin tab and actions**

Reuse existing admin styling and delegated event handling. Require a visible reason for administrator cancellation or time/room changes. Refresh only the practice dashboard after a mutation and show the actual operator.

- [ ] **Step 4: Verify GREEN and commit**

~~~bash
node --test --test-name-pattern='practice admin' tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
git add index.html tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
git commit -m "feat: add practice scheduling administration"
~~~

### Task 8: 驗證與內部試用交付

**Files:**
- Modify: README.md
- Modify only if verification finds defects: Code.gs, index.html and related tests

- [ ] **Step 1: Run practice-focused tests**

~~~bash
node --test --test-name-pattern='practice' tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
~~~

- [ ] **Step 2: Run syntax checks**

~~~bash
node --check tests/backend-core.test.js
node --check tests/frontend-contract.test.js
cp Code.gs /tmp/sherry-practice-Code.js
node --check /tmp/sherry-practice-Code.js
~~~

- [ ] **Step 3: Run the complete automated suite once**

~~~bash
node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/pwa-contract.test.js tests/vvip-frontend.test.js
~~~

- [ ] **Step 4: Perform desktop and mobile visual checks**

Run the existing visual harness after UI work. Inspect teacher day view, create panel, join/detail panel and admin practice tab for horizontal overflow, bottom-navigation obstruction, clipped controls and readable status hierarchy.

- [ ] **Step 5: Update internal-trial instructions**

Document new sheet initialization, optional 10-minute reconciliation trigger, test-data-only onboarding, rollback boundary and the prohibition on writing practice data into formal OB/leave/payroll sheets.

- [ ] **Step 6: Commit documentation**

~~~bash
git add README.md
git commit -m "docs: prepare teacher practice internal trial"
~~~

- [ ] **Step 7: Stop before production actions**

Report commits, exact tests, visual verification and Sheet impact. Do not push main, force-push GAS, create production sheets, install a production trigger or deploy until the user explicitly approves.

