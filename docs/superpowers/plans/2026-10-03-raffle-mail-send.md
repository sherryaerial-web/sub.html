# Guarded raffle mail sending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans inline.

**Goal:** Admin previews and explicitly sends up to five persisted invitation jobs, without duplicate delivery attempts.
**Architecture:** Extend append-only mail journal with start/result/reconcile events. Flush a durable start for the whole batch before MailApp; retain sending/uncertain reservations on interruption. No automatic retry, trigger, source writes or qualification release.
**Tech Stack:** GAS, Sheets, raffle.js, Node tests, offline browser.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md

## Global Constraints
- User requested direct implementation, no repeat specification approval. Local only, no deployment or real email.
- Keep existing enabled/write gates; new RAFFLE_MAIL_SEND_ENABLED exact true plus per-campaign legacy sender handoff acknowledgement required. No defaults enabled.
- Admin-only. Source/config rechecked at send. Quota enough for entire batch or no start. Maximum five per explicit confirmation.
- sent means MailApp returned, not inbox delivery. Unknown results are never retried. Reconciliation requires reason, no resend/unreserve.
- Preserve at least 25% account quota. No current activity, no fabricated live records.

## Review Focus
- Timeout before/after durable start and post-send journal failure must never duplicate a call.
- Changes in source email/code/used/sent flags/config block stale queued content.
- Valid-digest invalid transitions/cross-campaign jobs/duplicate qualifications stop replay.
- Partial batch failure stops remaining calls; sending records remain held for manual review.
- UI cancellation/stale response/logout cannot send or misstate success.

### Task 1: Send state machine and protected API
**Files:** Code.gs, tests/raffle-mail-send.test.js, tests/helpers/raffle-mail-fixture.js, tests/raffle-mail-queue.test.js.
**Interfaces:** previewRaffleMailSend_(session,campaignId) => dryRun,sendEnabled,quota,batchCount,previewToken,previews; sendRaffleMailBatch_(session,{campaignId,previewToken,requestId}) => attemptId,sent,pendingReview,total; reconcileRaffleMail_(session,{campaignId,jobId,status,reason,requestId}) => jobId,status.
- [x] RED tests for gates, source changes, quota boundary, success repeat, failure ordering, corruption, reconciliation.
- [x] Implement journal replay and append helper, bounded sender, records metadata, protected API routes. New handoff map RAFFLE_MAIL_HANDOFF_JSON maps campaign ID to exact sourceSpreadsheetId; no UI edits to this gate.
- [x] Run focused tests and syntax/diff; commit local.

### Task 2: Admin send preview and reconciliation controls
**Files:** raffle.js, tests/raffle-frontend.test.js, tests/raffle-visual-check.mjs, docs/raffle-implementation-handoff.md.
- [x] RED render tests and browser scenarios for explicit confirm/cancel, same-ID retry, statuses, reason required, mobile and stale reads.
- [x] Add preview-send entry, actual-send confirmation, records state/action controls. No timer or auto send.
- [x] Full suite, offline browser, fresh independent review; fix material findings with tests; save local commit and handoff.

Other product gaps (activity setup UI, bulk preparation, ready-to-pickup notices, expiry/revocation management) remain separate stages; do not claim complete product.
