# Practice Admin Compact UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prioritize student review, compact practice records, contain iOS native inputs, and hide the verified push banner outside My Account.

**Architecture:** Keep the existing inline frontend and action handlers. Reorganize rendered data without changing API contracts, booking mutations, authorization, or Sheets. Reuse the existing pagination and lazy history helpers.

**Tech Stack:** Existing HTML/CSS/JavaScript, Lucide, node:test, offline Playwright.

**Spec:** User approved the compact-list proposal in chat on 2026-11-09, asked to prioritize student review for Tako, and supplied iPhone overflow and persistent verified-notification screenshots. User explicitly requested local changes only, with release deferred until the entire batch is ready.

## Global Constraints

- Do not deploy, push, update GAS, write formal data, or send notifications.
- Preserve all existing student review, companion, reschedule, cancellation, teacher edit, and audit controls.
- Never hide unverified, failed, revoked, or mismatched push states as if successful.
- Do not remove stale-source or unresolved-operation warnings.
- Retain existing Sheet indexes, permissions, filters, pagination, and escaping.

## Review Focus

- Past unresolved student eligibility and slot changes must stay in the review queue.
- Names, emails, reasons, and external identifiers must remain escaped and wrap without overflow.
- Desktop, 390px, and 320px layouts must contain each native input within its own field, not just the page.
- A verified subscription must reappear when account, permission, identity, or subscription changes.
- Hidden details must keep edits, cancellation, audits, filters, and pagination usable.

## Task 1: Practice Review and Compact Records

**Files:** `index.html`, `tests/frontend-contract.test.js`, `tests/main-assurance-ui.test.js`, `tests/practice-admin-history-browser.mjs`, `tests/practice-admin-compact-browser.mjs`.

**Interfaces:** Keep `renderPracticeAdminDashboard()`, `data-admin-action`, field selectors, list keys and API parameters unchanged. Add a `data-practice-student-review` region and collapsed `.practice-booking-details` summaries.

- [x] Add tests for student review priority, past unresolved records, escaped compact summaries, absent lifetime statistics and empty failure blocks.
- [x] Observe intended failures before implementation.
- [x] Render student pending work first; use compact records and on-demand details; collapse filters unless active; suppress redundant practice subtab.
- [x] Add local width constraints and zero inline padding for date/time fields; verify each field and sibling boundary.
- [x] Run focused unit and offline browser checks, including historical actions and paging.

## Task 2: Verified Notification Banner

**Files:** `index.html`, `tests/frontend-contract.test.js`, `tests/push-notification-browser.mjs`.

**Interfaces:** Keep `renderPushPermissionCard()`, `verifyPushSubscription()`, existing push action handlers and `pushVerifiedFingerprint`. Rerender visibility when `switchView(viewId)` changes the view.

- [x] Add failing tests for verified visibility, My Account access, wrong account, revoked subscription, denied permission, and unresolved server results.
- [x] Hide only an exact current-session, remotely verified subscription outside `view-account`.
- [x] Run notification contracts and offline browser interactions; no real SDK or network.

## Task 3: Local Handoff

- [x] Run relevant frontend regression and syntax checks; inspect desktop/mobile screenshots.
- [x] Review the final diff and confirm backend sources remain unchanged.
- [x] Report tested scope, preview/artifact paths, and explicitly state not deployed and zero formal writes/sends.

## Validation

- Frontend contract, main assurance, responsive, visual contract and student practice suites: 338 passed, 1 optional browser test skipped, 0 failures. Separate browser suites below passed.
- Offline Chromium: compact review/teacher lists, field-level date/time bounds, keyboard editing, audits and pagination at 1366, 390 and 320px.
- Offline history: Taipei end-time classification from a US timezone, monthly lazy loading, filtering, historical editing and keyboard disclosure.
- Offline push: successful verification hides outside My Account; settings remain accessible; unconfirmed and missing subscriptions stay visible; no real notification sends.
- Inline script syntax and git diff whitespace checks passed. Independent read-only review reported no concrete new findings.
- Generated preview: /Users/ivy/Documents/2026 B 周年慶/output/practice-admin-compact-local-20261109/preview.html. Uses fixtures, no scripts, disabled action buttons and a no-network CSP. Opening and native disclosure interaction verified locally.
- No deployment, push, GAS edits, formal-data writes or notification sends. Real iPhone native controls and the live OneSignal service were not tested; iOS intrinsic-padding bounds are covered by the offline layout regression.
