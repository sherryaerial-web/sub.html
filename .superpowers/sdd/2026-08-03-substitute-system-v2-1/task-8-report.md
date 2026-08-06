# Task 8 Completion Report

Date: 2026-08-06

## Status

Completed locally on `feature/substitute-v2`. This task has not been pushed, merged, or deployed.

## Delivered

- Rebuilt the teacher and administrator interface with a restrained sea-glass operations design, responsive navigation, Lucide icons, searchable four-digit PIN login, date-first leave selection, structured claim forms, personal records, and six administrator work queues.
- Kept the mobile primary navigation in normal document flow so it does not cover long forms.
- Added one bounded desktop and one bounded mobile Playwright viewport journey, capturing 11 states in each for 22 visual states/screenshots total. These cover login, leave confirmation, personal histories, the cross-apparatus claim form, and all six administrator tabs; backend and frontend tests cover write behavior.
- Fixed an administrator-card rendering bug found during screenshot inspection where `Array.map` passed its index into the optional HTML argument and displayed `0` or another index.
- Added the manual-only `importTeacherAccountsFromPasswordSheet` setup function for the supplied 37-row `密碼表` workbook.
- Replaced the deployment guide with the exact Sheet migration, first-admin, 37-teacher import, Script Property, GAS redeploy, GitHub Pages, manual sync, verification, and rollback sequence.

## Password Import Safety

- Requires the imported source tab to remain named `密碼表` with headers `老師` and `密碼`.
- Requires exactly 37 populated teacher rows and a four-digit PIN on every row.
- Rejects duplicate teacher names case-insensitively while preserving the source spelling, spaces, symbols, and Unicode characters.
- Validates the complete source and account-sheet contract before any account write.
- Uses the existing Salt plus SHA-256 account primitive; no PIN is returned, logged, routed through the frontend, or stored in `登入帳號`.
- Creates new imported accounts as active role `老師` with blank `可教授類別`.
- Existing accounts receive a new Salt/PIN hash but preserve role, active status, failed-login/lock state, and capabilities. An imported first administrator remains an active administrator and can access the authenticated admin route.
- Snapshots the complete account target range, source PIN range, and prior completion property before mutation.
- Writes the full account batch before clearing any source PIN. Account-write, PIN-clear, or completion-property failure triggers compensation of all three snapshots; rollback failures explicitly name the store that was not restored.
- On success, clears only the populated password range, keeps the source names and source tab, and sets `TEACHER_PASSWORD_IMPORT_COMPLETED_AT` to prevent accidental reruns.
- The setup function is not exposed through `doGet` or `doPost`; it must be run manually from the Apps Script editor.

## Verification

- Backend and frontend tests: 114 passed, 0 failed.
- Focused TDD coverage: all-or-nothing validation, duplicate names, successful hashing, first-admin preservation/admin-route access, account-write failure, post-clear failure, post-property-write failure, explicit rollback-failure reporting, operational-doc scans, and administrator-card index leakage.
- GAS syntax: passed with `node --check` on a temporary `.js` copy.
- Test syntax: passed with `node --check tests/backend-core.test.js`.
- Secret and legacy scan: no embedded JWT/API token, no `no-cors`, and no periodic-sync installer/instruction in production or tracked operational docs. `工作表1` appears only in the intentional migration constant and historical/migration documentation.
- `git diff --check`: passed.
- Visual states/screenshots: 22 of 22 captured within the 90-second bound across two viewport journeys.
- Pixel checks: every screenshot nonblank.
- Layout checks: no document-level horizontal overflow, clipped tested controls, or fixed mobile-navigation overlap.
- Key screenshots manually inspected: desktop/mobile login, mobile leave confirmation, mobile cross-apparatus claim, mobile pending invitations, and desktop OB work queue.

Fix round 1 did not rerun Playwright because neither `index.html` nor `tests/visual-check.mjs` changed. The visual evidence above is the unchanged Task 8 run; this round reran the complete Node suite, both syntax checks, and all production/operational-document scans.

Screenshots are stored in `/private/tmp/substitute-v2-screenshots`.

## Deployment Prerequisites

1. Record the compatible rollback set: pre-deployment Google Sheet backup, exact Apps Script version/deployment, and frontend Git commit.
2. Rotate the Omcean token previously exposed in conversation and store only the new value as `OMCEAN_API_TOKEN` in Script Properties.
3. Deploy `Code.gs`, run `ensureSystemStructure_()`, initialize the first administrator, then import the 37-row `密碼表`.
4. Fill blank `登入帳號` column H (`可教授類別`) values for newly created accounts before relying on cross-apparatus claim rules; existing values are preserved.
5. Redeploy the GAS Web App before publishing `index.html` to GitHub Pages.

The exact operator workflow and rollback steps are in `README.md`.
