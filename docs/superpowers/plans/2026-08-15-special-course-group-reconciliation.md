# Special Course Group Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make OB reconciliation validate one real OB event per special-course group while allowing the consumed trailing source slots to be cancelled or removed.

**Architecture:** Keep the existing Sheet contract and reconciliation transaction. Build special-course groups from the existing `特別課群組 ID`, derive one group-level OB outcome from all group Calendar IDs, then apply that outcome to each active member row; ordinary substitute and cancellation/withdrawal restoration rows continue through the existing row-level path.

**Tech Stack:** Google Apps Script JavaScript, Google Sheets, Node.js `node:test` backend harness.

## Global Constraints

- Do not add, delete, move, clear, or overwrite Sheet columns or human-entered rows.
- Preserve all current numeric column indexes and existing Script Lock/rollback behavior.
- A valid special group has exactly one surviving OB Calendar event matching the expected substitute teacher and special-course name.
- Zero surviving events or more than one surviving event is a group-level reconciliation exception.
- Ordinary substitutes and cancellation/withdrawal restoration keep their current row-level rules.

---

### Task 1: Add special-course group reconciliation regression coverage

**Files:**
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `reconcileObChanges_(session)` and existing leave rows with `row[21]` as the special group ID.
- Produces: Regression contracts for one surviving event, zero events, and multiple events.

- [ ] **Step 1: Write failing tests**

Add test data for three claimed leave rows sharing one group ID. Assert that one surviving matching OB event completes all three rows, while zero or multiple surviving events mark every active member as `核對異常`.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern='special-course group reconciliation' tests/backend-core.test.js
```

Expected: the one-event case fails because the two missing trailing Calendar IDs are currently treated as separate exceptions.

### Task 2: Reconcile special courses by group

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: all next-month leave rows, `courseByCalendarId`, `getObExpectation_(row)`, `row[20] || row[10]`, and `row[21]`.
- Produces: a group outcome `{ effectiveCalendarId: string, differences: string[] }` and status updates through the existing `runStateTransitionUnlocked_` transaction.

- [ ] **Step 1: Add minimal group helpers**

Create helpers that collect unique effective Calendar IDs across every row in one special group and return:

- success when exactly one existing OB event remains and it matches the group's expected teacher/course;
- `找不到特別課群組的 OB 課程` when none remain;
- `同一特別課群組找到多堂 OB 課程` when more than one remains;
- the existing teacher/course mismatch details when the one remaining event is incorrect.

- [ ] **Step 2: Route eligible rows through group reconciliation**

Before the ordinary row loop, index all next-month non-restoration rows by `row[21]`. Process each active group once, but apply the same outcome to every active member. Leave rows without a group ID and restoration rows on the existing code path.

- [ ] **Step 3: Run focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern='special-course group reconciliation|reconcile marks exact OB' tests/backend-core.test.js
```

Expected: all selected tests pass.

### Task 3: Verify and deploy the GAS backend

**Files:**
- Verify: `Code.gs`
- Verify: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: the completed implementation and the existing clasp deployment configuration.
- Produces: tested repository commit and the authorized production GAS update.

- [ ] **Step 1: Run the complete related suite**

```bash
node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/vvip-frontend.test.js
```

Expected: zero failures.

- [ ] **Step 2: Check Apps Script syntax and repository diff**

Copy `Code.gs` to a temporary `.js`, run `node --check`, then run `git diff --check`. Confirm only the intended backend, tests, and documentation changed.

- [ ] **Step 3: Commit and push the repository**

```bash
git add Code.gs tests/backend-core.test.js docs/superpowers/plans/2026-08-15-special-course-group-reconciliation.md
git commit -m "fix: reconcile special courses by group"
git push origin main
```

- [ ] **Step 4: Push the authorized GAS deployment**

Use the repository's configured clasp deployment path, confirm the pushed source matches the tested `Code.gs`, and verify the production deployment version/state without modifying any formal Sheet rows.
