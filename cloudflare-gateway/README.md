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

`wrangler.toml` 已宣告 staging 的 `INVOICE_REQUEST_GUARD` Durable Object binding 與 `v1` SQLite class migration；第一次經允許部署 staging 時才會在 Cloudflare 建立／套用，不需要在 Dashboard 人工新增另一個同名 binding。回退 Worker 程式時保留 Durable Object storage 供 nonce 與事故追查，不直接刪除。

### 發票 staging 逐步操作與回復

每一列都必須分開取得使用者允許；前一步成功不會自動授權下一步。

| 階段 | 經允許後才執行 | 驗證 | 回復 |
|---|---|---|---|
| Gateway secrets | 以上述互動指令設定 `INVOICE_GATEWAY_SECRET`、`ECPAY_PRIMARY_MERCHANT_ID`、`ECPAY_PRIMARY_HASH_KEY`、`ECPAY_PRIMARY_HASH_IV`、`ECPAY_SECONDARY_MERCHANT_ID`、`ECPAY_SECONDARY_HASH_KEY`、`ECPAY_SECONDARY_HASH_IV` | secret 名稱存在；終端、Git 與 log 沒有真值 | 依名稱刪除或輪替 staging secret，不碰 production |
| Gateway staging | `npx wrangler deploy --env staging` | `/health` 的 `configured` 與 `invoiceConfigured` 都是 `true`；`POST /internal/ecpay/invoices/issue` 無簽章、過期簽章及重播 nonce 都被拒絕 | 重新部署部署前 commit；保留 Durable Object storage |
| GAS staging | 在測試 GAS Script Properties 設 `INVOICE_GATEWAY_URL`、`INVOICE_GATEWAY_SECRET` | URL 指向 staging internal route；shared secret 與 Worker 相同 | 移除兩個 staging properties，切回部署前 GAS version |
| staging 管理員 | 只對測試帳號加入 `invoice_admin` | 其他管理員仍不可讀取或操作發票 | 只移除該測試帳號的 `invoice_admin` |
| 假 OB 草稿 | 在測試試算表用假 OB 回應建立明確標記的單筆 queue | 只新增 `InvoiceQueue`、`InvoiceItems`、`InvoiceAudit`、`InvoiceSettings`；既有 Sheet 列數不變 | 只按測試 `invoiceId`／`paymentReferenceId` 清理已核准測試列，不清空整表 |
| 約 00:00 排程 | 人工同步驗證後執行 `installInvoiceSyncScheduler()` | 只有一個 `runScheduledInvoiceSync` trigger，時區 `Asia/Taipei` | 只刪該 handler trigger；不刪其他排程 |

假 OB 草稿先以 repository 的 fixture 測試驗證資料契約；真正寫入 staging 測試 Sheet 前仍須另行允許。staging smoke 必須使用 ECPay 測試環境，禁止把 `ECPAY_ENVIRONMENT` 改成 `production`。

staging 完整通過後，production 的 secrets、Worker deploy、GAS deploy、四張正式 Sheet、正式 `invoice_admin` 與正式 trigger 都要再次逐項核准。切 production 後仍只能在使用者指定一筆真實訂單並再次允許時做單筆測試；不得把部署核准解讀成開票或批次開票核准。

部署後依序檢查：

1. `GET /health` 回傳 `configured: true` 與 `invoiceConfigured: true`；前者代表既有公開 Gateway，後者才代表發票 secrets 與 replay guard 齊全。
2. 非允許 Origin 回傳 403，且沒有 GAS 呼叫。
3. 錯誤／過期 Turnstile、錯誤 action 或 hostname 都被拒絕。
4. 同一路由超過頻率限制回傳 429。
5. GAS 錯誤或逾時不重試寫入，也不回傳內部網址、token、簽章或 Sheet 資訊。
6. 經另外允許後才做具名學生及 VVIP 測試寫入，並到 Tako 管理頁核對。
7. 發票 internal route 的個人、多品項、公司、明確拒絕與連線中斷測試使用假資料；中斷結果只能是 `UNCERTAIN`，不可自動重送。

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

發票 internal route 與公開寫入路由互相獨立。若只有發票功能異常，先移除 staging／production GAS 的 `INVOICE_GATEWAY_URL` 或切回先前 GAS 版本，使新開票請求停止；不要關閉學生自主練習與 VVIP 公開閘道，也不要重送 `UNCERTAIN` 草稿。確認綠界實際結果後再人工修復狀態。
