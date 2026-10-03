# Raffle final controls implementation plan

> Use superpowers:executing-plans inline. User requested continuous completion, no intermediate approval prompts.

**Goal:** Complete safe administrative maintenance, restoration and never-sent mail replacement locally.
**Architecture:** Extend existing journals with audited transitions; preserve identifiers and immutable source ownership. No formal environment actions.
**Tech Stack:** GAS and vanilla JS with Node/offline browser tests.
**Spec:** docs/superpowers/specs/2026-09-29-raffle-operations-integration.md plus the user-approved completion scope and design below.

## Global constraints and design
- No push/deploy, formal data, live mail or credit redemption. Actual future activity and isolated GAS target are missing, so live acceptance cannot be claimed.
- Active campaign changes require pause first; paused activity retains source ownership. Source ID never changes. Resume revalidates source; changes do not alter historical claim readiness or automatically send mail.
- Restore cancelled physical claims only with admin reason, fresh source agreement, matching venue and valid deadline. Preserve delivered history; zero-delivered restores to waiting, partial restores with explicit remaining-stock verification.
- Replace only a closedBeforeSend job with no attempt. Keep same recipient, qualification set and stable job identity; regenerate content from current source. Persist new content with reason in journal before it can be separately sent. Sent/uncertain jobs cannot reopen.

## Review Focus
- Paused source cannot be rebound by another campaign; stale cached operations cannot write/send.
- Replay validation must reject forged transitions while supporting old draft events.
- Restore must not change delivered quantity or silently bypass expired/source-changed state.
- Reopened mail remains reserved and cannot merge unrelated qualifications; no auto delivery.
- Ambiguous append reuses same request, UI malformed/stale responses must not report success.

### Task 1: Campaign maintenance
Interfaces: manageRaffleCampaign_(session, operation) action pause/update; activation accepts paused with reason.
- [ ] Add fail-first paused/edit/resume/source ownership/role/idempotency tests.
- [ ] Implement journal transitions and settings UI with reasons, readonly source and revalidation on resume.
- [ ] Run node --test tests/raffle-campaign-settings.test.js tests/raffle-frontend.test.js; expect pass. Commit.

### Task 2: Claim restoration
Interfaces: mutateRaffleClaim action restore, reason/venue/version; journal preserves delivered quantities.
- [ ] Add fail-first permission, source/deadline, replay, retry and rendered controls tests.
- [ ] Implement backend checks and explicit UI stock warning.
- [ ] Run node --test tests/raffle-transactions.test.js tests/raffle-frontend.test.js; expect pass. Commit.

### Task 3: Never-sent mail replacement
Interfaces: previewRaffleMailReopen, reopenRaffleMail; operation campaignId/jobId/previewToken/reason/requestId.
- [ ] Add fail-first closed-only/state/recipient/subset/retry tests.
- [ ] Implement regeneration and audited reopen event; two-stage UI preview/confirm, no send.
- [ ] Run node --test tests/raffle*.test.js; expect pass. Commit.
- [ ] Run full Node suite, offline affected browser tests and one fresh overall review. Resolve findings with regression tests. Record actual remaining live acceptance blockers; keep local branch.
