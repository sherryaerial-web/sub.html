# Task 3 Report: Manual OB Synchronization and Immutable Leave Linking

## Status

Implemented on `feature/substitute-v2`.

## Changes

- Changed `syncCourseListFromApi(sessionToken)` to require an authenticated administrator before it reads the Omcean token or fetches data.
- Kept `OMCEAN_API_TOKEN` exclusively in Script Properties.
- Fetches all Calendar pages, filters cancelled classes, normalizes every row before the write lock, and rejects zero valid rows, invalid JSON, and HTTP errors without changing `CourseList`.
- Appends and writes the stable OB metadata: Calendar ID, Class ID, instructor ID, substitute flag, and last-sync time.
- Replaces the current `CourseList` snapshot under a write lock and never writes to `請假代課紀錄`.
- Removed `installHourlySyncTrigger`; the README now requires removal of any legacy time trigger and documents manual-only synchronization.
- Added a one-time first-admin initializer that reads temporary Script Properties, stores only the salted PIN hash, and deletes the temporary PIN even when initialization fails.

## TDD Evidence

1. Added sync tests for administrator authorization, invalid JSON, zero valid classes, HTTP errors, pagination, cancelled-class filtering, metadata, snapshot replacement, and removed hourly installation.
2. Ran `node --test tests/backend-core.test.js --test-name-pattern="sync|calendar"` before the implementation. It failed because the old code lacked metadata, management authorization, and still exposed the hourly trigger setup.
3. Implemented the minimal synchronization changes and reran the focused suite successfully.
4. Added a failing first-administrator initialization test before adding the temporary Script Properties initializer; it then passed.

## Verification

- `node --test tests/*.test.js`: passed after final changes.
- `node --check < Code.gs`: passed after final changes.
- `git diff --check`: passed after final changes.

## Self-review

- Existing `CourseList` A:D and leave-history indexes remain unchanged; new API fields use appended columns E:I.
- API fetch and normalization happen before any `CourseList` write lock. Invalid, empty, and failed fetches retain the previous snapshot.
- No route or frontend receives the Omcean token, PIN hash, salt, or stored session payload.
- The existing old hourly trigger is not automatically removable after deployment, so the deployer must delete it once in Apps Script as documented.

## Follow-on Scope

Task 4 must add the authenticated management UI that supplies the administrator Session to `syncCourseListFromApi(sessionToken)`. This task intentionally does not expose the sync operation through the current public frontend.

## Review Round 1 Remediation

- A Calendar payload now aborts as a whole when any non-cancelled item is malformed or lacks a Calendar ID, Class ID, instructor ID, date/time, course, or instructor name. No `CourseList` header or data write begins before that validation succeeds.
- Calendar instructor precedence is now deterministic: retain the first `isSubstitute: true` instructor when present; otherwise retain the first listed instructor.
- `CourseList` headers are read and validated before acquiring the write lock, then validated again inside the lock. Header completion and snapshot replacement both happen only inside that lock.
- Added regression coverage for substitute precedence, deterministic non-substitute fallback, missing Class/teacher IDs, mixed valid-invalid payloads preserving an A:D-only snapshot, and a partial conflicting header row preserving the complete original snapshot.

### Review Round 1 Verification

- TDD red: `node --test tests/backend-core.test.js --test-name-pattern="substitute instructor|mixed valid|all headers"` failed against commit `137401e` for each reported issue.
- TDD green: the same focused command passed after the fix.
- Final suite: `node --test tests/*.test.js` passed 46/46 tests.
- Syntax: `node --check < Code.gs` passed.
- Diff: `git diff --check` passed.

## Review Round 2 Remediation

- The locked sync path now captures the complete existing `CourseList` content footprint before it writes any replacement data or headers.
- If either replacement write fails, the backend clears the affected range and restores the saved snapshot before rethrowing the original write failure. If restoration itself fails, it reports that the old snapshot could not be restored.
- Added failure injection for the second/header write. The regression verifies that an A:D-only header and its old row are restored exactly after the injected failure.

### Review Round 2 Verification

- TDD red: `node --test tests/backend-core.test.js --test-name-pattern="second Sheet write fails"` reproduced a replaced old row after the injected second-write error.
- TDD green: the same focused command passed after rollback support was added.
- Final suite: `node --test tests/*.test.js` passed 47/47 tests.
- Syntax: `node --check < Code.gs` passed.
- Diff: `git diff --check` passed.
