# Task 2 Report: Authentication, Sessions, and Authorization

## Status

Implemented guarded authentication in `Code.gs`, including review round 2 fixes.

- SHA-256 PIN hashing with a per-account salt.
- Active-account checks, five-attempt temporary lockout, and reset after a successful login.
- Authentication account reads, lock checks, failed-attempt writes, and success resets run inside `LockService`.
- Opaque sessions with a fixed six-hour duration use `CacheService` plus an expiry-checked Script Properties fallback. Cache eviction falls back to the persistent record; expiry remains authoritative.
- Expired or malformed fallback records are removed before each session write while `authenticate_()` holds `LockService`.
- Session expiry removes cached and fallback state.
- Missing, malformed, or non-finite session expiry values are rejected and removed.
- `requireSession_()` returns only teacher name and normalized role; `requireAdmin_()` rejects teacher sessions.
- `setupAccount_()` requires an administrator session and stores only the generated salt and PIN hash.
- `doGet()` now requires a session for personal, pending-leave, and write actions, and derives the teacher identity server-side rather than trusting `name`, `instructor`, or `subTeacher` parameters.

## Verification

- TDD red: `node --test tests/backend-core.test.js --test-name-pattern="login|session|admin"` failed before the authentication helpers existed.
- TDD red (review round 1): focused lock, expiry, session-retention, and forged-identity tests failed against the original implementation.
- TDD red (review round 2): early CacheService eviction and unauthenticated pending-leave tests failed before the fallback and route guard were added.
- TDD green: the focused review regression tests passed.
- Full suite: `node --test tests/*.test.js` passed 35/35 tests.
- Syntax: `node --check < Code.gs` passed.
- Diff: `git diff --check` passed.

## Self-review

`doGet()` exposes no authentication action. No JSON response includes PIN, salt, PIN hash, failed-attempt count, lock time, expiry time, or stored session payload. The internal `authenticate_()` helper returns only its opaque token plus teacher name and role, for use by the later authenticated route task. Existing personal, pending-leave, and write routes no longer accept unauthenticated callers or a caller-provided teacher identity.

## Concern

Task 4 must add the public login/POST route and decide its transport for the opaque token without returning session-record fields. The old frontend is expected to be temporarily incompatible because personal, pending-leave, and write routes now require an authenticated session. Task 5 must add invitation eligibility before an authenticated teacher can see pending leaves.
