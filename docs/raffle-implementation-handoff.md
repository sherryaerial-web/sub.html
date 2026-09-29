# 抽獎整合進度（2026-09-29）

## 已完成、尚未部署

- 老師「我的 → 領獎查詢」：依姓名（至少 2 字）或完整 Email 查詢，Email 遮罩，同名學生分開。
- 管理「抽獎・領獎」：獨立 `raffle_admin` 權限；不自動授予既有帳號。
- 已登記未來來源表的匯入預覽：新增、重複、來源衝突、格式異常、未選獎品。
- 來源驗證碼不回傳；既有領取狀態不重設；不改來源庫存／舊表。
- 登出、切換頁面與過期回應清除，手機／桌面版。
- 第二階段：確認匯入（每次最多 25 筆）、逐筆到館、領取／部分領取、管理員更正誤領與操作紀錄。
- 同一筆操作沿用 requestId；逾時後重新確認不重做已完成寫入。版本核對阻擋兩位老師同時重複領取；錯館／未備貨／電子獎品不能實物交付。

這仍不是完整可營運版本。尚無活動設定介面、備貨彙總與實際寄信流程；尚未接實際未來活動資料。不得因本地測試通過就當成正式已啟用。

## 開發設定契約（本次未設定正式環境）

- Script Properties `RAFFLE_ENABLED` 必須明確為 `true`，否則停止在未開放畫面，不讀 Sheet。
- `RAFFLE_CAMPAIGNS_JSON` 是最多 10 個活動的陣列。每個活動需 `id`、`name`、`sourceSpreadsheetId`；可選 `readyPrizeVenues: [{prizeId, venue}]`。
- `RAFFLE_WRITES_ENABLED` 另需明確設為 `true` 才允許確認匯入／交付／到館／更正。本次未設定正式環境。
- 活動可設定 `pickupDeadline`（含時區的 ISO 日期時間）；有設定且已到期則阻擋領取，未設定表示沒有額外期限。期限介面與正式設定仍待後續。
- 來源分頁：`抽獎名單`、`獎項設定`。欄位按既有標題對應，缺欄／重複欄位／不唯一獎項會拒絕或列異常，不猜測。
- 未來結果表 `RaffleClaims` 的讀取契約：`id,campaignId,email,studentName,prizeId,prizeName,venue,quantity,claimedQuantity,status,claimedAt,claimedBy,sourceFingerprint`。目前讀取函式不建立或寫入此表。
- 正式操作以新 `RaffleJournal` 為準，欄位 `requestId,requestHash,createdAt,eventJson`。同一列保存此次操作的結果狀態及稽核，不拆成两次跨表更新。可讀取 `RaffleClaims` 作初始種子，但不改舊表。
- 日誌只追加，不更動舊列；受鎖定與版本保護。第一筆已驗證操作才建表；讀取不建表。日誌損壞／重複／版本不連續／結果筆數不符會停止，最多 5000 次操作後需另做封存方案，不能自行清空。
- `setValues` 後在持鎖期間 `SpreadsheetApp.flush()`；flush 失敗仍當不確定結果，必須沿用 requestId 重查，不能重新生成請求後宣稱成功。參考 [Google Lock 文件](https://developers.google.com/apps-script/reference/lock/lock#releaseLock())。
- 每表最多 5000 筆資料、40 欄；超限會停止，不靜默截斷。查詢最多 50 筆；預覽最多顯示 100 筆新增及各 100 筆問題，統計保留總數。
- 歷史周年慶來源 ID 被拒絕，不得為方便測試移除保護。

## 待做（先別上線）

1. 活動設定 UI、草稿／啟用流程及以獎品／館別彙總備貨；目前授權備貨人員可由「我的 → 獎品備貨／到館」查學生、逐筆操作。
2. 管理員更正目前僅能調低誤領數量，不能改獎品或館別；來源異動仍會阻擋匯入，需另設明確處理流程。
3. 過期／撤銷狀態的管理流程尚未完成；已有期限檢查，不能宣稱完整活動生命週期已完成。
4. 驗證碼／可領取信件預覽與確認、配額、穩定寄信工作 ID、未知寄送結果不可直接重試。
5. 核對未來活動的實際來源表與正式 GAS；確認舊寄信觸發器關閉，再另取正式部署及寄信許可。

## 已驗證

- `node --test tests/*.test.js`：最終 874/874 通過；含 review 後加入的 buffered write、flush 不確定、日誌部分毀損、結果／狀態一致性回歸測試。
- `node --check raffle.js`、`git diff --check` 通過。
- `tests/raffle-visual-check.mjs`：離線瀏覽器測試查詢、權限、停用、錯誤、同名、過期回應、登出、確認取消、錯館、同 ID 重試、匯入、稽核及 390/1280px 顯示。
- 圖片 `/private/tmp/raffle-preview/` 使用假資料，不是正式學生資料。
- 獨立唯讀 review：無 Critical／Important；指出全域 refresh 會沿用已掛載画面。該控制項位於只在「更多工具」顯示的 `admin-tools-shell`，抽獎頁不顯示；抽獎使用自己的「查詢學生／核對抽獎結果」，每次重新讀取。未擴改全域 refresh。
- 本地主代理已對照歷史 `Code-v2.gs` 的 LIST_HEADERS／PRIZE_HEADERS；正式未來活動仍須重新核對，不宣稱等同正式來源。
- 第二階段獨立 review 提出 2 項 Important：釋鎖前 flush、有效 JSON 部分毀損時停止。已用失敗測試重現再修正；正式並行／大型日誌效能仍須隔離 GAS 環境驗證，不能拿本機 mock 冒充正式證據。

## 保留邊界

未推送、未部署、未建立或寫入正式試算表、未寄信、未改帳號權限；既有 LINE 關課程式未更動。工作在 `/private/tmp/sherry-weekly-release-20260927`、`release/weekly-practice-20260927`，不要去覆蓋另一個 dirty checkout。
