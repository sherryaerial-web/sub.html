### Task 8: Approved Redesign, Secure Account Import, and Deployment Package

**Production files:**
- Modify: `Code.gs`
- Modify: `index.html`

**Test files:**
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`
- Modify: `tests/visual-check.mjs`

**Operational documentation:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-08-03-substitute-system-v2.md`
- Modify: `docs/superpowers/specs/2026-08-03-substitute-system-v2-design.md`
- Modify: `docs/superpowers/plans/2026-08-03-substitute-system-v2-1.md`
- Modify: `.superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-report.md`

**Approved scope:**

1. Preserve the user-approved responsive sea-glass redesign across teacher and administrator views. Do not remove or simplify authenticated leave, claim, record, invitation, change-request, OB, or admin workflows.
2. Keep mobile navigation in document flow with no overlap or horizontal page overflow.
3. Add a manual-only `importTeacherAccountsFromPasswordSheet` path for the supplied `密碼表` tab (`老師`, `密碼`, exactly 37 populated rows).
4. Add complete deployment, migration, rollback, and verification instructions suitable for a non-engineer operator.

**Password import acceptance criteria:**

- Validate all rows, required headers, four-digit PINs, exact row count, and duplicate names before mutation.
- Reuse the existing Salt/SHA-256 account primitive; never log, return, route, or commit plaintext PINs.
- New accounts are active role `老師` with blank capabilities.
- Existing accounts keep their role, active state, failed-login/lock state, and capabilities; only Salt/PIN hash changes.
- A first administrator included in the 37 rows remains an active administrator and can access an authenticated admin route with the imported PIN.
- Snapshot the account target range, source PIN range, and prior completion property before the first write.
- On account-write, PIN-clear, or completion-property failure, attempt to restore all three snapshots. If any compensation fails, the thrown error must name the failed rollback store.
- Clear source PINs only after the full account batch succeeds. Preserve source names and do not delete the source tab.
- Keep capabilities blank only for newly created accounts; existing capabilities remain unchanged.

**Visual verification contract:**

- Run one desktop journey at 1280x900 and one mobile journey at 390x844.
- Capture 11 states in each journey for 22 visual states/screenshots total.
- Check nonblank pixels, document overflow, tested-control clipping, and mobile-navigation overlap.
- Describe these as screenshots/states, not 22 independent end-to-end journeys. Backend unit and frontend contract tests cover write behavior and permissions.

**Documentation acceptance criteria:**

- README records the previous Apps Script version/deployment, frontend commit, and pre-deployment Sheet backup as one compatible rollback set.
- Before enabling legacy GAS that expects `工作表1`, restore the matching pre-deployment spreadsheet backup or use a separately verified reverse migration.
- Rollback smoke checks include login, reading existing leave records, and writing/verifying/removing a marked test leave.
- v2 plan/spec are prominently historical and contain no actionable periodic-sync installation instructions.
- Secret and deprecated-behavior scans include production files and tracked operational docs.

**Required verification:**

```bash
node --check tests/backend-core.test.js
node --test tests/backend-core.test.js tests/frontend-contract.test.js
node tests/visual-check.mjs
```

Also run GAS syntax, production secret scans, operational-doc periodic-sync scans, `git diff --check`, and inspect representative desktop/mobile screenshots. If visual verification hangs, terminate it and report the exact blocker.
