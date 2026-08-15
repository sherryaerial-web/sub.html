# 領代課選單排除期班 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 所有名稱含「期班」的課程不再出現在老師調整代課的課程類型選單。

**Architecture:** 後端從 recurring claim catalog 的來源排除期班，讓 API 與送出驗證共用同一規則；前端在顯示 API classes 前再做同規則防呆。原始 CourseList、待領代課卡片與直接沿用原課程流程不變。

**Tech Stack:** Google Apps Script、Google Sheets、HTML/JavaScript、Node.js `node:test`

## Global Constraints

- 不刪除或修改正式 `CourseList`、`請假代課紀錄` 或任何老師人工資料。
- 只排除調整課程的選項；期班原堂若成為待領代課，仍可顯示並由具備類別權限的老師直接沿用。
- 後端必須拒絕不在最新 recurring catalog 的期班選項，前端過濾不是唯一防線。

---

### Task 1: 以失敗測試重現期班進入 catalog 與下拉選單

**Files:**
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: `buildRecurringClaimCourseOptions_(courseRows, capabilities)`、`getClaimCourseTypes()`、`findSelectedClaimClass(courseTypeKey, difficulty)`
- Produces: 期班必須在後端與前端都不可選的行為契約

- [ ] **Step 1: 擴充後端 recurring catalog 測試**

在既有 recurring catalog 測試資料加入兩筆同星期、同時段的期班：

```js
['2026/08/01', '14:00', 'C－空環 Lv.3 技巧訓練期班', '老師甲', 'cal-term-1', 'class-term-c'],
['2026/08/08', '14:00', 'C－空環 Lv.3 技巧訓練期班', '老師甲', 'cal-term-2', 'class-term-c'],
```

把 capabilities 加入 `空環`，但預期 options 仍只有原始瑜伽與綢吊，不包含任何 `courseName` 含「期班」的項目。

- [ ] **Step 2: 新增前端 API 防呆測試**

新增 `teacher claim course types exclude period courses from stale API options`，讓 `getClaimOptions.classes` 同時包含 `空環` 與 `空環 技巧訓練期班`，載入後驗證：

```js
assert.deepEqual(
  JSON.parse(JSON.stringify(context.getClaimCourseTypes())),
  [{ courseTypeKey: '空環', courseTypeName: '空環', difficulty: '' }],
);
assert.equal(context.findSelectedClaimClass('空環 技巧訓練期班', ''), null);
```

- [ ] **Step 3: 執行聚焦測試並確認紅燈**

```bash
node --test --test-name-pattern='recurring claim catalog|period courses' tests/backend-core.test.js tests/frontend-contract.test.js
```

Expected: 後端 options 多出期班，前端 types 也多出期班，兩個測試因實際值不符而失敗。

- [ ] **Step 4: 提交紅燈測試**

```bash
git add tests/backend-core.test.js tests/frontend-contract.test.js
git commit -m "test: cover term course claim options"
```

### Task 2: 在後端來源與前端顯示排除期班

**Files:**
- Modify: `Code.gs`
- Modify: `index.html`
- Test: `tests/backend-core.test.js`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: CourseList 課名與 `claimOptions.classes`
- Produces: `isTermCourseName_(courseName): boolean`、`isTermClaimCourse(option): boolean`

- [ ] **Step 1: 新增後端單一判斷並套用 catalog**

在 recurring catalog 附近加入：

```js
function isTermCourseName_(courseName) {
  return cleanText_(courseName).indexOf('期班') !== -1;
}
```

把候選課程的既有排除條件改為：

```js
!allowed[category] || /特別課|場地租借/.test(courseName) || isTermCourseName_(courseName)
```

- [ ] **Step 2: 新增前端防呆並套用可教授清單**

在 `getTeachableClaimClasses()` 前加入：

```js
function isTermClaimCourse(option) {
  const values = [option?.courseName, option?.courseTypeName, option?.courseTypeKey];
  return values.some((value) => String(value || '').includes('期班'));
}
```

並把 classes filter 改成：

```js
return (claimOptions.classes || []).filter((item) =>
  capabilities.has(item.category) && !isTermClaimCourse(item)
);
```

- [ ] **Step 3: 執行聚焦測試並確認綠燈**

```bash
node --test --test-name-pattern='recurring claim catalog|period courses' tests/backend-core.test.js tests/frontend-contract.test.js
```

Expected: 兩個測試通過，既有常態課與綢吊 90 分鐘課仍保留。

- [ ] **Step 4: 提交實作**

```bash
git add Code.gs index.html tests/backend-core.test.js tests/frontend-contract.test.js
git commit -m "fix: exclude term courses from claim options"
```

### Task 3: 完整驗證與正式發布

**Files:**
- Verify: `Code.gs`
- Verify: `index.html`
- Verify: `tests/*.test.js`

**Interfaces:**
- Consumes: Task 1 與 Task 2 提交
- Produces: 新 GAS Web App version 與 GitHub Pages main commit

- [ ] **Step 1: 執行完整測試與 GAS 語法檢查**

```bash
node --test tests/*.test.js
cp Code.gs /private/tmp/substitute-v2-code.js
node --check /private/tmp/substitute-v2-code.js
git diff origin/main --check
```

- [ ] **Step 2: 確認發布差異不含資料檔**

Run: `git diff --name-only origin/main...HEAD`

Expected: 只有 `Code.gs`、`index.html`、兩個測試與 `docs/superpowers/` 文件。

- [ ] **Step 3: 發布 GAS 與 GitHub Pages**

```bash
clasp push --force
clasp version "排除期班代課選項"
clasp deploy --deploymentId <正式 deployment id> --versionNumber <新版本號> --description "排除期班代課選項"
git push origin fix/hide-term-course-options:main
```

- [ ] **Step 4: 唯讀驗證正式版本**

確認正式 GitHub Pages HTML 含 `isTermClaimCourse`，正式 GAS deployment 指向新版本；不呼叫領課或任何 Sheet 寫入 action。
