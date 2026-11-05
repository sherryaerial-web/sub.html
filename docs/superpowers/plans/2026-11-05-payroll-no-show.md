# Payroll No Show Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide an administrator-confirmed teacher No Show registry with correct course wages, one-time penalties, and stale-draft publication protection.

**Architecture:** Reuse the existing one-time deduction ledger. Preserve columns A:L and append an immutable event snapshot in M only when recording a No Show. Preserve payroll summary A:S and append the complete event-history fingerprint in T only when trialing a month with No Show history. Preview reads the exact OB course, computes penalties server-side, and registration rechecks the quote. Payroll overlays only explicitly confirmed event IDs; no OB writes or customer point changes.

**Tech Stack:** Existing GAS backend, Google Sheets, vanilla HTML/JS, Node test runner and isolated Playwright fixtures.

**Spec:** Confirmed rules at output/payroll-api-parallel-20261104/confirmed-no-show-rules.json in the workspace; user approved draft registration with mandatory fresh trial before publication on 2026-11-05.

## Global Constraints
- No OB/Josty changes. No formal event entries, publication, refunds, point credits or notifications during implementation.
- No Show events start at 2026-11; October settled Excel remains unchanged.
- With replacement: original wage zero, penalty equals original expected wage, replacement earns normal studio-rule wages.
- Without replacement: original wage zero, penalty equals extra compensation points times event-time point price (default 180). Refunded points are recorded separately, not charged twice.
- Reject impersonated/read-only writes, duplicates, conflicting retries, corrupted snapshots, published/manual-adjusted months and unverified course changes.
- Draft registration/cancellation is allowed; stale drafts cannot publish. Existing generic deduction policy stays unchanged.

## Review Focus
- Timeout retries must reuse IDs and return existing records without another OB call.
- Cancelled/missing OB courses are handled only for exact confirmed no-replacement events.
- Source or rule changes between preview and register must reject stale quotes.
- Cancellation after drafting must block the obsolete wage suppression and penalty from publishing.
- Original and replacement teacher identities must be explicit; student absences never imply teacher No Show.

### Task 1: Event Registry And Quotes
**Files:** Code.gs; tests/backend-core.test.js.
- [x] Add failing tests for quotes, permissions, duplicate prevention, price snapshots, stale quotes and idempotent audited record/cancel.
- [x] Run targeted tests and observe missing-feature failures.
- [x] Implement server validation, exact-course read, preview/register/cancel and append-only snapshot parsing.
- [x] Run targeted tests until passing.

### Task 2: Payroll Integration And Publication Guard
**Files:** Code.gs; tests/backend-core.test.js.
- [x] Add failing tests for original zero wage, normal replacement pay, no-replacement report exceptions, monthly isolation and stale draft publishing.
- [x] Apply events during sync; validate active event line markers before draft writes and publication; expose stale/editable dashboard state.
- [x] Verify register/cancel never change existing salary rows, and fresh trial applies each fee once.

### Task 3: Admin UI And Verification
**Files:** index.html; tests/payroll-no-show-browser.mjs.
- [x] Add isolated UI coverage for preview, changed-input invalidation, confirmation, stable retries, cancellation, draft warning and desktop/mobile layouts.
- [x] Add compact date/course chooser, explicit teacher/mode inputs, quote confirmation and event records using existing controls/icons.
- [x] Run full backend regression; verify frontend parsing and local browser fixtures/screenshots.
- [x] Review complete diff and report release readiness. Request scoped authorization before a new production release.

## Verification And Review
- Final full regression: `node --test tests/*.test.js`, 1353 passed, 0 failed. Log: `/private/tmp/no-show-final-regression.log`.
- Dedicated backend scenarios: 18 No Show tests, including full sync, publication, rollback, rate windows/duration and impersonation routes.
- Both `tests/payroll-no-show-browser.mjs` and `tests/payroll-deduction-browser.mjs` passed with every external browser request blocked; screenshots at `/private/tmp/sherry-payroll-no-show-preview`.
- JavaScript syntax and `git diff --check` passed.
- Independent read-only review identified missing metadata downgrade, register/cancel revision bypass, acting-route context, and uncertain in-flight ID loss. Each received a reproduced failing test and a passing fix.
- Ruling: store a fingerprint of all No Show history, including cancelled events, in append-only summary column T. Comparing only active deduction IDs cannot enforce the approved mandatory re-trial after register-then-cancel.
- Ruling: preserve and lock uncertain in-flight inputs and their ID until confirmation. A completed server request can explicitly release the UI only after a locked read confirms its event ID was not written; written or rollback-uncertain outcomes remain pending.
- Existing empty-month pre-write guard was restored after the first full regression caught a compatibility failure; the final full regression is green.
- Production release authorization requested separately. No production APIs, OB writes, actual event entries, salary recalculation/publication or notifications were performed for this feature.
