# Task 8 Completion Report

Date: 2026-08-05

## Status

Completed locally on `feature/substitute-v2`. This task has not been pushed, merged, or deployed.

## Delivered

- Rebuilt the teacher and administrator interface with a restrained sea-glass operations design, responsive navigation, Lucide icons, searchable four-digit PIN login, date-first leave selection, structured claim forms, personal records, and six administrator work queues.
- Kept the mobile primary navigation in normal document flow so it does not cover long forms.
- Added 22 bounded Playwright journeys at 1280x900 and 390x844, including login, leave confirmation, personal histories, cross-apparatus claims, and all six administrator tabs.
- Fixed an administrator-card rendering bug found during screenshot inspection where `Array.map` passed its index into the optional HTML argument and displayed `0` or another index.
- Added the manual-only `importTeacherAccountsFromPasswordSheet` setup function for the supplied 37-row `密碼表` workbook.
- Replaced the deployment guide with the exact Sheet migration, first-admin, 37-teacher import, Script Property, GAS redeploy, GitHub Pages, manual sync, verification, and rollback sequence.

## Password Import Safety

- Requires the imported source tab to remain named `密碼表` with headers `老師` and `密碼`.
- Requires exactly 37 populated teacher rows and a four-digit PIN on every row.
- Rejects duplicate teacher names case-insensitively while preserving the source spelling, spaces, symbols, and Unicode characters.
- Validates the complete source and account-sheet contract before any account write.
- Uses the existing Salt plus SHA-256 account primitive; no PIN is returned, logged, routed through the frontend, or stored in `登入帳號`.
- Creates or updates all imported accounts as active role `老師`; `可教授類別` remains blank for later entry.
- Writes the full account batch before clearing any source PIN. Validation or account-write failure leaves every plaintext PIN untouched.
- On success, clears only the populated password range, keeps the source names and source tab, and sets `TEACHER_PASSWORD_IMPORT_COMPLETED_AT` to prevent accidental reruns.
- The setup function is not exposed through `doGet` or `doPost`; it must be run manually from the Apps Script editor.

## Verification

- Backend and frontend tests: 109 passed, 0 failed.
- Focused TDD coverage: all-or-nothing validation, duplicate names, successful hashing, plaintext clearing only after account success, and administrator-card index leakage.
- GAS syntax: passed with `node --check` on a temporary `.js` copy.
- Test syntax: passed with `node --check tests/backend-core.test.js`.
- Secret and legacy scan: no embedded JWT/API token, no `no-cors`, and no hourly trigger installer. `工作表1` appears only in the intentional migration constant and deployment documentation.
- `git diff --check`: passed.
- Visual journeys: 22 of 22 completed within the 90-second bound.
- Pixel checks: every screenshot nonblank.
- Layout checks: no document-level horizontal overflow, clipped tested controls, or fixed mobile-navigation overlap.
- Key screenshots manually inspected: desktop/mobile login, mobile leave confirmation, mobile cross-apparatus claim, mobile pending invitations, and desktop OB work queue.

Screenshots are stored in `/private/tmp/substitute-v2-screenshots`.

## Deployment Prerequisites

1. Back up the production Google Sheet.
2. Rotate the Omcean token previously exposed in conversation and store only the new value as `OMCEAN_API_TOKEN` in Script Properties.
3. Deploy `Code.gs`, run `ensureSystemStructure_()`, initialize the first administrator, then import the 37-row `密碼表`.
4. Fill `登入帳號` column H (`可教授類別`) before relying on cross-apparatus claim rules.
5. Redeploy the GAS Web App before publishing `index.html` to GitHub Pages.

The exact operator workflow and rollback steps are in `README.md`.
