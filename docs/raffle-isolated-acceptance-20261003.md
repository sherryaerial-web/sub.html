# 抽獎隔離 GAS／Sheets 驗收

2026-10-03，使用者允許繼續建立獨立測試環境。沒有正式活動、沒有寄信、沒有正式部署。

## 環境

- [假資料試算表](https://docs.google.com/spreadsheets/d/1k_ULYH9PG1xt45Ncrtd6UjWU3yy9BbGPsLkXBdsbgFE/edit)，位於新建 My Drive／ChatGPT 資料夾，僅原擁有者可使用；沒有新增共用權限。
- [隔離 GAS](https://script.google.com/home/projects/10zm4vErpaK9kXskt9cQ4-zOmZGafgUwob4ZqiAM2uO0UUTDbcbiu7tKq/edit)，綁定上述表。未建立 Web App、部署或觸發器。
- 測試來源 Code.gs commit `8d18d45`；由 `scripts/build-raffle-sandbox.cjs` 原樣擷取 28 個函式，逐函式 SHA-256 記於 `raffle-sandbox-source-manifest.json`。
- 測試帳號名稱皆為假角色 session；不是獨立老師帳號的登入授權驗收。Email 使用 `example.invalid`。
- 驗收腳本 `scripts/raffle-integration-sandbox.gs` 不得納入正式 GAS。固定 project ID、spreadsheet ID、B2 marker 三重檢查，錯環境立即拒絕；不覆蓋舊日誌、不提供清除／重跑初始化。
- 未加入 MailApp、GmailApp 或 UrlFetchApp 程式；manifest 只有 Sheets scope，沒有 email scope。

## 實際執行

### 18 項整合檢查

台北時間 18:35:02 開始，18:35:16 完成，GAS result `status:passed, checks:18, journalRows:4`。

1. 真實來源預覽：3 筆待匯入、1 筆未選獎、0 異常。
2. 預覽不建立日誌。
3. 老師角色不可匯入。
4. 管理角色成功匯入 3 筆。
5. 批次僅追加一列日誌。
6. 相同 requestId 重試不追加。
7. 再預覽識別 3 筆重複，不重設狀態。
8. 真實日誌可還原現貨、待貨、電子狀態。
9. 錯館領取拒絕。
10. 老師領取成功持久化。
11. 相同領取重試不重複計件。
12. 不同 requestId 的舊版本領取拒絕。
13. 老師角色不可標记到館。
14. 備貨角色成功標記到館。
15. 電子獎品不可實物交付。
16. 已過期活動不可領取。
17. 拒絕操作沒有額外日誌。
18. 來源名單和獎品表前後完全一致。

### 真實並行競爭

兩個 GAS 編輯器執行，各自使用不同 requestId、相同 claim/version=2，25 秒 barrier 後同時呼叫未改寫的 `mutateRaffleClaim_`。

- A、B 的呼叫起點均為 Unix ms `1791023856738`。
- A 在 `1791023857677` 返回 collected，版本 3、已領數量 1。
- B 在 `1791023858154` 返回 rejected：「領獎資料版本已更新，請重新查詢。」
- 執行區間確實重疊；日誌只增加 A 一列。Google Sheets connector 獨立回讀 A5:D6，只有第 5 列，無第 6 列。
- 18:38:07 `inspectSandboxRace` 回報 `passed:true, journalRows:5, writesEnabled:false, sendEnabled:false`。測試活動和寫入已關閉，假資料保留作證據，不必清掉。

### 遠端版本回讀

GAS API `getContent` 回讀三檔均與送出內容一致：

- appsscript SHA-256 `ecc8ccd25846f703320755fa69752035638e4c6902be1e5f33d456bb2af76c96`
- Sandbox SHA-256 `e428b53d981975a56f9146ebf859524caf1b3c6697eed27b23444284c9740fb3`
- RaffleUnderTest SHA-256 `606e127e9b030fce15ba6fd13868b756cd7f05fc91aa1b8261ca4c1973275d52`

## 不可混稱已完成的部分

- 未測真實不同帳號的登入／路由授權；只驗明確提供的角色 session 判斷。
- 未測真正平台逾時、Google 服務故障／quota 故障、5000 筆規模。
- 本次只驗匯入、領取和備貨的抽出函式；活動日誌、信件佇列與正式整套路由仍需獨立整合驗收。
- 無郵件傳送測試；既有那一封已收到的 smoke 信未重寄。
- 未 push、未發布正式 Pages／GAS、未動 OB／LINE／正式 Sheets。不得以本紀錄視為正式上線完成。

## 重現與保留

建立 workbook 使用 `scripts/raffle-sandbox-fixture.mjs`（bundled artifact-tool），xlsx 由 Drive import 原生轉換；三分頁已看 Google 原生畫面並回讀值。Builder 只生成 `/private/tmp/raffle-integration-20261003/gas-payload.json`，不自行上傳。

本次沒有修改產品 Code.gs 或前端，不重跑先前已驗證的 973 項全套；驗收新增本機語法和三個環境 guard，以及上述真實 Google 執行。下一次不可直接重跑初始化或 race；保留此結果，需要新案例時另加明確且受保護的入口。
