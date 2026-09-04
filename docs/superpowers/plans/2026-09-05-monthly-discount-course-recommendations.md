# 每月點數優惠課程推薦 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 每月自動產生、顯示、替換及確認固定三堂點數優惠課程建議。

**Architecture:** 沿用 GAS 關課排程蒐集唯讀 OB 觀測資料，以三個獨立 Sheet 保存觀測、優惠歷史與推薦。管理頁透過既有 `getAdminDashboard` 與 action handler 顯示、替換、確認，所有操作保留稽核紀錄。

**Tech Stack:** Google Apps Script、Google Sheets、HTML/CSS/JavaScript、Node.js `node:test`

**Spec:** `docs/superpowers/specs/2026-09-05-monthly-discount-course-recommendations-design.md`

## Global Constraints

- 不清空、不整張覆寫、不搬移任何正式 Sheet 人工資料。
- 不呼叫 OB 寫入 API；本功能僅讀 OB 與記錄推薦。
- 每月固定三堂；已優惠課程冷卻兩個完整月份。
- 代課、特別課、期班、場租、自主練習、新老師優惠與當月點數優惠不納入。
- 未經允許不得推送 main、部署 GAS 或初始化正式 Sheet。

---

### Task 1: Sheet 契約與純推薦引擎

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `buildMonthlyDiscountCandidates_(courseRows, observationRows, historyRows, recommendationMonth)`
- Produces: `selectMonthlyDiscountRecommendations_(candidates, count)`

- [ ] **Step 1: 寫入失敗測試**：涵蓋排除條件、兩月窗口、兩月冷卻、固定三堂與穩定排序。
- [ ] **Step 2: 執行 focused test，確認因缺少函式或結果不符而失敗。**
- [ ] **Step 3: 新增 Sheet 名稱、標題與純函式最小實作。**
- [ ] **Step 4: 執行 focused test，確認通過。**

### Task 2: 排程、觀測與推薦保存

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `runMonthlyDiscountRecommendationScheduler_(dateKey, time)`
- Produces: `generateMonthlyDiscountRecommendations_(actor, month, force)`
- Produces: `recordCoursePerformanceObservationsUnlocked_(...)`

- [ ] **Step 1: 寫入排程防重複、觀測 upsert、三堂保存與管理通知失敗測試。**
- [ ] **Step 2: 執行 focused test，確認紅燈。**
- [ ] **Step 3: 實作結構初始化、觀測寫入、每月 5 日窗口及通知。**
- [ ] **Step 4: 執行 focused test，確認綠燈。**

### Task 3: 管理 API、替換與確認

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `getMonthlyDiscountDashboard_(session)`
- Produces: `replaceMonthlyDiscountRecommendation_(session, recommendationId)`
- Produces: `confirmMonthlyDiscountRecommendations_(session, month)`

- [ ] **Step 1: 寫入權限、替換候補、確認後寫歷史與不可重複確認測試。**
- [ ] **Step 2: 執行 focused test，確認紅燈。**
- [ ] **Step 3: 實作 API handler 與操作紀錄。**
- [ ] **Step 4: 執行 focused test，確認綠燈。**

### Task 4: 管理頁提醒與卡片

**Files:**
- Modify: `index.html`
- Test: `tests/frontend-contract.test.js`
- Test: `tests/morandi-visual-contract.test.js`

**Interfaces:**
- Consumes: `adminDashboard.monthlyDiscount`
- Calls: `replaceMonthlyDiscountRecommendation`、`confirmMonthlyDiscountRecommendations`、`regenerateMonthlyDiscountRecommendations`

- [ ] **Step 1: 寫入提醒、三堂卡片、候補、歷史與按鈕事件失敗測試。**
- [ ] **Step 2: 執行 focused test，確認紅燈。**
- [ ] **Step 3: 實作桌機與手機共用的關課管理卡片及事件。**
- [ ] **Step 4: 執行 focused test，確認綠燈。**

### Task 5: 完整驗證與本機提交

**Files:**
- Verify: `Code.gs`, `index.html`, tests, specs, plans

- [ ] **Step 1: 執行 `node --check tests/backend-core.test.js` 與 `node --check tests/frontend-contract.test.js`。**
- [ ] **Step 2: 執行 `node --test tests/*.test.js`。**
- [ ] **Step 3: 執行 `git diff --check` 並檢查無正式資料操作。**
- [ ] **Step 4: 提交本機功能分支；不推送、不部署。**

