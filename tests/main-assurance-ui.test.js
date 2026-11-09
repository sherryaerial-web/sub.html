const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repo = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
const modulePath = path.join(repo, 'main-assurance-ui.js');
const ui = () => fs.existsSync(modulePath) ? require(modulePath) : {};

function runtime(options = {}) {
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, {
      id, innerHTML: '', hidden: false, dataset: {}, value: '', disabled: false,
      setAttribute() {}, removeAttribute() {}, querySelector() { return null; },
      querySelectorAll() { return []; }, classList: { add() {}, remove() {}, toggle() {} },
    });
    return elements.get(id);
  };
  const context = vm.createContext({
    console, URL, URLSearchParams, Set, Map, Date, Intl,
    document: { getElementById: element, querySelectorAll: () => [], querySelector: () => null },
    window: { SherryMainAssurance: ui(), addEventListener() {}, localStorage: options.storage,
      scrollY: 0, scrollTo(position) { this.scrollY = position.top; },
      requestAnimationFrame(callback) { callback(); }, crypto: { randomUUID: () => '12345678-1234-1234-1234-123456789012' } },
    navigator: {}, CSS: { escape: String }, setTimeout, clearTimeout,
  });
  const script = html.match(/<script>\s*(const APP_URL[\s\S]*?)<\/script>/)[1];
  vm.runInContext(script.slice(0, script.indexOf('    byId("login-form").addEventListener')), context);
  vm.runInContext(`authState.sessionToken = 'local'; authState.teacherName = '管理員';
    authState.managementCapabilities = ['course_admin', 'payroll_admin'];`, context);
  return { context, element, run: code => vm.runInContext(code, context) };
}

const exception = (overrides = {}) => ({ key: 'case-1', targetId: 'ob-1', kind: '核對異常',
  date: '2026/11/10', time: '18:00', courseName: '空環', teacherName: 'Tako',
  verificationStatus: '核對異常', resolved: true,
  tracking: { owner: '管理員', status: 'open', note: '待核對', followAt: '2026-11-10T12:00', version: 2 },
  ...overrides });

test('index retains all required wrappers, isolated delegation and course-only source host', () => {
  for (const signature of ['renderMainDataStatus(status)', 'renderMainRuleCatalogue(catalogue)',
    'renderClosureAssessment(assessment)', 'renderPayrollComparison(comparison)']) {
    assert.ok(html.includes(`function ${signature}`), signature);
  }
  assert.match(html, /data-admin-tab="mainOperations"[^>]*data-capability="course_admin"/);
  assert.match(html, /mainOperations:\s*"courses"/);
  assert.match(html, /id="main-course-source"/);
  assert.match(html, /closest\("\[data-main-action\]"\)/);
  assert.doesNotMatch(html, /已依 23:40 最低人數整理「各缺一」/);
});

test('data source states distinguish snapshots, mixed times, stale and unavailable', () => {
  const m = ui();
  assert.equal(typeof m.renderDataStatus, 'function');
  const snapshot = m.renderDataStatus({ source: 'course_snapshot', status: 'snapshot',
    oldestAt: '2026-11-09 10:00:00', lastSuccessAt: '2026-11-09 10:05:00', mixed: true });
  assert.match(snapshot, /課表同步快照/);
  assert.match(snapshot, /10:00:00/);
  assert.match(snapshot, /10:05:00/);
  assert.match(snapshot, /不同同步時間/);
  assert.match(m.renderDataStatus({ source: 'ob_live', status: 'cached' }), /快取/);
  assert.match(m.renderDataStatus({ status: 'stale', warning: '同步過期' }), /同步過期/);
  assert.match(m.renderDataStatus(null), /未取得|未知/);
  assert.match(m.renderDataStatus({ status: 'unavailable' }), /未取得|失敗|無法取得/);
});

test('closure rules render actual precedence, history and errors without confirmation controls', () => {
  const m = ui();
  assert.equal(typeof m.renderRuleCatalogue, 'function');
  const result = m.renderRuleCatalogue({ version: 'rules-1', updatedAt: '2026-11-09',
    stages: ['22:30 只取消 0 人'], rules: [{ priority: 1, key: 'floor', condition: '2 點地板優惠',
      minimumEnrollment: 3, label: '至少 3 人' }], notes: ['前面的規則優先'],
    history: [{ date: '2026-11-08', change: '門檻調整' }] });
  assert.match(result, /<details/);
  for (const word of ['rules-1', '2 點地板優惠', '至少 3 人', '門檻調整', '22:30']) assert.ok(result.includes(word));
  assert.doesNotMatch(result, /<button|preview|approve/);
  assert.match(m.renderRuleCatalogue(null), /規則.*未取得/);
  assert.match(m.renderRuleCatalogue({ error: '規則讀取失敗' }), /規則讀取失敗/);
});

test('closure assessment exposes live failures and unavailable baseline separately from no change', () => {
  const m = ui();
  assert.equal(typeof m.renderClosureAssessment, 'function');
  const result = m.renderClosureAssessment({ verified: true, baselineAvailable: false, targetDate: '2026/11/10',
    dataStatus: { source: 'ob_live', status: 'live' }, items: [{ calendarId: 'ob-1', time: '18:00',
      courseName: '空環', teacherName: 'Tako', points: null, enrollmentCount: 0, minimumEnrollment: 3,
      shortage: 3, decision: '未達門檻', ruleLabel: '一般課', reason: '未達 3 人' }], impacts: [] });
  assert.match(result, /尚無.*基準/);
  assert.doesNotMatch(result, /沒有變更|無變更/);
  for (const word of ['ob-1', '未達門檻', '未達 3 人', 'Tako']) assert.ok(result.includes(word));
  const failed = m.renderClosureAssessment({ verified: false, items: [], baselineAvailable: false,
    dataStatus: { status: 'stale', warning: 'OB 背景檢查未成功' } });
  assert.match(failed, /未成功/);
  assert.doesNotMatch(failed, /目前沒有未達|全部.*符合/);
  const changed = m.renderClosureAssessment({ verified: true, baselineAvailable: true, baselineAt: '2026-11-09 10:00',
    items: [], impacts: [{ calendarId: 'ob-2', courseName: '柔軟度', beforeMinimum: 2,
      afterMinimum: 3, beforeRule: '舊規則', afterRule: '新規則' }] });
  for (const word of ['ob-2', '舊規則', '新規則', '10:00']) assert.ok(changed.includes(word));
});

test('payroll rules include inclusive effective months and apply-this-month state', () => {
  const m = ui();
  assert.equal(typeof m.renderRuleCatalogue, 'function');
  const result = m.renderRuleCatalogue({ month: '2026-11', policies: ['自主練習不計薪'], rules: [
    { teacherName: 'Tako', billingType: '級距', threshold: 3, amount: 800, courseKeyword: '空環',
      effectiveMonth: '2026-10', throughMonth: '2026-11', appliesThisMonth: true },
    { teacherName: 'Jina', amount: 900, effectiveMonth: '2026-12', appliesThisMonth: false },
  ] });
  for (const word of ['薪資規則', '2026-10', '2026-11', '本月適用', '本月不適用', '自主練習不計薪']) assert.ok(result.includes(word));
});

test('payroll comparison shows teacher and course deltas but never invents a missing baseline', () => {
  const m = ui();
  assert.equal(typeof m.renderPayrollComparison, 'function');
  const missing = m.renderPayrollComparison({ version: 'v1', baselineAvailable: false, items: [], teachers: [], totalDelta: 0 });
  assert.match(missing, /尚無前一版/);
  assert.doesNotMatch(missing, /沒有差異|差額.*0/);
  const result = m.renderPayrollComparison({ version: 'v2', baselineVersion: 'v1', baselineAvailable: true, totalDelta: -50,
    items: [{ calendarId: 'ob-1', teacherName: 'Tako', courseName: '空環', beforeAmount: 800,
      afterAmount: 700, delta: -100, reason: '人數變更' }],
    teachers: [{ teacherName: 'Tako', beforeAmount: 850, afterAmount: 800, delta: -50, reason: '單月扣款變更' }] });
  for (const word of ['v2', 'v1', 'ob-1', '人數變更', '單月扣款變更', '-50', '-100']) assert.ok(result.includes(word));
  assert.match(m.renderPayrollComparison({ error: '無法讀取差異' }), /無法讀取差異/);
});

test('all first-five renderers escape remote text and do not mutate their inputs', () => {
  const m = ui();
  const payload = '<img src=x onerror=alert(1)>';
  const cases = [
    ['renderDataStatus', { status: 'unknown', warning: payload }],
    ['renderRuleCatalogue', { version: payload, rules: [{ condition: payload, label: payload }] }],
    ['renderClosureAssessment', { verified: true, baselineAvailable: false, items: [{ courseName: payload }] }],
    ['renderPayrollComparison', { baselineAvailable: true, items: [{ reason: payload }], teachers: [] }],
  ];
  for (const [name, input] of cases) {
    assert.equal(typeof m[name], 'function', name);
    const before = JSON.stringify(input);
    const result = m[name](input);
    assert.doesNotMatch(result, /<img/);
    assert.ok(result.includes('&lt;img'));
    assert.equal(JSON.stringify(input), before);
  }
});

test('tasks sort by urgency then followup/date without changing original order and link target tabs', () => {
  const m = ui();
  assert.equal(typeof m.renderTasks, 'function');
  const tasks = [
    { key: 'later', label: '稍後處理', tab: 'obWork', targetId: 'late-id', urgency: 'normal', date: '2026/11/10' },
    { key: 'urgent', label: '立即核對', tab: 'exceptions', targetId: 'urgent-id', urgency: 'urgent', date: '2026/11/11', owner: '管理員' },
  ];
  const before = JSON.stringify(tasks);
  const result = m.renderTasks(tasks);
  assert.ok(result.indexOf('立即核對') < result.indexOf('稍後處理'));
  assert.match(result, /data-admin-go-tab="exceptions"/);
  assert.match(result, /urgent-id/);
  assert.equal(JSON.stringify(tasks), before);
  assert.match(m.renderTasks(undefined), /未取得/);
  assert.match(m.renderTasks([]), /目前沒有待辦/);
});

test('operations renders cases, canonical identity choices and strictly read-only notice states', () => {
  const m = ui();
  assert.equal(typeof m.renderOperations, 'function');
  const result = m.renderOperations({ exceptions: [exception()],
    identities: [{ instructorId: 'ob-teacher-1', obNames: ['OB 別名'], teacherName: 'Tako',
      status: 'active', version: 3, verifiedAt: '2026-11-09 12:00' }],
    notificationTracking: [{ eventKey: 'notice-1', title: '課程通知', relatedId: 'ob-1',
      inbox: { status: 'accepted', recipients: 2, read: 0 },
      push: { status: 'accepted', detail: '服務已接受' }, line: { status: 'unknown', detail: '結果不明' } }],
  }, { teacherName: '管理員', teachers: ['Tako', 'Jina'] });
  for (const word of ['main-course-history-form', 'OB Calendar ID', 'case-1', '待核對', '2026-11-10T12:00',
    'OB 別名', 'ob-teacher-1', 'expectedVersion', 'notice-1', '已接受', '未知']) assert.ok(result.includes(word), word);
  assert.match(result, /<option value="Jina"/);
  assert.doesNotMatch(result, /已送達|推送成功|批次|全部承接|全部結案/);
  assert.match(result, /已讀[^<]*0/);
});

test('operations follows the current backend Chinese identity and task states', () => {
  const m = ui();
  const result = m.renderOperations({ exceptions: [], identities: [
    { instructorId: '60001', obNames: ['OB 名稱'], teacherName: 'Tako', status: '啟用', version: 1 },
  ], notificationTracking: [{ title: '通知', inbox: { status: '已建立', recipients: 2, read: 1 },
    push: { status: 'accepted' }, line: { status: 'not_applicable' } }] }, { teachers: ['Tako'], teacherName: '管理員' });
  assert.match(result, /data-main-action="unlink-identity"/);
  assert.match(result, /已建立紀錄/);
  assert.match(result, /不適用/);
  assert.doesNotMatch(result, /未知（已建立）/);
  const tasks = m.renderTasks([
    { key: 'normal', label: '待處理課程', urgency: '待處理', date: '2026/11/10', tab: 'obWork' },
    { key: 'urgent', label: '逾期課程', urgency: '已逾期', date: '2026/11/11', tab: 'obWork' },
  ]);
  assert.ok(tasks.indexOf('逾期課程') < tasks.indexOf('待處理課程'));
  assert.match(tasks, /已逾期/);
});

test('rendered tables and source containers have bounded inner scrolling on mobile', () => {
  const cssPath = path.join(repo, 'main-assurance-ui.css');
  assert.ok(fs.existsSync(cssPath));
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.match(css, /\.main-table-scroll\s*\{[^}]*max-width:\s*100%[^}]*overflow-x:\s*auto/);
  assert.match(css, /\.main-operations,\s*\.main-section\s*\{[^}]*min-width:\s*0/);
  assert.doesNotMatch(css, /font-size:\s*[^;}]*vw/);
});

test('other-owned, unversioned and unresolved cases cannot expose unsafe actions', () => {
  const m = ui();
  assert.equal(typeof m.renderException, 'function');
  const other = m.renderException(exception({ tracking: { owner: '別人', status: 'open', version: 2 } }), { teacherName: '管理員' });
  assert.doesNotMatch(other, /data-main-action="(?:claim|release|close|reopen|save)-exception"/);
  const unclaimed = m.renderException(exception({ tracking: { owner: '', status: 'open', version: 0 } }), { teacherName: '管理員' });
  assert.match(unclaimed, /data-main-action="claim-exception"/);
  assert.doesNotMatch(unclaimed, /data-main-action="(?:close|save)-exception"/);
  const unresolved = m.renderException(exception({ resolved: false }), { teacherName: '管理員' });
  assert.doesNotMatch(unresolved, /data-main-action="close-exception"/);
  const invalid = m.renderException(exception({ tracking: { owner: '管理員' } }), { teacherName: '管理員' });
  assert.match(invalid, /版本.*未取得/);
  assert.doesNotMatch(invalid, /data-main-action/);
});

test('course history keeps chronological events, aliases, explicit empty/error and payroll privacy', () => {
  const m = ui();
  assert.equal(typeof m.renderHistory, 'function');
  const history = { calendarIds: ['ob-old', 'ob-new'], payrollVisible: false,
    events: [{ time: '2026-11-09 12:00', type: 'adjustment', title: '後發生', detail: '更新', actor: '管理員' },
      { time: '2026-11-08 12:00', type: 'course', title: '先發生', detail: '<script>bad</script>', actor: 'Tako' },
      { time: '2026-11-07 12:00', type: 'payroll', title: '薪資 99999', detail: '機密' }] };
  const result = m.renderHistory(history, { payrollAdmin: false });
  assert.ok(result.indexOf('先發生') < result.indexOf('後發生'));
  assert.match(result, /ob-old/);
  assert.match(result, /ob-new/);
  assert.doesNotMatch(result, /<script>|99999|機密/);
  assert.match(m.renderHistory({ calendarIds: ['ob-1'], events: [], payrollVisible: false }), /沒有履歷/);
  assert.match(m.renderHistory({ error: '查詢失敗' }), /查詢失敗/);
  assert.match(m.renderHistory({ ...history, payrollVisible: true }, { payrollAdmin: true }), /99999/);
  assert.match(m.renderHistory({ ...history, truncated: true }), /僅顯示.*500/);
});

test('course source is present in course and practice but not payroll', () => {
  const r = runtime();
  assert.equal(typeof r.context.renderMainCourseSource, 'function');
  r.run(`adminDashboard = {dataStatus:{source:'course_snapshot',status:'snapshot'}}; activeAdminSection = 'courses'; renderMainCourseSource();`);
  assert.equal(r.element('main-course-source').hidden, false);
  r.run(`activeAdminSection = 'practice'; renderMainCourseSource();`);
  assert.equal(r.element('main-course-source').hidden, false);
  r.run(`activeAdminSection = 'payroll'; renderMainCourseSource();`);
  assert.equal(r.element('main-course-source').hidden, true);
});

test('history search calls only the read API and stale searches cannot replace newer results', async () => {
  const r = runtime();
  assert.equal(typeof r.context.searchMainCourseHistory, 'function');
  const calls = [];
  const replies = new Map();
  r.context.callApi = (action, args) => new Promise(resolve => { calls.push({ action, args }); replies.set(args.calendarId, resolve); });
  const first = r.context.searchMainCourseHistory('ob-old');
  const second = r.context.searchMainCourseHistory('ob-new');
  replies.get('ob-new')({ calendarIds: ['ob-new'], events: [], payrollVisible: false });
  await second;
  replies.get('ob-old')({ calendarIds: ['ob-old'], events: [], payrollVisible: false });
  await first;
  assert.equal(calls.length, 2);
  assert.equal(calls[0].action, 'getMainCourseHistory');
  assert.match(r.element('main-course-history-results').innerHTML, /ob-new/);
  assert.doesNotMatch(r.element('main-course-history-results').innerHTML, /ob-old/);
  await assert.rejects(r.context.searchMainCourseHistory('  '), /Calendar ID/);
});

function mutationRuntime(item = exception()) {
  const r = runtime();
  r.context.fixture = { teachers: ['Tako', 'Jina'], operations: { exceptions: [item],
    identities: [{ instructorId: 'teacher-1', teacherName: 'Tako', status: 'active', version: 3 }] } };
  r.run('adminDashboard = fixture; activeAdminTab = "mainOperations"; activeAdminSection = "courses";');
  const calls = [];
  r.context.callPostApi = async (action, args) => { calls.push({ action, args }); return {}; };
  r.context.fetchAdminDashboard = async () => {};
  r.context.setNotice = () => {};
  return { ...r, calls };
}

test('exception mutations preserve expectedVersion, disallow other claims and require close note/resolution', async () => {
  const r = mutationRuntime();
  assert.equal(typeof r.context.submitMainException, 'function');
  await assert.rejects(r.context.submitMainException('case-1', 'close', '', '', 2), /備註/);
  assert.equal(r.calls.length, 0);
  await r.context.submitMainException('case-1', 'save', '再次核對', '2026-11-11T12:00', 2);
  assert.equal(r.calls.length, 1);
  assert.equal(r.calls[0].action, 'updateMainException');
  assert.deepEqual(JSON.parse(JSON.stringify(r.calls[0].args)), { caseUpdate: {
    key: 'case-1', action: 'save', note: '再次核對', followAt: '2026-11-11T12:00', expectedVersion: 2,
  } });
  const other = mutationRuntime(exception({ tracking: { owner: '別人', status: 'open', version: 2 } }));
  await assert.rejects(other.context.submitMainException('case-1', 'claim', '', '', 2), /其他人|他人|別人/);
  assert.equal(other.calls.length, 0);
  const unresolved = mutationRuntime(exception({ resolved: false }));
  await assert.rejects(unresolved.context.submitMainException('case-1', 'close', '已完成', '', 2), /未解決|未排除/);
});

test('identity link/unlink uses only explicit canonical selections with exact version', async () => {
  const r = mutationRuntime();
  assert.equal(typeof r.context.submitMainTeacherIdentity, 'function');
  await assert.rejects(r.context.submitMainTeacherIdentity('teacher-1', '猜測姓名', 3, true), /正式帳號|帳號老師/);
  await r.context.submitMainTeacherIdentity('teacher-1', 'Jina', 3, true);
  assert.deepEqual(JSON.parse(JSON.stringify(r.calls[0])), { action: 'saveMainTeacherIdentity', args: {
    identity: { instructorId: 'teacher-1', teacherName: 'Jina', expectedVersion: 3, active: true },
  } });
  const unlink = mutationRuntime();
  await unlink.context.submitMainTeacherIdentity('teacher-1', 'Tako', 3, false);
  assert.equal(unlink.calls[0].args.identity.active, false);
});

test('a mutation reconciles main data even if the user changes tabs before completion', async () => {
  const r = mutationRuntime();
  let release;
  r.context.callPostApi = () => new Promise(resolve => { release = resolve; });
  let refreshedMain = false;
  r.context.fetchAdminDashboard = async (rethrow, mainOnly) => { refreshedMain = rethrow && mainOnly; };
  const pending = r.context.submitMainException('case-1', 'save', '已檢查', '', 2);
  r.run('activeAdminTab = "payroll"; activeAdminSection = "payroll";');
  release({});
  await pending;
  assert.equal(refreshedMain, true);
});

test('rendering operations is read-only and read-only identity forms do not allow mutation', () => {
  const m = ui();
  const data = { tasks: [], exceptions: [exception()], identities: [
    { instructorId: '60001', teacherName: 'Tako', status: '啟用', version: 1 },
  ], notificationTracking: [] };
  const before = JSON.stringify(data);
  const result = m.renderOperations(data, { readOnly: true, teachers: ['Tako'], teacherName: '管理員' });
  assert.doesNotMatch(result, /data-main-action="(?:claim|release|save|close|reopen)-exception"|data-main-action="(?:un)?link-identity"/);
  assert.equal(JSON.stringify(data), before);
});

test('operations errors and duplicate identity links are explicit and fail closed', async () => {
  const m = ui();
  assert.match(m.renderOperations({ error: '營運資料讀取失敗' }), /營運資料讀取失敗/);
  const degraded = m.renderOperations({ error: '營運資料讀取失敗', tasks: [], exceptions: [], identities: [], notificationTracking: [] });
  assert.doesNotMatch(degraded, /目前沒有異常|目前沒有老師|目前沒有通知/);
  assert.match(m.renderTasks([], '營運資料讀取失敗'), /營運資料讀取失敗/);
  assert.doesNotMatch(m.renderTasks([], '營運資料讀取失敗'), /目前沒有待辦/);
  const result = m.renderOperations({ identities: [{ instructorId: 'teacher-1', teacherName: 'Tako',
    status: '對照重複，待核對', version: 3 }] }, { teachers: ['Tako'], teacherName: '管理員' });
  assert.match(result, /data-main-action="link-identity"[^>]*disabled/);
  const r = mutationRuntime();
  r.context.fixture.operations.identities[0].status = '對照重複，待核對';
  await assert.rejects(r.context.submitMainTeacherIdentity('teacher-1', 'Jina', 3, true), /重複/);
  assert.equal(r.calls.length, 0);
});

test('invalid exception dates and formula-like notes are rejected before sending', async () => {
  const r = mutationRuntime();
  await assert.rejects(r.context.submitMainException('case-1', 'save', '=bad', '', 2), /備註/);
  await assert.rejects(r.context.submitMainException('case-1', 'save', '追蹤', '2026-02-30T12:00', 2), /日期|時間/);
  await assert.rejects(r.context.submitMainException('case-1', 'save', '追蹤', '2026-11-10T25:00', 2), /日期|時間/);
  await assert.rejects(r.context.submitMainException('case-1', 'save', '追蹤', 'bad', 2), /日期|時間/);
  assert.equal(r.calls.length, 0);
});

test('practice refresh retains successful practice data when the course source read fails', async () => {
  const r = runtime();
  r.context.callApi = async action => {
    if (action === 'getPracticeAdminDashboard') return { marker: 'fresh-practice' };
    if (action === 'getStudentPracticeAdminDashboard') return { marker: 'fresh-student' };
    if (action === 'getAdminDashboard') throw Error('課表來源暫時無法取得');
    throw Error(action);
  };
  r.context.renderAdminDashboard = () => {};
  r.run('activeAdminTab = "practice"; activeAdminSection = "practice";');
  await r.context.fetchPracticeAdminDashboard(true);
  assert.equal(r.run('practiceAdminDashboard.marker'), 'fresh-practice');
  assert.equal(r.run('studentPracticeAdminDashboard.marker'), 'fresh-student');
  assert.match(r.element('main-course-source').innerHTML, /課表來源暫時無法取得/);
});

test('double submit and unknown network outcome never repeat writes, including after unchanged refresh', async () => {
  const r = mutationRuntime();
  assert.equal(typeof r.context.submitMainException, 'function');
  let rejectWrite;
  r.context.callPostApi = async (action, args) => {
    r.calls.push({ action, args });
    return new Promise((_, reject) => { rejectWrite = reject; });
  };
  let refreshes = 0;
  r.context.fetchAdminDashboard = async () => { refreshes++; r.context.reconcileMainOperations(r.context.fixture); };
  const pending = r.context.submitMainException('case-1', 'save', '處理中', '', 2);
  await assert.rejects(r.context.submitMainException('case-1', 'save', '處理中', '', 2), /處理中|待確認/);
  rejectWrite(Error('連線逾時'));
  await assert.rejects(pending, /待確認|不會.*重送/);
  assert.equal(refreshes, 1);
  await assert.rejects(r.context.submitMainException('case-1', 'save', '新備註', '', 2), /待確認/);
  assert.equal(r.calls.length, 1);
  r.context.fixture.operations.exceptions[0].tracking.version = 3;
  r.context.reconcileMainOperations(r.context.fixture);
  r.context.callPostApi = async (action, args) => { r.calls.push({ action, args }); return {}; };
  await r.context.submitMainException('case-1', 'release', '', '', 3);
  assert.equal(r.calls.length, 2);
});

test('version changes, absent versions and acting mode fail before mutation', async () => {
  const r = mutationRuntime();
  assert.equal(typeof r.context.submitMainException, 'function');
  await assert.rejects(r.context.submitMainException('case-1', 'save', '', '', 1), /版本/);
  await assert.rejects(r.context.submitMainException('case-1', 'save', '', '', ''), /版本/);
  await assert.rejects(r.context.submitMainTeacherIdentity('teacher-1', 'Tako', '', true), /版本/);
  r.run('authState.actingTeacherName = "Tako";');
  await assert.rejects(r.context.submitMainException('case-1', 'save', '', '', 2), /本人|代.*操作|唯讀/);
  assert.equal(r.calls.length, 0);
});

function memoryStorage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}

test('query preferences are per account, allowlisted and contain neither tokens nor write drafts', () => {
  const m = ui(), storage = memoryStorage();
  assert.equal(typeof m.createQueryPreferences, 'function');
  const prefs = m.createQueryPreferences(storage);
  prefs.save('管理員甲', { practice: { dateFrom: '2026-11-01', dateTo: '2026-11-30', room: 'A',
    status: '候補', teacherName: 'Tako', note: 'unsaved write' }, payrollMonth: '2026-10', sessionToken: 'secret', draft: 'private' }, '2026-11');
  assert.equal(prefs.read('管理員甲', '2026-11').practice.teacherName, 'Tako');
  assert.equal(prefs.read('管理員乙', '2026-11').payrollMonth, '');
  assert.doesNotMatch([...storage.values.values()].join(''), /secret|sessionToken|unsaved write|private|draft/);
  assert.deepEqual(Object.keys(JSON.parse([...storage.values.values()][0])).sort(), ['payrollMonth', 'practice', 'version']);
});

test('invalid, oversized and unavailable preference storage fails safely', () => {
  const m = ui();
  assert.equal(typeof m.normalizeQueryPreferences, 'function');
  const cleaned = m.normalizeQueryPreferences({ practice: { dateFrom: '2026-02-30', dateTo: '9999-11-01',
    room: 'Z', status: 'INVALID', teacherName: 'x'.repeat(201) }, payrollMonth: '9999-99' }, '2026-11');
  assert.deepEqual(cleaned.practice, { dateFrom: '', dateTo: '', room: '', status: '', teacherName: '' });
  assert.equal(cleaned.payrollMonth, '');
  assert.equal(m.normalizeQueryPreferences({ payrollMonth: '1900-01' }, '2026-11').payrollMonth, '');
  const reversed = m.normalizeQueryPreferences({ practice: { dateFrom: '2026-11-30', dateTo: '2026-11-01' } }, '2026-11');
  assert.equal(reversed.practice.dateFrom, '');
  assert.equal(reversed.practice.dateTo, '');
  const unavailable = m.createQueryPreferences({ getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } });
  assert.equal(unavailable.read('A', '2026-11').payrollMonth, '');
  assert.equal(unavailable.save('A', { payrollMonth: '2026-10' }, '2026-11'), false);
  const storage = memoryStorage(), prefs = m.createQueryPreferences(storage);
  prefs.save('A', {}, '2026-11');
  const key = [...storage.values.keys()][0];
  for (const corrupt of ['{bad', '[]', '{"version":999,"payrollMonth":"2026-10"}', 'x'.repeat(10000)]) {
    storage.values.set(key, corrupt);
    assert.equal(prefs.read('A', '2026-11').payrollMonth, '');
  }
});

test('bounded pagination clamps invalid and out-of-range pages without mutating data', () => {
  const m = ui();
  assert.equal(typeof m.paginate, 'function');
  const items = Array.from({ length: 101 }, (_, index) => ({ index }));
  const result = m.paginate(items, 999);
  assert.equal(result.page, 6);
  assert.equal(result.total, 101);
  assert.equal(result.items.length, 1);
  assert.equal(m.paginate(items, -1).page, 1);
  assert.equal(m.paginate(items, 'NaN').page, 1);
  assert.equal(m.paginate([], 100).page, 1);
  assert.equal(items.length, 101);
});

test('long operations case, identity, notice and history lists render only a bounded page', () => {
  const m = ui();
  const cases = Array.from({ length: 101 }, (_, index) => exception({ key: `case-${index}` }));
  const notices = cases.map((_, index) => ({ eventKey: `notice-${index}`, title: `Notice ${index}` }));
  const identities = cases.map((_, index) => ({ instructorId: String(index + 1), teacherName: 'Tako', status: '啟用', version: 1 }));
  const result = m.renderOperations({ exceptions: cases, notificationTracking: notices, identities },
    { teacherName: '管理員', teachers: ['Tako'], pages: { 'operations-cases': 2 } });
  assert.equal((result.match(/class="main-case"/g) || []).length, 20);
  assert.equal((result.match(/data-main-identity-form/g) || []).length, 20);
  assert.match(result, /data-main-page-key="operations-cases"/);
  assert.match(result, /101/);
  assert.doesNotMatch(result, /data-case-key="case-0"/);
  assert.match(result, /data-case-key="case-20"/);
  assert.doesNotMatch(result, /notice-100/);
  const history = m.renderHistory({ calendarIds: ['60001'], payrollVisible: false,
    events: cases.map((_, index) => ({ time: String(index).padStart(3, '0'), title: `Event ${index}`, type: '課表' })) },
    { pages: { 'operations-history': 2 } });
  assert.equal((history.match(/<li>/g) || []).length, 20);
  assert.doesNotMatch(history, /Event 0</);
});

test('health UI distinguishes evidence, stale/unknown and backup permission without executing commands', () => {
  const m = ui();
  assert.equal(typeof m.renderSystemHealth, 'function');
  const data = { checkedAt: '2026-11-09 12:00', checks: [
    { key: 'sync', label: '課表同步', status: 'stale', lastAttemptAt: '2026-11-09 11:00', lastSuccessAt: '2026-11-08 12:00', error: '<bad>' },
    { key: 'scheduler', label: '既有排程', status: 'success', detail: '已安裝' },
  ], notifications: { status: 'unknown', queued: 2, failed: 1, unknown: 3 },
  backup: { status: 'missing' }, backupAllowed: true };
  const result = m.renderSystemHealth(data, { fullAdmin: true });
  for (const word of ['系統健康', '課表同步', '過期', '未知', '最近嘗試', '最近成功', '佇列', '失敗', '&lt;bad&gt;', '尚無備份']) assert.ok(result.includes(word), word);
  assert.match(result, /data-main-action="create-backup"/);
  assert.doesNotMatch(m.renderSystemHealth(data, { fullAdmin: false }), /data-main-action="create-backup"/);
  assert.doesNotMatch(m.renderSystemHealth({ ...data, backupAllowed: false }, { fullAdmin: true }), /data-main-action="create-backup"/);
  assert.match(m.renderSystemHealth(null), /未取得/);
  assert.match(m.renderSystemHealth({ ...data, backup: { status: 'verified' } }, { fullAdmin: true }), /未完成核對|未驗證/);
});

test('final backup states stay locked while processing, and redacted evidence is not misreported', () => {
  const m = ui();
  for (const status of ['preparing', 'copying_backup', 'verifying_backup', 'copying_rehearsal', 'verifying_rehearsal', 'unknown']) {
    const result = m.renderSystemHealth({ backupAllowed: true, backup: { status } }, { fullAdmin: true });
    assert.match(result, /data-main-action="create-backup"[^>]*disabled/, status);
    assert.match(result, /處理中|未知/, status);
  }
  const result = m.renderSystemHealth({ backupAllowed: false, backup: { status: 'verified',
    lastSuccessAt: '2026-11-09 12:00', operationId: 'operation-redacted', sheetCount: 2, cellCount: 8 } }, { fullAdmin: false });
  assert.match(result, /備份與還原演練已驗證/);
  assert.doesNotMatch(result, /備份 ID|演練 ID|未完成核對/);
  assert.match(m.renderSystemHealth({ backup: { status: 'not_configured' } }), /尚無備份/);
});

test('unavailable notification evidence never appears as zero backlog and daily backup limit is explicit', async () => {
  const m = ui();
  const missing = m.renderSystemHealth({ notifications: { status: 'unknown', queued: 0, failed: 0, unknown: 0 } });
  assert.doesNotMatch(missing, /佇列：0|失敗：0/);
  const health = { checkedAt: '2026-11-09 12:00', backupAllowed: true,
    backup: { status: 'failed', createdAt: '2026-11-09 11:00' } };
  assert.match(m.renderSystemHealth(health, { fullAdmin: true }), /本日已執行/);
  assert.match(m.renderSystemHealth(health, { fullAdmin: true }), /data-main-action="create-backup"[^>]*disabled/);
  const r = backupRuntime();
  r.context.fixture.operations.systemHealth = health;
  await assert.rejects(r.context.submitMainBackup(), /本日|今天/);
  assert.equal(r.calls.length, 0);
});

test('practice applied preferences save only after success and are reused when returning', async () => {
  const storage = memoryStorage(), r = runtime({ storage });
  assert.equal(typeof r.context.getMainQueryPreferences, 'function');
  r.element('practice-admin-date-from').value = '2026-11-01';
  r.element('practice-admin-room').value = 'B';
  r.element('practice-admin-teacher').value = 'Tako';
  let fail = false;
  const requests = [];
  r.context.callApi = async (action, args) => {
    requests.push({ action, args });
    if (fail) throw Error('offline');
    return action === 'getAdminDashboard' ? { operations: {} } : { summary: {}, bookings: [], requests: [] };
  };
  r.context.renderAdminDashboard = () => {};
  r.context.setNotice = () => {};
  await r.context.fetchPracticeAdminDashboard(true, true);
  const committed = [...storage.values.values()].join('');
  assert.match(committed, /Tako/);
  r.element('practice-admin-teacher').value = 'UNSAVED';
  fail = true;
  await assert.rejects(r.context.fetchPracticeAdminDashboard(true, true), /offline/);
  assert.equal([...storage.values.values()].join(''), committed);
  fail = false;
  await r.context.fetchPracticeAdminDashboard(true, false);
  assert.equal(requests.filter(item => item.action === 'getPracticeAdminDashboard').at(-1).args.teacherName, 'Tako');
});

test('payroll month preferences ignore unsubmitted changes and stale account responses', async () => {
  const storage = memoryStorage(), r = runtime({ storage });
  r.context.renderAdminDashboard = () => {};
  r.context.setNotice = () => {};
  r.element('payroll-admin-month').value = '2026-10';
  const requested = [];
  r.context.callApi = async (action, args) => { requested.push(args.month); return { month: args.month }; };
  await r.context.fetchPayrollAdminDashboard(true, true);
  r.element('payroll-admin-month').value = '2026-09';
  await r.context.fetchPayrollAdminDashboard(true, false);
  assert.equal(requested.at(-1), '2026-10');
  const before = [...storage.values.values()].join('');
  let release;
  r.context.callApi = () => new Promise(resolve => { release = resolve; });
  const pending = r.context.fetchPayrollAdminDashboard(true, true);
  r.run('authState.teacherName = "另一帳號"; authState.sessionToken = "other";');
  release({ month: '2026-09' });
  await pending;
  assert.equal([...storage.values.values()].join(''), before);
  assert.equal(r.context.getMainQueryPreferences().payrollMonth, '');
});

test('concurrent practice and payroll reads retain both independently applied preferences', async () => {
  const r = runtime({ storage: memoryStorage() });
  r.context.renderAdminDashboard = () => {};
  r.element('practice-admin-teacher').value = 'Tako';
  r.element('payroll-admin-month').value = '2026-10';
  const replies = new Map();
  r.context.callApi = (action, args) => {
    if (action === 'getAdminDashboard') return Promise.resolve({ operations: {} });
    return new Promise(resolve => replies.set(action, () => resolve(action === 'getPayrollAdminDashboard' ? { month: args.month } : { summary: {} })));
  };
  const practice = r.context.fetchPracticeAdminDashboard(true, true);
  const payroll = r.context.fetchPayrollAdminDashboard(true, true);
  replies.get('getPayrollAdminDashboard')(); await payroll;
  replies.get('getPracticeAdminDashboard')(); replies.get('getStudentPracticeAdminDashboard')(); await practice;
  assert.equal(r.context.getMainQueryPreferences().payrollMonth, '2026-10');
  assert.equal(r.context.getMainQueryPreferences().practice.teacherName, 'Tako');
});

test('late main dashboard responses from an old account cannot overwrite the new account or its errors',async()=>{
  for(const failure of [false,true]) {
    const r=runtime(),replies=[];
    r.context.renderAdminDashboard=()=>{};r.context.setNotice=()=>{};
    r.run('activeAdminTab="mainOperations"; activeViewId="view-admin";');
    r.context.callApi=()=>new Promise((resolve,reject)=>replies.push({resolve,reject}));
    const old=r.context.fetchAdminDashboard();
    r.run('authState.teacherName="另一帳號";authState.sessionToken="other";getMainQueryPreferences();');
    const current=r.context.fetchAdminDashboard();
    replies[1].resolve({marker:'new-account',operations:{}});await current;
    if(failure)replies[0].reject(Error('old-account-error'));
    else replies[0].resolve({marker:'old-account',operations:{}});
    await old;
    assert.equal(r.run('adminDashboard.marker'),'new-account');
    assert.equal(r.run('mainAssuranceState.refreshError'),'');
  }
});

test('a newer background main snapshot cannot be replaced by an older foreground response',async()=>{
  const r=runtime(),replies=[];r.context.renderAdminDashboard=()=>{};
  r.run('activeAdminTab="mainOperations";');
  r.context.callApi=()=>new Promise(resolve=>replies.push(resolve));
  const old=r.context.fetchAdminDashboard();
  const newer=r.context.fetchAdminDashboard(true,true);
  replies[1]({marker:'newer',operations:{}});await newer;
  replies[0]({marker:'older',operations:{}});await old;
  assert.equal(r.run('adminDashboard.marker'),'newer');
  assert.equal(r.element('admin-sync').disabled,false);
});

test('late practice and payroll read failures or successes never repaint a page the user has left',async()=>{
  for(const kind of ['practice','payroll'])for(const failure of [false,true]) {
    const r=runtime();let resolve,reject,rendered=0;
    r.run(`activeAdminTab="${kind}";activeViewId="view-admin";`);
    r.context.renderAdminDashboard=()=>{rendered++;};r.context.setNotice=()=>{};
    const action=kind==='practice'?'getPracticeAdminDashboard':'getPayrollAdminDashboard';
    r.context.callApi=(name)=>name===action ? new Promise((yes,no)=>{resolve=yes;reject=no;})
      : Promise.resolve({operations:{},summary:{},requests:[]});
    const pending=kind==='practice'?r.context.fetchPracticeAdminDashboard():r.context.fetchPayrollAdminDashboard();
    r.run(`activeAdminTab="${kind==='practice'?'payroll':'practice'}";`);
    r.element('admin-tab-content').innerHTML='current-view';
    if(failure)reject(Error('abandoned-query'));
    else resolve({summary:{},bookings:[],month:'2026-11'});
    await pending;
    assert.equal(r.element('admin-tab-content').innerHTML,'current-view');assert.equal(rendered,0);
  }
});

test('an older read cannot remove the loading lock owned by a newer read',()=>{
  const r=runtime(),attributes=new Set();
  const host={innerHTML:'',classList:{add(){},remove(){}},setAttribute:key=>attributes.add(key),removeAttribute:key=>attributes.delete(key)};
  const old=r.context.beginReadRefresh(host,true,'');
  const current=r.context.beginReadRefresh(host,true,'');
  r.context.endReadRefresh(host,old);assert.equal(attributes.has('inert'),true);
  r.context.endReadRefresh(host,current);assert.equal(attributes.has('inert'),false);
});

test('practice current lists are bounded and long closed histories stay unmaterialized', () => {
  const r = runtime();
  r.context.bookings = Array.from({ length: 101 }, (_, index) => ({ bookingId: `practice-${index}`, date: '2026/01/01',
    room: 'A', startTime: '12:00', endTime: '13:00', status: '已成立', participants: [] }));
  r.run('practiceAdminDashboard = {filters:{},summary:{total:101},bookings}; studentPracticeAdminDashboard = {summary:{},requests:[]}; renderPracticeAdminDashboard();');
  assert.equal((r.element('admin-tab-content').innerHTML.match(/data-practice-admin-booking=/g) || []).length, 0);
  assert.match(r.element('admin-tab-content').innerHTML, /101/);
  assert.equal(typeof r.context.materializeMainDisclosure, 'function');
});

test('same-session workspace positions are isolated and restored only to the matching view', () => {
  const r = runtime();
  assert.equal(typeof r.context.captureMainWorkspacePosition, 'function');
  r.run('activeAdminTab = "practice"; activeAdminSection = "practice"; window.scrollY = 640;');
  r.context.captureMainWorkspacePosition();
  r.run('window.scrollY = 0;');
  r.context.requestMainWorkspaceRestore('practice');
  r.context.restoreMainWorkspacePosition();
  assert.equal(r.context.window.scrollY, 640);
  r.run('authState.teacherName = "另一帳號";');
  r.context.getMainQueryPreferences();
  r.run('window.scrollY = 0;');
  r.context.requestMainWorkspaceRestore('practice');
  r.context.restoreMainWorkspacePosition();
  assert.equal(r.context.window.scrollY, 0);
});

function backupRuntime() {
  const r = mutationRuntime();
  r.context.fixture.operations.systemHealth = { backupAllowed: true, backup: { status: 'missing' } };
  r.run('authState.role = "admin";');
  return r;
}

test('backup is an explicit full-admin one-shot command, never a render side effect', async () => {
  const r = backupRuntime();
  assert.equal(typeof r.context.submitMainBackup, 'function');
  r.context.renderMainOperationsTab();
  assert.equal(r.calls.length, 0);
  await r.context.submitMainBackup();
  assert.equal(r.calls.length, 1);
  assert.equal(r.calls[0].action, 'createMainBackup');
  assert.match(r.calls[0].args.operationId, /^main_backup_/);
  for (const role of ['管理員', 'ADMIN']) {
    const admin = backupRuntime();
    admin.context.authRole = role;
    admin.run('authState.role = authRole;');
    await admin.context.submitMainBackup();
    assert.equal(admin.calls.length, 1);
  }
  for (const condition of ['authState.role="teacher"', 'authState.managementCapabilities=["course_admin"]',
    'authState.actingTeacherName="Tako"', 'fixture.operations.systemHealth.backupAllowed=false']) {
    const denied = backupRuntime(); denied.run(condition);
    await assert.rejects(denied.context.submitMainBackup(), /權限|本人|唯讀|備份/);
    assert.equal(denied.calls.length, 0);
  }
});

test('large active practice lists stay bounded while metrics remain full totals', () => {
  const r = runtime();
  r.context.bookings = Array.from({ length: 101 }, (_, index) => ({ bookingId: `future-${index}`, date: '2099/01/01',
    room: 'A', startTime: '12:00', endTime: '13:00', status: '已成立', participants: [] }));
  r.context.students = r.context.bookings.map((_, index) => ({ participantId: `student-${index}`, date: '2099/01/01',
    room: 'A', startTime: '12:00', endTime: '13:00', status: '已成立' }));
  r.run('practiceAdminDashboard={filters:{},summary:{total:101},bookings}; studentPracticeAdminDashboard={summary:{active:101},requests:students}; renderPracticeAdminDashboard();');
  const result = r.element('admin-tab-content').innerHTML;
  assert.equal((result.match(/data-practice-admin-booking=/g) || []).length, 20);
  assert.equal((result.match(/data-student-practice-participant=/g) || []).length, 20);
  assert.match(result, /<span>查詢筆數<\/span><strong>101<\/strong>/);
  assert.match(result, /data-main-page-key="practice-bookings-current"/);
  assert.doesNotMatch(html, /Jina／小美／卡拉／2 點課 2 人以下/);
});

test('unknown backup outcomes remain blocked after refresh and reconcile only the matching operation', async () => {
  const r = backupRuntime();
  assert.equal(typeof r.context.submitMainBackup, 'function');
  let rejectWrite;
  r.context.callPostApi = async (action, args) => { r.calls.push({ action, args }); return new Promise((_, reject) => { rejectWrite = reject; }); };
  let refreshes = 0;
  r.context.fetchAdminDashboard = async () => { refreshes++; r.context.reconcileMainOperations(r.context.fixture); };
  const pending = r.context.submitMainBackup();
  await assert.rejects(r.context.submitMainBackup(), /處理中|待確認/);
  rejectWrite(Error('timeout'));
  await assert.rejects(pending, /待確認|重送/);
  assert.equal(refreshes, 1);
  await assert.rejects(r.context.submitMainBackup(), /待確認/);
  const id = r.calls[0].args.operationId;
  r.context.fixture.operations.systemHealth.backup = { status: 'verified', operationId: 'other', backupId: 'b', rehearsalId: 'r', lastSuccessAt: '2026-11-09 12:00' };
  r.context.reconcileMainOperations(r.context.fixture);
  await assert.rejects(r.context.submitMainBackup(), /待確認/);
  r.context.fixture.operations.systemHealth.backup.operationId = id;
  r.context.reconcileMainOperations(r.context.fixture);
  r.context.callPostApi = async (action, args) => { r.calls.push({ action, args }); return {}; };
  await r.context.submitMainBackup();
  assert.equal(r.calls.length, 2);
});

test('a matching retryable pre-copy failure unlocks only an explicit new backup command', async () => {
  const r = backupRuntime();
  r.context.fixture.operations.systemHealth.checkedAt = '2026-11-09 12:00';
  r.context.callPostApi = async (action, args) => {
    r.calls.push({ action, args });
    const state = { status: 'failed', retryable: true, operationId: args.operationId, createdAt: '2026-11-09 11:00', error: '建立副本前檢查失敗' };
    r.context.fixture.operations.systemHealth.backup = state;
    return state;
  };
  r.context.fetchAdminDashboard = async () => r.context.reconcileMainOperations(r.context.fixture);
  await r.context.submitMainBackup();
  assert.equal(r.calls.length, 1);
  const result = ui().renderSystemHealth(r.context.fixture.operations.systemHealth, { fullAdmin: true });
  assert.doesNotMatch(result, /data-main-action="create-backup"[^>]*disabled/);
  assert.doesNotMatch(result, /本日已執行備份/);
  await r.context.submitMainBackup();
  assert.equal(r.calls.length, 2);
  r.context.fixture.operations.systemHealth.backup = { status: 'unknown', retryable: true };
  await assert.rejects(r.context.submitMainBackup(), /待確認/);
  assert.equal(r.calls.length, 2);
});

test('offline standalone browser journeys and responsive rendering', {
  skip: process.env.MAIN_ASSURANCE_BROWSER !== '1', timeout: 90000,
}, async () => {
  const modules = process.env.CODEX_NODE_MODULES || '/Users/ivy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
  const { chromium } = require(path.join(modules, 'playwright'));
  const browser = await chromium.launch({ headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const output = '/private/tmp/main-assurance-ui-qa';
  fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const standalone = html.replace(/<script\b[^>]*src=[^>]*><\/script>/g, '')
      .replace(/\n    initialize\(\);/, '')
      .replace(/<link[^>]*href="(?:https?:|\.\/main-assurance-ui\.css)[^>]*>/g, '')
      .replace('</head>', `<style>${fs.readFileSync(path.join(repo, 'main-assurance-ui.css'), 'utf8')}</style></head>`);
    await page.route('**/*', route => route.request().url() === 'http://main-assurance.test/'
      ? route.fulfill({ status: 200, contentType: 'text/html', body: standalone }) : route.abort());
    await page.goto('http://main-assurance.test/');
    await page.addScriptTag({ content: fs.readFileSync(modulePath, 'utf8') });
    await page.evaluate(() => {
      const source = { source: 'course_snapshot', status: 'snapshot', oldestAt: '2026-11-09 10:00:00',
        lastSuccessAt: '2026-11-09 10:05:00', mixed: true };
      window.fixtureMain = { teachers: ['Tako', 'Jina'], dataStatus: source,
        pendingInvitations: [], obWork: [{ id: 'source-1' }], courseAdjustments: [], changeRequests: [],
        operations: { tasks: [{ key: 'leave:source-1', label: '空環課程資料核對', targetId: 'source-1',
          tab: 'mainOperations', urgency: '已逾期', date: '2026/11/10', time: '18:00', owner: '', followAt: '' }],
        exceptions: [{ key: 'leave:source-1', targetId: 'source-1', kind: '代課', date: '2026/11/10', time: '18:00',
          courseName: '空環課程資料核對', teacherName: 'Tako', verificationStatus: '待核對', resolved: false,
          tracking: { owner: '', status: '未認領', note: '', followAt: '', version: 0 } }],
        identities: [{ instructorId: '60002', obNames: ['OB 別名'], teacherName: 'Tako', status: '啟用', version: 3 }],
        notificationTracking: [{ eventKey: 'notice-1', title: '課程狀態通知', relatedId: '60001', createdAt: '2026-11-09 12:00',
          inbox: { status: '已建立', recipients: 2, read: 1 }, push: { status: 'accepted', detail: '服務已接受' },
          line: { status: 'unknown', detail: '歷史紀錄無法核對' } }] },
        courseClosure: { targetDate: '2026/11/10', socialCopy: { content: '明日缺一、缺二課程', updatedAt: '2026-11-09 22:30' },
          unclaimedCandidates: [], recentLogs: [], ruleCatalogue: { version: 'rules-1', stages: ['22:30 只取消 0 人'],
            rules: [{ priority: 1, condition: '2 點地板優惠', minimumEnrollment: 3, label: '至少 3 人' }], notes: [], history: [] },
          assessment: { verified: true, targetDate: '2026/11/10', ruleVersion: 'rules-1', baselineAvailable: false, impacts: [],
            dataStatus: { source: 'ob_live', status: 'live', lastSuccessAt: '2026-11-09 22:31' }, items: [{ calendarId: '60001',
              time: '18:00', courseName: '地板優惠課程', teacherName: 'Tako', points: 2, enrollmentCount: 1,
              minimumEnrollment: 3, shortage: 2, decision: '未達門檻', ruleLabel: '地板優惠', reason: '至少 3 人' }] } } };
      window.fixturePayroll = { month: '2026-11', version: 'v2', noShowEditable: false, deductions: [], lines: [], summaries: [], disputes: [],
        metrics: { teachers: 0, totalSalary: 0, pendingConfirmations: 0, errors: 0, openDisputes: 0 },
        dataStatus: { source: 'payroll_snapshot', status: 'snapshot', lastSuccessAt: '2026-11-09 12:00' },
        ruleCatalogue: { month: '2026-11', policies: ['自主練習不計薪'], rules: [{ teacherName: 'Tako', billingType: '固定',
          amount: 800, effectiveMonth: '2026-11', throughMonth: '', appliesThisMonth: true }] },
        comparison: { version: 'v2', baselineVersion: 'v1', baselineAvailable: true, totalDelta: -100,
          teachers: [{ teacherName: 'Tako', beforeAmount: 800, afterAmount: 700, delta: -100, reason: '鐘點費變更' }],
          items: [{ calendarId: '60001', teacherName: 'Tako', courseName: '空環', beforeAmount: 800,
            afterAmount: 700, delta: -100, reason: '人數變更' }] } };
      fixtureMain.operations.systemHealth = { checkedAt: '2026-11-09 12:00', checks: [
        { key: 'scheduler', label: '主系統排程', status: 'healthy', lastAttemptAt: '2026-11-09 12:00', lastSuccessAt: '2026-11-09 12:00' },
        { key: 'sync', label: 'OB 課表同步', status: 'stale', lastAttemptAt: '2026-11-09 12:00', lastSuccessAt: '2026-11-01 12:00' },
      ], notifications: { status: 'warning', queued: 2, failed: 1, unknown: 3, detail: '最近 100 則通知' },
        backupAllowed: true, backup: { status: 'not_configured' } };
      const booking = (index, date) => ({ bookingId: `practice-${date}-${index}`, date, room: 'A', startTime: '12:00', endTime: '13:00',
        status: '已成立', creatorName: 'Tako', participants: [], audits: [] });
      window.fixturePractice = { filters: {}, summary: { total: 146, active: 65 },
        bookings: [...Array.from({ length: 65 }, (_, index) => booking(index, '2099/01/01')),
          ...Array.from({ length: 81 }, (_, index) => booking(index, '2026/01/01'))],
        notificationFailures: Array.from({ length: 51 }, (_, index) => ({ time: '2026-11-09 12:00', reason: `通知異常 ${index}` })) };
      window.fixtureStudents = { summary: { active: 45 }, requests: Array.from({ length: 45 }, (_, index) => ({
        participantId: `student-${index}`, date: '2099/01/01', room: 'A', startTime: '12:00', endTime: '13:00', status: '已成立', appName: `Student ${index}` })) };
      window.localMainCalls = [];
      callApi = async (action, params) => {
        if (action === 'getAdminDashboard') return structuredClone(fixtureMain);
        if (action === 'getPracticeAdminDashboard') return structuredClone(fixturePractice);
        if (action === 'getStudentPracticeAdminDashboard') return structuredClone(fixtureStudents);
        if (action === 'getPayrollAdminDashboard') return { ...structuredClone(fixturePayroll), month: params.month };
        if (action === 'getMainCourseHistory') return { calendarIds: [params.calendarId, '60003'], payrollVisible: true,
          events: [{ time: '2026-11-09 12:00', type: '課表', title: '本機課程履歷', detail: '課程建立', actor: 'OB 同步' },
            { time: '2026-11-09 13:00', type: '薪資', title: '機密薪資 99999', detail: '薪資測試' }] };
        throw Error(`Unexpected read ${action}`);
      };
      callPostApi = async (action, params) => {
        localMainCalls.push({ action, params });
        if (action === 'createMainBackup') {
          fixtureMain.operations.systemHealth.backup = { status: 'unknown', operationId: params.operationId, error: '本機模擬備份結果不明' };
          throw Error('本機模擬備份逾時');
        }
        if (window.unknownMainWrite) throw Error('本機模擬連線逾時');
        if (action === 'updateMainException') {
          const input = params.caseUpdate, item = fixtureMain.operations.exceptions[0];
          if (input.expectedVersion !== item.tracking.version) throw Error('版本衝突');
          item.tracking = { owner: input.action === 'release' ? '' : '管理員', status: input.action === 'close' ? '已結案' : '處理中',
            note: input.note, followAt: input.followAt, version: item.tracking.version + 1 };
          return structuredClone(item.tracking);
        }
        if (action === 'saveMainTeacherIdentity') {
          const input = params.identity, item = fixtureMain.operations.identities[0];
          if (input.expectedVersion !== item.version) throw Error('版本衝突');
          Object.assign(item, { teacherName: input.teacherName, status: input.active ? '啟用' : '停用', version: item.version + 1 });
          return structuredClone(item);
        }
        throw Error(`Unexpected write ${action}`);
      };
      authState.sessionToken = 'offline'; authState.teacherName = '管理員'; authState.managementCapabilities = ['course_admin'];
      window.crypto.randomUUID = () => '12345678-1234-1234-1234-123456789012';
      document.getElementById('auth-shell').hidden = true; document.getElementById('app-shell').hidden = false;
      document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
      document.getElementById('view-admin').classList.add('active');
      adminDashboard = structuredClone(fixtureMain); activeAdminTab = 'mainOperations'; activeAdminSection = 'courses';
      renderAdminDashboard();
    });
    const caseForm = () => page.locator('[data-main-case-form]');
    await page.locator('#main-course-history-form input').fill('60001');
    await page.locator('[data-main-action="search-history"]').click();
    await page.getByText('本機課程履歷', { exact: true }).waitFor();
    assert.equal(await page.getByText('機密薪資 99999').count(), 0);
    await page.locator('[data-main-action="claim-exception"]').click();
    await caseForm().locator('[name="note"]').waitFor();
    assert.equal(await caseForm().locator('[name="expectedVersion"]').inputValue(), '1');
    await caseForm().locator('[name="note"]').fill('本機追蹤備註');
    await caseForm().locator('[name="followAt"]').fill('2026-11-10T12:30');
    await page.locator('[data-main-action="save-exception"]').click();
    await page.waitForFunction(() => fixtureMain.operations.exceptions[0].tracking.version === 2);
    await page.locator('[data-main-action="release-exception"]').click();
    await page.locator('[data-main-action="claim-exception"]').click();
    await page.evaluate(async () => { fixtureMain.operations.exceptions[0].resolved = true; await fetchAdminDashboard(true); });
    await caseForm().locator('[name="note"]').fill('');
    const beforeClose = await page.evaluate(() => localMainCalls.length);
    await page.locator('[data-main-action="close-exception"]').click();
    assert.equal(await page.evaluate(() => localMainCalls.length), beforeClose);
    await caseForm().locator('[name="note"]').fill('完成核對');
    await page.locator('[data-main-action="close-exception"]').click();
    await page.locator('[data-main-action="reopen-exception"]').click();
    await page.locator('[data-main-identity-form] select').selectOption('Jina');
    await page.locator('[data-main-action="link-identity"]').click();
    await page.waitForFunction(() => fixtureMain.operations.identities[0].version === 4);
    await page.locator('[data-main-action="unlink-identity"]').click();
    await page.waitForFunction(() => fixtureMain.operations.identities[0].status === '停用');
    await page.evaluate(() => { window.unknownMainWrite = true; });
    await caseForm().locator('[name="note"]').fill('結果不明測試');
    await page.locator('[data-main-action="save-exception"]').click();
    await page.locator('.main-case .main-state.is-error').waitFor();
    const writesBeforeRefresh = await page.evaluate(() => localMainCalls.length);
    await page.locator('[data-main-action="refresh-operations"]').first().click();
    assert.equal(await page.locator('[data-main-action="save-exception"]').isDisabled(), true);
    assert.equal(await page.evaluate(() => localMainCalls.length), writesBeforeRefresh);
    await page.evaluate(async () => { fixtureMain.operations.exceptions[0].tracking.version++; window.unknownMainWrite = false; await fetchAdminDashboard(true); });
    assert.equal(await page.locator('[data-main-action="save-exception"]').isDisabled(), false);
    await page.evaluate(async () => {
      authState.managementCapabilities = ['course_admin', 'payroll_admin']; authState.role = '管理員';
      fixtureMain.operations.notificationTracking.push(...Array.from({ length: 65 }, (_, index) => ({ eventKey: `extra-notice-${index}`, title: `Notice ${index}` })));
      await fetchAdminDashboard(true);
    });
    await caseForm().locator('[name="note"]').fill('UNSAVED CASE NOTE');
    await page.locator('[data-main-list="operations-notices"] [aria-label="下一頁"]').click();
    assert.equal(await caseForm().locator('[name="note"]').inputValue(), 'UNSAVED CASE NOTE');
    assert.equal(await page.getByText('Notice 64', { exact: true }).count(), 0);
    await page.locator('[data-main-action="create-backup"]').click();
    await page.waitForFunction(() => fixtureMain.operations.systemHealth.backup.status === 'unknown');
    await page.locator('[data-main-action="create-backup"][disabled]').waitFor();
    const beforeBackupRefresh = await page.evaluate(() => localMainCalls.filter(call => call.action === 'createMainBackup').length);
    await page.locator('.main-health [data-main-action="refresh-operations"]').click();
    assert.equal(await page.locator('[data-main-action="create-backup"]').isDisabled(), true);
    assert.equal(await page.evaluate(() => localMainCalls.filter(call => call.action === 'createMainBackup').length), beforeBackupRefresh);
    await page.evaluate(() => openAdminTab('practice'));
    await page.locator('[data-practice-admin-current] [data-practice-admin-booking]').first().waitFor();
    assert.equal(await page.locator('[data-practice-admin-current] [data-practice-admin-booking]').count(), 20);
    assert.equal(await page.locator('[data-practice-admin-history] [data-practice-admin-booking]').count(), 0);
    await page.locator('#practice-admin-teacher').fill('Tako');
    await page.locator('#practice-admin-room').selectOption('B');
    await page.locator('#practice-admin-filter-form button[type="submit"]').click();
    await page.waitForFunction(() => getMainQueryPreferences().practice.teacherName === 'Tako');
    await page.locator('[data-main-list="practice-bookings-current"] [aria-label="下一頁"]').click();
    assert.equal(await page.locator('[data-practice-admin-current] [data-practice-admin-booking]').first().getAttribute('data-practice-admin-booking'), 'practice-2099/01/01-20');
    await page.locator('[data-practice-admin-month="2026-01"] > summary').click();
    await page.locator('[data-practice-admin-history] [data-practice-admin-booking]').first().waitFor();
    assert.equal(await page.locator('[data-practice-admin-history] [data-practice-admin-booking]').count(), 20);
    await page.locator('[data-main-list="practice-history-2026-01"] [aria-label="下一頁"]').click();
    assert.equal(await page.locator('[data-practice-admin-history] [data-practice-admin-booking]').first().getAttribute('data-practice-admin-booking'), 'practice-2026/01/01-20');
    await page.evaluate(() => { window.scrollTo(0, 600); openAdminTab('mainOperations'); });
    await page.locator('.main-health').waitFor();
    await page.evaluate(() => { window.scrollTo(0, 0); openAdminTab('practice'); });
    await page.locator('[data-practice-admin-current] [data-practice-admin-booking]').first().waitFor();
    await page.waitForFunction(() => Math.abs(window.scrollY - 600) <= 2);
    assert.equal(await page.locator('#practice-admin-teacher').inputValue(), 'Tako');
    assert.equal(await page.locator('#practice-admin-room').inputValue(), 'B');
    assert.equal(await page.locator('[data-practice-admin-current] [data-practice-admin-booking]').first().getAttribute('data-practice-admin-booking'), 'practice-2099/01/01-20');
    assert.equal(await page.locator('[data-practice-admin-history] [data-practice-admin-booking]').count(), 20);
    const storedQueries = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('sherry-main-query-v1:')).map(key => localStorage.getItem(key)).join(''));
    assert.match(storedQueries, /Tako/);
    assert.doesNotMatch(storedQueries, /UNSAVED|sessionToken|operationId|offline/);
    for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 700]]) {
      await page.setViewportSize({ width, height });
      for (const scene of ['operations', 'closure', 'payroll', 'home', 'practice']) {
        await page.evaluate(scene => {
          if (scene === 'payroll') {
            authState.managementCapabilities = ['course_admin', 'payroll_admin'];
            payrollDashboard = structuredClone(fixturePayroll); activeAdminSection = 'payroll'; activeAdminTab = 'payroll';
          } else if (scene === 'practice') { activeAdminSection = 'practice'; activeAdminTab = 'practice'; }
          else if (scene === 'closure') { activeAdminSection = 'operations'; activeAdminTab = 'closureManagement'; }
          else if (scene === 'home') { activeAdminSection = 'dashboard'; activeAdminTab = 'pendingInvitations'; }
          else { activeAdminSection = 'courses'; activeAdminTab = 'mainOperations'; }
          renderAdminDashboard();
          document.querySelectorAll('.main-disclosure').forEach(details => { details.open = true; });
          window.scrollTo(0, 0);
        }, scene);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${name}/${scene}: page overflow`);
        const clipped = await page.locator('#admin-tab-content').evaluate(root => Array.from(root.querySelectorAll('button, input, select, textarea'))
          .filter(element => !element.closest('.main-table-scroll') && element.getClientRects().length)
          .filter(element => { const bounds = element.getBoundingClientRect(); return bounds.left < -1 || bounds.right > innerWidth + 1; })
          .map(element => element.outerHTML));
        assert.deepEqual(clipped, [], `${name}/${scene}: clipped controls`);
        const screenshot = await page.screenshot({ path: path.join(output, `${name}-${scene}.png`), fullPage: true });
        assert.ok(screenshot.length > 10000, `${name}/${scene}: blank screenshot`);
        assert.equal(await page.locator('#main-course-source').isVisible(), ['operations', 'practice'].includes(scene));
      }
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
