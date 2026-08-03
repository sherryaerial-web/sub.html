# Task 2 Report: Authentication, Sessions, and Authorization

## Status

Implemented guarded authentication in `Code.gs`, including review round 1 fixes.

- SHA-256 PIN hashing with a per-account salt.
- Active-account checks, five-attempt temporary lockout, and reset after a successful login.
- Authentication account reads, lock checks, failed-attempt writes, and success resets run inside `LockService`.
- Opaque sessions with a fixed six-hour duration use `CacheService` as the primary store; the Script Properties fallback removes expired or malformed unused sessions before it writes.
- Session expiry removes cached and fallback state.
- Missing, malformed, or non-finite session expiry values are rejected and removed.
- `requireSession_()` returns only teacher name and normalized role; `requireAdmin_()` rejects teacher sessions.
- `setupAccount_()` requires an administrator session and stores only the generated salt and PIN hash.
- `doGet()` now requires a session for personal and write actions, and derives the teacher identity server-side rather than trusting `name`, `instructor`, or `subTeacher` parameters.

## Verification

- TDD red: `node --test tests/backend-core.test.js --test-name-pattern="login|session|admin"` failed before the authentication helpers existed.
- TDD red (review round 1): focused lock, expiry, session-retention, and forged-identity tests failed against the original implementation.
- TDD green: the focused review regression tests passed.
- Full suite: `node --test tests/*.test.js` passed 33/33 tests.
- Syntax: `node --check < Code.gs` passed.
- Diff: `git diff --check` passed.

## Self-review

`doGet()` exposes no authentication action. No JSON response includes PIN, salt, PIN hash, failed-attempt count, lock time, expiry time, or stored session payload. The internal `authenticate_()` helper returns only its opaque token plus teacher name and role, for use by the later authenticated route task. Existing personal and write routes no longer accept a caller-provided teacher identity.

## Concern

Task 4 must add the public login/POST route and decide its transport for the opaque token without returning session-record fields. The old frontend is expected to be temporarily incompatible because personal and write routes now require an authenticated session.
