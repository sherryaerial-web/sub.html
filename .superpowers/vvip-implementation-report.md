# VVIP Implementation Report

Date: 2026-08-08

## Delivered

- Public `vvip.html` Email-only course-intent page with cumulative unique four-course limit.
- POST-only public lookup/submission; Email is not placed in URLs.
- Isolated `VVIP選課紀錄` and `VVIP選課設定` Sheets, created by `ensureSystemStructure_()`.
- Locked, all-or-nothing selection writes with duplicate handling and audit records.
- Seventh administrator tab for manual open/close, Email confirmation, single-course cancellation, course view, and CSV export with formula-injection protection.
- README operating instructions and VVIP-focused backend/frontend/visual checks.

## Focused Verification

- Backend and frontend VVIP tests: 12 passed, 0 failed.
- GAS and inline frontend JavaScript syntax checks: passed.
- Frontend secret/no-cors scan and `git diff --check`: passed.
- Visual journey: one desktop and one mobile journey passed; screenshots inspected at:
  - `/private/tmp/substitute-vvip-screenshots/desktop-vvip-final.png`
  - `/private/tmp/substitute-vvip-screenshots/mobile-vvip-final.png`

## Before Deployment

1. Run `ensureSystemStructure_()` once in the production Apps Script project.
2. Manually sync OB so all next-month `CourseList` rows have an `OB Calendar ID`.
3. Deploy compatible `Code.gs`, `index.html`, and `vvip.html` together.
4. Open the VVIP period in the administrator's seventh tab only after the sync is verified.

No push or deployment was performed. The complete system suite remains intentionally unrun until the user requests final production deployment.
