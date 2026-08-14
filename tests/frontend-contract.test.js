const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function createFrontendRuntime(fixtures = {}) {
  const elements = new Map();
  const requestActions = [];
  let claimSubmitted = false;
  const getElement = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: id === 'claim-submit' ? '確認領取勾選課程' : '',
        className: '',
        dataset: {},
        disabled: false,
        hidden: false,
        value: '',
        addEventListener() {},
        focus() {},
        setAttribute() {},
        removeAttribute() {},
        classList: { add() {}, remove() {}, toggle() {} },
      });
    }
    return elements.get(id);
  };
  const claimControls = {
    '.claim-checkbox': { checked: true },
    'input[type="radio"]:checked': { value: 'original' },
    '.claim-editor': { hidden: false },
    '.claim-fields': { hidden: true },
    '.claim-adjustment-panel': { hidden: true },
    '.special-course-panel': { hidden: true },
    '.claim-course-type': { value: '' },
    '.claim-difficulty-select': { value: '' },
    '.new-course-name': { value: '' },
    '.claim-note': { value: '' },
  };
  const claimCard = {
    querySelector(selector) { return claimControls[selector] || null; },
    querySelectorAll() { return []; },
    scrollIntoView() {},
  };
  const checkedClaim = {
    dataset: { substituteId: 'leave-c' },
    checked: true,
    closest() { return claimCard; },
  };
  const document = {
    getElementById: getElement,
    querySelectorAll(selector) {
      if (selector === '.claim-checkbox:checked') return [checkedClaim];
      return [];
    },
    querySelector(selector) {
      return null;
    },
  };
  const responseFor = (url, request = {}) => {
    const isPost = request.method === 'POST';
    const action = isPost
      ? new URLSearchParams(request.body || '').get('action')
      : new URL(url).searchParams.get('action');
    requestActions.push(action);
    if (isPost && action === 'claimSubstitute') claimSubmitted = true;
    if (isPost && action === 'getAvailableSubstitutes' && claimSubmitted) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', data: [] }),
        url,
      });
    }
    const authenticatedReads = new Set([
      'getAvailableSubstitutes', 'getClaimOptions', 'getMySubs',
      'getMyCourses', 'getMyLeaves', 'getAdminDashboard', 'recordInvitationFirstView',
    ]);
    const data = isPost && !authenticatedReads.has(action)
      ? { count: 1 }
      : (fixtures[action] || []);
    const payload = { status: 'success', data };
    return Promise.resolve({ ok: true, status: 200, json: async () => payload, url });
  };
  const context = {
    console,
    document,
    fetch: responseFor,
    URLSearchParams,
    CSS: { escape: (value) => String(value) },
    window: {
      localStorage: { getItem() { return ''; }, setItem() {} },
      scrollTo() {},
      setTimeout() {},
    },
  };
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.createContext(context);
  vm.runInContext(script, context, { filename: 'index.html' });
  return { context, elements, getElement, claimCard, claimControls, requestActions };
}

test('keeps API secrets out of the public frontend', () => {
  assert.doesNotMatch(html, /eyJ[a-zA-Z0-9_-]+\./);
  assert.doesNotMatch(html, /Authorization\s*:\s*['"]Bearer/i);
  assert.doesNotMatch(html, /OMCEAN_API_TOKEN/);
});

test('does not use no-cors blind success writes', () => {
  assert.doesNotMatch(html, /mode\s*:\s*['"]no-cors['"]/);
  assert.match(html, /status\s*!==\s*['"]success['"]/);
});

test('submits structured claim adjustments by UUID', () => {
  assert.match(html, /代課編號/);
  assert.match(html, /substituteId/);
  assert.match(html, /handlingType/);
  assert.match(html, /actualClassId/);
  assert.match(html, /actualCourseName/);
  assert.match(html, /category/);
  assert.match(html, /difficulty/);
  assert.match(html, /note/);
});

test('keeps the three required workflows and mobile viewport', () => {
  assert.match(html, /name=['"]viewport['"]/);
  assert.match(html, /請假登記/);
  assert.match(html, /尋找與領取代課/);
  assert.match(html, /查看我的代課紀錄/);
});

test('shows backend errors instead of always claiming success', () => {
  assert.match(html, /throw new Error\(payload\.message/);
  assert.match(html, /catch\s*\(error\)/);
});

test('keeps dashboard rendering alive when the optional icon library throws', () => {
  const { context } = createFrontendRuntime();
  context.console = { warn() {} };
  context.window.lucide = {
    createIcons() {
      throw new SyntaxError('The string did not match the expected pattern.');
    },
  };

  assert.doesNotThrow(() => context.refreshIcons());
});

test('does not present unloaded admin counts as real zero values', () => {
  assert.doesNotMatch(html, /data-admin-count="[^"]+">0<\/span>/);
  assert.match(html, /function setAdminCountsUnavailable\(\)/);
});

test('locks the leave pause button until the mutation and dashboard refresh finish', async () => {
  const { context, getElement } = createFrontendRuntime();
  let finishPauseRequest;
  context.fetch = (url, request = {}) => {
    const action = new URLSearchParams(request.body || '').get('action');
    if (action === 'pauseLeaves') {
      return new Promise((resolve) => {
        finishPauseRequest = () => resolve({
          ok: true,
          status: 200,
          json: async () => ({ status: 'success', data: { paused: true } }),
        });
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        data: {
          leavePaused: true,
          pendingInvitations: [],
          activeInvitees: [],
          obWork: [],
          changeRequests: [],
          exceptions: [],
          completed: [],
          teachers: [],
          replacementOptions: [],
        },
      }),
    });
  };

  const pending = context.toggleAdminLeavePause();
  assert.equal(getElement('admin-leave-pause').disabled, true);
  finishPauseRequest();
  await pending;
  assert.equal(getElement('admin-leave-pause').disabled, false);
});

test('provides teacher login and sends credentials through form-encoded POST', () => {
  assert.match(html, /id=["']login-form["']/);
  assert.match(html, /id=["']login-teacher["']/);
  assert.match(html, /id=["']login-pin["']/);
  assert.match(html, /callPostApi\(["']login["']/);
  assert.match(html, /application\/x-www-form-urlencoded/);
  assert.match(html, /method:\s*["']POST["']/);
});

test('keeps session tokens out of URLs by routing every authenticated read through POST', () => {
  assert.match(html, /const PUBLIC_GET_ACTIONS\s*=\s*new Set\(\["getTeachers"\]\)/);
  assert.match(html, /if \(!PUBLIC_GET_ACTIONS\.has\(action\)\) return callPostApi\(action, params\)/);
  assert.doesNotMatch(html, /query\.set\([\s\S]{0,180}sessionToken/);
});

test('implements date-first leave selection with select-all-visible and clear controls', () => {
  assert.match(html, /id=["']leave-date-list["']/);
  assert.match(html, /id=["']select-all-visible-dates["']/);
  assert.match(html, /id=["']clear-leave-dates["']/);
  assert.match(html, /selectedLeaveDates/);
  assert.match(html, /renderLeaveDates/);
  assert.match(html, /renderLeaveCourses/);
});

test('formats teacher-facing dates with a Traditional Chinese weekday', () => {
  const { context } = createFrontendRuntime();

  assert.equal(context.formatDateWithWeekday('2026/09/24'), '2026/09/24（四）');
  assert.equal(context.formatDateWithWeekday('2026-09-24'), '2026/09/24（四）');
  assert.equal(context.formatDateWithWeekday('2026/02/30'), '2026/02/30');
  assert.equal(context.formatDateWithWeekday('日期未設定'), '日期未設定');
});

test('renders weekdays in leave and substitute lists', async () => {
  const { context, getElement } = createFrontendRuntime({
    getMyCourses: [{
      '日期': '2026/09/24',
      '時間': '18:30',
      '課程': 'A－舞綢 Lv.2',
      'OB Calendar ID': 'calendar-weekday',
    }],
    getMyLeaves: [{
      '代課編號': 'leave-weekday',
      '日期': '2026/09/24',
      '時段': '18:30',
      '課程': 'A－舞綢 Lv.2',
      '狀態': '確認中',
    }],
    getAvailableSubstitutes: [{
      '代課編號': 'sub-weekday',
      '原老師': '老師甲',
      '日期': '2026/09/24',
      '時段': '18:30',
      '課程': 'A－舞綢 Lv.2',
      '課程大類': '舞綢',
      '可沿用原課程': true,
    }],
    getClaimOptions: {
      capabilities: ['舞綢'],
      classes: [],
    },
    getMySubs: [{
      '代課編號': 'my-sub-weekday',
      '原老師': '老師乙',
      '日期': '2026/09/24',
      '時段': '20:00',
      '課程': 'A－舞綢 Lv.1',
    }],
  });

  await context.loadMyCourses();
  vm.runInContext('selectedLeaveDates.add("2026/09/24")', context);
  context.renderLeaveCourses();
  vm.runInContext('selectedLeaveCourses.add("calendar-weekday")', context);
  context.updateLeaveConfirmation();
  await context.fetchMyLeaves();
  await context.fetchAvailableSubstitutes();
  await context.fetchMySubs();

  assert.match(getElement('leave-date-list').innerHTML, /2026\/09\/24（四）/);
  assert.match(getElement('leave-course-list').innerHTML, /2026\/09\/24（四） 18:30/);
  assert.match(getElement('leave-confirmation-list').innerHTML, /2026\/09\/24（四） 18:30/);
  assert.match(getElement('my-leaves-list').innerHTML, /2026\/09\/24（四） 18:30/);
  assert.match(getElement('pending-leaves-list').innerHTML, /2026\/09\/24（四）/);
  assert.match(getElement('my-subs-list').innerHTML, /2026\/09\/24（四） 20:00/);
});

test('shows an exact confirmation count and full selected course list', () => {
  assert.match(html, /id=["']leave-confirmation-count["']/);
  assert.match(html, /id=["']leave-confirmation-list["']/);
  assert.match(html, /updateLeaveConfirmation/);
  assert.match(html, /selectedLeaveCourses\.length/);
});

test('submits leave items in bounded POST batches and verifies exact backend totals', () => {
  assert.match(html, /LEAVE_BATCH_SIZE\s*=\s*25/);
  assert.match(html, /callPostApi\(["']submitLeave["']/);
  assert.match(html, /requested/);
  assert.match(html, /created/);
  assert.match(html, /duplicates/);
  assert.match(html, /failed/);
  assert.match(html, /送出結果與勾選堂數不一致/);
});

test('lists every failed leave course and preserves only failed IDs for retry', () => {
  const { context } = createFrontendRuntime();
  const totals = { requested: 0, created: 0, duplicates: 0, failed: 0, errors: [] };
  const batch = [
    { 日期: '2026/08/10', 時間: '18:30', 課程: '空環 Lv.1', 'OB Calendar ID': 'calendar-a' },
    { 日期: '2026/08/11', 時間: '19:30', 課程: '綢吊 Lv.1', 'OB Calendar ID': 'calendar-b' },
  ];

  context.mergeLeaveBatchResult(totals, {
    requested: 2,
    created: 1,
    duplicates: 0,
    failed: 1,
    errors: [{
      index: 1,
      calendarId: 'calendar-b',
      date: '2026/08/11',
      time: '19:30',
      course: '綢吊 Lv.1',
      message: '課程已異動',
    }],
  }, batch);

  assert.deepEqual(JSON.parse(JSON.stringify(totals.errors)), [{
    calendarId: 'calendar-b',
    date: '2026/08/11',
    time: '19:30',
    course: '綢吊 Lv.1',
    message: '課程已異動',
  }]);
  assert.match(context.formatLeaveFailureMessage(totals), /失敗課程：2026\/08\/11 19:30 綢吊 Lv\.1：課程已異動/);
  assert.match(html, /selectedLeaveCourses\s*=\s*new Set\(totals\.errors/);
  assert.match(html, /await fetchMyLeaves\(\)/);
});

test('reports prior successes and keeps every unconfirmed course after a later transport failure', () => {
  const { context } = createFrontendRuntime();
  const totals = { requested: 1, created: 1, duplicates: 0, failed: 0, errors: [] };
  const unconfirmed = [
    { 日期: '2026/08/12', 時間: '20:00', 課程: '空瑜 Lv.1', 'OB Calendar ID': 'calendar-c' },
    { 日期: '2026/08/13', 時間: '21:00', 課程: '舞綢 Lv.2', 'OB Calendar ID': 'calendar-d' },
  ];

  context.appendUnconfirmedLeaveFailures(totals, unconfirmed, '網路中斷');

  assert.equal(totals.created, 1);
  assert.equal(totals.unconfirmed, 2);
  assert.deepEqual(
    JSON.parse(JSON.stringify(totals.errors.map((item) => item.calendarId))),
    ['calendar-c', 'calendar-d']
  );
  const message = context.formatLeaveFailureMessage(totals);
  assert.match(message, /新增 1 堂/);
  assert.match(message, /空瑜 Lv\.1：尚未確認：網路中斷/);
  assert.match(message, /舞綢 Lv\.2：尚未確認：網路中斷/);
  assert.match(html, /appendUnconfirmedLeaveFailures\(totals, items\.slice\(start\), error\.message\)/);
});

test('renders personal leave history details for the logged-in teacher', () => {
  assert.match(html, /我的請假紀錄/);
  assert.match(html, /callApi\(["']getMyLeaves["']/);
  assert.match(html, /實際課程名稱/);
  assert.match(html, /預計難度/);
  assert.match(html, /OB 核對狀態/);
  assert.match(html, /異動狀態/);
});

test('loads substitutes through the invited-only API and claims through the locked POST action', () => {
  assert.match(html, /callApi\(["']getAvailableSubstitutes["']/);
  assert.match(html, /callPostApi\(["']claimSubstitute["']/);
  assert.doesNotMatch(html, /callApi\(["']getPendingLeaves["']/);
  assert.doesNotMatch(html, /callPostApi\(["']submitClaim["']/);
});

test('groups available substitutes by date and keeps the uninvited state neutral', () => {
  assert.match(html, /groupAvailableSubstitutesByDate/);
  assert.match(html, /class=["']claim-date-group["']/);
  assert.match(html, /目前沒有可領取的代課/);
  assert.doesNotMatch(html, /你未受邀|未被邀請|梯次|序位|其他受邀/);
});

test('removes claimed courses immediately and refreshes after a concurrent conflict', () => {
  assert.match(html, /claimedIds/);
  assert.match(html, /pendingLeaves\s*=\s*pendingLeaves\.filter/);
  assert.match(html, /剛被其他老師領取/);
  assert.match(html, /await fetchAvailableSubstitutes\(\)/);
});

test('keeps the claim button disabled after the final available course is claimed', async () => {
  const { context, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [{ classId: 'class-ring', courseName: '空環 Lv.1', category: '空環' }],
    },
    getAvailableSubstitutes: [{
      '代課編號': 'leave-c',
      '原老師': '老師丙',
      '日期': '2026/08/11',
      '時段': '11:00',
      '課程': '空環 Lv.1',
      '課程大類': '空環',
      '可沿用原課程': true,
    }],
  });
  await Promise.resolve();
  await context.fetchAvailableSubstitutes();

  await context.submitClaim();

  assert.equal(getElement('claim-submit').disabled, true);
});

test('uses the protected capability result before deciding whether a course change is required', async () => {
  const { context, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [{ classId: 'class-ring', courseName: '空環 Lv.1', category: '空環' }],
    },
    getAvailableSubstitutes: [{
      '代課編號': 'leave-b',
      '原老師': '老師乙',
      '日期': '2026/08/10',
      '時段': '18:30',
      '課程': '空環 Lv.2',
      '課程大類': '空環',
      '可沿用原課程': true,
    }],
  });
  await Promise.resolve();

  await context.fetchAvailableSubstitutes();

  assert.match(getElement('pending-leaves-list').innerHTML, /value="original"\s+checked/);
  assert.doesNotMatch(getElement('pending-leaves-list').innerHTML, /需要改成可教授的課程/);
});

test('loads protected capability and independent course adjustment options for claims', () => {
  assert.match(html, /callApi\(["']getClaimOptions["']/);
  assert.match(html, /claimOptions/);
  assert.match(html, /claim-course-type/);
  assert.match(html, /claim-difficulty-select/);
  assert.match(html, /課程類型/);
});

test('separates ordinary substitute handling from the special-course flow', () => {
  assert.match(html, /value=["']original["']/);
  assert.match(html, /value=["']existing["']/);
  assert.match(html, /直接認領/);
  assert.match(html, /調整課程類型或難度/);
  assert.doesNotMatch(html, />\s*沿用原課程\s*<\/label>/);
  assert.doesNotMatch(html, />\s*改用既有 OB 課程\s*<\/label>/);
  assert.doesNotMatch(html, /value=["']new["']/);
  assert.doesNotMatch(html, /value=["']__SPECIAL__["']/);
  assert.match(html, /普通代課/);
  assert.match(html, /安排特別課/);
  assert.match(html, /單堂延長/);
  assert.match(html, /合併連續兩堂/);
  assert.match(html, /新課程名稱（概述即可）/);
  assert.doesNotMatch(html, /新課程名稱\s*<span class="claim-required">必填/);
  assert.doesNotMatch(html, /new-difficulty-required/);
  assert.match(html, /claim-course-type/);
  assert.match(html, /claim-difficulty-select/);
  assert.match(html, /claim-note/);
});

test('special-course draft requires one slot or an allowed consecutive pair and a required note', () => {
  const { context } = createFrontendRuntime();
  const availability = {
    'leave-a': { mergePartnerIds: ['leave-b'], maxDurationMinutes: 105 },
    'leave-b': { mergePartnerIds: [], maxDurationMinutes: 240 },
    'leave-c': { mergePartnerIds: [], maxDurationMinutes: 240 },
  };

  assert.throws(() => context.validateSpecialCourseDraft({
    mode: 'vacancy', substituteIds: ['leave-a', 'leave-b'], courseName: '主題課', durationMinutes: 90, note: '內容',
  }, availability), /只能勾選一堂/);
  assert.throws(() => context.validateSpecialCourseDraft({
    mode: 'merge', substituteIds: ['leave-a', 'leave-c'], courseName: '主題課', durationMinutes: 120, note: '內容',
  }, availability), /不是可合併的連續課程/);
  assert.throws(() => context.validateSpecialCourseDraft({
    mode: 'vacancy', substituteIds: ['leave-a'], courseName: '主題課', durationMinutes: 120, note: '內容',
  }, availability), /最多只能安排 105 分鐘/);
  assert.throws(() => context.validateSpecialCourseDraft({
    mode: 'vacancy', substituteIds: ['leave-a'], courseName: '主題課', durationMinutes: 90, note: '',
  }, availability), /備註/);

  assert.deepEqual(JSON.parse(JSON.stringify(context.validateSpecialCourseDraft({
    mode: 'merge', substituteIds: ['leave-b', 'leave-a'], courseName: '主題課', difficulty: '', durationMinutes: 120, note: '兩堂合併',
  }, availability))), {
    mode: 'merge',
    substituteIds: ['leave-b', 'leave-a'],
    courseName: '主題課',
    difficulty: '',
    durationMinutes: 120,
    note: '兩堂合併',
  });
});

test('direct claim strips every editable override from the submitted draft', () => {
  const { context } = createFrontendRuntime();
  const payload = context.validateClaimDraft({
    handlingType: 'original',
    courseTypeKey: '舞綢',
    actualClassId: 'forged-class',
    actualCourseName: '偽造課程',
    category: '舞綢',
    difficulty: 'Lv.9',
    note: '不應寫入',
  }, {
    '代課編號': 'leave-a',
    '課程': '空環 Lv.1',
    '課程大類': '空環',
    '可沿用原課程': true,
  });

  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    substituteId: 'leave-a',
    handlingType: 'original',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: '',
    note: '',
  });
});

test('ordinary adjustment requires a course type but keeps the note optional', () => {
  const { context } = createFrontendRuntime();
  const item = {
    '代課編號': 'leave-cross',
    '課程': '舞綢 Lv.1',
    '課程大類': '舞綢',
    '可沿用原課程': false,
  };

  assert.throws(() => context.validateClaimDraft({
    handlingType: 'original', note: '',
  }, item), /不能沿用原課程/);
  assert.throws(() => context.validateClaimDraft({
    handlingType: 'existing', courseTypeKey: '', difficulty: 'Lv.1', note: '',
  }, item), /課程類型/);
  assert.deepEqual(JSON.parse(JSON.stringify(context.validateClaimDraft({
    handlingType: 'existing', courseTypeKey: '空環', difficulty: 'Lv.1', note: '',
  }, item))), {
    substituteId: 'leave-cross',
    handlingType: 'existing',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: 'Lv.1',
    note: '',
    courseTypeKey: '空環',
  });
  assert.throws(() => context.validateClaimDraft({
    handlingType: 'special', actualCourseName: '', difficulty: '', note: '改課',
  }, item), /課程名稱/);
});

test('special-course handling requires a summary and note but keeps difficulty optional', () => {
  const { context } = createFrontendRuntime();
  const item = {
    '代課編號': 'leave-special',
    '課程': '舞綢 Lv.1',
    '課程大類': '舞綢',
    '可沿用原課程': false,
  };

  assert.throws(() => context.validateClaimDraft({
    handlingType: 'special', actualCourseName: '', difficulty: '', note: '改為特別課',
  }, item), /課程名稱/);
  assert.throws(() => context.validateClaimDraft({
    handlingType: 'special', actualCourseName: '主題編舞', difficulty: '', note: '',
  }, item), /備註/);

  assert.deepEqual(JSON.parse(JSON.stringify(context.validateClaimDraft({
    handlingType: 'special', actualCourseName: '主題編舞', difficulty: '', note: '調整為特別課。',
  }, item))), {
    substituteId: 'leave-special',
    handlingType: 'special',
    actualClassId: '',
    actualCourseName: '主題編舞',
    category: '其他',
    difficulty: '',
    note: '調整為特別課。',
  });
});

test('ordinary notes stay optional even when the apparatus changes', () => {
  const { context } = createFrontendRuntime();
  const item = {
    '課程大類': '空環',
    '可沿用原課程': true,
  };

  assert.equal(context.claimNoteIsRequired(item, 'original', '空環'), false);
  assert.equal(context.claimNoteIsRequired(item, 'existing', '空環'), false);
  assert.equal(context.claimNoteIsRequired(item, 'existing', '舞綢'), false);
  assert.equal(context.claimNoteIsRequired(item, 'special', '其他'), true);
});

test('submits the OB course type and difficulty as independent choices', async () => {
  const { context, claimCard, claimControls } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['地板課程'],
      classes: [
        {
          courseKey: '肩頸舒壓瑜伽 Lv.1', courseName: '肩頸舒壓瑜伽 Lv.1',
          courseTypeKey: '肩頸舒壓瑜伽', courseTypeName: '肩頸舒壓瑜伽',
          difficulty: 'Lv.1', category: '地板課程',
        },
      ],
    },
    getAvailableSubstitutes: [],
  });
  await Promise.resolve();

  await context.fetchAvailableSubstitutes();

  assert.equal(context.findSelectedClaimClass('肩頸舒壓瑜伽', 'Lv.1').courseName, '肩頸舒壓瑜伽 Lv.1');
  claimControls['input[type="radio"]:checked'].value = 'existing';
  claimControls['.claim-course-type'].value = '肩頸舒壓瑜伽';
  claimControls['.claim-difficulty-select'].value = 'Lv.1';
  assert.deepEqual(JSON.parse(JSON.stringify(context.readClaimDraft(claimCard))), {
    handlingType: 'existing',
    actualClassId: '',
    actualCourseName: '肩頸舒壓瑜伽 Lv.1',
    category: '地板課程',
    difficulty: 'Lv.1',
    note: '',
    courseKey: '肩頸舒壓瑜伽 Lv.1',
    courseTypeKey: '肩頸舒壓瑜伽',
  });
});

test('renders separate course type and difficulty selectors instead of class IDs', async () => {
  const { context, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['地板課程'],
      classes: [
        {
          courseKey: '地板瑜伽 Lv.1', courseName: '地板瑜伽 Lv.1',
          courseTypeKey: '地板瑜伽', courseTypeName: '地板瑜伽', difficulty: 'Lv.1',
          category: '地板課程',
        },
        {
          courseKey: '地板瑜伽 Lv.2', courseName: '地板瑜伽 Lv.2',
          courseTypeKey: '地板瑜伽', courseTypeName: '地板瑜伽', difficulty: 'Lv.2',
          category: '地板課程',
        },
      ],
    },
    getAvailableSubstitutes: [{
      '代課編號': 'leave-yoga',
      '日期': '2026/09/04',
      '時段': '11:00',
      '課程': '舞綢 Lv.2',
      '課程大類': '舞綢',
      '原老師': '老師甲',
      '可沿用原課程': false,
    }],
  });

  await context.fetchAvailableSubstitutes();

  const markup = getElement('pending-leaves-list').innerHTML;
  assert.match(markup, /<select class="claim-control claim-course-type">/);
  assert.match(markup, /<option value="地板瑜伽"[^>]*>地板瑜伽<\/option>/);
  assert.match(markup, /<select class="claim-control claim-difficulty-select">/);
  assert.doesNotMatch(markup, />389<\/option>/);
  assert.doesNotMatch(markup, /課程代碼/);
});

test('renders the substitute list without waiting for first-view tracking', async () => {
  const neverFinishes = new Promise(() => {});
  const { context, getElement, requestActions } = createFrontendRuntime({
    getAvailableSubstitutes: [{
      '代課編號': 'leave-fast-list',
      '日期': '2026/09/04',
      '時段': '11:00',
      '課程': 'B－舞綢 Lv.2',
      '課程大類': '舞綢',
      '原老師': '老師甲',
      '可沿用原課程': true,
    }],
    getClaimOptions: { capabilities: ['舞綢'], classes: [] },
    recordInvitationFirstView: neverFinishes,
  });

  const rendered = await Promise.race([
    context.fetchAvailableSubstitutes().then(() => true),
    new Promise((resolve) => setImmediate(() => resolve(false))),
  ]);

  assert.equal(rendered, true);
  assert.match(getElement('pending-leaves-list').innerHTML, /B－舞綢 Lv\.2/);
  assert.equal(requestActions.includes('recordInvitationFirstView'), true);
});

test('waits for the substitute list before starting claim options', async () => {
  let resolveSubstitutes;
  const substitutes = new Promise((resolve) => {
    resolveSubstitutes = resolve;
  });
  const { context, requestActions } = createFrontendRuntime({
    getAvailableSubstitutes: substitutes,
    getClaimOptions: { capabilities: [], classes: [] },
  });

  const loading = context.fetchAvailableSubstitutes();
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(
    requestActions.filter((action) => action === 'getAvailableSubstitutes' || action === 'getClaimOptions'),
    ['getAvailableSubstitutes'],
  );

  resolveSubstitutes([]);
  await loading;

  assert.deepEqual(
    requestActions.filter((action) => action === 'getAvailableSubstitutes' || action === 'getClaimOptions'),
    ['getAvailableSubstitutes', 'getClaimOptions'],
  );
});

test('direct claim hides all fields while adjustment shows independent selectors', () => {
  const { context, claimCard, claimControls } = createFrontendRuntime();

  claimControls['input[type="radio"]:checked'].value = 'original';
  context.updateClaimCardState(claimCard);
  assert.equal(claimControls['.claim-fields'].hidden, true);
  assert.equal(claimControls['.claim-adjustment-panel'].hidden, true);

  claimControls['input[type="radio"]:checked'].value = 'existing';
  context.updateClaimCardState(claimCard);
  assert.equal(claimControls['.claim-fields'].hidden, false);
  assert.equal(claimControls['.claim-adjustment-panel'].hidden, false);
});

test('teacher records expose cancel and withdraw request actions', () => {
  assert.match(html, /callPostApi\(["']cancelLeave["']/);
  assert.match(html, /callPostApi\(["']requestLeaveCancellation["']/);
  assert.match(html, /callPostApi\(["']requestClaimWithdrawal["']/);
  assert.match(html, /申請取消/);
  assert.match(html, /申請退出代課/);
});

test('groups the two source rows of one special course without losing their IDs', () => {
  const { context } = createFrontendRuntime();
  const groups = context.groupSpecialCourseItems([
    { '代課編號': 'leave-a', 'OB Calendar ID': 'cal-a', '特別課群組 ID': 'group-1' },
    { '代課編號': 'leave-b', 'OB Calendar ID': 'cal-b', '特別課群組 ID': 'group-1' },
    { '代課編號': 'leave-c', 'OB Calendar ID': 'cal-c', '特別課群組 ID': '' },
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].specialGroupId, 'group-1');
  assert.deepEqual(JSON.parse(JSON.stringify(groups[0].items.map((item) => item['代課編號']))), ['leave-a', 'leave-b']);
  assert.deepEqual(JSON.parse(JSON.stringify(groups[0].items.map((item) => item['OB Calendar ID']))), ['cal-a', 'cal-b']);
  assert.deepEqual(JSON.parse(JSON.stringify(groups[1].items.map((item) => item['代課編號']))), ['leave-c']);
  assert.match(html, /特別課群組/);
  assert.match(html, /OB Calendar ID/);
});

test('admin-only dashboard provides all work queues and required actions', () => {
  assert.match(html, /id=["']view-admin["']/);
  assert.match(html, /待邀請/);
  assert.match(html, /邀請中/);
  assert.match(html, /待處理 OB/);
  assert.match(html, /取消.*退出/);
  assert.match(html, /核對異常/);
  assert.match(html, /已完成/);
  assert.match(html, /callApi\(["']getAdminDashboard["']/);
  assert.match(html, /callPostApi\(["']openInvitations["']/);
  assert.match(html, /callPostApi\(["']closeInvitations["']/);
  assert.match(html, /callPostApi\(["']pauseClaims["']/);
  assert.match(html, /callPostApi\(["']syncObCalendar["']/);
  assert.match(html, /callPostApi\(["']reconcileObChanges["']/);
  assert.match(html, /callPostApi\(["']linkReplacementCalendarItem["']/);
  assert.match(html, /callPostApi\(["']resolveChangeRequest["']/);
  assert.match(html, /複製 LINE 邀請文字/);
});

test('copies the production classroom URL with the LINE substitute invitation', () => {
  assert.match(
    html,
    /您好，目前有新的代課可以領取，請登入 Sherry Aerial Studio 教室管理系統查看，謝謝。\\nhttps:\/\/sherryaerial-web\.github\.io\/sub\.html\//
  );
});

test('pending invitation queue shows courses before the responsive teacher picker', () => {
  const start = html.indexOf('activeAdminTab === "pendingInvitations"');
  const end = html.indexOf('activeAdminTab === "activeInvitees"', start);
  const pendingBlock = html.slice(start, end);

  assert.ok(start >= 0 && end > start, 'pending invitation render block should exist');
  assert.match(pendingBlock, /const pendingItems = data\.pendingInvitations \|\| \[\]/);
  assert.match(pendingBlock, /pendingItems\.length \? `/);
  assert.match(pendingBlock, /class="invite-teacher-panel"/);
  assert.match(pendingBlock, /class="invite-teacher-placeholder"/);
  assert.match(pendingBlock, /目前沒有待邀請課程/);
  assert.match(pendingBlock, /matchMedia\("\(min-width: 761px\)"\)/);
  assert.ok(
    pendingBlock.indexOf('renderAdminItems(pendingItems') < pendingBlock.indexOf('inviteTeacherPanel'),
    'course list should be assembled before the teacher picker'
  );
});

test('payroll admin can adjust salaries and finalize teacher-confirmed results', () => {
  assert.match(html, /callPostApi\(["']adjustPayrollSummary["']/);
  assert.match(html, /callPostApi\(["']finalizePayroll["']/);
  assert.match(html, /調整薪資/);
  assert.match(html, /管理員確認/);
  assert.match(html, /確認全部已核對/);
  assert.match(html, /管理員已確認/);
  assert.match(html, /\.payroll-admin-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(html, /data\.metrics\.teacherConfirmed\s*\|\|\s*0/);
  assert.match(html, /data\.metrics\.finalized\s*\|\|\s*0/);
});

test('course admin can pause leave registration separately from substitute claims', () => {
  assert.match(html, /callPostApi\(["']pauseLeaves["']/);
  const adminHeaderStart = html.indexOf('id="view-admin"');
  const adminHeaderEnd = html.indexOf('id="admin-summary"', adminHeaderStart);
  const adminHeader = html.slice(adminHeaderStart, adminHeaderEnd);

  assert.match(adminHeader, /id=["']admin-leave-pause["']/);
  assert.match(html, /byId\(["']admin-leave-pause["']\)\.addEventListener\(["']click["']/);
  assert.match(html, /#view-admin\s+\.admin-header-actions\s*\{[^}]*flex-wrap:\s*nowrap/s);
  assert.match(html, /暫停請假登記/);
});

test('OB sync button shows progress and keeps the completed row count visible', () => {
  assert.match(html, /id=["']admin-sync-status["'][^>]*aria-live=["']polite["']/);
  assert.match(html, /adminSyncButton\.disabled\s*=\s*true/);
  assert.match(html, /同步中/);
  assert.match(html, /已同步\s*\$\{result\.count\}\s*筆/);
  assert.match(html, /同步失敗/);
  assert.match(html, /finally\s*\{[^}]*adminSyncButton\.disabled\s*=\s*false/s);
});

test('admin can refresh the active dashboard without reloading or losing login state', () => {
  assert.match(html, /id=["']admin-refresh["']/);
  assert.match(html, /function\s+refreshAdminData\s*\(/);
  assert.match(html, /byId\(["']admin-refresh["']\)\.addEventListener\(["']click["']/);
  assert.doesNotMatch(html, /window\.location\.reload\s*\(/);
});

test('persists and validates the authenticated session for every user device', () => {
  assert.match(html, /const\s+AUTH_SESSION_KEY\s*=/);
  assert.match(html, /function\s+saveSession\s*\(/);
  assert.match(html, /function\s+readSavedSession\s*\(/);
  assert.match(html, /function\s+clearSavedSession\s*\(/);
  assert.match(html, /callPostApi\(["']getSession["']/);
  assert.match(html, /window\.localStorage\.removeItem\(AUTH_SESSION_KEY\)/);
});

test('management entry stays hidden without capabilities and is enabled by authenticated capabilities', () => {
  assert.match(html, /id=["']admin-entry["'][^>]*hidden/);
  assert.match(html, /managementCapabilities/);
  assert.match(html, /admin-entry["']\)\.hidden\s*=\s*!authState\.managementCapabilities\.length/);
  assert.doesNotMatch(html, /viewId\s*===\s*["']view-admin["']\s*&&\s*authState\.role\s*!==\s*["']管理員["']/);
});

test('uses the approved Morandi taupe operations design system', () => {
  assert.match(html, /--sea-700:\s*#786c64/i);
  assert.match(html, /--aqua-100:\s*#eee0dc/i);
  assert.match(html, /--coral-600:\s*#8f5f68/i);
  assert.match(html, /--shadow-sm:/);
  assert.match(html, /\.app-layout\s*\{/);
  assert.match(html, /\.workspace\s*\{/);
  assert.match(html, /max-width:\s*1180px/);
});

test('uses lucide icons and accessible icon controls throughout navigation', () => {
  assert.match(html, /unpkg\.com\/lucide/);
  assert.match(html, /class=["'][^"']*primary-nav[^"']*["']/);
  assert.match(html, /data-lucide=["']layout-dashboard["']/);
  assert.match(html, /data-lucide=["']log-out["']/);
  assert.match(html, /id=["']logout-button["'][^>]*aria-label=["']登出["']/);
  assert.match(html, /function\s+refreshIcons\s*\(/);
});

test('keeps the eight capability-scoped admin tabs accessible and exposes their queue counts', () => {
  assert.equal((html.match(/role=["']tab["']/g) || []).length, 8);
  assert.match(html, /aria-selected=["']true["']/);
  assert.match(html, /class=["']admin-tab-count["']/);
  assert.match(html, /data-capability=["']course_admin["']/);
  assert.match(html, /data-capability=["']payroll_admin["']/);
  assert.match(html, /data-capability=["']vvip_admin["']/);
  assert.match(html, /updateAdminTabCounts/);
});

test('provides self-only payroll review and protected sync publish dispute controls', () => {
  assert.match(html, /data-view=["']view-payroll["']/);
  assert.match(html, /getMyPayroll/);
  assert.match(html, /confirmPayroll/);
  assert.match(html, /submitPayrollDispute/);
  assert.match(html, /getPayrollAdminDashboard/);
  assert.match(html, /syncPayrollMonth/);
  assert.match(html, /publishPayroll/);
  assert.match(html, /resolvePayrollDispute/);
});

test('admin queue rendering does not leak Array.map indexes into cards', () => {
  assert.doesNotMatch(html, /\.map\(renderAdminItem\)/);
  assert.match(html, /rows\.map\(\(row\)\s*=>\s*renderRow\(row\)\)/);
});

test('optimizes login and navigation for the supplied four-digit PIN workflow', () => {
  assert.match(html, /id=["']login-pin["'][^>]*maxlength=["']4["']/s);
  assert.match(html, /id=["']login-pin["'][^>]*pattern=["']\[0-9\]\{4\}["']/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.primary-nav\s*\{[\s\S]*position:\s*static/);
  assert.doesNotMatch(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.primary-nav\s*\{[\s\S]*position:\s*fixed[\s\S]*bottom:\s*0/);
});
