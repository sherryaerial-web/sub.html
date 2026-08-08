# Sheet Organization And Course Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 整理正式試算表分頁、修復 VVIP 名單必要欄位，並維持網站管理員手動同步 OB 課表。

**Architecture:** 直接透過 Google Sheets API 對正式試算表做精確 batch update。內容修復與分頁結構分開驗證；不修改既有 GAS 同步函式，也不在整理過程執行 OB API。

**Tech Stack:** Google Sheets API、Google Apps Script、Google Sheets

## Global Constraints

- 不刪除、不清空、不改名任何既有分頁。
- 不改寫 VVIP 名稱與 Email。
- `請假代課紀錄` 保留並隱藏。
- 完整測試保留到正式上線前，本次只做必要核對。

---

### Task 1: 修復 VVIP 名單

**Files:**
- Modify: Google Sheet `VVIP名單!A2:H15`

**Interfaces:**
- Consumes: 14 列已輸入的 OB 名稱、Email、啟用狀態
- Produces: 14 個唯一 VVIP ID 與完整稽核欄位

- [ ] **Step 1:** 重新讀取 `VVIP名單!A1:H15`，確認名稱與 Email 無重複。
- [ ] **Step 2:** 只填入空白的 A、F、G、H 欄；D 欄維持原值。
- [ ] **Step 3:** 重新讀取 `A1:H15`，確認 ID 唯一且 B、C 欄完全未變。

### Task 2: 建立給雪莉的格式

**Files:**
- Create: Google Sheet tab `給雪莉的格式`

**Interfaces:**
- Consumes: 舊薪資工作簿確認過的三欄轉帳格式
- Produces: 可保留的 `轉帳群組/銀行`、`金額`、`備註` 格式頁

- [ ] **Step 1:** 確認正式試算表仍不存在同名分頁。
- [ ] **Step 2:** 建立分頁並寫入三欄標題，凍結第一列並套用與現有管理表一致的表頭格式。
- [ ] **Step 3:** 讀回標題與分頁 metadata，確認分頁可見。

### Task 3: 整理分頁顯示與順序

**Files:**
- Modify: Google Sheet sheet properties

**Interfaces:**
- Consumes: 正式試算表現有 sheetId
- Produces: 7 個可見日常分頁，其餘既有分頁保留但隱藏

- [ ] **Step 1:** 重新讀取 metadata，依 sheetId 建立更新請求。
- [ ] **Step 2:** 顯示並排序 `CourseList`、`VVIP名單`、`薪項設定`、`薪資來源資料`、`給雪莉的格式`、`登入帳號`、`老師名單`。
- [ ] **Step 3:** 將其他現有分頁設為隱藏，不刪除。
- [ ] **Step 4:** 重新讀取 metadata，確認分頁總數不減少、可見清單與順序正確。

### Task 4: 核對課表同步入口

**Files:**
- Verify: `index.html`
- Verify: `Code.gs`

**Interfaces:**
- Consumes: `syncObCalendar` 管理員 action 與 `course_admin` 權限
- Produces: 確認 IVY 可從「教室管理工作台」手動同步

- [ ] **Step 1:** 確認管理員頁右上角仍有「同步 OB 課表」。
- [ ] **Step 2:** 確認後端要求 `course_admin` 並在失敗時保留原 `CourseList`。
- [ ] **Step 3:** 不執行正式同步；向使用者回報操作位置。
