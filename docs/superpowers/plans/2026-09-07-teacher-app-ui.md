# Teacher App UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the teacher-facing shortcut workspace with the approved schedule-first mobile app UI while preserving every existing workflow.

**Architecture:** Add one authenticated read-only `getTeacherHomeDashboard` response assembled from existing CourseList, leave, practice, and inbox data. Reuse the existing page sections and mutations, but regroup them behind five teacher-facing navigation destinations and a shared responsive visual system; leave the administrator workspace unchanged.

**Tech Stack:** Google Apps Script, Google Sheets read APIs, static HTML/CSS/vanilla JavaScript, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-07-teacher-app-ui-design.md`

## Global Constraints

- Do not add, move, clear, or overwrite Google Sheet columns or human-entered rows.
- Do not change leave, substitute, practice, payroll, inbox, or administrator business rules.
- Resolve identity from the authenticated session and existing acting-mode helper only.
- Keep the administrator workspace content and capability checks unchanged.
- Mobile app layout is primary; desktop must remain complete and usable.
- Do not add offline caching of operational data.

---

### Task 1: Authenticated teacher home dashboard

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `getTeacherHomeDashboard_(session) -> { today, monthLabel, weekSummary, dates, scheduleByDate, upcoming, pendingCount }`
- Produces route: authenticated POST action `getTeacherHomeDashboard`, using `actingSession()`.

- [ ] **Step 1: Write failing backend tests**

Create tests that build CourseList, leave, practice, and inbox fixtures, then assert the response contains only the authenticated teacher's regular classes and claimed substitutes, hides another teacher's private records, sorts by `date + startTime`, and performs no Sheet writes.

- [ ] **Step 2: Run the focused backend tests**

Run: `node --test --test-name-pattern="teacher home dashboard" tests/backend-core.test.js`

Expected: FAIL because the route/helper does not exist.

- [ ] **Step 3: Implement the minimal read model**

Add `getTeacherHomeDashboard_(session)` using the existing fixed headers and row indexes. Return normalized entries shaped as:

```js
{
  id: 'course:<calendarId>' | 'substitute:<substituteId>',
  date: 'yyyy/MM/dd',
  startTime: 'HH:mm',
  endTime: 'HH:mm',
  room: 'A' | 'B' | 'C' | 'D' | '',
  title: 'A－舞綢 Lv.1–2',
  kind: 'regular' | 'substitute',
  status: '授課' | '代課'
}
```

Build `upcoming` from the teacher's future practice records and active leave/substitute change states, with a stable `targetView` used by the frontend. Limit the response to the current date through 31 days ahead and cap each list.

- [ ] **Step 4: Run focused backend tests**

Run: `node --test --test-name-pattern="teacher home dashboard" tests/backend-core.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add teacher home dashboard"
```

### Task 2: Schedule-first teacher home

**Files:**
- Modify: `index.html`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: `getTeacherHomeDashboard` response from Task 1.
- Produces: `loadTeacherHome()`, `renderTeacherHome(data)`, `selectTeacherHomeDate(date)`.

- [ ] **Step 1: Write failing frontend tests**

Add a fixture with one regular class, one claimed substitute, one practice booking, and one pending action. Assert the home view renders `近期課程`, a date strip, `授課` and `代課` pills, `接下來`, and routes each upcoming item to its existing page.

- [ ] **Step 2: Run focused frontend tests**

Run: `node --test --test-name-pattern="schedule-first teacher home" tests/frontend-contract.test.js`

Expected: FAIL because the new home renderer is missing.

- [ ] **Step 3: Replace home markup and add rendering**

Replace shortcut cards in `#view-home` with stable containers:

```html
<div id="teacher-home-summary"></div>
<div id="teacher-home-dates"></div>
<div id="teacher-home-schedule"></div>
<div id="teacher-home-upcoming"></div>
```

Fetch through `callPostApi("getTeacherHomeDashboard")`, preserve the last successful HTML during refresh failures, and select today or the first populated upcoming date.

- [ ] **Step 4: Run focused frontend tests**

Run: `node --test --test-name-pattern="schedule-first teacher home" tests/frontend-contract.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/frontend-contract.test.js
git commit -m "feat: make teacher home schedule first"
```

### Task 3: Five-destination teacher navigation

**Files:**
- Modify: `index.html`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces mobile destinations: `schedule`, `leave`, `substitute`, `practice`, `account`.
- Reuses existing view ids and API mutations; introduces only presentation-level page switches.

- [ ] **Step 1: Write failing navigation tests**

Assert the mobile bar contains exactly five visible destinations labeled `課表`, `請假`, `代課`, `練習`, `我的`; that leave and substitute pages expose internal registration/record tabs; and that the account page exposes payroll, inbox, authorized management, and logout actions.

- [ ] **Step 2: Run focused tests**

Run: `node --test --test-name-pattern="five-destination teacher navigation" tests/frontend-contract.test.js`

Expected: FAIL against the current separate record navigation.

- [ ] **Step 3: Implement navigation grouping**

Update `showView()` and navigation state so `view-myleaves` remains under the leave destination and `view-mysubs` remains under substitute. Add `#view-account` cards linking to payroll, inbox, administrator workspace when authorized, and logout. Preserve deep links and acting-mode behavior.

- [ ] **Step 4: Run focused tests**

Run the command from Step 2 and expect PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/frontend-contract.test.js
git commit -m "feat: regroup teacher app navigation"
```

### Task 4: Shared teacher visual system

**Files:**
- Modify: `index.html`
- Test: `tests/responsive-contract.test.js`

**Interfaces:**
- Consumes the existing page markup and navigation from Tasks 2–3.
- Produces responsive teacher-only layout classes without changing administrator cards.

- [ ] **Step 1: Write failing responsive contracts**

Assert safe-area bottom padding, minimum 44px touch targets, non-overflowing four-date strip, sticky five-item tab bar, mobile single-column cards, desktop two-column home layout, and teacher-scoped selectors that do not restyle `.admin-workspace` internals.

- [ ] **Step 2: Run responsive tests**

Run: `node --test --test-name-pattern="teacher app visual system" tests/responsive-contract.test.js`

Expected: FAIL because the approved visual selectors are absent.

- [ ] **Step 3: Add the approved visual system**

Use warm taupe header, cream canvas, blush selected states, blue-gray status pills, rounded white cards, compact metadata, and fixed mobile bottom navigation. Make the teacher home date strip horizontally scrollable without clipping and provide a wider desktop grid.

- [ ] **Step 4: Run responsive tests**

Run the command from Step 2 and expect PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/responsive-contract.test.js
git commit -m "style: refresh teacher app experience"
```

### Task 5: Integrated verification and preview

**Files:**
- Modify only if verification reveals a scoped defect: `Code.gs`, `index.html`, related tests.

**Interfaces:**
- Verifies all interfaces from Tasks 1–4.

- [ ] **Step 1: Run the complete automated suite**

Run: `node --test tests/*.test.js`

Expected: all tests PASS.

- [ ] **Step 2: Run local syntax and diff checks**

Run: `git diff --check` and inspect `git status --short`.

- [ ] **Step 3: Preview at mobile and desktop widths**

Serve the worktree locally and inspect at approximately 390px and 1200px widths. Verify teacher schedule, leave tabs, substitute tabs, practice, account, dialogs, empty states, loading states, and administrator entry.

- [ ] **Step 4: Confirm production safety**

Verify that no setup/migration function ran, no Sheet write API was called during preview, and no production deployment or Git push occurred.

- [ ] **Step 5: Commit any verification-only fixes**

If no fix was needed, do not create an empty commit. Otherwise commit only the scoped fix with its regression test.
