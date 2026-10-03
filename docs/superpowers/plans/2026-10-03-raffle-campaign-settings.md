# Raffle campaign settings Implementation Plan

> Execute inline with superpowers:executing-plans, user delegated direct implementation without repeated spec review.

**Goal:** Admin creates/edits drafts and activates a verified future source without importing, sending or granting permissions.
**Architecture:** New append-only RaffleCampaignJournal records complete campaign transitions with revision, request identity, actor, payload digest. Existing RAFFLE_CAMPAIGNS_JSON seeds remain unchanged. New RAFFLE_CAMPAIGN_SETTINGS_ENABLED exact true enables settings reader; default legacy behavior preserved. Operational RAFFLE_ENABLED and write/mail gates remain independent.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md
**Tech:** GAS/Sheets, raffle.js, Node, offline browser.

## Constraints
- Local only; no live activities/data/mail/deploy. Preserve 25% quota.
- Admin-only; dedicated settings gate plus existing write gate. Can set up drafts before global operational enablement.
- Draft fields: id, name, sourceSpreadsheetId, websiteUrl, optional pickupDeadline, readyPrizeVenues. Required safe ID, HTTPS URL, timezone-qualified deadline and validated venue mappings.
- Active settings read-only this phase; source cannot be swapped after activation. Drafts never appear in teacher operations. No pause/delete lifecycle yet.
- Activation requires preview token tied to current draft/version and entire source snapshot; reread on confirm. Validate existing import and invitation contracts without writes, reject malformed/ambiguous source. No actual campaign dates fabricated.
- Lock+single append+flush, stable request retries, fail-closed corruption, max10 campaigns and1000 events.

## Tasks
- [x] Backend RED then GREEN: gated reads, draft invisible, save/retry/version conflicts, activation reread/stale source, source unchanged, legacy preserved, invalid fields/journal fail.
- [x] UI: dedicated settings panel accessible even with no active campaign; blank new draft, edit draft, preview checks, activate confirm, stale/error/logout handling; no automatic writes.
- [x] Full regression 928/928, offline UI, independent review and docs. Commit locally only.

Review recovery fix: same-ID retry retained, plus explicit read-only reload/reconcile after definitive stale/version/validation rejection. Offline stale activation -> reload -> fresh preview -> activation passed. Closing dialog disposes synchronously; late replies/logout ignored. No live data, mail or deployment.

## Boundaries
Ready-to-pickup notices, active configuration edits, expiry/revocation and source conflicts remain separate milestones. Deploy/actual dataset verification require explicit future permission.
