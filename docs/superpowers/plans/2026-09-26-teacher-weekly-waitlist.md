# Teacher Weekly Practice Waitlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development only if the user chooses delegation. Steps use checkbox syntax.

**Goal:** Enable teacher-created weekly waitlists, extend active September series across months, and safely attach Liz's specified October bookings to recurring series.

**Architecture:** Extend the existing GAS series/booking model and frontend waitlist cart. Separate pure occurrence planning from locked writes; reuse existing reconciliation, cancellation and cache invalidation. No changes to rental or student booking behavior.

**Tech Stack:** GAS, Google Sheets, HTML/JS, Node test runner.

**Spec:** ../specs/2026-09-26-teacher-weekly-waitlist-design.md

## Global Constraints

2026-09-27 approved revision supersedes Task 4 October attachment steps: Liz October rows stay unchanged; create stable November series for B Saturday 13:30–18:00 (11/7) and A Sunday 16:00–19:00 (11/1). Cap her two old series at 10/1 without editing existing occurrences. Test exact preservation, stable retry and no creation before November. Other September continuation remains in scope.

- Existing Sheet indexes are fixed; append a series mode column only at the end. Missing mode means existing ordinary behavior, except positively identified legacy TimeTree waitlist series.
- Unpublished/unknown future schedules are not empty rooms. Extend only across verified published coverage, not merely an assumed next month.
- No extra high-frequency polling; reuse successful sync/reconciliation data where possible.
- Skip rentals, conflicting practice, existing occurrences and cancellation exceptions. Never resurrect stopped series.
- Preserve unrelated dirty LINE changes. Inspect current main/live source before release; local checkout may lag deployed version 181.
- Formal deployment requires explicit approval. Show a dry-run list before any migration writes; no test messages or test bookings in production.

## Review Focus

- Repeated submissions or two scheduler runs must not create duplicate series/occurrences (Tasks 1–2).
- A course covers only the buffer or two course IDs: correct per-date waitlist references and no premature activation (Task 1).
- Empty or incomplete OB response must not authorize next-month empty-room bookings (Task 2).
- Existing October practice, stopped series or cancellation exception must not be overwritten (Tasks 2, 4).
- Liz has different rooms or overlapping existing series: preview must flag ambiguity instead of guessing (Task 4).

### Task 1: Recurring waitlist model and per-date planner

**Files:** Modify Code.gs (PRACTICE_SERIES headers, getPracticeRecordsUnlocked_, createPracticeWaitlist_, createPracticeOccurrenceUnlocked_); test tests/backend-core.test.js.
**Interfaces:** Add `planPracticeSeriesOccurrence_(records, series, date, courseRows)` returning `{action:'create'|'skip', status, calendarIds, reason}`. Series adds `mode:'waitlist'|'ordinary'`; preserve all existing fields and indexes.

- [ ] Add failing tests using createPracticeBackend: weekly dates 2026/10/03, 10/10, 10/17 produce candidate statuses `['候補','已成立','候補']` and IDs `[['first'],[],['third']]`; same series/date twice creates one booking.
- [ ] Add tests for two overlapping course IDs, 15-minute buffer, rental/practice conflicts and ordinary-series unchanged behavior; assert skipped dates create no booking.
- [ ] Run `node --test --test-name-pattern='weekly|series|TimeTree|候補' tests/backend-core.test.js`; confirm relevant new assertions fail.
- [ ] Implement pure planner and guarded weekly create in the existing lock/rollback pattern; validate the first selected course and fetch a verified range once. Use explicit mode, not mutable updatedBy, for new records. Preserve single-create contract and return seriesId, bookingId, affectedDates.
- [ ] Re-run targeted tests; verify success and no partial writes on unavailable OB data. Commit only scoped changes, excluding preexisting Code.gs notification diff.

### Task 2: Safe forward extension

**Files:** Modify Code.gs (expandPracticeSeriesUnlocked_, existing sync/reconciliation hook); test tests/backend-core.test.js.
**Interfaces:** Add `extendActivePracticeSeriesUnlocked_(records, coverage, courseRows, actor, appendAudits)` where coverage is `{from,to,verified:true}` derived from successfully fetched, published schedule scope. Return `{created,skipped,affectedDates}`; consume Task 1 planner.

- [ ] Write failing tests: September active series extends through October; same extension twice preserves row counts; unknown coverage and thrown OB reads cause zero writes; stopDate/one-date cancellation block recreation; other October practice remains unchanged.
- [ ] Run the new tests and verify failure before implementation.
- [ ] Wire extension into a successful existing sync/reconciliation path with no new polling, using verified coverage and the existing business lock. Respect stop/start dates, skip past dates, update practice caches for actual affected dates.
- [ ] Verify targeted tests, including a concurrent/retried run; commit only this task.

### Task 3: Preserve weekly choice in the teacher UI

**Files:** Modify index.html (openPracticeEditor, savePracticeWaitlistSelection, renderPracticeWaitlistCart, submitSelectedPracticeWaitlists); test tests/frontend-contract.test.js.
**Interfaces:** `savePracticeWaitlistSelection(block,startTime,endTime,recurrence='once')`; cart selections persist recurrence; submit uses that value rather than hardcoded once.

- [ ] Write failing VM-based tests: waitlist recurrence control is visible; selecting weekly, reopening and submitting preserves `recurrence:'weekly'`; ordinary checkbox selection defaults once; rental UI unchanged.
- [ ] Run `node --test --test-name-pattern='practice|waitlist' tests/frontend-contract.test.js`, verify new failures.
- [ ] Implement the controls and a visible single/weekly cart label; explain that each week is independently checked and conflicts are skipped. Weekly submissions invalidate affected practice cache instead of just first date.
- [ ] Verify tests and affected modal/cart layout; commit scoped files.

### Task 4: September continuation and Liz migration preview

**Files:** Add scripts/teacher-practice-series-migration.md (operator runbook); modify Code.gs with guarded preview/apply helpers; test tests/backend-core.test.js.
**Interfaces:** `planTeacherPracticeSeriesMigration_(records, courseRows, coverage, lizTeacherId)` returns `{inputDigest,attach,create,skip,ambiguous}` with explicit row/booking IDs. `applyTeacherPracticeSeriesMigration_(session,expectedDigest)` requires course_admin, recomputes under lock and rejects changed inputs. Never accept arbitrary row data from client.

- [ ] Write failing fixtures for September active vs stopped/once; Liz Saturday 13:30–18:00 and Sunday 16:00–19:00; assert existing October IDs preserved, exact series reused, different-room entries ambiguous, unrelated teacher and times unchanged, second application creates zero duplicates.
- [ ] Test stale preview digest: apply fails before any write; test rollback and missing teacher identity. Run and observe failures.
- [ ] Implement scoped planning and application: attach only confirmed Liz records/participants, append missing series, preserve existing cancellation/ownership/audit records. A skipped unrelated booking must never be attached to Liz.
- [ ] Obtain actual teacher identity and room details through authorized read-only sources; produce dated impact preview. If ambiguous, ask user rather than execute. Do not run actual migration in tests.
- [ ] Run targeted tests; commit code/runbook. Present preview for final data-write confirmation.

### Task 5: Release verification and group instructions

**Files:** Release notes and teacher-facing copy under docs/; no unrelated system changes.

- [ ] Run one full `node --test tests/*.test.js` plus `git diff --check`; report known failures separately rather than claiming a clean suite. Review preserved column indexes, cancellation rules and scope.
- [ ] Request approval for exact frontend/GAS deployment and the previewed data changes. After approval, verify live version/source and required service connections independently.
- [ ] Apply approved migration once, reread only affected IDs, compare row counts/statuses with preview. No duplicate notifications or real closure calls.
- [ ] Provide copy-ready Traditional Chinese group notice describing weekly waitlists, cross-month continuation, skipped conflicts and stopping a series; say live only after verification.
