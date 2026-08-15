# Special Course Name Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓特別課群組核對接受 OB 加上的教室、特別課與分鐘數格式，但仍拒絕主要課名不同的課程。

**Architecture:** 在既有一般課名正規化之外新增特別課專用正規化函式，並只由特別課群組的 OB 差異判定使用。一般代課與 Class ID 比對不變。

**Tech Stack:** Google Apps Script V8、Node.js `node:test`

## Global Constraints

- 不變更任何 Google Sheets 欄位索引或工作表結構。
- 不執行同步、核對或正式資料寫入。
- 特別課仍須只有一個存活的 OB Calendar ID，且代課老師必須相同。

---

### Task 1: 特別課課名格式回歸測試

**Files:**
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `reconcileObChanges_(session)`
- Produces: 真實 OB 課名格式的可觀察核對結果

- [ ] **Step 1: Write the failing test**

建立預期課名 `後彎主題十字墊瑜伽&頌缽充電`，OB 課名 `B－後彎主題十字墊瑜伽＆頌缽充電特別課 (150min)`，斷言三筆群組資料全部核對完成。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern='special-course group reconciliation accepts OB display formatting' tests/backend-core.test.js`

Expected: FAIL because the current general normalizer preserves the room prefix, special-course suffix, duration suffix, and ampersand width.

### Task 2: 專用正規化與保護案例

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `getSpecialCourseGroupObOutcome_(groupRecords, courseByCalendarId)`
- Produces: `normalizeSpecialCourseReconciliationName_(value)` and group-only course comparison

- [ ] **Step 1: Write minimal implementation**

新增特別課專用正規化函式，並讓群組核對在老師相符後以該函式比較課名；其他 `getObCourseDifferences_` 呼叫維持原行為。

- [ ] **Step 2: Add the mismatch protection test**

將 OB 主要課名改成另一堂特別課，斷言三筆仍為核對異常。

- [ ] **Step 3: Run focused tests**

Run: `node --test --test-name-pattern='special-course group reconciliation' tests/backend-core.test.js`

Expected: PASS.

- [ ] **Step 4: Run full verification**

Run: `node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/vvip-frontend.test.js`

Run: `cp Code.gs /private/tmp/substitute-code-check.js && node --check /private/tmp/substitute-code-check.js`

Expected: all tests and syntax checks pass.

- [ ] **Step 5: Commit**

```bash
git add Code.gs tests/backend-core.test.js docs/superpowers/specs/2026-08-15-special-course-name-reconciliation-design.md docs/superpowers/plans/2026-08-15-special-course-name-reconciliation.md
git commit -m "fix: normalize special course reconciliation names"
```
