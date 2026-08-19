const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pagePath = path.join(__dirname, '..', 'vvip.html');
const html = fs.existsSync(pagePath) ? fs.readFileSync(pagePath, 'utf8') : '';
const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function createVvipPageHarness(options = {}) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/loadVvipMembers\(\);\s*$/, '') + `
      globalThis.__state = state;
      globalThis.__renderCourse = renderCourse;
      globalThis.__renderCourses = renderCourses;
      globalThis.__renderSummary = renderSummary;
      globalThis.__submitVvipSelection = submitVvipSelection;
      globalThis.__formatVvipDateWithWeekday = typeof formatVvipDateWithWeekday === "function" ? formatVvipDateWithWeekday : undefined;
      globalThis.__isVvipSpecialCourse = typeof isVvipSpecialCourse === "function" ? isVvipSpecialCourse : undefined;
      globalThis.__toggleVvipDate = typeof toggleVvipDate === "function" ? toggleVvipDate : undefined;
    `;
  const elements = new Map();
  const makeElement = () => ({
    addEventListener() {},
    classList: { toggle() {} },
    dataset: {},
    value: '',
    innerHTML: '',
    textContent: '',
    className: '',
    hidden: false,
    disabled: false,
    scrollIntoView() {},
    requestSubmit() {},
  });
  const context = {
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, makeElement());
        return elements.get(id);
      },
    },
    fetch: options.fetch || (async () => ({ ok: true, json: async () => ({ status: 'success', data: [] }) })),
    URLSearchParams,
    Set,
    console,
  };
  vm.createContext(context);
  vm.runInContext(script, context);
  return { context, elements };
}

function renderCourseFromPage(course) {
  const { context } = createVvipPageHarness();
  return context.__renderCourse(course);
}

test('VVIP public page is a standalone responsive intent-registration page', () => {
  assert.match(html, /name=["']viewport["']/);
  assert.match(html, /VVIP 優先選課意願登記/);
  assert.match(html, /不代表正式保留名額/);
  assert.match(html, /<p class="lead">請選擇您的 OB 名稱查看本期課程並累積登記，最多三堂。<\/p>/);
  assert.doesNotMatch(html, /<p class="lead">[^<]*不代表正式保留名額[^<]*<\/p>/);
  assert.match(html, /id=["']vvip-member-form["']/);
  assert.match(html, /id=["']vvip-member["']/);
  assert.doesNotMatch(html, /id=["']vvip-email["']/);
  assert.doesNotMatch(html, /老師登入|login-pin|teacher-options/);
});

test('VVIP public page posts member ID and never exposes Email', () => {
  assert.match(html, /callVvipApi\(["']getVvipMembers["']/);
  assert.match(html, /callVvipApi\(["']getVvipSelection["']/);
  assert.match(html, /callVvipApi\(["']submitVvipSelection["']/);
  assert.match(html, /vvipId/);
  assert.match(html, /method:\s*["']POST["']/);
  assert.match(html, /application\/x-www-form-urlencoded/);
  assert.doesNotMatch(html, /type=["']email["']/i);
});

test('VVIP public page groups courses, searches them, and enforces the cumulative three-course view', () => {
  assert.match(html, /groupCoursesByDate/);
  assert.match(html, /filterVvipCourses/);
  assert.match(html, /已選.*LIMIT/);
  assert.match(html, /selectedCalendarIds/);
  assert.match(html, /existingCalendarIds/);
  assert.match(html, /最多.*[三3]/);
  assert.match(html, /id=["']vvip-course-search["']/);
});

test('VVIP public page keeps closed, empty, duplicate, and retry states visible', () => {
  assert.match(html, /尚未開放|已截止/);
  assert.match(html, /尚無可選課程/);
  assert.match(html, /已選過/);
  assert.match(html, /重新整理|重試/);
  assert.match(html, /保留目前勾選/);
});

test('VVIP successful submission keeps the complete accumulated list visible', () => {
  assert.match(html, /const displayed = selected\.length \? selected : \(state\.data\.selections \|\| \[\]\)/);
  assert.match(html, /displayed\.map\(\(course\)/);
});

test('VVIP submission re-reads the backend before showing success and clearing the pending choice', async () => {
  const calls = [];
  const confirmed = {
    memberId: 'vvip-member-1', memberName: '會員一', month: '2026-09', limit: 3, count: 1,
    selections: [{ calendarId: 'cal-1', date: '2026/09/01', time: '10:00', courseName: '空環', teacherName: '老師甲' }],
    courses: [{ calendarId: 'cal-1', date: '2026/09/01', time: '10:00', courseName: '空環', teacherName: '老師甲' }],
  };
  const { context, elements } = createVvipPageHarness({
    fetch: async (_url, request) => {
      const body = new URLSearchParams(request.body);
      calls.push(body.get('action'));
      return { ok: true, json: async () => ({ status: 'success', data: confirmed }) };
    },
  });
  context.__state.memberId = 'vvip-member-1';
  context.__state.data = confirmed;
  context.__state.selectedCalendarIds.add('cal-1');

  await context.__submitVvipSelection();

  assert.deepEqual(calls, ['submitVvipSelection', 'getVvipSelection']);
  assert.equal(context.__state.selectedCalendarIds.size, 0);
  assert.equal(context.__state.existingCalendarIds.has('cal-1'), true);
  assert.match(elements.get('vvip-notice').textContent, /已確認選課成功/);
});

test('VVIP selected-course summary appears before the long course list', () => {
  assert.ok(html.indexOf('id="vvip-summary"') < html.indexOf('id="vvip-course-area"'));
});

test('VVIP course card shows leave and substitute status without creating another checkbox', () => {
  const rendered = renderCourseFromPage({
    calendarId: 'cal-claimed',
    date: '2026/09/03',
    time: '18:30',
    courseName: '舞綢基礎',
    teacherName: '代課老師乙',
    leaveStatus: 'claimed',
    originalTeacherName: '原老師乙',
    substituteTeacherName: '代課老師乙',
    leaveLabel: '原老師請假：原老師乙｜代課老師：代課老師乙',
  });

  assert.match(rendered, /原老師請假：原老師乙｜代課老師：代課老師乙/);
  assert.equal((rendered.match(/type="checkbox"/g) || []).length, 1);
});

test('VVIP selected summary keeps a cancelled course visible without consuming the three-course quota', () => {
  const { context, elements } = createVvipPageHarness();
  context.__state.data = {
    count: 0,
    selections: [{
      calendarId: 'cal-cancelled', date: '2026/09/05', time: '19:00',
      courseName: '空環 Lv.1', teacherName: '老師甲', status: '課程已取消',
    }],
    courses: [],
  };
  context.__state.existingCalendarIds = new Set();

  context.__renderSummary();

  assert.match(elements.get('vvip-summary-copy').textContent, /累積 0／3 堂/);
  assert.match(elements.get('vvip-summary-list').innerHTML, /課程已取消/);
  assert.match(elements.get('vvip-summary-list').innerHTML, /空環 Lv\.1/);
});

test('VVIP classifies only named special courses and formats dates with weekdays', () => {
  const { context } = createVvipPageHarness();

  assert.equal(typeof context.__formatVvipDateWithWeekday, 'function');
  assert.equal(typeof context.__isVvipSpecialCourse, 'function');
  assert.equal(context.__formatVvipDateWithWeekday('2026/09/01'), '2026/09/01（二）');
  assert.equal(context.__isVvipSpecialCourse({ courseName: '開髖回春特別課 (90min)' }), true);
  assert.equal(context.__isVvipSpecialCourse({ courseName: '綢吊 Lv.0-2 (90分)' }), false);
});

test('VVIP separates visible special courses from collapsed ordinary weekday groups', () => {
  const { context, elements } = createVvipPageHarness();
  const courses = [
    { calendarId: 'special-1', date: '2026/09/12', time: '14:00', courseName: '後彎充電特別課', teacherName: '卡拉' },
    { calendarId: 'ordinary-1', date: '2026/09/01', time: '13:15', courseName: '綢吊 Lv.0-2 (90分)', teacherName: '妙妙' },
    { calendarId: 'ordinary-2', date: '2026/09/01', time: '18:30', courseName: '空環 Lv.1~2', teacherName: '壹壹' },
  ];
  context.__state.data = { courses };
  context.__renderCourses();
  const rendered = elements.get('vvip-course-area').innerHTML;

  assert.match(rendered, /class="vvip-special-section"[\s\S]*後彎充電特別課/);
  assert.ok(rendered.indexOf('vvip-special-section') < rendered.indexOf('vvip-date-group'));
  assert.match(rendered, /2026\/09\/01（二）[\s\S]*2 堂/);
  assert.match(rendered, /data-vvip-date-content="2026\/09\/01" hidden/);
  assert.equal((rendered.match(/type="checkbox"/g) || []).length, 1);
  assert.doesNotMatch(rendered, /綢吊 Lv\.0-2|空環 Lv\.1~2/);

  context.__toggleVvipDate('2026/09/01');
  const expanded = elements.get('vvip-course-area').innerHTML;
  assert.equal((expanded.match(/type="checkbox"/g) || []).length, courses.length);
  assert.match(expanded, /綢吊 Lv\.0-2/);
  assert.match(expanded, /空環 Lv\.1~2/);
});

test('VVIP search exposes matching ordinary dates without losing manual expansion', () => {
  const { context, elements } = createVvipPageHarness();
  const courses = [
    { calendarId: 'ordinary-1', date: '2026/09/01', time: '13:15', courseName: '綢吊 Lv.0-2 (90分)', teacherName: '妙妙' },
  ];
  context.__state.data = { courses };
  const search = elements.get('vvip-course-search') || context.document.getElementById('vvip-course-search');

  search.value = '綢吊';
  context.__renderCourses();
  assert.doesNotMatch(elements.get('vvip-course-area').innerHTML, /data-vvip-date-content="2026\/09\/01" hidden/);

  search.value = '';
  context.__renderCourses();
  assert.match(elements.get('vvip-course-area').innerHTML, /data-vvip-date-content="2026\/09\/01" hidden/);
  assert.equal(typeof context.__toggleVvipDate, 'function');
  context.__toggleVvipDate('2026/09/01');
  assert.doesNotMatch(elements.get('vvip-course-area').innerHTML, /data-vvip-date-content="2026\/09\/01" hidden/);
});

test('VVIP admin workspace remains a protected tab with management actions', () => {
  assert.equal((adminHtml.match(/role=["']tab["']/g) || []).length, 9);
  assert.match(adminHtml, /data-admin-tab=["']vvip["']/);
  assert.match(adminHtml, /data-capability=["']vvip_admin["']/);
  assert.match(adminHtml, /VVIP 選課/);
  assert.match(adminHtml, /getVvipAdminDashboard/);
  assert.match(adminHtml, /setVvipSelectionOpen/);
  assert.match(adminHtml, /confirmVvipEmail/);
  assert.match(adminHtml, /cancelVvipSelection/);
  assert.match(adminHtml, /exportVvipSelectionsCsv/);
  assert.match(adminHtml, /saveVvipMember/);
  assert.match(adminHtml, /setVvipMemberActive/);
  assert.match(adminHtml, /data-vvip-record-key/);
  assert.match(adminHtml, /memberName/);
  assert.match(adminHtml, /vvip-course-view/);
  assert.match(adminHtml, /new Blob/);
});
