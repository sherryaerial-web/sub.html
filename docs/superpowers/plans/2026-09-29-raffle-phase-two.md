# Raffle Handover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. User explicitly requests direct implementation without document review.

**Goal:** Confirm result imports and operate individual readiness, partial collection and audited corrections safely, locally only.
**Architecture:** Keep source stock read-only. Append one immutable journal row per operation, with all resulting claim snapshots in its JSON payload; replay on reads. A single journal append owns both state and audit, avoiding dual-sheet partial commits. Existing RaffleClaims remains an optional read-only seed. Locks, explicit versions and request identities reject races/retries.
**Tech Stack:** GAS, vanilla JS, node:test and offline Playwright.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md

## Global Constraints

- No production deployment, formal data writes, permissions changes or email this turn.
- Preserve at least 25% account quota; stop new work near 30% remaining.
- Write gate RAFFLE_WRITES_ENABLED must explicitly be true. No automatic enablement.
- New RaffleJournal headers: requestId,requestHash,createdAt,eventJson. Never clear/update old rows or source inventory.
- Import at most 25 additions per confirmation; re-preview for remaining. Preview token covers current claims and source/config; stale token refuses all writes.
- Teacher collection requires claimed venue and version; preparation requires raffle_fulfillment or raffle_admin; correction requires raffle_admin plus reason.
- Email and campaign-setup UI remain next phase. Server-configured future campaigns continue phase-one contract.

## Review Focus

- A timed-out write may have succeeded: reuse same request ID and query journal, never silently retry with a new identity.
- Source/config changes between preview and confirmation must invalidate confirmation.
- Two teachers using same version: exactly one successful handover, loser sees conflict.
- Partly corrupt or duplicate journal entries must stop read/write rather than overwrite state.
- Untrusted student names/reasons must remain inert HTML and inert Sheet text.

### Task 1: Transaction journal and guarded operations

**Files:** Code.gs; tests/raffle-transactions.test.js
**Interfaces:** confirmRaffleImport_(session,{campaignId,previewToken,requestId}); mutateRaffleClaim_(session,{claimId,version,action,venue,quantity,reason,requestId}); getRaffleAudit_(session,claimId). Read workspace adds readOnly/canPrepare/canCorrect and claim.version. Preview adds previewToken,batchCount. Journal replay returns {claims,events}.

- [ ] Test gates, explicit headers, append-only preservation, idempotent timeout retry, changed request rejection, source/token conflict, import cap/reimport, stock immutability.
- [ ] Test wrong venue, not-ready/digital rejection, partial/full collection, stale versions, role restrictions, correction reason, audit privacy, malformed/duplicate journal.
- [ ] Implement immutable snapshots and authenticated handlers. New table is created only on first validated operation; no structure setup at page load.
- [ ] Run node --test tests/raffle-operations.test.js tests/raffle-transactions.test.js; expect all pass. Commit.

### Task 2: Staff operation UI

**Files:** raffle.js, index.html, tests/raffle-frontend.test.js, tests/raffle-visual-check.mjs
**Interfaces:** Use Task1 endpoints; retain requestId for uncertain retry; require explicit confirmation. Never announce done unless response is successful.

- [ ] Test conditional buttons, per-student/prize display, counts and masked identities; browser-test confirmation cancellation, success and failure/retry, same ID on uncertain retry, disabled writes and logout cleanup.
- [ ] Add confirm import after preview, per-record ready/collect/correct with venue/quantity/reason, and admin audit viewer. Add fulfillment entry without granting capabilities.
- [ ] Run targeted tests then one full regression, JS syntax/diff checks and offline mobile/desktop UI check. Commit and independent final review.
