const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Standalone variant of backend-core.test.js's loader; no test suite import or GAS services.
function loadBackend() {
  const context = {
    console,
    Date,
    Session: { getScriptTimeZone: () => 'Asia/Taipei' },
    Utilities: {
      formatDate(value, timezone, pattern) {
        assert.equal(timezone, 'Asia/Taipei');
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(new Date(value)).reduce((result, part) => {
          result[part.type] = part.value;
          return result;
        }, {});
        if (pattern === 'yyyy-MM-dd') return `${parts.year}-${parts.month}-${parts.day}`;
        if (pattern === 'yyyy/MM/dd') return `${parts.year}/${parts.month}/${parts.day}`;
        if (pattern === 'HH:mm') return `${parts.hour}:${parts.minute}`;
        throw new Error(`Unexpected date format: ${pattern}`);
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8'), context, {
    filename: 'Code.gs',
  });
  return context;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function rule(teacherName, courseKeyword, billingType, threshold, amount) {
  return { teacherName, courseKeyword, billingType, threshold, amount };
}

const REGULAR_TIERS = [
  [2, 700], [3, 800], [4, 900], [5, 1000], [6, 1100],
  [7, 1100], [8, 1100], [9, 1200], [10, 1300],
];
const REGULAR_RULES = REGULAR_TIERS.map(([count, amount]) =>
  rule('預設值', '(留空)', '人數階梯', count, amount));

function calendarItem(overrides = {}) {
  return {
    id: 'term-session',
    class: { id: 'term-class', nameZhHant: 'C－空環 Lv.3 技巧訓練期班' },
    classTime: '2026-10-07T10:00:00Z',
    instructors: [{ id: 'teacher-a', name: '老師甲' }],
    customersAttended: 4,
    customersAttending: 10,
    size: 12,
    courseIncome: 12000,
    profit: 0,
    // Synthetic purchase metadata deliberately predates every session; it is not a date source.
    purchasedAt: '2026-08-01T02:00:00Z',
    bookedAt: '2026-08-02T02:00:00Z',
    ...overrides,
  };
}

for (const courseName of [
  'A－空環技巧訓練期班',
  'C－空環 Lv.3 技巧訓練期班',
  'A－綢吊技巧訓練期班',
  'B－飛天管 Lv.0 技巧訓練期班',
]) {
  test(`${courseName}: each session uses regular attendance tiers, not upfront income or enrollment`, () => {
    const backend = loadBackend();
    const incomes = [12000, 0, null, 1, 99999, 300, '', 4500, 0];
    const courses = REGULAR_TIERS.map(([count], index) => {
      const item = calendarItem({
        id: `term-${index + 1}`,
        class: { id: 'same-term', nameZhHant: courseName },
        classTime: `2026-10-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
        customersAttended: count,
        courseIncome: incomes[index],
      });
      const term = backend.normalizePayrollCalendarItem_(item);
      const regular = backend.normalizePayrollCalendarItem_({
        ...item, class: { ...item.class, nameZhHant: courseName.replace('期班', '') },
      });
      assert.ok(term);
      assert.equal(term.attendanceCount, count);
      const lines = plain(backend.calculatePayrollLinesForCourse_(term, REGULAR_RULES));
      assert.deepEqual(lines, plain(backend.calculatePayrollLinesForCourse_(regular, REGULAR_RULES)));
      assert.deepEqual(lines, [{
        teacherName: '老師甲', amount: REGULAR_TIERS[index][1],
        ruleType: '人數階梯', ruleDetail: `${count} 人`,
      }]);
      return term;
    });

    const draft = plain(backend.buildPayrollDraft_('2026-10', courses, REGULAR_RULES));
    assert.deepEqual(draft.errors, []);
    assert.deepEqual(draft.warnings, []);
    assert.deepEqual(draft.lines.map((line) => [
      line.calendarId, line.lineId, line.month, line.attendanceCount, line.amount,
    ]), REGULAR_TIERS.map(([count, amount], index) => [
      `term-${index + 1}`, `term-${index + 1}:老師甲`, '2026-10', count, amount,
    ]));
    assert.equal(draft.summaries.length, 1);
    assert.equal(draft.summaries[0].subtotal, 9200);
    assert.equal(draft.summaries[0].totalSalary, 9200);

    const purchaseMonth = plain(backend.buildPayrollDraft_('2026-08', courses, REGULAR_RULES));
    assert.deepEqual(purchaseMonth.errors, []);
    assert.deepEqual(purchaseMonth.lines, []);
    assert.deepEqual(purchaseMonth.summaries, []);
  });
}

test('term attendance pay stays unchanged when only income and upfront booking dates change', () => {
  const backend = loadBackend();
  for (const courseIncome of [undefined, null, '', 0, 1, 12000, 99999]) {
    for (const bookingDate of ['2026-08-01T00:00:00Z', '2026-09-30T16:00:00Z']) {
      const course = backend.normalizePayrollCalendarItem_(calendarItem({
        courseIncome, purchasedAt: bookingDate, bookedAt: bookingDate,
      }));
      assert.equal(course.date, '2026/10/07');
      const draft = plain(backend.buildPayrollDraft_('2026-10', [course], REGULAR_RULES));
      assert.deepEqual(draft.errors, []);
      assert.equal(draft.lines.length, 1);
      assert.equal(draft.lines[0].amount, 900);
      assert.equal(draft.lines[0].billingType, '人數階梯');
      assert.equal(draft.summaries[0].subtotal, 900);
    }
  }
});

test('one term is split by actual Taipei course month at midnight, never settled in full upfront', () => {
  const backend = loadBackend();
  const sessions = [
    ['sep-last', '2026-09-30T15:59:59Z', 2, 12000, '2026/09/30', '23:59', 700],
    ['oct-first', '2026-09-30T16:00:00Z', 4, 0, '2026/10/01', '00:00', 900],
    ['oct-last', '2026-10-31T15:59:59Z', 5, 0, '2026/10/31', '23:59', 1000],
    ['nov-first', '2026-10-31T16:00:00Z', 10, 0, '2026/11/01', '00:00', 1300],
  ];
  const courses = sessions.map(([id, classTime, count, income, date, time]) => {
    const course = backend.normalizePayrollCalendarItem_(calendarItem({
      id, classTime, customersAttended: count, courseIncome: income,
    }));
    assert.equal(course.date, date);
    assert.equal(course.time, time);
    return course;
  });

  const allLineIds = [];
  for (const [month, expectedIds, subtotal] of [
    ['2026-08', [], 0],
    ['2026-09', ['sep-last'], 700],
    ['2026-10', ['oct-first', 'oct-last'], 1900],
    ['2026-11', ['nov-first'], 1300],
  ]) {
    const draft = plain(backend.buildPayrollDraft_(month, courses, REGULAR_RULES));
    assert.deepEqual(draft.errors, []);
    assert.deepEqual(draft.lines.map((line) => line.calendarId), expectedIds);
    for (const line of draft.lines) {
      assert.equal(line.month, month);
      assert.equal(line.amount, sessions.find(([id]) => id === line.calendarId)[6]);
      allLineIds.push(line.lineId);
    }
    assert.equal(draft.summaries.length, expectedIds.length ? 1 : 0);
    if (expectedIds.length) {
      assert.equal(draft.summaries[0].subtotal, subtotal);
      assert.equal(draft.summaries[0].totalSalary, subtotal);
    }
  }
  assert.equal(allLineIds.length, sessions.length);
  assert.equal(new Set(allLineIds).size, sessions.length);
});

test('term courses retain normal teacher-specific keyword and fixed hourly exceptions', () => {
  const backend = loadBackend();
  const rules = REGULAR_RULES.concat([
    rule('妙妙 簡', '綢吊', '標準時薪', 0, 1200),
    rule('Josty Lin', '(留空)', '標準時薪', 0, 1500),
  ]);
  for (const [teacherName, courseName, amount, ruleType] of [
    ['妙妙 簡', 'A－綢吊技巧訓練', 1200, '老師專屬薪項'],
    ['妙妙 簡', 'A－空環技巧訓練', 700, '人數階梯'],
    ['老師甲', 'A－綢吊技巧訓練', 700, '人數階梯'],
    ['Josty Lin', 'C－空環 Lv.3 技巧訓練', 1500, '老師專屬薪項'],
  ]) {
    for (const suffix of ['', '期班']) {
      const course = backend.normalizePayrollCalendarItem_(calendarItem({
        class: { nameZhHant: courseName + suffix },
        instructors: [{ name: teacherName }], customersAttended: 2,
      }));
      const lines = plain(backend.calculatePayrollLinesForCourse_(course, rules));
      assert.equal(lines.length, 1);
      assert.equal(lines[0].teacherName, teacherName);
      assert.equal(lines[0].amount, amount);
      assert.equal(lines[0].ruleType, ruleType);
    }
  }
});

test('term courses retain Shelly Lin attendance exceptions and reject missing dedicated tiers', () => {
  const backend = loadBackend();
  const rules = REGULAR_RULES.concat([2, 3, 4].map((count, index) =>
    rule('Shelly Lin', '飛天管', '人數階梯', count, [800, 900, 1100][index])));
  for (const [count, amount] of [[2, 800], [3, 900], [4, 1100]]) {
    const calculate = (suffix, teacherName = 'Shelly Lin', courseName = 'B－飛天管 Lv.0') =>
      plain(backend.calculatePayrollLinesForCourse_({
        calendarId: 'dedicated-term', courseName: courseName + suffix,
        instructors: [{ name: teacherName }], attendanceCount: count, courseIncome: 12000,
      }, rules));
    assert.deepEqual(calculate('期班'), calculate(''));
    assert.equal(calculate('期班')[0].amount, amount);
    assert.equal(calculate('期班')[0].ruleType, '老師專屬人數階梯');
    assert.equal(calculate('期班', '老師甲')[0].amount, REGULAR_TIERS[count - 2][1]);
    assert.equal(calculate('期班', 'Shelly Lin', 'A－空環 Lv.0')[0].amount, REGULAR_TIERS[count - 2][1]);
  }
  for (const count of [0, 1, 5]) {
    const course = backend.normalizePayrollCalendarItem_(calendarItem({
      class: { nameZhHant: 'B－飛天管 Lv.0 技巧訓練期班' },
      instructors: [{ name: 'Shelly Lin' }], customersAttended: count,
    }));
    const draft = plain(backend.buildPayrollDraft_('2026-10', [course], rules));
    assert.deepEqual(draft.lines, []);
    assert.equal(draft.errors.length, 1);
    assert.match(draft.errors[0].message, /Shelly Lin.*專屬人數階梯薪項缺少或重複/);
  }
});

test('upfront term income cannot replace missing attendance or an undefined regular tier', () => {
  const backend = loadBackend();
  for (const count of [null, '', -1, 1.5, 1]) {
    const course = backend.normalizePayrollCalendarItem_(calendarItem({
      customersAttended: count, customersAttending: null,
    }));
    const draft = plain(backend.buildPayrollDraft_('2026-10', [course], REGULAR_RULES));
    assert.deepEqual(draft.lines, []);
    assert.equal(draft.errors.length, 1);
    assert.match(draft.errors[0].message, /有效出席人數|找不到出席 1 人的人數階梯薪項/);
  }
});
