const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pagePath = path.join(__dirname, '..', 'vvip.html');
const html = fs.existsSync(pagePath) ? fs.readFileSync(pagePath, 'utf8') : '';
const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function renderCourseFromPage(course) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/loadVvipMembers\(\);\s*$/, '') + '\nglobalThis.__renderCourse = renderCourse;';
  const element = {
    addEventListener() {},
    classList: { toggle() {} },
    dataset: {},
    value: '',
  };
  const context = {
    document: { getElementById() { return element; } },
    fetch: async () => ({ ok: true, json: async () => ({ status: 'success', data: [] }) }),
    URLSearchParams,
    Set,
    console,
  };
  vm.createContext(context);
  vm.runInContext(script, context);
  return context.__renderCourse(course);
}

test('VVIP public page is a standalone responsive intent-registration page', () => {
  assert.match(html, /name=["']viewport["']/);
  assert.match(html, /VVIP 優先選課意願登記/);
  assert.match(html, /不代表正式保留名額/);
  assert.match(html, /<p class="lead">請選擇您的 OB 名稱查看本期課程並累積登記，最多四堂。<\/p>/);
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

test('VVIP public page groups courses, searches them, and enforces the cumulative four-course view', () => {
  assert.match(html, /groupCoursesByDate/);
  assert.match(html, /filterVvipCourses/);
  assert.match(html, /已選.*LIMIT/);
  assert.match(html, /selectedCalendarIds/);
  assert.match(html, /existingCalendarIds/);
  assert.match(html, /最多.*[四4]/);
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

test('VVIP admin workspace remains a protected tab with management actions', () => {
  assert.equal((adminHtml.match(/role=["']tab["']/g) || []).length, 8);
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
  assert.match(adminHtml, /new Blob/);
});
