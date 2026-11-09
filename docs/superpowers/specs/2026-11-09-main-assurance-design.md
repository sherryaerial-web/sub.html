# Main System Assurance

Approved in chat: first-priority items 1-5; background checks without an approval gate.

## Scope
- Read-only closure/payroll rule catalogue, precedence, effective-month ranges and release history.
- Automatic next-day closure assessment with enrollment, points, minimum, shortage, reason and fetch time. Never cancels from an assessment snapshot.
- Compare rule outcomes for the same real courses against a prior assessment when available; unavailable baseline is explicit, never invented.
- Explicit OB live/cache/failure and CourseList/payroll snapshot timestamps. One bounded retry for safe OB reads only; unverified affected closure items stop, other items continue and existing admin notifications include the exception.
- Payroll recalculation differences from retained same-month versions, including course/teacher amount and observed input/rule changes; read-only and non-blocking.

## Approach
Use existing dashboards and retained payroll rows, rather than new approval screens or new formal tables. An alternative mandatory preview was rejected by the user. Existing payroll sync/publication/manual-edit locks and notifications remain authoritative. No automatic salary publishing, payments, booking changes or new payroll calculations during rollout.

## Boundaries
Preserve all Sheet indexes and existing business thresholds except the explicitly approved Xiaomei change below. Rule catalogue must derive closure labels/minimum from the real evaluator and payroll rates from the existing salary settings. Reads may cache diagnostic metadata, never write business rows. Scheduled assessments use the existing scheduler, not another trigger.

## Approved Extension
User added priorities 6-10 and closure-copy wording, still local validation only. Add course history with payroll capability isolation, self-assigned exception tracking with optimistic concurrency and verified-source closure, urgency-ordered task links, per-channel notification evidence (unknown remains unknown), and explicit OB instructor/account links. Tracking and identity writes require course_admin, no impersonation, a matching version, an audit and rollback; no underlying booking changes or notifications. Optional supporting tables are created only by explicit save, never by a read. Instructor links require a live exact ID and an active canonical account; canonical names apply by the verified ID only, never fuzzy aliases. Existing unlinked names retain existing behavior. First5 frontend work is delegated independently; backend work stays here, final review is fresh.

## Approved Third Priority And Teacher Rule
User approved priorities 11-12 and all Xiaomei classes opening at two students from 2026-11-09, still one local-only release batch.

- Query convenience: remember applied practice date/teacher/room/status filters and payroll month per signed-in account. Store only validated query preferences, never tokens or unsaved write forms. Paginate long practice and operations lists and restore same-session position when returning. Summary counts remain totals, not the visible page count. Existing endpoints still return full authoritative records; client-side pagination bounds DOM work without changing write contracts.
- Health: read-only evidence for the existing scheduler, course sync, practice reconciliation and invoice sync; show attempts, real successes, failures, stale/unknown states and queued/failed notifications separately. Instrument actual existing executions, never infer success from trigger installation. No extra triggers or resends.
- Backup: show missing/unverified evidence honestly. An explicit admin-only command creates a separate full workbook backup and a second disposable restore-rehearsal copy, verifies sheet names/dimensions, literal values and formulas, and records metadata only. Require both course/payroll capabilities, admin role and no impersonation. Never restore into, edit, delete or change sharing on the source. Unknown copy outcomes are not automatically retried. No automatic backup schedule or real backup command is executed in this local task. Credentials and Script Properties are not exported by application code; this is spreadsheet-data verification, not a full infrastructure recovery guarantee.
- Xiaomei: exact canonical names 小美 and Josty Lin, course date on/after 2026/11/09, minimum 2 at 23:40. This teacher rule precedes points, discounts and duet thresholds because the user said all her classes. Rentals/private classes remain excluded; 22:30 remains zero-only; historical dates retain old thresholds; incomplete/ambiguous identity data remains blocked. Salary rules do not change.
- No deployment, push, production-data writes or notifications in this task. Frontend files form one disjoint delegated implementation; backend and docs stay with the primary executor.
