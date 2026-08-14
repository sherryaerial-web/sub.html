# 特別課名稱範例文字 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將老師端「特別課名稱」輸入框範例改為「舞綢中軸特別課、椅子瑜伽特別課」。

**Architecture:** 沿用現有單頁前端結構，只修改 `index.html` 的 placeholder。以既有前端契約測試確認新文案存在，並保留欄位名稱與必填驗證。

**Tech Stack:** HTML、JavaScript、Node.js `node:test`

## Global Constraints

- 欄位名稱仍為「特別課名稱」。
- 欄位維持必填。
- 輸入框範例必須是「例如：舞綢中軸特別課、椅子瑜伽特別課」。
- 不修改 Apps Script、Google Sheet 或資料格式。

---

### Task 1: 修改特別課名稱範例

**Files:**
- Modify: `index.html:1026`
- Test: `tests/frontend-contract.test.js:663`

**Interfaces:**
- Consumes: 現有 `#special-course-name` 文字輸入欄位與前端 HTML 契約測試。
- Produces: placeholder 為 `例如：舞綢中軸特別課、椅子瑜伽特別課` 的必填文字欄位。

- [ ] **Step 1: 寫入會失敗的文案測試**

在既有特別課流程測試加入：

```js
assert.match(html, /placeholder="例如：舞綢中軸特別課、椅子瑜伽特別課"/);
```

- [ ] **Step 2: 執行指定測試並確認失敗**

Run: `node --test --test-name-pattern='separates ordinary substitute handling from the special-course flow' tests/frontend-contract.test.js`

Expected: FAIL，因為目前 placeholder 仍為 `例如：主題編舞、特別課內容概述`。

- [ ] **Step 3: 修改最小前端文案**

將 `#special-course-name` 改為：

```html
<input id="special-course-name" class="claim-control" type="text" maxlength="80" placeholder="例如：舞綢中軸特別課、椅子瑜伽特別課">
```

- [ ] **Step 4: 執行指定測試並確認通過**

Run: `node --test --test-name-pattern='separates ordinary substitute handling from the special-course flow' tests/frontend-contract.test.js`

Expected: PASS。

- [ ] **Step 5: 執行完整前端契約測試**

Run: `node --test tests/frontend-contract.test.js`

Expected: 全部 PASS，0 failures。

- [ ] **Step 6: 檢查並提交**

```bash
git diff --check
git add index.html tests/frontend-contract.test.js
git commit -m "fix: clarify special course name example"
```
