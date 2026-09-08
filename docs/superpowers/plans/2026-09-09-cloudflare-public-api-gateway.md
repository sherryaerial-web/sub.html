# Cloudflare Public API Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect the public student-practice and VVIP flows with an independent Cloudflare Worker, Turnstile, rate limiting, and signed Worker-to-GAS requests while leaving teacher/admin APIs and all Google Sheet schemas unchanged.

**Architecture:** GitHub Pages public pages call `sherry-classroom-gateway`; the Worker owns the public route allowlist, CORS, Turnstile verification, request limits, and HMAC signing before forwarding to the existing GAS Web App. GAS continues to own every business rule and Sheet read/write, but rejects unsigned public writes after `PUBLIC_GATEWAY_ENFORCED=true`.

**Tech Stack:** Cloudflare Workers ES modules, Wrangler 4.36.0+, Web Crypto HMAC-SHA256, Cloudflare Turnstile Siteverify, Workers Rate Limiting binding, Google Apps Script V8, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-08-cloudflare-public-api-gateway-design.md`

## Global Constraints

- Production Worker name: `sherry-classroom-gateway`; staging Worker name: `sherry-classroom-gateway-staging`.
- Keep `index.html` and all teacher/admin/session routes calling GAS directly in this project.
- Do not touch `/Users/ivy/Documents/2026 B 周年慶/sherry-line-ai`.
- Do not add a Google Service Account or move Sheet access out of GAS.
- Do not change Sheet names, columns, indexes, formulas, or existing rows.
- Never commit `GAS_GATEWAY_SECRET`, `TURNSTILE_SECRET_KEY`, `GAS_UPSTREAM_URL`, Omcean tokens, or OneSignal secrets.
- The shared HMAC secret must contain at least 32 random bytes.
- Signed timestamps expire after 300 seconds; nonces are single-use for 600 seconds.
- All three POST routes require successful Turnstile validation before any GAS fetch.
- Public write rate limit is 5 requests per 60 seconds for the same route-and-identity key.
- Rate Limiting binding requires Wrangler 4.36.0 or later; `period` is exactly `60`.
- Production security is not complete until `PUBLIC_GATEWAY_ENFORCED=true` and direct anonymous GAS writes are verified to fail.
- Every implementation task uses TDD: failing test, minimal implementation, passing test, then a focused commit.
- `git push`, `clasp push --force`, GAS deployment, Worker deployment, secrets, Script Properties, and production Sheet test writes each require explicit user authorization at that stage.

---

## File Map

- `cloudflare-gateway/package.json`: isolated Worker scripts and dependency floor.
- `cloudflare-gateway/wrangler.toml`: production/staging Worker names and distinct rate-limit namespaces.
- `cloudflare-gateway/.dev.vars.example`: secret names only.
- `cloudflare-gateway/src/routes.js`: immutable method/path/action allowlist and input-size limits.
- `cloudflare-gateway/src/security.js`: Origin checks, canonical JSON, SHA-256, HMAC, Base64URL, redaction, and identity hashing.
- `cloudflare-gateway/src/turnstile.js`: Cloudflare Siteverify call and strict response checks.
- `cloudflare-gateway/src/upstream.js`: signed GAS form request and safe JSON normalization.
- `cloudflare-gateway/src/index.js`: request orchestration, CORS, rate limiting, caching, and `/health`.
- `cloudflare-gateway/test/*.test.js`: Worker unit and orchestration tests with no live network or credentials.
- `Code.gs`: gateway signature verification, nonce replay protection, feature flag, and public-action dispatch guard.
- `tests/backend-core.test.js`: GAS verification and enforcement regressions.
- `student-practice.html`: Turnstile widget mount and public site-key loader.
- `student-practice.js`: Worker route client and Turnstile token lifecycle.
- `tests/student-practice-frontend.test.js`: public route and token-reset contracts.
- `vvip.html`: Worker route client and Turnstile widget lifecycle.
- `tests/vvip-frontend.test.js`: VVIP gateway and token-reset contracts.
- `tests/frontend-contract.test.js`: no-secret and no-direct-public-write source checks.
- `README.md`: secret setup, staged rollout, verification, rollback, and credential-rotation checklist.

---

### Task 1: Worker Boundary, Configuration, and Route Allowlist

**Files:**
- Create: `cloudflare-gateway/package.json`
- Create: `cloudflare-gateway/wrangler.toml`
- Create: `cloudflare-gateway/.dev.vars.example`
- Create: `cloudflare-gateway/src/routes.js`
- Create: `cloudflare-gateway/src/index.js`
- Create: `cloudflare-gateway/test/routes.test.js`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `Request`, Worker `env`, and `ExecutionContext`.
- Produces: `ROUTES`, `matchRoute(method, pathname)`, and default Worker handler `fetch(request, env, ctx): Promise<Response>`.

- [ ] **Step 1: Write the failing route-boundary tests**

Create `cloudflare-gateway/test/routes.test.js` with table-driven assertions for the six allowed routes, rejected methods, rejected paths, normalized JSON errors, and `/health` not touching GAS:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { matchRoute } from '../src/routes.js';

const routes = [
  ['GET', '/api/student-practice/availability', 'getStudentPracticeAvailability'],
  ['POST', '/api/student-practice/submit', 'submitStudentPractice'],
  ['GET', '/api/vvip/members', 'getVvipMembers'],
  ['POST', '/api/vvip/selection', 'getVvipSelection'],
  ['POST', '/api/vvip/submit', 'submitVvipSelection'],
  ['GET', '/health', 'health'],
];

test('only the documented method/path pairs resolve', () => {
  for (const [method, path, action] of routes) {
    assert.equal(matchRoute(method, path).action, action);
  }
  assert.equal(matchRoute('GET', '/api/vvip/submit'), null);
  assert.equal(matchRoute('POST', '/api/anything'), null);
});

test('health is configuration-only and never fetches GAS', async () => {
  let upstreamCalls = 0;
  const response = await worker.fetch(new Request('https://gateway.test/health'), {
    GAS_UPSTREAM_URL: 'https://script.google.com/macros/s/test/exec',
    GAS_GATEWAY_SECRET: 'x'.repeat(32),
    TURNSTILE_SECRET_KEY: 'turnstile-test',
    fetch: async () => { upstreamCalls += 1; throw new Error('must not run'); },
  }, {});
  assert.equal(response.status, 200);
  assert.equal(upstreamCalls, 0);
  assert.deepEqual(await response.json(), { status: 'success', data: { configured: true } });
});
```

- [ ] **Step 2: Run the test and confirm the missing modules fail**

Run: `cd cloudflare-gateway && node --test test/routes.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/index.js` or `src/routes.js`.

- [ ] **Step 3: Add the minimal isolated Worker project**

Create `package.json` with `"type": "module"`, `"scripts": { "test": "node --test test/*.test.js", "check": "wrangler deploy --dry-run" }`, and dev dependency `"wrangler": "^4.36.0"`. Define `ROUTES` as a frozen map whose entries contain `action`, `method`, `turnstileRequired`, `write`, and `maxBodyBytes`. Return JSON `404` for unknown paths and `405` when the path exists under a different method.

Use these bindings in `wrangler.toml`:

```toml
name = "sherry-classroom-gateway"
main = "src/index.js"
compatibility_date = "2026-09-09"

[[ratelimits]]
name = "PUBLIC_WRITE_LIMITER"
namespace_id = "31001"
[ratelimits.simple]
limit = 5
period = 60

[[ratelimits]]
name = "PUBLIC_READ_LIMITER"
namespace_id = "31002"
[ratelimits.simple]
limit = 60
period = 60

[env.staging]
name = "sherry-classroom-gateway-staging"

[[env.staging.ratelimits]]
name = "PUBLIC_WRITE_LIMITER"
namespace_id = "31101"
[env.staging.ratelimits.simple]
limit = 5
period = 60

[[env.staging.ratelimits]]
name = "PUBLIC_READ_LIMITER"
namespace_id = "31102"
[env.staging.ratelimits.simple]
limit = 60
period = 60
```

Put only these names in `.dev.vars.example`:

```dotenv
GAS_UPSTREAM_URL=
GAS_GATEWAY_SECRET=
TURNSTILE_SECRET_KEY=
ALLOWED_ORIGINS=https://sherryaerial-web.github.io,http://127.0.0.1:4173,http://localhost:4173
TURNSTILE_HOSTNAMES=sherryaerial-web.github.io,localhost,127.0.0.1
```

Add `.dev.vars`, `.env`, and `cloudflare-gateway/node_modules/` to `.gitignore`.

- [ ] **Step 4: Run focused tests and Wrangler validation**

Run: `cd cloudflare-gateway && npm install`

Run: `cd cloudflare-gateway && npm test`

Expected: all route tests PASS.

Run: `cd cloudflare-gateway && npx wrangler deploy --dry-run`

Expected: bundle succeeds with no secret values printed.

- [ ] **Step 5: Commit the Worker boundary**

```bash
git add .gitignore cloudflare-gateway
git commit -m "feat: scaffold public API gateway"
```

---

### Task 2: Origin, Body, and CORS Rejection Before Upstream Work

**Files:**
- Create: `cloudflare-gateway/src/security.js`
- Modify: `cloudflare-gateway/src/index.js`
- Create: `cloudflare-gateway/test/request-security.test.js`

**Interfaces:**
- Consumes: `request`, `env.ALLOWED_ORIGINS`, route `maxBodyBytes`.
- Produces: `validateOrigin(request, allowedOrigins)`, `readJsonBody(request, maxBytes)`, `corsHeaders(origin)`, and normalized errors with codes `origin_not_allowed`, `invalid_content_type`, and `body_too_large`.

- [ ] **Step 1: Write failing request-security tests**

Cover `https://sherryaerial-web.github.io`, local preview origins, absent Origin on `/health`, foreign Origin rejection, `application/json` enforcement for POST, malformed JSON, and `Content-Length`/actual body sizes over 16 KiB. Assert rejected requests leave `fetchCalls === 0` and `rateCalls === 0`.

```js
test('foreign origin is rejected before limiter and upstream', async () => {
  const fixture = createEnvFixture();
  const request = new Request('https://gateway.test/api/student-practice/submit', {
    method: 'POST',
    headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ turnstileToken: 'token', practice: {} }),
  });
  const response = await worker.fetch(request, fixture.env, {});
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'origin_not_allowed');
  assert.equal(fixture.rateCalls(), 0);
  assert.equal(fixture.fetchCalls(), 0);
});
```

- [ ] **Step 2: Confirm the tests fail before implementation**

Run: `cd cloudflare-gateway && node --test test/request-security.test.js`

Expected: FAIL because foreign origins and invalid bodies are not yet rejected.

- [ ] **Step 3: Implement strict preflight and request parsing**

Parse `ALLOWED_ORIGINS` into exact origins, never suffix matches. Return `204` to allowed `OPTIONS` with `Access-Control-Allow-Methods` limited to the route’s method and `Access-Control-Allow-Headers: Content-Type`. For all other requests, validate Origin before reading the body or calling rate limits. Read the body as text, enforce 16 KiB, require a plain JSON object, then parse it once.

- [ ] **Step 4: Verify request security**

Run: `cd cloudflare-gateway && npm test`

Expected: route and request-security tests PASS.

- [ ] **Step 5: Commit request boundary checks**

```bash
git add cloudflare-gateway/src cloudflare-gateway/test
git commit -m "feat: validate gateway request boundaries"
```

---

### Task 3: Turnstile and Rate-Limit Gates

**Files:**
- Create: `cloudflare-gateway/src/turnstile.js`
- Modify: `cloudflare-gateway/src/security.js`
- Modify: `cloudflare-gateway/src/index.js`
- Create: `cloudflare-gateway/test/abuse-controls.test.js`

**Interfaces:**
- Consumes: `{ token, expectedAction, remoteIp, secret, allowedHostnames, fetchImpl }` and `env.PUBLIC_WRITE_LIMITER.limit({ key })`.
- Produces: `verifyTurnstile(input): Promise<{ success: true }>` or typed error, plus `buildRateLimitKey(route, body, remoteIp): Promise<string>`.

- [ ] **Step 1: Write failing Turnstile and limiter tests**

Test all of these independently:

- missing token returns 400 and never calls Siteverify/GAS;
- Siteverify `success:false`, wrong `hostname`, or wrong `action` returns 403 and never calls GAS;
- Siteverify network/non-JSON errors return retryable 503 without echoing the token;
- limiter failure returns 429 before Siteverify and GAS;
- the same normalized email/member ID hashes to the same key;
- a first student registration includes `CF-Connecting-IP` in the key, while stored student-token requests do not expose the raw token in the key;
- response body and captured logs never contain the Turnstile token or secret.

Use an injected fetch function and a fake limiter:

```js
const limiter = { limit: async ({ key }) => ({ success: !key.includes('blocked') }) };
const siteverifyResponse = {
  success: true,
  hostname: 'sherryaerial-web.github.io',
  action: 'student_practice_submit',
};
```

- [ ] **Step 2: Confirm abuse-control tests fail**

Run: `cd cloudflare-gateway && node --test test/abuse-controls.test.js`

Expected: FAIL because no Turnstile or limiter gate exists.

- [ ] **Step 3: Implement Siteverify and rate keys**

POST this `FormData` to `https://challenges.cloudflare.com/turnstile/v0/siteverify`: `secret`, `response`, `remoteip`, and a generated `idempotency_key`. Accept only `success === true`, an exact configured hostname, and the route action:

- `/api/student-practice/submit` → `student_practice_submit`
- `/api/vvip/selection` → `vvip_selection_lookup`
- `/api/vvip/submit` → `vvip_selection_submit`

Build keys as SHA-256 Base64URL digests so logs and Cloudflare counters never contain raw email, student token, VVIP ID, or IP. Call `PUBLIC_WRITE_LIMITER` before Siteverify; call `PUBLIC_READ_LIMITER` for the two GET data routes.

- [ ] **Step 4: Verify abuse controls**

Run: `cd cloudflare-gateway && npm test`

Expected: all tests PASS; blocked requests report zero upstream GAS calls.

- [ ] **Step 5: Commit abuse controls**

```bash
git add cloudflare-gateway/src cloudflare-gateway/test
git commit -m "feat: guard public API with Turnstile and rate limits"
```

---

### Task 4: Canonical HMAC Signing and Safe GAS Proxy

**Files:**
- Modify: `cloudflare-gateway/src/security.js`
- Create: `cloudflare-gateway/src/upstream.js`
- Modify: `cloudflare-gateway/src/index.js`
- Create: `cloudflare-gateway/test/signature.test.js`
- Create: `cloudflare-gateway/test/upstream.test.js`

**Interfaces:**
- Produces: `canonicalJson(value)`, `sha256Base64Url(text)`, `signGatewayRequest({ action, payload, timestamp, nonce, secret })`, and `callGas({ action, payload, env, fetchImpl, now, nonceFactory })`.
- Signature canonical string: `v1\n${action}\n${timestamp}\n${nonce}\n${payloadSha256}`.
- GAS body fields: `action`, `gatewayVersion`, `gatewayTimestamp`, `gatewayNonce`, `gatewayPayloadSha256`, `gatewaySignature`, and `gatewayPayload`.

- [ ] **Step 1: Write failing deterministic signature tests**

Use fixed input and assert exact canonicalization and cross-runtime-safe Base64URL output. Include nested keys in different insertion orders, Unicode names, arrays, `null`, and rejection of non-finite numbers or `undefined`.

```js
test('canonical JSON and HMAC are deterministic', async () => {
  const payload = { practice: { room: 'A', appName: '學生甲', durationMinutes: 60 } };
  const signed = await signGatewayRequest({
    action: 'submitStudentPractice', payload,
    timestamp: 1788883200, nonce: 'nonce-1234567890', secret: 's'.repeat(32),
  });
  assert.equal(signed.canonicalPayload, '{"practice":{"appName":"學生甲","durationMinutes":60,"room":"A"}}');
  assert.match(signed.signature, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(signed.signingInput.split('\n').length, 5);
});
```

- [ ] **Step 2: Confirm signing tests fail**

Run: `cd cloudflare-gateway && node --test test/signature.test.js test/upstream.test.js`

Expected: FAIL because signing/proxy modules do not exist.

- [ ] **Step 3: Implement signing and upstream normalization**

Import the signing key with `crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])`, then sign the UTF-8 canonical string with `crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))`. Forward to GAS as `application/x-www-form-urlencoded;charset=UTF-8` because current `getPostParameters_` already supports that format. For GET actions, map only the documented query field (`date`) and never forward arbitrary client fields.

Treat timeout, network failure, non-2xx, redirect loop, non-JSON, or `{ status !== 'success' }` as failure. Never retry a write automatically. Return Worker JSON in exactly one shape:

```json
{"status":"success","data":{}}
```

or

```json
{"status":"error","error":{"code":"upstream_unavailable","message":"系統暫時忙碌，請稍後再試。"}}
```

Allow availability GET responses to use `caches.default` for 30 seconds with cache key based only on normalized date. Do not cache VVIP members, selection, submissions, or student submissions.

- [ ] **Step 4: Verify signatures, failures, and no write retry**

Run: `cd cloudflare-gateway && npm test`

Expected: tests prove one upstream call per write and no secret/token/signature in returned errors or captured logs.

- [ ] **Step 5: Commit signed proxy behavior**

```bash
git add cloudflare-gateway/src cloudflare-gateway/test
git commit -m "feat: sign and proxy gateway requests to GAS"
```

---

### Task 5: GAS Signature Verification, Replay Protection, and Enforcement Flag

**Files:**
- Modify: `Code.gs` near `doPost`, `getPostParameters_`, and shared crypto/cache helpers
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Consumes GAS Script Properties `CLOUDFLARE_GATEWAY_SECRET` and `PUBLIC_GATEWAY_ENFORCED`.
- Produces `verifyPublicGatewayRequest_(action, parameters)`, `shouldEnforcePublicGateway_()`, `consumeGatewayNonce_(nonce)`, `canonicalizeGatewayPayload_(value)`, and `constantTimeEqual_(left, right)`.
- Protected actions: `submitStudentPractice`, `submitVvipSelection`; teacher/admin actions are unchanged.

- [ ] **Step 1: Extend the GAS test harness before production code**

Add `Utilities.computeHmacSha256Signature`, `Utilities.base64EncodeWebSafe`, `Utilities.newBlob`, `CacheService.getScriptCache`, and mutable `PropertiesService.getScriptProperties` fakes. Keep the existing Sheet fixtures and indexes unchanged.

- [ ] **Step 2: Write failing enforcement tests**

Add tests proving:

- `PUBLIC_GATEWAY_ENFORCED=false` keeps both legacy public writes working;
- `true` rejects missing, wrong-version, malformed, expired (>300 s), future (>300 s), wrong-payload-hash, wrong-signature, and reused-nonce requests;
- a valid signature calls the existing handler exactly once;
- nonce is marked used only after all signature checks pass;
- `getStudentPracticeAvailability`, `getVvipMembers`, teacher login, session actions, and admin actions keep their existing behavior;
- every rejected signature leaves all Sheet fixture row counts unchanged.

Build signed test parameters with a test-only helper mirroring the documented canonical string, not by calling the production verifier.

- [ ] **Step 3: Run the focused GAS tests and confirm failure**

Run: `node --test --test-name-pattern="gateway|student practice public endpoints|VVIP public endpoints" tests/backend-core.test.js`

Expected: FAIL because enforcement helpers do not exist and unsigned writes are still accepted.

- [ ] **Step 4: Implement GAS verification with existing services**

Parse `gatewayPayload`, canonicalize it, and require its SHA-256 to equal `gatewayPayloadSha256`. Compute HMAC-SHA256 with `Utilities.computeHmacSha256Signature`, convert to URL-safe Base64 without padding, and compare equal-length strings by accumulating XOR differences. Validate nonce with `/^[A-Za-z0-9_-]{16,128}$/`; under `LockService.getScriptLock()`, reject a cache hit and then put `gateway_nonce_<sha256>` for 600 seconds.

Before the two public write handlers in `doPost`, call `verifyPublicGatewayRequest_` only when `PUBLIC_GATEWAY_ENFORCED` is the exact string `true`. When verification succeeds, pass the parsed signed payload to the existing handler instead of trusting duplicate unsigned form fields.

- [ ] **Step 5: Run focused and full backend tests**

Run: `node --test --test-name-pattern="gateway|student practice public endpoints|VVIP public endpoints" tests/backend-core.test.js`

Expected: focused tests PASS.

Run: `node --test tests/backend-core.test.js`

Expected: all backend tests PASS with no formal Sheet access.

- [ ] **Step 6: Commit GAS verification**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: verify signed public writes in GAS"
```

---

### Task 6: Student Practice Frontend Gateway and Turnstile Lifecycle

**Files:**
- Modify: `student-practice.html`
- Modify: `student-practice.js`
- Modify: `tests/student-practice-frontend.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes runtime constants `PUBLIC_GATEWAY_URL` and `TURNSTILE_SITE_KEY`, and `window.turnstile`.
- Produces `callPublicApi(route, payload, method)`, `getStudentTurnstileToken()`, and `resetStudentTurnstile()`.

- [ ] **Step 1: Write failing student-page contracts**

Assert:

- availability fixture date `2026/09/10` calls `${PUBLIC_GATEWAY_URL}/api/student-practice/availability?date=2026%2F09%2F10`;
- submit calls `${PUBLIC_GATEWAY_URL}/api/student-practice/submit` with JSON `{ practice, turnstileToken }`;
- the old GAS `APP_URL` is absent from `student-practice.js`;
- submission cannot begin without a Turnstile token;
- token resets after success and every failure;
- the submit button remains disabled while a request is active;
- current payload shape, local-storage student token, success copy, and reloading behavior remain unchanged.

Use a DOM harness with fake `window.turnstile.getResponse` and `.reset` counters; do not load Cloudflare during tests.

- [ ] **Step 2: Run and confirm the student tests fail**

Run: `node --test tests/student-practice-frontend.test.js tests/frontend-contract.test.js`

Expected: FAIL because the page still calls GAS and has no Turnstile lifecycle.

- [ ] **Step 3: Implement the student gateway client**

Load Turnstile’s official script with `defer`; render a managed widget inside the confirmation dialog using action `student_practice_submit`. Keep the public site key in source, but fail closed with a friendly message if either runtime URL/site key is missing. Use `Content-Type: application/json`, `credentials: 'omit'`, `redirect: 'error'`, and `cache: 'no-store'` for writes. In `finally`, reset the widget and re-enable the button.

- [ ] **Step 4: Verify the student page**

Run: `node --test tests/student-practice-frontend.test.js tests/frontend-contract.test.js`

Expected: PASS.

Run: `node tests/student-practice-mobile-layout-check.mjs`

Expected: desktop and mobile snapshots complete with no overflow and the widget visible only during confirmation.

- [ ] **Step 5: Commit the student frontend switch**

```bash
git add student-practice.html student-practice.js tests/student-practice-frontend.test.js tests/frontend-contract.test.js
git commit -m "feat: route student practice through gateway"
```

---

### Task 7: VVIP Frontend Gateway and Turnstile Lifecycle

**Files:**
- Modify: `vvip.html`
- Modify: `tests/vvip-frontend.test.js`
- Modify: `tests/vvip-visual-check.mjs`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes the same runtime Worker URL/site key and `window.turnstile`.
- Produces route mapping `getVvipMembers → GET /api/vvip/members`, `getVvipSelection → POST /api/vvip/selection`, and `submitVvipSelection → POST /api/vvip/submit`.

- [ ] **Step 1: Write failing VVIP gateway tests**

Keep existing course-selection assertions, then change transport assertions to verify exact routes and JSON bodies. Prove lookup action `vvip_selection_lookup` and submit action `vvip_selection_submit` use separate Turnstile tokens; each token resets after success/failure; failed submission retains `selectedCalendarIds`; no raw GAS URL remains in `vvip.html`.

- [ ] **Step 2: Confirm VVIP tests fail**

Run: `node --test tests/vvip-frontend.test.js tests/frontend-contract.test.js`

Expected: FAIL because VVIP still posts form data directly to GAS.

- [ ] **Step 3: Implement route-specific VVIP calls**

Replace `callVvipApi(action, params)` with explicit route descriptors so callers cannot supply arbitrary actions. Render Turnstile only when the member lookup or final submit is requested, using the route-specific action. Preserve the current re-read-after-submit verification and do not clear choices until GAS confirms all IDs.

- [ ] **Step 4: Verify VVIP behavior and layout**

Run: `node --test tests/vvip-frontend.test.js tests/frontend-contract.test.js`

Expected: PASS.

Run: `node tests/vvip-visual-check.mjs`

Expected: layout checks PASS and no external network is used because the Worker/Turnstile calls are mocked.

- [ ] **Step 5: Commit the VVIP frontend switch**

```bash
git add vvip.html tests/vvip-frontend.test.js tests/vvip-visual-check.mjs tests/frontend-contract.test.js
git commit -m "feat: route VVIP selection through gateway"
```

---

### Task 8: Security Regression Gate and Operational Runbook

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `README.md`
- Create: `cloudflare-gateway/README.md`

**Interfaces:**
- Produces repeatable setup, staged release, smoke-test, enforcement, rotation, and rollback instructions.

- [ ] **Step 1: Write failing source-security checks**

Extend the tracked-file credential test to assert:

- `.dev.vars`, `.env`, and Wrangler local-state files are ignored;
- `student-practice.js` and `vvip.html` contain no `script.google.com/macros/s/` URL;
- `index.html` still contains its GAS URL because teacher/admin migration is out of scope;
- no Worker source logs request bodies, Turnstile tokens, gateway signatures, or secrets.

- [ ] **Step 2: Run and confirm the new checks fail**

Run: `node --test --test-name-pattern="credential|public gateway|direct GAS" tests/frontend-contract.test.js`

Expected: FAIL until the runbook and all frontend switches are complete.

- [ ] **Step 3: Write the exact release and rollback runbook**

Document these ordered gates without any secret values:

1. Rotate the leaked Omcean token in Omcean; set the replacement only in GAS Script Properties; verify the old token is disabled.
2. Generate one 32-byte shared secret locally and set the same value with `wrangler secret put GAS_GATEWAY_SECRET --env staging` and GAS `CLOUDFLARE_GATEWAY_SECRET`.
3. Set staging `GAS_UPSTREAM_URL` and `TURNSTILE_SECRET_KEY` through `wrangler secret put`.
4. Set GAS `PUBLIC_GATEWAY_ENFORCED=false`; deploy GAS compatibility code only after explicit approval.
5. Deploy staging Worker only after explicit approval; check `/health`, bad Origin, bad Turnstile, rate limit, valid student staging request, valid VVIP staging request, and Tako admin synchronization.
6. Set the production Worker secrets and deploy production only after explicit approval.
7. Insert the exact deployed Worker URL and public Turnstile site key into both public pages; push only after explicit approval.
8. Perform one named student booking and one named VVIP selection against formal systems only after explicit approval; record the exact test rows for later cleanup.
9. Set `PUBLIC_GATEWAY_ENFORCED=true`; deploy GAS only after explicit approval.
10. Directly POST unsigned `submitStudentPractice` and `submitVvipSelection` to GAS and require error responses plus unchanged Sheet row counts.
11. Roll back by setting enforcement `false` first, redeploying GAS, then reverting the two frontend files; never restore or overwrite Sheet rows.

- [ ] **Step 4: Run the project-wide local verification**

Run: `cd cloudflare-gateway && npm test && npx wrangler deploy --dry-run`

Run: `node --test tests/*.test.js`

Expected: all automated tests PASS and no command contacts formal GAS or Sheets.

- [ ] **Step 5: Commit docs and regression gates**

```bash
git add README.md cloudflare-gateway/README.md tests/frontend-contract.test.js
git commit -m "docs: add public gateway release runbook"
```

---

### Task 9: Staged Release, Formal Verification, and Enforced Cutover

**Files:**
- Modify only if exact deployed values are required: `student-practice.html`, `student-practice.js`, `vvip.html`
- Do not modify: any Google Sheet structure or existing production row except explicitly approved named test rows.

**Interfaces:**
- Consumes separate user approvals for Cloudflare changes, Script Properties, GAS deployment, frontend push, and formal test writes.
- Produces a live enforced public gateway with verified rollback points.

- [ ] **Step 1: Stop and request authorization for external configuration**

List exact effects before asking: create staging Worker/Turnstile, set three Worker secrets, add two GAS Script Properties, and deploy compatibility GAS with enforcement off. Do not execute any of them under the earlier Git-push approval.

- [ ] **Step 2: Deploy compatibility mode and staging Worker after approval**

Run the approved `clasp push --force` and GAS version deployment from the release directory. Then run `cd cloudflare-gateway && npx wrangler deploy --env staging`; capture deployment identifiers without printing secrets.

- [ ] **Step 3: Verify staging without formal Sheet mutation first**

Check `/health`, CORS, rejected methods, invalid Turnstile, over-limit behavior, invalid signatures, expired signatures, replayed nonce, and upstream failure handling. Confirm every rejection leaves GAS and Sheet writes at zero.

- [ ] **Step 4: Request explicit approval for two named formal test writes**

State the exact student name/email, VVIP member, date/time, and Sheet tabs/rows that will be appended or changed. Do not use a real customer identity without the user naming it.

- [ ] **Step 5: Run approved end-to-end staging tests and verify admin synchronization**

Confirm student availability, first/returning/shared booking, VVIP lookup/submit, and Tako’s management page. Record row IDs and clean up only the approved test rows, using keyed deletion rather than whole-range writes.

- [ ] **Step 6: Request production Worker and frontend-release authorization**

Explain that this creates the production Worker, configures secrets/Turnstile, switches two public pages, pushes `main`, and leaves GAS enforcement off for the first compatibility check.

- [ ] **Step 7: Deploy production, switch frontend, and verify through Worker**

Deploy Worker, put the exact returned Worker URL/site key into both public pages, run all tests once, commit, push, and verify GitHub Pages. Confirm teacher/admin `index.html` still works directly against GAS.

- [ ] **Step 8: Request final enforcement authorization**

Explain that setting `PUBLIC_GATEWAY_ENFORCED=true` and redeploying GAS will intentionally block legacy/direct public write clients while leaving teacher/admin sessions unchanged.

- [ ] **Step 9: Enable enforcement and perform the completion checks**

After approval, set the Script Property, deploy GAS, verify successful Worker writes, verify unsigned direct GAS writes fail, verify nonce replay fails, verify Tako sees the student booking, and compare formal Sheet row counts/IDs against the approved test record.

- [ ] **Step 10: Record immutable release evidence**

Report Git SHA, Worker production/staging deployment IDs, GAS version/deployment ID, `/health` result, automated test counts, direct-GAS rejection results, formal test row IDs, cleanup status, and confirmation that no Sheet schema or unrelated data changed.
