# Admin Refresh And Persistent Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct admin queue classification, add in-page data refresh, and keep users signed in on personal devices.

**Architecture:** `Code.gs` remains the source of truth for queue membership and session validity. `index.html` stores only the opaque session response, validates it with `getSession` on startup, and refreshes the active management data source without reloading the document.

**Tech Stack:** Google Apps Script, Google Sheets, vanilla HTML/CSS/JavaScript, Node test runner.

## Global Constraints

- Preserve all existing Sheet columns and indexes.
- Keep API tokens and PINs out of the frontend.
- Run only focused backend and frontend contract tests.

---

### Task 1: Queue Classification

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `getAdminDashboard_(session)` leave items.
- Produces: `changeRequests` with cancellation/withdrawal history and `completed` without cancelled records.

- [ ] Add a failing test with an `已取消／已自行取消` leave.
- [ ] Confirm it incorrectly appears in `completed`.
- [ ] Change only the two queue filters.
- [ ] Run the focused backend test.

### Task 2: Persistent Login

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Test: `tests/backend-core.test.js`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: opaque `sessionToken` plus account-derived role and capabilities.
- Produces: `getSession` response and local `saveSession`, `readSavedSession`, `clearSavedSession` helpers.

- [ ] Add failing tests for 30-day expiry and startup restoration.
- [ ] Add `getSession` to authenticated POST actions.
- [ ] Persist and validate the frontend session; clear it on logout or invalid session.
- [ ] Run focused authentication and frontend tests.

### Task 3: Admin Data Refresh

**Files:**
- Modify: `index.html`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: `activeAdminTab`.
- Produces: `refreshAdminData()` and `#admin-refresh`.

- [ ] Add a failing frontend contract test.
- [ ] Add the button next to OB sync controls.
- [ ] Reload the active course, payroll, or VVIP admin data and show a success notice.
- [ ] Run the focused frontend test.
