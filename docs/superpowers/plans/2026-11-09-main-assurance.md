# Main System Assurance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make automated decisions inspectable and isolate unverified closure items without adding human approval steps.

**Architecture:** Extend the existing Code.gs dashboards with pure rule/difference builders, a bounded read-only OB assessment cache and read retry. Render compact disclosure sections in existing index.html panels. Reuse retained Sheet versions, fixed indexes, permissions and scheduler.

**Tech Stack:** GAS, Google Sheets, vanilla HTML/CSS/JS, Node test runner.

**Spec:** docs/superpowers/specs/2026-11-09-main-assurance-design.md

## Global Constraints
Only the approved Xiaomei effective-date threshold changes; no new approval gate; no new triggers; no shifted indexes; no writes/recalculations/notifications during local validation. Salary publication/manual-edit locks remain unchanged.

## Review Focus
- Missing/expired/future diagnostic timestamps never claim live freshness.
- Safe read retries never encompass cancel, push, payroll write or payment operations.
- Per-course errors never stop healthy closure candidates or disappear behind a success alert.
- Missing prior payroll/rule versions explicitly mean no comparison baseline.
- Same-total payroll changes, transfers and deductions remain visible, without exposing payroll rates to course-only admins.

### Task 1: Diagnostic Backend
**Files:** Code.gs; tests/main-assurance.test.js.
**Interfaces:** getMainRuleCatalogue_(), buildCourseClosureAssessment_(date, details, before), getCourseClosureAssessment_(), buildMainDataStatus_(rows,index,source), buildPayrollVersionDiff_(month,version,lineRows,summaryRows).
- [x] Add failing tests for real rule precedence, zero/one/two/three people, timestamp states, empty baseline and payroll amount/input/summary differences.
- [x] Implement pure builders; test rates are permission-scoped and no table writes are performed.
- [x] Add cached safe read assessment and bounded per-item retry, scheduler integration and exception notification details.
- [x] Verify actual core integration: bad item stops alone, good item still runs; reads never repeat mutations.

### Task 2: Existing Dashboard UI
**Files:** Code.gs, index.html, tests/main-assurance.test.js.
**Interfaces:** courseClosure.ruleCatalogue/assessment; adminDashboard.dataStatus; payrollDashboard.ruleCatalogue/dataStatus/comparison.
- [x] Add failing render/contract tests for read-only catalogue, source timestamps, assessment and payroll differences.
- [x] Wire existing permission-checked endpoints; add collapsible scannable tables, stale/error states and updated closure-copy label.
- [x] No additional confirm/approve button; first-priority diagnostic panels have no mutation route.
- [x] Verify render at desktop/mobile and keyboard disclosure controls.

### Task 2B: Approved Second-Priority Operations
**Files:** Code.gs, index.html, main-assurance-ui.js, main-assurance-ui.css, focused tests.
- [x] Exact course-ID history with replacement links and payroll permission isolation.
- [x] Self-owned exception tracking, notes, followups, optimistic versioning and audit/rollback; close validates live OB terminal state.
- [x] Ordered task links and per-channel notification evidence without treating acceptance as delivery/read.
- [x] Explicit live-verified instructor ID/account mappings; no history renames or guessed aliases.
- [x] Focused permission, unknown-outcome, concurrency, financial and offline browser coverage.

### Task 2C: Approved Third Priority And Xiaomei
**Files:** Code.gs, index.html, main-assurance-ui.js, main-assurance-ui.css, tests/main-health.test.js, tests/main-assurance.test.js, tests/main-assurance-ui.test.js.
**Interfaces:** operations.systemHealth={checkedAt,checks,notifications,backup,backupAllowed}; checks use {key,label,status,lastAttemptAt,lastSuccessAt,detail,error}. backup uses {status,lastSuccessAt,operationId,backupId,rehearsalId,error,sheetCount,cellCount}. POST createMainBackup accepts operationId and returns backup state. Existing practice/payroll API contracts are unchanged.
- [x] RED then GREEN: Xiaomei exact/canonical names, Nov8/9 boundary, 1/2 students, discounted/floor/duet priority, incomplete inputs and zero-only stage.
- [x] RED then GREEN: account-isolated allowlisted query preferences, bounded long-list rendering, page/scroll restoration, failed refresh and account changes.
- [x] RED then GREEN: actual-operation health telemetry, stale/unknown/failure distinctions, independent notification evidence and readonly dashboards.
- [x] RED then GREEN: permission/idempotency/unknown-result guards for separate backup/rehearsal copies, full data/formula verification and no source writes.
- [x] Independent review, final full regression, offline desktop/mobile verification and refreshed evidence manifest.

### Task 3: Verification And Release
**Files:** plan ledger, release artifacts outside repo.
- [x] Run diff/syntax and full relevant regression for the final implementation; 1451 passed,0 failed,1 opt-in browser skipped and separately verified45/45.
- [x] Request bounded independent whole-change review; three Important findings fixed with regression tests.
- [ ] Verify production composition, preserve every GAS module, and seek scoped authorization for main/Pages/GAS publication if not already granted for this feature.
- [ ] Independently read back production source hashes, deployment and health; report business-operation impact.

## Execution Ledger
- 2026-11-09: Existing clean linked worktree at db5a89d equals origin/main; reuse it. User approved native execution and no extra preview gate.
- 2026-11-09: User explicitly selected local validation only, no release, and requested all forthcoming changes be shipped together. Follow docs/main-system-pending-release.md; no push/Pages/GAS deployment until the full scope is complete and the user approves the whole batch.
- 2026-11-09: Initial backend builders and closure integration added. Nine targeted backend tests passed. UI remains incomplete; full regression and independent review have not run. Do not mark this batch complete.
- 2026-11-09: User added priorities 6-10 and consistent closure-copy wording, still no release. Frontend implemented in an independent disjoint file scope; backend stayed in this worktree.
- 2026-11-09: Offline browser25/25 passed with12 desktop/390px/320px screenshots, all network requests blocked. Whole suite before review fixes1408 passed,0 failed,1 browser opt-in skipped.
- 2026-11-09: Final review found3 Important issues. Fixed canonical ID mapping before No Show report preflight (including concurrent mapping guard), restored-cancellation live checks, and cancelled delay-occupancy terminal validation. Regression tests were observed RED then GREEN. Cancelled special cases also verify restored source slots. Final full suite running after the fix pass.
- 2026-11-09: Final suite1412 total,1411 passed,0 failed,1 browser opt-in skipped; browser separately25/25 passed. Syntax and diff checks passed. Local only; release remains explicitly blocked until the user's later whole-batch authorization. No deferred reviewer findings.
- 2026-11-09: User added priorities11-12 and Xiaomei two-student minimum from today. Reopened final-validation tasks; previous artifacts describe priorities1-10 only. Ruling: "all" includes discounted/duet public classes, but preserves rental/private exclusions and zero-only early closure. Ruling: backups are explicit separate-copy commands, not new automatic jobs; no production backup or restore runs locally.
- 2026-11-09: Xiaomei and health/backup tests observed RED then GREEN. Backend/closure regressions797/797 passed. Long copy calls run outside the business lock; corrupt notification evidence remains unknown, accepted LINE delivery clears current queue count, and latest100 notice evidence is explicitly bounded. Fresh backend review underway; frontend still in progress. No deployment or live operations.
- 2026-11-09: Backend review found4 reproducible issues; all added tests observed RED then GREEN (31/31). Multiple effective instructors block automatic closure, while one explicit substitute remains authoritative. Numeric rental failures, snapshot fallback, paused invoice sync and rate limits do not count as success. Known pre-copy failure is explicitly retryable with a new command; unknown copies remain blocked. Ruling: backup IDs contain their creation timestamp and only the current Taipei date may create a new operation; same-day copied commands cannot be replaced, and old retired IDs cannot replay after later-day commands. This avoids an unbounded receipt ledger. Baseline reads share the mutation lock; slow copy calls do not.
- 2026-11-09: Integrated backend review also caught the identity-mapping step clearing the new multi-instructor error. Full normalize -> exact identity mapping -> rule tests observed RED then GREEN; existing identity errors are retained. First final suite1447passed/0failed/1browseropt skip; offlinebrowser41/41passed.
- 2026-11-09: Fresh frontend review found2 Important account/tab races. Four regression tests observed RED then GREEN (44unit pass,1browseropt skip): main foreground/background requests share a latest-request guard and auth check; practice/payroll late success/error cannot repaint an abandoned view; read loading/inert ownership prevents an older request unlocking a newer one. Final full suite and browser verification rerunning after these changes. Keep release blocked.
- 2026-11-09: Final third-priority review closed all6 findings; frontend narrow followup also passed8 offline interleavings. Final full suite1452total/1451passed/0failed/1browseropt skip; browser separately45/45passed with15screenshots. GAS, UI module and inline script syntax plus diff checks passed. All12 priorities, wording and Xiaomei rule remain one uncommitted local batch; no push/deploy/production writes/notifications or real backup copies. Pending-release ledger includes a future readonly check for upcoming Xiaomei classes already cancelled by the old minimum; never auto-reopen.
