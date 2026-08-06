# 代課系統 v2 Implementation Plan

> **歷史文件，禁止作為部署指引。** 本計畫已由 [v2.1 Implementation Plan](./2026-08-03-substitute-system-v2-1.md) 取代。現行系統只允許管理員手動同步 OB，任何週期性時間觸發同步方案均已廢止；正式操作請以 repository 根目錄的 `README.md` 為準。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Historical Goal:** 此文件記錄早期 Omcean Booking 同步構想，不代表現行部署方式。

**Architecture:** Google Apps Script 負責 API 同步、Sheet 資料存取與寫入鎖定，GitHub Pages 的 `index.html` 只呼叫 GAS JSON API。固定欄位 A:I 與既有陣列索引保持不變，J 欄新增 UUID 代課編號，API 權杖只從 Script Properties 讀取。

**Tech Stack:** Google Apps Script、Google Sheets、Omcean Booking REST API、HTML/CSS/JavaScript、Node.js built-in test runner

## Global Constraints

- Omcean API 端點固定為 `https://api.omceanbooking.com/v1/calendar`。
- API 權杖只使用 Script Property `OMCEAN_API_TOKEN`，不得寫入 GitHub、HTML 或試算表。
- 同步日期為執行當日至下個月底，排除取消課程。
- `CourseList` 固定 A:D：日期、時間、課程、指導者。
- `工作表1` 固定 A:I 既有欄位不移動，J 欄新增「代課編號」。
- 保持 `r[1]` 至 `r[7]` 既有語意。
- API 同步失敗或資料異常時不得清空既有 `CourseList`。
- `submitLeave`、`submitClaim` 與同步寫入均使用 `LockService`。
- 領取代課不需要管理員核准。
- 跨課程大類時，前端與後端都必須要求「改成什麼課」。

---

### Task 1: 建立可測試的課程分類與 API 同步核心

**Files:**
- Create: `Code.gs`
- Create: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: Script Property `OMCEAN_API_TOKEN`、Omcean `/v1/calendar` 回應。
- Produces: `getCourseCategory_(name)`、`getSyncDateRange_(now)`、`normalizeCalendarItem_(item)`、`fetchCalendarPages_(token, dateFrom, dateTo)`、`syncCourseListFromApi()`。

- [ ] **Step 1: 建立失敗測試**

使用 Node `node:test` 驗證：
- `B－空環 Lv.2` 分類為 `空環`
- `C－舞綢 Lv.1` 分類為 `舞綢`
- `空中瑜伽 Lv.1` 分類為 `空瑜`
- 2026-08-03 的同步區間結束日為 2026-09-30
- 缺少日期、課程或指導者的 API 項目被拒絕

Run: `node --test tests/backend-core.test.js`  
Expected: FAIL，因 `Code.gs` 尚未提供對應函式。

- [ ] **Step 2: 實作分類、日期與正規化**

在 `Code.gs` 建立純函式；分類順序需先判斷「空瑜／空中瑜伽」，再判斷一般「瑜伽」，避免誤分類。正規化輸出固定為：

```js
{
  apiId: String,
  date: "yyyy/MM/dd",
  time: "HH:mm",
  course: String,
  instructor: String
}
```

- [ ] **Step 3: 實作分頁與安全同步**

`fetchCalendarPages_` 使用 `Authorization: Bearer ...`、`date_from`、`date_to`、`include_cancelled=false` 與 `start`。每頁 100 筆，回傳不足 100 筆時停止；非 2xx、JSON 非陣列或正規化後零筆時丟出錯誤。

`syncCourseListFromApi` 必須：
1. 先在記憶體完成所有抓取、正規化、去重及排序。
2. 驗證 `CourseList` 標題 A1:D1。
3. 取得 Script Lock。
4. 只清除 A2:D 的舊內容，不清格式與其他欄。
5. 一次批次寫入新資料。
6. 錯誤時不進入清除階段。

- [ ] **Step 4: 記錄已廢止的自動同步構想**

此構想未納入現行 v2.1。不得建立週期性同步觸發器；OB 課表只由管理員在後台手動同步。

- [ ] **Step 5: 執行核心測試**

Run: `node --test tests/backend-core.test.js`  
Expected: PASS。

- [ ] **Step 6: 提交**

Commit message: `feat: add safe Omcean course sync`

### Task 2: 重建請假與代課領取後端契約

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `CourseList`、`老師名單`、`工作表1` 與 Task 1 的 `getCourseCategory_`。
- Produces: `doGet(e)` actions：`getTeachers`、`getCourseList`、`getPendingLeaves`、`getMySubs`、`submitLeave`、`submitClaim`。

- [ ] **Step 1: 新增失敗測試**

測試以下純判斷：
- 同為空環時 `requiresChangeNote_` 回傳 false。
- 空環改代舞綢時回傳 true。
- 無法辨識的課程僅在老師具有完全相同課名時免備註。
- 空白改課備註在跨類時被拒絕。
- 同一原老師、日期、時段、課程與「確認中／已領取」紀錄被視為重複請假。

Run: `node --test tests/backend-core.test.js`  
Expected: FAIL，因新函式尚未建立。

- [ ] **Step 2: 實作讀取 actions**

`getPendingLeaves` 額外回傳：
- `代課編號`
- `課程大類`

`getMySubs` 額外回傳：
- `備註`
- `課程大類`

所有工作表讀取先驗證工作表存在與必要標題。

- [ ] **Step 3: 實作 submitLeave**

使用 Script Lock，驗證老師存在、課程屬於該老師且位於 `CourseList`。每筆新增：
`[登記時間, 原老師, 日期, 時段, 課程, "確認中", "", "", "", UUID]`。

同一老師、日期、時段、課程若已有「確認中」或「已領取」，拒絕重複建立。

- [ ] **Step 4: 實作 submitClaim**

使用 Script Lock，以 UUID 尋找資料列並重新確認狀態為「確認中」。拒絕原老師領取自己的課；從 `CourseList` 計算代課老師平常授課大類；跨類時驗證每筆 `changeNote` 非空。成功後批次寫入 F:H：`已領取`、代課老師、改課備註。

- [ ] **Step 5: 統一錯誤回覆**

所有 action 回傳：
```js
{ "status": "success", "data": ... }
{ "status": "error", "message": "可顯示訊息" }
```

未知 action 回傳錯誤，不靜默結束。

- [ ] **Step 6: 執行測試與語法檢查**

Run: `node --test tests/backend-core.test.js`  
Expected: PASS。

Run: `node --check tests/backend-core.test.js`  
Expected: 無輸出且 exit 0。

- [ ] **Step 7: 提交**

Commit message: `feat: secure substitute leave and claim flow`

### Task 3: 更新正式 GitHub Pages 前端

**Files:**
- Modify: `index.html`
- Create: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: Task 2 的 JSON actions 與既有 GAS `APP_URL`。
- Produces: 可在手機與桌面完成請假、領取及查詢的正式頁面。

- [ ] **Step 1: 建立前端契約失敗測試**

測試 `index.html`：
- 不含 Omcean token 或 `Authorization: Bearer`
- 不含 `mode: 'no-cors'` 或 `mode: "no-cors"`
- 包含代課編號資料欄
- 包含跨類改課輸入
- 包含後端 `status === "success"` 判斷
- HTML 具 viewport meta

Run: `node --test tests/frontend-contract.test.js`  
Expected: FAIL，因正式頁面尚未更新。

- [ ] **Step 2: 建立統一 API 呼叫函式**

新增 `callApi(action, params)`，使用 `fetch`、解析 JSON、檢查 HTTP 與 `status`，失敗時丟出後端訊息。所有按鈕使用 try/catch/finally 管理載入與恢復狀態。

- [ ] **Step 3: 更新請假流程**

載入老師與課程後依姓名顯示課程；送出前確認至少一筆；成功後才顯示成功並返回首頁；失敗時保留畫面與勾選內容。

- [ ] **Step 4: 更新領取流程**

選擇代課老師後，逐筆比較老師平常授課大類與待代課大類。跨類項目顯示獨立必填文字欄，送出資料使用：

```js
{
  substituteId: String,
  changeNote: String
}
```

衝突訊息出現後重新抓取待領取清單。

- [ ] **Step 5: 更新我的代課紀錄**

顯示日期、時段、課程、原老師；有改課備註時顯示「改課：內容」。

- [ ] **Step 6: 執行前端測試**

Run: `node --test tests/frontend-contract.test.js`  
Expected: PASS。

- [ ] **Step 7: 提交**

Commit message: `feat: update substitute web interface`

### Task 4: 整體驗證與部署交接

**Files:**
- Modify: `README.md`
- Verify: `Code.gs`
- Verify: `index.html`

**Interfaces:**
- Consumes: Tasks 1-3 完整成果。
- Produces: 可複製覆蓋的 GAS、已更新的 GitHub Pages 與部署步驟。

- [ ] **Step 1: 全部自動測試**

Run: `node --test tests/*.test.js`  
Expected: 全部 PASS。

- [ ] **Step 2: 敏感資料掃描**

Run: `rg -n "eyJ[a-zA-Z0-9_-]+\.|Authorization:\\s*Bearer\\s+[A-Za-z0-9]" . --glob '!docs/**'`  
Expected: 無實際權杖命中；只允許程式組合 Bearer header 的安全寫法。

- [ ] **Step 3: 固定索引掃描**

確認 `Code.gs` 中：
- `r[1]` 原老師
- `r[2]` 日期
- `r[3]` 時段
- `r[4]` 課程
- `r[5]` 狀態
- `r[6]` 代課老師
- `r[7]` 備註

- [ ] **Step 4: 手動測試清單**

在 Apps Script 測試部署依序驗證：
1. 設定 `OMCEAN_API_TOKEN`。
2. 執行 `syncCourseListFromApi` 並確認日期至下個月底。
3. 確認 Apps Script 沒有任何週期性同步觸發器。
4. 建立同類代課並成功領取。
5. 建立跨類代課，空白備註被拒絕。
6. 填寫改課內容後成功寫入 H 欄。
7. 兩個瀏覽器同時領取同一 UUID，只有一方成功。
8. API 測試失敗時確認 `CourseList` 保留原資料。

- [ ] **Step 5: README 部署說明**

記錄完整 GAS 覆蓋、Script Property、Web App 重新部署、GitHub Pages 更新與回復方式，不記錄權杖值。

- [ ] **Step 6: 最終提交**

Commit message: `docs: add substitute system deployment guide`
