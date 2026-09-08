const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadStudentPracticePage() {
  const scriptPath = path.join(__dirname, '..', 'student-practice.js');
  const source = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, 'utf8') : '';
  const context = { console, window: {}, document: undefined };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'student-practice.js' });
  return context.window.StudentPracticePage;
}

test('student page maps public empty and shared slots without exposing names', () => {
  const page = loadStudentPracticePage();
  const cards = page.buildSlotCards({
    date: '2026/09/10',
    rooms: [{ room: 'A', slots: [
      { type: 'empty', startTime: '10:00', endTime: '12:00', durations: [60, 90, 120] },
      { type: 'shared', groupId: 'group-1', startTime: '14:00', endTime: '15:00', durations: [60], participantNames: ['不可出現'] },
    ] }],
  });

  assert.deepEqual(JSON.parse(JSON.stringify(cards)), [
    { key: 'A|10:00|empty', room: 'A', type: 'empty', time: '10:00–12:00', title: '空教室，可選擇練習時長', durations: [60, 90, 120], groupId: '', date: '2026/09/10', startTime: '10:00', endTime: '12:00' },
    { key: 'A|14:00|shared', room: 'A', type: 'shared', time: '14:00–15:00', title: '已有學生自主練習，可登記一起使用', durations: [60], groupId: 'group-1', date: '2026/09/10', startTime: '14:00', endTime: '15:00' },
  ]);
  assert.equal(JSON.stringify(cards).includes('不可出現'), false);
});

test('student page submission uses the selected duration or exact shared group id', () => {
  const page = loadStudentPracticePage();
  const identity = { studentToken: 'opaque-token', appName: '', email: '' };
  const empty = page.buildSubmissionPayload({
    date: '2026/09/10', room: 'B', type: 'empty', startTime: '09:00', durations: [60, 90], groupId: '',
  }, 90, identity, '需要鞦韆');
  const shared = page.buildSubmissionPayload({
    date: '2026/09/10', room: 'C', type: 'shared', startTime: '11:00', durations: [60], groupId: 'group-2',
  }, 120, identity, '');

  assert.deepEqual(JSON.parse(JSON.stringify(empty)), {
    studentToken: 'opaque-token', date: '2026/09/10', room: 'B', startTime: '09:00', durationMinutes: 90, note: '需要鞦韆',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(shared)), {
    studentToken: 'opaque-token', groupId: 'group-2', note: '',
  });

  const firstBooking = page.buildSubmissionPayload({
    date: '2026/09/10', room: 'A', type: 'empty', startTime: '10:00', durations: [60], groupId: '',
  }, 60, { studentToken: '', appName: '學生甲', email: ' Student@Example.COM ' }, '');
  assert.deepEqual(JSON.parse(JSON.stringify(firstBooking)), {
    studentToken: '', appName: '學生甲', email: 'Student@Example.COM',
    date: '2026/09/10', room: 'A', startTime: '10:00', durationMinutes: 60, note: '',
  });
});

test('joining an existing student practice shows its fixed start time', () => {
  const page = loadStudentPracticePage();
  const form = page.buildBookingFormState({
    type: 'shared', startTime: '14:00', endTime: '15:30', durations: [90], groupId: 'group-2',
  });

  assert.deepEqual(JSON.parse(JSON.stringify(form)), {
    title: '登記一起使用',
    startFieldHidden: false,
    startDisabled: true,
    startOptions: ['14:00'],
    durationFieldHidden: true,
  });
});

test('student page is a focused mobile booking surface with the confirmed deadline copy', () => {
  const htmlPath = path.join(__dirname, '..', 'student-practice.html');
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  assert.match(html, /選擇自主練習時間/);
  assert.match(html, /開始前 2 小時/);
  assert.match(html, /取消或換時間請洽官方 LINE/);
  assert.match(html, /APP 名稱/);
  assert.match(html, /APP 內註冊 Email/);
  assert.match(html, /id="app-email"[^>]*type="email"/);
  assert.doesNotMatch(html, /身分辨識尾碼/);
  assert.doesNotMatch(html, /薪資|代課紀錄|管理工作台/);
  const scriptPath = path.join(__dirname, '..', 'student-practice.js');
  assert.match(fs.readFileSync(scriptPath, 'utf8'), /sherry_student_practice_token_v2/);
});
