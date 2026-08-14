# 特別課自動占用連續時段實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement each task, then use superpowers:verification-before-completion before reporting completion.

**Goal:** 老師安排 90–240 分鐘特別課時只勾選起始堂，系統依課程長度與 15 分鐘換場，自動占用同日、同教室所有必要後續時段，並在任一必要時段不可用時整筆阻擋。

**Architecture:** 前端使用已載入的 availability chain 即時預覽占用範圍，但只送出起始代課 ID。Apps Script 在取得鎖後，重新以正式請假資料與 CourseList 計算必要時段，通過全部檢核才以同一 special group ID 原子更新精確列。後端回傳實際占用 ID，前端以回傳值更新畫面。

**Tech Stack:** Google Apps Script (`Code.gs`)、單頁 HTML/CSS/JavaScript (`index.html`)、Node.js built-in test runner。

**Safety constraints:** 不新增、搬動、清空或批次覆蓋任何正式 Sheet 欄位；不更動既有欄位索引。只有實際領取成功時，才更新系統計算出的必要代課列。正式 `clasp push --force` 必須另行取得使用者明確授權。

---

## Task 1：用測試定義後端權威時段計算

**Files:**
- Modify: `tests/backend-core.test.js`
- Modify: `Code.gs`

### Step 1：先新增會失敗的後端測試

在現有 special-course availability/claim 測試旁新增下列案例：

1. B 教室 13:30 起、240 分鐘，後續 B 教室 15:00、16:30 都必須被計入；穿插的 D 教室 14:30、15:45 不受影響。
2. 後續課程開始時間剛好等於 `結束時間 + 15 分鐘` 時，不占用該堂。
3. 任一必要 B 教室時段沒有開放的請假列、已被領取、缺 Calendar ID 或原老師是登入老師時，回傳包含日期、教室、時間的錯誤，且所有列維持原值。
4. 瀏覽器即使偽造第二、第三個 ID，後端仍只採用起始 ID 並自行重算。
5. 「使用連續時段」若最後只需要起始堂，阻擋並提示改用「單堂延長」。

測試資料應明確包含交錯教室，避免把「列表相鄰」誤當成「同教室相鄰」。

Run: `node --test --test-name-pattern='special course|特別課|continuous slots' tests/backend-core.test.js`

Expected: FAIL，因目前後端仍要求 merge 剛好兩個 ID，且只驗證 immediate partner。

### Step 2：加入純計算 helper

在 `Code.gs` 的 special-course helpers 區新增純函式，例如：

```javascript
function buildSpecialCourseSlotPlan_(startId, durationMinutes, pendingRows, courseRows) {
  // 1. 以 startId 找到起始請假列與對應 CourseList 課程。
  // 2. 計算 endMinutes = startMinutes + durationMinutes。
  // 3. 只取同日、同教室、startMinutes >= 起始且 startMinutes < endMinutes + 15 的課程。
  // 4. 每堂課都必須能以 Calendar ID 對應到尚可領取的請假列。
  // 5. 回傳 orderedSubstituteIds、occupiedTimes、room、date、endTime。
}
```

實作要求：

- `durationMinutes` 必須是 90–240 的整數。
- 篩選使用嚴格小於 `< endMinutes + 15`；等於邊界不占用。
- CourseList 與請假列以既有 Calendar ID/代課 ID 對應，不靠畫面順序。
- 找不到必要請假列時，錯誤必須指出 `YYYY/MM/DD、X 教室、HH:mm`。
- helper 不寫 Sheet，方便獨立測試與重用。

### Step 3：讓 availability 提供完整可追蹤鏈

調整 `getSpecialCourseAvailability_()`，每個開放時段仍回傳自身日期、教室、時間與最大分鐘數，並提供前端沿同日同教室追蹤下一堂所需資訊。保留 `mergePartnerIds` 欄位亦可，但語意應是「下一個同教室且確實開放的候選」而不是最終權威結果。

Run: `node --test --test-name-pattern='availability|continuous slots' tests/backend-core.test.js`

Expected: PASS。

### Step 4：提交本任務

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "test: define automatic special course slots"
```

---

## Task 2：後端在鎖內自動展開並原子領取所有必要時段

**Files:**
- Modify: `Code.gs`
- Modify: `tests/backend-core.test.js`

### Step 1：改寫 `claimSpecialCourse_()` 的 merge 輸入契約

「單堂延長」與「使用連續時段」都只接受一個起始 ID：

```javascript
var startId = String((payload.substituteIds || [])[0] || '').trim();
if (!startId || (payload.substituteIds || []).length !== 1) {
  throw new Error('請只勾選特別課開始的第一堂。');
}
```

不要接受前端傳入的後續占用 IDs 作為權威資料。

### Step 2：取得鎖後重算必要 IDs

在既有 lock 範圍內重新讀取正式請假資料與 CourseList：

- vacancy 模式只使用起始 ID，沿用既有單堂最大時間檢核。
- merge 模式呼叫 `buildSpecialCourseSlotPlan_()` 取得 `orderedSubstituteIds`。
- 若 merge 計算結果只有一堂，丟出「此時段不需使用後續時段，請改用單堂延長」。
- 對每個實際 ID 套用現有檢核：確認中、代課老師空白、已開放邀請、Calendar ID 存在、不是自己的原課程。
- 任一檢核失敗時，在任何寫入前拋錯。

### Step 3：一次完成精確列更新

沿用既有 `runStateTransitionUnlocked_()` 與欄位索引，以同一 `specialGroupId` 寫入全部必要列：

```javascript
return {
  success: true,
  count: requiredIds.length,
  substituteIds: requiredIds,
  specialGroupId: specialGroupId,
  endTime: slotPlan.endTime,
  occupiedTimes: slotPlan.occupiedTimes
};
```

`specialMode` 改存「使用連續時段」，不得新增 Sheet 欄位或改動索引。

### Step 4：執行後端回歸測試

Run: `node --test tests/backend-core.test.js`

Expected: PASS；三堂成功案例的三列共用同一 group ID，失敗案例確認零列變更。

### Step 5：提交本任務

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: auto-claim continuous special course slots"
```

---

## Task 3：前端只選起始堂並即時顯示自動占用結果

**Files:**
- Modify: `tests/frontend-contract.test.js`
- Modify: `index.html`

### Step 1：先新增會失敗的前端契約測試

新增案例：

- 畫面文字為「使用連續時段」。
- 說明完整顯示：「只需勾選特別課開始的第一堂，系統會依課程長度，自動占用同日、同教室需要使用的後續時段。」
- 13:30 + 240 分鐘預覽為「將占用 B 教室 13:30、15:00、16:30」。
- D 教室交錯課程不出現在占用清單。
- 修改分鐘數會即時重算。
- 必要下一堂缺失時顯示具體日期／教室／時間並禁止送出。
- 前端 draft 的 `substituteIds` 永遠只有起始 ID。
- merge 只需一個起始 ID，不再要求剛好兩堂。

Run: `node --test --test-name-pattern='special course|continuous slots|自動占用' tests/frontend-contract.test.js`

Expected: FAIL。

### Step 2：新增前端純計算 helper

在 `validateSpecialCourseDraft()` 前新增例如：

```javascript
function buildSpecialCourseSlotPreview(startId, durationMinutes, availabilityMap) {
  // 從起始堂沿同日、同教室的 next/partner chain 前進。
  // 收集所有開始時間 < 特別課結束 + 15 分鐘的時段。
  // 必要 partner 缺失時回傳具體阻擋原因。
  // 回傳 { ids, room, date, times, message }。
}
```

`validateSpecialCourseDraft()` 在 merge 模式要求恰好一個起始 ID，呼叫 preview helper 驗證，並保留 90–240 整數檢核。

### Step 3：改文案與選取行為

- Radio 標題改為「使用連續時段」。
- 在特別課表單醒目加入核准說明文字。
- merge 模式勾選新起始堂時，自動取消原本起始堂；不讓老師手動勾第二、第三堂。
- 尚未勾選時不預先鎖住所有時段。
- `updateSpecialSelectionConstraints()` 不再以兩堂上限停用第三堂；改以單一開始堂 + preview 計算。
- 自動占用的課卡加上狀態文字「系統自動占用」，但不要把其 checkbox 設為 checked，避免送出額外 IDs。
- 不可安排時，顯示具體原因並停用送出按鈕。

### Step 4：更新摘要與成功後移除邏輯

`updateSpecialClaimSummary()` 顯示：

```text
將占用 B 教室 13:30、15:00、16:30
```

`submitSpecialClaim()` 成功後，以後端回傳為準：

```javascript
const claimedIds = Array.isArray(result.substituteIds) ? result.substituteIds : [];
if (!result.success || result.count !== claimedIds.length) {
  throw new Error('特別課領取結果不完整，請重新整理後確認。');
}
removeClaimedSubstitutes(claimedIds);
```

不得再用 `draft.substituteIds.length` 判斷成功筆數，因 draft 只有起始 ID。

### Step 5：執行前端回歸測試

Run: `node --test tests/frontend-contract.test.js`

Expected: PASS。

### Step 6：提交本任務

```bash
git add index.html tests/frontend-contract.test.js
git commit -m "feat: preview automatic special course slots"
```

---

## Task 4：整體驗證與正式部署前安全檢查

**Files:**
- Verify: `Code.gs`
- Verify: `index.html`
- Verify: `tests/backend-core.test.js`
- Verify: `tests/frontend-contract.test.js`

### Step 1：執行完整測試

Run: `node --test tests/*.test.js`

Expected: 全部 PASS；若有既存且與本功能無關的 missing-file/ENOENT，必須分開記錄，不能冒充本次失敗。

### Step 2：執行語法與差異檢查

```bash
cp Code.gs /private/tmp/substitute-code-check.js
node --check /private/tmp/substitute-code-check.js
node --check tests/backend-core.test.js
node --check tests/frontend-contract.test.js
git diff --check
git status --short
```

Expected: 語法與 diff check 通過；只包含本功能預期檔案。

### Step 3：核對安全契約

用 `git diff` 確認：

- 沒有 `clear()`、`clearContents()`、整張 `setValues()` 或資料遷移。
- 沒有改動正式 Sheet ID、工作表名稱、欄位索引。
- 後端只在全部 required IDs 通過後寫入。
- 回傳 actual IDs，前端不信任自己的後續占用預覽。

### Step 4：提交整體修正

```bash
git add Code.gs index.html tests/backend-core.test.js tests/frontend-contract.test.js
git commit -m "feat: support multi-slot special courses"
```

### Step 5：部署前停下取得授權

先回報測試數、變更摘要與正式 Sheet 影響為「無結構／既有資料變更；只有老師日後送出時精準更新必要代課列」。

因本次含 Apps Script 後端變更，**不得自行執行 `clasp push --force`**。必須先向使用者說明會覆蓋目前 GAS 專案程式碼並取得明確同意，之後才可：

1. 推送／部署 GAS 新版本。
2. 推送 `main` 觸發 GitHub Pages。
3. 以正式網址核對文案與載入，不進行真實領取寫入。

