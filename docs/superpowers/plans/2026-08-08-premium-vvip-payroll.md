# Premium VVIP and Payroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Sherry Aerial Studio site with scoped management permissions, a premium role-aware UI, a VVIP whitelist flow, and a versioned OB-backed payroll workflow.

**Architecture:** Keep the existing GitHub Pages frontend, bound Apps Script backend, and production Google Sheet. Append Sheet columns and create isolated VVIP/payroll tabs; every privileged action is checked server-side. VVIP and payroll share authentication and audit helpers but can be deployed and opened independently.

**Tech Stack:** HTML/CSS/vanilla JavaScript, Google Apps Script, Google Sheets, Omcean Booking REST API, Node.js `node:test`, Playwright visual checks.

## Global Constraints

- Preserve every existing Sheet column and index; append fields only.
- Keep API tokens, PINs, hashes, sessions, Email mappings, and payroll data out of GitHub and public API responses.
- Use manual OB sync only. Failed or empty syncs must preserve the previous complete snapshot.
- Use `LockService` for sync, claims, payroll publishing, adjustments, confirmations, and VVIP submissions.
- During implementation run focused tests only. Run one complete test and visual pass immediately before production deployment.
- Public VVIP selection remains low friction and unverified; new submissions remain pending manual confirmation.

---

### Task 1: Scoped Functional Permissions

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces: `getSessionCapabilities_(session): string[]`, `requireCapability_(session, capability): object`, account field `功能權限`.
- Consumes: existing `requireSession_`, `requireAdmin_`, `登入帳號`, and API route dispatch.

- [ ] **Step 1: Write failing permission tests**

Add `功能權限` to `EXPECTED_ACCOUNT_HEADERS`. Test IVY with `course_admin,payroll_admin,vvip_admin`, Sherry with `course_admin,payroll_admin`, Tako with `course_admin`, and a teacher with no management capability. Assert `requireCapability_` permits only the matching action and that frontend navigation is driven by returned capabilities instead of role text.

```js
assert.deepEqual(Array.from(backend.getSessionCapabilities_(ivySession)), [
  'course_admin', 'payroll_admin', 'vvip_admin'
]);
assert.throws(() => backend.requireCapability_(takoSession, 'payroll_admin'), /沒有薪資管理權限/);
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test --test-name-pattern='capabilit|權限' tests/backend-core.test.js tests/frontend-contract.test.js`

Expected: FAIL because `功能權限` and `requireCapability_` do not exist.

- [ ] **Step 3: Implement account capability parsing and route guards**

Append `功能權限` to account headers, include capabilities in login/session responses, and replace broad admin checks on course/VVIP routes with exact capability checks. Keep `管理員` role compatibility by reading stored capabilities; do not infer payroll access in the browser.

```js
function requireCapability_(session, capability) {
  var current = requireSession_(session);
  if (getSessionCapabilities_(current).indexOf(capability) === -1) {
    throw new Error('沒有此管理功能權限。');
  }
  return current;
}
```

- [ ] **Step 4: Run focused permission tests**

Run: `node --test --test-name-pattern='capabilit|權限' tests/backend-core.test.js tests/frontend-contract.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Code.gs tests/backend-core.test.js tests/frontend-contract.test.js
git commit -m "feat: add scoped management permissions"
```

### Task 2: VVIP Whitelist Backend and Sheet Contract

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `getPublicVvipMembers_(): {id:string,name:string}[]`, `saveVvipMember_(session, payload)`, `setVvipMemberActive_(session, id, active)`, `resolveVvipMember_(id)`.
- Changes public APIs: `getVvipSelection(vvipId)` and `submitVvipSelection(vvipId, calendarIds)` replace Email input.

- [ ] **Step 1: Write failing VVIP whitelist tests**

Add expected `VVIP名單` headers and appended selection fields `VVIP ID`, `OB 名稱`. Assert public members contain only ID/name, disabled members are absent, Email never appears, duplicate active OB names prevent opening, and selections resolve Email server-side.

```js
assert.deepEqual(JSON.parse(JSON.stringify(backend.getPublicVvipMembers_())), [
  { id: 'vvip-1', name: '會員一' }
]);
assert.doesNotMatch(JSON.stringify(backend.getPublicVvipMembers_()), /@example\.com/);
```

- [ ] **Step 2: Run focused VVIP backend tests and verify failure**

Run: `node --test --test-name-pattern='VVIP|vvip' tests/backend-core.test.js`

Expected: FAIL because the whitelist sheet and ID-based routes do not exist.

- [ ] **Step 3: Implement VVIP structure, admin actions, and ID-based submissions**

Create `VVIP名單` idempotently, append fields to `VVIP選課紀錄`, protect admin actions with `vvip_admin`, return active IDs/names publicly, and resolve Email only in backend writes. Keep pending-manual-confirmation and four-course cumulative rules.

- [ ] **Step 4: Run focused VVIP backend tests**

Run: `node --test --test-name-pattern='VVIP|vvip' tests/backend-core.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add VVIP whitelist backend"
```

### Task 3: VVIP Public and Admin UI

**Files:**
- Modify: `vvip.html`
- Modify: `index.html`
- Modify: `tests/vvip-frontend.test.js`
- Modify: `tests/vvip-visual-check.mjs`

**Interfaces:**
- Consumes: Task 2 public member list and VVIP admin actions.
- Produces: searchable `#vvip-member` selector and VVIP member editor in the protected admin workspace.

- [ ] **Step 1: Replace Email contract tests with whitelist tests**

Assert the public page contains a searchable OB-name selector, has no Email input, posts `vvipId`, and never renders/stores member Email. Assert admin UI can add, edit, enable, and disable VVIP members.

```js
assert.match(html, /id=["']vvip-member["']/);
assert.doesNotMatch(html, /id=["']vvip-email["']/);
assert.match(html, /vvipId/);
```

- [ ] **Step 2: Run focused frontend tests and verify failure**

Run: `node --test tests/vvip-frontend.test.js`

Expected: FAIL because the page still asks for Email.

- [ ] **Step 3: Implement public selector and admin member management**

Keep course grouping, search, cumulative selection, retry, closed, and empty states. Change only the identity step and admin member editor; never put Email into a public response or DOM dataset.

- [ ] **Step 4: Run VVIP frontend and two-screen visual checks**

Run: `node --test tests/vvip-frontend.test.js`

Run: `node tests/vvip-visual-check.mjs`

Expected: PASS with one desktop and one mobile VVIP journey.

- [ ] **Step 5: Commit**

```bash
git add vvip.html index.html tests/vvip-frontend.test.js tests/vvip-visual-check.mjs
git commit -m "feat: switch VVIP selection to member whitelist"
```

### Task 4: Payroll Sheets and Calculation Engine

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `calculatePayrollLine_(course, settings)`, `calculateBonusRate_(subtotal)`, `buildPayrollDraft_(month, courses, settings)`, `syncPayrollMonth_(session, month)`.
- Data tabs: `薪項設定`, `薪資同步快照`, `薪資明細`, `薪資結算`, `薪資異議`, `薪資付款設定`.

- [ ] **Step 1: Write failing calculation tests**

Cover general attendance tiers, teacher/course overrides, venue rental zero, single-teacher special 60%, Sherry collaboration 60/40, sum-preserving rounding, fixed additions/deductions, and bonus boundaries.

```js
assert.equal(backend.calculateBonusRate_(14999), 0);
assert.equal(backend.calculateBonusRate_(15000), 0.03);
assert.equal(backend.calculateBonusRate_(20000), 0.04);
assert.equal(backend.calculateBonusRate_(30000), 0.05);
assert.deepEqual(
  JSON.parse(JSON.stringify(backend.splitSherryCollaboration_(10001, '合作老師'))),
  [{ teacherName: 'Sherry❤雪莉', amount: 6000 }, { teacherName: '合作老師', amount: 4001 }]
);
```

- [ ] **Step 2: Run focused payroll tests and verify failure**

Run: `node --test --test-name-pattern='payroll|薪資|特別課|獎金' tests/backend-core.test.js`

Expected: FAIL because payroll functions and tabs do not exist.

- [ ] **Step 3: Implement idempotent payroll structure and pure calculation helpers**

Append no existing columns. Unknown attendance tiers, missing financial fields, multiple non-Sherry instructors, or Sherry plus more than one partner must produce blocking exceptions instead of guessed amounts.

- [ ] **Step 4: Preserve all OB instructors in payroll snapshots**

Keep the existing effective instructor fields for substitute workflows. Add a payroll-specific normalizer that retains the complete `instructors` array and required financial fields. Reject a whole sync before writing when a required field is missing.

- [ ] **Step 5: Implement manual sync and draft generation under a script lock**

`syncPayrollMonth_` validates `YYYY-MM`, fetches all pages for the exact month, builds all rows in memory, writes a new draft version atomically, and preserves the prior snapshot on any failure.

- [ ] **Step 6: Run focused payroll backend tests**

Run: `node --test --test-name-pattern='payroll|薪資|特別課|獎金' tests/backend-core.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add versioned payroll calculation engine"
```

### Task 5: Payroll Publish, Confirmation, and Disputes

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `publishPayroll_(session, month)`, `getMyPayroll_(session, month)`, `confirmPayroll_(session, month, version)`, `submitPayrollDispute_(session, payload)`, `resolvePayrollDispute_(session, payload)`.

- [ ] **Step 1: Write failing workflow and authorization tests**

Assert drafts are invisible to teachers, published data is self-only, publication is blocked by unresolved calculation errors, confirmation records version/time, disputes invalidate confirmation after a revision, and Tako cannot call payroll administration actions.

- [ ] **Step 2: Run focused workflow tests and verify failure**

Run: `node --test --test-name-pattern='payroll publish|薪資發布|薪資確認|薪資異議' tests/backend-core.test.js`

Expected: FAIL because workflow actions do not exist.

- [ ] **Step 3: Implement versioned publishing and self-only reads**

Protect all writes with `LockService`, require `payroll_admin` for management actions, and verify session teacher name for personal reads/confirmation/disputes.

- [ ] **Step 4: Implement mandatory-reason adjustments and dispute resolution**

Every adjustment stores before/after values, actor, reason, timestamp, and version in `操作紀錄`. Resolving with changed numbers creates a new version and resets teacher confirmation.

- [ ] **Step 5: Run focused workflow tests**

Run: `node --test --test-name-pattern='payroll publish|薪資發布|薪資確認|薪資異議' tests/backend-core.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add payroll publish and dispute workflow"
```

### Task 6: Premium Role-Aware Frontend and Payroll UI

**Files:**
- Modify: `index.html`
- Modify: `tests/frontend-contract.test.js`
- Modify: `tests/visual-check.mjs`

**Interfaces:**
- Consumes: login `capabilities`, personal payroll APIs, and payroll admin APIs.
- Produces: role-aware home, personal payroll view, payroll admin workspace, premium editorial design tokens.

- [ ] **Step 1: Write failing role and payroll UI contract tests**

Assert teacher home stays simple, management rows are capability-gated, mobile admin uses single-column work rows, payroll shows monthly totals/line items/confirm/dispute states, and no salary data appears before authenticated API responses.

- [ ] **Step 2: Run focused frontend tests and verify failure**

Run: `node --test --test-name-pattern='permission|role|payroll|薪資|design' tests/frontend-contract.test.js`

Expected: FAIL on old role-only navigation and missing payroll views.

- [ ] **Step 3: Implement premium editorial visual system**

Remove the square wind/S icon treatment. Use text wordmark, ink/soft-white/deep-green surfaces, gold rules, berry action/status color, readable gray text, 8px-or-less radii, and no gradient. Keep desktop admin dense but organized; use one-column work rows on mobile.

- [ ] **Step 4: Implement role-aware navigation and payroll screens**

IVY sees course/payroll/VVIP management, Sherry sees course/payroll, Tako sees course only, teachers see personal modules. Personal payroll supports month selection, line-item review, confirm, and course-specific dispute entry.

- [ ] **Step 5: Run focused frontend and changed-screen visual checks**

Run: `node --test --test-name-pattern='permission|role|payroll|薪資|design' tests/frontend-contract.test.js`

Run: `node tests/visual-check.mjs`

Expected: PASS with no clipping, overlap, horizontal overflow, illegible secondary text, or mobile navigation obstruction.

- [ ] **Step 6: Commit**

```bash
git add index.html tests/frontend-contract.test.js tests/visual-check.mjs
git commit -m "feat: add premium role-aware payroll interface"
```

### Task 7: Documentation, Production Setup, and Final Verification

**Files:**
- Modify: `README.md`
- Modify: `Code.gs`
- Test: all files under `tests/`

**Interfaces:**
- Produces: copy-pasteable setup/migration instructions and final production deployment evidence.

- [ ] **Step 1: Add setup helpers and production migration documentation**

Document all new tabs/columns, capability values, initial VVIP list import, salary-setting import from `(自動)薪資計算表.xlsx`, manual sync/publish workflow, rollback pairing, and the requirement to confirm the live OB API financial fields before the first payroll publication.

- [ ] **Step 2: Run focused syntax and secret checks**

Run: `node --check tests/backend-core.test.js`

Run focused VVIP/payroll tests from Tasks 1-6.

Run: `rg -n 'eyJ|OMCEAN_API_TOKEN\s*=|0912|PIN 雜湊.*[0-9]' Code.gs index.html vvip.html README.md`

Expected: syntax passes; secret scan finds no credential value.

- [ ] **Step 3: Run the single final complete verification**

Run: `node --test tests/*.test.js`

Run: `node tests/visual-check.mjs`

Run: `node tests/vvip-visual-check.mjs`

Expected: all tests and all changed desktop/mobile visual states pass once.

- [ ] **Step 4: Deploy as a matched production set**

Record the previous Git commit, GAS deployment version/ID, and Sheet backup. Push the new `Code.gs`, run the idempotent setup helper, assign capabilities, import VVIP/payroll settings, deploy a new GAS version, then publish `index.html` and `vvip.html` together.

- [ ] **Step 5: Perform minimal production smoke checks**

Verify root connection, IVY course/payroll/VVIP access, Sherry course/payroll access, Tako course-only access, teacher self-only payroll access, VVIP member selection, and closed payroll visibility. Do not create or publish real payroll until the API financial field mapping is confirmed against one known month.

- [ ] **Step 6: Commit documentation**

```bash
git add README.md Code.gs
git commit -m "docs: add VVIP and payroll production workflow"
```
