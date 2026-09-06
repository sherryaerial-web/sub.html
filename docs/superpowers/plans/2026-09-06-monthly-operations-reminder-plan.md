# Monthly Operations Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Taipei-time monthly operations timeline that calculates every phase from the second-to-last Friday, sends fixed reminders once, and lets course administrators safely perform the leave and substitute/special-course transitions.

**Architecture:** Keep the existing large-file GAS and static-page structure. Add pure calendar/timeline helpers plus versioned Script Properties state in `Code.gs`, reuse the existing five-minute `runCourseClosureScheduler`, existing account-derived recipient lists, inbox, OneSignal, settings rows, invitation rows, VVIP state, and audit log. Extend the existing notification-center response and renderer rather than creating another admin page or another Apps Script trigger.

**Tech Stack:** Google Apps Script, Google Sheets-compatible fixtures, vanilla HTML/CSS/JavaScript, Node.js `node:test` and `vm` contract tests.

**Spec:** `docs/superpowers/specs/2026-09-06-monthly-operations-reminder-design.md`

## Global Constraints

- All date calculations and due checks use `Asia/Taipei`.
- `D` is the second-to-last Friday of the selected calendar month.
- Day 1 and day 5 at 21:00 notify all active teachers; course adjustment remains notification-only.
- Day 7, VVIP preparation/open/close, and general-booking reminders notify active course administrators only.
- Leave and substitute/special-course state changes are manual, confirmed, permission-checked, and idempotent.
- Closing leave and opening substitute/special-course remain two separate actions.
- Ordinary substitute and special-course access open and close together.
- Substitute/special-course stays open at least five days when possible, may overlap VVIP, and warns when the `D - 2 days 21:00` latest target cannot be met.
- No Email is sent.
- Reuse the single existing five-minute trigger; do not create another trigger.
- Do not add, move, clear, or whole-sheet overwrite formal Google Sheets data or change existing column indexes.
- New monthly state and editable templates live in versioned Script Properties.
- Do not push GitHub, run `clasp push --force`, update a production GAS deployment, send a formal notification, or write formal Sheet data without a separate release authorization.

---

### Task 1: Pure Monthly Calendar and Timeline Model

**Files:**
- Modify: `tests/backend-core.test.js`
- Modify: `Code.gs` near `isNotificationScheduleDue_` and notification configuration helpers

**Interfaces:**
- Produces: `normalizeMonthlyOperationsMonthKey_(monthKeyValue) -> "YYYY-MM"`
- Produces: `getSecondLastFridayDateKey_(monthKeyValue) -> "YYYY-MM-DD"`
- Produces: `getMonthlyOperationsSchedule_(monthKeyValue, openedAtValue) -> { month, bookingDate, courseAdjustmentStartAt, courseAdjustmentEndAt, leaveOpenReminderAt, leaveSuggestedCloseAt, leaveDeadlineAdminReminderAt, substituteIdealCloseAt, substituteMinimumCloseAt, substituteLatestCloseAt, substituteSuggestedCloseAt, vvipPrepareAt, vvipOpenAt, vvipCloseAt, generalBookingAt, substituteScheduleConflict }`
- Produces: `getMonthlyOperationDueEventIds_(dateKeyValue, timeValue, contextValue) -> string[]`

- [ ] **Step 1: Add literal date-boundary tests that fail because the helpers do not exist**

Add tests whose expected dates are hand-derived rather than calculated by production helpers:

```js
test('monthly operations derives the second-to-last Friday and dynamic phase dates in Taipei time', () => {
  const backend = loadBackend();
  assert.deepEqual(JSON.parse(JSON.stringify(backend.getMonthlyOperationsSchedule_('2026-09', '2026-09-11 21:00:00'))), {
    month: '2026-09',
    bookingDate: '2026-09-18',
    courseAdjustmentStartAt: '2026-09-01 21:00',
    courseAdjustmentEndAt: '2026-09-05 21:00',
    leaveOpenReminderAt: '2026-09-07 21:00',
    leaveSuggestedCloseAt: '2026-09-11 21:00',
    leaveDeadlineAdminReminderAt: '2026-09-10 21:00',
    substituteIdealCloseAt: '2026-09-13 21:00',
    substituteMinimumCloseAt: '2026-09-16 21:00',
    substituteLatestCloseAt: '2026-09-16 21:00',
    substituteSuggestedCloseAt: '2026-09-16 21:00',
    vvipPrepareAt: '2026-09-13 21:00',
    vvipOpenAt: '2026-09-14 21:00',
    vvipCloseAt: '2026-09-17 21:00',
    generalBookingAt: '2026-09-18 21:00',
    substituteScheduleConflict: false,
  });
});

test('monthly operations handles five-Friday months and reports an impossible five-day substitute window', () => {
  const backend = loadBackend();
  assert.equal(backend.getSecondLastFridayDateKey_('2026-10'), '2026-10-23');
  assert.equal(backend.getSecondLastFridayDateKey_('2026-11'), '2026-11-20');
  const late = backend.getMonthlyOperationsSchedule_('2026-10', '2026-10-20 22:00:00');
  assert.equal(late.substituteMinimumCloseAt, '2026-10-25 22:00');
  assert.equal(late.substituteSuggestedCloseAt, '2026-10-21 21:00');
  assert.equal(late.substituteScheduleConflict, true);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern='monthly operations derives|monthly operations handles' tests/backend-core.test.js
```

Expected: FAIL because `getMonthlyOperationsSchedule_` and `getSecondLastFridayDateKey_` are not defined.

- [ ] **Step 3: Implement the pure calendar helpers**

Use UTC calendar arithmetic for date-only values, then emit explicit Taipei wall-clock strings. The public helper shapes must match the interfaces above. The due helper must compare a supplied `dateKey` and `HH:mm` against schedule timestamps and return only events in the existing five-minute window:

```js
function getMonthlyOperationDueEventIds_(dateKeyValue, timeValue, contextValue) {
  var schedule = getMonthlyOperationsSchedule_(dateKeyValue.slice(0, 7), contextValue && contextValue.substituteOpenedAt);
  var candidates = [
    ['course_adjustment_start', schedule.courseAdjustmentStartAt],
    ['course_adjustment_end', schedule.courseAdjustmentEndAt],
    ['leave_open_admin', schedule.leaveOpenReminderAt],
    ['leave_deadline_admin', schedule.leaveDeadlineAdminReminderAt],
    ['leave_close_admin', schedule.leaveSuggestedCloseAt],
    ['vvip_prepare_admin', schedule.vvipPrepareAt],
    ['vvip_open_admin', schedule.vvipOpenAt],
    ['vvip_close_admin', schedule.vvipCloseAt],
    ['general_booking_admin', schedule.generalBookingAt]
  ];
  return candidates.filter(function(item) {
    return isMonthlyOperationsTimestampDue_(item[1], dateKeyValue, timeValue);
  }).map(function(item) { return item[0]; });
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the same command and expect both tests to pass.

- [ ] **Step 5: Commit the pure model**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: calculate monthly operations timeline"
```

### Task 2: Versioned State, Templates, and Automatic Notifications

**Files:**
- Modify: `tests/backend-core.test.js`
- Modify: `Code.gs` near notification schedule persistence and `runScheduledNotifications_`

**Interfaces:**
- Consumes: `getMonthlyOperationsSchedule_`, `getMonthlyOperationDueEventIds_`
- Produces: `getMonthlyOperationsState_(monthKeyValue) -> { month, events, operations, substituteOpenedAt }`
- Produces: `saveMonthlyOperationsState_(monthKeyValue, stateValue) -> object`
- Produces: `getMonthlyOperationsTemplates_() -> Record<string, { heading, content, audienceMode }>`
- Produces: `saveMonthlyOperationsTemplates_(session, templatesValue) -> Record<string, ...>`
- Produces: `runMonthlyOperationsNotifications_(dateKeyValue, timeValue) -> { sentCount, skippedCount, failedCount, items }`

- [ ] **Step 1: Add failing behavior tests for automatic recipients, dedupe, and retry**

Create tests with a real in-memory Script Properties service and the existing notification backend fixture. Extend `createNotificationBackend()` to return its existing `spreadsheet` fixture; do not add any sheet:

```js
test('monthly automatic reminders use fixed audiences and persist one completion per event', () => {
  const { backend, services } = createNotificationBackend();
  const deliveries = [];
  backend.sendPushNotificationSafely_ = (names, message) => {
    deliveries.push({ names: Array.from(names), eventKey: message.eventKey });
    return { attempted: true, accepted: true, delivered: names.length, messageId: `push-${deliveries.length}`, error: '' };
  };
  assert.equal(backend.runMonthlyOperationsNotifications_('2026-10-01', '21:03').sentCount, 1);
  assert.equal(backend.runMonthlyOperationsNotifications_('2026-10-01', '21:04').sentCount, 0);
  assert.deepEqual(deliveries[0].names, ['冠蓉', 'Tako', 'Jina']);
  assert.equal(backend.runMonthlyOperationsNotifications_('2026-10-07', '21:00').sentCount, 1);
  assert.deepEqual(deliveries[1].names, ['冠蓉', 'Tako']);
  assert.match(services.PropertiesService.getScriptProperties().getProperty('MONTHLY_OPERATIONS_V1_2026_10'), /course_adjustment_start/);
});

test('a failed monthly automatic reminder remains retryable without duplicating its inbox event', () => {
  const { backend } = createNotificationBackend();
  let attempts = 0;
  backend.sendPushNotificationSafely_ = () => (++attempts === 1)
    ? { attempted: true, accepted: false, delivered: 0, messageId: '', error: 'temporary' }
    : { attempted: true, accepted: true, delivered: 3, messageId: 'retry-ok', error: '' };
  assert.equal(backend.runMonthlyOperationsNotifications_('2026-11-05', '21:00').failedCount, 1);
  assert.equal(backend.runMonthlyOperationsNotifications_('2026-11-05', '21:01').sentCount, 1);
  assert.equal(attempts, 2);
});
```

Update the old day-4 hard-coded course-adjustment tests so they now prove day 1 and day 5 behavior rather than preserving obsolete behavior.

- [ ] **Step 2: Run the focused tests and verify RED**

```bash
node --test --test-name-pattern='monthly automatic reminders|failed monthly automatic reminder|monthly course adjustment reminder' tests/backend-core.test.js
```

Expected: FAIL because the new state, templates, and automatic runner do not exist and the old day-4 behavior still runs.

- [ ] **Step 3: Implement versioned properties and event dispatch**

Add configuration keys:

```js
MONTHLY_OPERATIONS_PROPERTY_PREFIX: 'MONTHLY_OPERATIONS_V1_',
MONTHLY_OPERATIONS_TEMPLATES_PROPERTY: 'MONTHLY_OPERATIONS_TEMPLATES_V1'
```

Default templates must include the six approved teacher messages plus the admin reminders. Validate headings with the existing 80-character limit and content with the existing 500-character limit. `saveMonthlyOperationsTemplates_` must require `course_admin` and merge only known template IDs.

`runMonthlyOperationsNotifications_` must:

1. Build this month's schedule from the supplied date.
2. Skip an event already marked `sentAt`.
3. Skip `leave_open_admin` after `open_leave` is completed.
4. Skip leave deadline/close reminders after `close_leave` is completed.
5. Resolve `all` through `getActiveAccountTeacherNames_` and `admins` through `getActiveCourseAdminNames_` by using `sendManagedNotification_`.
6. Use event key `monthly_operations_<YYYYMM>_<eventId>`.
7. Mark `sentAt` only when the batch is accepted; preserve `lastError` otherwise.

Replace the obsolete `isCourseAdjustmentReminderDue_` branch in `runScheduledNotifications_` with a call to the monthly runner, then add its counts to the custom-schedule counts. Keep user-created fixed schedules untouched.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the same focused command and expect all monthly notification tests to pass.

- [ ] **Step 5: Verify scheduler integration does not create a second trigger**

```bash
node --test --test-name-pattern='course closure scheduler installer|monthly automatic reminders' tests/backend-core.test.js
```

Expected: PASS; installer still creates one `runCourseClosureScheduler` trigger only.

- [ ] **Step 6: Commit state and automatic notifications**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: schedule monthly operations reminders"
```

### Task 3: Idempotent Manual Phase Operations

**Files:**
- Modify: `tests/backend-core.test.js`
- Modify: `Code.gs` near `openInvitations_`, pause helpers, and API action routing

**Interfaces:**
- Consumes: `getMonthlyOperationsState_`, `saveMonthlyOperationsState_`, `getMonthlyOperationsTemplates_`
- Modifies: `openInvitations_(session, teacherNames, optionsValue)` with optional `{ suppressNotification: boolean }`
- Produces: `executeMonthlyOperation_(session, actionValue) -> { action, month, completed, alreadyCompleted, operationalState, notification }`
- Produces API action: `executeMonthlyOperation` with parameter `monthlyOperationAction`
- Produces API action: `saveMonthlyOperationsTemplates` with JSON parameter `templates`

- [ ] **Step 1: Add failing tests for authorization, state transitions, notification ordering, and duplicate clicks**

Add this concrete wrapper around the existing complete invitation fixture; it already supplies Accounts, Settings, Invitations, Audit, CourseList, leave, special-course, and VVIP sheets. Notification message/recipient sheets may be created by the existing append-only notification helper exactly as they are in production:

```js
function createMonthlyOperationsBackend(options = {}) {
  const fixture = createInvitationBackend({ nextMonth: '2026-09', ...options });
  fixture.backend.currentTimeMs_ = () => new Date('2026-09-07T21:00:00+08:00').getTime();
  fixture.adminSession = fixture.backend.requireSession_(fixture.adminToken);
  fixture.teacherSession = fixture.backend.requireSession_(fixture.teacherAToken);
  fixture.completeLeavePhase = () => {
    fixture.backend.executeMonthlyOperation_(fixture.adminSession, 'open_leave');
    fixture.backend.executeMonthlyOperation_(fixture.adminSession, 'close_leave');
  };
  return fixture;
}
```

Stub only the external OneSignal transport. Include these observable cases:

```js
test('opening leave changes the real leave setting before notifying all active teachers and is idempotent', () => {
  const fixture = createMonthlyOperationsBackend();
  const order = [];
  fixture.backend.sendPushNotificationSafely_ = () => {
    order.push(fixture.backend.areLeavesPaused_() ? 'notified-while-paused' : 'notified-after-open');
    return { attempted: true, accepted: true, delivered: 3, messageId: 'leave-open', error: '' };
  };
  const first = fixture.backend.executeMonthlyOperation_(fixture.adminSession, 'open_leave');
  const second = fixture.backend.executeMonthlyOperation_(fixture.adminSession, 'open_leave');
  assert.equal(first.completed, true);
  assert.equal(second.alreadyCompleted, true);
  assert.deepEqual(order, ['notified-after-open']);
});

test('closing leave and opening substitute remain separate operations', () => {
  const fixture = createMonthlyOperationsBackend();
  fixture.backend.executeMonthlyOperation_(fixture.adminSession, 'open_leave');
  fixture.backend.executeMonthlyOperation_(fixture.adminSession, 'close_leave');
  assert.equal(fixture.backend.areClaimsPaused_(), true);
  assert.equal(fixture.backend.getMonthlyOperationsState_('2026-09').operations.open_substitute, undefined);
});

test('opening substitute resumes claims and opens one invitation per active teacher before one broadcast', () => {
  const fixture = createMonthlyOperationsBackend();
  fixture.completeLeavePhase();
  const result = fixture.backend.executeMonthlyOperation_(fixture.adminSession, 'open_substitute');
  assert.equal(fixture.backend.areClaimsPaused_(), false);
  assert.equal(result.operationalState.openInvitationCount, 3);
  assert.equal(result.notification.recipientCount, 3);
});
```

Also test `send_leave_deadline`, `close_substitute`, early-operation metadata, a non-admin rejection, and a simulated notification failure after a successful state transition.

- [ ] **Step 2: Run the focused tests and verify RED**

```bash
node --test --test-name-pattern='opening leave changes|closing leave and opening substitute|opening substitute resumes|monthly operation rejects|monthly notification failure' tests/backend-core.test.js
```

Expected: FAIL because `executeMonthlyOperation_` and the fixture-facing action contract do not exist.

- [ ] **Step 3: Implement the manual operation orchestrator**

Normalize to these exact actions:

```js
var MONTHLY_OPERATION_ACTIONS = [
  'open_leave',
  'send_leave_deadline',
  'close_leave',
  'open_substitute',
  'close_substitute'
];
```

For each action:

- Require `course_admin` and record `getSessionAuditActor_(session)`.
- Read current real settings/invitations before deciding what remains to do.
- `open_leave`: call the existing leave setting transition with `paused=false`, then send the approved all-teacher message.
- `send_leave_deadline`: send only the approved all-teacher reminder; do not change leave state.
- `close_leave`: call the existing leave setting transition with `paused=true`; do not open claims.
- `open_substitute`: require completed/actually closed leave; resume claims, call `openInvitations_` for every active teacher with `suppressNotification=true`, then send one approved all-teacher broadcast.
- `close_substitute`: pause claims, end the current invitation round, then send one all-teacher end message and one admin follow-up.

Operations are convergent: if one sub-step succeeded before a timeout, retry reads actual settings/invitations and completes only missing sub-steps. Save completion only after the requested operational state is true. A push failure does not roll back a completed state; save `notificationStatus: 'failed'` and allow the same action to retry the notification using the same inbox event key.

Add both POST action routes to `doPost`'s action map using the interfaces above.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the same focused command and expect all operation tests to pass.

- [ ] **Step 5: Run existing pause, invitation, and VVIP regression tests**

```bash
node --test --test-name-pattern='pause|invitation|VVIP' tests/backend-core.test.js
```

Expected: PASS; existing standalone controls still behave as before.

- [ ] **Step 6: Commit manual operations**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add monthly operations controls"
```

### Task 4: Notification Center Timeline and Template Editor

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `index.html` notification-center styles, renderer, fetch state, and delegated click/submit handlers
- Modify: `Code.gs` `getNotificationAdminDashboard_`

**Interfaces:**
- Consumes dashboard field: `monthlyOperations`
- Consumes dashboard field: `monthlyOperationsTemplates`
- Calls API: `executeMonthlyOperation` with `{ monthlyOperationAction }`
- Calls API: `saveMonthlyOperationsTemplates` with `{ templates }`
- Produces frontend functions: `renderMonthlyOperationsTimeline(data)`, `executeMonthlyOperation(action, label, early)`, `saveMonthlyOperationsTemplates()`

- [ ] **Step 1: Add failing backend dashboard and frontend interaction tests**

Backend dashboard test:

```js
test('notification dashboard exposes the computed monthly operations timeline without adding sheets', () => {
  const { backend, adminSession, spreadsheet } = createNotificationBackend();
  backend.currentTimeMs_ = () => new Date('2026-09-06T12:00:00+08:00').getTime();
  const before = spreadsheet.sheets.map((sheet) => sheet.getName());
  const dashboard = backend.getNotificationAdminDashboard_(adminSession);
  assert.equal(dashboard.monthlyOperations.bookingDate, '2026-09-18');
  assert.equal(dashboard.monthlyOperations.timezone, 'Asia/Taipei');
  assert.deepEqual(spreadsheet.sheets.map((sheet) => sheet.getName()), before);
});
```

Frontend test should render a fixture and assert the timeline is before manual push, recommended dates and status labels are visible, and clicking an enabled operation submits exactly one action:

```js
test('notification center renders monthly operations first and posts confirmed phase actions', async () => {
  const notificationDashboardFixture = {
    teachers: ['冠蓉', 'Tako', 'Jina'],
    administrators: ['冠蓉', 'Tako'],
    monthlyOperations: {
      month: '2026-09', timezone: 'Asia/Taipei', bookingDate: '2026-09-18',
      rows: [{ id: 'open_leave', label: '開放請假並通知', recommendedAt: '2026-09-07 21:00', status: 'ready', early: false }],
    },
    monthlyOperationsTemplates: {},
    closureWindows: [], schedules: [], history: [],
  };
  const runtime = createFrontendRuntime({
    executeMonthlyOperation: { action: 'open_leave', completed: true },
    getNotificationAdminDashboard: notificationDashboardFixture,
  });
  runtime.context.__notificationDashboardFixture = notificationDashboardFixture;
  vm.runInContext('notificationDashboard = __notificationDashboardFixture; renderNotificationAdminTab();', runtime.context);
  const rendered = runtime.getElement('admin-tab-content').innerHTML;
  assert.ok(rendered.indexOf('月度營運流程') < rendered.indexOf('手動推播'));
  await runtime.context.executeMonthlyOperation('open_leave', '開放請假並通知', false);
  assert.equal(runtime.submittedForms.filter((item) => item.fields.action === 'executeMonthlyOperation').length, 1);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

```bash
node --test --test-name-pattern='notification dashboard exposes the computed monthly|notification center renders monthly operations' tests/backend-core.test.js tests/frontend-contract.test.js
```

Expected: FAIL because the dashboard fields, renderer, and API call do not exist.

- [ ] **Step 3: Extend the dashboard response**

`getNotificationAdminDashboard_` must return:

```js
return {
  teachers: getActiveAccountTeacherNames_(),
  administrators: getActiveCourseAdminNames_(),
  monthlyOperations: getMonthlyOperationsDashboard_(),
  monthlyOperationsTemplates: getMonthlyOperationsTemplates_(),
  schedules: getNotificationSchedules_(),
  history: getNotificationHistory_(),
  closureWindows: [
    { stage: '第一輪', time: '22:30–22:34' },
    { stage: '第二輪', time: '23:40–23:44' }
  ]
};
```

For the test fixture only, return `spreadsheet` from `createNotificationBackend()` so the existing sheet list can be compared before and after the read. Do not call `ensure*Structure_()` from the dashboard read.

The monthly dashboard must reconcile Script Properties completion markers with real leave/claim/invitation/VVIP states and expose `needsSync` instead of rewriting either source.

- [ ] **Step 4: Implement the timeline UI and controls**

Render the monthly panel as the first child of `.notification-layout`. Each row shows label, recommended Taipei timestamp, status pill, operator/time, and any warning. Operation buttons use `data-admin-action="monthly-operation"` plus `data-monthly-operation-action` and show a confirmation dialog. Early actions include the sentence `此操作早於建議日期，仍要繼續嗎？`; ordinary due actions use `確定要執行「<label>」？`.

Add a compact `<details>` template editor under the timeline with fields for each known heading/content pair and a single `儲存月度通知文字` submit action. Do not expose recipient modes as editable fields; recipient modes are fixed by the approved rules.

VVIP timeline rows use a button that switches `activeAdminTab = 'vvip'`, updates tab state, and fetches the existing VVIP dashboard. They do not duplicate the VVIP state-change endpoint.

- [ ] **Step 5: Run focused backend and frontend tests and verify GREEN**

Run the same focused command and expect both tests to pass.

- [ ] **Step 6: Run all frontend contract tests**

```bash
node --test tests/frontend-contract.test.js
```

Expected: all tests pass with no unhandled promise rejection.

- [ ] **Step 7: Commit the interface**

```bash
git add Code.gs index.html tests/backend-core.test.js tests/frontend-contract.test.js
git commit -m "feat: show monthly operations in notification center"
```

### Task 5: Documentation and Release Verification

**Files:**
- Modify: `README.md`
- Modify only if verification reveals a defect: `Code.gs`, `index.html`, relevant tests

**Interfaces:**
- Documents the Script Properties keys, five-minute timing, recipients, manual actions, and formal-Sheet safety boundary.

- [ ] **Step 1: Update operator documentation**

Add a `月度營運流程` section that states:

```text
每月日期由倒數第二個星期五自動推算，時區固定 Asia/Taipei。1 日與 5 日自動通知全部在職老師；7 日與 VVIP／一般預約節點只提醒具 course_admin 權限的管理員。請假、代課／特別課、VVIP 開關仍需管理員手動確認。月度狀態與文字範本存於 Script Properties，不新增或改動正式試算表欄位。
```

Document that the existing single `runCourseClosureScheduler` trigger services both course-closure and monthly reminders, so operators must not install a second trigger.

- [ ] **Step 2: Run syntax and whitespace checks**

```bash
cp Code.gs /tmp/sherry-monthly-operations-Code.js
node --check /tmp/sherry-monthly-operations-Code.js
git diff --check
```

Expected: both commands exit 0.

- [ ] **Step 3: Run directly related tests**

```bash
node --test --test-name-pattern='monthly|notification|pause|invitation|VVIP|scheduler' tests/backend-core.test.js tests/frontend-contract.test.js
```

Expected: all selected tests pass.

- [ ] **Step 4: Run the full release suite once**

```bash
node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/pwa-contract.test.js tests/vvip-frontend.test.js
```

Expected: all tests pass. If an unrelated pre-existing operational-document test is missing a tracked artifact, confirm it is unrelated before excluding only that named test; do not suppress product failures.

- [ ] **Step 5: Inspect data and deployment boundaries**

```bash
git diff HEAD~4 -- Code.gs index.html README.md tests/backend-core.test.js tests/frontend-contract.test.js
git status --short --branch
```

Confirm the diff contains no new Sheet header, no changed existing header index, no API token, no formal data mutation command, no second trigger installer, and no deployment command.

- [ ] **Step 6: Commit documentation or final verification fixes**

```bash
git add README.md Code.gs index.html tests/backend-core.test.js tests/frontend-contract.test.js
git commit -m "docs: explain monthly operations workflow"
```

- [ ] **Step 7: Stop before release operations**

Report commit IDs, exact tests, and formal-Sheet impact. Ask separately before GitHub push, `clasp push --force`, updating the formal GAS deployment, or sending any live notification.
