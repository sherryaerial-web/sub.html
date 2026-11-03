# Payroll Dispute Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require a visible dispute reason and restore adjustment while a payroll dispute is open.

**Architecture:** Retain the shared request dialog and existing payroll APIs. Change the admin visibility condition and preserve the review status in the existing narrow summary-row write.

**Tech Stack:** HTML/JavaScript, Google Apps Script, node:test.

**Spec:** docs/superpowers/specs/2026-11-04-payroll-dispute-adjustment.md

## Global Constraints

- Preserve all Sheet column indexes and month/teacher/version matching.
- Formal Sheet writes and notifications during development: zero.
- Do not deploy without explicit authorization under the formal-release skill.
- Existing finalized, permission and adjustment-reason guards remain.

## Review Focus

- Multiple open disputes remain intact after adjustment.
- Zero or negative adjusted totals do not bypass the review status.
- Drafts, finalized summaries and unrelated teachers keep existing behavior.
- Blank and whitespace dispute reasons cannot cause writes.
- UI copy follows the saved status when adjustment and dispute reply happen at different times.

### Task 1: Restore the existing dispute-adjustment workflow

**Files:** index.html, Code.gs, tests/frontend-contract.test.js, tests/backend-core.test.js.

- [x] Add behavioral tests for the review adjustment/button/dialog/reason and preserved audit/data boundaries.
- [x] Run `node --test --test-name-pattern='payroll.*(dispute|review|reason)' tests/backend-core.test.js tests/frontend-contract.test.js`.
  Expected: new review adjustment and explicit reason-label tests fail for the observed bug; guards pass.
- [x] Remove only the review-state rejection, preserve review in the status transition, restore the button and add accurate dialog/notice copy.
- [x] Run the targeted tests. Expected: all selected tests pass.
- [ ] Commit the complete fix locally.
- [ ] Run `node --test tests/*.test.js` and `git diff --check`. Expected: all tests pass, no whitespace errors.
- [ ] Request one read-only fresh-context review of this task.
- [ ] Package full updated source files and verification results; request explicit release authorization after all checks.
