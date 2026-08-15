# 管理者結果匯出 Excel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 管理者可一鍵下載依權限分頁的完整 `.xlsx` 結果活頁簿，且不修改正式 Google Sheet 資料。

**Architecture:** 只修改靜態前端。按鈕點擊後呼叫既有唯讀管理 API，將回傳資料交給純函式整理成工作表，再由專案內固定版本 SheetJS 產生 Excel。所有允許的 API 都成功才下載。

**Tech Stack:** HTML、CSS、JavaScript、SheetJS CE 0.20.3、Node.js `node:test`

## Global Constraints

- 不修改 `Code.gs`、Google Sheet 結構或正式資料。
- 不匯出登入憑證與敏感欄位。
- 只輸出目前管理者具備 capability 的資料。
- 先測試失敗，再做最小實作。

---

### Task 1: 用測試定義匯出資料契約

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `index.html`

- [x] 新增失敗測試：按鈕與固定版 SheetJS 資源存在。
- [x] 新增失敗測試：課程、薪資、VVIP 權限只建立各自允許的工作表。
- [x] 新增失敗測試：代課結果合併去重，空工作表保留標題。
- [x] 新增失敗測試：敏感欄位不輸出，公式開頭文字受到保護。
- [x] 執行 `node --test --test-name-pattern='admin Excel export' tests/frontend-contract.test.js` 並確認因功能尚未存在而失敗。

### Task 2: 實作活頁簿資料整理與管理頁按鈕

**Files:**
- Modify: `index.html`
- Create: `assets/xlsx.full.min.js`
- Create: `assets/README.md`

- [x] 加入管理者「匯出 Excel」按鈕與手機安全版面。
- [x] 加入唯讀資料載入、權限分頁、標準欄位、去重與儲存格保護函式。
- [x] 加入 SheetJS 活頁簿建立、欄寬與檔名處理。
- [x] 任一允許 API 失敗時顯示錯誤且不下載。
- [x] 執行指定前端測試並確認通過。

### Task 3: 實際 Excel 與回歸驗證

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Verify: `index.html`
- Verify: `assets/xlsx.full.min.js`

- [x] 用固定版 SheetJS 建立測試活頁簿，重新讀取並核對工作表與代表資料。
- [x] 執行 `node --test tests/frontend-contract.test.js`。
- [x] 執行 `git diff --check` 與必要語法檢查。
- [x] 執行一次手機管理頁視覺檢查，確認按鈕不破框。
- [x] 檢查差異並回報正式 Sheet 影響為「無」。
