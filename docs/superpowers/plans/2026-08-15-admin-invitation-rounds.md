# 管理頁老師邀請輪次 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將管理頁老師清單改為固定 32 人、每 5 人一輪，支援整排勾選並保留邀請中老師的位置。

**Architecture:** 在 `index.html` 建立前端固定輪次與排除名單，將後端回傳的老師與邀請中狀態合併後渲染。整排按鈕只操作該輪未停用的 checkbox；後端邀請 API 與正式資料結構不變。

**Tech Stack:** 單檔 HTML/CSS/JavaScript、Node.js `node:test`、Playwright 視覺檢查

## Global Constraints

- 固定名單共 32 位，每 5 位一輪，最後一輪 2 位。
- 排除冠蓉、狗狗 陳、Lydia 慕恩、尚昀 陳、Angela。
- 邀請中的老師保留在原輪次並停用。
- 新增且未被排除的未知老師放入「其他老師」。
- 不修改 GAS、Google Sheets 或邀請 API。

---

### Task 1: 建立固定輪次資料模型

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `data.teachers: string[]`、`data.activeInvitees: { teacherName: string }[]`
- Produces: `buildAdminInvitationRounds(teachers, activeInvitees)`，回傳 `{ label, teachers: { name, invited }[] }[]`

- [ ] **Step 1: 先寫失敗測試**

測試 32 人固定順序、五人分輪、排除五位、邀請中仍保留，以及未知老師進入「其他老師」。

- [ ] **Step 2: 執行測試並確認失敗**

Run: `node --test --test-name-pattern='admin invitation rounds' tests/frontend-contract.test.js`

Expected: FAIL，因 `buildAdminInvitationRounds` 尚不存在。

- [ ] **Step 3: 實作最小資料模型**

在 `index.html` 加入固定順序與排除集合，合併老師及邀請中姓名後建立輪次：

```js
function buildAdminInvitationRounds(teachers, activeInvitees) {
  // 固定名單依表格順序分組，每組最多五人；未知有效老師另列。
}
```

- [ ] **Step 4: 重跑聚焦測試**

Run: `node --test --test-name-pattern='admin invitation rounds' tests/frontend-contract.test.js`

Expected: PASS。

---

### Task 2: 渲染輪次與整排勾選

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `tests/morandi-visual-contract.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `buildAdminInvitationRounds(...)`
- Produces: `renderAdminInvitationRounds(...)`、`toggleAdminTeacherRound(button)`

- [ ] **Step 1: 先寫渲染與互動失敗測試**

測試每輪標題、邀請中標記、disabled checkbox、`data-admin-action="toggle-teacher-round"`，以及桌面五欄與手機安全換行 CSS。

- [ ] **Step 2: 執行測試並確認失敗**

Run: `node --test tests/frontend-contract.test.js tests/morandi-visual-contract.test.js`

Expected: FAIL，因輪次 HTML、CSS 與互動尚未加入。

- [ ] **Step 3: 實作輪次畫面與整排切換**

以輪次卡片取代 `.teacher-picker` 單一清單；點「勾選本排」時只勾選該卡片中未停用的老師，全選後改為「取消本排」。

```js
function toggleAdminTeacherRound(button) {
  const round = button.closest('.teacher-round');
  const inputs = [...round.querySelectorAll('.admin-teacher-checkbox:not(:disabled)')];
  const shouldCheck = inputs.some((input) => !input.checked);
  inputs.forEach((input) => { input.checked = shouldCheck; });
  button.textContent = shouldCheck ? '取消本排' : '勾選本排';
}
```

- [ ] **Step 4: 重跑前端與視覺契約測試**

Run: `node --test tests/frontend-contract.test.js tests/morandi-visual-contract.test.js`

Expected: PASS。

---

### Task 3: 完整驗證與發布

**Files:**
- Verify: `index.html`
- Verify: `tests/frontend-contract.test.js`
- Verify: `tests/morandi-visual-contract.test.js`

**Interfaces:**
- Consumes: 完成後的前端工作樹
- Produces: GitHub Pages 正式版本

- [ ] **Step 1: 執行完整測試**

Run: `node --test tests/backend-core.test.js tests/frontend-contract.test.js tests/morandi-visual-contract.test.js tests/vvip-frontend.test.js`

Expected: 全部 PASS。

- [ ] **Step 2: 檢查桌面與手機畫面**

Run: `VISUAL_SCOPE=admin-header node tests/visual-check.mjs`

Expected: 每輪界線清楚、桌面五位同排、手機不破框，邀請中狀態可辨識。

- [ ] **Step 3: 確認資料層未變動**

Run: `git diff --name-only`

Expected: 不包含 `Code.gs` 或任何正式資料檔。

- [ ] **Step 4: 提交並推送**

```bash
git add index.html tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
git commit -m "feat: group admin teacher invitations into rounds"
git push origin main
```

- [ ] **Step 5: 驗證 GitHub Pages**

確認 Pages workflow 成功，並核對公開 `index.html` 含輪次結構與整排勾選功能。
