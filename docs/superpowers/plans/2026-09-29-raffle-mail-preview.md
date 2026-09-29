# Raffle invitation preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an internal, pure invitation preview planner without sending or writing anything.
**Architecture:** Existing source header contract remains unchanged. Group eligible codes by normalized Email, derive per-qualification identities before grouping, and suppress previously reserved/sent/uncertain identities even if the group changes. No API or UI wiring until persistent mail state and permissions are implemented.
**Tech Stack:** GAS JavaScript, Node test/VM.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md

## Global Constraints

- Future campaigns only; no formal reads, writes, deployment or sending.
- Retain at least 25% account quota; stop new scope near 30%.
- Exact existing headers; neither stock nor source flags change.
- This is internal planning, not durable delivery protection. Queue, mail lifecycle, ready notices, UI and campaign editor remain pending.

## Review Focus

- Group membership changes must not resend an already reserved qualification.
- Legacy sent flags, dates and used rows must not become eligible.
- Duplicate codes or invalid recipients must block the entire plan.
- Unknown mail states must fail closed, not silently retry.
- Row ordering must not change job identity; no source mutations.

### Task 1: Pure invitation planner

**Files:** Modify Code.gs; create tests/raffle-mail-preview.test.js; update handoff.
**Interfaces:** `buildRaffleInvitationPreview_(campaign, sourceRows, reservations)` returns `{dryRun:true, jobs:[{id,email,subject,body,qualificationIds}], skipped}`. Reservations are `{qualificationId,status}`; status queued/sending/sent/uncertain all suppress. Unknown or duplicate identities reject. Campaign requires id/name/sourceSpreadsheetId/websiteUrl; website HTTPS only.

- [x] Write failing tests: same Email two codes one job; order stable; partial reservation suppresses one; legacy used/sent skipped; invalid duplicate/header/email/config/state reject; source remains unchanged.
- [x] Run `node --test tests/raffle-mail-preview.test.js`; expect missing planner failure.
- [x] Implement planner using existing raffleColumns_ and raffleHash_, plain text body, no services other than deterministic hash.
- [x] Run `node --test tests/*.test.js` and `git diff --check`; expect all pass.
- [x] Save checkpoint and conduct independent review before any release.
