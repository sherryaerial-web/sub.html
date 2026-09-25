# Closure LINE delivery implementation plan

User selected direct implementation without further technical document review.
Execution: inline using executing-plans, isolated existing worktree.
Spec: ../specs/2026-09-26-closure-line-copy-design.md

## Global constraints
No production writes, messages, deployment, webhook changes, or changes to closure eligibility. Default disabled. Keep LINE-AI dirty work intact. Only two recipients. First-round completion event, not fixed 22:34 timer.

## Architecture and interfaces
Independent `line-notifier/` Worker owns D1 bindings, nonce replay protection and durable outbox. GAS posts HMAC-authenticated JSON to `/closure` after the existing lock finishes. Existing LINE handler can forward original signature/body to `/line-binding` before AI handling; supply an installable integration module and test it without overwriting that dirty checkout. Production webhook verification is a deployment gate.

## Review focus
Concurrent binding, accepted-but-timed-out push, copied stale payload after midnight, changed recipient/content on retry, callback errors after course cancellation.

### Task 1: Durable notifier and bindings
- [ ] Write `line-notifier/test/notifier.test.mjs`, real SQLite D1 adapter, tests for HMAC/replay, one-use/expired/private binding, parallel delivery, stable retry key and expiry. `assert.equal((await request('/closure')).status, 202)` then verify actual stored outbox and emitted LINE HTTP payload.
- [ ] Run `node --test line-notifier/test/*.test.mjs`, confirm missing implementation failures.
- [ ] Create `line-notifier/src/index.mjs`, `schema.sql`, `wrangler.toml`, package and README. Routes `/admin/code`, `/admin/revoke`, `/admin/status`, `/line-binding`, `/closure`; independent admin secret. `drain(env, {now,fetchImpl})` leases pending rows and POSTs push with frozen body/retry key, bounded attempts and 23:40 expiry.
- [ ] Run targeted tests until green.

### Task 2: GAS completion hook and retries
- [ ] Add `tests/closure-line-delivery.test.js`, sandbox actual Code.gs. Simulate Script Properties, lock and UrlFetchApp only. Verify disabled/empty/second-round/failed closure never fetch; transport failure remains pending and retries same content; after 23:40 no retry; actual manual/scheduler hooks preserve return result.
- [ ] Run to observe missing helper failures.
- [ ] Implement `queueCourseClosureLineCopySafely_` and `drainCourseClosureLineCopySafely_` in Code.gs, HMAC envelope `{timestamp,nonce,payload,signature}`. Call immediately after core result, outside core lock. Drain on scheduler starts, independent of closure execution.
- [ ] Run GAS and Worker targeted tests. Independently compare GAS-generated envelope against real Worker verification.

### Task 3: LINE ingress integration and operator handoff
- [ ] Test forwarding original signed raw webhook to fixed configured HTTPS endpoint, skipping AI only for binding events, ordinary traffic untouched; disabled integration returns original events; relay failure causes retryable response.
- [ ] Implement portable `line-notifier/integration/relay.mjs`, document exact insertion in existing webhook after signature/payload checks and before claimWebhookEvent. Avoid modifying or committing other LINE-AI work. Release must integrate against confirmed live source.
- [ ] Document secret names, migrations, default-off rollout, two-person test, stopping switch, webhook read-only verification and approval requirements.
- [ ] Run existing whole classroom suite once plus notifier suite; review diff, independent reviewer; fix covered findings. Do not deploy.

## Progress
Plan created. Technical review gate waived by user asking to proceed without reading documents. Separate deployment authorization retained.

### Execution ledger
- Implemented Worker binding/outbox/HMAC, GAS post-core hooks and scheduler retry, relay module plus minimal actual LINE-AI import/call.
- Ruling: LINE-AI contains pre-existing dirty changes; preserve them, make only narrow local integration, do not commit/deploy the whole checkout. Production release must transplant this feature onto confirmed live source.
- Ruling: no explicit deployment authority for this feature; no real D1 created, no credentials uploaded, no webhook altered, no LINE messages sent. wrangler DB binding remains unset until approved resource creation; ENABLED=false.
- TDD: observed missing implementation failures for Worker/GAS/relay, then 14 passing targeted tests and 2 real LINE ingress integration tests.
- Independent review found stale concurrent drain bypassing next_at and missing conflict audit. Both reproduced as failing tests; fixed with attempts CAS + next_at recheck and durable conflict fields. 15 targeted tests now pass.
- LINE-AI full regression: 429/429 pass. Worker dry-run build passed (10.46 KiB, default disabled, no D1 configured).
- Initial combined classroom/notifier run: 786/786 pass. Final combined run after review fixes is recorded below when complete.
- Final combined classroom/notifier regression after fixes: 787/787 pass (2026-09-26); no production network calls. `git diff --check` clean.
- Local tasks 1–3 complete. LINE live webhook identity/credentials, new D1 configuration, production deployment and actual two-recipient delivery remain deliberately pending release authorization; do not claim the feature is live.
