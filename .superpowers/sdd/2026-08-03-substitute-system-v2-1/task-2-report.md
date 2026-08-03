# Task 2 Report: Authentication, Sessions, and Authorization

## Status

Implemented guarded authentication in `Code.gs`.

- SHA-256 PIN hashing with a per-account salt.
- Active-account checks, five-attempt temporary lockout, and reset after a successful login.
- Opaque sessions with a fixed six-hour duration, stored in `CacheService` with a Script Properties fallback.
- Session expiry removes cached and fallback state.
- `requireSession_()` returns only teacher name and normalized role; `requireAdmin_()` rejects teacher sessions.
- `setupAccount_()` requires an administrator session and stores only the generated salt and PIN hash.

## Verification

- TDD red: `node --test tests/backend-core.test.js --test-name-pattern="login|session|admin"` failed before the authentication helpers existed.
- TDD green: the focused authentication suite passed 23/23 backend tests.
- Full suite: `node --test tests/*.test.js` passed 28/28 tests.
- Syntax: `node --check < Code.gs` passed.
- Diff: `git diff --check` passed.

## Self-review

`doGet()` exposes no authentication action. No JSON response includes PIN, salt, PIN hash, failed-attempt count, lock time, expiry time, or stored session payload. The internal `authenticate_()` helper returns only its opaque token plus teacher name and role, for use by the later authenticated route task.

## Concern

Task 4 must add the public login/POST route and decide its transport for the opaque token without returning session-record fields. This task intentionally does not alter the existing public API routes.
