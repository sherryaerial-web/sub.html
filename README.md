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

固定欄位：

| 欄 | 標題 |
|---|---|
| A | 日期 |
| B | 時間 |
| C | 課程 |
| D | 指導者 |

### 工作表1

固定欄位：

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

`Code.gs` 會在 J1 空白時自動填入「代課編號」，不會移動 A:I。

### 老師名單

A1 必須是「指導者」，A2 以下放可使用系統的老師姓名。

## Apps Script 部署

請依照順序操作，避免新版前端先連到舊後端。

1. 開啟此試算表綁定的 Apps Script。
2. 將 repository 內 `Code.gs` 全選複製，完整覆蓋 Apps Script 舊程式。
3. 到「專案設定」的「指令碼屬性」新增：
   - 屬性：`OMCEAN_API_TOKEN`
   - 值：Omcean Booking 後台產生的 API token
4. 在 Apps Script 編輯器手動執行 `syncCourseListFromApi` 一次並授權。
5. 確認 `CourseList` 只有今天至下個月底、且沒有已取消課程。
6. 手動執行 `installHourlySyncTrigger` 一次。
7. 重新部署 Web App 新版本，執行身分使用部署者，存取權依現有正式設定。
8. 若重新部署後 Web App URL 改變，更新 `index.html` 的 `APP_URL`。
9. 最後才將新版 `index.html` 發布到 GitHub Pages。

API 權杖不得放入 `index.html`、GitHub 或試算表。

## 上線檢查

1. 同類代課：例如平常上空環的老師領取空環，能直接送出。
2. 跨類代課：例如平常上瑜伽的老師領取空環，未填改課內容時不得送出。
3. 填寫改課後，內容會寫入 `工作表1` H 欄。
4. 同時在兩個瀏覽器領取同一堂課，只能有一位成功。
5. 重複送出同一堂請假會被拒絕。
6. 「我的代課紀錄」會顯示原老師與改課備註。
7. API 同步失敗時，原本 `CourseList` 不會被清空。

## 本機測試

```bash
node --test tests/*.test.js
```

GAS 語法檢查可先複製成暫存 `.js` 後執行 `node --check`。正式程式仍以 `Code.gs` 為準。
