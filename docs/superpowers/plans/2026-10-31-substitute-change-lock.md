# Substitute Change Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Existing monthly close action prevents teacher cancellations and withdrawals for its course month.
**Architecture:** Derive the lock from the preceding operation month's completed close record. Enforce at existing read/write boundaries; preserve authorized manager impersonation.
**Tech Stack:** GAS, existing Script Properties and Sheet fixtures, HTML/JS, node:test.
**Spec:** docs/superpowers/specs/2026-10-31-substitute-change-lock-design.md

## Global Constraints

- Preserve all Sheet indexes, original ownership validation, audit actors and notification dedupe.
- No live course/Sheet mutations or notifications during development. Publication requires the established release approval.

## Review Focus

- Course month is operation month plus one, including December/January.
- Teacher write must recheck after locking; stale page must not bypass.
- No ordinary teacher can gain manager override from POST parameters.
- Corrupt close state must reject mutation, not silently unlock.
- An already completed close and notification retry remain locked without resending successful notices.

### Task 1: Enforce monthly lock and manager exceptions
Files: Code.gs; tests/backend-core.test.js.
- [x] Write tests for real close action, four blocked write paths, read flags, manager impersonation, month boundaries and corruption.
- [x] Run targeted tests and observe missing enforcement failures.
- [x] Add shared strict closure-policy lookup, guard existing mutation paths and suppress teacher action flags.
- [x] Run targeted tests to green.

### Task 2: Explain lock in existing UI and verify
Files: index.html; tests/frontend-contract.test.js; README.md.
- [x] Add runtime tests for locked teacher cards and close-action preview.
- [x] Run tests red, add hints/summary/preview text, run targeted tests green.
- [x] Run node --test tests/*.test.js once; inspect diff and parse; request one final review.
- [x] Package complete Code.gs/index.html and report deployment scope and test evidence.
