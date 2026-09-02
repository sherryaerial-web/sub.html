# 一般代課延後自動占用顯示修正 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一般代課延後 15 或 30 分鐘而占用下一堂時，下一堂立即比照特別課顯示為不可選的「系統自動占用」，並且不會進入送出項目。

**Architecture:** 保留既有 `buildOrdinaryDelayPreview()` 與後端鎖定驗證，新增一個純前端選擇約束同步函式。它會先重設上一輪普通模式標記，再從目前已勾選卡片的預覽收集被占用代課編號，最後取消勾選、停用與標記下一堂；事件處理與模式重新渲染都呼叫同一函式。

**Tech Stack:** 單檔 HTML/CSS/JavaScript、Node.js `node:test`、GitHub Pages

## Global Constraints

- 只修改 `index.html`、`tests/frontend-contract.test.js` 與本計畫文件。
- 不修改 `Code.gs`、GAS deployment 或正式 Google Sheet。
- 下一堂恢復可選時不得自動重新勾選。
- 後端仍是占用與送出驗證的最終權威。

---

### Task 1: 以回歸測試固定一般代課自動占用契約

**Files:**
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: `buildOrdinaryDelayPreview(target, startDelayMinutes, availabilityMap, pendingItems)`
- Produces: `updateOrdinarySelectionConstraints()` 的 DOM 行為契約

- [ ] **Step 1: 寫入會失敗的 DOM 回歸測試**

新增 `ordinary delayed claim marks the next course as system occupied before submit`，建立兩張一般代課卡片 mock：原堂已勾選且選擇延後 30 分鐘，下一堂原先也已勾選。載入含 `mergePartnerIds: ['leave-next']` 的 `specialAvailability` 後呼叫：

```js
context.updateOrdinarySelectionConstraints();

assert.equal(source.checkbox.checked, true);
assert.equal(next.checkbox.checked, false);
assert.equal(next.checkbox.disabled, true);
assert.equal(next.editor.hidden, true);
assert.equal(next.warning.hidden, false);
assert.equal(next.warning.textContent, '系統自動占用');
assert.equal(next.classes.has('ordinary-auto-occupied'), true);
assert.equal(dateCount.textContent, '1 堂待領');
assert.deepEqual(JSON.parse(JSON.stringify(context.getSelectedClaimIds())), ['leave-source']);
```

接著把原堂延後改回 `0`，再次呼叫同步函式並驗證下一堂恢復可選、移除標記、維持未勾選：

```js
source.delay.value = '0';
context.updateOrdinarySelectionConstraints();

assert.equal(next.checkbox.disabled, false);
assert.equal(next.checkbox.checked, false);
assert.equal(next.warning.hidden, true);
assert.equal(next.classes.has('ordinary-auto-occupied'), false);
assert.equal(dateCount.textContent, '2 堂待領');
```

- [ ] **Step 2: 執行測試並確認正確失敗**

Run: `node --test --test-name-pattern='ordinary delayed claim marks the next course' tests/frontend-contract.test.js`

Expected: FAIL，原因為 `context.updateOrdinarySelectionConstraints is not a function`。

- [ ] **Step 3: 提交測試紅燈**

```bash
git add tests/frontend-contract.test.js
git commit -m "test: cover ordinary delay auto occupancy UI"
```

### Task 2: 實作一般代課自動占用同步

**Files:**
- Modify: `index.html`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: `.claim-checkbox`、`.claim-card`、`.special-slot-warning`、`pendingLeaves`、`claimOptions.specialAvailability`
- Produces: `updateOrdinarySelectionConstraints(): void`

- [ ] **Step 1: 新增共用的占用視覺樣式**

在 claim card 樣式區加入：

```css
.claim-card.special-auto-occupied,
.claim-card.ordinary-auto-occupied { background: var(--soft); opacity: 0.68; }
```

- [ ] **Step 2: 實作最小同步函式**

在 `updateOrdinaryClaimDelaySummary()` 後新增 `updateOrdinarySelectionConstraints()`：

```js
function updateOrdinarySelectionConstraints() {
  const ordinary = (document.querySelector('input[name="claim-mode"]:checked')?.value || "ordinary") === "ordinary";
  if (!ordinary) return;
  const checkboxes = [...document.querySelectorAll(".claim-checkbox")];
  checkboxes.forEach((checkbox) => {
    checkbox.disabled = false;
    checkbox.removeAttribute("title");
    const card = checkbox.closest(".claim-card");
    card?.classList.remove("ordinary-auto-occupied");
    const warning = card?.querySelector(".special-slot-warning");
    if (warning) {
      warning.hidden = true;
      warning.textContent = "";
    }
  });
  const occupiedIds = new Set();
  checkboxes.filter((checkbox) => checkbox.checked).forEach((checkbox) => {
    if (occupiedIds.has(checkbox.dataset.substituteId)) return;
    const card = checkbox.closest(".claim-card");
    if (card?.querySelector('input[type="radio"]:checked')?.value !== "existing") return;
    const target = pendingLeaves.find((item) => item["代課編號"] === checkbox.dataset.substituteId);
    if (!target) return;
    try {
      const preview = buildOrdinaryDelayPreview(
        target,
        card.querySelector(".claim-start-delay")?.value || 0,
        claimOptions.specialAvailability || {},
        pendingLeaves
      );
      if (!preview.blocked && preview.occupiedSubstituteId) occupiedIds.add(preview.occupiedSubstituteId);
    } catch (error) {
      // 延後摘要與送出按鈕會顯示或阻擋無效狀態。
    }
  });

  occupiedIds.forEach((substituteId) => {
    const checkbox = checkboxes.find((item) => item.dataset.substituteId === substituteId);
    if (!checkbox) return;
    checkbox.checked = false;
    checkbox.disabled = true;
    checkbox.title = "系統自動占用";
    const card = checkbox.closest(".claim-card");
    card?.classList.add("ordinary-auto-occupied");
    const editor = card?.querySelector(".claim-editor");
    if (editor) editor.hidden = true;
    const warning = card?.querySelector(".special-slot-warning");
    if (warning) {
      warning.hidden = false;
      warning.textContent = "系統自動占用";
    }
  });
  document.querySelectorAll(".claim-date-group").forEach((group) => {
    const count = [...group.querySelectorAll(".claim-checkbox")].filter((checkbox) => !checkbox.disabled).length;
    const label = group.querySelector(".claim-date-count");
    if (label) label.textContent = `${count} 堂待領`;
  });
  syncOrdinaryClaimSubmitState();
}
```

- [ ] **Step 3: 把同步函式接入一般模式事件與重繪**

在 `handleClaimEditorChange()` 的一般模式分支呼叫 `updateOrdinarySelectionConstraints()`；在 `updateClaimMode()` 完成卡片狀態同步後也呼叫它，確保初次渲染、切換模式與重新整理都會清除過期標記。

- [ ] **Step 4: 執行聚焦測試並確認通過**

Run: `node --test --test-name-pattern='ordinary delayed claim marks the next course|ordinary delay preview|delayed claim submits' tests/frontend-contract.test.js`

Expected: PASS。

- [ ] **Step 5: 提交實作**

```bash
git add index.html tests/frontend-contract.test.js
git commit -m "fix: mark delayed next course as occupied"
```

### Task 3: 完整驗證與正式前端推送

**Files:**
- Verify: `index.html`
- Verify: `tests/*.test.js`

**Interfaces:**
- Consumes: Task 1 與 Task 2 的提交
- Produces: 可直接由 GitHub Pages 發布的 main commit

- [ ] **Step 1: 執行靜態與完整自動測試**

```bash
git diff origin/main --check
node --test tests/*.test.js
```

Expected: diff 無空白錯誤；所有既有與新增測試通過。

- [ ] **Step 2: 確認發布範圍不含後端與資料檔**

Run: `git diff --name-only origin/main...HEAD`

Expected: 只有 `index.html`、`tests/frontend-contract.test.js` 與 `docs/superpowers/` 文件，不含 `Code.gs` 或任何 Sheet 匯出資料。

- [ ] **Step 3: 快轉整合到 main 並推送 GitHub Pages**

```bash
git push origin fix/ordinary-delay-auto-occupancy-ui:main
```

- [ ] **Step 4: 驗證正式網站已載入新契約**

重新讀取 `https://sherryaerial-web.github.io/sub.html/` 的 HTML，確認含 `updateOrdinarySelectionConstraints`、`ordinary-auto-occupied` 與 `系統自動占用`；不呼叫任何 GAS 寫入 action。
