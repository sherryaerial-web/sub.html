# 場租候補六小時內確認 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 場租候補在開始前不足六小時時，須經老師 30 分鐘內確認才寫入 OB；逾時流掉，且自主練習流程不變。

**Architecture:** 在現有場租需求增加一個獨立狀態，以既有更新時間推算確認期限。排程只發一次通知；老師在「我的登記」回覆後，後端鎖內重查 OB，再沿用場租成立及受影響自主練習的既有程式。

**Tech Stack:** Google Apps Script、Google Sheets、靜態 HTML/JavaScript、Node.js 內建測試。

**Spec:** `docs/superpowers/specs/2026-09-16-rental-late-promotion-design.md`

## Global Constraints

- 不改自主練習狀態或流程，不改 Google Sheet 欄位順序。
- 不推送 main、不部署 GAS、不寫正式 Sheet、不發正式通知。
- 保留現有未提交的 `tests/backend-core.test.js` 修改。

---

### Task 1: 場租候補提議與過期

**Files:** Modify `Code.gs`; test `tests/backend-core.test.js`.

**Interfaces:** `reconcileRentalWaitlist_(options)` 接受 `nowMs`；產出 `offered` 數與 `待確認轉正` 狀態。`getRentalOfferDeadlineMs_(item)` 由 `updatedAt` 與開始時間推算期限。

- [ ] **Step 1: 寫失敗測試。** 固定開始前 5 小時、6 小時、提議後 30 分鐘、開始時間已過，分別斷言不寫 OB／自動寫 OB／過期／不重新提議；同時確認自主練習資料不受「提議」影響。
- [ ] **Step 2: 執行 `node --test --test-name-pattern='rental.*late|rental.*offer' tests/backend-core.test.js`，確認新測試因缺少行為而失敗。**
- [ ] **Step 3: 在 `Code.gs` 加入場租專屬狀態及期限輔助函式，讓排程在六小時內只提議、期限後終止，不改自主練習狀態。**
- [ ] **Step 4: 重跑上述測試，確認通過。**

### Task 2: 老師回覆與 OB 再核對

**Files:** Modify `Code.gs`; test `tests/backend-core.test.js`.

**Interfaces:** `respondRentalPromotion_(session, {requestId, accept})`；POST 動作 `respondRentalPromotion`。只有待確認且未逾期的該老師可確認。

- [ ] **Step 1: 寫失敗測試。** 固定場租需求 ID 與 OB 空檔，斷言本人確認才建立、已被占用不建立、逾期拒絕、放棄不建立、重複確認不重複建立。
- [ ] **Step 2: 執行 `node --test --test-name-pattern='rental.*respond|rental.*confirmation' tests/backend-core.test.js`，確認失敗原因是缺少回覆行為。**
- [ ] **Step 3: 加入 API 路由與鎖內回覆函式；先查 OB，再寫入，OB 成功後才呼叫既有自主練習影響處理及通知。**
- [ ] **Step 4: 重跑上述測試，確認通過。**

### Task 3: 老師端確認介面

**Files:** Modify `index.html`; test `tests/frontend-contract.test.js`.

**Interfaces:** 「我的登記」以 `offerExpiresAt` 顯示期限及 `data-rental-offer-accept`／`data-rental-offer-decline` 按鈕；呼叫 `respondRentalPromotion`。

- [ ] **Step 1: 寫失敗測試。** 斷言待確認場租顯示兩個操作與逾時規則說明，自主練習項目維持原樣。
- [ ] **Step 2: 執行 `node --test --test-name-pattern='rental.*offer' tests/frontend-contract.test.js`，確認新測試失敗。**
- [ ] **Step 3: 在場租歷史卡及事件處理加入確認／放棄；成功後重載場租與當日行事曆。**
- [ ] **Step 4: 重跑上述測試，再執行相關現有場租測試、JS 語法檢查與 `git diff --check`。**

### Task 4: 已成立場租六小時取消限制

**Files:** Modify `Code.gs`; test `tests/backend-core.test.js`.

**Interfaces:** `cancelTeacherRental_(session, input)` 保持既有 API；新增可選 `overrideLateCancellation: true`，僅 `course_admin` 且有原因可使用。

- [ ] **Step 1: 寫失敗測試。** 斷言一般老師不足六小時取消已成立場租會被拒絕、不呼叫 OB；六小時整仍可取消；候補可放棄；管理員例外須明確旗標與原因；自主練習取消不受此檢查。
- [ ] **Step 2: 執行 `node --test --test-name-pattern='rental.*six-hour cancellation' tests/backend-core.test.js`，確認新測試因缺少檢查而失敗。**
- [ ] **Step 3: 在所有 OB 取消呼叫前，以目前時間與每筆已成立場租開始時間驗證六小時界線，違規時整批拒絕，不產生部分取消。**
- [ ] **Step 4: 重跑上述測試，確認通過。**

### Task 5: 完成前查核

**Files:** Read-only review of `Code.gs`, `index.html`, and test changes.

**Interfaces:** 無。

- [ ] **Step 1: 核對六小時邊界、30 分鐘期限、逾時不找下一位、OB 失敗不改自主練習、場租與自主練習資料隔離。**
- [ ] **Step 2: 執行一次完整測試套件並查看輸出與退出碼。**
- [ ] **Step 3: 報告未推送／未部署及任何未完成限制。**
