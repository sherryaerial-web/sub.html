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
  '實際課程類別', '替代 OB Calendar ID',
];

const EXPECTED_ACCOUNT_HEADERS = [
  '指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至',
  '可教授類別',
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

function createPasswordImportRows() {
  return Array.from({ length: 37 }, (_, index) => [
    `老師${String(index + 1).padStart(2, '0')}`,
    String(1000 + index),
  ]);
}

function createPasswordImportBackend(rows, options = {}) {
  const services = createAuthServices();
  let uuid = 0;
  services.Utilities.getUuid = () => `password-import-${++uuid}`;
  const bootstrap = loadBackend(services);
  const existingAccounts = options.existingAccounts || [
    createAccount(bootstrap, '系統管理員', '9999', { role: '管理員' }).concat(''),
  ];
  const accountSheet = createSheetFixture('登入帳號', [
    EXPECTED_ACCOUNT_HEADERS,
    ...existingAccounts,
  ]);
  const passwordSheet = createSheetFixture('密碼表', [
    ['老師', '密碼'],
    ...rows,
  ]);
  const spreadsheet = createSpreadsheetFixture([accountSheet, passwordSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  return { backend, services, spreadsheet, accountSheet, passwordSheet };
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
    services,
    spreadsheet,
    courseSheet,
    calls,
    adminToken: backend.authenticate_('管理員甲', '9999').sessionToken,
    teacherToken: backend.authenticate_('老師甲', '1234').sessionToken,
  };
}

function createLeaveBackend(options = {}) {
  const services = createAuthServices();
  let uuid = 0;
  services.Utilities.getUuid = () => `uuid-${++uuid}`;
  const bootstrap = loadBackend(services);
  const accountSheet = createSheetFixture('登入帳號', [
    ['指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至'],
    createAccount(bootstrap, '老師甲', '1234'),
    createAccount(bootstrap, '老師乙', '5678'),
  ]);
  const teacherSheet = createSheetFixture('老師名單', [
    ['指導者'],
    ['老師甲'],
    ['老師乙'],
  ]);
  const courseRows = options.courseRows || Array.from({ length: 25 }, (_, index) => [
    `2026/08/${String(10 + Math.floor(index / 5)).padStart(2, '0')}`,
    `${String(9 + (index % 5)).padStart(2, '0')}:00`,
    `空環 Lv.${index + 1}`,
    '老師甲',
    `calendar-${index + 1}`,
    `class-${index + 1}`,
    'teacher-1',
    '否',
    '2026-08-03 12:00:00',
  ]);
  const courseSheet = createSheetFixture('CourseList', [EXPECTED_COURSE_HEADERS, ...courseRows]);
  const leaveSheet = createSheetFixture('請假代課紀錄', [
    EXPECTED_LEAVE_HEADERS.concat(EXPECTED_LEAVE_EXTENSION_HEADERS),
    ...(options.leaveRows || []),
  ]);
  const spreadsheet = createSpreadsheetFixture([accountSheet, teacherSheet, courseSheet, leaveSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  return {
    backend,
    courseSheet,
    leaveSheet,
    spreadsheet,
    sessionToken: backend.authenticate_('老師甲', '1234').sessionToken,
  };
}

function createInvitationBackend(options = {}) {
  const services = createAuthServices();
  let uuid = 0;
  services.Utilities.getUuid = () => `invitation-uuid-${++uuid}`;
  const bootstrap = loadBackend(services);
  const accountSheet = createSheetFixture('登入帳號', [
    EXPECTED_ACCOUNT_HEADERS,
    createAccount(bootstrap, '管理員甲', '9999', { role: '管理員' }).concat('空環'),
    createAccount(bootstrap, '老師甲', '1234').concat(options.teacherACapabilities || '空環'),
    createAccount(bootstrap, '老師乙', '5678').concat(options.teacherBCapabilities || '空環'),
    createAccount(bootstrap, '老師丙', '2468').concat(options.teacherCCapabilities || '空環'),
  ]);
  const teacherSheet = createSheetFixture('老師名單', [
    ['指導者'],
    ['管理員甲'],
    ['老師甲'],
    ['老師乙'],
    ['老師丙'],
  ]);
  const courseSheet = createSheetFixture('CourseList', [
    EXPECTED_COURSE_HEADERS,
    ...(options.courseRows || [
      ['2026/08/01', '09:00', '空環 Lv.1', '老師甲', 'calendar-a', 'class-ring-1', 'teacher-a', '否', ''],
      ['2026/08/01', '10:00', '空環 Lv.1', '老師乙', 'calendar-b', 'class-ring-1', 'teacher-b', '否', ''],
      ['2026/08/01', '11:00', '空環 Lv.1', '老師丙', 'calendar-c', 'class-ring-1', 'teacher-c', '否', ''],
      ['2026/08/02', '12:00', '舞綢 Lv.1', '老師丙', 'calendar-silk', 'class-silk-1', 'teacher-c', '否', ''],
    ]),
  ]);
  const leaveSheet = createSheetFixture('請假代課紀錄', [
    EXPECTED_LEAVE_HEADERS.concat(EXPECTED_LEAVE_EXTENSION_HEADERS),
    ...(options.leaveRows || [
      ['2026-08-03 09:00:00', '老師甲', '2026/08/10', '09:00', '空環 Lv.1', '確認中', '', '', '', 'leave-a', 'calendar-a'],
      ['2026-08-03 09:05:00', '老師乙', '2026/08/10', '10:00', '空環 Lv.1', '確認中', '', '', '', 'leave-b', 'calendar-b'],
      ['2026-08-03 09:10:00', '老師丙', '2026/08/11', '11:00', '空環 Lv.1', '確認中', '', '', '', 'leave-c', 'calendar-c'],
      ['2026-08-03 09:15:00', '老師丙', '2026/08/12', '12:00', '空環 Lv.1', '已領取', '老師乙', '', '', 'leave-claimed', 'calendar-claimed'],
    ]),
  ]);
  const invitationSheet = createSheetFixture('代課邀請', [
    ['邀請編號', '老師', '開放時間', '首次查看時間', '狀態', '關閉時間'],
    ...(options.invitationRows || []),
  ]);
  const auditSheet = createSheetFixture('操作紀錄', [[
    '操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因',
  ]]);
  const settingsSheet = createSheetFixture('系統設定', [[
    '設定名稱', '設定值', '更新時間', '備註',
  ]]);
  const spreadsheet = createSpreadsheetFixture([
    accountSheet,
    teacherSheet,
    courseSheet,
    leaveSheet,
    invitationSheet,
    auditSheet,
    settingsSheet,
  ]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  const adminToken = backend.authenticate_('管理員甲', '9999').sessionToken;
  const teacherAToken = backend.authenticate_('老師甲', '1234').sessionToken;
  const teacherBToken = backend.authenticate_('老師乙', '5678').sessionToken;

  return {
    backend,
    services,
    spreadsheet,
    accountSheet,
    courseSheet,
    leaveSheet,
    invitationSheet,
    auditSheet,
    settingsSheet,
    adminToken,
    teacherAToken,
    teacherBToken,
    adminSession: { teacherName: '管理員甲', role: '管理員' },
    teacherASession: { teacherName: '老師甲', role: '老師' },
    teacherBSession: { teacherName: '老師乙', role: '老師' },
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

test('teacher password bulk import validates all 37 rows before changing any account or plaintext cell', () => {
  const rows = createPasswordImportRows();
  rows[9][1] = '12A4';
  const { backend, services, accountSheet, passwordSheet } = createPasswordImportBackend(rows);
  const accountsBefore = JSON.stringify(accountSheet.values);
  const passwordsBefore = passwordSheet.values.slice(1).map((row) => row[1]);

  assert.throws(
    () => backend.importTeacherAccountsFromPasswordSheet(),
    /第 11 列.*4 位數字/
  );
  assert.equal(JSON.stringify(accountSheet.values), accountsBefore);
  assert.deepEqual(passwordSheet.values.slice(1).map((row) => row[1]), passwordsBefore);
  assert.equal(services.__properties.has('TEACHER_PASSWORD_IMPORT_COMPLETED_AT'), false);
});

test('teacher password bulk import rejects duplicate teacher names without partial writes', () => {
  const rows = createPasswordImportRows();
  rows[20][0] = rows[0][0];
  const { backend, accountSheet, passwordSheet } = createPasswordImportBackend(rows);
  const accountsBefore = JSON.stringify(accountSheet.values);

  assert.throws(
    () => backend.importTeacherAccountsFromPasswordSheet(),
    /老師姓名重複.*第 22 列/
  );
  assert.equal(JSON.stringify(accountSheet.values), accountsBefore);
  assert.equal(passwordSheet.values[1][1], '1000');
  assert.equal(passwordSheet.values[21][1], '1020');
});

test('teacher password bulk import hashes every PIN and clears plaintext only after all accounts succeed', () => {
  const rows = createPasswordImportRows();
  const services = createAuthServices();
  const bootstrap = loadBackend(services);
  const existingTeacher = createAccount(bootstrap, '老師01', '7777', {
    active: '否',
    role: '老師',
  }).concat('空環');
  const { backend, accountSheet, passwordSheet, spreadsheet } = createPasswordImportBackend(rows, {
    existingAccounts: [
      createAccount(bootstrap, '系統管理員', '9999', { role: '管理員' }).concat(''),
      existingTeacher,
    ],
  });

  const result = backend.importTeacherAccountsFromPasswordSheet();

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    sourceSheet: '密碼表',
    imported: 37,
    created: 36,
    updated: 1,
  });
  assert.equal(accountSheet.values.length, 39);
  const imported = accountSheet.values.find((row) => row[0] === '老師01');
  assert.notEqual(imported[1], '');
  assert.equal(imported[2], backend.hashPin_('1000', imported[1]));
  assert.equal(imported.includes('1000'), false);
  assert.equal(imported[3], '是');
  assert.equal(imported[4], '老師');
  assert.equal(imported[7], '');
  assert.deepEqual(passwordSheet.values.slice(1, 38).map((row) => row[0]), rows.map((row) => row[0]));
  assert.deepEqual(passwordSheet.values.slice(1, 38).map((row) => row[1] || ''), Array(37).fill(''));
  assert.equal(spreadsheet.getSheetByName('密碼表'), passwordSheet);
  assert.ok(backend.getScriptProperties_().getProperty('TEACHER_PASSWORD_IMPORT_COMPLETED_AT'));
  assert.throws(() => backend.importTeacherAccountsFromPasswordSheet(), /已經完成過/);
});

test('teacher password bulk import keeps every plaintext PIN when the account batch write fails', () => {
  const rows = createPasswordImportRows();
  const { backend, services, accountSheet, passwordSheet } = createPasswordImportBackend(rows);
  const accountsBefore = JSON.stringify(accountSheet.values);
  const originalGetRange = accountSheet.getRange.bind(accountSheet);
  accountSheet.getRange = function(row, column, numRows = 1, numColumns = 1) {
    const range = originalGetRange(row, column, numRows, numColumns);
    if (column === 1 && numRows > 1 && numColumns === EXPECTED_ACCOUNT_HEADERS.length) {
      range.setValues = () => { throw new Error('injected account batch write failure'); };
    }
    return range;
  };

  assert.throws(
    () => backend.importTeacherAccountsFromPasswordSheet(),
    /injected account batch write failure/
  );
  assert.equal(JSON.stringify(accountSheet.values), accountsBefore);
  assert.deepEqual(passwordSheet.values.slice(1).map((row) => row[1]), rows.map((row) => row[1]));
  assert.equal(services.__properties.has('TEACHER_PASSWORD_IMPORT_COMPLETED_AT'), false);
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

test('personal GET and POST write routes require a session and ignore forged teacher parameters', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const sessionToken = backend.authenticate_('老師甲', '1234').sessionToken;
  const calls = [];
  backend.console = { error() {} };
  backend.ensureSystemStructure_ = () => {};
  backend.getMySubs_ = (teacherName) => { calls.push(['mySubs', teacherName]); return []; };
  backend.submitLeave_ = (session, items) => { calls.push(['leave', session.teacherName, items.length]); return { count: items.length }; };
  backend.claimSubstitute_ = (session, items) => { calls.push(['claim', session.teacherName, items.length]); return { count: items.length }; };

  const missingSession = JSON.parse(backend.doGet({ parameter: {
    action: 'getMySubs', name: '被偽造的老師',
  } }).text);
  assert.equal(missingSession.status, 'error');
  assert.match(missingSession.message, /請先登入/);

  backend.doGet({ parameter: {
    action: 'getMySubs', sessionToken, name: '被偽造的老師',
  } });
  const getWrite = JSON.parse(backend.doGet({ parameter: {
    action: 'submitLeave', sessionToken, instructor: '被偽造的老師', items: JSON.stringify([{ 日期: '2026/08/10', 時間: '18:30', 課程: '空環' }]),
  } }).text);
  assert.equal(getWrite.status, 'error');
  assert.match(getWrite.message, /不支援的操作/);

  backend.doPost({ parameter: {
    action: 'submitLeave', sessionToken, instructor: '被偽造的老師', items: JSON.stringify([{ 日期: '2026/08/10', 時間: '18:30', 課程: '空環', 'OB Calendar ID': 'calendar-1' }]),
  } });
  backend.doPost({ parameter: {
    action: 'claimSubstitute', sessionToken, subTeacher: '被偽造的老師', items: JSON.stringify([{ substituteId: 'leave-1' }]),
  } });

  assert.deepEqual(calls, [
    ['mySubs', '老師甲'],
    ['leave', '老師甲', 1],
    ['claim', '老師甲', 1],
  ]);
});

test('available substitutes route rejects requests without a session', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  backend.console = { error() {} };
  backend.ensureSystemStructure_ = () => {};
  backend.getAvailableSubstitutes_ = () => [{ '原老師': '老師乙' }];

  const response = JSON.parse(backend.doGet({ parameter: { action: 'getAvailableSubstitutes' } }).text);

  assert.equal(response.status, 'error');
  assert.match(response.message, /請先登入/);
});

test('getMyCourses returns only the logged-in teacher courses with stable OB IDs', () => {
  const { backend } = createLeaveBackend({
    courseRows: [
      ['2026/08/10', '18:30', '空環 Lv.1', '老師甲', 'calendar-a', 'class-a', 'teacher-a', '否', ''],
      ['2026/08/10', '19:30', '舞綢 Lv.1', '老師乙', 'calendar-b', 'class-b', 'teacher-b', '否', ''],
    ],
  });

  const result = backend.getMyCourses_({ teacherName: '老師甲', role: '老師' });

  assert.deepEqual(JSON.parse(JSON.stringify(result)), [{
    '日期': '2026/08/10',
    '時間': '18:30',
    '課程': '空環 Lv.1',
    '課程大類': '空環',
    'OB Calendar ID': 'calendar-a',
  }]);
});

test('getMyCourses hides active leave IDs but keeps cancelled leave courses available', () => {
  const { backend } = createLeaveBackend({
    courseRows: [
      ['2026/08/10', '18:30', '空環 Lv.1', '老師甲', 'calendar-active', 'class-a', 'teacher-a', '否', ''],
      ['2026/08/11', '19:30', '空環 Lv.2', '老師甲', 'calendar-cancelled', 'class-b', 'teacher-a', '否', ''],
    ],
    leaveRows: [
      ['時間', '老師甲', '2026/08/10', '18:30', '空環 Lv.1', '確認中', '', '', '', 'leave-a', 'calendar-active'],
      ['時間', '老師甲', '2026/08/11', '19:30', '空環 Lv.2', '已取消', '', '', '', 'leave-b', 'calendar-cancelled'],
    ],
  });

  const result = backend.getMyCourses_({ teacherName: '老師甲', role: '老師' });

  assert.deepEqual(result.map((item) => item['OB Calendar ID']), ['calendar-cancelled']);
});

test('getMyLeaves returns personal status, substitute, intended course, verification, and cancellation state', () => {
  const { backend } = createLeaveBackend({
    courseRows: [],
    leaveRows: [
      ['2026-08-03 12:00:00', '老師甲', '2026/08/10', '18:30', '空環 Lv.1', '已領取', '老師乙', '調整程度', '已完成', 'leave-a', 'calendar-a', 'class-new', '空環 Lv.2', 'Lv.2', '改用既有 OB 課程', '已核對', '2026-08-04 10:00:00', '', '申請取消中'],
      ['2026-08-03 13:00:00', '老師乙', '2026/08/11', '19:30', '舞綢 Lv.1', '確認中', '', '', '', 'leave-b', 'calendar-b'],
    ],
  });

  const result = backend.getMyLeaves_({ teacherName: '老師甲', role: '老師' });

  assert.equal(result.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(result[0])), {
    '登記時間': '2026-08-03 12:00:00',
    '代課編號': 'leave-a',
    '日期': '2026/08/10',
    '時段': '18:30',
    '課程': '空環 Lv.1',
    '狀態': '已領取',
    '代課老師': '老師乙',
    '備註': '調整程度',
    '實際課程名稱': '空環 Lv.2',
    '預計難度': 'Lv.2',
    '處理類型': '改用既有 OB 課程',
    'OB 核對狀態': '已核對',
    'OB 核對時間': '2026-08-04 10:00:00',
    '差異原因': '',
    '異動狀態': '申請取消中',
    '可自行取消': false,
    '可申請取消': false,
    '異動紀錄': [],
  });
});

test('submitLeave uses the logged-in identity, stores OB IDs, and reports exact counts', () => {
  const { backend, courseSheet, leaveSheet } = createLeaveBackend();
  const items = courseSheet.values.slice(1).map((row) => ({
    日期: row[0],
    時間: row[1],
    課程: row[2],
    'OB Calendar ID': row[4],
    instructor: '老師乙',
  }));

  const result = backend.submitLeave_({ teacherName: '老師甲', role: '老師' }, items);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    requested: 25,
    created: 25,
    duplicates: 0,
    failed: 0,
  });
  assert.equal(leaveSheet.values.length, 26);
  assert.equal(leaveSheet.values[1][1], '老師甲');
  assert.equal(leaveSheet.values[25][1], '老師甲');
  assert.equal(leaveSheet.values[1][10], 'calendar-1');
  assert.equal(leaveSheet.values[25][10], 'calendar-25');
});

test('retrying a successful leave batch reports duplicates without appending rows again', () => {
  const { backend, courseSheet, leaveSheet } = createLeaveBackend();
  const items = courseSheet.values.slice(1).map((row) => ({
    日期: row[0], 時間: row[1], 課程: row[2], 'OB Calendar ID': row[4],
  }));

  backend.submitLeave_({ teacherName: '老師甲', role: '老師' }, items);
  const retry = backend.submitLeave_({ teacherName: '老師甲', role: '老師' }, items);

  assert.deepEqual(JSON.parse(JSON.stringify(retry)), {
    requested: 25,
    created: 0,
    duplicates: 25,
    failed: 0,
  });
  assert.equal(leaveSheet.values.length, 26);
});

test('submitLeave reports per-item failures while preserving valid rows', () => {
  const { backend, leaveSheet } = createLeaveBackend({
    courseRows: [
      ['2026/08/10', '18:30', '空環 Lv.1', '老師甲', 'calendar-a', 'class-a', 'teacher-a', '否', ''],
    ],
  });

  const result = backend.submitLeave_({ teacherName: '老師甲', role: '老師' }, [
    { 日期: '2026/08/10', 時間: '18:30', 課程: '空環 Lv.1', 'OB Calendar ID': 'calendar-a' },
    { 日期: '2026/08/11', 時間: '19:30', 課程: '不存在', 'OB Calendar ID': 'calendar-missing' },
  ]);

  assert.equal(result.requested, 2);
  assert.equal(result.created, 1);
  assert.equal(result.duplicates, 0);
  assert.equal(result.failed, 1);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].calendarId, 'calendar-missing');
  assert.match(result.errors[0].message, /找不到.*有效課程/);
  assert.equal(leaveSheet.values.length, 2);
});

test('doPost parses a form-encoded leave batch and binds it to the authenticated session', () => {
  const { backend, courseSheet, sessionToken } = createLeaveBackend();
  const items = courseSheet.values.slice(1).map((row) => ({
    日期: row[0], 時間: row[1], 課程: row[2], 'OB Calendar ID': row[4], instructor: '老師乙',
  }));
  const body = new URLSearchParams({
    action: 'submitLeave',
    sessionToken,
    instructor: '老師乙',
    items: JSON.stringify(items),
  }).toString();

  const response = JSON.parse(backend.doPost({
    parameter: {},
    postData: { type: 'application/x-www-form-urlencoded', contents: body },
  }).text);

  assert.equal(response.status, 'success');
  assert.deepEqual(response.data, {
    requested: 25,
    created: 25,
    duplicates: 0,
    failed: 0,
  });
});

test('personal GET routes use the authenticated identity and ignore forged names', () => {
  const { backend, sessionToken } = createLeaveBackend({ courseRows: [] });
  const calls = [];
  backend.ensureSystemStructure_ = () => {};
  backend.getMyCourses_ = (session) => { calls.push(['courses', session.teacherName]); return []; };
  backend.getMyLeaves_ = (session) => { calls.push(['leaves', session.teacherName]); return []; };

  backend.doGet({ parameter: { action: 'getMyCourses', sessionToken, name: '老師乙' } });
  backend.doGet({ parameter: { action: 'getMyLeaves', sessionToken, name: '老師乙' } });

  assert.deepEqual(calls, [['courses', '老師甲'], ['leaves', '老師甲']]);
});

test('public routes no longer expose the complete classroom course list', () => {
  const { backend } = createLeaveBackend();
  backend.console = { error() {} };

  const response = JSON.parse(backend.doGet({ parameter: { action: 'getCourseList' } }).text);

  assert.equal(response.status, 'error');
  assert.match(response.message, /不支援的操作/);
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

test('bootstraps legacy-only leave sheets before the available-substitute handler runs', () => {
  const legacyLeaveSheet = createSheetFixture('工作表1', [EXPECTED_LEAVE_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([
    createSheetFixture('CourseList', [['日期', '時間', '課程', '指導者']]),
    createSheetFixture('老師名單', [['指導者'], ['測試老師']]),
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

  const response = backend.doGet({ parameter: { action: 'getAvailableSubstitutes' } });

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

test('manual sync audit write stays inside one script lock without nested acquisition', () => {
  const { backend, services, spreadsheet, adminToken } = createSyncBackend({
    pages: [[{
      id: 1100,
      classTime: '2026-08-10T10:30:00Z',
      class: { id: 2100, nameZhHant: '空環 Lv.1' },
      instructors: [{ id: 3100, firstName: '代課', lastName: '老師', isSubstitute: true }],
    }]],
  });
  const originalAppendAudit = backend.appendAudit_;
  const waitsBeforeSync = services.__lockState.waits;
  const releasesBeforeSync = services.__lockState.releases;
  let auditLockDepth = -1;
  backend.appendAudit_ = (event) => {
    auditLockDepth = services.__lockState.depth;
    return originalAppendAudit(event);
  };

  backend.syncCourseListFromApi(adminToken);

  const auditSheet = spreadsheet.getSheetByName('操作紀錄');
  assert.equal(auditLockDepth, 1);
  assert.equal(services.__lockState.waits, waitsBeforeSync + 1);
  assert.equal(services.__lockState.releases, releasesBeforeSync + 1);
  assert.equal(services.__lockState.depth, 0);
  assert.equal(auditSheet.values.length, 2);
  assert.equal(auditSheet.values[1][2], '同步 OB 課表');
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

test('admin can manually invite one or many teachers without duplicate active invitations', () => {
  const { backend, invitationSheet, auditSheet, adminSession } = createInvitationBackend();

  const first = backend.openInvitations_(adminSession, ['老師甲']);
  const second = backend.openInvitations_(adminSession, ['老師甲', '老師乙', '老師乙']);

  assert.deepEqual(JSON.parse(JSON.stringify(first)), {
    requested: 1,
    opened: 1,
    alreadyOpen: 0,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(second)), {
    requested: 2,
    opened: 1,
    alreadyOpen: 1,
  });
  assert.equal(invitationSheet.values.length, 3);
  assert.deepEqual(invitationSheet.values.slice(1).map((row) => row[1]), ['老師甲', '老師乙']);
  assert.ok(invitationSheet.values.slice(1).every((row) => row[0] && row[2] && row[4] === '開放中'));
  assert.equal(auditSheet.values.filter((row) => row[2] === '開放代課').length, 2);
  assert.ok(auditSheet.values.slice(1).every((row) => row[0]));
});

test('uninvited teacher cannot list pending substitutes', () => {
  const { backend, teacherASession } = createInvitationBackend();

  const rows = backend.getAvailableSubstitutes_(teacherASession);

  assert.deepEqual(JSON.parse(JSON.stringify(rows)), []);
});

test('invited teacher sees all pending substitutes except their own leave without invitation metadata', () => {
  const { backend, invitationSheet, adminSession, teacherASession } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);

  const firstRows = backend.getAvailableSubstitutes_(teacherASession);
  const firstViewedAt = invitationSheet.values[1][3];
  const secondRows = backend.getAvailableSubstitutes_(teacherASession);

  assert.deepEqual(firstRows.map((row) => row['代課編號']), ['leave-b', 'leave-c']);
  assert.ok(firstRows.every((row) => row['原老師'] !== '老師甲'));
  assert.ok(firstRows.every((row) => row['狀態'] === undefined));
  assert.ok(firstRows.every((row) => row['邀請編號'] === undefined));
  assert.ok(firstRows.every((row) => row['其他受邀老師'] === undefined));
  assert.ok(firstViewedAt);
  assert.equal(invitationSheet.values[1][3], firstViewedAt);
  assert.deepEqual(JSON.parse(JSON.stringify(secondRows)), JSON.parse(JSON.stringify(firstRows)));
});

test('global pause hides substitutes and blocks claims until admin resumes manually', () => {
  const {
    backend,
    adminSession,
    teacherASession,
    settingsSheet,
  } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);

  assert.deepEqual(JSON.parse(JSON.stringify(backend.pauseClaims_(adminSession, true))), { paused: true });
  assert.deepEqual(JSON.parse(JSON.stringify(backend.getAvailableSubstitutes_(teacherASession))), []);
  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{ substituteId: 'leave-c', changeNote: '' }]),
    /暫停/
  );
  assert.equal(settingsSheet.values[1][0], '暫停全部領取');
  assert.equal(settingsSheet.values[1][1], '是');

  assert.deepEqual(JSON.parse(JSON.stringify(backend.pauseClaims_(adminSession, false))), { paused: false });
  assert.deepEqual(
    backend.getAvailableSubstitutes_(teacherASession).map((row) => row['代課編號']),
    ['leave-b', 'leave-c']
  );
});

test('admin manually closes an invitation and records the close timestamp', () => {
  const { backend, invitationSheet, auditSheet, adminSession, teacherASession } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);

  const result = backend.closeInvitations_(adminSession, ['老師甲']);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    requested: 1,
    closed: 1,
    notOpen: 0,
  });
  assert.equal(invitationSheet.values[1][4], '已關閉');
  assert.ok(invitationSheet.values[1][5]);
  assert.deepEqual(JSON.parse(JSON.stringify(backend.getAvailableSubstitutes_(teacherASession))), []);
  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{ substituteId: 'leave-c', changeNote: '' }]),
    /尚未開放/
  );
  assert.equal(auditSheet.values.filter((row) => row[2] === '關閉代課').length, 1);
});

test('two invited teachers with stale lists produce exactly one claim winner', () => {
  const {
    backend,
    leaveSheet,
    auditSheet,
    adminSession,
    teacherASession,
    teacherBSession,
  } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲', '老師乙']);
  const teacherAList = backend.getAvailableSubstitutes_(teacherASession);
  const teacherBList = backend.getAvailableSubstitutes_(teacherBSession);
  assert.ok(teacherAList.some((row) => row['代課編號'] === 'leave-c'));
  assert.ok(teacherBList.some((row) => row['代課編號'] === 'leave-c'));

  const winner = backend.claimSubstitute_(teacherASession, [{ substituteId: 'leave-c', changeNote: '' }]);
  assert.throws(
    () => backend.claimSubstitute_(teacherBSession, [{ substituteId: 'leave-c', changeNote: '' }]),
    /剛被其他老師領取/
  );

  const claimedRow = leaveSheet.values.find((row) => row[9] === 'leave-c');
  assert.deepEqual(JSON.parse(JSON.stringify(winner)), { count: 1 });
  assert.equal(claimedRow[5], '已領取');
  assert.equal(claimedRow[6], '老師甲');
  assert.equal(auditSheet.values.filter((row) => row[2] === '領取代課' && row[3] === 'leave-c').length, 1);
});

test('invitation POST actions require admin while list and claim bind to the logged-in teacher', () => {
  const {
    backend,
    invitationSheet,
    leaveSheet,
    adminToken,
    teacherAToken,
  } = createInvitationBackend();
  backend.console = { error() {} };

  const forbidden = JSON.parse(backend.doPost({ parameter: {
    action: 'openInvitations',
    sessionToken: teacherAToken,
    teacherNames: JSON.stringify(['老師甲']),
  } }).text);
  assert.equal(forbidden.status, 'error');
  assert.match(forbidden.message, /管理權限/);

  const opened = JSON.parse(backend.doPost({ parameter: {
    action: 'openInvitations',
    sessionToken: adminToken,
    teacherNames: JSON.stringify(['老師甲', '老師乙']),
  } }).text);
  assert.equal(opened.status, 'success');
  assert.equal(opened.data.opened, 2);
  assert.equal(invitationSheet.values.length, 3);

  const listed = JSON.parse(backend.doGet({ parameter: {
    action: 'getAvailableSubstitutes',
    sessionToken: teacherAToken,
    teacherName: '老師乙',
  } }).text);
  assert.deepEqual(listed.data.map((row) => row['代課編號']), ['leave-b', 'leave-c']);

  const claimed = JSON.parse(backend.doPost({ parameter: {
    action: 'claimSubstitute',
    sessionToken: teacherAToken,
    subTeacher: '老師乙',
    items: JSON.stringify([{ substituteId: 'leave-c', changeNote: '' }]),
  } }).text);
  assert.equal(claimed.status, 'success');
  assert.equal(leaveSheet.values.find((row) => row[9] === 'leave-c')[6], '老師甲');
});

test('category capability validation reads only the protected account record', () => {
  const { backend } = createInvitationBackend({ teacherACapabilities: '空環、瑜伽 / 舞綢' });

  assert.equal(backend.teacherCanTeachCategory_('老師甲', '空環'), true);
  assert.equal(backend.teacherCanTeachCategory_('老師甲', '瑜伽'), true);
  assert.equal(backend.teacherCanTeachCategory_('老師甲', '舞綢'), true);
  assert.equal(backend.teacherCanTeachCategory_('老師甲', '綢吊'), false);
  assert.equal(backend.teacherCanTeachCategory_('不存在老師', '空環'), false);
});

test('original-course claim persists difficulty and structured values without requiring a note', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);

  const result = backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-b',
    handlingType: 'original',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: 'Lv.2',
    note: '',
  }]);

  const claimedRow = leaveSheet.values.find((row) => row[9] === 'leave-b');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { count: 1 });
  assert.equal(claimedRow[5], '已領取');
  assert.equal(claimedRow[6], '老師甲');
  assert.equal(claimedRow[7], '沿用原課程；難度：Lv.2');
  assert.deepEqual(claimedRow.slice(11, 15), ['class-ring-1', '空環 Lv.1', 'Lv.2', '沿用原課程']);
  assert.equal(claimedRow[19], '空環');
});

test('existing-course change uses the server OB class and requires a cross-apparatus note', () => {
  const crossLeave = [
    '2026-08-03 09:10:00', '老師丙', '2026/08/11', '11:00', '舞綢 Lv.1',
    '確認中', '', '', '', 'leave-cross', 'calendar-silk',
  ];
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    leaveRows: [crossLeave],
    teacherACapabilities: '空環',
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  assert.throws(() => backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-cross',
    handlingType: 'existing',
    actualClassId: 'class-ring-1',
    actualCourseName: '偽造課名',
    category: '舞綢',
    difficulty: 'Lv.1',
    note: '',
  }]), /跨道具.*備註/);

  backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-cross',
    handlingType: 'existing',
    actualClassId: 'class-ring-1',
    actualCourseName: '偽造課名',
    category: '舞綢',
    difficulty: 'Lv.1',
    note: '原課程不是我的授課道具，請改成空環。',
  }]);

  const claimedRow = leaveSheet.values.find((row) => row[9] === 'leave-cross');
  assert.equal(claimedRow[11], 'class-ring-1');
  assert.equal(claimedRow[12], '空環 Lv.1');
  assert.equal(claimedRow[13], 'Lv.1');
  assert.equal(claimedRow[14], '改用既有 OB 課程');
  assert.equal(claimedRow[19], '空環');
  assert.match(claimedRow[7], /請改成空環/);
  assert.doesNotMatch(claimedRow[7], /偽造課名/);
});

test('new-course change requires a teachable category, course, difficulty, and cross-apparatus note', () => {
  const crossLeave = [
    '2026-08-03 09:10:00', '老師丙', '2026/08/11', '11:00', '舞綢 Lv.1',
    '確認中', '', '', '', 'leave-new', 'calendar-silk',
  ];
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    leaveRows: [crossLeave],
    teacherACapabilities: '空環',
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  assert.throws(() => backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-new', handlingType: 'new', actualCourseName: '',
    category: '空環', difficulty: 'Lv.1', note: '需要新增',
  }]), /課程名稱/);
  assert.throws(() => backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-new', handlingType: 'new', actualCourseName: '空環入門',
    category: '綢吊', difficulty: 'Lv.1', note: '需要新增',
  }]), /不在可教授類別/);
  assert.throws(() => backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-new', handlingType: 'new', actualCourseName: '空環入門',
    category: '空環', difficulty: '', note: '需要新增',
  }]), /難度/);

  backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-new',
    handlingType: 'new',
    actualClassId: '',
    actualCourseName: '空環入門',
    category: '空環',
    difficulty: 'Lv.1',
    note: 'OB 需要新增這個課程。',
  }]);

  const claimedRow = leaveSheet.values.find((row) => row[9] === 'leave-new');
  assert.deepEqual(claimedRow.slice(11, 15), ['', '空環入門', 'Lv.1', '需要新增課程']);
  assert.equal(claimedRow[19], '空環');
  assert.match(claimedRow[7], /OB 需要新增這個課程/);
});

test('same-apparatus change keeps difficulty and note optional', () => {
  const { backend } = createInvitationBackend();

  const normalized = backend.validateClaimChange_({
    teacher: '老師甲',
    targetCourseName: '空環 Lv.1',
    targetCalendarId: 'calendar-b',
    handlingType: 'original',
    difficulty: '',
    note: '',
  });

  assert.equal(normalized.handlingType, '沿用原課程');
  assert.equal(normalized.actualCourseName, '空環 Lv.1');
  assert.equal(normalized.category, '空環');
  assert.equal(normalized.difficulty, '');
  assert.equal(normalized.note, '');
});

test('claim options return only invited teacher capabilities and authorised OB classes', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    teacherACapabilities: '空環、瑜伽',
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const options = backend.getClaimOptions_(teacherASession);

  assert.deepEqual(JSON.parse(JSON.stringify(options.capabilities)), ['空環', '瑜伽']);
  assert.deepEqual(JSON.parse(JSON.stringify(options.classes)), [
    { classId: 'class-ring-1', courseName: '空環 Lv.1', category: '空環' },
  ]);
  assert.equal(options.pinHash, undefined);
  assert.equal(options.role, undefined);
});

test('uninvited claim-options route returns no capabilities or OB classes', () => {
  const { backend, teacherAToken } = createInvitationBackend({ teacherACapabilities: '空環' });

  const response = JSON.parse(backend.doGet({ parameter: {
    action: 'getClaimOptions',
    sessionToken: teacherAToken,
  } }).text);

  assert.equal(response.status, 'success');
  assert.deepEqual(response.data, { capabilities: [], classes: [] });
});

test('paused claim-options route returns no capabilities or OB classes to an invited teacher', () => {
  const { backend, adminSession, adminToken, teacherAToken } = createInvitationBackend({
    teacherACapabilities: '空環',
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  backend.pauseClaims_({ teacherName: '管理員甲', role: '管理員' }, true);

  const response = JSON.parse(backend.doGet({ parameter: {
    action: 'getClaimOptions',
    sessionToken: teacherAToken,
    adminToken,
  } }).text);

  assert.equal(response.status, 'success');
  assert.deepEqual(response.data, { capabilities: [], classes: [] });
});

test('existing-course change resolves duplicate display names by the selected classId', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    teacherACapabilities: '空環',
    courseRows: [
      ['2026/08/01', '09:00', '空環 Lv.1', '老師甲', 'calendar-ring-1', 'class-ring-1', 'teacher-a', '否', ''],
      ['2026/08/01', '10:00', '空環 Lv.1', '老師乙', 'calendar-ring-2', 'class-ring-2', 'teacher-b', '否', ''],
      ['2026/08/01', '11:00', '舞綢 Lv.1', '老師丙', 'calendar-silk', 'class-silk-1', 'teacher-c', '否', ''],
    ],
    leaveRows: [[
      '2026-08-03 09:10:00', '老師丙', '2026/08/11', '11:00', '舞綢 Lv.1',
      '確認中', '', '', '', 'leave-duplicate-name', 'calendar-silk',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-duplicate-name',
    handlingType: 'existing',
    actualClassId: 'class-ring-2',
    actualCourseName: '空環 Lv.1',
    category: '空環',
    difficulty: '',
    note: '改成空環。',
  }]);

  const claimedRow = leaveSheet.values.find((row) => row[9] === 'leave-duplicate-name');
  assert.equal(claimedRow[11], 'class-ring-2');
  assert.equal(claimedRow[12], '空環 Lv.1');
});

test('cancel leaves the original row and records a complete audit event', () => {
  const { backend, leaveSheet, auditSheet, teacherASession } = createInvitationBackend();
  const rowCount = leaveSheet.values.length;

  const result = backend.cancelLeave_(teacherASession, 'leave-a');

  const row = leaveSheet.values.find((item) => item[9] === 'leave-a');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { substituteId: 'leave-a', status: '已取消' });
  assert.equal(leaveSheet.values.length, rowCount);
  assert.equal(row[5], '已取消');
  assert.equal(row[18], '已自行取消');
  assert.deepEqual(auditSheet.values.at(-1).slice(1), [
    '老師甲', '自行取消請假', 'leave-a', '確認中', '已取消', '',
  ]);
});

test('cancel rejects claimed or OB-started leave and requires an approval request instead', () => {
  const { backend, teacherASession } = createInvitationBackend({
    leaveRows: [
      ['時間', '老師甲', '2026/08/10', '09:00', '空環', '已領取', '老師乙', '', '', 'leave-claimed-a', 'calendar-a'],
      ['時間', '老師甲', '2026/08/11', '10:00', '空環', '確認中', '', '', '處理中', 'leave-ob-a', 'calendar-b'],
    ],
  });

  assert.throws(() => backend.cancelLeave_(teacherASession, 'leave-claimed-a'), /申請取消/);
  assert.throws(() => backend.cancelLeave_(teacherASession, 'leave-ob-a'), /申請取消/);
});

test('cancel request after a claim requires a reason and admin can approve it', () => {
  const { backend, leaveSheet, auditSheet, teacherASession, adminSession } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師甲', '2026/08/10', '09:00', '空環', '已領取', '老師乙', '', '',
      'leave-cancel-request', 'calendar-a', 'class-ring-1', '空環 Lv.1', '', '沿用原課程',
    ]],
  });

  assert.throws(
    () => backend.requestLeaveCancellation_(teacherASession, 'leave-cancel-request', ''),
    /原因/
  );
  backend.requestLeaveCancellation_(teacherASession, 'leave-cancel-request', '行程恢復，可以照常上課。');
  assert.equal(leaveSheet.values[1][18], '申請取消中');

  const result = backend.resolveChangeRequest_(adminSession, 'leave-cancel-request', 'approve', '已確認雙方');
  assert.equal(result.status, '已取消');
  assert.equal(leaveSheet.values[1][5], '已取消');
  assert.equal(leaveSheet.values[1][18], '取消申請已核准');
  assert.deepEqual(auditSheet.values.slice(1).map((row) => row[2]), [
    '申請取消請假', '核准取消請假',
  ]);
});

test('withdraw request requires the current substitute and a reason', () => {
  const { backend, leaveSheet, teacherASession, teacherBSession } = createInvitationBackend();

  assert.throws(
    () => backend.requestClaimWithdrawal_(teacherBSession, 'leave-claimed', ''),
    /原因/
  );
  assert.throws(
    () => backend.requestClaimWithdrawal_(teacherASession, 'leave-claimed', '臨時有事'),
    /目前的代課老師/
  );

  backend.requestClaimWithdrawal_(teacherBSession, 'leave-claimed', '臨時無法上課');
  assert.equal(leaveSheet.values.find((row) => row[9] === 'leave-claimed')[18], '申請退出中');
});

test('admin-approved withdraw clears active claim fields and reopens with prior substitute in audit', () => {
  const { backend, leaveSheet, auditSheet, adminSession, teacherBSession } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師丙', '2026/08/12', '12:00', '空環', '已領取', '老師乙',
      '沿用原課程；難度：Lv.1', '待處理', 'leave-withdraw', 'calendar-c', 'class-ring-1',
      '空環 Lv.1', 'Lv.1', '沿用原課程', '待核對', '', '', '', '空環',
    ]],
  });
  backend.requestClaimWithdrawal_(teacherBSession, 'leave-withdraw', '手腕受傷');

  const result = backend.resolveChangeRequest_(adminSession, 'leave-withdraw', 'approve', '同意重新開放');

  const row = leaveSheet.values[1];
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    substituteId: 'leave-withdraw', requestType: 'withdrawal', decision: 'approve', status: '確認中',
  });
  assert.equal(row[5], '確認中');
  assert.equal(row[6], '');
  assert.equal(row[7], '');
  assert.equal(row[8], '');
  assert.deepEqual(row.slice(11, 18), ['', '', '', '', '', '', '']);
  assert.equal(row[18], '退出已核准，已重新開放');
  assert.equal(row[19], '');
  assert.match(auditSheet.values.at(-1)[6], /原代課老師：老師乙/);
});

test('reconcile marks exact OB teacher and class matches and reports mismatches', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '09:00', '空環 Lv.1', '老師乙', 'calendar-match', 'class-ring-1', 'teacher-b', '是', ''],
      ['2026/08/11', '10:00', '舞綢 Lv.1', '老師丙', 'calendar-mismatch', 'class-silk-1', 'teacher-c', '是', ''],
    ],
    leaveRows: [
      ['時間', '老師甲', '2026/08/10', '09:00', '空環', '已領取', '老師乙', '', '', 'leave-match', 'calendar-match', 'class-ring-1', '空環 Lv.1', '', '沿用原課程'],
      ['時間', '老師甲', '2026/08/11', '10:00', '空環', '已領取', '老師乙', '', '', 'leave-mismatch', 'calendar-mismatch', 'class-ring-1', '空環 Lv.1', '', '改用既有 OB 課程'],
      ['時間', '老師甲', '2026/08/12', '11:00', '空環', '已領取', '老師乙', '', '', 'leave-missing', 'calendar-missing', 'class-ring-1', '空環 Lv.1', '', '沿用原課程'],
    ],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 3, matched: 1, exceptions: 2 });
  const matched = leaveSheet.values.find((row) => row[9] === 'leave-match');
  const mismatch = leaveSheet.values.find((row) => row[9] === 'leave-mismatch');
  const missing = leaveSheet.values.find((row) => row[9] === 'leave-missing');
  assert.equal(matched[8], '已完成');
  assert.equal(matched[15], '已核對');
  assert.ok(matched[16]);
  assert.equal(mismatch[15], '核對異常');
  assert.match(mismatch[17], /代課老師|課程/);
  assert.equal(missing[15], '核對異常');
  assert.match(missing[17], /找不到/);
});

test('replacement calendar linking preserves the original ID and can then reconcile', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [[
      '2026/08/15', '13:00', '空環入門', '老師乙', 'calendar-new', 'class-new', 'teacher-b', '是', '',
    ]],
    leaveRows: [[
      '時間', '老師甲', '2026/08/15', '13:00', '舞綢', '已領取', '老師乙', '需要新增', '',
      'leave-new-calendar', 'calendar-old', '', '空環入門', '', '需要新增課程', '', '', '', '', '空環',
    ]],
  });

  backend.linkReplacementCalendarItem_(adminSession, 'leave-new-calendar', 'calendar-new');
  assert.equal(leaveSheet.values[1][10], 'calendar-old');
  assert.equal(leaveSheet.values[1][20], 'calendar-new');
  assert.equal(leaveSheet.values[1][15], '待核對');

  const result = backend.reconcileObChanges_(adminSession);
  assert.equal(result.matched, 1);
  assert.equal(leaveSheet.values[1][15], '已核對');
});

test('admin dashboard separates work queues without exposing account secrets', () => {
  const { backend, adminSession } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);

  const dashboard = backend.getAdminDashboard_(adminSession);
  const serialized = JSON.stringify(dashboard);

  assert.equal(dashboard.paused, false);
  assert.ok(Array.isArray(dashboard.pendingInvitations));
  assert.ok(Array.isArray(dashboard.activeInvitees));
  assert.ok(Array.isArray(dashboard.obWork));
  assert.ok(Array.isArray(dashboard.changeRequests));
  assert.ok(Array.isArray(dashboard.exceptions));
  assert.ok(Array.isArray(dashboard.completed));
  assert.doesNotMatch(serialized, /PIN 雜湊|fixed-salt|Salt/);
});
