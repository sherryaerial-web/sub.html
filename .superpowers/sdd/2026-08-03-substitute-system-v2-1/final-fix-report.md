# Substitute System v2.1 Final Fix Report

Date: 2026-08-07
Branch: `feature/substitute-v2`
Status: final fix round 3 complete locally; not deployed and not pushed

## Findings Resolved

1. Session authorization now reloads the current `登入帳號` row on every protected request. Missing or inactive accounts are rejected and their session is removed; current role and capabilities take effect immediately.
2. Authenticated reads now use form-encoded POST. `doGet` is limited to health and the public teacher-name list and performs no setup, migration, UUID, first-view, or other writes. First-view recording is an explicit POST-side action.
3. OB reconciliation now processes only active OB work. Rows already marked `已核對` or `已回復核對` remain immutable after leaving the current sync window.
4. Approved cancellation and withdrawal enter `取消後待回復 OB` or `退出後待回復 OB`. Restore work is excluded from teacher availability and the admin pending queue, and the claim endpoint rejects stale UUID submissions under the same lock. Withdrawal becomes an ordinary open leave only after reconciliation confirms the original teacher/course and clears the restore state. Rejecting a cancellation request on a still-pending leave now clears the active request marker and restores the prior eligible operation state while retaining the rejection result and reason in the audit log.
5. Business and audit changes use one locked snapshot/compensation transition. Claim, cancellation, invitation batches, reconciliation, change requests, pause, replacement linking, and leave submission restore business and audit ranges on failure. Invitation batches are all-or-nothing and claim audits include the invitation ID.
6. Explicit setup performs an idempotent legacy migration. It fills an OB Calendar ID only for a unique exact teacher/date/time/course match; ambiguous or missing matches become `待人工核對`. The authoritative claim path requires a nonempty K Calendar ID and rejects unresolved P verification states, active cancellation/withdrawal requests, `待回復`, and explicit OB-restore states. Terminal I/S history labels no longer hide or block an otherwise eligible pending leave.
7. README deployment order now requires initial structure setup, the first manual OB sync and Calendar ID validation, a second explicit `ensureSystemStructure_()` migration/backfill with count review, and only then the teacher leave smoke test. The rerun is documented and tested as idempotent.
8. Setup, first-admin initialization, and password import protect the complete `登入帳號` sheet, remove other editors from the protection, and disable domain editing. Every backend account creation/import path enforces exactly four numeric PIN digits. README documents both sheet protection and restricted spreadsheet sharing.
9. Leave submission errors include index, Calendar ID, date, time, course, and message. The frontend lists each failed or unconfirmed course, retains only those courses for retry, reports prior successful batches after a later transport failure, and refreshes personal leave history.

Fixed Sheet positions remain unchanged: `CourseList` A:D and `請假代課紀錄` A:J are preserved; only the approved appended columns are used.

## TDD Evidence

Focused red/green coverage was added for:

- current account demotion, capability changes, deactivation, and removal;
- POST-only authenticated reads and read-only GET behavior;
- immutable verified history and cancellation/withdrawal OB restore queues;
- availability, admin-queue, and lock-held claim rejection for withdrawal restore work, including unchanged business/audit state after a stale claim;
- direct-UUID claim rejection for missing Calendar IDs and every nonempty unresolved verification state;
- cancellation request rejection on an OB-started pending leave, including restored list/claim eligibility and retained rejection audit history;
- terminal I/S history labels remaining nonblocking for an otherwise eligible pending claim;
- injected audit failures for claim, cancellation, invitation batches, and reconciliation, with full rollback assertions;
- exact, ambiguous, unmatched, and idempotent legacy migration;
- README deployment ordering from structure setup through OB sync, migration rerun, and teacher smoke testing;
- four-digit PIN enforcement and account-sheet protection;
- per-course backend leave errors, frontend failed-course rendering, retry selection, and later-batch transport failure handling.

Round 3 focused tests first failed because the rejected marker remained in S and terminal I/S history hid the row. After the state-transition and predicate changes, both focused tests passed before the complete suite was rerun.

## Verification

- `node --test tests/backend-core.test.js tests/frontend-contract.test.js`: 134 passed, 0 failed.
- GAS and extracted inline frontend JavaScript parsed successfully with `vm.Script`.
- Both Node test files passed `node --check`.
- `git diff --check`: passed before commit.
- JWT-shaped and previously exposed-token scans: no embedded token found in production or tracked operational content.
- Deprecated transport/trigger scan: no production `no-cors` or periodic-sync installer found.
- Visual check: not rerun in round 3 because no frontend file, HTML structure, CSS, sizing, or layout changed.
- Targeted substitute preview, visual-test, and Playwright processes were stopped before final verification.

## Explicitly Unresolved

- No live GAS deployment, production Sheet migration, real Omcean response, or GitHub Pages publish was run in this fix round.
- The previously exposed Omcean token must still be rotated and stored only as `OMCEAN_API_TOKEN` in Script Properties before deployment.
- Apps Script sheet-protection behavior and editor ownership must be confirmed once against the production spreadsheet using the deployment account.

No deploy or push was performed.
