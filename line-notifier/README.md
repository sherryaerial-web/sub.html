# 關課徵人文案 LINE 私訊

## 正式接線補充（2026-09-26）

已唯讀確認 OA active webhook 是 `https://sherry-line-ai-staging.sherry-line-ai.workers.dev/webhook`（名字雖含 staging，確實為現用入口）。正式部署採用下載的線上 bundle 加最小 relay/bridge，而非 dirty 本機客服 checkout。

通知 Worker 透過 `LINE_PROXY` service binding 使用現有 LINE 服務。LINE channel secret 不取出、不複製；`integration/bridge.mjs` 在原服務內驗證 LINE 簽章、換取短效 token 及發送。專用 `BRIDGE_SECRET` 與原服務的 `CLOSURE_LINE_BRIDGE_SECRET` 配對，原服務的 `CLOSURE_LINE_SEND_ENABLED=false` 是第二道發送開關。推播 payload 帶 expires，取 token 前後都核對截止時間。

此正式模式通知 Worker 不需要 LINE_CHANNEL_SECRET／LINE_CHANNEL_ACCESS_TOKEN；原文件的直接 token 模式僅為可選測試介面。通知專用 D1 為 `5287befb-64d3-4763-8f4d-cca486012890`，不與客服 DB 共用。管理／交付 secrets 不顯示內容、不進 Git。

預設關閉。本地程式完成不代表上線；正式部署、設定 secrets、建立通知專用 D1，以及測試傳送須取得使用者授權。不得直接部署旁邊 LINE-AI checkout 的全部未提交修改。

## 接線

1. GAS 第一輪 `executeNextDayClosuresCore_` 回傳後排送既有 `socialCopy.content`；不在核心資料鎖內呼叫 LINE。
2. `POST /closure` 收取 HMAC envelope，凍結兩名收件者、文字與 retry key 到 D1。
3. Worker 立即背景嘗試，cron 補送失敗個別收件者。最多六次，當晚 23:40 截止。LINE 接受代表 accepted，不代表已讀或一定送達。
4. 綁定使用原有 LINE webhook 的已驗證 raw body 與簽章轉送 `/line-binding`。不換 webhook。只有 `綁定關課 ` 指令被攔截，其餘客服照舊。

本地 LINE-AI 已補 `src/line/closure-binding.js` 與 `src/index.js` 的最小接線，內容等同本資料夾 integration/relay.mjs。該 repo 有既存 dirty changes，不可整包提交/部署。須先確認正式程式來源，再把這次兩個檔案的新增部分移植進正式 release checkout。

## 設定與密鑰

通知 Worker：
- `DB`：新建、專用 D1，套用 schema.sql。不得使用客服 D1 或 Google Sheets。
- `ENABLED=false`：預設；核對兩人綁定並取得測試傳送授權才改 true。
- secrets：`ADMIN_SECRET`、`DELIVERY_SECRET`（不同、至少 32 字元）、`LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`（同官方帳號的有效 access token）。不要使用一小時後到期的 stateless token 作為永久 secret。

GAS Script Properties：
- `CLOSURE_LINE_ENABLED=false`（測試核對完成才啟用）
- `CLOSURE_LINE_URL=https://<approved-worker-host>/closure`
- `CLOSURE_LINE_SECRET` 等於 Worker DELIVERY_SECRET
- `CLOSURE_LINE_PENDING` 由程式管理，不手改；queued 只表示通知 Worker 接收。

現有 LINE webhook Worker：`CLOSURE_LINE_BINDING_URL=https://<approved-worker-host>/line-binding`。未設定時既有流程完全不變。

## 管理 API 契約（僅伺服器端呼叫）

所有管理 API 使用 ADMIN_SECRET，GAS `/closure` 使用 DELIVERY_SECRET。

```js
const payload = JSON.stringify({ role: 'ivy' }); // 'tako' 是另一收件角色
const timestamp = Date.now();
const nonce = crypto.randomUUID();
const path = '/admin/code';
const signature = await sign(secret, `${timestamp}\n${nonce}\n${path}\n${payload}`);
const body = JSON.stringify({ timestamp, nonce, payload, signature });
```

簽章：HMAC-SHA256、UTF-8、base64url 無 padding。時間誤差最多五分鐘、nonce 只能用一次；重試產生新 envelope，送件內容與目標日期不變。

- `POST /admin/code {role}`：產生 30 分鐘一次性代碼。將回傳 code 分別私下交給使用者，請傳 `綁定關課 <code>` 給官方帳號。兩角色不能同一 userId，已綁定不可覆蓋。重新發碼會使未用舊碼失效。
- `POST /admin/status {}`：只顯示角色是否綁定及近期送件狀態，不回傳 LINE userId。
- `POST /admin/revoke {role}`：撤銷收件角色並停止其未送件。此操作要先確認目標，已進入 LINE HTTP request 的訊息無法撤回。
- `POST /closure {targetDate:'2026/09/27',stage:'22:30',content:'...',failedCount:0}`：僅接受當晚22:30–23:40、目標為隔日的文字。兩人未綁定則拒絕入列。每日期/角色最多一份；內容或身分改變不自動重發。

## 正式上線必要檢查

1. 讀取 LINE `GET /v2/bot/channel/webhook/endpoint` 與 `/v2/bot/info`，確認 OA、目前 webhook 和本地來源的關係；只讀，不 PUT 切換。若不是本地 LINE-AI 服務，先接入確認的來源，不猜。
2. 檢查當前 LINE-AI 既存修改與正式版本，只移植本次 relay 接線；不發客服或廣播測試。
3. 正式部署授權後建立專用 D1、套用 schema、配置秘密與 default-off Worker。部署最小 relay，保持原 webhook URL。
4. 兩人私訊各自驗證碼後，管理 API 確認兩個 bound。
5. 使用者授權測試訊息後，於有效窗口用當天既有正確文案測試；當天同日期自動發送會去重，不另造日期繞過防重複。核對兩人實際收到。
6. 啟用 GAS 旗標、驗證正式 GAS/Worker 版本。不得為測試而呼叫真實關課或寫入 OB/試算表。
7. 回退：Worker ENABLED=false 阻止新傳送；GAS CLOSURE_LINE_ENABLED=false 阻止新排送。關課照常。已有 LINE request 無法取消。

## 驗證

```sh
node --test tests/closure-line-delivery.test.js line-notifier/test/*.test.mjs
# LINE-AI repo:
node --test test/closure-binding.test.js
```

測試使用真正 SQLite 執行 SQL，外部 LINE HTTP 用明確假回應；不發真實訊息。發布前 classroom regression 與 LINE-AI regression 各跑一次即可。

官方 retry-key 契約：https://developers.line.biz/en/docs/messaging-api/retrying-api-request/
