# Ordinary Claim Start Delay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓所有老師在一般代課的右側調整區選擇原時段、延後 15 分鐘或延後 30 分鐘，並在衝突時原子鎖住下一堂待領代課交由管理員關閉 OB。

**Architecture:** 以 `CourseList` 與 `請假代課紀錄` 為後端唯一判斷來源，在既有 Script Lock 內重新計算 60／90 分鐘課長、15 分鐘換場及下一堂占用。原堂維持「已領取」，占用堂使用獨立「延後占用」狀態且不填代課老師；三個追加欄位保存實際開始、延後分鐘與來源代課編號，管理者重新同步後以 OB 時間或 Calendar ID 消失完成核對。

**Tech Stack:** Google Apps Script、Google Sheets、單檔 HTML/CSS/vanilla JavaScript、Node.js `node:test`、Playwright 視覺檢查

## Global Constraints

- 左側「沿用原課程」維持原時間，不顯示時間選項。
- 右側「調整課程」提供原時段、延後 15 分鐘、延後 30 分鐘，並允許只改時間。
- 課程名稱含精確字串「綢吊」時為 90 分鐘；包括「舞綢」在內的其他一般課為 60 分鐘。
- 課程結束後保留 15 分鐘換場；最多占用緊接的一堂。
- 下一堂不是可領取代課時，整批拒絕且零寫入。
- 占用堂不填代課老師，不視為第二堂代課；薪資仍只依 OB 最終開課成果與人數。
- `請假代課紀錄` 只在 A:Y 後追加三欄，不移動或改寫既有欄位索引。
- 不清空、不整張覆寫、不搬移正式 Sheet 人工資料。
- 正式推送、`clasp push --force`、Sheet 結構設定與部署前必須另取得使用者明確允許。

---

### Task 1: 追加 Sheet 契約與一般課時間規則

**Files:**
- Modify: `Code.gs:24-36`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `SHEET_HEADERS.LEAVES[25..27]` 為 `實際開始時間`、`延後分鐘數`、`延後占用來源代課編號`。
- Produces: `getOrdinaryCourseDurationMinutes_(courseName): number`。
- Produces: `normalizeOrdinaryDelayMinutes_(value): 0 | 15 | 30`，其他值丟出錯誤。

- [ ] **Step 1: 寫入失敗的契約與課長測試**

在 `tests/backend-core.test.js` 加入：

```js
test('ordinary delay columns append after the fixed leave contract', () => {
  const backend = loadBackend();
  assert.equal(backend.SHEET_HEADERS.LEAVES[9], '代課編號');
  assert.equal(backend.SHEET_HEADERS.LEAVES[24], '特別課結束時間');
  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.SHEET_HEADERS.LEAVES.slice(25))),
    ['實際開始時間', '延後分鐘數', '延後占用來源代課編號']
  );
});

test('ordinary duration treats only 綢吊 as ninety minutes', () => {
  const backend = loadBackend();
  assert.equal(backend.getOrdinaryCourseDurationMinutes_('A－綢吊 Lv.1'), 90);
  assert.equal(backend.getOrdinaryCourseDurationMinutes_('B－舞綢 Lv.1'), 60);
  assert.equal(backend.getOrdinaryCourseDurationMinutes_('A－空環 Lv.2'), 60);
  assert.equal(backend.normalizeOrdinaryDelayMinutes_('15'), 15);
  assert.equal(backend.normalizeOrdinaryDelayMinutes_(30), 30);
  assert.throws(
    () => backend.normalizeOrdinaryDelayMinutes_(45),
    /原時段.*延後 15.*延後 30/
  );
});
```

- [ ] **Step 2: 執行測試並確認 RED**

Run:

```bash
node --test --test-name-pattern='ordinary delay columns|ordinary duration' tests/backend-core.test.js
```

Expected: FAIL，因三個欄位與兩個 helper 尚不存在。

- [ ] **Step 3: 追加欄位與純函式**

在 `SHEET_HEADERS.LEAVES` 尾端追加：

```javascript
'特別課群組 ID', '特別課模式', '特別課分鐘數', '特別課結束時間',
'實際開始時間', '延後分鐘數', '延後占用來源代課編號'
```

新增：

```javascript
function getOrdinaryCourseDurationMinutes_(courseName) {
  return cleanText_(courseName).indexOf('綢吊') !== -1 ? 90 : 60;
}

function normalizeOrdinaryDelayMinutes_(value) {
  var delay = value == null || cleanText_(value) === '' ? 0 : Number(value);
  if ([0, 15, 30].indexOf(delay) === -1) {
    throw new Error('一般代課只能使用原時段、延後 15 分鐘或延後 30 分鐘。');
  }
  return delay;
}
```

- [ ] **Step 4: 執行目標測試並確認 GREEN**

Run:

```bash
node --test --test-name-pattern='ordinary delay columns|ordinary duration' tests/backend-core.test.js
```

Expected: 2 項 PASS。

- [ ] **Step 5: 本機提交資料契約**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: append ordinary claim delay fields"
```

---

### Task 2: 後端延後占用規劃與原子領取

**Files:**
- Modify: `Code.gs:4751-4854`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `getOrdinaryCourseDurationMinutes_()`、`normalizeOrdinaryDelayMinutes_()`。
- Produces: `buildOrdinaryClaimDelayPlan_(sourceRow, delayMinutes, leaveRows, courseRows)`。
- Produces: `claimSubstitute_()` 回傳 `{ count: number, occupiedSubstituteIds: string[] }`。

- [ ] **Step 1: 寫入 60／90 分鐘與衝突規劃的失敗測試**

建立固定 CourseList：18:30 空環、20:00 下一堂、21:30 再下一堂，並斷言：

```js
test('ordinary sixty-minute delay occupies only the conflicting next open leave', () => {
  const backend = loadBackend();
  const leaveRows = [
    ['stamp', '原老師甲', '2026/09/01', '18:30', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'],
    ['stamp', '原老師乙', '2026/09/01', '20:00', 'A－空環 Lv.2', '確認中', '', '', '', 'leave-b', 'cal-b'],
  ];
  const courseRows = [
    ['2026/09/01', '18:30', 'A－空環 Lv.1', '原老師甲', 'cal-a'],
    ['2026/09/01', '20:00', 'A－空環 Lv.2', '原老師乙', 'cal-b'],
    ['2026/09/01', '21:30', 'A－瑜伽', '原老師丙', 'cal-c'],
  ];

  assert.equal(backend.buildOrdinaryClaimDelayPlan_(leaveRows[0], 15, leaveRows, courseRows).occupiedSubstituteId, '');
  const delayed = backend.buildOrdinaryClaimDelayPlan_(leaveRows[0], 30, leaveRows, courseRows);
  assert.equal(delayed.actualStartTime, '19:00');
  assert.equal(delayed.endTime, '20:00');
  assert.equal(delayed.occupiedSubstituteId, 'leave-b');
});
```

再以 table-driven cases 建立「綢吊 90 分鐘會占用」與「舞綢 60 分鐘不占用」的固定 rows，逐筆斷言 `occupiedSubstituteId`。下一堂沒有對應 leave row、下一堂狀態為「已領取」、來源缺 Calendar ID，以及 20:00／20:10 兩堂都落在換場區間時，分別斷言錯誤包含「下一堂課衝突」、「Calendar ID 不完整」或「占用兩堂以上」，並斷言傳入 rows 未被改動：

```js
const cases = [
  { course: 'A－綢吊 Lv.1', expected: 'leave-b' },
  { course: 'A－舞綢 Lv.1', expected: '' },
];
for (const fixture of cases) {
  const source = ['stamp', '原老師甲', '2026/09/01', '18:30', fixture.course,
    '確認中', '', '', '', 'leave-a', 'cal-a'];
  const next = ['stamp', '原老師乙', '2026/09/01', '20:00', 'A－空環 Lv.2',
    '確認中', '', '', '', 'leave-b', 'cal-b'];
  const courses = [
    ['2026/09/01', '18:30', fixture.course, '原老師甲', 'cal-a'],
    ['2026/09/01', '20:00', 'A－空環 Lv.2', '原老師乙', 'cal-b'],
  ];
  assert.equal(
    backend.buildOrdinaryClaimDelayPlan_(source, 0, [source, next], courses)
      .occupiedSubstituteId,
    fixture.expected
  );
}
```

- [ ] **Step 2: 執行 planner 測試並確認 RED**

Run:

```bash
node --test --test-name-pattern='ordinary sixty-minute delay|ordinary 綢吊 delay|ordinary delay rejects' tests/backend-core.test.js
```

Expected: FAIL，因 `buildOrdinaryClaimDelayPlan_` 尚不存在。

- [ ] **Step 3: 實作後端權威規劃函式**

新增以下契約：

```javascript
function buildOrdinaryClaimDelayPlan_(sourceRow, delayMinutes, leaveRows, courseRows) {
  var delay = normalizeOrdinaryDelayMinutes_(delayMinutes);
  var date = formatMyDate(sourceRow && sourceRow[2]);
  var originalStartTime = formatMyTime(sourceRow && sourceRow[3]);
  var originalStartMinutes = timeTextToMinutes_(originalStartTime);
  var calendarId = cleanText_(sourceRow && sourceRow[10]);
  var room = getCourseRoom_(sourceRow && sourceRow[4]);
  var durationMinutes = getOrdinaryCourseDurationMinutes_(sourceRow && sourceRow[4]);
  if (!date || originalStartMinutes < 0 || !calendarId || !room) {
    throw new Error('代課時間或 OB Calendar ID 不完整，請重新整理。');
  }

  var actualStartMinutes = originalStartMinutes + delay;
  var endMinutes = actualStartMinutes + durationMinutes;
  var turnoverEndMinutes = endMinutes + 15;
  if (actualStartMinutes >= 24 * 60 || endMinutes >= 24 * 60) {
    throw new Error('延後後課程不可跨日。');
  }

  var schedule = (courseRows || []).map(function(row) {
    return {
      row: row,
      date: formatMyDate(row && row[0]),
      time: formatMyTime(row && row[1]),
      minutes: timeTextToMinutes_(formatMyTime(row && row[1])),
      room: getCourseRoom_(row && row[2]),
      calendarId: cleanText_(row && row[4])
    };
  }).filter(function(course) {
    return course.date === date && course.room === room && course.minutes >= 0;
  }).sort(function(a, b) { return a.minutes - b.minutes; });

  if (!schedule.some(function(course) { return course.calendarId === calendarId; })) {
    throw new Error('原課程尚未出現在 OB 課表，請通知管理員重新同步。');
  }
  var following = schedule.filter(function(course) { return course.minutes > originalStartMinutes; });
  var conflicts = following.filter(function(course) { return course.minutes < turnoverEndMinutes; });
  if (conflicts.length > 1) throw new Error('延後會占用兩堂以上，請聯絡管理員。');

  var occupiedRowIndex = -1;
  var occupiedSubstituteId = '';
  if (conflicts.length === 1) {
    var occupiedCalendarId = conflicts[0].calendarId;
    occupiedRowIndex = (leaveRows || []).findIndex(function(row) {
      return cleanText_(row && row[10]) === occupiedCalendarId;
    });
    var occupiedRow = occupiedRowIndex >= 0 ? leaveRows[occupiedRowIndex] : null;
    if (!occupiedRow || !isOrdinaryOpenLeaveRow_(occupiedRow)) {
      throw new Error('延後時間與下一堂課衝突，請聯絡管理員。');
    }
    occupiedSubstituteId = cleanText_(occupiedRow[9]);
  }

  return {
    delayMinutes: delay,
    originalStartTime: originalStartTime,
    actualStartTime: minutesToTimeText_(actualStartMinutes),
    durationMinutes: durationMinutes,
    endTime: minutesToTimeText_(endMinutes),
    turnoverEndTime: minutesToTimeText_(turnoverEndMinutes),
    occupiedRowIndex: occupiedRowIndex,
    occupiedSubstituteId: occupiedSubstituteId
  };
}
```

- [ ] **Step 4: 寫入原子領取與回滾的失敗測試**

在現有 `createInvitationBackend()` fixture 中，以 18:30、20:00 同日同教室的 CourseList／leave rows 呼叫，保存呼叫前 snapshot，並斷言：

```js
const result = backend.claimSubstitute_(teacherASession, [{
  substituteId: 'leave-a', handlingType: 'original', startDelayMinutes: 30,
}]);
assert.deepEqual(result, { count: 1, occupiedSubstituteIds: ['leave-b'] });
assert.equal(leaveSheet.values[1][5], '已領取');
assert.equal(leaveSheet.values[1][25], '19:00');
assert.equal(leaveSheet.values[1][26], 30);
assert.equal(leaveSheet.values[2][5], '延後占用');
assert.equal(leaveSheet.values[2][6], '');
assert.equal(leaveSheet.values[2][15], '待關閉 OB');
assert.equal(leaveSheet.values[2][18], '延後占用／待管理員關閉 OB');
assert.equal(leaveSheet.values[2][27], 'leave-a');
```

再建立四個獨立測試：同批同時把 `leave-b` 當主要領取、下一堂已被其他老師領取、第二列 `setValues()` 注入失敗、audit append 注入失敗。前兩者斷言呼叫拋錯且 `leaveSheet.values`、`auditSheet.values` 等於呼叫前 snapshot；後兩者除兩張 Sheet 完整 rollback 外，也斷言注入錯誤原樣向上拋出。

- [ ] **Step 5: 執行原子領取測試並確認 RED**

Run:

```bash
node --test --test-name-pattern='ordinary delay atomically|ordinary delay rollback|ordinary delay batch conflict' tests/backend-core.test.js
```

Expected: FAIL，因 `claimSubstitute_` 尚未讀取 CourseList、尚未寫入占用列。

- [ ] **Step 6: 擴充 `claimSubstitute_`**

在同一 Script Lock 內讀取 `CourseList`，先建立所有主要領取與占用計畫，再進入任何 Sheet 寫入。每個 item 讀取：

```javascript
var delayPlan = buildOrdinaryClaimDelayPlan_(
  row,
  item.startDelayMinutes,
  values.slice(1),
  courseRows
);
```

主要列追加欄位：

```javascript
nextRow[25] = delayPlan.actualStartTime;
nextRow[26] = delayPlan.delayMinutes;
nextRow[27] = '';
nextRow[7] = [
  change.summary,
  delayPlan.delayMinutes ? '實際開始：' + delayPlan.actualStartTime : ''
].filter(Boolean).join('；');
```

占用列使用完整 row clone，精準設定：

```javascript
occupiedRow[5] = '延後占用';
occupiedRow[6] = '';
occupiedRow[7] = '由代課編號 ' + sourceId + ' 延後占用';
occupiedRow[8] = '待處理';
occupiedRow[11] = '';
occupiedRow[12] = '';
occupiedRow[13] = '';
occupiedRow[14] = '';
occupiedRow[15] = '待關閉 OB';
occupiedRow[16] = '';
occupiedRow[17] = '';
occupiedRow[18] = '延後占用／待管理員關閉 OB';
occupiedRow[19] = '';
occupiedRow[20] = '';
occupiedRow[21] = '';
occupiedRow[22] = '';
occupiedRow[23] = '';
occupiedRow[24] = '';
occupiedRow[25] = '';
occupiedRow[26] = '';
occupiedRow[27] = sourceId;
```

用 `primaryIds` 與 `reservedOccupiedIds` 先拒絕同批重複。以一次 `runStateTransitionUnlocked_([leaveSheet], ...)` 寫入所有完整尾端欄位與 audits；不得沿用固定 16 欄寫法，必須使用：

```javascript
leaveSheet.getRange(
  update.sheetRow,
  6,
  1,
  SHEET_HEADERS.LEAVES.length - 5
).setValues([update.rowValues.slice(5, SHEET_HEADERS.LEAVES.length)]);
```

回傳：

```javascript
return {
  count: primaryUpdates.length,
  occupiedSubstituteIds: occupiedUpdates.map(function(update) { return update.substituteId; })
};
```

- [ ] **Step 7: 執行完整 backend 測試**

Run:

```bash
node --test tests/backend-core.test.js
```

Expected: backend 全部 PASS，既有普通領取、特別課、取消／退出與 rollback 測試不退步。

- [ ] **Step 8: 本機提交後端領取邏輯**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: reserve next slot for delayed claims"
```

---

### Task 3: 管理者 OB 待辦、重新核對與個人紀錄

**Files:**
- Modify: `Code.gs:5015-5216,5357-5388,5479-5625`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: appended indexes 25、26、27 and status `延後占用`。
- Produces: `getObExpectation_()` property `expectedTime` and `closeType: 'delay-occupancy' | ''`。
- Produces: admin/personal DTO fields `actualStartTime`、`startDelayMinutes`、`delaySourceSubstituteId`；admin 另產生 `delaySourceTeacher`。

- [ ] **Step 1: 寫入管理者與重新核對的失敗測試**

新增測試證明（沿用 `createInvitationBackend()`，日期使用 fixture 的 `nextMonth`）：

```js
test('delayed primary claim verifies its actual OB start time', () => {
  const fixture = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [['2026/09/01', '18:30', 'A－空環 Lv.1', '老師甲', 'cal-a', 'class-ring-1']],
    leaveRows: [[
      'stamp', '原老師甲', '2026/09/01', '18:30', 'A－空環 Lv.1',
      '已領取', '老師甲', '', '待處理', 'leave-a', 'cal-a',
      'class-ring-1', 'A－空環 Lv.1', '', 'original', '待核對', '', '', '',
      '空環', '', '', '', '', '', '19:00', 30, ''
    ]],
  });
  fixture.backend.reconcileObChanges_(fixture.adminSession);
  assert.match(fixture.leaveSheet.values[1][17], /時間不一致.*19:00.*18:30/);
  fixture.courseSheet.values[1][1] = '19:00';
  fixture.backend.reconcileObChanges_(fixture.adminSession);
  assert.equal(fixture.leaveSheet.values[1][15], '已核對');
});

test('delay occupied row completes only after its OB calendar disappears', () => {
  const fixture = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [['2026/09/01', '20:00', 'A－空環 Lv.2', '原老師乙', 'cal-b']],
    leaveRows: [[
      'stamp', '原老師乙', '2026/09/01', '20:00', 'A－空環 Lv.2',
      '延後占用', '', '由 leave-a 延後占用', '待處理', 'leave-b', 'cal-b',
      '', '', '', '', '待關閉 OB', '', '', '延後占用／待管理員關閉 OB',
      '', '', '', '', '', '', '', '', 'leave-a'
    ]],
  });
  fixture.backend.reconcileObChanges_(fixture.adminSession);
  assert.equal(fixture.leaveSheet.values[1][15], '核對異常');
  assert.match(fixture.leaveSheet.values[1][17], /OB 課程仍存在/);
  fixture.courseSheet.values.splice(1, 1);
  fixture.backend.reconcileObChanges_(fixture.adminSession);
  assert.equal(fixture.leaveSheet.values[1][8], '已完成');
  assert.equal(fixture.leaveSheet.values[1][15], '已關閉');
  assert.equal(fixture.leaveSheet.values[1][18], '延後占用／OB 已關閉');
});
```

另以同一組主要列＋占用列 fixture 斷言 `getAdminDashboard_()` 把 `leave-b` 放入 `obWork`，但不放入 `pendingInvitations`；`getMySubs_('老師甲')` 只回傳 `leave-a`，且 `實際開始時間 === '19:00'`、`延後分鐘數 === 30`。Dashboard 中 `leave-b.delaySourceTeacher` 必須由來源 `leave-a` 的代課老師解析為 `老師甲`。

- [ ] **Step 2: 執行核對測試並確認 RED**

Run:

```bash
node --test --test-name-pattern='delayed primary claim verifies|delay occupied row completes|delay occupied admin work' tests/backend-core.test.js
```

Expected: FAIL，因現有核對把 Calendar ID 消失視為一般錯誤，且 admin queue 不認得「延後占用」。

- [ ] **Step 3: 擴充 DTO 與 OB expectation**

`toAdminLeaveItem_()` 與個人代課 mapping 加入：

```javascript
actualStartTime: formatMyTime(row[25]) || formatMyTime(row[3]),
startDelayMinutes: Number(row[26]) || 0,
delaySourceSubstituteId: cleanText_(row[27])
```

`getAdminDashboard_()` 在建立 `leaves` 後以 `substituteId` 建索引，再為每筆占用列補上：

```javascript
item.delaySourceTeacher = item.delaySourceSubstituteId && leaveById[item.delaySourceSubstituteId]
  ? leaveById[item.delaySourceSubstituteId].substituteTeacher
  : '';
```

`getObExpectation_()` 對占用列回傳：

```javascript
if (cleanText_(row[5]) === '延後占用') {
  return {
    teacher: '', course: '', classId: '', expectedTime: '',
    restoreType: '', closeType: 'delay-occupancy'
  };
}
```

一般已領取列回傳 `expectedTime: formatMyTime(row[25])`、`closeType: ''`。`getObCourseDifferences_()` 規則：closeType 時 OB row 存在即回傳 `OB 課程仍存在，尚未關閉`，不存在則無差異；一般列有 `expectedTime` 時比較 `formatMyTime(obRow[1])`。

- [ ] **Step 4: 擴充 active OB work 與成功狀態**

`isActiveObWorkRow_()` 與 dashboard `obWork` filter 接受：

```javascript
cleanText_(row[5]) === '延後占用' &&
['待關閉 OB', '核對異常'].indexOf(cleanText_(row[15])) !== -1
```

`reconcileObChanges_()` 在 `closeType === 'delay-occupancy'` 且 differences 為空時設定：

```javascript
nextRow[8] = '已完成';
nextRow[15] = '已關閉';
nextRow[16] = now;
nextRow[17] = '';
nextRow[18] = '延後占用／OB 已關閉';
```

若 OB 仍存在，保持 `nextRow[8] = '待處理'`、`nextRow[15] = '核對異常'` 並寫入差異原因。稽核 action 使用 `延後占用 OB 關閉完成` 或 `延後占用 OB 尚未關閉`。

同步調整 dashboard：`exceptions` 接受占用列的 `核對異常`；`completed` 接受占用列的 `已關閉`。占用列不加入薪資來源，也因代課老師空白而不會進入老師個人代課清單。

- [ ] **Step 5: 執行 backend 測試並確認 GREEN**

Run:

```bash
node --test tests/backend-core.test.js
```

Expected: backend 全部 PASS。

- [ ] **Step 6: 本機提交管理者核對**

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: reconcile delayed occupancy work"
```

---

### Task 4: 老師端時間選擇、預覽與送出

**Files:**
- Modify: `index.html:2150-2425,2592-2625`
- Test: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: `claimOptions.specialAvailability[substituteId]` 的 `startTime`、`nextCourseTime`、`mergePartnerIds`。
- Produces: ordinary claim draft property `startDelayMinutes: 0 | 15 | 30`。
- Produces: `buildOrdinaryDelayPreview(target, startDelayMinutes, availabilityMap, pendingItems)`。

- [ ] **Step 1: 寫入 UI 與純函式的失敗測試**

新增真實 render／draft 測試：

```js
test('ordinary start delay appears only in the adjustment panel', () => {
  const { context } = createFrontendRuntime();
  const rendered = context.renderAvailableSubstituteItem({
    '代課編號': 'leave-a', '日期': '2026/09/01', '時段': '18:30',
    '課程': 'A－空環 Lv.1', '原老師': '老師甲', '課程大類': '空環',
    '可沿用原課程': true,
  });
  assert.match(rendered, /調整課程或時間/);
  assert.match(rendered, /class="claim-control claim-start-delay"/);
  assert.match(rendered, /原時段/);
  assert.match(rendered, /延後 15 分鐘/);
  assert.match(rendered, /延後 30 分鐘/);
});

test('ordinary delay preview distinguishes sixty-minute and 綢吊 claims', () => {
  const { context } = createFrontendRuntime();
  const availability = {
    'leave-a': { startTime: '18:30', nextCourseTime: '20:00', mergePartnerIds: ['leave-b'] },
  };
  const pending = [{ '代課編號': 'leave-b', '時段': '20:00' }];
  assert.equal(context.buildOrdinaryDelayPreview(
    { '代課編號': 'leave-a', '時段': '18:30', '課程': 'A－空環 Lv.1' },
    15, availability, pending
  ).occupiedSubstituteId, '');
  assert.equal(context.buildOrdinaryDelayPreview(
    { '代課編號': 'leave-a', '時段': '18:30', '課程': 'A－空環 Lv.1' },
    30, availability, pending
  ).occupiedSubstituteId, 'leave-b');
});
```

再加入具體斷言：

```js
assert.equal(context.getOrdinaryCourseDurationMinutes('A－舞綢 Lv.1'), 60);
assert.equal(context.getOrdinaryCourseDurationMinutes('A－綢吊 Lv.1'), 90);
assert.equal(context.buildOrdinaryDelayPreview(
  { '代課編號': 'leave-a', '時段': '18:30', '課程': 'A－空環 Lv.1' },
  30,
  { 'leave-a': { nextCourseTime: '20:00', mergePartnerIds: [] } },
  pending
).blocked, true);
```

對實際 card DOM 分別勾選左側與右側：左側 `readClaimDraft()` 深度等於含 `startDelayMinutes: 0` 的既有 original draft；右側選 `__ORIGINAL__` 與 `30` 後，斷言 draft 為 `handlingType: 'original'`、`startDelayMinutes: 30`，且難度 selector 已隱藏。另斷言 render 結果中 `.claim-start-delay` 只出現一次，位於 `.claim-adjustment-panel` 內。

- [ ] **Step 2: 執行前端測試並確認 RED**

Run:

```bash
node --test --test-name-pattern='ordinary start delay|ordinary delay preview|time-only ordinary adjustment' tests/frontend-contract.test.js
```

Expected: FAIL，因時間 selector、preview helper 與 draft property 尚不存在。

- [ ] **Step 3: 調整右側表單**

將右側 radio 文案改為「調整課程或時間」。在 `.claim-adjustment-panel` 第一個欄位加入：

```html
<div class="claim-field full">
  <label>上課時間</label>
  <select class="claim-control claim-start-delay">
    <option value="0">原時段</option>
    <option value="15">延後 15 分鐘</option>
    <option value="30">延後 30 分鐘</option>
  </select>
  <p class="hint claim-delay-summary">維持原時段</p>
</div>
```

可沿用原課程時，在 `.claim-course-type` 最前加入：

```html
<option value="__ORIGINAL__">沿用原課程（只調整時間）</option>
```

若選 `__ORIGINAL__`，隱藏難度 selector 並由 `readClaimDraft()` 送 `handlingType: 'original'`；其他選項沿用既有課程調整邏輯。

- [ ] **Step 4: 實作前端時間與預覽 helper**

新增：

```javascript
function getOrdinaryCourseDurationMinutes(courseName) {
  return String(courseName || '').includes('綢吊') ? 90 : 60;
}

function buildOrdinaryDelayPreview(target, startDelayMinutes, availabilityMap, pendingItems) {
  var delay = Number(startDelayMinutes || 0);
  if (![0, 15, 30].includes(delay)) throw new Error('一般代課只能延後 15 或 30 分鐘。');
  var originalStartMinutes = parseClaimTimeMinutes(target && target['時段']);
  var durationMinutes = getOrdinaryCourseDurationMinutes(target && target['課程']);
  var actualStartMinutes = originalStartMinutes + delay;
  var endMinutes = actualStartMinutes + durationMinutes;
  var turnoverEndMinutes = endMinutes + 15;
  var availability = (availabilityMap || {})[target && target['代課編號']] || {};
  var nextMinutes = parseClaimTimeMinutes(availability.nextCourseTime);
  var occupiedSubstituteId = '';
  var blocked = false;
  if (Number.isFinite(nextMinutes) && turnoverEndMinutes > nextMinutes) {
    var partnerKey = (availability.mergePartnerIds || [])[0] || '';
    occupiedSubstituteId = String(partnerKey).replace(/^leave:/, '');
    blocked = !occupiedSubstituteId || !(pendingItems || []).some(function(item) {
      return item['代課編號'] === occupiedSubstituteId;
    });
  }
  return {
    actualStartTime: formatClaimTimeMinutes(actualStartMinutes),
    endTime: formatClaimTimeMinutes(endMinutes),
    occupiedSubstituteId: occupiedSubstituteId,
    blocked: blocked
  };
}
```

在 checkbox、handling radio、課程類型與 `.claim-start-delay` change 時更新 `.claim-delay-summary`。衝突時停用送出並顯示「延後時間與下一堂課衝突，請聯絡管理員」。

- [ ] **Step 5: 送出 delay 並移除占用堂**

`readClaimDraft()` 將右側 selector 值寫成 `startDelayMinutes`；左側固定為 `0`。`submitClaim()` 成功後合併主要 IDs 與 backend 回傳的占用 IDs：

```javascript
const removedIds = new Set([
  ...items.map((item) => item.substituteId),
  ...((result && result.occupiedSubstituteIds) || [])
]);
pendingLeaves = pendingLeaves.filter((item) => !removedIds.has(item['代課編號']));
```

結果筆數仍以主要領取 `result.count === items.length` 驗證。

- [ ] **Step 6: 執行 frontend 測試並確認 GREEN**

Run:

```bash
node --test tests/frontend-contract.test.js
```

Expected: frontend 全部 PASS。

- [ ] **Step 7: 本機提交老師端功能**

```bash
git add index.html tests/frontend-contract.test.js
git commit -m "feat: select ordinary claim start delay"
```

---

### Task 5: 管理頁呈現、視覺流程與操作文件

**Files:**
- Modify: `index.html:3342-3355`
- Modify: `tests/frontend-contract.test.js`
- Modify: `tests/visual-check.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: admin DTO `actualStartTime`、`startDelayMinutes`、`delaySourceSubstituteId`。
- Produces: 管理頁可辨識原堂時間調整與占用堂關閉待辦。

- [ ] **Step 1: 寫入管理頁呈現的失敗測試**

新增測試斷言：主要列顯示 `調整開始時間：18:30 → 19:00`；占用列顯示 `延後占用／待管理員關閉 OB`、來源代課編號與來源老師；占用列不顯示一般「連結替代課程」操作。

```js
assert.match(renderedPrimary, /調整開始時間：18:30 → 19:00/);
assert.match(renderedOccupied, /延後占用／待管理員關閉 OB/);
assert.match(renderedOccupied, /來源代課編號：leave-a/);
assert.match(renderedOccupied, /來源老師：老師甲/);
assert.doesNotMatch(renderedOccupied, /data-admin-action="link-replacement"/);
```

- [ ] **Step 2: 執行管理頁測試並確認 RED**

Run:

```bash
node --test --test-name-pattern='admin delayed claim|admin delay occupied' tests/frontend-contract.test.js
```

Expected: FAIL，因管理卡片尚未顯示新欄位。

- [ ] **Step 3: 更新管理頁卡片**

在 `renderAdminItem()`／`renderAdminObItem()` 依 DTO 加入：

```javascript
var timeChange = item.startDelayMinutes
  ? '<div class="item-meta">調整開始時間：' + escapeHtml(item.time) + ' → ' + escapeHtml(item.actualStartTime) + '</div>'
  : '';
var delayOccupancy = item.status === '延後占用'
  ? '<div class="item-meta">延後占用／待管理員關閉 OB｜來源代課編號：' + escapeHtml(item.delaySourceSubstituteId) + '｜來源老師：' + escapeHtml(item.delaySourceTeacher || '待確認') + '</div>'
  : '';
```

占用列只顯示關閉 OB 說明與重新核對後的差異，不提供替代 Calendar 連結。

- [ ] **Step 4: 更新視覺 journey**

在 `tests/visual-check.mjs` 將一般代課調整步驟改用目前真實 selector：勾選卡片、選「調整課程或時間」、將 `.claim-start-delay` 選為 `30`，等待 `.claim-delay-summary` 顯示實際開始／下一堂需關閉，再截取 desktop 與 mobile `04-ordinary-delay-claim`。保留 overflow、裁切與手機導覽檢查。

- [ ] **Step 5: 補充正式操作文件**

在 `README.md` 記錄：

```text
正式部署前先備份「請假代課紀錄」，再從 Apps Script 編輯器明確執行 ensureSystemStructure_()；確認 Z:AB 依序為「實際開始時間、延後分鐘數、延後占用來源代課編號」。管理員收到延後占用待辦後，在 OB 調整原堂開始時間並關閉被占用堂，再回管理頁依序按「同步 OB 課表」與「重新核對 OB」。
```

- [ ] **Step 6: 執行 UI 契約與視覺檢查**

Run:

```bash
node --test tests/frontend-contract.test.js tests/morandi-visual-contract.test.js
node tests/visual-check.mjs
```

Expected: 契約測試 PASS；桌機與手機延後代課畫面無水平溢出、控制項裁切或導覽遮擋。

- [ ] **Step 7: 本機提交管理頁與文件**

```bash
git add index.html tests/frontend-contract.test.js tests/visual-check.mjs README.md
git commit -m "feat: show delayed occupancy work"
```

---

### Task 6: 完整驗證與正式發布閘門

**Files:**
- Verify: `Code.gs`, `index.html`, `tests/*.test.js`, `README.md`
- Formal Sheet: `請假代課紀錄` Z:AB（只在另行核准後追加）

**Interfaces:**
- Consumes: Tasks 1–5 的完整分支。
- Produces: 可供 review 的乾淨功能分支；正式部署只在使用者再次明確核准後執行。

- [ ] **Step 1: 執行 Apps Script 語法與完整測試**

Run:

```bash
cp Code.gs /private/tmp/substitute-ordinary-delay-check.js
node --check /private/tmp/substitute-ordinary-delay-check.js
node --test tests/*.test.js
node tests/visual-check.mjs
git diff --check
git status --short --branch
```

Expected: 語法檢查通過；全部測試與桌機／手機視覺檢查通過；工作樹只含已確認範圍。

- [ ] **Step 2: 檢查提交與正式影響**

Run:

```bash
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff -- Code.gs index.html tests README.md docs/superpowers
```

Expected: 只包含一般代課延後、占用核對、測試與文件；沒有 secrets、正式 Sheet 匯出檔或無關修改。

- [ ] **Step 3: 停在正式發布核准閘門**

向使用者回報：分支、commit、完整測試數、視覺檢查、預計追加的 Z:AB 欄位，以及正式 Sheet 尚未被讀寫。等待使用者明確核准以下每一項後才執行。為避免新程式先要求 Z:AB 而造成正式站讀取失敗，正式順序固定如下：

```text
1. 備份正式「請假代課紀錄」。
2. 推送功能分支並建立 Draft PR；合併／推送 main 仍另行確認。
3. 經核准後執行 clasp push --force，把程式送到 GAS HEAD，但暫不更新正式 deployment。
4. 在 Apps Script HEAD 明確執行 ensureSystemStructure_()，只追加 Z:AB 三個欄位，隨即讀回標題確認。
5. 建立新 GAS version 並更新正式 deployment。
6. 合併／推送 main 以更新 GitHub Pages 前端。
7. 正式頁面做唯讀 smoke test；不得建立測試代課或改動人工列。
```
