# Raffle durable invitation queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline.

**Goal:** Persist explicitly confirmed invitation drafts and prevent duplicate qualifications; no sender.
**Architecture:** New append-only RaffleMailJournal, separate from claims. One row atomically stores batch jobs, request identity and audit with payload digest. Lock and flush protect commits; retry resolves same request. Preview reads reservations, displays checked local queue plus legacy source flags; no assertion of actual mail-provider delivery.
**Tech Stack:** GAS/Sheets, raffle.js, Node tests, offline Playwright.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md

## Global Constraints
- Local only; no deploy, formal Sheet mutation, permissions or MailApp sends.
- Raffle admin plus RAFFLE_ENABLED, RAFFLE_WRITES_ENABLED, RAFFLE_MAIL_QUEUE_ENABLED exact true needed to queue. Defaults off.
- No source flag or inventory writes. Old campaign forbidden. No new grants.
- Queue only stores queued status; future sending/sent/uncertain transitions require separate implementation. No automatic retries or cancellation/release of qualifications.
- Keep at least 25% quota. User explicitly delegated implementation, no repeated spec approval.

## Review Focus
- Same request after uncertain flush is idempotent, new concurrent request stale.
- New code for existing Email does not requeue earlier qualifications.
- Journal corruption/duplicate qualifications/hash mismatch stops safely.
- Queue only first 5 emails shown at confirmation; max45000 JSON chars before any write, max5000 events.
- Stale UI, missing response, permissions, and stock unchanged.

### Task 1: Journal and protected API
**Files:** Code.gs, tests/raffle-mail-queue.test.js, existing preview tests.
**Interfaces:** readRaffleMailState_()=>{jobs,reservations,events,requests}; raffleInvitationPlan_(campaign,state)=>{preview,token}; confirmRaffleInvitations_(session,{campaignId,previewToken,requestId})=>{queued,remaining}; getRaffleMailRecords_(session,campaignId)=>{records,total}, last50 metadata only. previewRaffleInvitations_ deliveryChecked true (local reservations + source flags), sendEnabled false, readOnly based gates, previewToken,batchCount min5.
- [x] RED tests unauthorized/gates/no writes, queue5/remainder, fresh reread suppression, source immutable, stale source/config/journal, duplicate IDs/payload corruption, timeout/flush same request, different actor/payload rejects, metadata privacy.
- [x] Implement strict journal replay, one-row append with flush under lock, authenticated handlers and preview update.
- [x] Run focused tests, syntax/diff checks; commit backend.

### Task 2: Admin queue confirmation and records
**Files:** raffle.js, tests/raffle-frontend.test.js, tests/raffle-visual-check.mjs, handoff.
**Interfaces:** same protected endpoints; queue modal preserves requestId on uncertainty. No send button. List only metadata, not codes.
- [x] RED rendering tests gates/checked warning/no send and record escaping.
- [x] Implement queue confirmation and records tab/button using existing dialog lifecycle.
- [x] Offline browser cancel/no write, queue same-ID timeout retry, records, long text at390/1280.
- [x] Whole Node suite and independent final review; fix material issues once, save handoff/local commit.
