# Student Practice Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在現有 GitHub Pages + GAS 系統加入學生自主練習公開頁與 Tako 管理流程。

**Architecture:** 公開 `student-practice.html` 只取得去識別的空檔模型；GAS 以新增獨立 Sheet 保存學生資格、場次、參與者與稽核。公開送出用裝置綁定的不可猜測 token，管理動作則沿用 `course_admin` 登入與 LockService。

**Tech Stack:** Google Apps Script、Google Sheets、Vanilla HTML/CSS/JavaScript、Node.js `node:test`。

**Spec:** `docs/superpowers/specs/2026-09-06-student-practice-booking-design.md`

## Global Constraints

- 日期時間固定使用 `Asia/Taipei`。
- 保留前後 15 分鐘，可選時長只有 60／90／120 分鐘。
- 送出、取消、換時間都需在開始前 2 小時。
- 公開 API 不回傳任何老師或學生姓名、課名、OB ID。
- 只新增學生自主練習工作表；不改寫老師自主練習表、CourseList 或其他正式資料。
- GitHub main、`clasp push --force` 與正式 GAS 部署必須另取得明確允許。

---

### Task 1: 公開空檔計算與去識別契約

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `buildStudentPracticeAvailability_(input): {date, rooms}`
- Produces: `getPublicStudentPracticeAvailability_(date): object`

- [ ] 寫失敗測試：驗證正式課、場租與老師練習會遮蔽空檔，且只回傳 60／90／120 中放得下的時長。
- [ ] 執行 `node --test --test-name-pattern='student practice availability' tests/backend-core.test.js`，確認因函式不存在而失敗。
- [ ] 實作純計算函式，建立 07:00–23:00 的空檔與已有學生場次，輸出不含姓名、課名或 OB ID。
- [ ] 再執行同一測試至通過。

### Task 2: 獨立 Sheet 與學生送出

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`
- Modify: `README.md`

**Interfaces:**
- Produces: `ensureStudentPracticeStructureUnlocked_(spreadsheet): object`
- Produces: `submitStudentPractice_(input): object`
- Produces: `getStudentPracticeRequest_(studentToken): object`

- [ ] 寫失敗測試：重複建立結構不動既有表；空白姓名、逾時、過期頁面或衝突送出都不寫入；待確認學生保留原申請；已確認學生直接成立。
- [ ] 執行 `node --test --test-name-pattern='student practice structure|student practice submission' tests/backend-core.test.js`，確認 RED。
- [ ] 在 LockService 內重讀當日 OB 與練習資料，以 UUID 新增明確列，同時登記全有全無，回傳裝置 token。
- [ ] 再執行同一測試至通過，更新 README 的工作表與安全說明。

### Task 3: 公開學生頁面

**Files:**
- Create: `student-practice.html`
- Create: `tests/student-practice-frontend.test.js`

**Interfaces:**
- Consumes: public POST actions `getStudentPracticeAvailability`, `submitStudentPractice`, `getStudentPracticeRequest`

- [ ] 寫失敗測試：頁面含日期、A／B／C／D、空檔／共用兩種文案、60／90／120 以及 2 小時說明；不含老師管理導覽。
- [ ] 執行 `node --test tests/student-practice-frontend.test.js`，確認因檔案不存在而失敗。
- [ ] 實作手機優先頁面，送出後顯示「已成立」或「待確認，請勿重複送出」，並將 token 存於 localStorage。
- [ ] 執行前端測試至通過。

### Task 4: Tako 管理最小閉環

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Produces: `getStudentPracticeAdminDashboard_(session, filters): object`
- Produces: `confirmStudentPracticeQualification_(session, participantId): object`
- Produces: `cancelStudentPracticeParticipant_(session, participantId, reason): object`
- Produces: `moveStudentPracticeParticipant_(session, input): object`

- [ ] 寫失敗測試：只有 `course_admin` 可讀取／異動；確認資格會沿用原申請；取消只移除一人；最後一人取消才釋出；換時間新時段失敗時不動舊列。
- [ ] 執行 `node --test --test-name-pattern='student practice admin' tests/backend-core.test.js`，確認 RED。
- [ ] 實作後端最小異動與完整稽核，再實作管理分頁的待確認、已成立、異動待處理清單。
- [ ] 執行相關測試至通過。

### Task 5: 完整回歸與上線前關卡

**Files:**
- Modify: `README.md`

- [ ] 執行 `node --test tests/*.test.js`，確認所有測試通過。
- [ ] 執行靜態頁本機測試，手機寬度檢查公開頁面不溢出、不暴露內部資料。
- [ ] 只提交功能分支，回報測試、未寫入正式 Sheet，並在取得允許前不推送、不 `clasp push --force`、不部署 GAS。

