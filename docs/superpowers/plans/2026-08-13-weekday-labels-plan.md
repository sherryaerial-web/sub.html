# Teacher List Weekday Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display every teacher-facing leave and substitute date as `YYYY/MM/DD（四）` without changing stored dates or Sheet data.

**Architecture:** Add one pure frontend formatter named `formatDateWithWeekday(dateValue)` in `index.html`. All teacher-facing leave and substitute renderers call it only at the display boundary; their original date values remain unchanged for sorting, filtering, grouping, and API submission.

**Tech Stack:** Static HTML, vanilla JavaScript, Node.js `node:test` frontend contract tests, GitHub Pages.

## Global Constraints

- Display `2026/09/24` as `2026/09/24（四）`.
- Apply to leave date selection, leave course rows, leave confirmation, leave records, substitute claim headings, and substitute records.
- Preserve the original string for invalid dates.
- Do not change Apps Script, Google Sheet values, API payloads, sorting keys, or filtering keys.

---

### Task 1: Shared weekday formatter and teacher-facing date renderers

**Files:**
- Modify: `index.html:1120-1165,1428-1537,1660-1770,1930-1950`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: existing date strings in `item["日期"]` and substitute group keys.
- Produces: `formatDateWithWeekday(dateValue: unknown): string`, returning normalized `YYYY/MM/DD（weekday）` or the original invalid value.

- [ ] **Step 1: Write the failing tests**

Add tests that assert:

```js
test('formats teacher-facing dates with a Traditional Chinese weekday', () => {
  const { context } = createFrontendRuntime();
  assert.equal(context.formatDateWithWeekday('2026/09/24'), '2026/09/24（四）');
  assert.equal(context.formatDateWithWeekday('2026-09-24'), '2026/09/24（四）');
  assert.equal(context.formatDateWithWeekday('日期未設定'), '日期未設定');
});
```

Add a rendering contract that loads one leave course and one available substitute dated `2026/09/24`, then asserts both rendered containers contain `2026/09/24（四）`.

- [ ] **Step 2: Run the focused tests to verify RED**

Run: `node --test --test-name-pattern="weekday|teacher-facing dates" tests/frontend-contract.test.js`

Expected: FAIL because `formatDateWithWeekday` does not exist and rendered dates contain no weekday.

- [ ] **Step 3: Implement the minimal formatter and use it at display boundaries**

Add:

```js
function formatDateWithWeekday(dateValue) {
  const original = String(dateValue || "").trim();
  const match = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(original);
  if (!match) return original;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return original;
  }
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getUTCDay()];
  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}（${weekday}）`;
}
```

Replace only displayed date expressions in the six scoped renderers with `formatDateWithWeekday(...)`; retain raw dates in data attributes and logic.

- [ ] **Step 4: Run focused and full tests to verify GREEN**

Run: `node --test --test-name-pattern="weekday|teacher-facing dates" tests/frontend-contract.test.js`

Expected: PASS.

Run: `node --test tests/*.test.js`

Expected: all tests pass.

- [ ] **Step 5: Commit and publish**

```bash
git add index.html tests/frontend-contract.test.js
git commit -m "fix: show weekdays in teacher course lists"
git push origin main
```

Confirm the Pages run for the new commit succeeds, then fetch the public HTML and verify the formatter and all display call sites are present.
