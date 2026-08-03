# Sherry Aerial Studio 代課系統

GitHub Pages 前端搭配 Google Apps Script、Google Sheets 與 Omcean Booking API。

## 檔案

- `index.html`：正式 GitHub Pages 前端。
- `Code.gs`：完整 Apps Script 後端，可全選覆蓋既有程式。
- `tests/backend-core.test.js`：課程分類、同步與代課規則測試。
- `tests/frontend-contract.test.js`：前端安全與資料契約測試。
- `tests/visual-check.mjs`：桌機與手機畫面檢查。

## 試算表

### CourseList

既有 A:D 固定欄位不移動；同步時只更新這張表作為「目前 OB 課表快照」。

| 欄 | 標題 |
|---|---|
| A | 日期 |
| B | 時間 |
| C | 課程 |
| D | 指導者 |
| E | OB Calendar ID |
| F | OB Class ID |
| G | OB 老師 ID |
| H | 是否代課 |
| I | 最後同步時間 |

API 同步不會寫入或覆蓋「請假代課紀錄」；請假、代課與 OB 處理歷史會保留在該表。

### 請假代課紀錄

原本的「工作表1」會在首次執行 `ensureSystemStructure_()` 時更名為「請假代課紀錄」。既有 A:J 不會移動，後續欄位只追加在右側。

| 欄 | 標題 |
|---|---|
| A | 登記時間 |
| B | 原老師 |
| C | 日期 |
| D | 時段 |
| E | 課程 |
| F | 狀態 |
| G | 代課老師 |
| H | 備註 |
| I | 入系統 |
| J | 代課編號 |

### 登入帳號

`ensureSystemStructure_()` 會建立「登入帳號」表。它只保存 Salt、PIN 雜湊、啟用狀態、角色與登入保護資訊，不保存可直接使用的 PIN。

第一次建立管理員時，先在「指令碼屬性」暫存下列兩個值，執行 `initializeFirstAdminFromProperties` 一次；成功或失敗後，程式都會立即刪除這兩個暫存值：

| 屬性 | 值 |
|---|---|
| `INITIAL_ADMIN_NAME` | 管理員姓名 |
| `INITIAL_ADMIN_PIN` | 管理員身分證末碼 |

若「登入帳號」已有任何帳號，請勿再設定這兩個屬性。後續帳號會由管理員功能建立。

### 老師名單

A1 必須是「指導者」，A2 以下放可使用系統的老師姓名。

## Apps Script 部署與手動同步

請依照順序操作，避免新版前端先連到舊後端。部署前先備份試算表。

1. 開啟此試算表綁定的 Apps Script。
2. 將 repository 內 `Code.gs` 全選複製，完整覆蓋 Apps Script 舊程式。
3. 到「專案設定」的「指令碼屬性」新增：
   - 屬性：`OMCEAN_API_TOKEN`
   - 值：Omcean Booking 後台產生的 API token
4. 在 Apps Script 編輯器手動執行 `ensureSystemStructure_` 一次，完成「工作表1」改名與新增欄位／輔助工作表。
5. 若是首次使用登入系統，設定 `INITIAL_ADMIN_NAME`、`INITIAL_ADMIN_PIN` 後，執行 `initializeFirstAdminFromProperties` 一次。
6. 到 Apps Script 左側「觸發條件」刪除舊版 `syncCourseListFromApi` 的時間觸發條件。新版不安裝、也不執行每小時同步。
7. 重新部署 Web App 新版本，執行身分使用部署者，存取權依現有正式設定。
8. 若重新部署後 Web App URL 改變，更新 `index.html` 的 `APP_URL`。
9. 最後才將新版 `index.html` 發布到 GitHub Pages。

管理端每次按「同步 OB 課表」時，會以管理員 Session 呼叫 `syncCourseListFromApi(sessionToken)`。它只抓取今天至下個月底、排除已取消課程，並在完整取得、解析及驗證資料後才以鎖定方式取代 `CourseList`。Task 4 的管理端頁面會提供這個按鈕；不得再建立時間觸發條件。

API 權杖、登入 PIN 與管理員 Session 不得放入 `index.html`、GitHub 或試算表。

## 上線檢查

1. 同類代課：例如平常上空環的老師領取空環，能直接送出。
2. 跨類代課：例如平常上瑜伽的老師領取空環，未填改課內容時不得送出。
3. 填寫改課後，內容會寫入「請假代課紀錄」H 欄。
4. 同時在兩個瀏覽器領取同一堂課，只能有一位成功。
5. 重複送出同一堂請假會被拒絕。
6. 「我的代課紀錄」會顯示原老師與改課備註。
7. API 同步遇到零筆、無效 JSON、HTTP 錯誤或無有效課程時，原本 `CourseList` 不會被清空。

## 本機測試

```bash
node --test tests/*.test.js
```

GAS 語法檢查可先複製成暫存 `.js` 後執行 `node --check`。正式程式仍以 `Code.gs` 為準。
