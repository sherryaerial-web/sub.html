# Invitation Actions at Top Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將管理頁「開放給勾選老師」與「複製 LINE 邀請文字」移到邀請老師名單上方，讓管理員不必捲到頁底操作。

**Architecture:** 保留既有按鈕、事件屬性與 API，只調整 `inviteTeacherPanel` 樣板中的 DOM 順序。以現有前端契約測試鎖定按鈕列必須出現在老師輪次之前，並確認兩種操作各只出現一次。

**Tech Stack:** 單檔 HTML/CSS/vanilla JavaScript、Node.js `node:test`、Playwright 視覺檢查

## Global Constraints

- 按鈕列位於「可邀請／邀請中」人數摘要下方、第一輪老師上方。
- 移除名單底部原按鈕列，避免同一操作重複出現。
- 保留 `data-admin-action="open-invitations"` 與 `data-admin-action="copy-invitation"`。
- 不修改 GAS、Google Sheet、欄位索引、邀請資料或正式部署。
- 正式推送 main 前必須取得使用者明確允許。

---

### Task 1: 將邀請操作列移到老師輪次上方

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `index.html:3118-3131`

**Interfaces:**
- Consumes: `renderAdminInvitationRounds(data.teachers, data.activeInvitees)` 回傳的老師輪次 HTML。
- Produces: `inviteTeacherPanel` 中唯一一組 `open-invitations` 與 `copy-invitation` 操作，且位於老師輪次之前。

- [x] **Step 1: 寫入失敗的前端契約測試**

新增一個以真實 `renderAdminTab()` 輸出驗證順序的測試：

```js
test('pending invitation actions render above teacher rounds without duplicates', async () => {
  const { context, getElement } = createFrontendRuntime({
    getAdminDashboard: {
      leavePaused: false,
      pendingInvitations: [{
        date: '2026/09/01', time: '10:00', originalCourse: '空環',
        originalTeacher: '老師甲', substituteTeacher: '', status: '確認中',
        changeStatus: '', auditHistory: [],
      }],
      activeInvitees: [], obWork: [], changeRequests: [], exceptions: [], completed: [],
      teachers: ['老師乙'], replacementOptions: [],
    },
  });

  await context.fetchAdminDashboard();
  const rendered = getElement('admin-tab-content').innerHTML;
  const actionsIndex = rendered.indexOf('data-admin-action="open-invitations"');
  const roundsIndex = rendered.indexOf('class="teacher-rounds"');
  assert.ok(actionsIndex >= 0, 'invitation actions should exist');
  assert.ok(actionsIndex < roundsIndex, 'invitation actions should render before teacher rounds');
  assert.equal((rendered.match(/data-admin-action="open-invitations"/g) || []).length, 1);
  assert.equal((rendered.match(/data-admin-action="copy-invitation"/g) || []).length, 1);
});
```

- [x] **Step 2: 執行測試並確認 RED**

Run:

```bash
node --test --test-name-pattern='pending invitation actions render above' tests/frontend-contract.test.js
```

Expected: FAIL，訊息為 `invitation actions should render before teacher rounds`，因目前操作列位於所有老師輪次之後。

- [x] **Step 3: 做最小 DOM 順序修改**

將 `inviteTeacherPanel` 的 body 改為：

```html
<div class="invite-teacher-body">
  <div class="admin-item-actions">
    <button class="compact-button" type="button" data-admin-action="open-invitations"><i data-lucide="send"></i>開放給勾選老師</button>
    <button class="compact-button" type="button" data-admin-action="copy-invitation"><i data-lucide="copy"></i>複製 LINE 邀請文字</button>
  </div>
  ${renderAdminInvitationRounds(data.teachers, data.activeInvitees)}
</div>
```

不得保留老師輪次下方的第二組操作列，也不得更動事件屬性。

- [x] **Step 4: 執行相關契約測試並確認 GREEN**

Run:

```bash
node --test --test-name-pattern='admin invitation rounds|pending invitation queue' tests/frontend-contract.test.js
node --test tests/morandi-visual-contract.test.js
```

Expected: 所有相關測試 PASS。

- [x] **Step 5: 執行桌機與手機管理頁視覺檢查**

Run:

```bash
VISUAL_SCOPE=admin-header node tests/visual-check.mjs
```

Expected: 桌機與手機畫面中，兩個操作按鈕出現在第一輪老師之前，沒有水平溢出或控制項裁切。

- [x] **Step 6: 檢查差異並本機提交**

Run:

```bash
git diff --check
git diff -- index.html tests/frontend-contract.test.js
git add index.html tests/frontend-contract.test.js
git commit -m "fix: move invitation actions above teacher rounds"
```

Expected: 只修改 `index.html` 與 `tests/frontend-contract.test.js`；不推送、不部署、不讀寫正式 Sheet。
