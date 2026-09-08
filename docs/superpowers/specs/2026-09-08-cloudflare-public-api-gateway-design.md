# Sherry Aerial 公開 API Cloudflare 安全閘道設計

日期：2026-09-08

## 目標

保留現有 Google Apps Script 與 Google Sheets 的資料邏輯，新增一個獨立的 Cloudflare Worker，保護學生自主練習與 VVIP 選課等不需老師登入、但會寫入 Google Sheet 的公開操作。老師登入、管理後台、排課、請假、代課及薪資流程不在本次搬移範圍內。

## 現況與風險

- GitHub Pages 前端直接呼叫 GAS Web App。
- GAS Web App 以部署者身分執行，存取範圍為目前綁定的試算表。
- 老師及管理功能均由後端 Session 與管理權限保護。
- 學生自主練習與 VVIP 選課為公開流程，因此目前可由任何來源直接呼叫寫入操作。
- 學生自主練習首次登記可自行填寫 APP 名稱與 Email；VVIP 選課以公開名單中的會員 ID 辨識。
- 現有 GAS 沒有訪客 IP、Turnstile 驗證或 Cloudflare 層級的頻率限制。

## 採用方案

建立獨立專案 `cloudflare-gateway/`，Worker 名稱為 `sherry-classroom-gateway`；測試環境使用 `sherry-classroom-gateway-staging`。不共用目前仍在開發中的 LINE AI Worker，避免客服與教室管理互相影響。

資料流如下：

1. 學生或 VVIP 在既有 GitHub Pages 頁面操作。
2. 公開頁面把讀取與送出請求傳給 Cloudflare Worker。
3. Worker 僅接受 Sherry Aerial 正式網站與本機測試來源，並限制 HTTP 方法、路徑、內容格式與大小。
4. 公開寫入必須先通過 Cloudflare Turnstile 的伺服器端驗證及頻率限制。
5. Worker 為通過的請求產生短效簽章，再轉送到既有 GAS。
6. GAS 驗證簽章、有效時間及 nonce 未重複後，才執行原本的 Sheet 寫入函式。
7. GAS 回覆由 Worker 整理成固定 JSON 格式，再傳回前端。

Google Sheet 仍由 GAS 的 `SpreadsheetApp` 讀寫，不新增 Google Service Account，也不把 Google 憑證搬到前端或 Worker。

## Worker 路由

Worker 只提供以下公開路由：

- `GET /api/student-practice/availability`：取得學生自主練習空檔。
- `POST /api/student-practice/submit`：送出學生自主練習登記。
- `GET /api/vvip/members`：取得可選擇的 VVIP 顯示名單。
- `POST /api/vvip/selection`：取得指定 VVIP 本期選課內容。
- `POST /api/vvip/submit`：送出 VVIP 選課。
- `GET /health`：回覆 Worker 與設定狀態，不讀取 Sheet、不回傳秘密值。

Worker 以固定 allowlist 將路由映射到既有 GAS action，使用者不能自行指定任意 action。

## Turnstile 與頻率限制

- 三個會寫入或讀取個人選課內容的 POST 路由必須附 Turnstile token。
- Worker 必須呼叫 Cloudflare Siteverify 驗證；只做前端元件而沒有伺服器驗證視為失敗。
- 驗證時檢查 `success`、正式 hostname 與對應 action。
- Turnstile 逾時、重複使用、格式錯誤或服務異常時，不轉送 GAS，前端顯示可重試訊息。
- Worker Rate Limiting binding 以「路由＋身分摘要」作為主要 key；首次學生登記再加入訪客網路來源作為輔助 key。
- 寫入上限設定為同一 key 每分鐘 5 次；超過時回覆 HTTP 429，不觸碰 GAS 或 Sheet。
- 公開空檔讀取可快取短時間，且使用獨立、較寬鬆的讀取限制，避免正常瀏覽被寫入限制影響。

## Worker 到 GAS 的簽章

Worker 與 GAS 共用一枚至少 32 bytes 的隨機秘密，分別存為：

- Cloudflare Worker Secret：`GAS_GATEWAY_SECRET`
- GAS Script Property：`CLOUDFLARE_GATEWAY_SECRET`

簽章內容固定為：版本、GAS action、Unix timestamp、隨機 nonce、請求 payload 的 SHA-256 摘要。Worker 使用 HMAC-SHA256 產生 Base64URL 簽章，並把版本、timestamp、nonce 與簽章放在 POST body 中。

GAS 僅對公開寫入 action 執行以下驗證：

- timestamp 與 GAS 現在時間相差不得超過 5 分鐘。
- nonce 格式正確，且 10 分鐘內未使用過。
- GAS 以 Script Property 內的秘密重新計算簽章並做固定時間比較。
- nonce 驗證與登記寫入各自使用既有鎖定機制，避免重播或重複寫入。

任何缺少簽章、簽章錯誤、過期或重播的公開寫入都直接拒絕。錯誤回覆不可透露簽章內容、秘密或內部 Sheet 資訊。

## 秘密與設定

以下值不得提交到 Git：

- `GAS_GATEWAY_SECRET`
- `TURNSTILE_SECRET_KEY`
- `GAS_UPSTREAM_URL`
- Omcean、OneSignal 或其他服務 Token

Turnstile site key 是公開識別值，可以放在前端；Turnstile secret key 只能存於 Worker Secret。Worker 設定必須宣告 required secrets，使缺少秘密時停止部署或健康檢查失敗。

本機只提交 `.dev.vars.example` 的變數名稱，不提交 `.dev.vars` 或 `.env` 實際內容。

## 前端調整

- `student-practice.js` 改呼叫 Worker 路由，不再直接把公開學生登記送到 GAS。
- `vvip.html` 改呼叫 Worker 路由，不再直接把 VVIP 操作送到 GAS。
- 送出按鈕前取得 Turnstile token；成功或失敗後重設 token，避免重複使用。
- Turnstile 使用互動時才顯示的模式，盡量不增加正常使用者步驟。
- 老師端 `index.html` 仍直接呼叫 GAS，Session 與管理權限邏輯不變。

## GAS 調整與相容發布

新增 Script Property `PUBLIC_GATEWAY_ENFORCED`，分階段切換：

1. GAS 先部署簽章驗證程式，但 `PUBLIC_GATEWAY_ENFORCED=false`，舊前端仍可使用。
2. 部署 staging Worker，使用 Cloudflare 測試 Turnstile key 完成自動與人工驗證。
3. 更新學生與 VVIP 前端改走正式 Worker，但 GAS 仍保持相容模式。
4. 確認正式 Worker 寫入及管理頁同步正常後，將 `PUBLIC_GATEWAY_ENFORCED=true`。
5. 啟用後重新測試直接呼叫 GAS 的公開寫入，確認一定被拒絕。

`PUBLIC_GATEWAY_ENFORCED=true` 是安全功能真正生效的完成條件；只部署 Worker、但保留 GAS 匿名直寫不算完成。

## 錯誤與回復

- Turnstile 驗證失敗：不呼叫 GAS，請使用者重新驗證。
- 頻率超限：不呼叫 GAS，顯示稍後再試。
- Worker 無法連線 GAS：不宣稱登記成功，不重複自動送出寫入。
- GAS 回覆錯誤：保留原本對使用者友善的訊息，內部錯誤只記錄在 Worker/GAS 日誌。
- 回滾時先把 `PUBLIC_GATEWAY_ENFORCED=false`，再回復前端 API URL；不回復或覆寫任何 Sheet 資料。

## 測試與驗收

### Worker 自動測試

- 非 allowlist 路徑及 HTTP 方法被拒絕。
- 非正式 Origin、過大 body、錯誤 content type 被拒絕。
- Turnstile 成功才會轉送；失敗、過期與重播不轉送。
- 超過頻率限制回覆 429，GAS 呼叫次數維持不變。
- Worker 簽章固定輸入產生可由 GAS 驗證的結果。
- GAS 非 2xx、逾時與非 JSON 回覆都不會被誤判成功。
- 日誌與錯誤內容不含秘密、Turnstile token 或 GAS 簽章。

### GAS 自動測試

- 未啟用 enforcement 時維持舊公開流程。
- 啟用 enforcement 後，缺少、錯誤、過期及重播簽章均拒絕且不寫 Sheet。
- 正確簽章只執行一次既有學生或 VVIP handler。
- 老師登入與管理 action 不受公開閘道驗證影響。

### 前端與正式驗收

- 學生可查看空檔、首次登記、再次登記及加入既有學生時段。
- VVIP 可載入名單、查看已選內容並送出課程。
- Tako 管理頁可同步看到學生登記。
- 直接呼叫 GAS 的公開寫入會失敗。
- Worker `/health` 正常，且正式 Sheet 只出現人工驗收建立的明確測試資料。

## 不在本次範圍

- 不把全部老師與管理 API 搬到 Cloudflare。
- 不讓 Worker 直接使用 Google Sheets API。
- 不建立或使用 Google Service Account。
- 不變更 Sheet 分頁、欄位順序或既有資料。
- 不修改 LINE AI Worker 或客服 webhook。
- 不重寫 Git 歷史；已外洩憑證以旋轉失效為準。

## 發布權限與外部前置條件

正式實作完成後仍需分別取得下列授權：

- 建立或部署 Cloudflare Worker 與 Turnstile widget。
- 設定 Cloudflare Worker Secrets。
- 設定 GAS Script Properties。
- `git push`、`clasp push --force` 與正式 GAS 部署。

Omcean 舊 Token 是否仍有效無法由本次程式碼修改判定；正式發布前必須由有權限的人員在 Omcean 端旋轉，並把新值只放入 GAS Script Properties。

## 官方技術依據

- Cloudflare Turnstile server-side validation：<https://developers.cloudflare.com/turnstile/get-started/server-side-validation/>
- Cloudflare Workers Secrets：<https://developers.cloudflare.com/workers/configuration/secrets/>
- Cloudflare Workers Rate Limiting binding：<https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/>
