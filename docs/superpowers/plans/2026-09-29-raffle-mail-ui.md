# Raffle mail preview UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** Admin-only source-based invitation preview; never send or claim delivery readiness.
**Architecture:** Authenticated read endpoint calls the pure planner with no reservations solely to preview source candidates. Return `deliveryChecked:false`, no send action or job identities. Display explicit missing delivery-history warning. Persistent queue remains out of scope.
**Tech Stack:** GAS, existing raffle.js, Node and offline Playwright.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md

## Global Constraints
- No production writes, emails, permissions, deployments.
- Only raffle_admin; registered future campaign; disabled gate before Sheet reads.
- Retain 25% quota; stop around 30%.

## Review Focus
- Unauthorized callers must not read source or verification codes.
- Source-only candidates must not appear safe to send.
- Untrusted email/body must render as text, not HTML.
- Campaign switch/logout must invalidate stale previews.
- Mobile long URLs/codes must wrap without overflow.

### Task 1: Read-only preview UI

**Files:** Code.gs, raffle.js, tests/raffle-mail-preview.test.js, tests/raffle-frontend.test.js, tests/raffle-visual-check.mjs.
**Interfaces:** `previewRaffleInvitations_(session,campaignId)` returns dryRun true, deliveryChecked false, candidateCount, skipped, previews first20 email/subject/body. Endpoint previewRaffleInvitations. Renderer renderMailPreview(data).
- [x] RED: authorization/disabled/unknown source gates; bounded source preview explicitly unchecked; HTML escaping/no send buttons.
- [x] GREEN: add endpoint and admin button; capture selected campaign before request; same serial guard as existing reads.
- [x] Run full node suite (884/884), syntax/diff checks, offline browser mobile/desktop and stale/error tests.
- [x] Review once, fix material issues; save local checkpoint and update handoff.
