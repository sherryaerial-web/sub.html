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
    getLastColumn() {
      let lastColumn = 0;
      this.values.forEach((row) => row.forEach((value, index) => {
        if (value !== '') lastColumn = Math.max(lastColumn, index + 1);
      }));
      return Math.max(1, lastColumn);
    },
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
        clearContent() {
          for (let rowOffset = 0; rowOffset < numRows; rowOffset++) {
            const targetRow = row - 1 + rowOffset;
            if (!sheet.values[targetRow]) continue;
            for (let columnOffset = 0; columnOffset < numColumns; columnOffset++) {
              sheet.values[targetRow][column - 1 + columnOffset] = '';
            }
          }
          sheet.values.forEach((targetRow) => {
            while (targetRow.length && targetRow[targetRow.length - 1] === '') targetRow.pop();
          });
          while (sheet.values.length > 1 && sheet.values[sheet.values.length - 1].every((value) => value === '')) {
            sheet.values.pop();
          }
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

function createAuthServices() {
  const cache = new Map();
  const properties = new Map();
  const lockState = { depth: 0, waits: 0, releases: 0 };
  const digest = require('node:crypto');
  const services = {
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest(_algorithm, value) {
        return Array.from(digest.createHash('sha256').update(value, 'utf8').digest())
          .map((byte) => byte > 127 ? byte - 256 : byte);
      },
      getUuid() { return `session-${cache.size + properties.size + 1}`; },
      formatDate(value, _timezone, pattern) {
        const date = new Date(value);
        if (pattern === 'yyyy-MM-dd HH:mm:ss') return date.toISOString().replace('T', ' ').slice(0, 19);
        return '';
      },
    },
    CacheService: {
      getScriptCache() {
        return {
          get(key) { return cache.get(key) || null; },
          put(key, value) { cache.set(key, value); },
          remove(key) { cache.delete(key); },
        };
      },
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) { return properties.get(key) || null; },
          setProperty(key, value) { properties.set(key, value); },
          deleteProperty(key) { properties.delete(key); },
          getProperties() { return Object.fromEntries(properties); },
        };
      },
    },
    LockService: {
      getScriptLock() {
        return {
          waitLock() { lockState.depth += 1; lockState.waits += 1; },
          releaseLock() { lockState.depth -= 1; lockState.releases += 1; },
        };
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
  };
  services.__cache = cache;
  services.__properties = properties;
  services.__lockState = lockState;
  return services;
}

function createAuthBackend(accounts, services = createAuthServices()) {
  const accountSheet = createSheetFixture('登入帳號', [
    ['指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至'],
    ...accounts,
  ]);
  const spreadsheet = createSpreadsheetFixture([accountSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  return { backend, accountSheet, services };
}

function createAccount(backend, teacherName, pin, options = {}) {
  const salt = options.salt || 'fixed-salt';
  return [
    teacherName,
    salt,
    backend.hashPin_(pin, salt),
    options.active == null ? '是' : options.active,
    options.role || '老師',
    options.failedAttempts || 0,
    options.lockedUntil || '',
  ];
}

function formatTaipeiDate(value, _timezone, pattern) {
  const timestamp = value && typeof value.getTime === 'function' ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error(`invalid test date: ${String(value)} (${typeof value})`);
  }
  const date = new Date(timestamp);
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
  if (pattern === 'yyyy-MM-dd HH:mm:ss') {
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:00`;
  }
  return '';
}

function createSyncBackend(options = {}) {
  const services = createAuthServices();
  services.Utilities.formatDate = formatTaipeiDate;
  const bootstrap = loadBackend(services);
  const accountSheet = createSheetFixture('登入帳號', [
    ['指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至'],
    createAccount(bootstrap, '管理員甲', '9999', { role: '管理員' }),
    createAccount(bootstrap, '老師甲', '1234'),
  ]);
  const courseSheet = createSheetFixture('CourseList', options.courseValues || [
    EXPECTED_COURSE_HEADERS,
    ['2026/08/05', '10:00', '舊課程', '舊老師', 'old-calendar', 'old-class', 'old-teacher', '否', '2026-08-03 10:00:00'],
  ]);
  const spreadsheet = createSpreadsheetFixture([accountSheet, courseSheet]);
  const pages = (options.pages || []).slice();
  const calls = [];
  services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
    UrlFetchApp: {
      fetch(url, request) {
        calls.push({ url, request });
        const next = pages.shift();
        if (next instanceof Error) throw next;
        if (next && next.invalidJson) {
          return { getResponseCode: () => 200, getContentText: () => '{invalid-json' };
        }
        if (next && next.statusCode) {
          return { getResponseCode: () => next.statusCode, getContentText: () => next.body || '' };
        }
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify(next || []) };
      },
    },
  });
  backend.getSyncDateRange_ = () => ({ dateFrom: '2026-08-03', dateTo: '2026-09-30' });
  return {
    backend,
    courseSheet,
    calls,
    adminToken: backend.authenticate_('管理員甲', '9999').sessionToken,
    teacherToken: backend.authenticate_('老師甲', '1234').sessionToken,
  };
}

test('login returns an opaque session without exposing credentials', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')]);

  const response = backend.authenticate_('老師甲', '1234');

  assert.ok(response.sessionToken);
  assert.deepEqual(Object.keys(response).sort(), ['role', 'sessionToken', 'teacherName']);
  assert.equal('pinHash' in response, false);
  assert.equal('salt' in response, false);
  assert.equal('expiresAt' in response, false);
});

test('login rejects an invalid PIN and records a failed attempt', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend, accountSheet } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')]);

  assert.throws(() => backend.authenticate_('老師甲', '0000'), /姓名或身分證末碼不正確/);
  assert.equal(accountSheet.values[1][5], 1);
});

test('authentication locks account reads and failed-attempt writes together', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const findAccount = backend.findAccount_;
  const recordFailedLogin = backend.recordFailedLogin_;

  backend.findAccount_ = (teacherName) => {
    assert.equal(services.__lockState.depth, 1);
    return findAccount(teacherName);
  };
  backend.recordFailedLogin_ = (account) => {
    assert.equal(services.__lockState.depth, 1);
    return recordFailedLogin(account);
  };

  assert.throws(() => backend.authenticate_('老師甲', '0000'), /姓名或身分證末碼不正確/);
  assert.deepEqual(services.__lockState, { depth: 0, waits: 1, releases: 1 });
});

test('login rejects inactive accounts without creating a session', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend } = createAuthBackend([
    createAccount(bootstrap, '已停用老師', '1234', { active: '否' }),
  ]);

  assert.throws(() => backend.authenticate_('已停用老師', '1234'), /帳號目前未啟用/);
});

test('login rejects temporarily locked accounts before checking the PIN', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend } = createAuthBackend([
    createAccount(bootstrap, '老師甲', '1234', {
      failedAttempts: 5,
      lockedUntil: new Date(Date.now() + 60 * 1000).toISOString(),
    }),
  ]);

  assert.throws(() => backend.authenticate_('老師甲', '1234'), /帳號暫時鎖定/);
});

test('requireSession rejects expired sessions and removes the stored token', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')]);
  const response = backend.authenticate_('老師甲', '1234');
  backend.storeSession_(response.sessionToken, {
    teacherName: '老師甲', role: '老師', expiresAt: Date.now() - 1,
  });

  assert.throws(() => backend.requireSession_(response.sessionToken), /登入狀態已逾期/);
  assert.throws(() => backend.requireSession_(response.sessionToken), /登入狀態無效/);
});

test('requireSession rejects and removes sessions with malformed expiry values', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const token = 'malformed-expiry';
  const key = backend.getSessionKey_(token);
  services.__cache.set(key, JSON.stringify({ teacherName: '老師甲', role: '老師', expiresAt: 'not-a-date' }));

  assert.throws(() => backend.requireSession_(token), /登入狀態無效/);
  assert.equal(services.__cache.has(key), false);
});

test('cache-backed login cleans expired fallback sessions under the authentication lock', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const expiredKey = backend.getSessionKey_('expired-fallback-token');
  services.__properties.set(expiredKey, JSON.stringify({
    teacherName: '老師甲', role: '老師', expiresAt: Date.now() - 1,
  }));

  backend.authenticate_('老師甲', '1234');

  assert.equal(services.__properties.has(expiredKey), false);
  assert.equal(services.__properties.size, 1);
  assert.deepEqual(services.__lockState, { depth: 0, waits: 1, releases: 1 });
});

test('valid fallback session survives early cache eviction but expires on schedule', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const response = backend.authenticate_('老師甲', '1234');
  const key = backend.getSessionKey_(response.sessionToken);

  assert.equal(services.__properties.has(key), true);
  services.__cache.delete(key);
  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.requireSession_(response.sessionToken))),
    { teacherName: '老師甲', role: '老師' }
  );

  services.__properties.set(key, JSON.stringify({
    teacherName: '老師甲', role: '老師', expiresAt: Date.now() - 1,
  }));
  assert.throws(() => backend.requireSession_(response.sessionToken), /登入狀態已逾期/);
  assert.equal(services.__properties.has(key), false);
});

test('property fallback removes expired unused sessions before creating another session', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  delete services.CacheService;
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const expiredKey = backend.getSessionKey_('unused-expired-token');
  services.__properties.set(expiredKey, JSON.stringify({
    teacherName: '老師甲', role: '老師', expiresAt: Date.now() - 1,
  }));

  backend.authenticate_('老師甲', '1234');

  assert.equal(services.__properties.has(expiredKey), false);
  assert.equal(services.__properties.size, 1);
});

test('teacher session cannot access administrator-only helpers', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')]);
  const response = backend.authenticate_('老師甲', '1234');

  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.requireSession_(response.sessionToken))),
    { teacherName: '老師甲', role: '老師' }
  );
  assert.throws(() => backend.requireAdmin_(response.sessionToken), /管理權限/);
});

test('administrator account setup stores only salt and hash for the new teacher', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend, accountSheet } = createAuthBackend([
    createAccount(bootstrap, '管理員', '9999', { role: '管理員' }),
  ]);
  const adminSession = backend.authenticate_('管理員', '9999').sessionToken;

  const response = backend.setupAccount_(adminSession, '老師乙', '5678', { active: true, role: '老師' });

  assert.deepEqual(
    JSON.parse(JSON.stringify(response)),
    { teacherName: '老師乙', role: '老師', active: true }
  );
  assert.equal(accountSheet.values[2][0], '老師乙');
  assert.notEqual(accountSheet.values[2][1], '');
  assert.notEqual(accountSheet.values[2][2], '5678');
  assert.equal(JSON.stringify(accountSheet.values[2]).includes('5678'), false);
});

test('initializes the first administrator once without storing the plaintext PIN', () => {
  const services = createAuthServices();
  const accountSheet = createSheetFixture('登入帳號', [
    ['指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至'],
  ]);
  const spreadsheet = createSpreadsheetFixture([accountSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });

  const result = backend.initializeFirstAdmin_('Ivy', '1234');

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { teacherName: 'Ivy', role: '管理員', active: true });
  assert.equal(accountSheet.values[1][0], 'Ivy');
  assert.notEqual(accountSheet.values[1][2], '1234');
  assert.equal(backend.authenticate_('Ivy', '1234').role, '管理員');
  assert.throws(() => backend.initializeFirstAdmin_('另一位', '5678'), /已有帳號/);
});

test('initializes the first administrator from temporary Script Properties and removes the PIN', () => {
  const services = createAuthServices();
  services.__properties.set('INITIAL_ADMIN_NAME', 'Ivy');
  services.__properties.set('INITIAL_ADMIN_PIN', '1234');
  const accountSheet = createSheetFixture('登入帳號', [
    ['指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至'],
  ]);
  const spreadsheet = createSpreadsheetFixture([accountSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });

  const result = backend.initializeFirstAdminFromProperties();

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { teacherName: 'Ivy', role: '管理員', active: true });
  assert.equal(services.__properties.has('INITIAL_ADMIN_NAME'), false);
  assert.equal(services.__properties.has('INITIAL_ADMIN_PIN'), false);
  assert.equal(JSON.stringify(accountSheet.values[1]).includes('1234'), false);
});

test('personal and write routes require a session and ignore forged teacher parameters', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const sessionToken = backend.authenticate_('老師甲', '1234').sessionToken;
  const calls = [];
  backend.console = { error() {} };
  backend.ensureSystemStructure_ = () => {};
  backend.getMySubs_ = (teacherName) => { calls.push(['mySubs', teacherName]); return []; };
  backend.submitLeave_ = (teacherName, items) => { calls.push(['leave', teacherName, items.length]); return { count: items.length }; };
  backend.submitClaim_ = (teacherName, items) => { calls.push(['claim', teacherName, items.length]); return { count: items.length }; };

  const missingSession = JSON.parse(backend.doGet({ parameter: {
    action: 'getMySubs', name: '被偽造的老師',
  } }).text);
  assert.equal(missingSession.status, 'error');
  assert.match(missingSession.message, /請先登入/);

  backend.doGet({ parameter: {
    action: 'getMySubs', sessionToken, name: '被偽造的老師',
  } });
  backend.doGet({ parameter: {
    action: 'submitLeave', sessionToken, instructor: '被偽造的老師', items: JSON.stringify([{ 日期: '2026/08/10', 時間: '18:30', 課程: '空環' }]),
  } });
  backend.doGet({ parameter: {
    action: 'submitClaim', sessionToken, subTeacher: '被偽造的老師', items: JSON.stringify([{ substituteId: 'sub-1' }]),
  } });

  assert.deepEqual(calls, [
    ['mySubs', '老師甲'],
    ['leave', '老師甲', 1],
    ['claim', '老師甲', 1],
  ]);
});

test('pending leaves route rejects requests without a session', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  backend.console = { error() {} };
  backend.ensureSystemStructure_ = () => {};
  backend.getPendingLeaves_ = () => [{ '原老師': '老師乙' }];

  const response = JSON.parse(backend.doGet({ parameter: { action: 'getPendingLeaves' } }).text);

  assert.equal(response.status, 'error');
  assert.match(response.message, /請先登入/);
});

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
  backend.requireSession_ = () => ({ teacherName: '測試老師', role: '老師' });

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
    class: { id: 86, nameZhHant: 'B－空環 Lv.2' },
    instructors: [{ id: 42, firstName: 'Ariel', lastName: 'Lu', isSubstitute: false }],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    apiId: '7788',
    calendarId: '7788',
    date: '2026/08/10',
    time: '18:30',
    course: 'B－空環 Lv.2',
    instructor: 'Ariel Lu',
    classId: '86',
    instructorId: '42',
    isSubstitute: '否',
  });
});

test('rejects calendar items missing required values', () => {
  const backend = loadBackend();
  assert.equal(backend.normalizeCalendarItem_({ id: 1 }), null);
  assert.equal(backend.normalizeCalendarItem_({
    id: 2,
    classTime: '2026-08-10T10:30:00Z',
    class: { nameZhHant: '缺少課程 ID' },
    instructors: [{ id: 42, firstName: '老師', lastName: '甲' }],
  }), null);
  assert.equal(backend.normalizeCalendarItem_({
    id: 3,
    classTime: '2026-08-10T10:30:00Z',
    class: { id: 86, nameZhHant: '缺少老師 ID' },
    instructors: [{ firstName: '老師', lastName: '乙' }],
  }), null);
});

test('prefers the current substitute instructor over the original instructor', () => {
  const backend = loadBackend();
  const result = backend.normalizeCalendarItem_({
    id: 7790,
    classTime: '2026-08-10T10:30:00Z',
    class: { id: 88, nameZhHant: 'B－空環 Lv.2' },
    instructors: [
      { id: 41, firstName: '原', lastName: '老師', isSubstitute: false },
      { id: 42, firstName: '代', lastName: '課老師', isSubstitute: true },
    ],
  });

  assert.equal(result.instructor, '代 課老師');
  assert.equal(result.instructorId, '42');
  assert.equal(result.isSubstitute, '是');
});

test('uses the first listed instructor when Calendar has no substitute instructor', () => {
  const backend = loadBackend();
  const result = backend.normalizeCalendarItem_({
    id: 7791,
    classTime: '2026-08-10T10:30:00Z',
    class: { id: 89, nameZhHant: 'B－空環 Lv.2' },
    instructors: [
      { id: 51, firstName: '第一位', lastName: '老師', isSubstitute: false },
      { id: 52, firstName: '第二位', lastName: '老師', isSubstitute: false },
    ],
  });

  assert.equal(result.instructor, '第一位 老師');
  assert.equal(result.instructorId, '51');
  assert.equal(result.isSubstitute, '否');
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

test('manual sync requires an administrator and preserves the old snapshot on invalid Calendar data', () => {
  const { backend, courseSheet, adminToken, teacherToken } = createSyncBackend({
    pages: [{ invalidJson: true }],
  });
  const oldValues = JSON.parse(JSON.stringify(courseSheet.values));

  assert.throws(() => backend.syncCourseListFromApi(teacherToken), /管理權限/);
  assert.deepEqual(courseSheet.values, oldValues);

  assert.throws(() => backend.syncCourseListFromApi(adminToken), /JSON 無法解析/);
  assert.deepEqual(courseSheet.values, oldValues);
});

test('manual sync preserves the old snapshot when Calendar returns no valid active classes', () => {
  const { backend, courseSheet, adminToken } = createSyncBackend({
    pages: [[{
      id: 900,
      cancelled: true,
      classTime: '2026-08-10T10:30:00Z',
      class: { id: 1, nameZhHant: '已取消課程' },
      instructors: [{ id: 2, firstName: '取消', lastName: '老師' }],
    }]],
  });
  const oldValues = JSON.parse(JSON.stringify(courseSheet.values));

  assert.throws(() => backend.syncCourseListFromApi(adminToken), /沒有取得有效課程/);
  assert.deepEqual(courseSheet.values, oldValues);
});

test('manual sync preserves the old snapshot when Calendar returns an HTTP error', () => {
  const { backend, courseSheet, adminToken } = createSyncBackend({
    pages: [{ statusCode: 503, body: '{"message":"unavailable"}' }],
  });
  const oldValues = JSON.parse(JSON.stringify(courseSheet.values));

  assert.throws(() => backend.syncCourseListFromApi(adminToken), /API 連線失敗.*503/);
  assert.deepEqual(courseSheet.values, oldValues);
});

test('manual sync rejects a mixed valid and missing-ID payload without touching the old snapshot', () => {
  const { backend, courseSheet, adminToken } = createSyncBackend({
    courseValues: [
      ['日期', '時間', '課程', '指導者'],
      ['2026/08/05', '10:00', '舊課程', '舊老師'],
    ],
    pages: [[
      {
        id: 1001,
        classTime: '2026-08-10T10:30:00Z',
        class: { id: 101, nameZhHant: '有效課程' },
        instructors: [{ id: 201, firstName: '有效', lastName: '老師' }],
      },
      {
        id: 1002,
        classTime: '2026-08-10T12:30:00Z',
        class: { nameZhHant: '缺少課程 ID' },
        instructors: [{ id: 202, firstName: '無效', lastName: '老師' }],
      },
    ]],
  });
  const oldValues = JSON.parse(JSON.stringify(courseSheet.values));

  assert.throws(() => backend.syncCourseListFromApi(adminToken), /第 2 筆.*無效課程資料/);
  assert.deepEqual(courseSheet.values, oldValues);
});

test('manual sync validates all headers before any header or data mutation', () => {
  const { backend, courseSheet, adminToken } = createSyncBackend({
    courseValues: [
      ['日期', '時間', '課程', '指導者', '', '錯誤欄位', '', '', ''],
      ['2026/08/05', '10:00', '舊課程', '舊老師', '', '', '', '', ''],
    ],
    pages: [[{
      id: 1003,
      classTime: '2026-08-10T10:30:00Z',
      class: { id: 103, nameZhHant: '有效課程' },
      instructors: [{ id: 203, firstName: '有效', lastName: '老師' }],
    }]],
  });
  const oldValues = JSON.parse(JSON.stringify(courseSheet.values));

  assert.throws(() => backend.syncCourseListFromApi(adminToken), /第 6 欄標題/);
  assert.deepEqual(courseSheet.values, oldValues);
});

test('manual sync restores the exact old snapshot when its second Sheet write fails', () => {
  const { backend, courseSheet, adminToken } = createSyncBackend({
    courseValues: [
      ['日期', '時間', '課程', '指導者'],
      ['2026/08/05', '10:00', '舊課程', '舊老師'],
    ],
    pages: [[{
      id: 1004,
      classTime: '2026-08-10T10:30:00Z',
      class: { id: 104, nameZhHant: '新課程' },
      instructors: [{ id: 204, firstName: '新', lastName: '老師' }],
    }]],
  });
  const oldValues = JSON.parse(JSON.stringify(courseSheet.values));
  const originalGetRange = courseSheet.getRange.bind(courseSheet);
  let setValuesCalls = 0;
  courseSheet.getRange = function(...args) {
    const range = originalGetRange(...args);
    const originalSetValues = range.setValues.bind(range);
    range.setValues = function(values) {
      setValuesCalls += 1;
      if (setValuesCalls === 2) throw new Error('injected header write failure');
      return originalSetValues(values);
    };
    return range;
  };

  assert.throws(() => backend.syncCourseListFromApi(adminToken), /injected header write failure/);
  assert.deepEqual(courseSheet.values, oldValues);
});

test('manual sync fetches every page and replaces CourseList with appended OB metadata', () => {
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    classTime: `2026-08-10T${String(index % 20).padStart(2, '0')}:30:00Z`,
    class: { id: 1000 + index, nameZhHant: `空環 ${index + 1}` },
    instructors: [{ id: 2000 + index, firstName: '老師', lastName: String(index + 1) }],
  }));
  firstPage[0].cancelled = true;
  const { backend, courseSheet, calls, adminToken } = createSyncBackend({
    courseValues: [
      ['日期', '時間', '課程', '指導者'],
      ['2026/08/05', '10:00', '舊課程', '舊老師'],
    ],
    pages: [firstPage, [{
      id: 101,
      classTime: '2026-08-11T10:30:00Z',
      class: { id: 1101, nameZhHant: '舞綢 101' },
      instructors: [{ id: 2101, firstName: '新', lastName: '老師' }],
    }]],
  });

  const result = backend.syncCourseListFromApi(adminToken);

  assert.equal(result.status, 'success');
  assert.equal(result.count, 100);
  assert.match(calls[0].url, /start=0/);
  assert.match(calls[1].url, /start=100/);
  assert.deepEqual(courseSheet.values[0], EXPECTED_COURSE_HEADERS);
  assert.deepEqual(courseSheet.values[1].slice(0, 8), [
    '2026/08/10', '08:30', '空環 21', '老師 21', '21', '1020', '2020', '否',
  ]);
  assert.equal(courseSheet.values.length, 101);
  assert.equal(courseSheet.values.some((row) => row[2] === '舊課程'), false);
  assert.equal(courseSheet.values.some((row) => row[2] === '空環 1'), false);
});

test('manual sync no longer exposes an hourly trigger installation command', () => {
  const backend = loadBackend();
  assert.equal(typeof backend.installHourlySyncTrigger, 'undefined');
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
