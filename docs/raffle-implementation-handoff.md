# 抽獎整合進度（2026-09-29）

## 已完成、尚未部署

- 老師「我的 → 領獎查詢」：依姓名（至少 2 字）或完整 Email 查詢，Email 遮罩，同名學生分開。
- 管理「抽獎・領獎」：獨立 `raffle_admin` 權限；不自動授予既有帳號。
- 已登記未來來源表的匯入預覽：新增、重複、來源衝突、格式異常、未選獎品。
- 來源驗證碼不回傳；既有領取狀態不重設；不改來源庫存／舊表。
- 登出、切換頁面與過期回應清除，手機／桌面版。

這不是完整可營運版本。尚無確認匯入、交付、更正、備貨及實際寄信功能，不應當成正式領獎紀錄使用。

## 開發設定契約（本次未設定正式環境）

- Script Properties `RAFFLE_ENABLED` 必須明確為 `true`，否則停止在未開放畫面，不讀 Sheet。
- `RAFFLE_CAMPAIGNS_JSON` 是最多 10 個活動的陣列。每個活動需 `id`、`name`、`sourceSpreadsheetId`；可選 `readyPrizeVenues: [{prizeId, venue}]`。
- 來源分頁：`抽獎名單`、`獎項設定`。欄位按既有標題對應，缺欄／重複欄位／不唯一獎項會拒絕或列異常，不猜測。
- 未來結果表 `RaffleClaims` 的讀取契約：`id,campaignId,email,studentName,prizeId,prizeName,venue,quantity,claimedQuantity,status,claimedAt,claimedBy,sourceFingerprint`。目前讀取函式不建立或寫入此表。
- 每表最多 5000 筆資料、40 欄；超限會停止，不靜默截斷。查詢最多 50 筆；預覽最多顯示 100 筆新增及各 100 筆問題，統計保留總數。
- 歷史周年慶來源 ID 被拒絕，不得為方便測試移除保護。

## 待做（先別上線）

1. 活動設定 UI 與新的資料表初始化；草稿／啟用流程。
2. 匯入確認 token、鎖定與防重寫入；以明確 ID、版本更新，不覆蓋人工資料。
3. 備貨角色、逐筆到館、部分領取、錯館檢查、雙人同時操作防重、管理員附理由更正、完整稽核。
4. 驗證碼／可領取信件預覽與確認、配額、穩定寄信工作 ID、未知寄送結果不可直接重試。
5. 核對未來活動的實際來源表與正式 GAS；確認舊寄信觸發器關閉，再另取正式部署及寄信許可。

## 已驗證

- `node --test tests/*.test.js`：859/859 通過。
- `node --check raffle.js`、`git diff --check` 通過。
- `tests/raffle-visual-check.mjs`：離線瀏覽器測試查詢、權限、停用、錯誤、同名、過期回應、登出及 390/1280px 顯示。
- 圖片 `/private/tmp/raffle-preview/` 使用假資料，不是正式學生資料。
- 獨立唯讀 review：無 Critical／Important；指出全域 refresh 會沿用已掛載画面。該控制項位於只在「更多工具」顯示的 `admin-tools-shell`，抽獎頁不顯示；抽獎使用自己的「查詢學生／核對抽獎結果」，每次重新讀取。未擴改全域 refresh。
- 本地主代理已對照歷史 `Code-v2.gs` 的 LIST_HEADERS／PRIZE_HEADERS；正式未來活動仍須重新核對，不宣稱等同正式來源。

## 保留邊界

未推送、未部署、未建立或寫入正式試算表、未寄信、未改帳號權限；既有 LINE 關課程式未更動。工作在 `/private/tmp/sherry-weekly-release-20260927`、`release/weekly-practice-20260927`，不要去覆蓋另一個 dirty checkout。
