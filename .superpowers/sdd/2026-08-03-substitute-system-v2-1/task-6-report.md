# Task 6 Report: Structured Course Adjustments

Status: completed

## Review Round 1 Fixes

- `getClaimOptions_` now returns an empty result unless the authenticated teacher has an active invitation and claiming is not globally paused.
- Claim options are filtered server-side to the teacher's protected capability categories before OB classes are returned.
- Existing OB class choices now use the stable `classId` as the datalist value. The visible label includes course name, category, and class ID so duplicate display names remain distinguishable.
- Frontend lookup and claim payload construction resolve the exact selected class ID; backend validation and Sheet persistence also resolve by that class ID.
- Added direct-route tests for uninvited and paused claim options plus duplicate-name regression tests for frontend payload and backend persistence.

## Implemented

- Added protected teacher capability data in the appended `可教授類別` account column.
- Added `teacherCanTeachCategory_` and `validateClaimChange_` server-side validation.
- Supports `original`, `existing`, and `new` handling types.
- Existing OB classes are loaded from `CourseList`, deduplicated by OB class ID, and resolved server-side so a forged frontend course name is ignored.
- Cross-apparatus claims require a structured course change and note; same-apparatus difficulty and note remain optional.
- New-class requests require course name, teachable category, difficulty, and a note when the apparatus changes.
- Claim writes preserve the fixed A:J contract and store structured values in appended columns. H remains a readable summary for manual operations.
- Added the appended `實際課程類別` column without moving any existing column.
- Rebuilt the claim UI with three handling options, searchable existing OB classes, new-course fields, difficulty, and an always-available note.
- Required-note state updates immediately when the selected apparatus differs from the original.
- Personal substitute history now shows the selected handling type, actual course, difficulty, and readable note.

## TDD Evidence

- Added failing tests first for protected capability reads, original-course reuse, existing-class selection, new-class requests, cross-apparatus notes, optional same-apparatus fields, difficulty persistence, and claim options.
- Added frontend failing tests for the structured payload, all handling types, searchable class controls, cross-apparatus validation, and dynamic required-note state.
- Confirmed the new tests failed because the required helpers and UI did not yet exist, then implemented the minimum behavior to pass.

## Verification

- Focused claim-options and duplicate-name tests passed.
- `node --test tests/*.test.js`: 88 passed, 0 failed.
- `Code.gs` and the inline `index.html` script both passed JavaScript syntax parsing.
- `git diff --check` passed.
- Secret scan found no embedded JWT or frontend bearer token. The expected server-side bearer header remains in `Code.gs`.

## Self-Review

- Teacher identity and capability checks are server-side and bound to the authenticated session.
- Existing OB course names and categories are resolved from server data by class ID.
- Concurrent claims remain protected by the existing script lock and current-status recheck.
- Existing Sheet indexes A:J are unchanged; new account and leave fields are appended only.
- Legacy `changeNote` input remains accepted only as a transition fallback, while the new frontend sends the full structured payload.

## Deployment Note

- Before teachers can claim, fill `登入帳號` column H (`可教授類別`) for each active teacher, using values such as `空環、舞綢、瑜伽`.
- Run `ensureSystemStructure_()` once after installing this version so the appended account and leave headers are created.
- This branch is local only and has not been pushed or deployed.
