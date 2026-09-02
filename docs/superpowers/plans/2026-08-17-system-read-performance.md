# System Read Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce first-load and repeat-view latency across VVIP, teacher, and admin pages without caching write decisions or changing formal Sheet data.

**Architecture:** Keep every mutation authoritative in GAS under its existing lock and validation. Speed reads by caching only stable VVIP reference data, combining the claim page's duplicate reads into one request, removing the read-only admin lock, rendering collapsed VVIP dates lazily, and showing in-memory page snapshots while a fresh read runs with actions disabled.

**Tech Stack:** Google Apps Script, Google Sheets, static HTML/CSS/JavaScript, Node.js built-in test runner.

## Global Constraints

- Do not clear, move, or rewrite formal Sheet rows.
- Do not cache leave, claim, cancellation, approval, payroll, or VVIP selection decisions.
- Every write continues to re-read current Sheet state and use existing lock validation.
- Cache invalidation follows successful CourseList sync and VVIP member maintenance.
- No production push or deployment until explicit user authorization.

---

### Task 1: VVIP stable-read cache and lazy rendering

**Files:**
- Modify: `Code.gs`
- Modify: `vvip.html`
- Test: `tests/backend-core.test.js`
- Test: `tests/vvip-frontend.test.js`

**Interfaces:**
- Produces: `getVvipBaseCourseRows_`, `invalidateVvipReadCaches_`, lazy ordinary-date rendering.
- Preserves: live leave/substitute merge and current VVIP selection rows.

- [ ] Write tests proving a warm VVIP read avoids a second CourseList read, cache invalidation forces a new read, and collapsed dates create no hidden course cards.
- [ ] Run the focused tests and verify they fail for the missing behavior.
- [ ] Implement compact base-course and public-member caches with guarded fallbacks and explicit invalidation.
- [ ] Render ordinary course cards only when their date is expanded or matched by search.
- [ ] Run focused tests until they pass.

### Task 2: One-request claim-page read

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Test: `tests/backend-core.test.js`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces: `getClaimPageData_` returning `{ items, options }` from one shared read context.
- Preserves: `getAvailableSubstitutes_` and `getClaimOptions_` compatibility for existing callers and server-side conflict validation on claim submission.

- [ ] Write tests proving the combined route returns both lists and the frontend makes one initial claim data request.
- [ ] Run focused tests and verify the expected failures.
- [ ] Extract a shared read context and add the authenticated combined route.
- [ ] Switch the claim page to the combined route while keeping first-view tracking asynchronous.
- [ ] Run focused tests until they pass.

### Task 3: Safe repeat-view snapshots and read-only admin concurrency

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Test: `tests/backend-core.test.js`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces: in-memory per-view snapshots and refresh-state UI that disables stale action controls.
- Preserves: manual refresh and every authoritative backend write check.

- [ ] Write tests proving the admin read does not acquire a script lock and cached view data renders before the refresh resolves.
- [ ] Run focused tests and verify the expected failures.
- [ ] Remove the read-only admin dashboard lock.
- [ ] Add memory-only snapshots for teacher and admin views, background refresh, and disabled actions during refresh.
- [ ] Run focused tests until they pass.

### Task 4: Full verification

**Files:**
- Verify: `Code.gs`, `index.html`, `vvip.html`, all test files.

- [ ] Run the complete Node test suite.
- [ ] Run Apps Script syntax parsing and frontend HTML/JavaScript checks.
- [ ] Run local desktop/mobile visual checks for changed pages.
- [ ] Inspect `git diff`, confirm no formal Sheet access or writes occurred, and report deployment impact without pushing.
