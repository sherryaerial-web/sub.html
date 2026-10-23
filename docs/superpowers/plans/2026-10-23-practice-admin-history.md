# Teacher Practice History Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for this focused, approved frontend change. Steps use checkbox syntax for tracking.

**Goal:** Collapse old teacher practice records without losing access to their contents.
**Architecture:** Partition the existing dashboard response during rendering. Render current cards first and history inside native monthly disclosures.
**Tech Stack:** Static HTML/CSS/JS, Node test runner, Playwright.
**Spec:** docs/superpowers/specs/2026-10-23-practice-admin-history-design.md

## Global Constraints
- Frontend only. No backend edits, Sheet mutations, notifications or deployment.
- Preserve all filters, result totals, participants, audit records and existing actions.

## Review Focus
- Exact end-time boundary uses +08:00, independent of browser timezone.
- Future cancellations belong to history, not the current list.
- Missing or malformed end timestamps do not hide active records.
- Explicit historical filters preserve all returned matches and selected values.
- Mobile disclosure headers, cards and nested audit controls remain usable.

### Task 1: Group And Verify Teacher Practice History

**Files:** Modify index.html and tests/frontend-contract.test.js; create tests/practice-admin-history-browser.mjs.
**Interfaces:** Consumes practiceAdminDashboard.bookings and filters; produces current list and collapsed monthly history in renderPracticeAdminDashboard().

- [x] Add behavior tests for classification, ordering, data preservation, filtering and empty results; run them and observe missing-group failures.
- [x] Extract the existing card renderer without changing its contents; partition and group the bookings and add narrowly scoped disclosure styles.
- [x] Run focused frontend tests and browser interaction/layout checks at desktop, 390px and 320px widths with external requests blocked.
- [x] Review the diff and run node --test tests/*.test.js; retain changes locally for release approval.

## Execution Notes

- Reusing the clean existing linked worktree (detached HEAD); no additional checkout needed.
- Baseline: existing practice admin tests 3/3 passed.
- User approved implementation in chat; release is a separate approval.
- RED: both new classification/filter tests failed because the original renderer had no current/history groups.
- GREEN: focused practice admin tests 5/5; full suite 1207/1207; git diff --check passed.
- Browser: desktop 1366x900, mobile 390x844 and narrow 320x700 passed; simulated US browser timezone still respected Taipei end-time boundary. External network blocked. Native disclosures, audit expansion, record preservation, filters and keyboard toggles checked.
- Screenshots visually inspected: /private/tmp/sherry-practice-history-preview/desktop-collapsed.png and narrow-expanded.png.
- Independent read-only review: no actionable findings. No backend or formal data changes. Not published or committed.
