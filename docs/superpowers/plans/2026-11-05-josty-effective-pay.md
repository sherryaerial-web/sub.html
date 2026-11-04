# Josty Effective Payroll Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. No delegated agents are needed.

**Goal:** Apply Josty's hourly rate of 1000 from 2026-11 without changing historical pay, other teachers, bonuses, publications, or notifications.

**Architecture:** Keep salary-rule columns A:E unchanged. Append optional effective-month and through-month columns F:G. Select rules using each lesson's Taiwan-local month and the summary month. A new hourly billing type uses authoritative lesson duration and rejects missing or invalid duration; legacy fixed-per-lesson behavior stays unchanged.

**Tech Stack:** Google Apps Script, native Google Sheets, Node test runner, existing OB UI and read-only connectors.

**Spec:** User approved November-onward synchronization and effective-month protection, then explicitly approved production GAS release after passing tests.

## Global Constraints
- No payroll recalculation, publication, customer messages, or notifications.
- Keep October's existing resync block and published/manual snapshot protections.
- Only edit Josty's rule rows and append F:G headers in the formal Sheet.
- OB saved-session updates require exact IDs and readback; never resave a formula blindly.
- No dedicated automatic No Show Fee interface is being added. Existing manual single-month deduction remains unchanged.

## Review Focus
- Missing, malformed, reversed, overlapping, or uncovered date windows must not silently fall back to another salary.
- Hourly rules must not infer a 60-minute duration when actual timing is missing.
- Duplicate dated rules must fail closed.
- Existing five-column rules and original A:E indexes remain compatible.
- Unrelated teachers, special-class sharing, zero-pay rentals/practice, monthly bonuses, and no-show deductions stay unchanged.

## Tasks
- [x] Add and run failing tests for date windows, duration, legacy compatibility, Sheet reading, and summary adjustments.
- [x] Implement optional date metadata, rule selection, and hourly billing in Code.gs.
- [x] Run focused tests, one complete regression, syntax checks, and diff checks; review the changes.
- [ ] Verify live source and origin/main, release only the approved GAS change, and read back the deployed source.
- [ ] Apply uniquely scoped dated Josty rules with before/after evidence, verify October remains untouched, and investigate OB session-value synchronization without unsafe retries.

## Ledger
- Initial source: clean linked worktree at c716f52, equal to origin/main; production GAS 251 and Pages hash verified.
- Live website already includes manual single-month deductions; no dedicated automatic teacher-no-show calculator exists.
- OB formula 10 is 1000, but 26 November/December saved session values remain at 1500 or 0. Saving the formula once did not reconcile them; no repeat write attempted.
- Focused tests: 7/7. Full regression: 1335/1335. Syntax and git diff --check passed.
- OB inspection found per-session fixed-pay overrides. Session 53639 was reconciled to fixed pay 1000 and read back successfully. Dynamic-mode testing was not a complete reconciliation: it returned 0, so the exact original fixed-pay mode was restored with the requested new amount.
