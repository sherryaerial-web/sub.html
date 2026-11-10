# Task 1 Domain Handoff

Implemented only `personal-appearance.js`, `Code.gs`, `tests/personal-appearance.test.js`, and `tests/personal-appearance-backend.test.js`, plus this requested optional report. Existing parent changes were not reverted. No commits, deployment, network, live properties, Sheets, OB, mail, notifications, or subagents.

## Verification

- Initial RED: 62 tests, 61 failed because the new module/routes were absent; the existing session rejection case already passed.
- Additional regression REDs: receipt-storage failure after delivery, acknowledged reconciliation, and conflict reload after offline failure. Each fixed and verified GREEN.
- Focused domain/backend: 79 passed after integration follow-up.
- Domain/backend plus existing `tests/admin-transport.test.js` and `tests/admin-request-recovery.test.js`: 95 passed, 0 failed.
- `git diff --check`: passed. Full regression and browser integration remain parent-owned.
- Backend tests execute the real `doPost`, session validator and tracked receipt protocol with in-memory GAS services. Integrated transport tests use an in-process fetch mock only; business services throw on access.

## Exact Interface Clarifications

- Named API and snapshot fields match Task 1. `palettes` is a frozen array of `{id,label,primary,secondary,surface,page,nav,ink,muted,line,edge,strong}`. Neutral values now match all six approved mock palettes exactly. Snapshots are copies; closed `draft` is `null`; `busy` is boolean. `setSession` is synchronous and never fetches. `load`, `open`, and `save` return promises resolving to snapshots, including handled failures.
- Requests include captured `sessionToken`, never owner or acting fields. Use existing `callPostApi` unchanged except the parent's action label/acting exclusions. Saves require `clientOperationId` from that tracked transport; direct untracked backend saves return `tracking_required` without a write.
- `open()` opens synchronously before refreshing. Dirty drafts retain their original revision if a fresh read arrives: no silent rebase over another device's save. `load()` after conflict explicitly replaces the draft with current server data, unless edited again during that read; failed reloads retain reload intent.
- Close/cancel ends preview, not the sent save. Same-session completion updates confirmed preference/cache without reopening. Account/token/verification changes ignore earlier completions. Acting changes discard preview but still reconcile a same-session save against the real owner.
- Unknown delivery retains exact serialized draft/revision for subsequent explicit `save()` through tracked reconciliation. While unresolved, edits/reset/load do not replace that payload; close/reopen preserves it. No automatic write retry. A transport acknowledgment that explicitly clears an old receipt requires a fresh `load()` before another save.
- Optional appearance cache denial does not break reading/login or a confirmed cloud save. Transport receipt-storage errors may occur before OR after server delivery: show the supplied message, retain the request, and never assume no write. Such errors use `status: error`; ordinary unknown delivery uses `uncertain`.
- Use `--appearance-primary` / `--appearance-on-primary` and secondary equivalents for exact selected fills and their readable foregrounds. Existing `--sea-*`, muted and subtle text tokens are derived/darkened where needed for >=4.5 contrast. Original required ink/surface/page/nav/line/sea-800/edge tokens remain exact. Semantic tokens are not returned or modified.
- Only confirmed save results update the per-owner browser cache. Server retrieval failures use validated existing cache/default and disable cloud save until a current revision is obtained.

## Backend Boundaries

Canonical verified `session.teacherName` hashes to `PERSONAL_APPEARANCE_V1_<sha256>`. Strict record/request fields, six-digit hex, schema/revision checks and 1 KiB bounds reject unknown data. Save locks, rereads, checks revision, writes one appearance property and verifies readback. Same content is a no-op success; reset is a versioned write. Corrupt records remain untouched. Known rejection/conflict returns `saved:false` as a completed tracked outcome; write/readback exceptions retain uncertain receipts. Existing `ADMIN_OP_` metadata behavior is unchanged.

No outstanding Task 1 blocker. Browser geometry, actual token application/contrast on integrated controls, session hooks and the combined release still require parent verification.

## Integration Follow-Up

- Preserved the array API and added all neutral fields from the approved `personal-color-options.html` mock. Theme surfaces, ink, border, edge and strong text map directly to the selected base; custom colors do not replace these neutrals. Original foregrounds prefer soft `#fffdf9` and `#665851` when contrast permits. Muted/subtle text still darkens only as needed for 4.5:1.
- RED then GREEN: missing neutral palette values; a new edit during an explicit conflict reload being overwritten. The latter now compares the draft reference captured at read start.
- Added exact operation ID/request assertions for `not_received` explicit retry after cancel/reopen, and same-account token refresh. Added `running`, `uncertain`, and completed-without-payload status cases: only the original operation is queried, with no new mutation.
- Added stale read failure and stale save failure during a newer session's save; neither can alter new state, busy flag or confirmed cache.
- Follow-up touched only the domain module, its two test files and this report; backend and parent's transport/DOM/CSS were not edited. Browser launch/escalation remains parent-owned.
