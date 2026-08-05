const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function createFrontendRuntime(fixtures = {}) {
  const elements = new Map();
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
        classList: { add() {}, remove() {}, toggle() {} },
      });
    }
    return elements.get(id);
  };
  const claimControls = {
    '.claim-checkbox': { checked: true },
    'input[type="radio"]:checked': { value: 'original' },
    '.claim-editor': { hidden: false },
    '.existing-class-panel': { hidden: true },
    '.existing-class-search': { value: '' },
    '.new-course-name': { value: '' },
    '.new-course-category': { value: '' },
    '.claim-difficulty': { value: '' },
    '.claim-note': { value: '' },
    '.new-difficulty-required': { hidden: true },
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
    if (isPost && action === 'claimSubstitute') claimSubmitted = true;
    if (!isPost && action === 'getAvailableSubstitutes' && claimSubmitted) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', data: [] }),
        url,
      });
    }
    const data = isPost ? { count: 1 } : (fixtures[action] || []);
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
  return { context, elements, getElement, claimCard, claimControls };
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

test('provides teacher login and sends credentials through form-encoded POST', () => {
  assert.match(html, /id=["']login-form["']/);
  assert.match(html, /id=["']login-teacher["']/);
  assert.match(html, /id=["']login-pin["']/);
  assert.match(html, /callPostApi\(["']login["']/);
  assert.match(html, /application\/x-www-form-urlencoded/);
  assert.match(html, /method:\s*["']POST["']/);
});

test('implements date-first leave selection with select-all-visible and clear controls', () => {
  assert.match(html, /id=["']leave-date-list["']/);
  assert.match(html, /id=["']select-all-visible-dates["']/);
  assert.match(html, /id=["']clear-leave-dates["']/);
  assert.match(html, /selectedLeaveDates/);
  assert.match(html, /renderLeaveDates/);
  assert.match(html, /renderLeaveCourses/);
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

test('loads protected capability and searchable existing-class options for claims', () => {
  assert.match(html, /callApi\(["']getClaimOptions["']/);
  assert.match(html, /claimOptions/);
  assert.match(html, /class-search/);
  assert.match(html, /existing-class/);
  assert.match(html, /搜尋 OB 現有課程/);
});

test('renders all three handling types with difficulty and an always-available note', () => {
  assert.match(html, /value=["']original["']/);
  assert.match(html, /value=["']existing["']/);
  assert.match(html, /value=["']new["']/);
  assert.match(html, /沿用原課程/);
  assert.match(html, /改用既有 OB 課程/);
  assert.match(html, /需要新增課程/);
  assert.match(html, /claim-difficulty/);
  assert.match(html, /claim-note/);
});

test('same-apparatus original handling allows optional difficulty and note', () => {
  const { context } = createFrontendRuntime();
  const payload = context.validateClaimDraft({
    handlingType: 'original',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: '',
    note: '',
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

test('cross-apparatus handling requires a structured course change and note', () => {
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
    handlingType: 'existing', actualClassId: 'class-ring', category: '空環', note: '',
  }, item), /備註/);
  assert.throws(() => context.validateClaimDraft({
    handlingType: 'new', actualCourseName: '', category: '空環', difficulty: 'Lv.1', note: '改課',
  }, item), /課程名稱/);
});

test('marks the note required as soon as a same-capability teacher chooses another apparatus', () => {
  const { context } = createFrontendRuntime();
  const item = {
    '課程大類': '空環',
    '可沿用原課程': true,
  };

  assert.equal(context.claimNoteIsRequired(item, 'original', '空環'), false);
  assert.equal(context.claimNoteIsRequired(item, 'existing', '空環'), false);
  assert.equal(context.claimNoteIsRequired(item, 'existing', '舞綢'), true);
});

test('keeps duplicate course names distinct by classId in the existing-class selector', async () => {
  const { context, getElement, claimCard, claimControls } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [
        { classId: 'class-ring-1', courseName: '空環 Lv.1', category: '空環' },
        { classId: 'class-ring-2', courseName: '空環 Lv.1', category: '空環' },
      ],
    },
    getAvailableSubstitutes: [],
  });
  await Promise.resolve();

  await context.fetchAvailableSubstitutes();

  assert.equal(context.findSelectedClaimClass('class-ring-2').classId, 'class-ring-2');
  assert.match(getElement('existing-class-options').innerHTML, /value="class-ring-1"/);
  assert.match(getElement('existing-class-options').innerHTML, /value="class-ring-2"/);
  claimControls['input[type="radio"]:checked'].value = 'existing';
  claimControls['.existing-class-search'].value = 'class-ring-2';
  assert.deepEqual(JSON.parse(JSON.stringify(context.readClaimDraft(claimCard))), {
    handlingType: 'existing',
    actualClassId: 'class-ring-2',
    actualCourseName: '空環 Lv.1',
    category: '空環',
    difficulty: '',
    note: '',
  });
});

test('teacher records expose cancel and withdraw request actions', () => {
  assert.match(html, /callPostApi\(["']cancelLeave["']/);
  assert.match(html, /callPostApi\(["']requestLeaveCancellation["']/);
  assert.match(html, /callPostApi\(["']requestClaimWithdrawal["']/);
  assert.match(html, /申請取消/);
  assert.match(html, /申請退出代課/);
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

test('admin entry stays hidden for teachers and is enabled only by the authenticated role', () => {
  assert.match(html, /id=["']admin-entry["'][^>]*hidden/);
  assert.match(html, /admin-entry["']\)\.hidden\s*=\s*authState\.role\s*!==\s*["']管理員["']/);
});
