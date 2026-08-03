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

const EXPECTED_LEAVE_HEADERS = [
  '登記時間', '原老師', '日期', '時段', '課程',
  '狀態', '代課老師', '備註', '入系統', '代課編號',
];

const EXPECTED_LEAVE_EXTENSION_HEADERS = [
  'OB Calendar ID', '實際課程 ID', '實際課程名稱', '預計難度',
  '處理類型', 'OB 核對狀態', 'OB 核對時間', '差異原因', '異動狀態',
];

const EXPECTED_COURSE_HEADERS = [
  '日期', '時間', '課程', '指導者',
  'OB Calendar ID', 'OB Class ID', 'OB 老師 ID', '是否代課', '最後同步時間',
];

function createSheetFixture(name, values) {
  return {
    name,
    values: values.map((row) => row.slice()),
    getName() { return this.name; },
    setName(nextName) { this.name = nextName; return this; },
    getLastRow() { return this.values.length; },
    getDataRange() {
      const width = Math.max(1, ...this.values.map((row) => row.length));
      return this.getRange(1, 1, Math.max(1, this.values.length), width);
    },
    getRange(row, column, numRows = 1, numColumns = 1) {
      const sheet = this;
      return {
        getValues() {
          return Array.from({ length: numRows }, (_, rowOffset) =>
            Array.from({ length: numColumns }, (_, columnOffset) =>
              (sheet.values[row - 1 + rowOffset] || [])[column - 1 + columnOffset] || ''
            )
          );
        },
        getValue() { return this.getValues()[0][0]; },
        setValue(value) { return this.setValues([[value]]); },
        setValues(nextValues) {
          nextValues.forEach((nextRow, rowOffset) => {
            const targetRow = row - 1 + rowOffset;
            while (sheet.values.length <= targetRow) sheet.values.push([]);
            nextRow.forEach((value, columnOffset) => {
              sheet.values[targetRow][column - 1 + columnOffset] = value;
            });
          });
          return this;
        },
      };
    },
  };
}

function createSpreadsheetFixture(sheets) {
  return {
    sheets,
    getSheetByName(name) { return this.sheets.find((sheet) => sheet.name === name) || null; },
    insertSheet(name) {
      const sheet = createSheetFixture(name, [[]]);
      this.sheets.push(sheet);
      return sheet;
    },
  };
}

function loadBackendWithSpreadsheet(spreadsheet) {
  return loadBackend({
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
}

test('renames the legacy leave sheet and preserves fixed headers', () => {
  const legacyLeaveSheet = createSheetFixture('工作表1', [
    EXPECTED_LEAVE_HEADERS,
    ['2026-08-03 12:00:00', 'Ariel', '2026/08/10', '18:30', '空環', '確認中', '', '', '', 'id-1'],
  ]);
  const spreadsheet = createSpreadsheetFixture([
    createSheetFixture('CourseList', [['日期', '時間', '課程', '指導者']]),
    legacyLeaveSheet,
  ]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);

  const result = backend.ensureSystemStructure_();

  assert.equal(result.leaveSheetName, '請假代課紀錄');
  assert.equal(legacyLeaveSheet.getName(), '請假代課紀錄');
  assert.deepEqual(legacyLeaveSheet.values[0].slice(0, 10), EXPECTED_LEAVE_HEADERS);
  assert.deepEqual(legacyLeaveSheet.values[1].slice(0, 10), [
    '2026-08-03 12:00:00', 'Ariel', '2026/08/10', '18:30', '空環', '確認中', '', '', '', 'id-1',
  ]);
});

test('bootstraps legacy-only leave sheets before the pending-leave handler runs', () => {
  const legacyLeaveSheet = createSheetFixture('工作表1', [EXPECTED_LEAVE_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([
    createSheetFixture('CourseList', [['日期', '時間', '課程', '指導者']]),
    legacyLeaveSheet,
  ]);
  const backend = loadBackend({
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
    LockService: {
      getScriptLock() {
        return { waitLock() {}, releaseLock() {} };
      },
    },
    ContentService: {
      MimeType: { JSON: 'application/json', TEXT: 'text/plain' },
      createTextOutput(text) {
        return {
          text,
          setMimeType() { return this; },
        };
      },
    },
  });

  const response = backend.doGet({ parameter: { action: 'getPendingLeaves' } });

  assert.equal(legacyLeaveSheet.getName(), '請假代課紀錄');
  assert.deepEqual(JSON.parse(response.text), { status: 'success', data: [] });
});

test('appends the substitute and API headers without moving fixed columns', () => {
  const leaveSheet = createSheetFixture('請假代課紀錄', [EXPECTED_LEAVE_HEADERS]);
  const courseSheet = createSheetFixture('CourseList', [['日期', '時間', '課程', '指導者']]);
  const backend = loadBackendWithSpreadsheet(createSpreadsheetFixture([courseSheet, leaveSheet]));

  backend.ensureSystemStructure_();

  assert.deepEqual(courseSheet.values[0], EXPECTED_COURSE_HEADERS);
  assert.deepEqual(leaveSheet.values[0].slice(0, 10), EXPECTED_LEAVE_HEADERS);
  assert.deepEqual(leaveSheet.values[0].slice(10), EXPECTED_LEAVE_EXTENSION_HEADERS);
});

test('creates supporting sheets and does not change the structure when rerun', () => {
  const spreadsheet = createSpreadsheetFixture([
    createSheetFixture('CourseList', [EXPECTED_COURSE_HEADERS]),
    createSheetFixture('請假代課紀錄', [EXPECTED_LEAVE_HEADERS.concat(EXPECTED_LEAVE_EXTENSION_HEADERS)]),
  ]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);

  backend.ensureSystemStructure_();
  const firstPass = spreadsheet.sheets.map((sheet) => ({ name: sheet.name, header: sheet.values[0].slice() }));
  const secondResult = backend.ensureSystemStructure_();

  assert.equal(secondResult.leaveSheetName, '請假代課紀錄');
  assert.deepEqual(
    spreadsheet.sheets.map((sheet) => ({ name: sheet.name, header: sheet.values[0].slice() })),
    firstPass
  );
  assert.deepEqual(
    spreadsheet.sheets.map((sheet) => sheet.name).sort(),
    ['CourseList', '代課邀請', '操作紀錄', '登入帳號', '系統設定', '請假代課紀錄'].sort()
  );
});

test('maps headers by their 1-based Sheet column and appends audit events', () => {
  const spreadsheet = createSpreadsheetFixture([
    createSheetFixture('CourseList', [EXPECTED_COURSE_HEADERS]),
    createSheetFixture('請假代課紀錄', [EXPECTED_LEAVE_HEADERS.concat(EXPECTED_LEAVE_EXTENSION_HEADERS)]),
  ]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);
  backend.ensureSystemStructure_();
  const auditSheet = spreadsheet.getSheetByName('操作紀錄');

  assert.equal(backend.getHeaderMap_(auditSheet)['操作類型'], 3);
  backend.appendAudit_({
    actor: 'Ivy', action: '開放代課', targetId: 'sub-1',
    before: '確認中', after: '已開放', reason: '測試',
  });

  assert.deepEqual(auditSheet.values[1].slice(1), ['Ivy', '開放代課', 'sub-1', '確認中', '已開放', '測試']);
});

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

test('allows substitute teachers to claim a course in their usual category', () => {
  const backend = loadBackend();
  assert.equal(typeof backend.requiresChangeNote_, 'function');
  assert.equal(
    backend.requiresChangeNote_(['B－空環 Lv.1'], 'C－空環 Lv.2'),
    false
  );
});

test('requires a change note for a different course category', () => {
  const backend = loadBackend();
  assert.equal(
    backend.requiresChangeNote_(['B－空環 Lv.1'], 'C－舞綢 Lv.2'),
    true
  );
});

test('unknown courses only match the same complete normalized name', () => {
  const backend = loadBackend();
  assert.equal(
    backend.requiresChangeNote_(['卡拉特別課'], '卡拉特別課'),
    false
  );
  assert.equal(
    backend.requiresChangeNote_(['卡拉特別課'], '另一堂特別課'),
    true
  );
});

test('validates required change notes', () => {
  const backend = loadBackend();
  assert.equal(typeof backend.validateChangeNote_, 'function');
  assert.throws(
    () => backend.validateChangeNote_(true, '   '),
    /請填寫要改成什麼課/
  );
  assert.equal(backend.validateChangeNote_(true, '空環 Lv.1'), '空環 Lv.1');
  assert.equal(backend.validateChangeNote_(false, ''), '');
});

test('detects duplicate active leave requests using fixed indexes', () => {
  const backend = loadBackend();
  const rows = [
    ['時間', 'Ariel Lu', '2026/08/10', '18:30', 'B－空環 Lv.2', '確認中', '', '', '', 'id-1'],
    ['時間', 'Ariel Lu', '2026/08/11', '18:30', 'B－空環 Lv.2', '已取消', '', '', '', 'id-2'],
  ];
  assert.equal(
    backend.isDuplicateLeave_(rows, 'Ariel Lu', {
      日期: '2026/08/10',
      時間: '18:30',
      課程: 'B－空環 Lv.2',
    }),
    true
  );
  assert.equal(
    backend.isDuplicateLeave_(rows, 'Ariel Lu', {
      日期: '2026/08/11',
      時間: '18:30',
      課程: 'B－空環 Lv.2',
    }),
    false
  );
});
