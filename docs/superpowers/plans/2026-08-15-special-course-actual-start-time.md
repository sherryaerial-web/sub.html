# Special Course Actual Start Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a teacher to delay a special course's actual start in 15-minute increments while preserving the selected slot as the room-occupancy start and atomically claiming every required same-room slot.

**Architecture:** Extend the existing special-course draft with `actualStartTime`. The frontend derives legal dropdown options and an occupancy preview from protected availability data; the backend independently validates the time and recomputes the authoritative slot plan under the existing script lock. Existing `特別課分鐘數` and `特別課結束時間` remain the source of truth, so the Sheet contract does not change.

**Tech Stack:** HTML/CSS/vanilla JavaScript, Google Apps Script, Google Sheets, Node.js built-in test runner.

## Global Constraints

- Do not add, remove, reorder, or overwrite formal Sheet columns.
- Do not clear or migrate formal Sheet rows.
- `actualStartTime` defaults to the selected slot time when omitted, preserving old clients.
- Actual start must be a valid `HH:mm`, on a 15-minute boundary, and not earlier than the selected occupancy slot.
- When another same-room course follows, actual start must be no later than 15 minutes before that course.
- Required occupancy runs from the selected slot through every same-room course beginning before `actual start + duration + 15 minutes`.
- Any missing, stale, or already-claimed required slot blocks the entire write under one lock.

---

### Task 1: Backend actual-start validation and authoritative slot calculation

**Files:**
- Modify: `Code.gs` (`buildSpecialCourseSlotPlan_`, `claimSpecialCourse_`, personal/admin special-course result mapping)
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `buildSpecialCourseSlotPlan_(startId, durationMinutes, actualStartTime, pendingRows, courseRows)`.
- Produces: `{ orderedSubstituteIds, occupiedTimes, room, date, occupancyStartTime, actualStartTime, endTime, nextCourse, requiresClosingTimeConfirmation }`.

- [ ] **Step 1: Write failing backend tests**

Add tests proving that a 13:30 selected slot with `actualStartTime: '14:00'` and a 90-minute duration ends at 15:30, reserves turnover through 15:45, and claims the 13:30 and 15:00 same-room rows. Add rejection tests for 13:15, 13:40, and a start later than `next same-room course - 15 minutes`. Confirm no row writes occur on rejection.

- [ ] **Step 2: Run the targeted backend tests and verify RED**

Run:

```bash
node --test --test-name-pattern='actual start|delayed special' tests/backend-core.test.js
```

Expected: failure because `actualStartTime` is ignored and the authoritative end time remains based on 13:30.

- [ ] **Step 3: Implement authoritative validation**

Update the helper to use this contract:

```javascript
function buildSpecialCourseSlotPlan_(startId, durationMinutes, actualStartTime, pendingRows, courseRows) {
  // Resolve occupancyStartMinutes from the selected leave row.
  // Default actualStartTime to the occupancy start for old clients.
  // Require HH:mm, a 15-minute boundary, actual >= occupancy start,
  // actual <= next same-room course - 15 minutes, and no cross-day end.
  // Require every same-room course starting from occupancyStartMinutes and
  // before actualStartMinutes + durationMinutes + 15 to have a claimable leave row.
}
```

Call this helper for both `vacancy` and `merge`. Require exactly one planned row for `vacancy` and at least two for `merge`. Persist the authoritative end time, include `實際開始：HH:mm` in the existing note and audit reason, and return `actualStartTime` without changing `SHEET_HEADERS.LEAVES`.

- [ ] **Step 4: Run backend tests and verify GREEN**

Run:

```bash
node --test tests/backend-core.test.js
```

Expected: all backend tests pass, including atomic rollback coverage.

- [ ] **Step 5: Commit the backend change**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: support delayed special course start times"
```

---

### Task 2: Teacher dropdown, live occupancy preview, and state-safe date toggling

**Files:**
- Modify: `index.html` (special-course form, draft validation, preview, summary, date toggling)
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: `getSpecialCourseStartTimeOptions(startId, durationMinutes, availabilityMap)`.
- Produces: draft property `actualStartTime: string` and preview `{ ids, room, date, occupancyStartTime, actualStartTime, endTime, times }`.

- [ ] **Step 1: Write failing frontend tests**

Add tests asserting that selecting a 13:30 slot renders legal options `13:30`, `13:45`, and `14:00`; `14:00` produces a 15:30 end and the expected occupied rows; invalid non-quarter-hour and early starts are rejected. Add a contract test proving that toggling a date section does not rebuild the claim list and erase checked/form state.

- [ ] **Step 2: Run targeted frontend tests and verify RED**

Run:

```bash
node --test --test-name-pattern='actual start|date toggle preserves' tests/frontend-contract.test.js
```

Expected: failure because the form has no actual-start control and date toggling currently rerenders the list.

- [ ] **Step 3: Add the actual-start dropdown and calculations**

Add this field to the special-course form:

```html
<div class="claim-field">
  <label for="special-course-actual-start">實際開始時間</label>
  <select id="special-course-actual-start" class="claim-control" disabled></select>
</div>
```

Implement `getSpecialCourseStartTimeOptions` using 15-minute increments from the selected occupancy start through the earlier of the next same-room course minus 15 minutes or the latest same-day start allowed by the selected duration. Default to the occupancy start, preserve a still-valid teacher selection, and include `actualStartTime` in `readSpecialCourseDraft()`.

Update `buildSpecialCourseSlotPreview` and `validateSpecialCourseDraft` to calculate occupancy from the selected slot while calculating end/turnover from `actualStartTime`. Display:

```text
占用起點 13:30｜實際開始 14:00｜15:30 結束｜將占用 13:30、15:00
```

- [ ] **Step 4: Preserve form state when folding dates**

Change `toggleClaimDateGroup(date)` to update the matching header's `aria-expanded` and content element's `hidden` property directly instead of calling `renderAvailableSubstitutes()`. Keep `expandedClaimDates` as the render-time source of truth so mode-driven rerenders preserve expanded dates without wiping active input state on a simple fold/unfold click.

- [ ] **Step 5: Run frontend tests and verify GREEN**

Run:

```bash
node --test tests/frontend-contract.test.js
```

Expected: all frontend tests pass.

- [ ] **Step 6: Commit the frontend change**

```bash
git add index.html tests/frontend-contract.test.js
git commit -m "feat: select special course actual start time"
```

---

### Task 3: Full verification and production release

**Files:**
- Verify: `Code.gs`, `index.html`, `tests/*.test.js`
- Update deployment copy: `/private/tmp/sherry-gas-deploy-special/程式碼.js`

**Interfaces:**
- Consumes: backend and frontend commits from Tasks 1 and 2.
- Produces: synchronized GitHub `main` and a new immutable Apps Script web deployment version.

- [ ] **Step 1: Run syntax, contract, and regression checks**

Run:

```bash
cp Code.gs /private/tmp/substitute-code-check.js
node --check /private/tmp/substitute-code-check.js
node --test tests/backend-core.test.js
node --test tests/frontend-contract.test.js
node --test tests/morandi-visual-contract.test.js tests/vvip-frontend.test.js
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Push GitHub main**

Confirm the worktree is clean and push `main` to `origin/main`. Verify the public page contains `special-course-actual-start` and the updated summary copy.

- [ ] **Step 3: Push and version Apps Script**

Copy `Code.gs` byte-for-byte to `/private/tmp/sherry-gas-deploy-special/程式碼.js`, confirm with `cmp`, run `npx --yes @google/clasp push --force`, create a new Apps Script version, and update deployment `AKfycbyJADHe_DZdNIbfv_KPewAcBekEond-5Fw63i-RWCd1mHl_O9uGAQ-LTnzENZshjnhe` to that version.

- [ ] **Step 4: Verify production state**

Run `npx --yes @google/clasp deployments`, confirm `git rev-parse HEAD` equals `git rev-parse origin/main`, and read the public frontend for the new actual-start marker. Report that no formal Sheet rows or columns were changed.
