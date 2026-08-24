# Course Closure Trigger Authorization Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正管理網頁啟用自動關課時因 `ScriptApp.getProjectTriggers` 無法在 Web App 請求中授權而立即失敗的問題。

**Architecture:** 排程改由專案擁有者在 Apps Script 編輯器執行一次安裝函式，建立一個永久的五分鐘觸發器；管理網頁只寫入 `關課設定` 的 auto/manual 模式，不再讀取、建立或刪除 ScriptApp 觸發器。安裝狀態保存於 Script Properties，未安裝時回傳可操作的中文提示。

**Tech Stack:** Google Apps Script、Google Sheets、靜態 HTML/JavaScript、Node.js `node:test`

**Spec:** 本對話已確認的「固定排程巡檢、網頁切換模式」設計。

## Global Constraints

- 不呼叫正式 OB API、不同步 OB、不改寫人工 Sheet 資料。
- 不執行 `clasp push --force`、GAS deployment 或 `git push`，除非使用者另行明確授權。
- 保留既有 22:30／23:40 規則、防重複紀錄與台北時區判斷。

---

### Task 1: 固定排程安裝與模式切換契約

**Files:**
- Modify: `tests/backend-core.test.js`
- Modify: `Code.gs`

**Interfaces:**
- Produces: `installCourseClosureScheduler()`、安全的 `setCourseClosureAutomation_()`、Script Property 安裝狀態。

- [x] 新增失敗測試：Web App 切換 auto/manual 不呼叫 ScriptApp；未安裝時顯示友善提示。
- [x] 新增失敗測試：安裝函式建立一個五分鐘排程，重複執行不重複建立。
- [x] 執行針對性測試確認因舊行為失敗。
- [x] 實作最小修改並讓針對性測試通過。

### Task 2: 驗證與交付

**Files:**
- Verify: `Code.gs`
- Verify: `tests/*.test.js`

**Interfaces:**
- Produces: 本機已驗證、尚未部署的修正。

- [x] 執行完整測試與 `git diff --check`。
- [x] 檢查變更只影響排程安裝與模式切換，不碰正式 Sheet／OB。
- [x] 回報需由專案擁有者在 Apps Script 編輯器執行一次安裝函式。
