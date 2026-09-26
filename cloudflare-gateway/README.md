# Sherry Classroom Gateway

此 Worker 服務學生自主練習、VVIP 公開頁，以及僅供 GAS 呼叫的綠界發票內部路由。公開路由會驗證來源、JSON 大小、Turnstile、頻率限制，再以 HMAC-SHA256 簽章轉送 GAS；內部發票路由使用另一組 HMAC 與 Durable Object nonce 防重送，不接受瀏覽器直接呼叫。

## 路由

| Method | Path | Turnstile |
|---|---|---|
| GET | `/health` | 否 |
| GET | `/api/student-practice/availability` | 否 |
| POST | `/api/student-practice/submit` | 是，action `student_practice_submit` |
| GET | `/api/vvip/members` | 否 |
| POST | `/api/vvip/selection` | 是，action `vvip_selection_lookup` |
| POST | `/api/vvip/submit` | 是，action `vvip_selection_submit` |
| POST | `/internal/ecpay/invoices/issue` | 不適用；GAS HMAC、5 分鐘時窗、nonce 防重送 |

未列出的 path 或 method 一律拒絕。Production CORS 與 Turnstile hostname 只允許 `sherryaerial-web.github.io`；staging 另外允許 `localhost` 與 `127.0.0.1` 預覽。

## 本機設定與測試

複製 `.dev.vars.example` 為 `.dev.vars`，只在本機填值。`.dev.vars`、`.env`、`.wrangler/` 與 `node_modules/` 已被 Git 忽略，不得強制加入版本控制。

必要設定：

- `GAS_UPSTREAM_URL`：現行 GAS Web App URL。
- `GAS_GATEWAY_SECRET`：至少 32 bytes，須與 GAS `CLOUDFLARE_GATEWAY_SECRET` 完全相同。
- `TURNSTILE_SECRET_KEY`：該環境 Turnstile widget 的 secret key。
- `ALLOWED_ORIGINS`：逗號分隔的完整 Origin，不使用模糊或尾碼比對。
- `TURNSTILE_HOSTNAMES`：逗號分隔的精確 hostname。
- `INVOICE_GATEWAY_SECRET`：至少 32 bytes，只與 GAS 的同名 Script Property 共用。
- `ECPAY_PRIMARY_MERCHANT_ID`、`ECPAY_PRIMARY_HASH_KEY`、`ECPAY_PRIMARY_HASH_IV`：第一組綠界商店設定。
- `ECPAY_SECONDARY_MERCHANT_ID`、`ECPAY_SECONDARY_HASH_KEY`、`ECPAY_SECONDARY_HASH_IV`：第二組綠界商店設定。
- `ECPAY_ENVIRONMENT`：只接受 `stage` 或 `production`，不得由請求指定 URL。

```bash
npm install
npm test
WRANGLER_LOG_PATH=/private/tmp/sherry-gateway-wrangler.log npm run check -- --env=""
```

以上測試只使用假資料，不連正式 GAS 或 Google Sheets。

## Staging 部署檢核

以下操作均須先取得明確允許，且秘密只能在終端互動提示輸入：

```bash
npx wrangler secret put GAS_UPSTREAM_URL --env staging
npx wrangler secret put GAS_GATEWAY_SECRET --env staging
npx wrangler secret put TURNSTILE_SECRET_KEY --env staging
npx wrangler secret put INVOICE_GATEWAY_SECRET --env staging
npx wrangler secret put ECPAY_PRIMARY_MERCHANT_ID --env staging
npx wrangler secret put ECPAY_PRIMARY_HASH_KEY --env staging
npx wrangler secret put ECPAY_PRIMARY_HASH_IV --env staging
npx wrangler secret put ECPAY_SECONDARY_MERCHANT_ID --env staging
npx wrangler secret put ECPAY_SECONDARY_HASH_KEY --env staging
npx wrangler secret put ECPAY_SECONDARY_HASH_IV --env staging
npx wrangler deploy --env staging
```

上述 secret 必須用 `wrangler secret put` 的互動提示輸入，不得放進指令、commit、試算表或前端。`ECPAY_ENVIRONMENT=stage` 是非機密環境變數；正式發布時才改為 `production`。

部署後依序檢查：

1. `GET /health` 回傳 `configured: true`。
2. 非允許 Origin 回傳 403，且沒有 GAS 呼叫。
3. 錯誤／過期 Turnstile、錯誤 action 或 hostname 都被拒絕。
4. 同一路由超過頻率限制回傳 429。
5. GAS 錯誤或逾時不重試寫入，也不回傳內部網址、token、簽章或 Sheet 資訊。
6. 經另外允許後才做具名學生及 VVIP 測試寫入，並到 Tako 管理頁核對。

Production 使用上述全部 `wrangler secret put` 指令但不加 `--env staging`，之後才執行 `npx wrangler deploy`。不要把 production 值複製到 staging 檔案。

## 啟用與驗證

GAS 相容部署期間保持 `PUBLIC_GATEWAY_ENFORCED=false`。Worker、公開頁與正式 smoke test 都正常後，才在另一次核准中改為 `true` 並重新部署 GAS。

完成切換後必測：

- Worker 的學生送出與 VVIP 送出成功。
- 直接對 GAS 發送未簽章的兩個公開寫入 action 失敗。
- 過期簽章、錯誤簽章與重播 nonce 失敗。
- 被拒絕前後的正式 Sheet 列數一致。
- `index.html` 的老師／管理員登入與操作不受影響。

## 秘密輪替與回復

輪替 HMAC 秘密時，先讓 GAS 與 Worker 使用同一新值，再做 smoke test；兩端不同步時所有公開寫入都會失敗。Turnstile secret 只在 Worker 輪替，site key 變更時才需同步更新兩個公開頁。

發生事故時先把 GAS `PUBLIC_GATEWAY_ENFORCED` 改為 `false` 並部署，再回復三個公開前端檔案。不得以回復程式為理由還原或整張覆寫正式 Sheet。
