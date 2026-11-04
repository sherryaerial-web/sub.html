const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const backend = { Date, console, Session: { getScriptTimeZone: () => 'Asia/Taipei' }, Utilities: {
    formatDate(value, timezone, pattern) {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(value)
        .reduce((result, part) => { result[part.type] = part.value; return result; }, {});
      if (pattern === 'yyyy-MM') return `${parts.year}-${parts.month}`;
      if (pattern === 'yyyy-MM-dd') return `${parts.year}-${parts.month}-${parts.day}`;
      if (pattern === 'yyyy/MM/dd') return `${parts.year}/${parts.month}/${parts.day}`;
      if (pattern === 'HH:mm') return `${parts.hour}:${parts.minute}`;
      throw Error(`Unexpected format ${pattern}`);
    }
  } };
  vm.createContext(backend);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8'), backend);
  return backend;
}

const rules = [
  { teacherName: 'Josty Lin', courseKeyword: '(留空)', billingType: '每小時計薪', amount: 1000, effectiveMonth: '2026-11' },
  { teacherName: 'Josty Lin', billingType: '標準時薪', amount: 1500, throughMonth: '2026-10' },
  { teacherName: '預設值', billingType: '人數階梯', threshold: 4, amount: 900 },
  { teacherName: '卡拉 卡拉', billingType: '標準時薪', amount: 1000 }
];
const lesson = (date = '2026/11/06', extra = {}) => ({ calendarId: '53639', date, time: '17:15',
  courseName: 'A－舞綢 Lv.2~4', instructors: [{ name: 'Josty Lin' }], attendanceCount: 4, durationMinutes: 60, ...extra });

test('Josty gets 1500 through October and 1000 per hour from November, independent of row order', () => {
  const b = load();
  for (const ordered of [rules, [...rules].reverse()]) {
    assert.equal(b.calculatePayrollLinesForCourse_(lesson('2026/10/31'), ordered)[0].amount, 1500);
    assert.equal(b.calculatePayrollLinesForCourse_(lesson('2026/11/01'), ordered)[0].amount, 1000);
    assert.equal(b.calculatePayrollLinesForCourse_(lesson('2026/12/30', { durationMinutes: 90 }), ordered)[0].amount, 1500);
    assert.equal(b.calculatePayrollLinesForCourse_(lesson('2027/01/01', { durationMinutes: 30 }), ordered)[0].amount, 500);
  }
});

test('dated rules reject missing lesson dates, invalid/reversed windows, overlaps, and gaps', () => {
  const b = load();
  assert.throws(() => b.calculatePayrollLinesForCourse_(lesson(''), rules), /月份|日期/);
  for (const effectiveMonth of ['2026-13', '2026-00', 'banana']) {
    assert.throws(() => b.calculatePayrollLinesForCourse_(lesson(), [{ ...rules[0], effectiveMonth }]), /月份/);
  }
  assert.throws(() => b.calculatePayrollLinesForCourse_(lesson(), [{ ...rules[0], throughMonth: '2026-10' }]), /月份/);
  assert.throws(() => b.calculatePayrollLinesForCourse_(lesson(), [...rules, { ...rules[0], amount: 1200 }]), /重複|重疊/);
  assert.throws(() => b.calculatePayrollLinesForCourse_(lesson('2026/10/15'), [rules[0], rules[2]]), /薪項|月份/);
});

test('hourly pay rejects unknown or invalid duration; legacy fixed pay stays per lesson', () => {
  const b = load();
  for (const durationMinutes of [undefined, null, '', 0, -60, NaN, 1.5, 1441]) {
    assert.throws(() => b.calculatePayrollLinesForCourse_(lesson(undefined, { durationMinutes }), rules), /時長/);
  }
  const legacy = [{ teacherName: 'Josty Lin', billingType: '標準時薪', amount: 1500 }];
  assert.equal(b.calculatePayrollLinesForCourse_(lesson('', { durationMinutes: 90 }), legacy)[0].amount, 1500);
  assert.equal(b.calculatePayrollLinesForCourse_(lesson(undefined, { instructors: ['卡拉 卡拉'], durationMinutes: 90 }), rules)[0].amount, 1000);
  assert.equal(b.calculatePayrollLinesForCourse_(lesson(undefined, { instructors: ['其他老師'] }), rules)[0].amount, 900);
});

test('calendar normalization uses actual lesson timing, including a month boundary in Taiwan', () => {
  const b = load();
  const raw = { id: 1, class: { id: 239, nameZhHant: 'A－舞綢', duration: 60 },
    classTime: '2026-10-31T16:30:00Z', classEndTime: '2026-10-31T18:00:00Z',
    instructors: [{ id: 246, name: 'Josty Lin' }], customersAttended: 4 };
  const course = b.normalizePayrollCalendarItem_(raw);
  assert.equal(course.date, '2026/11/01');
  assert.equal(course.durationMinutes, 90);
  assert.equal(b.calculatePayrollLinesForCourse_(course, rules)[0].amount, 1500);
  assert.equal(b.normalizePayrollCalendarItem_({ ...raw, classEndTime: null }).durationMinutes, 60);
  const unknown = b.normalizePayrollCalendarItem_({ ...raw, class: { nameZhHant: 'A－舞綢' }, classEndTime: null });
  assert.throws(() => b.calculatePayrollLinesForCourse_(unknown, rules), /時長/);
  const invalid = b.normalizePayrollCalendarItem_({ ...raw, classEndTime: '2026-10-31T16:00:00Z' });
  assert.throws(() => b.calculatePayrollLinesForCourse_(invalid, rules), /時長/);
});

test('monthly fixed adjustments honor their own windows and bonuses do not change', () => {
  const b = load();
  const dated = [...rules, { teacherName: 'Josty Lin', billingType: '固定加給', amount: 500, effectiveMonth: '2026-12' }];
  const course = lesson('2026/11/06');
  const nov = b.buildPayrollDraft_('2026-11', [course], dated);
  assert.equal(nov.errors.length, 0);
  const summary = nov.summaries.find(x => x.teacherName === 'Josty Lin');
  assert.equal(summary.fixedAdjustment, 0);
  const dec = b.buildPayrollDraft_('2026-12', [{ ...course, date: '2026/12/04' }], dated);
  assert.equal(dec.summaries.find(x => x.teacherName === 'Josty Lin').fixedAdjustment, 500);
  assert.equal(b.calculateBonusRate_(15000), 0.03);
});

test('Sheet rule reader preserves A:E indexes and reads optional F:G only under exact headers', () => {
  const b = load();
  const headers = ['老師姓名', '課程關鍵字 (可留空)', '計費類型', '人數門檻', '金額', '生效月份', '截止月份'];
  const rows = [headers, ['Josty Lin', '(留空)', '每小時計薪', 0, 1000, '2026-11', ''],
    ['Josty Lin', '(留空)', '標準時薪', 0, 1500, '', new Date('2026-10-01T00:00:00+08:00')]];
  const sheet = { getName: () => '薪項設定', getDataRange: () => ({ getValues: () => rows }),
    getRange: (_r, _c, _n, width) => ({ getValues: () => [headers.slice(0, width)] }) };
  const actual = b.getPayrollRulesUnlocked_({ getSheetByName: () => sheet });
  assert.equal(actual[0].amount, 1000);
  assert.equal(actual[0].effectiveMonth, '2026-11');
  assert.equal(actual[1].throughMonth, '2026-10');
  headers[5] = '私人備註';
  assert.throws(() => b.getPayrollRulesUnlocked_({ getSheetByName: () => sheet }), /欄|標題/);
});

test('rentals, practice, and special-class sharing keep their existing rules', () => {
  const b = load();
  assert.equal(b.calculatePayrollLinesForCourse_(lesson(undefined, { courseName: 'A－場地租借' }), rules)[0].amount, 0);
  assert.equal(b.calculatePayrollLinesForCourse_(lesson(undefined, { courseName: '學員自主練習' }), rules)[0].amount, 0);
  assert.equal(b.calculatePayrollLinesForCourse_(lesson(undefined, { courseName: '舞綢特別課', courseIncome: 3000 }), rules)[0].amount, 1800);
  assert.equal(b.normalizePayrollCalendarItem_({ cancelled: true }), null);
});
