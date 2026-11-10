# Personal Appearance and Combined Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Track completed steps below.

**Goal:** Add account-specific preset/custom colors and publish the approved navigation/practice/mobile fixes together.

**Architecture:** Isolated GAS account properties and a small UMD appearance controller own preference validation, revisions, preview state and race guards. Existing DOM/session wiring applies CSS variables without rerendering business forms. The existing tracked mutation transport remains responsible for uncertain delivery.

**Tech Stack:** Static HTML/CSS/JavaScript, Google Apps Script, node:test, offline Playwright.

**Spec:** `docs/superpowers/specs/2026-11-10-personal-appearance-design.md`

## Global Constraints

- Original taupe/blush is default; preserve all six exact approved presets plus two custom color inputs.
- Same-account cross-device storage, explicit save, reversible preview, no other-account access.
- Preserve all existing leave/practice/rental/payroll/notification behavior and mobile geometry.
- User authorized combined publication on 2026-11-10 with "全部一起上"; this supersedes the earlier no-deployment hold only for this batch.
- No real business-data mutations, payroll publishing, OB calls, mail or notifications in testing/release.
- Complete files in the repository; no partial code handoff. Parent owns commits and release after tests.

## Review Focus

- Saved browser session is unverified until getSession succeeds: no account preference retrieval before validation.
- Same owner with a newer session must ignore earlier reads/saves, and changing acting mode must discard preview.
- Closing during a pending save must not falsely claim the server save was canceled.
- Generic tracked transport sees known validation/conflict failures as completed non-saved outcomes, not uncertain errors.
- Extremely light/dark custom colors must not make selected navigation, controls or dialogs illegible.

### Task 1: Preference Domain and GAS API

**Files:** `personal-appearance.js`, `Code.gs`, `tests/personal-appearance.test.js`, `tests/personal-appearance-backend.test.js`.

**Interfaces:**
- UMD global/CommonJS `SherryPersonalAppearance`: `palettes`, `defaultPreference()`, `themeTokens(preference)`, `createController({request,storage,onChange})`.
- Controller: `setSession({owner,token,acting,verified})`, `load()`, `open()`, `setPreset(id)`, `setColor('primary'|'secondary',hex)`, `reset()`, `cancel()`, `save()`, `snapshot()`.
- Snapshot: `{preference,draft,isOpen,busy,canSave,status,message,needsReconciliation}`. `status`: idle/loading/ready/dirty/saving/saved/error/conflict/uncertain. `needsReconciliation` exposes a retained unknown request so the UI names the original-operation check correctly. `onChange(snapshot)` fires after state changes. `setSession` returns synchronously and starts no read until verified; parent explicitly calls load after verification. `open()` immediately opens draft and refreshes latest preference safely.
- Request: `request(action,params)` delegates existing `callPostApi`. `getPersonalAppearance` returns `{available:true,preference}` or `{available:false,reason}`. `savePersonalAppearance` accepts `{preference:JSON.stringify(draft),expectedRevision}` and returns `{saved:true,preference}` or `{saved:false,reason,current?}`.
- Preferences have `{schemaVersion:1,mode,presetId,primary,secondary,revision,updatedAt}`; missing defaults revision0/updatedAt empty string. Custom presetId is the selected neutral base.
- `themeTokens` returns CSS property map including existing `--ink,--muted,--subtle,--line,--line-strong,--surface,--page,--soft,--sea-800,--sea-700,--sea-600,--aqua-100,--aqua-50` and `--appearance-primary,--appearance-on-primary,--appearance-secondary,--appearance-on-secondary,--appearance-nav,--appearance-edge`. Keep body/readable surface text >=4.5; semantic tokens stay separate.

- [x] Write and run failing unit/backend tests for presets, validation, contrast, preview/cancel/reset, deferred load/save races, acting mode, offline/cache denial, revisions, unknown result, real session ownership and property-only writes.
- [x] Implement domain/controller and backend get/save handlers in existing authenticated routing; reject injected targets and preserve tracked mutation receipt safeguards.
- [x] Run `node --test tests/personal-appearance.test.js tests/personal-appearance-backend.test.js`; expect all pass and zero business writes.

### Task 2: Product Integration

**Files:** `index.html`, `workspace-navigation.css`, `admin-transport.js`, `tests/personal-appearance-browser.mjs`, existing offline fixture only if needed.

**Interfaces:** Consume Task 1 API exactly. Apply tokens to `.app-shell` and `body > dialog`; selected preview if open, confirmed preference otherwise. Verified login/restoration calls setSession+load; unverified restoration never loads; clearSession restores original. Acting changes call setSession and disable entry.

- [x] Write failing offline browser tests for My entry/dialog, preset/custom/reset/cancel/save, teacher/admin views, 390/320 mobile, leave draft preservation, session changes, and failed/conflicting save messages.
- [x] Add My > 個人化 dialog and native color controls with Lucide reset/close; preserve DOM and all business listeners.
- [x] Replace only hardcoded shell color values, retain layout and native date/time fixes. Original header relationship restored, semantic status colors independent.
- [x] Run focused browser/domain tests; expect no overflow, no JS errors, no real network/write calls.

### Task 3: Combined Verification and Release

**Files:** release evidence under `output/`; only verified changed batch files staged.

- [x] Review new feature and existing pending batch; resolve important findings with regression coverage.
- [x] Fetch origin/main and verify ancestry/current deployment target without overwriting other work.
- [x] Run final `node --test tests/*.test.js` once plus affected offline practice/push/navigation/personalization browsers and `git diff --check`; all required checks pass.
- [ ] Commit batch; publish GAS via existing release workspace/deployment first, then non-force GitHub main push and Pages verification.
- [ ] Independently read back GAS version/source hash and public Pages/asset hashes; report actual data/notification impact and release identifiers.

## Execution Notes

- 2026-11-10: Design reviewed by independent builder with no important unanswered questions. User approved all-in-one release. Existing linked worktree reused; prior batch tests already passed, so only changed feature checks run before the one final shared regression.
- 2026-11-10: Full unit regression 1541 passed, 1 optional browser skip. Navigation browser 76 scenes; personalization 33 preset/extreme-color scenes plus cancel/save/conflict/uncertainty/session checks; compact/history/push browsers passed. Review corrections verified with 95 domain/transport tests and hover contrast/browser recovery checks. Production preflight: GAS 257, 12 unchanged modules, HEAD matches deployed, public index and source match base main.
- 2026-11-10: Independent reviewer rechecked both fixes and found no unresolved important issue. Release source hashes sealed; complete 12-module GAS package preserves the existing manifest. Post-release results are recorded in `output/workspace-personalization-release-20261110/` outside this source tree.
