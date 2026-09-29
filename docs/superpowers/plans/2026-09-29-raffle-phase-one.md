# Raffle Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. User requested direct inline execution without document reviews.

**Goal:** Add authenticated raffle workspaces and safe result-import preview without touching live stock, records or email.
**Architecture:** Code.gs owns authorization and bounded Sheet reads. Pure normalization and merge planning precede any future writes. A dedicated raffle.js view module uses the existing authenticated API and design tokens.
**Tech Stack:** GAS, Sheets, vanilla JS, node:test, existing browser test tools.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md

## Global Constraints

- Future activities only; no old data import, production deployment or emails in this phase.
- Source prize allocation is not physical redemption; never deduct source inventory.
- Existing main changes and LINE delivery fixes must remain intact.
- Account quota minimum remaining 25%; stop adding work near 30%.
- Keep current teacher permissions. New raffle roles require explicit configuration before operations.

## Review Focus

- Same-name students must not merge; test by distinct Email.
- Spreadsheet formulas and unsafe HTML must not reach active browser markup; test escaped names.
- Two source rows using the same verification code must fail closed; test duplicate identity.
- A reimport must preserve redeemed status and flag source changes; test immutable existing result.
- Disabling raffle or insufficient permission must avoid opening arbitrary source spreadsheets; test no read side effects.

### Task 1: Safe normalization and import preview

**Files:** Code.gs, tests/raffle-operations.test.js
**Interfaces:** buildRaffleImportPreview_(campaign, sourceRows, prizeRows, existingClaims) returns {additions,duplicates,conflicts,errors}; getRaffleWorkspace_(session, query) returns configuration, role view and bounded claims; previewRaffleImport_(session, campaignId) returns preview without secrets.

- [ ] Write failing tests for required headers, stable IDs, duplicates, prize ambiguity, inventory immutability, preserved claimed status and masked teacher search.
- [ ] Run `node --test tests/raffle-operations.test.js`; expected failures before implementation.
- [ ] Implement pure normalization, SHA-256 identity and protected read-only campaign/source access. No writes on page load.
- [ ] Run task tests; expected all pass. Commit only task files.

### Task 2: Integrated workspaces

**Files:** raffle.js, index.html, tests/raffle-frontend.test.js, tests/frontend-contract.test.js
**Interfaces:** window.SherryRaffle.mount(root,{api,mode}) renders teacher search or admin preview using Task 1 API; mount returns cleanup and resets sensitive data on logout.

- [ ] Test disabled/unconfigured state, teacher minimum query, group-by-Email, safe markup, read errors and no write buttons in preview mode.
- [ ] Implement account「領獎查詢」entry, raffle admin view with campaign selector, teacher search and import preview. Explicitly label phase-one read-only; no misleading working write buttons.
- [ ] Add existing API route/capability integration. Test unauthenticated/unauthorized entry boundaries.
- [ ] Run JS syntax, affected frontend and backend tests; then one full regression and desktop/mobile visual check.
- [ ] Commit task. Check quota and do one independent review; fix important findings only with regression tests.

## Deferred to next safe milestone

Write-enabled campaign setup, import commit, stock arrival/claim mutations, partial handover, correction audit and email queue remain required for the complete spec. Do not claim end-to-end completion after phase one. Continue with their own implementation plan only if quota and review allow; otherwise preserve progress without deployment.
