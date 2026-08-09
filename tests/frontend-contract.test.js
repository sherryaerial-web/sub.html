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
      'getMyCourses', 'getMyLeaves', 'getAdminDashboard',
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
  assert.match(html, /\.map\(\(item\)\s*=>\s*renderAdminItem\(item\)\)/);
});

test('optimizes login and navigation for the supplied four-digit PIN workflow', () => {
  assert.match(html, /id=["']login-pin["'][^>]*maxlength=["']4["']/s);
  assert.match(html, /id=["']login-pin["'][^>]*pattern=["']\[0-9\]\{4\}["']/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.primary-nav\s*\{[\s\S]*position:\s*static/);
  assert.doesNotMatch(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.primary-nav\s*\{[\s\S]*position:\s*fixed[\s\S]*bottom:\s*0/);
});
