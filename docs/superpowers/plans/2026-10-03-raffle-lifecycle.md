# Raffle Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Add visible expiry, audited revocation, and explicit safe source-conflict resolution.
**Architecture:** Keep the append-only claim journal and stable claim IDs. Expiry is derived from campaign deadlines; cancellation and source acceptance are individual reason-required, versioned events. Source acceptance never changes recipient identity or delivered records.
**Tech Stack:** GAS, plain JavaScript, Node test runner, offline Chromium fixtures.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md

## Global Constraints
- Local only; no mail, real Sheets writes, deployment, or push.
- Preserve source arrays and IDs. No deletion or automatic reinstatement.
- Every write uses role checks, lock, request identity, version and append-only audit.
- Preserve at least 25% account quota; one combined full regression and fresh review.

## Review Focus
- Cross-campaign search must show expiry per claim, not globally.
- Cancelled partial deliveries retain quantity and delivery evidence; no reopening.
- Source acceptance must not silently change recipients, digital awards or delivered items.
- An in-flight/previous ready mail retains its reservation; changes never create a resend.
- Stale source, double-click and uncertain append must not create two events.

### Task 1: Expiry and revocation
**Files:** Code.gs, raffle.js, tests/raffle-transactions.test.js, tests/raffle-frontend.test.js.
**Interfaces:** Produces per-public-claim pickupBlocked/pickupDeadline and action `revoke` through mutateRaffleClaim_; status remains cancelled.
- [ ] Add tests for admin-only reason-required revoke, idempotency, partial history preservation, cancelled collection rejection, per-campaign expiry rendering.
- [ ] Run `node --test tests/raffle-transactions.test.js tests/raffle-frontend.test.js`; Expected: new tests FAIL.
- [ ] Implement lifecycle guards and UI confirmation; prepare/collect blocked after deadline. Expiry is a derived label preserving historical status, not a bulk write.
- [ ] Run same tests; Expected: PASS. Commit task.

### Task 2: Source comparison and guarded acceptance
**Files:** Code.gs, raffle.js, tests/raffle-transactions.test.js, tests/raffle-frontend.test.js, docs/raffle-implementation-handoff.md.
**Interfaces:** Consumes lifecycle/journal; previewRaffleImport_ adds masked before/after conflict details and resolvable flag. `resolveRaffleConflict_(session,operation)` accepts claimId/campaignId/version/previewToken/reason/requestId, returns claim result.
- [ ] Add tests for same-recipient unclaimed source change, prohibited identity/digital/delivered/cancelled change, stale token, unauthorized and uncertain retries; renderer comparison and no unsafe buttons.
- [ ] Run `node --test tests/raffle-transactions.test.js tests/raffle-frontend.test.js`; Expected: new tests FAIL.
- [ ] Implement explicit accept-source dialog/API, re-read source under lock; append action `resolve-source`. Never reset ready if unchanged. Changed prize/venue readiness follows current explicit campaign stock mapping. Existing mail reservations unchanged.
- [ ] Run same tests; Expected: PASS. Update handoff and commit.
- [ ] Run `node --test tests/*.test.js` plus offline lifecycle browser interactions at mobile/desktop, syntax/diff check; Expected: all PASS. One fresh review of this plan's changes and safety interactions.
