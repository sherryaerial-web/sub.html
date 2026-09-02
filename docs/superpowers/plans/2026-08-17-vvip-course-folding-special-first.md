# VVIP Course Folding and Special-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put courses whose names contain `特別課` at the top of the VVIP page and collapse ordinary courses by weekday-labelled date.

**Architecture:** Keep the existing VVIP API and `calendarId` selection contract unchanged. Add small pure frontend helpers for weekday formatting, special-course classification, and date expansion state, then render special and ordinary sections from the same filtered course array.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Playwright visual check.

## Global Constraints

- A course is special only when its course name contains `特別課`.
- A 90-minute 綢吊 course without `特別課` remains an ordinary course.
- Special courses appear first and stay directly visible.
- Ordinary course dates show `YYYY/MM/DD（weekday）｜N 堂` and are collapsed by default.
- Searching automatically exposes matching ordinary dates; clearing search restores manual expansion state.
- No Google Apps Script data contract or Google Sheet data is changed.
- Each source course keeps exactly one checkbox keyed by its existing `calendarId`.

---

### Task 1: Course classification, weekday labels, and collapsed date rendering

**Files:**
- Modify: `tests/vvip-frontend.test.js`
- Modify: `vvip.html`

**Interfaces:**
- Consumes: `state.data.courses`, `state.selectedCalendarIds`, `state.existingCalendarIds`, and `filterVvipCourses(courses, query)`.
- Produces: `formatVvipDateWithWeekday(date)`, `isVvipSpecialCourse(course)`, `toggleVvipDate(date)`, and a `renderCourses()` result containing `.vvip-special-section` and `.vvip-date-group` elements.

- [x] **Step 1: Write failing frontend tests**

Add tests that execute the real page script and assert:

```js
assert.equal(context.__formatVvipDateWithWeekday('2026/09/01'), '2026/09/01（二）');
assert.equal(context.__isVvipSpecialCourse({ courseName: '開髖回春特別課 (90min)' }), true);
assert.equal(context.__isVvipSpecialCourse({ courseName: '綢吊 Lv.0-2 (90分)' }), false);
assert.match(area.innerHTML, /特別課[\s\S]*開髖回春特別課/);
assert.match(area.innerHTML, /2026\/09\/01（二）[\s\S]*2 堂/);
assert.match(area.innerHTML, /data-vvip-date-content="2026\/09\/01" hidden/);
assert.equal((area.innerHTML.match(/type="checkbox"/g) || []).length, courses.length);
```

- [x] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
node --test --test-name-pattern='VVIP separates special courses|VVIP ordinary dates' tests/vvip-frontend.test.js
```

Expected: FAIL because the weekday, classifier, and collapsed date markup do not exist.

- [x] **Step 3: Implement the minimal frontend behavior**

Add state and helpers equivalent to:

```js
const expandedVvipDates = new Set();
function formatVvipDateWithWeekday(value) {
  const [year, month, day] = String(value).split('/').map(Number);
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}（${weekday}）`;
}
function isVvipSpecialCourse(course) {
  return String(course && course.courseName || '').includes('特別課');
}
```

Render special courses first and directly visible. Render ordinary groups with buttons using `aria-expanded`, `data-vvip-date-toggle`, and hidden content containers. If the search term is non-empty, treat each matching ordinary date as expanded without changing `expandedVvipDates`.

- [x] **Step 4: Add click handling and state reset**

Delegate clicks from `#vvip-course-area` to `toggleVvipDate(date)`. Clear `expandedVvipDates` whenever a member lookup succeeds; do not clear it inside selection rerenders.

- [x] **Step 5: Run focused tests and confirm GREEN**

Run:

```bash
node --test tests/vvip-frontend.test.js
```

Expected: all VVIP frontend tests PASS.

### Task 2: Responsive regression verification

**Files:**
- Modify: `tests/vvip-visual-check.mjs`

**Interfaces:**
- Consumes: the rendered `.vvip-special-section`, `[data-vvip-date-toggle]`, and `[data-vvip-date-content]` markup from Task 1.
- Produces: desktop and 390px mobile screenshots proving special-first order, weekday labels, functional expansion, and no horizontal overflow.

- [x] **Step 1: Extend the visual journey**

Include one special course and one ordinary 90-minute 綢吊 course. Assert that the special section precedes ordinary dates, the ordinary date content starts hidden, clicking the date reveals it, and the total checkbox count still equals the source course count.

- [x] **Step 2: Run focused and full regression tests**

Run:

```bash
node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/vvip-frontend.test.js
```

Expected: all tests PASS with zero failures.

- [x] **Step 3: Run syntax, diff, and visual checks**

Run:

```bash
node --check tests/vvip-visual-check.mjs
git diff --check
node tests/vvip-visual-check.mjs
```

Expected: two screenshots, equal `clientWidth` and `scrollWidth` at 1280px and 390px, and no clipped controls.

- [x] **Step 4: Commit the implementation**

```bash
git add vvip.html tests/vvip-frontend.test.js tests/vvip-visual-check.mjs docs/superpowers/plans/2026-08-17-vvip-course-folding-special-first.md
git commit -m "feat: fold VVIP courses by date"
```
