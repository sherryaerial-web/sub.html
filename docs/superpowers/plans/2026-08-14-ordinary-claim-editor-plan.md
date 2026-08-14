# Ordinary Claim Editor Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ordinary claim editor with a field-free direct claim and an OB-backed course-type/difficulty adjustment flow with optional notes.

**Architecture:** Keep the current `index.html` and `Code.gs` structure. Extend each recurring claim option with a stable base course type and parsed difficulty, let the frontend submit the two fields independently, and have the backend reconstruct and resolve the exact room-specific OB course under the existing lock.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Google Apps Script, Google Sheets, Node.js `node:test`.

## Global Constraints

- Preserve all existing Sheet column indexes and headers.
- Do not change special-course claim behavior or the 15-minute turnover rule.
- Direct claim must expose no editable fields and must preserve the original course and difficulty.
- Ordinary adjustment notes are optional on both frontend and backend.
- Course choices must come from recurring OB CourseList items the teacher can teach.

---

### Task 1: Lock the frontend interaction contract

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `getTeachableClaimClasses()`, `renderAvailableSubstituteItem(item)`, `updateClaimCardState(card)`, `readClaimDraft(card)`.
- Produces: `courseTypeKey`, `difficulty`, optional `note` in ordinary adjustment drafts.

- [ ] **Step 1: Write failing tests**

Add assertions that the page contains `直接認領` and `調整課程類型或難度`, does not contain the two old labels, hides `.claim-fields` for `original`, renders separate `.claim-course-type` and `.claim-difficulty-select` controls for `existing`, and does not render or enforce an ordinary note-required marker.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test tests/frontend-contract.test.js`

Expected: FAIL because the old labels and combined course selector still exist.

- [ ] **Step 3: Implement the frontend behavior**

Render two handling choices with the new labels. Put all editable controls inside an adjustment-only panel. Build course-type options from the recurring OB choices, build difficulty options from choices matching the selected type, preselect the original course type and parsed difficulty where available, and submit `courseTypeKey`, `difficulty`, and optional `note` only for `existing`.

- [ ] **Step 4: Verify frontend tests pass**

Run: `node --test tests/frontend-contract.test.js`

Expected: all frontend tests pass.

### Task 2: Resolve independent course type and difficulty safely

**Files:**
- Modify: `tests/backend-core.test.js`
- Modify: `Code.gs`

**Interfaces:**
- Consumes: recurring `CourseList` rows, teacher capabilities, target room, `courseTypeKey`, and `difficulty`.
- Produces: recurring claim options with `courseTypeKey`, `courseTypeName`, `difficulty`; normalized claim rows with room-specific `actualClassId`, `actualCourseName`, `category`, and `handlingType`.

- [ ] **Step 1: Write failing backend tests**

Add tests proving: recurring options split base course type and difficulty; direct claims ignore forged difficulty/note changes; adjustment can change only difficulty; adjustment can change only course type; empty ordinary notes are accepted; and an absent room-specific combination becomes `需要新增課程` without borrowing another room's Class ID.

- [ ] **Step 2: Verify backend tests fail**

Run: `node --test tests/backend-core.test.js`

Expected: FAIL because current options expose one combined `courseKey` and cross-apparatus notes are required.

- [ ] **Step 3: Implement backend normalization**

Parse recurring OB course names into base type plus difficulty, group choices by teacher capability, validate the submitted type against allowed recurring options, reconstruct the selected course, resolve it through the existing room-specific resolver, and remove the ordinary note requirement. Preserve the current special-course validation unchanged.

- [ ] **Step 4: Verify backend tests pass**

Run: `node --test tests/backend-core.test.js`

Expected: all backend tests pass.

### Task 3: Complete verification and production release

**Files:**
- Verify: `Code.gs`
- Verify: `index.html`
- Verify: `tests/backend-core.test.js`
- Verify: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: completed frontend and backend changes.
- Produces: a tested commit, new immutable GAS version on the existing deployment ID, and updated GitHub Pages.

- [ ] **Step 1: Run the full related suite**

Run: `node --test tests/frontend-contract.test.js tests/backend-core.test.js`

Expected: zero failures.

- [ ] **Step 2: Run repository checks**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intended files changed before commit.

- [ ] **Step 3: Commit and deploy**

Commit the four code/test files, push `main`, upload `Code.gs` to the existing Apps Script project, create a new immutable version, and update deployment `AKfycbyJADHe_DZdNIbfv_KPewAcBekEond-5Fw63i-RWCd1mHl_O9uGAQ-LTnzENZshjnhe`.

- [ ] **Step 4: Verify production**

Confirm GitHub Pages reports success, live HTML equals the committed `index.html`, the existing Web App deployment points to the new version, and the signed-in Safari page shows the new labels and independent selectors without submitting a claim.
