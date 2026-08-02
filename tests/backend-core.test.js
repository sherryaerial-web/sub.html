const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadBackend(overrides = {}) {
  const file = path.join(__dirname, '..', 'Code.gs');
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const context = {
    console,
    Date,
    JSON,
    Math,
    String,
    Number,
    Object,
    Array,
    RegExp,
    Error,
    encodeURIComponent,
    decodeURIComponent,
    Utilities: {
      formatDate(value, _timezone, pattern) {
        const date = new Date(value);
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Taipei',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).formatToParts(date).reduce((acc, part) => {
          acc[part.type] = part.value;
          return acc;
        }, {});
        if (pattern === 'yyyy-MM-dd') return `${parts.year}-${parts.month}-${parts.day}`;
        if (pattern === 'yyyy/MM/dd') return `${parts.year}/${parts.month}/${parts.day}`;
        if (pattern === 'HH:mm') return `${parts.hour}:${parts.minute}`;
        return '';
      },
    },
    Session: { getScriptTimeZone: () => 'Asia/Taipei' },
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'Code.gs' });
  return context;
}

test('classifies supported course categories', () => {
  const backend = loadBackend();
  assert.equal(typeof backend.getCourseCategory_, 'function');
  assert.equal(backend.getCourseCategory_('B－空環 Lv.2'), '空環');
  assert.equal(backend.getCourseCategory_('C－舞綢 Lv.1'), '舞綢');
  assert.equal(backend.getCourseCategory_('空中瑜伽 Lv.1'), '空瑜');
  assert.equal(backend.getCourseCategory_('原始瑜伽'), '瑜伽');
  assert.equal(backend.getCourseCategory_('柔軟度開發'), '柔軟度');
  assert.equal(backend.getCourseCategory_('綢吊'), '綢吊');
  assert.equal(backend.getCourseCategory_('未分類特別課'), '其他');
});

test('calculates today through the end of next month', () => {
  const backend = loadBackend();
  assert.equal(typeof backend.getSyncDateRange_, 'function');
  const range = backend.getSyncDateRange_(new Date(2026, 7, 3, 12, 0, 0));
  assert.equal(range.dateFrom, '2026-08-03');
  assert.equal(range.dateTo, '2026-09-30');
});

test('normalizes a calendar item to the fixed CourseList contract', () => {
  const backend = loadBackend();
  assert.equal(typeof backend.normalizeCalendarItem_, 'function');
  const result = backend.normalizeCalendarItem_({
    id: 7788,
    classTime: '2026-08-10T10:30:00Z',
    class: { nameZhHant: 'B－空環 Lv.2' },
    instructors: [{ firstName: 'Ariel', lastName: 'Lu', isSubstitute: false }],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    apiId: '7788',
    date: '2026/08/10',
    time: '18:30',
    course: 'B－空環 Lv.2',
    instructor: 'Ariel Lu',
  });
});

test('rejects calendar items missing required values', () => {
  const backend = loadBackend();
  assert.equal(backend.normalizeCalendarItem_({ id: 1 }), null);
});

test('fetches calendar pages in blocks of 100 with bearer auth', () => {
  const pages = [
    Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
    [{ id: 101 }],
  ];
  const calls = [];
  const backend = loadBackend({
    UrlFetchApp: {
      fetch(url, options) {
        calls.push({ url, options });
        const body = pages.shift();
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify(body),
        };
      },
    },
  });
  const items = backend.fetchCalendarPages_('secret-for-test', '2026-08-03', '2026-09-30');
  assert.equal(items.length, 101);
  assert.match(calls[0].url, /start=0/);
  assert.match(calls[1].url, /start=100/);
  assert.match(calls[0].url, /date_from=2026-08-03/);
  assert.match(calls[0].url, /date_to=2026-09-30/);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer secret-for-test');
});

test('stops API sync input processing on non-2xx responses', () => {
  const backend = loadBackend({
    UrlFetchApp: {
      fetch() {
        return {
          getResponseCode: () => 401,
          getContentText: () => '{"message":"unauthorized"}',
        };
      },
    },
  });
  assert.throws(
    () => backend.fetchCalendarPages_('bad-token', '2026-08-03', '2026-09-30'),
    /API 連線失敗.*401/
  );
});
