# Activity operations tools 7–11

Approved: packing labels, selected arrival batches, consolidated student history, inventory thresholds/internal alerts, inactive campaign template copy. Implement inline with one final review.

## Decisions
- Existing permissions and write gates apply. Full-email labels, batch send and history are manager-only. Teachers retain their simple claim view.
- Batch = explicit selected rows, preflight read, sequential existing single-claim actions with stable request IDs. Stop on uncertainty; no automatic repeat. Never send during development/release.
- Stock uses source catalogue remaining (already deducted at prize selection), with synchronized reservations shown separately, never subtracting twice. Ball reservations use the existing authoritative classroom gift journal; prizes use source catalogue allocations.
- Low stock defaults to on-screen threshold 5. Internal alerts require a manager enabling them, are deduplicated per shortage episode, and use the existing five-minute job. No new student message.
- Next campaign is an inactive reusable template journal, not activation. Preserve public prize/rule/style configuration; clear dates, coupon codes, stock and source resources. Never copy people, draws, proof IDs or secrets.
- History reads only existing D1/Sheets. Unknown or unverified email is explicitly reported; no new OB requests or identity inference.

## Tasks
1. Meaningful failing tests for backend permissions, stock consistency, batch preflight, template privacy/idempotency, timeline isolation and UI stop-on-unknown.
2. Implement modular GAS + readonly Worker history; expose manager UI with printable labels and batch preview.
3. One affected regression run, mobile/desktop browser inspection, one fresh final review and necessary fixes only.
4. Snapshot live, preserve source/settings, deploy scoped changes, read back exact content and health. Deliver full source bundle and short handoff.

## Verification ledger
- App affected regression: 206 passing tests. Additional retired-prize copy boundary: passing; no unrelated suite repeat.
- Worker history/progress/reply isolation: 24 passing tests. Release packaging: 4 passing tests.
- Mocked Playwright: desktop and 390 px mobile operation flows passed; notification uncertainty stopped the remaining batch. Visible screenshots inspected.
- Fresh final review (activity_tools_final_review): no critical/important blockers; no code edits or external side effects.
- Live source sheet: 51 catalogue rows, 50 enabled; stock triples were numeric and balanced. Retired drawstring bag is excluded from the next-activity template.
- Worker released at bea56203-25b9-4c19-8b25-752840247fd2, 100%, 60 modules, exact source/read-back, settings and schedules preserved, health 200. Official activity replies still paused.
