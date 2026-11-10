# Workspace Navigation Design

## Approved Direction

The user approved the teacher/management classification and overall local mockup on 2026-11-09, with an explicit requirement to preserve all existing customized behavior. Work resumed on 2026-11-10. Nothing in this batch may be deployed yet.

## Scope

- Teacher: schedule, leave, substitute, classroom, account.
- Management: workbench, course operations, classroom, students/activities, finance; notification delivery and system tools remain secondary destinations.
- Desktop management navigation replaces the teacher sidebar. Mobile management uses its own five-item bottom navigation and an accessible More dialog.
- Course operations groups arrangement, changes/closure, OB reconciliation, and history. Existing statuses remain reachable within those groups.
- Finance groups payroll/invoices without combining their permissions. Students/activities groups discount recommendations, VVIP, and raffle without combining their permissions.
- Monthly operations remain reachable from the workbench and retain their original sequence and confirmation flows.
- Keep existing route identifiers, API calls, renderer functions, element IDs and event handlers for functional pages. This is navigation/presentation work, not a rewrite of business logic.

## Functional Preservation

- Leave: no reason or added note field; multiple dates and courses, select-all/clear dates, per-course confirmation, batching, duplicate handling, partial-failure recovery, and history remain unchanged.
- Substitute: ordinary/special modes, linked consecutive slots, own-course sources, durations, delayed starts, difficulty/note editing, cancellation/withdrawal locks remain unchanged.
- Classroom: practice/rental remain separate existing forms; recurring bookings, participants' own times, waitlist/conflict handling, late rental offers, six-hour rental restrictions and uncertain-result recovery remain unchanged.
- Student qualification review remains connected to the current review workflow and permissions. A navigation change must not grant all teachers review access.
- Payroll, invoices, VVIP, raffle stock/fulfillment, OB synchronization/closure and notifications keep their existing checks, previews, confirmation and write boundaries.
- Existing source-freshness warnings and uncertain-operation warnings are not removed for visual tidiness.

## Approaches

1. Keep shared teacher/management navigation and only rename categories: lower visual change, but preserves the original stacked navigation problem.
2. Separate the two navigation shells and reuse every existing workflow: selected by the user through the approved mockup; implemented without copying the mockup's simplified business logic.

## Verification

Check every original management tab is mapped and reachable, grouped entry points select only permitted children, existing deep links still work, and all non-navigation business function bodies remain unchanged. Run one offline regression and desktop/390px/320px browser checks. No formal data, real booking, payroll publication, notification or message operations are authorized.
