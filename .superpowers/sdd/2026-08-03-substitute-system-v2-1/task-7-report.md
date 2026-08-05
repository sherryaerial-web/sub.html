# Task 7 Report: Substitute Operations Dashboard

Status: completed

## Implemented

- Added locked teacher actions for direct leave cancellation, cancellation requests, and substitute withdrawal requests.
- Added admin approval and rejection handling. Approved withdrawals clear the active claim fields, keep the original leave row, and reopen the course.
- Added audit history for leave cancellation, withdrawal, admin resolution, OB sync, reconciliation, and replacement calendar linking.
- Added manual OB reconciliation against the latest `CourseList` snapshot by effective Calendar ID, substitute teacher, and class/course.
- Added append-only `替代 OB Calendar ID` after the existing leave columns so the original Calendar ID remains unchanged.
- Added the authenticated admin dashboard with pending, active invitee, OB work, change request, exception, and completed tabs.
- Added teacher record actions and a reason dialog for cancellation and withdrawal requests.
- Preserved all fixed Sheet indexes A:J and existing authentication, invitation, and structured claim behavior.

## TDD Evidence

- Added failing tests first for cancellation rules, reason requirements, withdrawal reopening, audit history, exact and mismatched OB reconciliation, replacement Calendar ID linking, and dashboard data isolation.
- Confirmed the focused tests failed because Task 7 functions and the appended header did not exist.
- Implemented the minimum backend and frontend contracts, then reran focused and complete suites.

## Review Round 1 Fix

- Moved the OB sync audit append inside the sync operation's existing script lock, so the audit sheet's `getLastRow()` and write cannot race with another state change.
- Reused the already-held lock instead of acquiring a nested lock.
- Added a regression test that first failed with audit lock depth `0`, then passed with depth `1`, exactly one lock acquisition/release, and the audit row appended.

## Verification

- `node --test tests/backend-core.test.js --test-name-pattern="cancel|withdraw|audit|reconcile|replacement|dashboard"`: 76 passed, 0 failed.
- `node --test tests/frontend-contract.test.js`: 24 passed, 0 failed.
- `node --test tests/*.test.js`: 100 passed, 0 failed.
- GAS and inline frontend JavaScript syntax parsing passed.
- `git diff --check` passed.
- Public frontend secret scan found no JWT, bearer header, `OMCEAN_API_TOKEN`, or `no-cors` write.
- No Task 7 browser or local server process was started or left running.

## Self-Review

- Every state-changing action rechecks the current row while holding the script lock.
- Original leave rows and original OB Calendar IDs are never deleted or overwritten.
- Teacher identity comes from the authenticated session; admin data and actions require the administrator role.
- The dashboard returns operational fields only and does not expose salts, PIN hashes, or API credentials.
- Visual redesign and browser screenshot QA were deliberately deferred to Task 8 at the user's checkpoint request.

## Deployment Notes

- Run `ensureSystemStructure_()` once after installing this version so `替代 OB Calendar ID` is appended.
- Keep `OMCEAN_API_TOKEN` in Apps Script Script Properties and rotate the previously exposed token before production.
- Fill `登入帳號` column H (`可教授類別`) before teachers claim substitutes.
- This branch is local only until it is pushed and the Apps Script/GitHub Pages deployments are updated.
