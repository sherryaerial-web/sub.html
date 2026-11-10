# Workspace Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved two-workspace classification locally while preserving existing functional workflows.

**Architecture:** Reuse original functional views and handlers in `index.html`. Move management navigation into its own shell and map the original tabs to grouped destinations. Use a scoped stylesheet for the approved neutral/sea-glass presentation.

**Tech Stack:** Existing HTML/CSS/JavaScript, Lucide, node:test, offline Playwright.

**Spec:** `docs/superpowers/specs/2026-11-10-workspace-navigation-design.md`

## Global Constraints

- No deployment, commits, pushes, formal writes, real notifications or messages in this batch.
- Preserve existing dirty practice/push fixes.
- Keep business handlers, backend files, permission values and Sheet indexes unchanged.
- Prototype sample data and simplified handlers must not replace the real application.

## Review Focus

- Invoice-only, payroll-only, VVIP-only and raffle-only accounts must land on a permitted child of the grouped destination.
- Monthly VVIP/closure shortcuts and legacy tab links must land in the new correct group.
- Admin inbox and acting-teacher transitions must not expose unauthorized management controls.
- Mobile More, status selection and native form fields must fit 320px without trapping focus.
- Leave batch submission and all customized booking/financial workflows must remain original.

## Tasks

### Task 1: Correct The Local Leave Mockup
- [x] Reproduce the missing parity with `check-leave.mjs` (reason field failed).
- [x] Remove the added fields; restore multi-date/course selection, all/clear and confirmation.
- [x] Pass the focused check at 1366/390/320px with zero external requests.

### Task 2: Group Original Navigation
Files: `index.html`, `tests/frontend-contract.test.js`.
- [x] Add failing tests for group mappings, permissions, legacy routes and retained leave controls.
- [x] Reuse original tabs with `getAdminSectionTabs(section)`, `getAdminTabCapability(tab)` and `syncWorkspaceNavigation(viewId)`.
- [x] Add role switch, management sidebar/mobile More, and course groups/status select without replacing functional DOM.
- [x] Pass focused contracts.

### Task 3: Apply Scoped Presentation
Files: `workspace-navigation.css`, `index.html`, `tests/workspace-navigation-browser.mjs`.
- [x] Style the shared shell and unframed sections; keep existing framed editors/dialogs and safety warnings.
- [x] Exercise original leave multi-selection and every management destination offline.
- [x] Check desktop/390px/320px screenshots, overflow, keyboard and account capability variants.

### Task 4: Verify And Hand Off Locally
- [x] Compare original/updated runtime function sources; changes must be navigation/render-layout-only.
- [x] Run the full offline unit regression once, then focused browser suites for changed surfaces.
- [x] Obtain a fresh review, address concrete findings and update this checklist.
- [x] Provide a standalone no-network local preview. Leave all changes uncommitted and undeployed.

## Execution Notes

- Existing linked worktree: `.worktrees/app-stock-20261031`, branch `codex/student-practice-fallback-20261108`.
- Ruling: remain in this existing isolated worktree and preserve the pending batch; no new checkout is needed.
- Ruling: user-approved classification plus the resume instruction authorizes local integration, not release.
- Review fix: carry each original course count into the status selector; do not sum unrelated units across course groups.
- Review fix: refresh all permitted workbench sources. The raffle module keeps its existing query/refresh controls; hide the generic header refresh there to avoid resetting an in-progress raffle form.
- Browser regression: generic mobile padding overrode the previous native iOS date/time guard. Restored zero inline padding and kept the original compact-practice regression test unchanged.
- Verification: full offline unit run passed 1463 tests, skipped one opt-in browser test, zero failures. Runtime comparison preserved 397 functions with only nine pre-existing navigation functions changed; no original function removed.
- Verification: 76 original-app browser scenes at 1366/390/320px passed with all 18 original management tabs, independent capability variants, original multi-date leave confirmation, recurring-rental controls and mobile More/Escape coverage. Zero external requests or mutations.
- Verification: focused compact-practice, practice-history and push-notification browser suites passed with the new stylesheet. Fresh reviewer confirmed both findings resolved. Actual iPhone hardware and live OneSignal integration were not exercised.
