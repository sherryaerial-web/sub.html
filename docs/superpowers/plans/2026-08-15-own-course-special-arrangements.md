# 自有正課特別課安排 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓受邀老師在「安排特別課」模式可使用自己的正課與仍可領取的代課時段，並以獨立特別課申請保存，不製造假的請假紀錄；同時支援在帳號欄位額外補上蜜莉可教授「舞綢」。

**Architecture:** `CourseList` 仍是 OB 課表快照；`請假代課紀錄` 只保存真實請假與實際領取。新增 `特別課安排` 工作表保存一個群組一列的特別課申請及來源課程 JSON。後端以通用 slot key (`own:<calendarId>` / `leave:<substituteId>`) 規劃占用時段，對代課來源做原子領取，對自己的課只保存引用。前端普通代課不變，特別課模式才合併顯示可用的自己正課。

**Tech Stack:** Google Apps Script、Google Sheets、HTML/CSS/JavaScript、Node.js `node:test`

## Global Constraints

- 不清空、不重建人工請假、代課、薪資或 VVIP 資料。
- `CourseList` 與 `請假代課紀錄` 既有欄位和索引不得移動。
- 新資料以新工作表追加，所有送出動作都在 `LockService` 內再次檢查。
- 自己的正課不可被寫成請假或代課紀錄。
- 普通代課仍只能顯示及領取已開放的請假課程。
- 特別課只能占用同日、同教室且依時間順序銜接的「自己的正課」或「仍可領取的代課」。
- 特別課時長維持 90–240 分鐘，結束後維持 15 分鐘換場檢查。
- 正式部署及精準更新蜜莉能力前需再次取得使用者同意。

---

### Task 1: 新增特別課安排資料契約

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `SHEETS.SPECIAL_COURSE_REQUESTS`、`SHEET_HEADERS.SPECIAL_COURSE_REQUESTS`、`ensureSpecialCourseRequestSheet_(ss)`。
- Sheet columns: `申請時間, 特別課群組 ID, 老師, 日期, 教室, 來源時段 JSON, 代課編號 JSON, 實際開始時間, 特別課名稱, 預計難度, 分鐘數, 結束時間, 模式, 備註, 狀態, OB 核對狀態, OB 核對時間, 差異原因, 替代 OB Calendar ID`。

- [x] **Step 1: Write failing setup contract tests**

Add a test asserting `setupSystem_()` creates `特別課安排` with the exact append-only header list and does not modify existing leave rows.

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="特別課安排.*工作表" tests/backend-core.test.js`

Expected: FAIL because the sheet constant/header does not exist.

- [x] **Step 3: Implement the sheet contract**

Add the sheet name/header constants, include `ensureSupportingSheet_()` in `setupSystem_()`, and add an on-demand helper that asserts exact headers without clearing rows.

- [x] **Step 4: Run focused tests and verify GREEN**

Run the same command and expect PASS.

### Task 2: 建立「自己正課＋可領代課」的通用時段規劃

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `buildSpecialCourseSlotsForTeacher_(teacher, pendingRows, courseRows)` returning `{slotKey, sourceType, substituteId, calendarId, date, time, room, courseName, originalTeacher}`.
- Produces: `buildTeacherSpecialCourseSlotPlan_(teacher, startSlotKey, durationMinutes, actualStartTime, pendingRows, courseRows, mode)` returning ordered source slots and linked substitute IDs.

- [x] **Step 1: Write failing availability tests**

Cover literals for: own+own is offered; own+open leave is offered; another teacher's unopened course is excluded; ordinary `pendingLeaves` is unchanged.

- [x] **Step 2: Verify RED**

Run: `node --test --test-name-pattern="自己的正課|own course" tests/backend-core.test.js`

Expected: FAIL because claim options expose no own slots.

- [x] **Step 3: Implement availability and planning**

Use `CourseList` teacher column (`row[3]`) to mark own slots. Map open leave rows by Calendar ID. Each required schedule row must be either owned by the requesting teacher or still satisfy `isOrdinaryOpenLeaveRow_()`; otherwise throw before any write.

- [x] **Step 4: Verify GREEN and existing slot-plan tests**

Run: `node --test --test-name-pattern="特別課|special" tests/backend-core.test.js`

Expected: all matching tests PASS.

### Task 3: 以一筆申請保存群組並只更新真實代課列

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- `claimSpecialCourse_()` consumes `startSlotKey` (with backward-compatible `substituteIds[0]`).
- Appends one request row to `特別課安排` and updates only linked open leave rows.

- [x] **Step 1: Write failing transaction tests**

Test own+own, own+leave, and stale leave. Assert own+own leaves `請假代課紀錄` byte-for-byte unchanged; own+leave changes only the real leave row; stale leave produces no request and no partial write.

- [x] **Step 2: Verify RED**

Run: `node --test --test-name-pattern="自有時段特別課|混合時段特別課" tests/backend-core.test.js`

- [x] **Step 3: Implement atomic write**

Within the existing script lock, re-read both sheets, compute the slot plan, prepare the request row, then use `runStateTransitionUnlocked_()` to append the request and update only leave rows. Audit the group ID and linked IDs.

- [x] **Step 4: Verify GREEN**

Run the focused tests, then all backend tests.

### Task 4: 特別課模式顯示自己的正課

**Files:**
- Modify: `index.html`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes `claimOptions.specialSlots` and existing pending leave items.
- Sends `startSlotKey`; ordinary claim still sends only substitute IDs.

- [x] **Step 1: Write failing frontend behavior tests**

Use the existing VM/browser harness to assert ordinary mode omits own slots, special mode shows cards tagged `自己的正課` / `開放代課`, and only one start slot can be selected.

- [x] **Step 2: Verify RED**

Run: `node --test --test-name-pattern="自己的正課|特別課時段來源" tests/frontend-contract.test.js`

- [x] **Step 3: Implement rendering and payload changes**

Keep `pendingLeaves` as the ordinary source. Build a separate special-mode view from `claimOptions.specialSlots`, preserve date folding, and update preview/summary helpers to use slot keys.

- [x] **Step 4: Verify GREEN**

Run focused frontend tests and mobile visual check if UI markup/CSS changes.

### Task 5: 管理員待處理 OB 與核對

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- `getAdminDashboard_()` adds special request work items without duplicating linked leave cards.
- `reconcileObChanges_()` also reconciles active special requests and updates their status fields.

- [x] **Step 1: Write failing admin and reconciliation tests**

Assert one grouped admin work item for own+own and own+leave, and successful reconciliation when exactly one OB course matches normalized teacher/name; missing or multiple matches remain exceptions.

- [x] **Step 2: Verify RED**

Run matching backend and frontend tests.

- [x] **Step 3: Implement dashboard mapping and reconciliation**

Reuse `normalizeSpecialCourseReconciliationName_()`. Do not alter existing leave reconciliation semantics. Export the new grouped work item in the existing Excel result sheet.

- [x] **Step 4: Verify GREEN**

Run all backend and frontend contract tests.

### Task 6: 正式資料安全與能力補值準備

**Files:**
- Modify: `README.md`

**Interfaces:**
- The runtime capability source remains `登入帳號` H column `可教授類別`.

- [x] **Step 1: Document the targeted update**

Document that `蜜莉 戴` receives additive `舞綢` in H, preserving any existing values and all other columns.

- [x] **Step 2: Run complete verification**

Run:

```bash
node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/vvip-frontend.test.js
cp Code.gs /private/tmp/substitute-Code.js && node --check /private/tmp/substitute-Code.js
```

- [x] **Step 3: Stop before production writes**

Report tests and exact impact. Obtain approval before `clasp push --force`, Apps Script deployment, creation of the new formal sheet, or the targeted `蜜莉 戴` H-column update.
