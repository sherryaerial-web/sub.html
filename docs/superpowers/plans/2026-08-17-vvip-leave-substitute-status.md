# VVIP Leave And Substitute Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VVIP 課程卡以實際 OB 課程為主，並標示原老師請假、待代課或已有代課，不產生重複可選課程。

**Architecture:** 後端在讀取下個月 `CourseList` 時，以原始與替代 OB Calendar ID 對照最新有效請假紀錄，將顯示欄位附加到既有課程物件。前端只呈現這些欄位，送出仍使用原本課程的 Calendar ID。

**Tech Stack:** Google Apps Script JavaScript、靜態 HTML/CSS/JS、Node.js `node:test`

## Global Constraints

- 不修改或覆寫正式 `CourseList`、`請假代課紀錄`、VVIP 名單與選課紀錄。
- 已取消請假不顯示標記；同 Calendar ID 採最新有效紀錄。
- 待代課與已有代課課程都維持可登記。
- 同一實際課程只能有一個 checkbox。

---

### Task 1: 後端合併請假與代課狀態

**Files:**
- Modify: `Code.gs:1800-1835`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `CourseList` 的 `OB Calendar ID`，以及 `請假代課紀錄` 的狀態、原老師、代課老師、原始與替代 OB Calendar ID。
- Produces: 每個 VVIP course 增加 `leaveStatus`、`originalTeacherName`、`substituteTeacherName`、`leaveLabel` 顯示欄位。

- [ ] **Step 1: 寫入失敗測試**

新增測試資料，涵蓋一般課、確認中、已領取、已取消、同 ID 新舊紀錄與替代 Calendar ID，並斷言合併後課程數量不增加。

- [ ] **Step 2: 驗證測試先失敗**

Run: `node --test --test-name-pattern='VVIP course rows merge leave and substitute status' tests/backend-core.test.js`

Expected: FAIL，因目前 course 物件沒有請假與代課欄位。

- [ ] **Step 3: 實作最小後端合併**

新增建立有效請假 Calendar ID 對照的 helper，略過 `已取消` 與 `延後占用`；原始與替代 ID 都可指向同一有效紀錄。`getVvipCourseRows_` 只附加顯示欄位，不修改課程 ID、名稱或老師。

- [ ] **Step 4: 驗證後端測試通過**

Run: `node --test --test-name-pattern='VVIP course rows merge leave and substitute status' tests/backend-core.test.js`

Expected: PASS。

### Task 2: 前端顯示請假與代課標記

**Files:**
- Modify: `vvip.html:37-48,142-149`
- Test: `tests/vvip-frontend.test.js`

**Interfaces:**
- Consumes: course 的 `leaveStatus`、`originalTeacherName`、`substituteTeacherName`、`leaveLabel`。
- Produces: 課程卡副資訊顯示「原老師請假｜代課老師未定」或「原老師請假：姓名」，不改 checkbox 可用條件。

- [ ] **Step 1: 寫入失敗測試**

新增前端契約測試，要求 `renderCourse` 呈現 `leaveLabel`，且 checkbox 數量仍由 course 一對一產生。

- [ ] **Step 2: 驗證測試先失敗**

Run: `node --test tests/vvip-frontend.test.js`

Expected: FAIL，因目前頁面沒有請假或代課標記。

- [ ] **Step 3: 實作前端呈現**

加入低干擾的狀態文字樣式，讓搜尋也能依原老師、代課老師或狀態文字找到課程；不改四堂上限、已選過與送出流程。

- [ ] **Step 4: 執行相關與完整回歸**

Run: `node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/vvip-frontend.test.js`

Expected: 全部 PASS。

- [ ] **Step 5: 語法與差異檢查**

Run: `node --check <Code.gs temporary copy> && git diff --check`

Expected: 兩者 exit 0；不部署、不寫入正式 Sheet。
