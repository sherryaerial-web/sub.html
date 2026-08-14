# Discount Course Type Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將課名尾端有無「優惠」標記的課程合併為相同課程類型，同時保留實際 OB 課程綁定資料。

**Architecture:** 在前端 `parseClaimCourseOption` 與後端 `parseClaimCourseOption_` 的既有課名解析管線加入相同的尾端標記正規化。只改衍生出的課程類型名稱與 key，不改原始課程資料或認領寫入流程。

**Tech Stack:** HTML/JavaScript、Google Apps Script、Node.js `node:test`

## Global Constraints

- 不修改正式 Google Sheet 資料、欄位或結構。
- 原始 OB 課名、教室、課程代碼與 Class ID 維持不變。
- 先寫測試並確認因缺少正規化而失敗，再實作最小修正。
- Apps Script 正式部署前先取得使用者明確同意。

---

### Task 1: 前後端優惠標記正規化

**Files:**
- Modify: `tests/backend-core.test.js`
- Modify: `tests/frontend-contract.test.js`
- Modify: `Code.gs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `parseClaimCourseOption_(courseNameValue)` 與 `parseClaimCourseOption(courseNameValue)`
- Produces: `{ courseTypeKey, courseTypeName, difficulty }`，其中尾端優惠標記不屬於課程類型

- [x] **Step 1: Write the failing tests**

```js
assert.deepEqual(parse('現代小品〈優惠〉'), {
  courseTypeKey: '現代小品', courseTypeName: '現代小品', difficulty: ''
});
assert.deepEqual(parse('A－空瑜 Lv.1-2〈優惠〉'), {
  courseTypeKey: '空瑜', courseTypeName: '空瑜', difficulty: 'Lv.1-2'
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `node --test tests/backend-core.test.js` and `node --test tests/frontend-contract.test.js`

Expected: assertions receive course type names that still contain `〈優惠〉`.

- [x] **Step 3: Write minimal implementation**

After the existing room, new-teacher, and difficulty parsing, strip a trailing standalone discount marker with the same regular expression in frontend and backend.

- [x] **Step 4: Run verification**

Run both complete test files and copy `Code.gs` to a temporary `.js` file for `node --check`.

Expected: all tests and syntax checks pass.

- [x] **Step 5: Commit locally**

Commit only the four implementation/test files and these two scoped design documents. Do not deploy before explicit approval.
