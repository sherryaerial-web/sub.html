# Special Course Claim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate ordinary OB course replacement from safe single-slot or two-slot special-course claims with duration and 15-minute turnover validation.

**Architecture:** Build the ordinary selector from recurring `CourseList` slots instead of the unfiltered OB classes catalog. Add backend-owned availability calculations and an atomic grouped special claim; append group metadata after the existing leave columns so all A:U indexes remain unchanged. Render a separate teacher-facing special-course flow and group matching rows in record/admin views.

**Tech Stack:** Google Apps Script, Google Sheets, static HTML/CSS/vanilla JavaScript, Node.js `node:test`, Playwright visual checks, clasp, GitHub Pages.

## Global Constraints

- Ordinary options recur at least twice for the same room, normalized course name, weekday, and start time in the current `CourseList` snapshot.
- A special course uses either one leave plus following vacancy or two same-date, same-room, consecutive open leaves.
- Duration is an integer from 30 through 240 minutes; 90 and 120 are quick choices.
- End time plus 15 minutes must be no later than the next unconsumed same-room course.
- Existing `請假代課紀錄` columns A:U and all current numeric indexes remain unchanged.
- Before production header changes, copy the production spreadsheet and verify the copy has a different file ID.
- Never clear or whole-sheet overwrite leave, substitute, payroll, VVIP, invitation, audit, settings, or account data.

---

### Task 1: Recurring ordinary-course catalog and availability primitives

**Files:**
- Modify: `Code.gs` (`getClaimOptions_`, course catalog helpers)
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `CourseList` rows with date, time, full course name, Calendar ID and Class ID.
- Produces: `buildRecurringClaimCourseOptions_(courseRows, capabilities): ClaimCourseOption[]`, `getSpecialCourseAvailability_(pendingRows, courseRows): object`, `parseExplicitCourseMinutes_(courseName): number`.

- [ ] **Step 1: Write failing backend tests**

Add fixtures with a recurring ordinary yoga class, a one-off `椅子瑜伽（90min）`, and recurring `綢吊 Lv.0-2（90分）`. Assert the ordinary result contains recurring yoga and recurring 90-minute silk, excludes the one-off 90-minute item and any name containing `特別課`, and exposes room/date/time metadata needed for special availability.

```js
assert.deepEqual(options.map(item => item.courseName), [
  '原始瑜伽',
  '綢吊 Lv.0-2（90分）'
]);
assert.equal(backend.parseExplicitCourseMinutes_('椅子瑜伽（90min）'), 90);
assert.equal(backend.parseExplicitCourseMinutes_('空環 Lv.1'), 0);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern="recurring claim|special availability|explicit course minutes" tests/backend-core.test.js`

Expected: FAIL because the new helpers and filtered response do not exist.

- [ ] **Step 3: Implement pure recurrence and time helpers**

Use normalized room, course key, weekday and `HH:mm` as the recurrence key. Require count `>= 2`, exclude `特別課` and `場地租借`, filter by teacher category, dedupe by category and normalized course key, and attach explicit minutes parsed from `90分`, `90分鐘`, `90min`, `1.5小時` variants.

```js
function getRecurringSlotKey_(row) {
  return [
    getCourseRoom_(row[2]),
    normalizeCourseCatalogKey_(row[2]),
    getWeekdayNumber_(row[0]),
    formatMyTime(row[1])
  ].join('|');
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test --test-name-pattern="recurring claim|special availability|explicit course minutes" tests/backend-core.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: filter ordinary substitute courses by recurrence"
```

---

### Task 2: Atomic single-slot and two-slot special claims

**Files:**
- Modify: `Code.gs` (`SHEET_HEADERS.LEAVES`, `claimSubstitute_`, serializers)
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `{ mode: 'vacancy'|'merge', substituteIds: string[], courseName: string, durationMinutes: number, difficulty: string, note: string }`.
- Produces: shared `specialGroupId`, `specialMode`, `specialDurationMinutes`, `specialEndTime` written to appended V:Y columns and returned in teacher/admin DTOs.

- [ ] **Step 1: Write failing atomic-claim tests**

Cover a valid one-slot 90-minute claim, valid two-slot 120-minute claim, different-room rejection, nonconsecutive rejection, 15-minute turnover collision, and a simulated race where the second row is already claimed. Assert failures write zero rows.

```js
assert.throws(
  () => backend.claimSubstitute_(session, specialPayload),
  /至少保留 15 分鐘換場/
);
assert.equal(sheetRows.filter(row => row[21] === groupId).length, 2);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern="special claim group|turnover|consecutive" tests/backend-core.test.js`

Expected: FAIL because grouped payloads and V:Y metadata are unsupported.

- [ ] **Step 3: Implement backend-owned validation and writes**

Append headers without moving A:U:

```js
'特別課群組 ID', '特別課模式', '特別課分鐘數', '特別課結束時間'
```

Inside the existing script lock, re-read both rows, derive room/date/start and the next same-room CourseList start, validate the 15-minute buffer, create one UUID, then update each selected row in one state transition. Do not accept frontend-computed end times.

- [ ] **Step 4: Preserve grouped metadata across existing state transitions**

Replace hard-coded `slice(5, 21)` update widths with `slice(5, SHEET_HEADERS.LEAVES.length)` only where the code writes an already-copied full row, while preserving all existing index meanings. Add the four fields to `getMySubs_` and `toAdminLeaveItem_`.

- [ ] **Step 5: Run backend tests and verify GREEN**

Run: `node --test tests/backend-core.test.js`

Expected: all backend tests pass.

- [ ] **Step 6: Commit**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add atomic grouped special course claims"
```

---

### Task 3: Teacher special-course interaction

**Files:**
- Modify: `index.html` (claim cards, selection state, confirmation dialog, CSS)
- Test: `tests/frontend-contract.test.js`
- Test: `tests/visual-check.mjs`

**Interfaces:**
- Consumes: `claimOptions.specialAvailability` and existing pending leave cards.
- Produces: a separate `specialClaimDraft` payload; ordinary per-card payloads no longer emit `__SPECIAL__`.

- [ ] **Step 1: Write failing frontend contracts**

Assert ordinary selectors contain no `調整為特別課`, the page exposes `一般代課` and `安排特別課`, selecting the first merge slot disables all but its same-date/same-room consecutive partner, and the confirmation text contains room, start/end and occupied slots.

```js
assert.doesNotMatch(ordinarySelector.innerHTML, /__SPECIAL__/);
assert.match(summary, /A 教室｜18:30–20:30/);
assert.match(summary, /占用 18:30、20:00 兩個時段/);
```

- [ ] **Step 2: Run focused frontend tests and verify RED**

Run: `node --test --test-name-pattern="special course mode|special claim confirmation" tests/frontend-contract.test.js`

Expected: FAIL because the standalone flow is absent.

- [ ] **Step 3: Implement the standalone flow**

Add a mode switch above the available list. In special mode show `使用後方空堂` and `合併兩堂`, quick duration buttons 90/120 plus a numeric custom input, one course-name input, optional difficulty, required note, calculated end time, 15-minute status, and one confirmation summary. Keep ordinary claim cards unchanged except removing the special pseudo-option.

- [ ] **Step 4: Run focused and visual tests**

Run: `node --test tests/frontend-contract.test.js tests/morandi-visual-contract.test.js`

Run: `node tests/visual-check.mjs`

Expected: contract tests pass; desktop and mobile screenshots show no overflow or ambiguous duplicate form.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/frontend-contract.test.js tests/visual-check.mjs
git commit -m "feat: add guided special course claim mode"
```

---

### Task 4: Grouped teacher/admin display and production release

**Files:**
- Modify: `index.html` (teacher records and admin queue grouping)
- Modify: `Code.gs` (group DTO fields if needed)
- Test: `tests/frontend-contract.test.js`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: shared `specialGroupId` on one or two rows.
- Produces: one visible special-course card with underlying substitute IDs retained for precise OB operations.

- [ ] **Step 1: Write failing grouping tests**

Provide two DTOs sharing a group ID and assert teacher/admin rendering outputs the special title once, both occupied times, and both IDs as action metadata. Also assert ordinary rows remain one card each.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern="grouped special display" tests/frontend-contract.test.js tests/backend-core.test.js`

Expected: FAIL because rows render independently.

- [ ] **Step 3: Implement display-only grouping**

Group only when `specialGroupId` is non-empty. Keep OB reconciliation, cancellation and withdrawal actions attached to explicit underlying substitute IDs; show a group warning instead of silently applying an action to its partner.

- [ ] **Step 4: Run complete verification**

Run: `node --test tests/*.test.js`

Run: `node -e "const fs=require('fs'); new Function(fs.readFileSync('Code.gs','utf8')); console.log('Code.gs syntax OK')"`

Run: `node tests/visual-check.mjs`

Expected: all tests pass, syntax check prints `Code.gs syntax OK`, and desktop/mobile visual checks pass.

- [ ] **Step 5: Back up and append production headers**

Copy spreadsheet `1-Ts9x8sH05tEHo9pRxNVZZbEGbhEn8dx80QxhYR4peg`, verify the copied ID differs, re-read `請假代課紀錄!A1:Y2`, then append only V1:Y1 with the four approved headers. Re-read A1:Y2 and verify A:U values are unchanged.

- [ ] **Step 6: Deploy and verify production**

Push `Code.gs` with clasp, create a new immutable Apps Script version, update the existing Web App deployment, push `main`, confirm GitHub Pages succeeds, and fetch the public HTML. Perform one private-browser teacher flow on desktop and one mobile viewport check without submitting a real claim.

- [ ] **Step 7: Final commit if release-only metadata changed**

```bash
git add Code.gs index.html tests docs/superpowers
git commit -m "feat: release safe special course scheduling"
git push origin main
```
