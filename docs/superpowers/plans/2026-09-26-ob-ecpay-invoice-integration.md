# OB 購課與綠界電子發票整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 2026-09-26 起 OB 已付款的銀行轉帳購課同步到既有管理工作台，經 Ivy 或 Tako 人工確認後，透過 Cloudflare Gateway 安全開立兩個綠界商店帳號的 B2C 電子發票。

**Architecture:** GitHub Pages 前端只操作既有 GAS 管理 API；GAS 負責 OB 同步、Google Sheets 狀態、權限、流水號、人工確認與稽核。GAS 以 HMAC 簽章呼叫既有 Cloudflare Gateway 的內部發票路由；Worker Secrets 保存兩組 MerchantID／HashKey／HashIV，Worker 完成綠界 AES 加解密與 API 呼叫。GAS 是狀態與冪等性的唯一資料來源，Gateway 不寫 Sheets。

**Tech Stack:** Google Apps Script V8、Google Sheets、HTML/CSS/JavaScript、Cloudflare Workers（ES modules、Web Crypto、Durable Objects）、Node.js `node:test`、Wrangler、OB API、綠界 B2C 電子發票 API。

**Spec:** [2026-09-26-ob-ecpay-invoice-integration-design.md](../specs/2026-09-26-ob-ecpay-invoice-integration-design.md)

## Global Constraints

- 保留目前工作樹中使用者尚未提交的 `Code.gs`、`index.html` 與測試修改；每次只 stage 本任務明確列出的檔案。
- 不變更既有 Google Sheets 欄位索引；發票使用四張全新 Sheet，欄位一旦建立後只允許尾端追加，不重新排序。
- 不清空、不整表覆蓋、不依畫面列號更新；所有寫入以唯一鍵及預期狀態定位，並使用 `LockService`。
- 自動與手動 OB 同步都只新增／更新待處理資料，絕不自動開票。
- 不在前端、Sheets、GAS 日誌、Worker 日誌或錯誤訊息保存 OB Token、MerchantID、HashKey、HashIV、Gateway 共享密鑰、完整簽章或加密本文。
- 個人發票固定 `CarrierType=""`、`Print="0"`；買方統編發票固定 `CarrierType=""`、`Print="1"`，且公司抬頭、統編、地址皆必填。
- 綠界商品金額為含稅價，固定應稅 5%，不得再加 5%。
- 未付款、非銀行轉帳、2026-09-26 00:00（Asia/Taipei）以前的訂單不收錄。
- 不蒐集載具；不支援現金、刷卡、自動作廢或自動折讓。
- 本計畫的自動測試與本機 dry-run 不代表已上線；任何 Cloudflare/GAS 部署、Worker Secret 設定、Trigger 安裝、正式 Sheet 寫入或真實開票前都要再次取得使用者明確允許。

## Review Focus

1. OB 分頁途中遇到 429 後，游標能接續且不會重複建立發票或漏掉已完成頁面。
2. Ivy、Tako、排程或重複點擊同時操作時，同一內部發票只會進入一次開票流程。
3. Gateway HTTP 200 但綠界外層 `TransCode` 或解密後 `RtnCode` 失敗時，必須落到明確 `FAILED`，不能誤判成功。
4. 綠界可能已接受但 GAS 收不到回應時，必須落到 `UNCERTAIN` 並禁止自動重送。
5. 公司發票缺少／不合法的統編、公司抬頭或地址不得開立；個人發票仍維持 `Print="0"`。

---

### Task 1: 鎖定發票資料契約、Sheet 欄位與權限

**Files:**
- Modify: `Code.gs`（`SHEETS`、`SHEET_HEADERS`、`MANAGEMENT_CAPABILITIES`、`requireCapability_` 附近）
- Modify: `tests/backend-core.test.js`

- [ ] **Step 1: 先寫資料契約與權限的失敗測試**

在 `tests/backend-core.test.js` 新增測試，鎖定以下行為：

- `invoice_admin` 是獨立權限；一般管理員或只有 `course_admin` 的帳號不可讀寫發票功能。
- 新增 `InvoiceQueue`、`InvoiceItems`、`InvoiceAudit`、`InvoiceSettings`，建立時有固定欄名。
- 已存在的發票 Sheet 若欄位不符，只允許安全地在尾端補新欄，不得重排或覆蓋既有資料。
- 發票狀態只允許 `PENDING`、`INVALID`、`ISSUING`、`ISSUED`、`FAILED`、`UNCERTAIN`、`REFUND_REVIEW`、`REFUND_RESOLVED`。

- [ ] **Step 2: 執行測試並確認先失敗**

Run: `node --test --test-name-pattern="invoice schema|invoice capability" tests/backend-core.test.js`

Expected: FAIL，因尚無發票 Sheet 契約及 `invoice_admin`。

- [ ] **Step 3: 新增不可重排的發票 Sheet 契約**

在 `Code.gs` 新增常數與初始化函式：

- `SHEETS.INVOICE_QUEUE = 'InvoiceQueue'`
- `SHEETS.INVOICE_ITEMS = 'InvoiceItems'`
- `SHEETS.INVOICE_AUDIT = 'InvoiceAudit'`
- `SHEETS.INVOICE_SETTINGS = 'InvoiceSettings'`
- `INVOICE_STATUSES`
- `ensureInvoiceSheets_(spreadsheet)`

固定欄位：

- `InvoiceQueue`：`invoiceId`、`paymentReferenceId`、`status`、`merchantProfile`、`invoiceKind`、`customerEmail`、`customerIdentifier`、`customerName`、`customerAddress`、`salesAmount`、`relateNumber`、`ecpayInvoiceNo`、`ecpayInvoiceDate`、`ecpayRandomNumber`、`errorCode`、`errorMessage`、`purchasedAt`、`refundDetectedAt`、`refundResolvedAt`、`refundResolvedBy`、`refundNote`、`issuedAt`、`createdAt`、`updatedAt`、`version`。
- `InvoiceItems`：`itemId`、`invoiceId`、`obPurchaseId`、`itemSeq`、`itemName`、`itemCount`、`itemWord`、`itemPrice`、`itemAmount`、`obPaymentStatus`、`obPaymentMethod`、`purchasedAt`、`createdAt`。
- `InvoiceAudit`：`auditId`、`invoiceId`、`actor`、`action`、`beforeJson`、`afterJson`、`result`、`detail`、`createdAt`。
- `InvoiceSettings`：`key`、`value`、`updatedBy`、`updatedAt`。

- [ ] **Step 4: 加入獨立權限，不以姓名硬編碼**

將 `invoice_admin` 加入 `MANAGEMENT_CAPABILITIES` 與錯誤訊息標籤。Ivy、Tako 的實際授權沿用既有帳號 Sheet 的 capability 欄位，部署後再由受控設定加入，不在程式碼寫死姓名。

- [ ] **Step 5: 重跑測試並提交**

Run: `node --test --test-name-pattern="invoice schema|invoice capability" tests/backend-core.test.js`

Expected: PASS。

Commit:

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add invoice sheets and admin capability"
```

### Task 2: 實作 OB 購課篩選、分組與可接續同步

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

- [ ] **Step 1: 先寫 OB 邊界與分組的失敗測試**

新增測試覆蓋：

- 2026-09-25 23:59:59 Asia/Taipei 略過，2026-09-26 00:00:00 收錄。
- `paymentStatus` 非 paid、付款方式非銀行轉帳者略過；之後變為 paid 時可於下次同步收錄。
- 同一 `paymentReferenceId` 的多個 pass 合併成一張 queue、多筆 items，總額等於各明細加總。
- OB purchase ID 重複時不新增；缺 `paymentReferenceId`、Email、價格或金額不一致時進 `INVALID`。
- 分頁途中 429 保存游標；下次接續後不重複前頁資料。
- 已開立訂單後續出現退款狀態時只轉為 `REFUND_REVIEW`。

- [ ] **Step 2: 執行測試並確認先失敗**

Run: `node --test --test-name-pattern="invoice OB sync" tests/backend-core.test.js`

Expected: FAIL，因尚無同步器。

- [ ] **Step 3: 實作純資料函式**

在 `Code.gs` 加入：

- `isInvoiceEligiblePurchase_(purchase, cutoffMs)`
- `normalizeObUserPassForInvoice_(listItem, detail)`
- `groupInvoiceCandidates_(items)`
- `validateInvoiceCandidate_(candidate)`

所有日期先解析為明確時間戳，再以 Asia/Taipei 截止點比較；不得以字串或本機時區猜測。

- [ ] **Step 4: 實作有限額的 OB API 讀取與同步**

加入：

- `fetchObUserPassPage_(token, query, fetchImpl)`：每頁最多 100 筆。
- `fetchObUserPassDetail_(token, purchaseId, fetchImpl)`：只在清單缺 `paymentReferenceId` 時補查。
- `syncInvoicePurchases_(sessionToken, options)`：以 `LockService` 防止排程／手動重疊。
- `resumeInvoiceSync_()`：從 `InvoiceSettings` 的游標與待補查 ID 接續。

將 Token 每小時 100 次視為硬上限：每輪保留安全餘量；429、逾時或暫時錯誤只保存游標與摘要，不刪除既有資料。

- [ ] **Step 5: 以唯一鍵最小寫入 Sheets**

建立 `upsertInvoiceCandidate_()`：

- `obPurchaseId` 保證 item 不重複。
- `paymentReferenceId` 保證只有一張有效 queue。
- 先檢查 queue 目前狀態及 `version`，再更新明確列。
- 切換全域預設 Merchant 只套用新建立 queue，不修改既有 queue。
- 每次新增、略過、異常、退款狀態轉換都寫 `InvoiceAudit`，但不寫入機密或完整 OB 原始資料。

- [ ] **Step 6: 重跑測試並提交**

Run: `node --test --test-name-pattern="invoice OB sync" tests/backend-core.test.js`

Expected: PASS。

Commit:

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: sync paid OB transfers into invoice queue"
```

### Task 3: 建立 Gateway 內部 HMAC 驗證與重播防護

**Files:**
- Create: `cloudflare-gateway/src/internal-auth.js`
- Create: `cloudflare-gateway/src/invoice-request-guard.js`
- Create: `cloudflare-gateway/test/internal-auth.test.js`
- Modify: `cloudflare-gateway/src/index.js`
- Modify: `cloudflare-gateway/src/routes.js`
- Modify: `cloudflare-gateway/src/security.js`
- Modify: `cloudflare-gateway/test/routes.test.js`
- Modify: `cloudflare-gateway/wrangler.toml`

- [ ] **Step 1: 先寫內部路由安全失敗測試**

新增 `/internal/ecpay/invoices/issue` 的測試：

- 只有 `POST` 可解析，且標記為 `internal: true`。
- 不驗證瀏覽器 Origin、不加入 CORS、不走 Turnstile 或公開 limiter。
- 缺 header、錯誤 HMAC、過期／未來超過 300 秒的 timestamp、重複 nonce 全部拒絕。
- 有效請求只把通過白名單驗證的 `merchantProfile` 與 invoice payload 交給 ECPay client。
- 任何拒絕回應都不洩漏 secret、簽章、內部 URL 或原始 body。

- [ ] **Step 2: 執行 Gateway 測試並確認先失敗**

Run: `node --test --test-name-pattern="internal invoice|replay" test/*.test.js`

Workdir: `cloudflare-gateway`

Expected: FAIL，因 route、驗簽與 nonce guard 尚不存在。

- [ ] **Step 3: 實作固定的簽章契約**

GAS 與 Worker 共用以下 canonical 規則：

```text
v1\nissueEcpayInvoice\n{timestampSeconds}\n{nonce}\n{base64urlSha256(canonicalJson(body))}
```

Headers 固定為 `X-Sherry-Version`、`X-Sherry-Timestamp`、`X-Sherry-Nonce`、`X-Sherry-Signature`。在 `internal-auth.js` 實作 HMAC-SHA256 驗證、常數時間比較、時間窗與欄位白名單。

- [ ] **Step 4: 以 Durable Object 原子拒絕重播 nonce**

在 `invoice-request-guard.js` 建立 `InvoiceRequestGuard`，由單一固定 instance 序列化 `claim nonce`；nonce 保存 10 分鐘並定期清理。`wrangler.toml` 加入 production／staging 綁定及 SQLite Durable Object migration，`index.js` 匯出 class。

此變更只寫設定檔；建立／部署 Durable Object 是後續需另行允許的外部操作。

- [ ] **Step 5: 讓 internal route 在公開流程之前分流**

修改 `index.js`：internal route 在 `validateOrigin()` 之前完成 body size、HMAC、nonce 與 payload 驗證；公開路由保留原行為及測試，不因發票功能放寬。

- [ ] **Step 6: 重跑測試並提交**

Run: `npm test`

Workdir: `cloudflare-gateway`

Expected: 全部 PASS，包含既有公開頁安全測試。

Commit:

```bash
git add cloudflare-gateway/src cloudflare-gateway/test cloudflare-gateway/wrangler.toml
git commit -m "feat: authenticate internal invoice gateway requests"
```

### Task 4: 在 Gateway 實作綠界 AES 與雙 Merchant 呼叫

**Files:**
- Create: `cloudflare-gateway/src/ecpay-invoice.js`
- Create: `cloudflare-gateway/test/ecpay-invoice.test.js`
- Modify: `cloudflare-gateway/src/index.js`
- Modify: `cloudflare-gateway/.dev.vars.example`
- Modify: `cloudflare-gateway/README.md`

- [ ] **Step 1: 先寫 AES 與綠界回應分流失敗測試**

新增固定向量及假 fetch 測試：

- JSON Data 依綠界規則 URL encode 後，用對應 Merchant HashKey／HashIV 做 AES-CBC 加密；可正確解回原資料。
- `primary`、`secondary` 各自只讀自己的 Worker Secrets，未知 profile 拒絕。
- stage／production endpoint 由非機密環境設定選擇，不接受 request body 指定任意 URL。
- HTTP 200 + `TransCode != 1` 回傳明確 failure。
- `TransCode == 1` 但解密後 `RtnCode != 1` 回傳明確 failure。
- 成功只回傳 `InvoiceNo`、`InvoiceDate`、`RandomNumber`、安全訊息與 gateway trace ID。
- timeout／網路中斷回傳不可判定類型，不包含 MerchantID、key、IV、加密 Data 或上游完整回應。

- [ ] **Step 2: 執行測試並確認先失敗**

Run: `node --test --test-name-pattern="ECPay invoice" test/*.test.js`

Workdir: `cloudflare-gateway`

Expected: FAIL，因尚無 ECPay client。

- [ ] **Step 3: 實作 ECPay payload 加解密與帳號選擇**

在 `ecpay-invoice.js` 實作：

- `resolveMerchantSecrets_(env, merchantProfile)`
- `encryptEcpayData_(payload, hashKey, hashIv)`
- `decryptEcpayData_(encrypted, hashKey, hashIv)`
- `issueEcpayInvoice_(request, env, fetchImpl)`
- `sanitizeEcpayResult_(result)`

使用 Web Crypto AES-CBC，依官方格式送出 `MerchantID`、`RqHeader.Timestamp`、加密 `Data`。任何錯誤物件都先通過安全清理再回 GAS。

- [ ] **Step 4: 接上 internal route**

有效 internal request 才呼叫 `issueEcpayInvoice_()`；gateway response 固定區分：

- `outcome: "issued"`
- `outcome: "rejected"`
- `outcome: "unknown"`

HTTP status 與 outcome 需一致且可被 GAS 判斷；不把網路錯誤一律包成可重試失敗。

- [ ] **Step 5: 補齊本機與部署文件**

`.dev.vars.example` 與 `README.md` 只列 secret 名稱，不填真值：

- `INVOICE_GATEWAY_SECRET`
- `ECPAY_PRIMARY_MERCHANT_ID`、`ECPAY_PRIMARY_HASH_KEY`、`ECPAY_PRIMARY_HASH_IV`
- `ECPAY_SECONDARY_MERCHANT_ID`、`ECPAY_SECONDARY_HASH_KEY`、`ECPAY_SECONDARY_HASH_IV`
- `ECPAY_ENVIRONMENT=stage|production`

文件明確說明 secret 只能透過 `wrangler secret put` 互動輸入，不能 commit。

- [ ] **Step 6: 重跑測試與 Worker dry-run，然後提交**

Run:

```bash
npm test
WRANGLER_LOG_PATH=/private/tmp/sherry-gateway-wrangler.log npm run check -- --env=""
WRANGLER_LOG_PATH=/private/tmp/sherry-gateway-wrangler.log npm run check -- --env=staging
```

Workdir: `cloudflare-gateway`

Expected: 測試 PASS，兩個 dry-run 均成功；不得部署。

Commit:

```bash
git add cloudflare-gateway/src cloudflare-gateway/test cloudflare-gateway/.dev.vars.example cloudflare-gateway/README.md
git commit -m "feat: relay ECPay invoice requests through worker"
```

### Task 5: 實作 GAS 開票 payload、流水號與狀態機

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

- [ ] **Step 1: 先寫 payload 與狀態機失敗測試**

新增測試：

- 個人發票產生 `CarrierType=""`、`Print="0"`、`Donation="0"`、`TaxType="1"`、`InvType="07"`、`vat="1"`。
- 公司發票產生 `CarrierType=""`、`Print="1"`，且缺統編／抬頭／地址任一欄即拒絕。
- 多張課卡產生連續 `ItemSeq`，`ItemCount`、含稅 `ItemPrice`、`ItemAmount` 加總必須等於 `SalesAmount`。
- `YYYYMMDDNNN` 依 Merchant profile 與台北日期分開、在鎖內原子遞增。
- 只有 `PENDING` 或經人工確認可重試的 `FAILED` 能進 `ISSUING`；`ISSUED`、`UNCERTAIN` 不可重送。
- Gateway `issued` → `ISSUED`；`rejected` → `FAILED`；timeout／unknown → `UNCERTAIN`。
- 同一 invoice 的重複點擊或併發請求只會呼叫 Gateway 一次。

- [ ] **Step 2: 執行測試並確認先失敗**

Run: `node --test --test-name-pattern="invoice issue|ECPay payload|invoice sequence" tests/backend-core.test.js`

Expected: FAIL。

- [ ] **Step 3: 實作發票 payload builder**

加入：

- `buildEcpayInvoicePayload_(draft)`
- `buildEcpayInvoiceItems_(items)`
- `validateInvoiceForIssue_(draft, items)`

商品單位預設 `張`；若 OB 明確提供其他單位才使用 OB 值。所有金額先轉為整數並驗證，禁止浮點或字串拼接。

- [ ] **Step 4: 實作 GAS 對 Gateway 的 HMAC client**

加入：

- `canonicalJsonForInvoiceGateway_(value)`
- `signInvoiceGatewayRequest_(action, payload, timestamp, nonce, secret)`
- `callInvoiceGateway_(payload, fetchImpl)`

GAS 只從 Script Properties 讀取 Gateway URL 與 `INVOICE_GATEWAY_SECRET`；不得讀取綠界 Merchant secrets。`UrlFetchApp.fetch` 設定明確 timeout 處理與 `muteHttpExceptions`，只解析白名單欄位。

- [ ] **Step 5: 實作開票狀態機與稽核**

加入：

- `allocateInvoiceRelateNumber_(merchantProfile, taipeiDate)`
- `issueInvoiceDraft_(sessionToken, invoiceId)`
- `issueInvoiceBatch_(sessionToken, invoiceIds)`

流程：後端驗權 → 鎖定 → 依 invoiceId 與 version 重新讀取 → 驗證 → 配號 → 設 `ISSUING` → 釋放 Sheet 寫鎖後呼叫 Gateway → 再鎖定並依結果落狀態與 audit。批次逐筆隔離，公司發票在後端也禁止批次。

- [ ] **Step 6: 重跑測試並提交**

Run: `node --test --test-name-pattern="invoice issue|ECPay payload|invoice sequence" tests/backend-core.test.js`

Expected: PASS。

Commit:

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: issue invoices through authenticated gateway"
```

### Task 6: 加入管理 API、帳號切換、排程與退款追蹤

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

- [ ] **Step 1: 先寫管理操作的失敗測試**

新增測試：

- 每一個發票 action 都在 server-side 呼叫 `requireCapability_(token, 'invoice_admin')`。
- 更新公司資料、逐筆 profile 變更、全域預設 profile 變更皆需 version 檢查及 audit。
- 全域 profile 變更只影響後續新同步資料。
- 每日排程預設 Asia/Taipei 約 00:00，重複安裝不建立多個 trigger。
- 手動同步與排程共用同一同步器及鎖。
- 退款只能標記 `REFUND_REVIEW`／`REFUND_RESOLVED`，不呼叫綠界作廢或折讓 API。

- [ ] **Step 2: 執行測試並確認先失敗**

Run: `node --test --test-name-pattern="invoice admin action|invoice scheduler|invoice refund" tests/backend-core.test.js`

Expected: FAIL。

- [ ] **Step 3: 加入管理 dashboard 與修改 action**

新增：

- `getInvoiceAdminDashboard_()`
- `updateInvoiceDraft_()`
- `setDefaultInvoiceMerchant_()`
- `resolveInvoiceRefund_()`
- `runScheduledInvoiceSync()`
- `installInvoiceSyncScheduler()`

將對應 action 加入 `doPost` handler map；所有 action 先驗 `invoice_admin`，且回應只包含頁面需要的安全欄位。

- [ ] **Step 4: 實作排程設定**

預設建立 `atHour(0).nearMinute(0).everyDays(1).inTimezone('Asia/Taipei')`。管理頁顯示「每日約 00:00」，因 Apps Script 時間型 trigger 可能在指定分鐘前後執行；待 Tako 確認後，只修改 `InvoiceSettings` 的設定及重新安裝單一 trigger。

- [ ] **Step 5: 重跑測試並提交**

Run: `node --test --test-name-pattern="invoice admin action|invoice scheduler|invoice refund" tests/backend-core.test.js`

Expected: PASS。

Commit:

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add invoice admin actions and scheduler"
```

### Task 7: 在既有工作台加入發票管理 UI

**Files:**
- Modify: `index.html`
- Modify: `tests/frontend-contract.test.js`

- [ ] **Step 1: 先寫 UI 契約失敗測試**

新增測試鎖定：

- `invoice_admin` 才看得到「發票管理」section。
- 分頁包含待開立、資料異常、已開立、退款待處理、操作紀錄。
- 上方顯示預設開票帳號、上次同步、每日約 00:00 排程與「立即同步 OB」。
- 公司發票表單包含統編、抬頭、地址；頁面沒有載具欄位。
- 批次開立只會收集資料完整的個人 `PENDING` 發票。
- 開票前確認 modal 顯示帳號／統編、付款參考編號、Email、商品明細與總額。
- `UNCERTAIN` 不顯示直接重試；顯示「先至綠界查詢」。
- 前端沒有 Merchant secret 名稱、值或任意指定 Gateway URL 的輸入。

- [ ] **Step 2: 執行測試並確認先失敗**

Run: `node --test --test-name-pattern="invoice admin" tests/frontend-contract.test.js`

Expected: FAIL。

- [ ] **Step 3: 新增 section、route 與安全資料載入**

在既有 `data-admin-section`、`ADMIN_TAB_SECTIONS`、`ADMIN_SECTION_DEFAULT_TABS` 架構加入 `invoices`，使用 `data-capability="invoice_admin"`。切換頁籤時才載入 dashboard，沿用既有 session 與錯誤顯示。

- [ ] **Step 4: 實作 queue、表單與確認流程**

加入：

- 狀態篩選與分頁。
- 手動同步進度與 429 接續提示。
- 每筆 Merchant profile 選擇。
- 個人／公司發票切換與公司欄位驗證。
- 單筆開立與個人批次開立確認視窗。
- `FAILED`、`UNCERTAIN`、退款人工處理的不同操作提示。
- 所有成功／失敗 toast 使用實際後端結果，不預先顯示成功。

- [ ] **Step 5: 行動版與鍵盤操作檢查**

確認窄螢幕卡片不橫向溢出、表單 label 可讀、確認視窗可捲動、按鈕有 disabled/busy 狀態，且不以顏色作為唯一狀態提示。

- [ ] **Step 6: 重跑測試並提交**

Run: `node --test --test-name-pattern="invoice admin" tests/frontend-contract.test.js`

Expected: PASS。

Commit:

```bash
git add index.html tests/frontend-contract.test.js
git commit -m "feat: add invoice management workbench"
```

### Task 8: 全面回歸、設定說明與受控上線檢核

**Files:**
- Modify: `README.md`
- Modify: `cloudflare-gateway/README.md`
- Modify: `docs/superpowers/plans/2026-09-26-ob-ecpay-invoice-integration.md`（勾選實際完成項目與記錄結果）

- [x] **Step 1: 執行 GAS／前端完整測試**

Run:

```bash
node --test tests/*.test.js
```

Expected: 全部 PASS；若目前 branch 本來就有不相關失敗，先記錄基線並證明本次沒有新增失敗，不可擅自修其他功能。

- [x] **Step 2: 執行 Gateway 完整測試與 dry-run**

Run:

```bash
npm test
WRANGLER_LOG_PATH=/private/tmp/sherry-gateway-wrangler.log npm run check -- --env=""
WRANGLER_LOG_PATH=/private/tmp/sherry-gateway-wrangler.log npm run check -- --env=staging
```

Workdir: `cloudflare-gateway`

Expected: 全部 PASS，只有打包與假資料，不連正式綠界或 GAS。

- [x] **Step 3: 進行五項 review focus 專項檢查**

逐項記錄 Review Focus 1–5 的測試名稱、輸入、預期與實際結果。特別用故障注入模擬「綠界接受後連線中斷」，確認 queue 只能變成 `UNCERTAIN`。

- [x] **Step 4: 文件化受控設定步驟**

在 README 加入但不執行：

1. 建立 staging Durable Object binding。
2. 互動設定 staging Gateway secret 與兩組綠界測試 Merchant secrets。
3. 在 GAS staging Script Properties 設定 Gateway URL／shared secret。
4. 在測試帳號 capability 加入 `invoice_admin`。
5. 使用假 OB 回應建立待開立資料。
6. 安裝每日約 00:00 trigger。
7. 驗證完 staging 後才規劃 production secrets、GAS 部署與 trigger。

每一步都標示「需另行取得使用者允許」，並附回復方式；不可把 secret 範例值寫入 Git。

- [x] **Step 5: 停在 staging 部署核准點**

向使用者報告：

- 測試總數與結果。
- 變更 commits。
- 預計建立的四張 Sheet 與不會改動的既有 Sheet。
- Cloudflare staging 會新增的 internal route、Durable Object 與 secrets 名稱。
- 尚未執行的外部寫入／部署。

取得明確允許後，才依序部署 Gateway staging、GAS staging 並做假資料 smoke test。

- [ ] **Step 6: 沙箱驗證後停在單筆正式開票核准點**

沙箱需驗證個人、多品項、公司統編與錯誤情境。全部通過後，仍需使用者指定一筆真實訂單並再次明確允許，才能切到正式環境做單筆測試；單筆成功後才另行討論開放批次，永不把一次部署允許解讀成大量開票允許。

- [x] **Step 7: 提交文件更新（不 push、不 deploy）**

```bash
git add README.md cloudflare-gateway/README.md docs/superpowers/plans/2026-09-26-ob-ecpay-invoice-integration.md
git commit -m "docs: add invoice integration operations runbook"
```

### Task 8 實際驗證結果（2026-09-26）

- GAS／前端完整測試首次為 769/770；唯一失敗是新增發票分頁後，VVIP 測試仍把管理分頁總數寫死為 15。將同一份測試契約更新為 16 後，最終完整回歸為 770/770 通過。
- Gateway：`npm test` 為 32/32 通過；production 與 staging 的 Wrangler dry-run 都通過，只打包假資料，未部署、未連 GAS、未連綠界。
- Review Focus 1：`invoice OB sync saves a 429 cursor and resumes without duplicating the completed purchase`。輸入為同一付款參考編號的兩筆商品，第二筆 detail 回 429；預期保存 `{start:0,itemIndex:1}` 並從第二筆續跑、不重抓第一筆；實際通過，queue 保持一筆、items 為兩筆、總額 3000。
- Review Focus 2：`invoice issue changes transport exceptions to uncertain and prevents recursive duplicate calls` 與 `invoice issue blocks issued uncertain and unconfirmed failed drafts before gateway access`。輸入為送出中的重複呼叫及已為 `ISSUED`／`UNCERTAIN`／未確認 `FAILED` 的草稿；預期 Gateway 最多呼叫一次且終態不可重送；實際通過。
- Review Focus 3：`ECPay invoice separates transport and business rejection outcomes`。輸入為 HTTP 200 但外層 `TransCode=0`，以及外層成功但解密後 `RtnCode=999999`；預期兩者皆明確 `rejected`，由 GAS 落到 `FAILED`；實際通過且未洩漏密文／Merchant 資料。
- Review Focus 4：`invoice issue changes transport exceptions to uncertain and prevents recursive duplicate calls`。故障注入在請求送出後拋出 `timeout after send`，模擬綠界可能已接受但連線中斷；預期 queue 只能變 `UNCERTAIN`、Gateway 呼叫一次且禁止重送；實際通過。
- Review Focus 5：`ECPay payload builds one personal invoice with fixed tax flags and consecutive items` 與 `ECPay payload requires complete business identity and emits print notation`。輸入為個人多品項，以及缺統編／抬頭／地址的公司草稿；預期個人 `Print="0"`、連續 `ItemSeq`、合計相符，公司缺任一欄即拒絕且完整時 `Print="1"`；實際通過。
- 目前停在 staging 部署核准點。尚未部署 Worker／GAS、未設定 secret／Script Properties、未建立正式 Sheet、未授予正式 capability、未安裝 trigger、未寫入正式 OB／Sheets，也未開立任何發票。

### 完成前安全審查補強（2026-09-26）

- 公司統編由「僅 8 碼」加強為台灣統一編號檢查碼驗證，GAS 與 Gateway 雙層拒絕無效統編；測試使用有效統編 `04595252`，並確認 `12345678` 被拒絕。
- 同一付款參考編號若在 queue 出現多列，OB 同步會停止並要求人工排除，不會任選第一列寫入。
- 真實 trigger 已不存在時，即使殘留舊安裝時間，工作台仍正確顯示「未安裝」。
- `ISSUING` 超過 10 分鐘會在管理員讀取發票頁時安全轉為 `UNCERTAIN`、留下 audit 並要求先查綠界，不會自動重送。
- Gateway `/health` 新增 `invoiceConfigured` 布林值，只有內部 shared secret、兩組 Merchant 設定、環境與 Durable Object replay guard 全部齊備時才為 `true`。
- 補強後最終完整回歸：GAS／前端 773/773、Gateway 33/33；production 與 staging Wrangler dry-run 皆通過，仍未部署或寫入任何外部資料。

## 完成定義

- 所有自動測試、Gateway dry-run 與五項 review focus 均通過。
- 管理頁同步只建立 queue，不會自動開票。
- 未授權帳號無法讀取或執行任何發票 action。
- 兩組 Merchant secrets 只存在 Cloudflare Worker Secrets，且不交叉使用。
- 每筆開票在 Sheets 中有唯一 queue、明細、狀態與 audit；不確定結果不可重送。
- 個人與公司發票欄位、`Print` 規則、含稅 5%、多品項合計皆正確。
- 退款只進人工待處理，不自動作廢或折讓。
- 正式部署、Trigger、Sheet 建立、權限授予及真實開票都保留為個別明確核准步驟。
