# Admin Pending List Organization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the admin pending-invitation workspace so the teacher picker appears first and pending courses are collapsed into date groups by default.

**Architecture:** Keep all changes inside the existing static frontend. Add one pure grouping helper and one renderer for pending date groups, then reuse the current `renderAdminItem`, invitation actions, and native `details`/`summary` pattern. No API, GAS, or Sheet contract changes are allowed.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Playwright visual verification.

## Global Constraints

- Keep the current management header, summary cards, and eight admin tabs unchanged.
- The teacher picker is above the course list and open by default on desktop and mobile.
- Pending courses are grouped by date; every date group is collapsed by default.
- Date summaries show the Traditional Chinese weekday and course count.
- Preserve first-seen date order and original order within each date.
- Do not modify GAS, Google Sheets, OB data, invitations, or course states.

---

### Task 1: Date grouping and admin render order

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `formatDateWithWeekday(dateValue)`, `renderAdminItems(items, emptyText)`, and the existing pending-invitation dashboard data.
- Produces: `groupAdminPendingItemsByDate(items): Array<{ date: string, items: object[] }>` and `renderAdminPendingDateGroups(items): string`.

- [ ] **Step 1: Write failing grouping and render-contract tests**

Add runtime assertions equivalent to:

```js
test('groups admin pending courses by first-seen date and preserves row order', () => {
  const { context } = createFrontendRuntime();
  const groups = context.groupAdminPendingItemsByDate([
    { substituteId: 'a', date: '2026/09/05', time: '12:30' },
    { substituteId: 'b', date: '2026/09/04', time: '11:00' },
    { substituteId: 'c', date: '2026/09/05', time: '14:00' },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(groups)), [
    { date: '2026/09/05', items: [{ substituteId: 'a', date: '2026/09/05', time: '12:30' }, { substituteId: 'c', date: '2026/09/05', time: '14:00' }] },
    { date: '2026/09/04', items: [{ substituteId: 'b', date: '2026/09/04', time: '11:00' }] },
  ]);
});
```

Update the existing pending invitation contract so it asserts the teacher panel is rendered before `pendingCourseList`, contains an unconditional `open` attribute, and no longer uses `matchMedia` to decide whether it opens.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern='admin pending|pending invitation queue' tests/frontend-contract.test.js
```

Expected: FAIL because `groupAdminPendingItemsByDate` and the new render order do not exist.

- [ ] **Step 3: Implement minimal grouping and rendering**

Add the pure grouping helper and renderer to `index.html`. Render each group as closed native details:

```js
function renderAdminPendingDateGroups(items) {
  return groupAdminPendingItemsByDate(items).map((group) => `
    <details class="admin-date-group">
      <summary>
        <span class="admin-date-group-title"><i data-lucide="calendar-days"></i>${escapeHtml(formatDateWithWeekday(group.date))}</span>
        <span class="admin-date-group-count">${group.items.length} 堂</span>
      </summary>
      <div class="admin-date-group-body">${renderAdminItems(group.items, '')}</div>
    </details>`).join('');
}
```

In the pending-invitation branch, build the invitation panel with `open`, render it before the queue heading, and use `renderAdminPendingDateGroups(pendingItems)` for the course list.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern='admin pending|pending invitation queue' tests/frontend-contract.test.js
```

Expected: PASS.

### Task 2: Responsive date-group presentation

**Files:**
- Modify: `tests/morandi-visual-contract.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `.admin-date-group`, `.admin-date-group-body`, and the existing card and color variables.
- Produces: responsive, keyboard-accessible collapsed date rows with no horizontal overflow.

- [ ] **Step 1: Write failing CSS contract assertions**

Add assertions that require `.admin-date-group`, `.admin-date-group summary`, and `.admin-date-group-body` rules, plus hidden WebKit markers and an expanded-state disclosure indicator.

- [ ] **Step 2: Run the visual contract and verify RED**

Run:

```bash
node --test tests/morandi-visual-contract.test.js
```

Expected: FAIL because the new date-group selectors are absent.

- [ ] **Step 3: Add scoped styles**

Add styles beside the existing queue rules. Use the current surface, line, radius, and muted colors; keep the summary at least 48px tall, wrap long text safely, and avoid fixed widths.

- [ ] **Step 4: Run focused frontend tests and verify GREEN**

Run:

```bash
node --test tests/morandi-visual-contract.test.js tests/frontend-contract.test.js
```

Expected: PASS.

### Task 3: Full verification and production publish

**Files:**
- Modify only if verification finds a scoped issue: `index.html`, related tests.

**Interfaces:**
- Consumes: completed frontend changes.
- Produces: tested commit on `main`, pushed to `origin/main`, with live GitHub Pages verification.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/vvip-frontend.test.js
```

Expected: all tests pass; report any pre-existing skipped test separately.

- [ ] **Step 2: Run desktop and mobile visual verification**

Run `tests/visual-check.mjs`, inspect generated screenshots, and confirm the teacher panel is above collapsed date groups with no overflow at both viewports.

- [ ] **Step 3: Review the final diff and data boundary**

Confirm `Code.gs` and formal-data files are unchanged, `git diff --check` passes, and only frontend/tests/docs changed.

- [ ] **Step 4: Commit and push**

Commit the tested implementation with:

```bash
git add index.html tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
git commit -m "feat: organize admin pending courses by date"
git push origin main
```

- [ ] **Step 5: Verify the live deployment**

Confirm GitHub Pages completed for the pushed commit and the public page contains `.admin-date-group` plus the teacher-first pending render order.
