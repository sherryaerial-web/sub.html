# 抽獎整合進度（2026-10-03）

## 最新追加：獎品／館別備貨清單（本機完成，未上線）

- 獨立 `getRaffleFulfillment` 唯讀入口，先驗證 `raffle_admin`／`raffle_fulfillment`、開關及已登記活動，才讀領獎資料。一般老師不能列出備貨學生清單。
- 依活動、獎品 ID、館別分組，顯示待備貨／已備妥未領／已領取件數；部分領取按剩餘及實領件數分攤。電子獎與取消紀錄另列筆數，不納入實體備貨需求。這不是來源庫存，不再扣庫存。
- 從管理工作台或「我的 → 獎品備貨／到館」進入，選活動後按「獎品／館別備貨清單」；展開指定群組查看學生，Email 遮罩，同名不合併。群組及學生兩層均每頁 50 筆、可翻頁，合計不受分頁截斷。
- 到館／交付沿用既有逐筆、版本及 requestId 保護，不新增整批写入。操作後重新讀同一群組及頁面，返回總覽可見更新件數。不自動寄可領取通知。
- 期限已過或設定無效時顯示警告，詳情隱藏領取按鈕；既有後端截止檢查仍在。缺館別顯示待確認，不猜館別。
- 狀態／件數不一致、同一群組獎品名稱衝突會停止讀取，避免錯誤備貨合計。未新增來源讀寫、權限、活動或正式資料。
- 本輪全套 919/919 通過；相關 31 項通過；JS/GAS 語法及 diff 通過。離線 Chrome 390/1280：選活動、兩層名單、分頁、取消不寫、單筆到館後同群組更新、非管理員無寄信控制、舊回應忽略及登出通過。獨立 review 無 Critical／Important／Minor；正式 GAS／Sheets 及真實資料未驗證。
- 使用既有已批准規格的備貨視角做有界擴充，未增加批次變更或新庫存管理。剩餘：活動設定／草稿啟用、可領取通知、過期撤銷與來源衝突處理、正式整合驗證。

## 最新：邀請信寄送流程已在本機完成，未正式部署

- 管理員：預覽邀請信 → 確認排入待寄 → 寄送前確認內容及配額 → 二次確認真正寄出（最多 5 封）。匯入、預覽和排入待寄皆不寄信。
- 新 API：`previewRaffleMailSend`、`sendRaffleMailBatch`、`reconcileRaffleMail`。仍需獨立 `raffle_admin`，不授予新權限。
- 正式寄送須 `RAFFLE_ENABLED`、`RAFFLE_WRITES_ENABLED`、`RAFFLE_MAIL_SEND_ENABLED` 同時為字串 `true`，另需 `RAFFLE_MAIL_HANDOFF_JSON` 以活動 ID 對應精確來源表 ID，表示已人工核對舊寄信程式／觸發器停止；不能拿此設定當成自動停用舊 sender。這次沒有設定正式值。
- 日誌增加 `send-start`、`send-result`、`reconcile` 事件，既有 queued 記錄仍可讀；每次先在持鎖期間寫入整批 sending 並 flush，才呼叫 MailApp。全部配額不足即零寄送。來源資格、寄送欄位、Email、信件內容或活動網址變動均阻擋。
- Google 回傳成功後才記 `sent`，不宣稱收件匣已收到。MailApp 例外記 `uncertain` 並停止本批；中斷或結果寫入失敗保留 `sending`／`uncertain`，同 requestId 只讀結果，不續寄。其餘批內尚未呼叫 MailApp 者亦保守保留，需人工核對。
- 人工核對必填理由，可確認已寄或結案不重寄；不解除資格保留。尚未提供取消 queued／修改待寄內容／解除保留再寄功能。來源異動造成阻擋時不要手改日誌。
- 寄信紀錄优先列待核對，支援每頁 50 筆及上／下一頁；更新時間、操作者和理由可查。避免較早失敗批次被新排入工作淹沒。
- 本次沒有增加觸發器、推送 main、部署正式 GAS、寫正式 Sheets、建活動或寄給學生。正式來源契約、舊 sender 交接及整合 GAS 測試仍是發布前條件。

### 唯一已做的真實寄信測試（獨立專案）

使用者批准後，2026-10-03 15:29（台北）獨立單封測試寄至 `m605330912@icloud.com`；執行紀錄 accepted，使用者已回覆收到。專案 `1NhnaZzmNrsHC9Wzf_jTrfsBM-JiO5-dhby_GyzoVD4rcY-dof92gDdRJ`，不是正式教室 GAS，沒有 Web App／排程／Sheet 寫入。來源 `scripts/raffle-mail-smoke.gs`、4 項測試。不得清除單次保護或重建專案重寄。這只證明該帳號的單封傳送，不代表正式整合 sender 已上線。

### 仍未完成的產品範圍

活動設定介面／草稿啟用、可領取通知、過期撤銷管理與來源衝突處理，以及實際未來活動的正式串接驗證；獎品館別彙總已於上述追加完成。不能把單一階段完成說成整套抽獎已全部完成。

### 本輪驗證

全套 Node 測試 911/911 通過；寄信／前端相關 42 項通過，GAS／JS 語法與 diff 檢查通過。离線 Chrome 手機390px／桌面1280px：取消不呼叫 sender、逾時沿用 requestId、待確認提示、人工核對理由、紀錄翻頁、舊回應及登出清除通過。獨立 review 找到「舊待核對工作被最近50筆隱藏」，已以60封案例 RED→GREEN 修正為待核對優先且可翻頁。沒有正式資料測試。

以下為此前階段紀錄，寄信狀態以本節為準。

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

2026-10-03 續作：本機已完成待寄佇列。管理員預覽會核對來源寄送欄位及本系統保留資格，`deliveryChecked:true` 僅代表此兩者，**不是郵件供應商已送達核對**。確認前 5 封後才追加 `RaffleMailJournal`（`requestId,requestHash,createdAt,payloadHash,eventJson`），不寫來源、不改庫存、不寄信。`RAFFLE_MAIL_QUEUE_ENABLED`、`RAFFLE_WRITES_ENABLED`、`RAFFLE_ENABLED` 必須同時為 true；正式均未設定。每資格只保留一次，requestId 重試回傳原結果；來源／活動／保留狀態變更需重做預覽。JSON >45000 字元或日誌5000筆停止。寄信紀錄 UI 顯示最近50封元資料，不顯示驗證碼；每筆狀態僅 queued。尚無發送 worker、配額檢查、取消待寄或送出／不確定狀態轉移，不要手改日誌解除保留。這些仍須後續實作。

目前工作區改為 `/Users/ivy/Documents/2026 B 周年慶/substitute-v2-safari-fix-work/.worktrees/raffle-mail-20261003`、分支 `feature/raffle-mail-20261003`；舊 `/private/tmp/sherry-weekly-release-20260927` 的 .git 已消失但檔案保留，從已核對的 6ee2662 接續。主 checkout 的其他修改未動。

2026-09-29 追加停點：已接管理員「預覽邀請信（不寄出）」UI 與 `previewRaffleInvitations` 唯讀權限入口。活動須在 Script Properties 配置 `websiteUrl`（HTTPS）；缺漏會提示錯誤。畫面最多 20 封，依來源表合併 Email 並排除來源已寄／已使用等資格。固定顯示「尚未核對寄信紀錄」，回傳 `deliveryChecked:false`，不能拿此結果排程寄信。底層 `buildRaffleInvitationPreview_` 支援每資格 queued/sending/sent/uncertain 保留，但真正發送時 reservations 必須來自持久化寄信紀錄，不得沿用此純內容預覽的空陣列。寄信佇列、配額、到館通知與真正發送仍未完成。未新增 MailApp 呼叫或任何正式寫入。

1. 活動設定 UI、草稿／啟用流程及以獎品／館別彙總備貨；目前授權備貨人員可由「我的 → 獎品備貨／到館」查學生、逐筆操作。
2. 管理員更正目前僅能調低誤領數量，不能改獎品或館別；來源異動仍會阻擋匯入，需另設明確處理流程。
3. 過期／撤銷狀態的管理流程尚未完成；已有期限檢查，不能宣稱完整活動生命週期已完成。
4. 驗證碼邀請信已可預覽／確認排入待寄；後續仍需可領取通知、配額、正式送出前狀態、未知寄送結果人工核對（不可直接重試）。待寄不能誤當已寄。
5. 核對未來活動的實際來源表與正式 GAS；確認舊寄信觸發器關閉，再另取正式部署及寄信許可。

## 已驗證

- 2026-10-03 待寄佇列：全套 893/893 通過，語法／diff 通過；離線 Chrome 確認取消不寫入、逾時重試同 requestId、紀錄狀態與390px排版通過。獨立 review PASS，未見重要缺陷。非阻擋待補：有效雜湊的不同批次重複資格 replay 專用測試，目前已檢查保護分支，既有重複列測試先命中 requestId 防重。正式GAS/Sheets行為未驗證，不能以 mock 取代。

- 預覽 UI 最終版：`node --test tests/*.test.js` 884/884，`node --check raffle.js`、`git diff --check` 通過。30% 額度停工，僅本機保存。

- 邀請信內部預覽追加 7 項測試通過；最終全套 881/881 通過。獨立 review 的缺漏資料列誤認未寄問題已以 RED→GREEN 修正。此追加沒有 UI 改動，未重跑瀏覽器檢查。
- 後續預覽 UI：追加管理權限／停用／活動閘門、來源候選與 20 封上限、文字跳脫、缺漏回應不可誤顯示零封。離線瀏覽器測試手機 390px／桌面 1280px 長網址換行、預覽、活動切換忽略舊回應、錯誤顯示通過；假資料截圖 `/private/tmp/raffle-preview/mail-mobile.png`。獨立 review 未發現重要問題；正式資料與寄信仍未驗證。

- `node --test tests/*.test.js`：最終 874/874 通過；含 review 後加入的 buffered write、flush 不確定、日誌部分毀損、結果／狀態一致性回歸測試。
- `node --check raffle.js`、`git diff --check` 通過。
- `tests/raffle-visual-check.mjs`：離線瀏覽器測試查詢、權限、停用、錯誤、同名、過期回應、登出、確認取消、錯館、同 ID 重試、匯入、稽核及 390/1280px 顯示。
- 圖片 `/private/tmp/raffle-preview/` 使用假資料，不是正式學生資料。
- 獨立唯讀 review：無 Critical／Important；指出全域 refresh 會沿用已掛載画面。該控制項位於只在「更多工具」顯示的 `admin-tools-shell`，抽獎頁不顯示；抽獎使用自己的「查詢學生／核對抽獎結果」，每次重新讀取。未擴改全域 refresh。
- 本地主代理已對照歷史 `Code-v2.gs` 的 LIST_HEADERS／PRIZE_HEADERS；正式未來活動仍須重新核對，不宣稱等同正式來源。
- 第二階段獨立 review 提出 2 項 Important：釋鎖前 flush、有效 JSON 部分毀損時停止。已用失敗測試重現再修正；正式並行／大型日誌效能仍須隔離 GAS 環境驗證，不能拿本機 mock 冒充正式證據。

## 保留邊界

未推送、未部署、未建立或寫入正式試算表、未寄信、未改帳號權限；既有 LINE 關課程式未更動。工作在 `/private/tmp/sherry-weekly-release-20260927`、`release/weekly-practice-20260927`，不要去覆蓋另一個 dirty checkout。
