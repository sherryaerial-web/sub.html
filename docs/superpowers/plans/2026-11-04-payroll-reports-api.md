# Payroll Reports API Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline, task by task. No delegation is needed.

**Goal:** 十一月起使用 OB 營運報表，十月現有結算及手動扣款保持原狀。

**Architecture:** GAS 先讀取月份保護狀態，再於鎖外讀取兩個 API；純函式驗證、合併完整資料，鎖內重新核對月份狀態後沿用既有草稿寫入流程。

**Tech Stack:** GAS JavaScript、既有 Google Sheets schema、Node test runner。

**Spec:** `docs/superpowers/specs/2026-11-04-payroll-reports-api.md`

## Global Constraints

- 2026-10 禁止同步；不改十月結算、不新增妙妙扣款。
- 報表來源從 2026-11 起；不修改既有欄位索引及薪項。
- 金鑰只由 GAS 使用，失敗不得回退 Excel 或通知。
- 正式資料本次不寫入；不發布薪資、不寄訊息。

## Review Focus

- 報表分頁或總數變動時停止，避免漏算。
- 零值與缺值不同；未記出席不可當作零人。
- 課表／報表老師異動或缺一方時停止，避免付錯人。
- 同步期間有人調整或發布時停止，避免掩蓋人工結果。
- 歷史手動加扣與原取整方式保持不變。

### Task 1: API 來源與歷史保護

**Files:** `Code.gs`, `tests/backend-core.test.js`

- [x] 新增 report 讀取、合併及 sync 保護的行為測試，確認 RED。
- [x] 新增 `fetchPayrollAttendanceReport_` 與 `mergePayrollAttendanceReport_`，完整分頁、驗證與 ID 合併。
- [x] 新增 `getPayrollSyncState_` 保護十月、已發布或人工調整月份；鎖內比較狀態防競爭。
- [x] `syncPayrollMonth_` 從十一月選報表來源，沿用既有計薪與草稿寫入，不碰舊來源。
- [x] 跑針對測試 GREEN；更新本次試跑報告，撤回歷史 4,900 推論。

### Task 2: 一輪完整驗證與交付

**Files:** 工作目錄驗證紀錄、完整 `Code.gs`。

- [x] 使用已取得的 404 筆真實資料離線驗證合併，不重抓 API。
- [x] 執行 `node --test tests/*.test.js` 與 `git diff --check`：1,328/1,328 通過。
- [x] 檢查全分支差異、無秘密或通知副作用，提供完整檔案及具體發布範圍。獨立審查發現 raw 老師名單會被舊 normalizer 過濾，已補原始 ID／姓名驗證，三個 RED→GREEN 測試通過，審查者已確認修復。
