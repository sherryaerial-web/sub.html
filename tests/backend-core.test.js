const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadBackend(overrides = {}) {
  const file = path.join(__dirname, '..', 'Code.gs');
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  let defaultUuid = 0;
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
        if (pattern === 'yyyy-MM-dd HH:mm:ss') {
          return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:00`;
        }
        return '';
      },
      getUuid() { return `default-uuid-${++defaultUuid}`; },
    },
    Session: {
      getScriptTimeZone: () => 'Asia/Taipei',
      getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }),
    },
    LockService: {
      getScriptLock() {
        return { waitLock() {}, releaseLock() {} };
      },
    },
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

const EXPECTED_SPECIAL_COURSE_HEADERS = [
  '特別課群組 ID', '特別課模式', '特別課分鐘數', '特別課結束時間',
];

const EXPECTED_ORDINARY_DELAY_HEADERS = [
  '實際開始時間', '延後分鐘數', '延後占用來源代課編號',
];

const EXPECTED_SPECIAL_REQUEST_HEADERS = [
  '申請時間', '特別課群組 ID', '老師', '日期', '教室', '來源時段 JSON',
  '代課編號 JSON', '實際開始時間', '特別課名稱', '預計難度', '分鐘數',
  '結束時間', '模式', '備註', '狀態', 'OB 核對狀態', 'OB 核對時間',
  '差異原因', '替代 OB Calendar ID',
];

const EXPECTED_ACCOUNT_HEADERS = [
  '指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至',
  '可教授類別', '功能權限',
];

const EXPECTED_COURSE_HEADERS = [
  '日期', '時間', '課程', '指導者',
  'OB Calendar ID', 'OB Class ID', 'OB 老師 ID', '是否代課', '最後同步時間',
];

const EXPECTED_VVIP_SELECTION_HEADERS = [
  '登記時間', 'Email', '月份', 'OB Calendar ID', '日期', '時間', '課程', '老師',
  '狀態', '確認時間', '取消時間', '取消原因', '操作者', 'VVIP ID', 'OB 名稱',
];

const EXPECTED_VVIP_SETTINGS_HEADERS = ['設定鍵', '設定值', '更新時間', '操作者'];
const EXPECTED_VVIP_MEMBER_HEADERS = [
  'VVIP ID', 'OB 名稱', 'Email', '是否啟用', '備註', '建立時間', '更新時間', '更新者',
];

const EXPECTED_PAYROLL_RULE_HEADERS = ['老師姓名', '課程關鍵字 (可留空)', '計費類型', '人數門檻', '金額'];
const EXPECTED_PAYROLL_SOURCE_HEADERS = [
  '月份', 'OB Calendar ID', '日期時間', '課程', '指導者', '出席狀態', '缺席',
  '課程收入', '盈利', '教室', '分店', '更新時間',
];
const EXPECTED_PAYROLL_SNAPSHOT_HEADERS = [
  '同步版本', '月份', 'OB Calendar ID', '日期', '時間', '課程', '全部指導者 JSON',
  '出席人數', '容量', '課程收入', '盈利', '教室', '分店', '同步時間', '檢查狀態',
];
const EXPECTED_PAYROLL_LINE_HEADERS = [
  '月份', '明細 ID', '同步版本', 'OB Calendar ID', '老師', '日期', '時間', '課程',
  '計費類型', '出席人數', '課程收入', '套用規則', '規則說明', '金額', '人工調整',
  '調整理由', '狀態', '建立時間',
];
const EXPECTED_PAYROLL_SUMMARY_HEADERS = [
  '月份', '老師', '鐘點費小計', '獎金比例', '獎金金額', '固定津貼/扣項',
  '應領總薪資', '盈利', '發布版本', '狀態', '確認時間', '最後更新時間',
  '管理員加扣', '管理員調整原因', '管理員確認時間', '管理員確認者',
];
const EXPECTED_PAYROLL_DISPUTE_HEADERS = [
  '異議 ID', '月份', '老師', '明細 ID', '問題說明', '狀態', '管理員回覆',
  '提出時間', '處理者', '處理時間',
];
const EXPECTED_PAYROLL_PAYMENT_HEADERS = ['老師', '轉帳群組/銀行', '備註', '是否啟用'];

function createSheetFixture(name, values) {
  const protections = [];
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
    getProtections() { return protections.slice(); },
    protect() {
      const protection = {
        description: '',
        editors: [{ getEmail: () => 'other-editor@example.com' }],
        domainEdit: true,
        setDescription(value) { this.description = value; return this; },
        getDescription() { return this.description; },
        addEditor(user) {
          const email = user && user.getEmail ? user.getEmail() : String(user || '');
          if (email && !this.editors.some((editor) => editor.getEmail() === email)) {
            this.editors.push({ getEmail: () => email });
          }
          return this;
        },
        getEditors() { return this.editors.slice(); },
        removeEditors(editors) {
          const emails = new Set((editors || []).map((editor) => editor.getEmail()));
          this.editors = this.editors.filter((editor) => !emails.has(editor.getEmail()));
          return this;
        },
        canDomainEdit() { return this.domainEdit; },
        setDomainEdit(value) { this.domainEdit = value; return this; },
      };
      protections.push(protection);
      return protection;
    },
    getRange(row, column, numRows = 1, numColumns = 1) {
      const sheet = this;
      return {
        getValues() {
          return Array.from({ length: numRows }, (_, rowOffset) =>
            Array.from({ length: numColumns }, (_, columnOffset) => {
              const value = (sheet.values[row - 1 + rowOffset] || [])[column - 1 + columnOffset];
              return value == null ? '' : value;
            })
          );
        },
        getValue() { return this.getValues()[0][0]; },
        setValue(value) { return this.setValues([[value]]); },
        setValues(nextValues) {
          assert.equal(nextValues.length, numRows, 'setValues row count must match range height');
          nextValues.forEach((nextRow) => {
            assert.equal(nextRow.length, numColumns, 'setValues column count must match range width');
          });
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

function injectSetValuesFailureOnce(sheet, predicate, message = 'injected Sheet write failure') {
  const originalGetRange = sheet.getRange.bind(sheet);
  let fired = false;
  sheet.getRange = (row, column, numRows = 1, numColumns = 1) => {
    const range = originalGetRange(row, column, numRows, numColumns);
    const originalSetValues = range.setValues.bind(range);
    range.setValues = (nextValues) => {
      if (!fired && predicate({ row, column, numRows, numColumns, nextValues })) {
        fired = true;
        throw new Error(message);
      }
      return originalSetValues(nextValues);
    };
    return range;
  };
  return () => fired;
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
    EXPECTED_ACCOUNT_HEADERS,
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
    createAccount(bootstrap, '系統管理員', '9999', { role: '管理員' }).concat('', ''),
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
    EXPECTED_ACCOUNT_HEADERS,
    createAccount(bootstrap, '管理員甲', '9999', { role: '管理員' }),
    createAccount(bootstrap, '老師甲', '1234'),
  ]);
  const courseSheet = createSheetFixture('CourseList', options.courseValues || [
    EXPECTED_COURSE_HEADERS,
    ['2026/08/05', '10:00', '舊課程', '舊老師', 'old-calendar', 'old-class', 'old-teacher', '否', '2026-08-03 10:00:00'],
  ]);
  const auditSheet = createSheetFixture('操作紀錄', [[
    '操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因',
  ]]);
  const spreadsheet = createSpreadsheetFixture([accountSheet, courseSheet, auditSheet]);
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
    EXPECTED_ACCOUNT_HEADERS,
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
    EXPECTED_LEAVE_HEADERS.concat(
      EXPECTED_LEAVE_EXTENSION_HEADERS,
      EXPECTED_SPECIAL_COURSE_HEADERS,
      EXPECTED_ORDINARY_DELAY_HEADERS
    ),
    ...(options.leaveRows || []),
  ]);
  const auditSheet = createSheetFixture('操作紀錄', [[
    '操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因',
  ]]);
  const settingsSheet = createSheetFixture('系統設定', [[
    '設定名稱', '設定值', '更新時間', '備註',
  ]]);
  const spreadsheet = createSpreadsheetFixture([
    accountSheet, teacherSheet, courseSheet, leaveSheet, auditSheet, settingsSheet,
  ]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  backend.getNextMonthKey_ = () => '2026-08';
  return {
    backend,
    courseSheet,
    leaveSheet,
    auditSheet,
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
    EXPECTED_LEAVE_HEADERS.concat(
      EXPECTED_LEAVE_EXTENSION_HEADERS,
      EXPECTED_SPECIAL_COURSE_HEADERS,
      EXPECTED_ORDINARY_DELAY_HEADERS
    ),
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
  const specialRequestSheet = createSheetFixture('特別課安排', [
    EXPECTED_SPECIAL_REQUEST_HEADERS,
    ...(options.specialRequestRows || []),
  ]);
  const spreadsheet = createSpreadsheetFixture([
    accountSheet,
    teacherSheet,
    courseSheet,
    leaveSheet,
    invitationSheet,
    auditSheet,
    settingsSheet,
    specialRequestSheet,
  ]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  backend.getNextMonthKey_ = () => options.nextMonth || '2026-08';
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
    specialRequestSheet,
    adminToken,
    teacherAToken,
    teacherBToken,
    adminSession: { teacherName: '管理員甲', role: '管理員' },
    teacherASession: { teacherName: '老師甲', role: '老師' },
    teacherBSession: { teacherName: '老師乙', role: '老師' },
  };
}

function createVvipBackend(options = {}) {
  const services = createAuthServices();
  let uuid = 0;
  services.Utilities.getUuid = () => `vvip-${++uuid}`;
  const bootstrap = loadBackend(services);
  const accountSheet = createSheetFixture('登入帳號', [
    EXPECTED_ACCOUNT_HEADERS,
    createAccount(bootstrap, '管理員甲', '9999', { role: '管理員' }),
    createAccount(bootstrap, '老師甲', '1234'),
  ]);
  const courseSheet = createSheetFixture('CourseList', [
    EXPECTED_COURSE_HEADERS,
    ...(options.courseRows || [
      ['2026/09/02', '10:00', '空環基礎', '老師甲', 'vvip-cal-1', 'class-1', 'teacher-1', '否', ''],
      ['2026/09/03', '11:00', '舞綢基礎', '老師乙', 'vvip-cal-2', 'class-2', 'teacher-2', '否', ''],
      ['2026/09/04', '12:00', '空中瑜伽', '老師丙', 'vvip-cal-3', 'class-3', 'teacher-3', '否', ''],
      ['2026/09/05', '13:00', '柔軟度', '老師丁', 'vvip-cal-4', 'class-4', 'teacher-4', '否', ''],
      ['2026/09/06', '14:00', '綢吊基礎', '老師戊', 'vvip-cal-5', 'class-5', 'teacher-5', '否', ''],
    ]),
  ]);
  const selectionSheet = createSheetFixture('VVIP選課紀錄', [
    EXPECTED_VVIP_SELECTION_HEADERS,
    ...(options.selectionRows || []),
  ]);
  const settingsSheet = createSheetFixture('VVIP選課設定', [
    EXPECTED_VVIP_SETTINGS_HEADERS,
    ['activeMonth', '2026-09', '', ''],
    ['isOpen', options.open === false ? '否' : '是', '', ''],
  ]);
  const memberSheet = createSheetFixture('VVIP名單', [
    EXPECTED_VVIP_MEMBER_HEADERS,
    ...(options.memberRows || [
      ['vvip-member-1', '會員一', 'vvip@example.com', '是', '', '', '', '管理員甲'],
      ['vvip-member-2', '停用會員', 'disabled@example.com', '否', '', '', '', '管理員甲'],
    ]),
  ]);
  const auditSheet = createSheetFixture('操作紀錄', [[
    '操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因',
  ]]);
  const spreadsheet = createSpreadsheetFixture([
    accountSheet, courseSheet, selectionSheet, settingsSheet, memberSheet, auditSheet,
  ]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  backend.getNextMonthKey_ = () => '2026-09';
  return {
    backend,
    services,
    spreadsheet,
    accountSheet,
    courseSheet,
    selectionSheet,
    settingsSheet,
    memberSheet,
    auditSheet,
    adminToken: backend.authenticate_('管理員甲', '9999').sessionToken,
    teacherToken: backend.authenticate_('老師甲', '1234').sessionToken,
    adminSession: { teacherName: '管理員甲', role: '管理員' },
    teacherSession: { teacherName: '老師甲', role: '老師' },
  };
}

test('login returns an opaque session without exposing credentials', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')]);

  const response = backend.authenticate_('老師甲', '1234');

  assert.ok(response.sessionToken);
  assert.deepEqual(Object.keys(response).sort(), ['managementCapabilities', 'role', 'sessionToken', 'teacherName']);
  assert.equal('pinHash' in response, false);
  assert.equal('salt' in response, false);
  assert.equal('expiresAt' in response, false);
});

test('login sessions remain valid for thirty days on a personal device', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend, services } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')]);
  const before = Date.now();
  const response = backend.authenticate_('老師甲', '1234');
  const stored = JSON.parse(services.__properties.get(backend.getSessionKey_(response.sessionToken)));

  assert.ok(stored.expiresAt >= before + (30 * 24 * 60 * 60 * 1000) - 1000);
});

test('functional capabilities are independent from teaching categories and enforced server-side', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend } = createAuthBackend([
    createAccount(bootstrap, 'IVY', '0912', { role: '管理員' }).concat('空環', 'course_admin,payroll_admin,vvip_admin'),
    createAccount(bootstrap, 'Tako', '1127').concat('空環、舞綢', 'course_admin'),
    createAccount(bootstrap, '一般老師', '1234').concat('空環', ''),
  ]);

  const ivy = backend.authenticate_('IVY', '0912');
  const tako = backend.authenticate_('Tako', '1127');
  const teacher = backend.authenticate_('一般老師', '1234');

  assert.deepEqual(Array.from(ivy.managementCapabilities), ['course_admin', 'payroll_admin', 'vvip_admin']);
  assert.deepEqual(Array.from(tako.managementCapabilities), ['course_admin']);
  assert.deepEqual(Array.from(teacher.managementCapabilities), []);
  assert.equal(backend.requireCapability_(tako.sessionToken, 'course_admin').teacherName, 'Tako');
  assert.throws(() => backend.requireCapability_(tako.sessionToken, 'payroll_admin'), /薪資管理權限/);
  assert.throws(() => backend.requireCapability_(teacher.sessionToken, 'course_admin'), /課程管理權限/);
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
    { teacherName: '老師甲', role: '老師', capabilities: [], managementCapabilities: [] }
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
    { teacherName: '老師甲', role: '老師', capabilities: [], managementCapabilities: [] }
  );
  assert.throws(() => backend.requireAdmin_(response.sessionToken), /管理權限/);
});

test('existing session immediately follows current account role capabilities and active state', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend, accountSheet, services } = createAuthBackend([
    createAccount(bootstrap, '管理員', '9999', { role: '管理員' }).concat('空環'),
  ]);
  const response = backend.authenticate_('管理員', '9999');

  accountSheet.values[1][4] = '老師';
  accountSheet.values[1][7] = '舞綢、瑜伽';
  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.requireSession_(response.sessionToken))),
    { teacherName: '管理員', role: '老師', capabilities: ['舞綢', '地板課程'], managementCapabilities: [] }
  );
  assert.throws(() => backend.requireAdmin_(response.sessionToken), /管理權限/);

  accountSheet.values[1][3] = '否';
  assert.throws(() => backend.requireSession_(response.sessionToken), /帳號目前未啟用/);
  assert.equal(services.__properties.has(backend.getSessionKey_(response.sessionToken)), false);
});

test('existing session is revoked when its account is removed', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend, accountSheet, services } = createAuthBackend([
    createAccount(bootstrap, '老師甲', '1234'),
  ]);
  const response = backend.authenticate_('老師甲', '1234');

  accountSheet.values.splice(1, 1);

  assert.throws(() => backend.requireSession_(response.sessionToken), /帳號不存在|登入狀態無效/);
  assert.equal(services.__properties.has(backend.getSessionKey_(response.sessionToken)), false);
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

test('all backend account setup paths require exactly four numeric PIN digits', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend, accountSheet } = createAuthBackend([
    createAccount(bootstrap, '管理員', '9999', { role: '管理員' }),
  ]);
  const adminToken = backend.authenticate_('管理員', '9999').sessionToken;
  const rowCount = accountSheet.values.length;

  ['123', '12345', '12A4', '１２３４'].forEach((pin) => {
    assert.throws(
      () => backend.setupAccount_(adminToken, '老師乙', pin, { role: '老師' }),
      /4 位數字/
    );
    assert.throws(() => backend.buildAccountValues_('老師乙', pin, {}), /4 位數字/);
  });
  assert.equal(accountSheet.values.length, rowCount);

  const emptyAccountSheet = createSheetFixture('登入帳號', [EXPECTED_ACCOUNT_HEADERS]);
  const emptyBackend = loadBackend({
    ...createAuthServices(),
    SpreadsheetApp: {
      ProtectionType: { SHEET: 'SHEET' },
      getActiveSpreadsheet() { return createSpreadsheetFixture([emptyAccountSheet]); },
    },
  });
  assert.throws(() => emptyBackend.initializeFirstAdmin_('Ivy', '12A4'), /4 位數字/);
  assert.equal(emptyAccountSheet.values.length, 1);
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
  assert.equal(imported[3], '否');
  assert.equal(imported[4], '老師');
  assert.equal(imported[7], '空環');
  assert.deepEqual(passwordSheet.values.slice(1, 38).map((row) => row[0]), rows.map((row) => row[0]));
  assert.deepEqual(passwordSheet.values.slice(1, 38).map((row) => row[1] || ''), Array(37).fill(''));
  assert.equal(spreadsheet.getSheetByName('密碼表'), passwordSheet);
  assert.ok(backend.getScriptProperties_().getProperty('TEACHER_PASSWORD_IMPORT_COMPLETED_AT'));
  const protections = accountSheet.getProtections();
  assert.equal(protections.length, 1);
  assert.equal(protections[0].getDescription(), '系統保護：登入帳號');
  assert.equal(protections[0].canDomainEdit(), false);
  assert.deepEqual(protections[0].getEditors().map((editor) => editor.getEmail()), ['owner@example.com']);
  assert.throws(() => backend.importTeacherAccountsFromPasswordSheet(), /已經完成過/);
});

test('teacher password bulk import preserves an imported first admin and its admin route access', () => {
  const rows = createPasswordImportRows();
  const services = createAuthServices();
  const bootstrap = loadBackend(services);
  const firstAdmin = createAccount(bootstrap, '老師01', '7777', {
    active: '是',
    role: '管理員',
  }).concat('空環、空瑜');
  const { backend, accountSheet } = createPasswordImportBackend(rows, {
    existingAccounts: [firstAdmin],
  });
  backend.ensureSystemStructure_ = () => {};
  backend.getAdminDashboard_ = (session) => {
    backend.assertAdminSession_(session);
    return { allowed: true };
  };

  backend.importTeacherAccountsFromPasswordSheet();

  const importedAdmin = accountSheet.values.find((row) => row[0] === '老師01');
  assert.equal(importedAdmin[3], '是');
  assert.equal(importedAdmin[4], '管理員');
  assert.equal(importedAdmin[7], '空環、空瑜');
  const login = backend.authenticate_('老師01', '1000');
  const response = JSON.parse(backend.doPost({ parameter: {
    action: 'getAdminDashboard',
    sessionToken: login.sessionToken,
  } }).text);
  assert.deepEqual(JSON.parse(JSON.stringify(response)), {
    status: 'success',
    data: { allowed: true },
  });
});

test('iframe POST transport relays the authenticated JSON result only to the production frontend', () => {
  const services = createAuthServices();
  services.Utilities.base64Encode = (value) => Buffer.from(value, 'utf8').toString('base64');
  services.HtmlService = {
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
    createHtmlOutput(text) {
      return {
        text,
        xFrameOptionsMode: '',
        setXFrameOptionsMode(mode) { this.xFrameOptionsMode = mode; return this; },
      };
    },
  };
  const bootstrap = loadBackend(services);
  const account = createAccount(bootstrap, '老師甲', '1234', { active: '是', role: '老師' });
  const { backend } = createAuthBackend([account], services);
  const session = backend.authenticate_('老師甲', '1234');

  const response = backend.doPost({ parameter: {
    action: 'getSession',
    sessionToken: session.sessionToken,
    transport: 'iframe',
    requestId: 'relay-request-123456',
  } });
  let relayed;
  const relayScript = response.text.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(relayScript, {
    JSON,
    Uint8Array,
    TextDecoder,
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
    window: {
      top: {
        postMessage(message, targetOrigin) { relayed = { message, targetOrigin }; },
      },
    },
  });

  assert.equal(response.xFrameOptionsMode, 'ALLOWALL');
  assert.equal(relayed.targetOrigin, 'https://sherryaerial-web.github.io');
  assert.deepEqual(JSON.parse(JSON.stringify(relayed.message)), {
    source: 'sherry-gas-relay',
    requestId: 'relay-request-123456',
    payload: {
      status: 'success',
      data: { teacherName: '老師甲', role: '老師', managementCapabilities: [] },
    },
  });
});

test('teacher password bulk import keeps every plaintext PIN when the account batch write fails', () => {
  const rows = createPasswordImportRows();
  const { backend, services, accountSheet, passwordSheet } = createPasswordImportBackend(rows);
  const accountsBefore = JSON.stringify(accountSheet.values);
  const originalGetRange = accountSheet.getRange.bind(accountSheet);
  let shouldFailWrite = true;
  accountSheet.getRange = function(row, column, numRows = 1, numColumns = 1) {
    const range = originalGetRange(row, column, numRows, numColumns);
    if (column === 1 && numRows > 1 && numColumns === EXPECTED_ACCOUNT_HEADERS.length) {
      const originalSetValues = range.setValues.bind(range);
      range.setValues = (values) => {
        if (shouldFailWrite) {
          shouldFailWrite = false;
          throw new Error('injected account batch write failure');
        }
        return originalSetValues(values);
      };
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

test('teacher password bulk import restores accounts and PINs when plaintext clearing fails after clearing', () => {
  const rows = createPasswordImportRows();
  const { backend, services, accountSheet, passwordSheet } = createPasswordImportBackend(rows);
  const accountsBefore = JSON.stringify(accountSheet.values);
  const pinsBefore = passwordSheet.values.slice(1).map((row) => row[1]);
  const originalGetRange = passwordSheet.getRange.bind(passwordSheet);
  let shouldFailClear = true;
  passwordSheet.getRange = function(row, column, numRows = 1, numColumns = 1) {
    const range = originalGetRange(row, column, numRows, numColumns);
    if (row === 2 && column === 2 && numRows === 37 && numColumns === 1) {
      const originalClearContent = range.clearContent.bind(range);
      range.clearContent = () => {
        originalClearContent();
        if (shouldFailClear) {
          shouldFailClear = false;
          throw new Error('injected PIN clear failure');
        }
        return range;
      };
    }
    return range;
  };

  assert.throws(
    () => backend.importTeacherAccountsFromPasswordSheet(),
    /injected PIN clear failure.*已完成回復/
  );
  assert.equal(JSON.stringify(accountSheet.values), accountsBefore);
  assert.deepEqual(passwordSheet.values.slice(1).map((row) => row[1]), pinsBefore);
  assert.equal(services.__properties.has('TEACHER_PASSWORD_IMPORT_COMPLETED_AT'), false);
});

test('teacher password bulk import restores accounts PINs and marker when completion property write fails', () => {
  const rows = createPasswordImportRows();
  const { backend, services, accountSheet, passwordSheet } = createPasswordImportBackend(rows);
  const accountsBefore = JSON.stringify(accountSheet.values);
  const pinsBefore = passwordSheet.values.slice(1).map((row) => row[1]);
  const originalGetProperties = services.PropertiesService.getScriptProperties.bind(services.PropertiesService);
  let shouldFailProperty = true;
  services.PropertiesService.getScriptProperties = () => {
    const properties = originalGetProperties();
    return {
      ...properties,
      setProperty(key, value) {
        properties.setProperty(key, value);
        if (key === 'TEACHER_PASSWORD_IMPORT_COMPLETED_AT' && shouldFailProperty) {
          shouldFailProperty = false;
          throw new Error('injected completion property failure');
        }
      },
    };
  };

  assert.throws(
    () => backend.importTeacherAccountsFromPasswordSheet(),
    /injected completion property failure.*已完成回復/
  );
  assert.equal(JSON.stringify(accountSheet.values), accountsBefore);
  assert.deepEqual(passwordSheet.values.slice(1).map((row) => row[1]), pinsBefore);
  assert.equal(services.__properties.has('TEACHER_PASSWORD_IMPORT_COMPLETED_AT'), false);
});

test('teacher password bulk import reports rollback failures while attempting every compensation', () => {
  const rows = createPasswordImportRows();
  const { backend, services, accountSheet, passwordSheet } = createPasswordImportBackend(rows);
  const originalAccountGetRange = accountSheet.getRange.bind(accountSheet);
  let accountClearCalls = 0;
  accountSheet.getRange = function(row, column, numRows = 1, numColumns = 1) {
    const range = originalAccountGetRange(row, column, numRows, numColumns);
    if (row === 2 && column === 1 && numRows > 1 && numColumns === EXPECTED_ACCOUNT_HEADERS.length) {
      const originalClearContent = range.clearContent.bind(range);
      range.clearContent = () => {
        accountClearCalls += 1;
        if (accountClearCalls === 1) throw new Error('injected account rollback failure');
        return originalClearContent();
      };
    }
    return range;
  };
  const originalPasswordGetRange = passwordSheet.getRange.bind(passwordSheet);
  let shouldFailClear = true;
  passwordSheet.getRange = function(row, column, numRows = 1, numColumns = 1) {
    const range = originalPasswordGetRange(row, column, numRows, numColumns);
    if (row === 2 && column === 2 && numRows === 37 && numColumns === 1) {
      const originalClearContent = range.clearContent.bind(range);
      range.clearContent = () => {
        originalClearContent();
        if (shouldFailClear) {
          shouldFailClear = false;
          throw new Error('injected PIN clear failure');
        }
        return range;
      };
    }
    return range;
  };

  assert.throws(
    () => backend.importTeacherAccountsFromPasswordSheet(),
    /injected PIN clear failure.*回復失敗.*登入帳號.*injected account rollback failure/
  );
  assert.deepEqual(passwordSheet.values.slice(1).map((row) => row[1]), rows.map((row) => row[1]));
  assert.equal(services.__properties.has('TEACHER_PASSWORD_IMPORT_COMPLETED_AT'), false);
});

test('initializes the first administrator once without storing the plaintext PIN', () => {
  const services = createAuthServices();
  const accountSheet = createSheetFixture('登入帳號', [
    EXPECTED_ACCOUNT_HEADERS,
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
    EXPECTED_ACCOUNT_HEADERS,
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

test('authenticated POST routes require a session and ignore forged teacher parameters', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const sessionToken = backend.authenticate_('老師甲', '1234').sessionToken;
  const calls = [];
  backend.console = { error() {} };
  backend.getMySubs_ = (teacherName) => { calls.push(['mySubs', teacherName]); return []; };
  backend.submitLeave_ = (session, items) => { calls.push(['leave', session.teacherName, items.length]); return { count: items.length }; };
  backend.claimSubstitute_ = (session, items) => { calls.push(['claim', session.teacherName, items.length]); return { count: items.length }; };

  const missingSession = JSON.parse(backend.doPost({ parameter: {
    action: 'getMySubs', name: '被偽造的老師',
  } }).text);
  assert.equal(missingSession.status, 'error');
  assert.match(missingSession.message, /請先登入/);

  backend.doPost({ parameter: {
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

test('available substitutes POST route rejects requests without a session', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  backend.console = { error() {} };
  backend.getAvailableSubstitutes_ = () => [{ '原老師': '老師乙' }];

  const response = JSON.parse(backend.doPost({ parameter: { action: 'getAvailableSubstitutes' } }).text);

  assert.equal(response.status, 'error');
  assert.match(response.message, /請先登入/);
});

test('available substitutes route does not wait for first-view tracking', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([createAccount(bootstrap, '老師甲', '1234')], services);
  const sessionToken = backend.authenticate_('老師甲', '1234').sessionToken;
  let trackingCalls = 0;
  backend.getAvailableSubstitutes_ = () => [{ '原老師': '老師乙' }];
  backend.recordInvitationFirstView_ = () => { trackingCalls += 1; };

  const listResponse = JSON.parse(backend.doPost({ parameter: {
    action: 'getAvailableSubstitutes', sessionToken,
  } }).text);

  assert.equal(listResponse.status, 'success');
  assert.equal(trackingCalls, 0);

  const trackingResponse = JSON.parse(backend.doPost({ parameter: {
    action: 'recordInvitationFirstView', sessionToken,
  } }).text);

  assert.equal(trackingResponse.status, 'success');
  assert.equal(trackingCalls, 1);
});

test('getMyCourses returns only the logged-in teacher courses with stable OB IDs', () => {
  const { backend } = createLeaveBackend({
    courseRows: [
      ['2026/08/31', '18:30', '空環 Lv.0', '老師甲', 'calendar-old', 'class-old', 'teacher-a', '否', ''],
      ['2026/09/10', '18:30', '空環 Lv.1', '老師甲', 'calendar-a', 'class-a', 'teacher-a', '否', ''],
      ['2026/09/10', '19:30', '舞綢 Lv.1', '老師乙', 'calendar-b', 'class-b', 'teacher-b', '否', ''],
      ['2026/10/01', '18:30', '空環 Lv.2', '老師甲', 'calendar-future', 'class-future', 'teacher-a', '否', ''],
    ],
  });
  backend.getNextMonthKey_ = () => '2026-09';

  const result = backend.getMyCourses_({ teacherName: '老師甲', role: '老師' });

  assert.deepEqual(JSON.parse(JSON.stringify(result)), [{
    '日期': '2026/09/10',
    '時間': '18:30',
    '課程': '空環 Lv.1',
    '課程大類': '空環',
    'OB Calendar ID': 'calendar-a',
  }]);
});

test('getMyCourses hides active leave IDs but keeps cancelled leave courses available', () => {
  const { backend } = createLeaveBackend({
    courseRows: [
      ['2026/09/10', '18:30', '空環 Lv.1', '老師甲', 'calendar-active', 'class-a', 'teacher-a', '否', ''],
      ['2026/09/11', '19:30', '空環 Lv.2', '老師甲', 'calendar-cancelled', 'class-b', 'teacher-a', '否', ''],
    ],
    leaveRows: [
      ['時間', '老師甲', '2026/09/10', '18:30', '空環 Lv.1', '確認中', '', '', '', 'leave-a', 'calendar-active'],
      ['時間', '老師甲', '2026/09/11', '19:30', '空環 Lv.2', '已取消', '', '', '', 'leave-b', 'calendar-cancelled'],
    ],
  });
  backend.getNextMonthKey_ = () => '2026-09';

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
  const expectedWidth = EXPECTED_LEAVE_HEADERS.length
    + EXPECTED_LEAVE_EXTENSION_HEADERS.length
    + EXPECTED_SPECIAL_COURSE_HEADERS.length
    + EXPECTED_ORDINARY_DELAY_HEADERS.length;
  assert.ok(leaveSheet.values.slice(1).every((row) => row.length === expectedWidth));
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
  assert.equal(result.errors[0].date, '2026/08/11');
  assert.equal(result.errors[0].time, '19:30');
  assert.equal(result.errors[0].course, '不存在');
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

test('authenticated read actions use POST identity and ignore forged names', () => {
  const { backend, sessionToken } = createLeaveBackend({ courseRows: [] });
  const calls = [];
  backend.getMyCourses_ = (session) => { calls.push(['courses', session.teacherName]); return []; };
  backend.getMyLeaves_ = (session) => { calls.push(['leaves', session.teacherName]); return []; };

  backend.doPost({ parameter: { action: 'getMyCourses', sessionToken, name: '老師乙' } });
  backend.doPost({ parameter: { action: 'getMyLeaves', sessionToken, name: '老師乙' } });

  assert.deepEqual(calls, [['courses', '老師甲'], ['leaves', '老師甲']]);
});

test('public routes no longer expose the complete classroom course list', () => {
  const { backend } = createLeaveBackend();
  backend.console = { error() {} };

  const response = JSON.parse(backend.doGet({ parameter: { action: 'getCourseList' } }).text);

  assert.equal(response.status, 'error');
  assert.match(response.message, /不支援的操作/);
});

test('doGet exposes only public read-only actions and never accepts session tokens', () => {
  const { backend } = createLeaveBackend();
  backend.console = { error() {} };
  let structureCalls = 0;
  backend.ensureSystemStructure_ = () => { structureCalls += 1; };

  const teachers = JSON.parse(backend.doGet({ parameter: {
    action: 'getTeachers', sessionToken: 'must-not-be-used',
  } }).text);
  const protectedRead = JSON.parse(backend.doGet({ parameter: {
    action: 'getMyLeaves', sessionToken: 'must-not-be-used',
  } }).text);

  assert.equal(teachers.status, 'success');
  assert.deepEqual(teachers.data.map((item) => item['指導者']), ['老師甲', '老師乙']);
  assert.equal(protectedRead.status, 'error');
  assert.match(protectedRead.message, /不支援的操作/);
  assert.equal(structureCalls, 0);
});

test('login teacher list comes from active password accounts instead of the legacy teacher sheet', () => {
  const services = createAuthServices();
  const bootstrap = loadBackend(services);
  const noPassword = createAccount(bootstrap, '尚未設密碼', '2468');
  noPassword[1] = '';
  noPassword[2] = '';
  const accountSheet = createSheetFixture('登入帳號', [
    EXPECTED_ACCOUNT_HEADERS,
    createAccount(bootstrap, 'IVY', '0912', { role: '管理員' }),
    createAccount(bootstrap, '老師甲', '1234'),
    createAccount(bootstrap, '已停用老師', '5678', { active: '否' }),
    noPassword,
  ]);
  const teacherSheet = createSheetFixture('老師名單', [
    ['指導者'],
    ['舊名單老師'],
  ]);
  const spreadsheet = createSpreadsheetFixture([accountSheet, teacherSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });

  assert.deepEqual(
    backend.getTeachers_().map((item) => item['指導者']),
    ['IVY', '老師甲']
  );
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

test('legacy structure changes only through the explicit setup function, never a web read', () => {
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
  backend.console = { error() {} };

  const response = backend.doGet({ parameter: { action: 'getAvailableSubstitutes' } });
  assert.equal(legacyLeaveSheet.getName(), '工作表1');
  assert.equal(JSON.parse(response.text).status, 'error');

  backend.ensureSystemStructure_();
  assert.equal(legacyLeaveSheet.getName(), '請假代課紀錄');
});

test('appends the substitute and API headers without moving fixed columns', () => {
  const leaveSheet = createSheetFixture('請假代課紀錄', [EXPECTED_LEAVE_HEADERS]);
  const courseSheet = createSheetFixture('CourseList', [['日期', '時間', '課程', '指導者']]);
  const backend = loadBackendWithSpreadsheet(createSpreadsheetFixture([courseSheet, leaveSheet]));

  backend.ensureSystemStructure_();

  assert.deepEqual(courseSheet.values[0], EXPECTED_COURSE_HEADERS);
  assert.deepEqual(leaveSheet.values[0].slice(0, 10), EXPECTED_LEAVE_HEADERS);
  assert.deepEqual(
    leaveSheet.values[0].slice(10),
    EXPECTED_LEAVE_EXTENSION_HEADERS.concat(
      EXPECTED_SPECIAL_COURSE_HEADERS,
      EXPECTED_ORDINARY_DELAY_HEADERS
    )
  );
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
    [
      'CourseList', 'VVIP名單', 'VVIP選課紀錄', 'VVIP選課設定',
      '代課邀請', '操作紀錄', '登入帳號', '系統設定',
      '薪項設定', '薪資來源資料', '薪資同步快照', '薪資明細', '薪資結算',
      '薪資異議', '薪資付款設定', '請假代課紀錄', '特別課安排'
    ].sort()
  );
  assert.deepEqual(
    spreadsheet.getSheetByName('特別課安排').values[0],
    EXPECTED_SPECIAL_REQUEST_HEADERS
  );
});

test('legacy migration backfills only unique exact OB links and marks every unresolved active row', () => {
  const courseSheet = createSheetFixture('CourseList', [
    EXPECTED_COURSE_HEADERS,
    ['2026/08/10', '09:00', '空環 Lv.1', '老師甲', 'calendar-exact', 'class-ring', 'teacher-a', '否', ''],
    ['2026/08/11', '10:00', '舞綢 Lv.1', '老師乙', 'calendar-ambiguous-a', 'class-silk', 'teacher-b', '否', ''],
    ['2026/08/11', '10:00', '舞綢 Lv.1', '老師乙', 'calendar-ambiguous-b', 'class-silk', 'teacher-b', '否', ''],
  ]);
  const leaveSheet = createSheetFixture('請假代課紀錄', [
    EXPECTED_LEAVE_HEADERS.concat(EXPECTED_LEAVE_EXTENSION_HEADERS),
    ['時間', '老師甲', '2026/08/10', '09:00', '空環 Lv.1', '已領取', '老師丙'],
    ['時間', '老師乙', '2026/08/11', '10:00', '舞綢 Lv.1', '確認中'],
    ['時間', '老師丙', '2026/08/12', '11:00', '空瑜 Lv.1', '已領取', '老師甲'],
  ]);
  const spreadsheet = createSpreadsheetFixture([courseSheet, leaveSheet]);
  const backend = loadBackend({
    SpreadsheetApp: {
      ProtectionType: { SHEET: 'SHEET' },
      getActiveSpreadsheet() { return spreadsheet; },
    },
  });

  const result = backend.ensureSystemStructure_();
  const firstIds = leaveSheet.values.slice(1).map((row) => row[9]);

  assert.deepEqual(JSON.parse(JSON.stringify(result.migration)), {
    assignedIds: 3,
    linked: 1,
    manualReview: 2,
  });
  assert.ok(firstIds.every(Boolean));
  assert.equal(leaveSheet.values[1][10], 'calendar-exact');
  assert.equal(leaveSheet.values[1][15], '待核對');
  assert.equal(leaveSheet.values[2][10] || '', '');
  assert.equal(leaveSheet.values[2][15], '待人工核對');
  assert.match(leaveSheet.values[2][17], /多筆/);
  assert.equal(leaveSheet.values[3][15], '待人工核對');
  assert.match(leaveSheet.values[3][17], /找不到/);

  const auditSheet = spreadsheet.getSheetByName('操作紀錄');
  assert.equal(auditSheet.values.filter((row) => row[2] === '舊資料遷移').length, 1);
  const second = backend.ensureSystemStructure_();
  assert.deepEqual(JSON.parse(JSON.stringify(second.migration)), {
    assignedIds: 0,
    linked: 0,
    manualReview: 0,
  });
  assert.deepEqual(leaveSheet.values.slice(1).map((row) => row[9]), firstIds);
  assert.equal(auditSheet.values.filter((row) => row[2] === '舊資料遷移').length, 1);

  const accountSheet = spreadsheet.getSheetByName('登入帳號');
  const protections = accountSheet.getProtections();
  assert.equal(protections.length, 1);
  assert.equal(protections[0].getDescription(), '系統保護：登入帳號');
  assert.equal(protections[0].canDomainEdit(), false);
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

test('ordinary delay fields append after every existing leave column', () => {
  const backend = loadBackend();

  assert.equal(backend.SHEET_HEADERS.LEAVES[9], '代課編號');
  assert.equal(backend.SHEET_HEADERS.LEAVES[24], '特別課結束時間');
  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.SHEET_HEADERS.LEAVES.slice(25))),
    EXPECTED_ORDINARY_DELAY_HEADERS
  );
});

test('ordinary duration treats only 綢吊 as ninety minutes and limits delay choices', () => {
  const backend = loadBackend();

  assert.equal(backend.getOrdinaryCourseDurationMinutes_('A－綢吊 Lv.1'), 90);
  assert.equal(backend.getOrdinaryCourseDurationMinutes_('B－舞綢 Lv.1'), 60);
  assert.equal(backend.getOrdinaryCourseDurationMinutes_('A－空環 Lv.2'), 60);
  assert.equal(backend.normalizeOrdinaryDelayMinutes_(undefined), 0);
  assert.equal(backend.normalizeOrdinaryDelayMinutes_('15'), 15);
  assert.equal(backend.normalizeOrdinaryDelayMinutes_(30), 30);
  assert.throws(
    () => backend.normalizeOrdinaryDelayMinutes_(45),
    /原時段.*延後 15.*延後 30/
  );
});

test('classifies supported course categories', () => {
  const backend = loadBackend();
  assert.equal(typeof backend.getCourseCategory_, 'function');
  assert.equal(backend.getCourseCategory_('B－空環 Lv.2'), '空環');
  assert.equal(backend.getCourseCategory_('C－舞綢 Lv.1'), '舞綢');
  assert.equal(backend.getCourseCategory_('空中瑜伽 Lv.1'), '空瑜');
  assert.equal(backend.getCourseCategory_('原始瑜伽'), '地板課程');
  assert.equal(backend.getCourseCategory_('皮拉提斯'), '地板課程');
  assert.equal(backend.getCourseCategory_('現代小品'), '地板課程');
  assert.equal(backend.getCourseCategory_('柔軟度開發'), '地板課程');
  assert.equal(backend.getCourseCategory_('綢吊'), '綢吊');
  assert.equal(backend.getCourseCategory_('未分類特別課'), '其他');
});

test('deduplicates OB course items across rooms for teacher selection', () => {
  const backend = loadBackend();
  const catalog = backend.normalizeObClassCatalog_([
    { id: 101, nameZhHant: 'A－肩頸舒壓瑜伽' },
    { id: 202, nameZhHant: 'B－肩頸舒壓瑜伽' },
    { id: 303, nameZhHant: 'D－香氛瑜伽' },
    { id: 404, nameZhHant: 'A－空環 Lv.1' },
    { id: 505, nameZhHant: 'A－皮拉提斯' },
    { id: 606, nameZhHant: 'B－皮拉提斯〈新老師〉' },
    { id: 707, nameZhHant: 'C－柔軟度開發〈新老師〉' },
  ]);

  assert.deepEqual(JSON.parse(JSON.stringify(
    backend.buildClaimCourseOptions_(catalog, ['地板課程'])
  )), [
    { courseKey: '柔軟度開發', courseName: '柔軟度開發', category: '地板課程' },
    { courseKey: '皮拉提斯', courseName: '皮拉提斯', category: '地板課程' },
    { courseKey: '肩頸舒壓瑜伽', courseName: '肩頸舒壓瑜伽', category: '地板課程' },
    { courseKey: '香氛瑜伽', courseName: '香氛瑜伽', category: '地板課程' },
  ]);

  const resolved = backend.resolveCatalogCourseForRoom_(catalog, '皮拉提斯', 'B－舞綢 Lv.2');
  assert.equal(resolved.actualClassId, '606');
  assert.equal(resolved.actualCourseName, 'B－皮拉提斯');
});

test('recurring claim catalog excludes one-off long and special courses but keeps recurring 90-minute courses', () => {
  const backend = loadBackend();
  const rows = [
    ['2026/08/01', '10:00', 'A－原始瑜伽', '老師甲', 'cal-yoga-1', 'class-yoga-a'],
    ['2026/08/08', '10:00', 'A－原始瑜伽', '老師甲', 'cal-yoga-2', 'class-yoga-a'],
    ['2026/08/02', '13:15', 'B－綢吊 Lv.0-2（90分）', '老師乙', 'cal-sling-1', 'class-sling-b'],
    ['2026/08/09', '13:15', 'B－綢吊 Lv.0-2（90分）', '老師乙', 'cal-sling-2', 'class-sling-b'],
    ['2026/08/03', '18:30', 'B－椅子瑜伽（90min）', '老師丙', 'cal-chair', 'class-chair-b'],
    ['2026/08/04', '19:00', 'A－原始瑜伽特別課', '老師丙', 'cal-special', 'class-special-a'],
  ];

  const options = backend.buildRecurringClaimCourseOptions_(rows, ['地板課程', '綢吊']);

  assert.deepEqual(JSON.parse(JSON.stringify(options)), [
    {
      courseKey: '原始瑜伽', courseName: '原始瑜伽',
      courseTypeKey: '原始瑜伽', courseTypeName: '原始瑜伽', difficulty: '',
      category: '地板課程', durationMinutes: 0,
    },
    {
      courseKey: '綢吊 Lv.0-2（90分）', courseName: '綢吊 Lv.0-2（90分）',
      courseTypeKey: '綢吊（90分）', courseTypeName: '綢吊（90分）', difficulty: 'Lv.0-2',
      category: '綢吊', durationMinutes: 90,
    },
  ]);
});

test('splits recurring OB course types from their difficulty labels', () => {
  const backend = loadBackend();

  assert.deepEqual(JSON.parse(JSON.stringify(backend.parseClaimCourseOption_('B－空環 Lv.1~2'))), {
    courseTypeKey: '空環', courseTypeName: '空環', difficulty: 'Lv.1~2',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(backend.parseClaimCourseOption_('綢吊 Lv.0-2（90分）'))), {
    courseTypeKey: '綢吊（90分）', courseTypeName: '綢吊（90分）', difficulty: 'Lv.0-2',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(backend.parseClaimCourseOption_('原始瑜伽 Open level'))), {
    courseTypeKey: '原始瑜伽', courseTypeName: '原始瑜伽', difficulty: 'Open level',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(backend.parseClaimCourseOption_('皮拉提斯'))), {
    courseTypeKey: '皮拉提斯', courseTypeName: '皮拉提斯', difficulty: '',
  });
});

test('treats discounted and regular OB names as the same course type', () => {
  const backend = loadBackend();

  assert.deepEqual(JSON.parse(JSON.stringify(backend.parseClaimCourseOption_('現代小品〈優惠〉'))), {
    courseTypeKey: '現代小品', courseTypeName: '現代小品', difficulty: '',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(backend.parseClaimCourseOption_('A－空瑜 Lv.1-2〈優惠〉'))), {
    courseTypeKey: '空瑜', courseTypeName: '空瑜', difficulty: 'Lv.1-2',
  });
});

test('parses only explicit course duration markers', () => {
  const backend = loadBackend();

  assert.equal(backend.parseExplicitCourseMinutes_('椅子瑜伽（90min）'), 90);
  assert.equal(backend.parseExplicitCourseMinutes_('綢吊 90 分鐘'), 90);
  assert.equal(backend.parseExplicitCourseMinutes_('綢吊 1.5小時'), 90);
  assert.equal(backend.parseExplicitCourseMinutes_('空環 Lv.1'), 0);
});

test('claim options use recurring CourseList courses instead of the unfiltered OB class catalog', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    teacherACapabilities: '地板課程',
    courseRows: [
      ['2026/08/01', '10:00', 'A－原始瑜伽', '老師乙', 'cal-yoga-1', 'class-yoga-a', 'teacher-b', '否', ''],
      ['2026/08/08', '10:00', 'A－原始瑜伽', '老師乙', 'cal-yoga-2', 'class-yoga-a', 'teacher-b', '否', ''],
      ['2026/08/03', '18:30', 'B－椅子瑜伽（90min）', '老師丙', 'cal-chair', 'class-chair-b', 'teacher-c', '否', ''],
    ],
  });
  backend.getObClassCatalog_ = () => {
    throw new Error('ordinary claim options must not read the unfiltered classes catalog');
  };
  backend.openInvitations_(adminSession, ['老師甲']);

  const options = backend.getClaimOptions_(teacherASession);

  assert.deepEqual(JSON.parse(JSON.stringify(options.classes)), [
    {
      courseKey: '原始瑜伽', courseName: '原始瑜伽',
      courseTypeKey: '原始瑜伽', courseTypeName: '原始瑜伽', difficulty: '',
      category: '地板課程', durationMinutes: 0,
    },
  ]);
});

test('re-normalizes cached OB course items before teacher selection', () => {
  const services = createAuthServices();
  services.__cache.set('OB_ACTIVE_CLASS_CATALOG_V1', JSON.stringify([
    {
      classId: '606',
      fullCourseName: 'B－皮拉提斯〈新老師〉',
      courseName: '皮拉提斯〈新老師〉',
      courseKey: '皮拉提斯〈新老師〉',
      room: 'B',
      category: '地板課程',
    },
  ]));
  const backend = loadBackend(services);

  assert.deepEqual(JSON.parse(JSON.stringify(backend.getObClassCatalog_())), [{
    classId: '606',
    fullCourseName: 'B－皮拉提斯〈新老師〉',
    courseName: '皮拉提斯',
    courseKey: '皮拉提斯',
    room: 'B',
    category: '地板課程',
  }]);
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

test('tracked operational documents do not instruct deprecated hourly synchronization', () => {
  const files = [
    'README.md',
    'docs/superpowers/plans/2026-08-03-substitute-system-v2.md',
    'docs/superpowers/plans/2026-08-03-substitute-system-v2-1.md',
    'docs/superpowers/specs/2026-08-03-substitute-system-v2-design.md',
    'docs/superpowers/specs/2026-08-03-substitute-system-v2-1-design.md',
    '.superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-brief.md',
    '.superpowers/sdd/2026-08-03-substitute-system-v2-1/task-8-report.md',
  ];
  files.forEach((file) => {
    const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(
      content,
      /installHourlySyncTrigger|ScriptApp\.newTrigger|everyHours\(|timeBased\(|每小時/,
      file
    );
  });
});

test('README runs structure, OB sync, and idempotent migration rerun before teacher smoke tests', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const deployment = readme.slice(readme.indexOf('## 完整部署順序'));
  const initialSetup = deployment.indexOf('手動執行 `setupSystemStructure()` 一次');
  const firstSync = deployment.indexOf('同步 OB 課表');
  const migrationRerun = deployment.indexOf('再次手動執行 `setupSystemStructure()`', firstSync);
  const teacherSmoke = deployment.indexOf('測試帳號', firstSync);

  assert.ok(initialSetup >= 0, 'missing initial structure setup');
  assert.ok(firstSync > initialSetup, 'OB sync must follow initial setup');
  assert.ok(migrationRerun > firstSync, 'migration rerun must follow the first OB sync');
  assert.ok(teacherSmoke > migrationRerun, 'teacher smoke test must follow migration rerun');
  assert.match(deployment, /可安全重複執行|冪等/);
  assert.match(deployment, /assignedIds.*linked.*manualReview/);
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

test('invited list read is pure while the explicit POST route records first view once', () => {
  const {
    backend,
    invitationSheet,
    adminSession,
    teacherASession,
    teacherAToken,
  } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);

  const firstRows = backend.getAvailableSubstitutes_(teacherASession);
  assert.equal(invitationSheet.values[1][3], '');
  const listResult = JSON.parse(backend.doPost({ parameter: {
    action: 'getAvailableSubstitutes',
    sessionToken: teacherAToken,
  } }).text);
  assert.equal(invitationSheet.values[1][3], '');
  const postResult = JSON.parse(backend.doPost({ parameter: {
    action: 'recordInvitationFirstView',
    sessionToken: teacherAToken,
  } }).text);
  const firstViewedAt = invitationSheet.values[1][3];
  const secondResult = JSON.parse(backend.doPost({ parameter: {
    action: 'recordInvitationFirstView',
    sessionToken: teacherAToken,
  } }).text);

  assert.deepEqual(firstRows.map((row) => row['代課編號']), ['leave-b', 'leave-c']);
  assert.ok(firstRows.every((row) => row['原老師'] !== '老師甲'));
  assert.ok(firstRows.every((row) => row['狀態'] === undefined));
  assert.ok(firstRows.every((row) => row['邀請編號'] === undefined));
  assert.ok(firstRows.every((row) => row['其他受邀老師'] === undefined));
  assert.ok(firstViewedAt);
  assert.equal(invitationSheet.values[1][3], firstViewedAt);
  assert.deepEqual(listResult.data.map((row) => row['代課編號']), ['leave-b', 'leave-c']);
  assert.equal(postResult.data.recorded, true);
  assert.equal(secondResult.data.recorded, true);
});

test('available-substitute reads never invent missing legacy UUIDs', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師乙', '2026/08/10', '10:00', '空環 Lv.1', '確認中', '', '', '', '', 'calendar-b',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  assert.throws(() => backend.getAvailableSubstitutes_(teacherASession), /初始化|代課編號/);
  assert.equal(leaveSheet.values[1][9] || '', '');
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

test('admin can pause new leave requests without changing existing leave records', () => {
  const {
    backend,
    adminSession,
    teacherASession,
    leaveSheet,
    settingsSheet,
  } = createInvitationBackend({ leaveRows: [] });
  backend.getNextMonthKey_ = () => '2026-08';
  const before = JSON.stringify(leaveSheet.values);
  const leaveItem = {
    日期: '2026/08/01', 時間: '09:00', 課程: '空環 Lv.1', 'OB Calendar ID': 'calendar-a',
  };

  assert.deepEqual(JSON.parse(JSON.stringify(backend.pauseLeaves_(adminSession, true))), { paused: true });
  assert.throws(() => backend.getMyCourses_(teacherASession), /暫停請假/);
  assert.throws(() => backend.submitLeave_(teacherASession, [leaveItem]), /暫停請假/);
  assert.equal(JSON.stringify(leaveSheet.values), before);
  assert.equal(settingsSheet.values[1][0], '暫停全部請假');
  assert.equal(backend.getAdminDashboard_(adminSession).leavePaused, true);

  backend.pauseLeaves_(adminSession, false);
  assert.equal(backend.submitLeave_(teacherASession, [leaveItem]).created, 1);
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

test('claim rolls back the business row when its audit append fails', () => {
  const { backend, leaveSheet, auditSheet, adminSession, teacherASession } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);
  const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
  const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());
  injectSetValuesFailureOnce(
    auditSheet,
    ({ row }) => row > 1,
    'injected claim audit failure'
  );

  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{ substituteId: 'leave-c', changeNote: '' }]),
    /injected claim audit failure/
  );
  assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore);
  assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore);
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

  const listed = JSON.parse(backend.doPost({ parameter: {
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

test('batch invitation is all-or-nothing when its audit batch fails', () => {
  const { backend, invitationSheet, auditSheet, adminSession } = createInvitationBackend();
  const invitationsBefore = JSON.stringify(invitationSheet.values);
  const auditBefore = JSON.stringify(auditSheet.values);
  injectSetValuesFailureOnce(
    auditSheet,
    ({ row }) => row > 1,
    'injected invitation audit failure'
  );

  assert.throws(
    () => backend.openInvitations_(adminSession, ['老師甲', '老師乙']),
    /injected invitation audit failure/
  );
  assert.equal(JSON.stringify(invitationSheet.values), invitationsBefore);
  assert.equal(JSON.stringify(auditSheet.values), auditBefore);
});

test('category capability validation reads only the protected account record', () => {
  const { backend } = createInvitationBackend({ teacherACapabilities: '空環、瑜伽 / 舞綢' });

  assert.equal(backend.teacherCanTeachCategory_('老師甲', '空環'), true);
  assert.equal(backend.teacherCanTeachCategory_('老師甲', '瑜伽'), true);
  assert.equal(backend.teacherCanTeachCategory_('老師甲', '舞綢'), true);
  assert.equal(backend.teacherCanTeachCategory_('老師甲', '綢吊'), false);
  assert.equal(backend.teacherCanTeachCategory_('不存在老師', '空環'), false);
});

test('direct claim preserves the original difficulty and ignores forged editable values', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);

  const result = backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-b',
    handlingType: 'original',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: 'Lv.9',
    note: '不應寫入',
  }]);

  const claimedRow = leaveSheet.values.find((row) => row[9] === 'leave-b');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { count: 1 });
  assert.equal(claimedRow[5], '已領取');
  assert.equal(claimedRow[6], '老師甲');
  assert.equal(claimedRow[7], '沿用原課程；難度：Lv.1');
  assert.deepEqual(claimedRow.slice(11, 15), ['class-ring-1', '空環 Lv.1', 'Lv.1', '沿用原課程']);
  assert.doesNotMatch(claimedRow[7], /不應寫入|Lv\.9/);
  assert.equal(claimedRow[19], '空環');
});

test('existing-course change uses the server OB class while the note stays optional', () => {
  const crossLeave = [
    '2026-08-03 09:10:00', '老師丙', '2026/08/11', '11:00', '舞綢 Lv.1',
    '確認中', '', '', '', 'leave-cross', 'calendar-silk',
  ];
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    leaveRows: [crossLeave],
    teacherACapabilities: '空環',
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-cross',
    handlingType: 'existing',
    actualClassId: 'class-ring-1',
    actualCourseName: '偽造課名',
    category: '舞綢',
    difficulty: 'Lv.1',
    note: '',
  }]);

  const claimedRow = leaveSheet.values.find((row) => row[9] === 'leave-cross');
  assert.equal(claimedRow[11], 'class-ring-1');
  assert.equal(claimedRow[12], '空環 Lv.1');
  assert.equal(claimedRow[13], 'Lv.1');
  assert.equal(claimedRow[14], '改用既有 OB 課程');
  assert.equal(claimedRow[19], '空環');
  assert.doesNotMatch(claimedRow[7], /備註/);
  assert.doesNotMatch(claimedRow[7], /偽造課名/);
});

test('special-course change is universal and requires a name while difficulty and note stay optional', () => {
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
    substituteId: 'leave-new', handlingType: 'special', actualCourseName: '',
    difficulty: '', note: '調整為特別課',
  }]), /特別課名稱/);
  backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-new',
    handlingType: 'special',
    actualClassId: '',
    actualCourseName: '主題編舞',
    difficulty: '',
    note: '',
  }]);

  const claimedRow = leaveSheet.values.find((row) => row[9] === 'leave-new');
  assert.deepEqual(claimedRow.slice(11, 15), ['', '主題編舞', '', '需要新增課程']);
  assert.equal(claimedRow[19], '其他');
  assert.doesNotMatch(claimedRow[7], /備註/);
});

test('special availability identifies only the immediately following same-room open leave', () => {
  const backend = loadBackend();
  const pendingRows = [
    ['stamp', '原老師甲', '2026/08/10', '18:30', 'A－舞綢 Lv.1', '確認中', '', '', '', 'leave-1', 'cal-1'],
    ['stamp', '原老師乙', '2026/08/10', '20:00', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-2', 'cal-2'],
    ['stamp', '原老師丙', '2026/08/10', '20:00', 'B－空環 Lv.1', '確認中', '', '', '', 'leave-b', 'cal-b'],
  ];
  const courseRows = [
    ['2026/08/10', '18:30', 'A－舞綢 Lv.1', '原老師甲', 'cal-1'],
    ['2026/08/10', '20:00', 'A－空環 Lv.1', '原老師乙', 'cal-2'],
    ['2026/08/10', '20:00', 'B－空環 Lv.1', '原老師丙', 'cal-b'],
    ['2026/08/10', '21:30', 'A－舞綢 Lv.2', '原老師丁', 'cal-3'],
  ];

  const availability = backend.getSpecialCourseAvailability_(pendingRows, courseRows);

  assert.deepEqual(JSON.parse(JSON.stringify(availability['leave-1'])), {
    room: 'A', date: '2026/08/10', startTime: '18:30', nextCourseTime: '20:00',
    maxDurationMinutes: 75, mergePartnerIds: ['leave-2'], requiresClosingTimeConfirmation: false,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(availability['leave-2'])), {
    room: 'A', date: '2026/08/10', startTime: '20:00', nextCourseTime: '21:30',
    maxDurationMinutes: 75, mergePartnerIds: [], requiresClosingTimeConfirmation: false,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(availability['leave-b'])), {
    room: 'B', date: '2026/08/10', startTime: '20:00', nextCourseTime: '',
    maxDurationMinutes: 240, mergePartnerIds: [], requiresClosingTimeConfirmation: true,
  });
});

test('special claim options add the invited teacher own courses without exposing unopened courses from others', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-1', 'class-a', 'teacher-a', '否', ''],
      ['2026/08/10', '10:30', 'A－空環 Lv.2', '老師甲', 'cal-own-2', 'class-b', 'teacher-a', '否', ''],
      ['2026/08/10', '12:00', 'A－舞綢 Lv.1', '老師乙', 'cal-leave-1', 'class-c', 'teacher-b', '否', ''],
      ['2026/08/10', '13:30', 'A－空環 Lv.3', '老師丙', 'cal-private', 'class-d', 'teacher-c', '否', ''],
    ],
    leaveRows: [
      [
        'stamp', '老師乙', '2026/08/10', '12:00', 'A－舞綢 Lv.1',
        '確認中', '', '', '', 'leave-open-1', 'cal-leave-1',
      ],
      [
        'stamp', '老師甲', '2026/08/10', '10:30', 'A－空環 Lv.2',
        '已領取', '老師丙', '', '', 'leave-claimed-own', 'cal-own-2',
      ],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const options = backend.getClaimOptions_(teacherASession);

  assert.deepEqual(JSON.parse(JSON.stringify(options.specialSlots)), [
    {
      slotKey: 'own:cal-own-1', sourceType: 'own', substituteId: '', calendarId: 'cal-own-1',
      date: '2026/08/10', time: '09:00', room: 'A', courseName: 'A－空環 Lv.1',
      originalTeacher: '老師甲',
    },
    {
      slotKey: 'leave:leave-open-1', sourceType: 'leave', substituteId: 'leave-open-1',
      calendarId: 'cal-leave-1', date: '2026/08/10', time: '12:00', room: 'A',
      courseName: 'A－舞綢 Lv.1', originalTeacher: '老師乙',
    },
  ]);
  assert.equal(options.specialSlots.some((slot) => slot.calendarId === 'cal-private'), false);
});

test('special claim options only include courses from the next-month claim period', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/08/30', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-aug', 'class-a', 'teacher-a', '否', ''],
      ['2026/09/06', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-sep', 'class-a', 'teacher-a', '否', ''],
      ['2026/09/06', '10:30', 'A－舞綢 Lv.1', '老師乙', 'cal-leave-sep', 'class-b', 'teacher-b', '否', ''],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/06', '10:30', 'A－舞綢 Lv.1',
      '確認中', '', '', '', 'leave-open-sep', 'cal-leave-sep',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const options = backend.getClaimOptions_(teacherASession);

  assert.deepEqual(
    options.specialSlots.map((slot) => slot.calendarId),
    ['cal-own-sep', 'cal-leave-sep']
  );
});

test('special availability uses generic slot keys for own and open substitute courses', () => {
  const backend = loadBackend();
  backend.getNextMonthKey_ = () => '2026-08';
  const pendingRows = [[
    'stamp', '老師乙', '2026/08/10', '10:30', 'A－舞綢 Lv.1',
    '確認中', '', '', '', 'leave-open-1', 'cal-leave-1',
  ]];
  const courseRows = [
    ['2026/08/10', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-1'],
    ['2026/08/10', '10:30', 'A－舞綢 Lv.1', '老師乙', 'cal-leave-1'],
    ['2026/08/10', '12:00', 'A－空環 Lv.3', '老師丙', 'cal-private'],
  ];

  const availability = backend.getTeacherSpecialCourseAvailability_(
    '老師甲', pendingRows, courseRows
  );

  assert.deepEqual(JSON.parse(JSON.stringify(availability['own:cal-own-1'])), {
    room: 'A', date: '2026/08/10', startTime: '09:00', nextCourseTime: '10:30',
    maxDurationMinutes: 75, mergePartnerIds: ['leave:leave-open-1'],
    requiresClosingTimeConfirmation: false,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(availability['leave:leave-open-1'])), {
    room: 'A', date: '2026/08/10', startTime: '10:30', nextCourseTime: '12:00',
    maxDurationMinutes: 75, mergePartnerIds: [], requiresClosingTimeConfirmation: false,
  });
  assert.equal(availability['own:cal-private'], undefined);
});

test('own course special slot planning accepts consecutive own courses without creating substitute ids', () => {
  const backend = loadBackend();
  backend.getNextMonthKey_ = () => '2026-08';
  const courseRows = [
    ['2026/08/10', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-1'],
    ['2026/08/10', '10:30', 'A－空環 Lv.2', '老師甲', 'cal-own-2'],
    ['2026/08/10', '12:00', 'A－空環 Lv.3', '老師丙', 'cal-private'],
  ];

  const plan = backend.buildTeacherSpecialCourseSlotPlan_(
    '老師甲', 'own:cal-own-1', 120, '09:00', [], courseRows, 'merge'
  );

  assert.deepEqual(JSON.parse(JSON.stringify(plan.orderedSlots)), [
    { slotKey: 'own:cal-own-1', sourceType: 'own', substituteId: '', calendarId: 'cal-own-1', date: '2026/08/10', time: '09:00', room: 'A', courseName: 'A－空環 Lv.1', originalTeacher: '老師甲' },
    { slotKey: 'own:cal-own-2', sourceType: 'own', substituteId: '', calendarId: 'cal-own-2', date: '2026/08/10', time: '10:30', room: 'A', courseName: 'A－空環 Lv.2', originalTeacher: '老師甲' },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(plan.orderedSubstituteIds)), []);
  assert.equal(plan.endTime, '11:00');
});

test('mixed special slot planning accepts an own course followed by an open substitute and rejects private slots', () => {
  const backend = loadBackend();
  backend.getNextMonthKey_ = () => '2026-08';
  const courseRows = [
    ['2026/08/10', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-1'],
    ['2026/08/10', '10:30', 'A－舞綢 Lv.1', '老師乙', 'cal-leave-1'],
    ['2026/08/10', '12:00', 'A－空環 Lv.3', '老師丙', 'cal-private'],
  ];
  const pendingRows = [[
    'stamp', '老師乙', '2026/08/10', '10:30', 'A－舞綢 Lv.1',
    '確認中', '', '', '', 'leave-open-1', 'cal-leave-1',
  ]];

  const plan = backend.buildTeacherSpecialCourseSlotPlan_(
    '老師甲', 'own:cal-own-1', 120, '09:00', pendingRows, courseRows, 'merge'
  );
  assert.deepEqual(JSON.parse(JSON.stringify(plan.orderedSubstituteIds)), ['leave-open-1']);
  assert.deepEqual(JSON.parse(JSON.stringify(plan.occupiedTimes)), ['09:00', '10:30']);

  assert.throws(() => backend.buildTeacherSpecialCourseSlotPlan_(
    '老師甲', 'own:cal-own-1', 210, '09:00', pendingRows, courseRows, 'merge'
  ), /12:00.*尚未開放代課/);
});

test('own-only special claim appends one arrangement and never creates or changes leave rows', () => {
  const { backend, courseSheet, leaveSheet, specialRequestSheet, adminSession, teacherASession } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-1', 'class-a', 'teacher-a', '否', ''],
      ['2026/08/10', '10:30', 'A－空環 Lv.2', '老師甲', 'cal-own-2', 'class-b', 'teacher-a', '否', ''],
      ['2026/08/10', '12:00', 'A－空環 Lv.3', '老師丙', 'cal-private', 'class-c', 'teacher-c', '否', ''],
    ],
    leaveRows: [],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  const beforeLeaves = JSON.stringify(leaveSheet.values);

  const result = backend.claimSpecialCourse_(teacherASession, {
    mode: 'merge', startSlotKey: 'own:cal-own-1', actualStartTime: '09:00',
    courseName: '舞綢中軸特別課', durationMinutes: 120, difficulty: 'Open level', note: '',
  });

  assert.equal(JSON.stringify(leaveSheet.values), beforeLeaves);
  assert.equal(specialRequestSheet.values.length, 2);
  assert.equal(result.count, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(result.substituteIds)), []);
  assert.deepEqual(JSON.parse(JSON.stringify(result.occupiedSlotKeys)), ['own:cal-own-1', 'own:cal-own-2']);
  const request = specialRequestSheet.values[1];
  assert.equal(request[1], result.specialGroupId);
  assert.equal(request[2], '老師甲');
  assert.equal(request[3], '2026/08/10');
  assert.equal(request[4], 'A');
  assert.deepEqual(JSON.parse(request[5]).map((slot) => slot.slotKey), ['own:cal-own-1', 'own:cal-own-2']);
  assert.deepEqual(JSON.parse(request[6]), []);
  assert.deepEqual(request.slice(7, 16), [
    '09:00', '舞綢中軸特別課', 'Open level', 120, '11:00',
    '使用連續時段', '', '待處理', '待核對',
  ]);
  const teacherRecord = backend.getMySubs_('老師甲')
    .find((item) => item['紀錄類型'] === '特別課安排');
  assert.equal(teacherRecord['特別課群組 ID'], result.specialGroupId);
  assert.equal(teacherRecord['實際課程名稱'], '舞綢中軸特別課');
  assert.equal(teacherRecord['來源時段'].length, 2);

  const adminRecord = backend.getAdminDashboard_(adminSession).obWork
    .find((item) => item.recordType === 'specialRequest');
  assert.equal(adminRecord.specialGroupId, result.specialGroupId);
  assert.equal(adminRecord.actualCourse, '舞綢中軸特別課');
  assert.equal(adminRecord.sourceSlots.length, 2);

  backend.linkSpecialCourseRequestCalendarItem_(adminSession, result.specialGroupId, 'cal-own-1');
  assert.equal(specialRequestSheet.values[1][18], 'cal-own-1');

  courseSheet.values = [
    EXPECTED_COURSE_HEADERS,
    ['2026/08/10', '09:00', 'A－舞綢中軸特別課 (120min)', '老師甲', 'cal-own-1', 'class-special', 'teacher-a', '否', ''],
  ];
  const reconciliation = backend.reconcileObChanges_(adminSession);
  assert.equal(reconciliation.matched, 1);
  assert.equal(reconciliation.exceptions, 0);
  assert.deepEqual(specialRequestSheet.values[1].slice(14, 16), ['已完成', '已核對']);
  assert.match(specialRequestSheet.values[1][16], /^2026-08-15 /);
  assert.equal(specialRequestSheet.values[1][17], '');
});

test('mixed own-and-leave special claim updates only the real leave and stores one group request', () => {
  const { backend, leaveSheet, specialRequestSheet, adminSession, teacherASession } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-1', 'class-a', 'teacher-a', '否', ''],
      ['2026/08/10', '10:30', 'A－舞綢 Lv.1', '老師乙', 'cal-leave-1', 'class-b', 'teacher-b', '否', ''],
      ['2026/08/10', '12:00', 'A－空環 Lv.3', '老師丙', 'cal-private', 'class-c', 'teacher-c', '否', ''],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/08/10', '10:30', 'A－舞綢 Lv.1',
      '確認中', '', '', '', 'leave-open-1', 'cal-leave-1',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const result = backend.claimSpecialCourse_(teacherASession, {
    mode: 'merge', startSlotKey: 'own:cal-own-1', actualStartTime: '09:00',
    courseName: '椅子瑜伽特別課', durationMinutes: 120, difficulty: '', note: '',
  });

  assert.equal(result.count, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(result.substituteIds)), ['leave-open-1']);
  assert.equal(leaveSheet.values.length, 2);
  assert.equal(leaveSheet.values[1][5], '已領取');
  assert.equal(leaveSheet.values[1][6], '老師甲');
  assert.equal(leaveSheet.values[1][21], result.specialGroupId);
  assert.equal(specialRequestSheet.values.length, 2);
  assert.deepEqual(JSON.parse(specialRequestSheet.values[1][6]), ['leave-open-1']);
});

test('special availability formats each course row only once', () => {
  const backend = loadBackend();
  const originalFormatDate = backend.Utilities.formatDate;
  let formatCalls = 0;
  backend.Utilities.formatDate = (...args) => {
    formatCalls += 1;
    return originalFormatDate(...args);
  };
  const date = new Date('2026-08-10T00:00:00+08:00');
  const at = (time) => new Date(`2026-08-10T${time}:00+08:00`);
  const pendingRows = [
    ['stamp', '原老師甲', date, at('18:30'), 'A－舞綢 Lv.1', '確認中', '', '', '', 'leave-1', 'cal-1'],
    ['stamp', '原老師乙', date, at('20:00'), 'A－空環 Lv.1', '確認中', '', '', '', 'leave-2', 'cal-2'],
    ['stamp', '原老師丙', date, at('20:00'), 'B－空環 Lv.1', '確認中', '', '', '', 'leave-b', 'cal-b'],
  ];
  const courseRows = [
    [date, at('18:30'), 'A－舞綢 Lv.1', '原老師甲', 'cal-1'],
    [date, at('20:00'), 'A－空環 Lv.1', '原老師乙', 'cal-2'],
    [date, at('20:00'), 'B－空環 Lv.1', '原老師丙', 'cal-b'],
    [date, at('21:30'), 'A－舞綢 Lv.2', '原老師丁', 'cal-3'],
  ];

  backend.getSpecialCourseAvailability_(pendingRows, courseRows);

  assert.equal(formatCalls, 14);
});

test('single-slot special claim stores one group and enforces a 15-minute turnover', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    courseRows: [
      ['2026/08/11', '18:30', 'A－舞綢 Lv.1', '老師乙', 'cal-special-1', 'class-silk', 'teacher-b', '否', ''],
      ['2026/08/11', '21:00', 'A－空環 Lv.1', '老師丙', 'cal-later', 'class-ring', 'teacher-c', '否', ''],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/08/11', '18:30', 'A－舞綢 Lv.1',
      '確認中', '', '', '', 'leave-special-1', 'cal-special-1',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  assert.throws(() => backend.claimSpecialCourse_(teacherASession, {
    mode: 'vacancy', substituteIds: ['leave-special-1'], courseName: '空中特別編舞',
    durationMinutes: 150, difficulty: '', note: '使用後方空堂。',
  }), /15 分鐘換場.*最晚.*20:45/);

  assert.throws(() => backend.claimSpecialCourse_(teacherASession, {
    mode: 'vacancy', substituteIds: ['leave-special-1'], courseName: '空中特別編舞',
    durationMinutes: 89, difficulty: '', note: '',
  }), /90 至 240 分鐘/);

  const result = backend.claimSpecialCourse_(teacherASession, {
    mode: 'vacancy', substituteIds: ['leave-special-1'], courseName: '空中特別編舞',
    durationMinutes: 120, difficulty: '', note: '',
  });

  const row = leaveSheet.values.find((item) => item[9] === 'leave-special-1');
  assert.equal(result.count, 1);
  assert.equal(row[5], '已領取');
  assert.equal(row[6], '老師甲');
  assert.equal(row[12], '空中特別編舞');
  assert.equal(row[14], '需要新增課程');
  assert.equal(row[19], '其他');
  assert.match(row[21], /^invitation-uuid-/);
  assert.deepEqual(row.slice(22, 25), ['使用後方空堂', 120, '20:30']);
});

test('continuous special claim expands one starting id into every required same-room slot', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/12', '13:30', 'B－空環 Lv.2', '老師乙', 'cal-merge-1', 'class-ring-2', 'teacher-b', '否', ''],
      ['2026/09/12', '14:30', 'D－舞綢 Lv.1', '老師丁', 'cal-other-1', 'class-silk-1', 'teacher-d', '否', ''],
      ['2026/09/12', '15:00', 'B－空環 Lv.1', '老師丙', 'cal-merge-2', 'class-ring-1', 'teacher-c', '否', ''],
      ['2026/09/12', '15:45', 'D－空瑜 Lv.0', '老師丁', 'cal-other-2', 'class-yoga-0', 'teacher-d', '否', ''],
      ['2026/09/12', '16:30', 'B－空環 Lv.0', '老師戊', 'cal-merge-3', 'class-ring-0', 'teacher-e', '否', ''],
      ['2026/09/12', '17:45', 'B－舞綢 Lv.2', '老師己', 'cal-boundary', 'class-silk-2', 'teacher-f', '否', ''],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/09/12', '13:30', 'B－空環 Lv.2', '確認中', '', '', '', 'leave-merge-1', 'cal-merge-1'],
      ['stamp', '老師丙', '2026/09/12', '15:00', 'B－空環 Lv.1', '確認中', '', '', '', 'leave-merge-2', 'cal-merge-2'],
      ['stamp', '老師戊', '2026/09/12', '16:30', 'B－空環 Lv.0', '確認中', '', '', '', 'leave-merge-3', 'cal-merge-3'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const result = backend.claimSpecialCourse_(teacherASession, {
    mode: 'merge', substituteIds: ['leave-merge-1'],
    courseName: '空環主題特別課', durationMinutes: 240, difficulty: 'Open level',
    note: '系統自動占用連續時段。',
  });

  const rows = leaveSheet.values.filter((row) => /^leave-merge-/.test(row[9]));
  assert.equal(result.count, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(result.substituteIds)), [
    'leave-merge-1', 'leave-merge-2', 'leave-merge-3',
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(result.occupiedTimes)), ['13:30', '15:00', '16:30']);
  assert.equal(rows[0][21], rows[1][21]);
  assert.equal(rows[1][21], rows[2][21]);
  assert.equal(rows[0][21], result.specialGroupId);
  rows.forEach((row) => {
    assert.equal(row[5], '已領取');
    assert.equal(row[6], '老師甲');
    assert.equal(row[22], '使用連續時段');
    assert.equal(row[23], 240);
    assert.equal(row[24], '17:30');
  });
  const teacherRecords = backend.getMySubs_('老師甲').filter((item) => /^leave-merge-/.test(item['代課編號']));
  assert.equal(teacherRecords.length, 3);
  teacherRecords.forEach((item) => {
    assert.equal(item['特別課群組 ID'], result.specialGroupId);
    assert.equal(item['特別課模式'], '使用連續時段');
    assert.equal(item['特別課分鐘數'], 240);
    assert.equal(item['特別課結束時間'], '17:30');
  });
  const adminRecords = backend.getAdminDashboard_(adminSession).obWork
    .filter((item) => /^leave-merge-/.test(item.substituteId));
  assert.equal(adminRecords.length, 3);
  adminRecords.forEach((item) => {
    assert.equal(item.specialGroupId, result.specialGroupId);
    assert.equal(item.specialMode, '使用連續時段');
    assert.equal(item.specialDurationMinutes, 240);
    assert.equal(item.specialEndTime, '17:30');
  });
});

test('special claim may start later than the occupied slot and still reserves every required slot', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/12', '13:30', 'B－空環 Lv.2', '老師乙', 'cal-delayed-1', 'class-ring-2', 'teacher-b', '否', ''],
      ['2026/09/12', '15:00', 'B－空環 Lv.1', '老師丙', 'cal-delayed-2', 'class-ring-1', 'teacher-c', '否', ''],
      ['2026/09/12', '15:45', 'B－舞綢 Lv.1', '老師丁', 'cal-boundary', 'class-silk-1', 'teacher-d', '否', ''],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/09/12', '13:30', 'B－空環 Lv.2', '確認中', '', '', '', 'leave-delayed-1', 'cal-delayed-1'],
      ['stamp', '老師丙', '2026/09/12', '15:00', 'B－空環 Lv.1', '確認中', '', '', '', 'leave-delayed-2', 'cal-delayed-2'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const result = backend.claimSpecialCourse_(teacherASession, {
    mode: 'merge', substituteIds: ['leave-delayed-1'], actualStartTime: '14:00',
    courseName: '椅子瑜伽特別課', durationMinutes: 90, difficulty: '', note: '',
  });

  const rows = leaveSheet.values.filter((row) => /^leave-delayed-/.test(row[9]));
  assert.equal(result.actualStartTime, '14:00');
  assert.equal(result.endTime, '15:30');
  assert.deepEqual(JSON.parse(JSON.stringify(result.substituteIds)), ['leave-delayed-1', 'leave-delayed-2']);
  assert.deepEqual(JSON.parse(JSON.stringify(result.occupiedTimes)), ['13:30', '15:00']);
  rows.forEach((row) => {
    assert.equal(row[24], '15:30');
    assert.match(row[7], /實際開始：14:00/);
  });
  const teacherRecord = backend.getMySubs_('老師甲')
    .find((item) => item['代課編號'] === 'leave-delayed-1');
  assert.equal(teacherRecord['特別課實際開始時間'], '14:00');
  const adminRecord = backend.getAdminDashboard_(adminSession).obWork
    .find((item) => item.substituteId === 'leave-delayed-1');
  assert.equal(adminRecord.specialActualStartTime, '14:00');
});

test('special claim rejects an earlier, non-quarter-hour, or too-late actual start without writes', () => {
  ['13:15', '13:40', '14:50'].forEach((actualStartTime) => {
    const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
      nextMonth: '2026-09',
      courseRows: [
        ['2026/09/12', '13:30', 'B－空環 Lv.2', '老師乙', 'cal-invalid-1', 'class-ring-2', 'teacher-b', '否', ''],
        ['2026/09/12', '15:00', 'B－空環 Lv.1', '老師丙', 'cal-invalid-2', 'class-ring-1', 'teacher-c', '否', ''],
      ],
      leaveRows: [[
        'stamp', '老師乙', '2026/09/12', '13:30', 'B－空環 Lv.2',
        '確認中', '', '', '', 'leave-invalid-1', 'cal-invalid-1',
      ]],
    });
    backend.openInvitations_(adminSession, ['老師甲']);
    const before = JSON.stringify(leaveSheet.values);

    assert.throws(() => backend.claimSpecialCourse_(teacherASession, {
      mode: 'vacancy', substituteIds: ['leave-invalid-1'], actualStartTime,
      courseName: '椅子瑜伽特別課', durationMinutes: 90, difficulty: '', note: '',
    }), /實際開始時間/);
    assert.equal(JSON.stringify(leaveSheet.values), before);
  });
});

test('continuous special claim blocks a missing required slot without partial writes', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '18:30', 'A－舞綢 Lv.1', '老師乙', 'cal-safe-1', 'class-a', 'teacher-b', '否', ''],
      ['2026/08/10', '20:00', 'A－空環 Lv.1', '老師丙', 'cal-safe-2', 'class-b', 'teacher-c', '否', ''],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/08/10', '18:30', 'A－舞綢 Lv.1', '確認中', '', '', '', 'leave-safe-1', 'cal-safe-1'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  const before = JSON.stringify(leaveSheet.values);

  assert.throws(() => backend.claimSpecialCourse_(teacherASession, {
    mode: 'merge', substituteIds: ['leave-safe-1'],
    courseName: '缺少時段', durationMinutes: 120, note: '',
  }), /2026\/08\/10 A 教室 20:00.*尚未開放代課/);
  assert.equal(JSON.stringify(leaveSheet.values), before);
});

test('continuous special claim blocks a stale required slot without partial writes', () => {
  const leaveRows = [
    ['stamp', '老師乙', '2026/08/10', '18:30', 'A－舞綢 Lv.1', '確認中', '', '', '', 'leave-safe-1', 'cal-safe-1'],
    ['stamp', '老師丙', '2026/08/10', '20:00', 'A－空環 Lv.1', '已領取', '老師丁', '', '', 'leave-safe-2', 'cal-safe-2'],
  ];
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '18:30', 'A－舞綢 Lv.1', '老師乙', 'cal-safe-1', 'class-a', 'teacher-b', '否', ''],
      ['2026/08/10', '20:00', 'A－空環 Lv.1', '老師丙', 'cal-safe-2', 'class-b', 'teacher-c', '否', ''],
    ],
    leaveRows,
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  const before = JSON.stringify(leaveSheet.values);

  assert.throws(() => backend.claimSpecialCourse_(teacherASession, {
    mode: 'merge', substituteIds: ['leave-safe-1'],
    courseName: '過期時段', durationMinutes: 120, note: '',
  }), /被其他老師領取/);
  assert.equal(JSON.stringify(leaveSheet.values), before);
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
  assert.equal(normalized.difficulty, 'Lv.1');
  assert.equal(normalized.note, '');
});

test('claim options return only invited teacher capabilities and authorised OB classes', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    teacherACapabilities: '空環、瑜伽',
    courseRows: [
      ['2026/08/01', '09:00', 'A－空環 Lv.1', '老師乙', 'calendar-ring-1', 'class-ring-1', 'teacher-b', '否', ''],
      ['2026/08/08', '09:00', 'A－空環 Lv.1', '老師乙', 'calendar-ring-2', 'class-ring-1', 'teacher-b', '否', ''],
      ['2026/08/02', '12:00', 'A－原始瑜伽特別課', '老師丙', 'calendar-special', 'class-special', 'teacher-c', '否', ''],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const options = backend.getClaimOptions_(teacherASession);

  assert.deepEqual(JSON.parse(JSON.stringify(options.capabilities)), ['空環', '地板課程']);
  assert.deepEqual(JSON.parse(JSON.stringify(options.classes)), [
    {
      courseKey: '空環 Lv.1', courseName: '空環 Lv.1',
      courseTypeKey: '空環', courseTypeName: '空環', difficulty: 'Lv.1',
      category: '空環', durationMinutes: 0,
    },
  ]);
  assert.equal(options.pinHash, undefined);
  assert.equal(options.role, undefined);
});

test('uninvited claim-options route returns no capabilities or OB classes', () => {
  const { backend, teacherAToken } = createInvitationBackend({ teacherACapabilities: '空環' });

  const response = JSON.parse(backend.doPost({ parameter: {
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

  const response = JSON.parse(backend.doPost({ parameter: {
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

test('catalog course choice keeps the leave room and uses its matching OB class ID', () => {
  const { backend } = createInvitationBackend({ teacherACapabilities: '地板課程' });
  backend.getObClassCatalog_ = () => backend.normalizeObClassCatalog_([
    { id: 101, nameZhHant: 'A－肩頸舒壓瑜伽' },
    { id: 202, nameZhHant: 'B－肩頸舒壓瑜伽' },
  ]);

  const normalized = backend.validateClaimChange_({
    teacher: '老師甲',
    targetCourseName: 'B－舞綢 Lv.2',
    handlingType: 'existing',
    courseKey: '肩頸舒壓瑜伽',
    actualCourseName: '肩頸舒壓瑜伽',
    category: '地板課程',
    note: '改為地板課程。',
  });

  assert.equal(normalized.actualClassId, '202');
  assert.equal(normalized.actualCourseName, 'B－肩頸舒壓瑜伽');
  assert.equal(normalized.category, '地板課程');
  assert.equal(normalized.handlingType, '改用既有 OB 課程');
});

test('catalog course choice marks an absent room version for admin creation', () => {
  const { backend } = createInvitationBackend({ teacherACapabilities: '地板課程' });
  backend.getObClassCatalog_ = () => backend.normalizeObClassCatalog_([
    { id: 101, nameZhHant: 'A－原始瑜伽' },
    { id: 303, nameZhHant: 'D－原始瑜伽' },
  ]);

  const normalized = backend.validateClaimChange_({
    teacher: '老師甲',
    targetCourseName: 'B－舞綢 Lv.2',
    handlingType: 'existing',
    courseKey: '原始瑜伽',
    actualCourseName: '原始瑜伽',
    category: '地板課程',
    note: '改為地板課程。',
  });

  assert.equal(normalized.actualClassId, '');
  assert.equal(normalized.actualCourseName, 'B－原始瑜伽');
  assert.equal(normalized.handlingType, '需要新增課程');
});

test('course type and difficulty resolve independently to the exact room OB class', () => {
  const recurringRows = [
    ['2026/08/01', '09:00', 'A－空環 Lv.1', '老師乙', 'cal-ring-1a', 'class-ring-1a'],
    ['2026/08/08', '09:00', 'A－空環 Lv.1', '老師乙', 'cal-ring-1b', 'class-ring-1a'],
    ['2026/08/01', '10:30', 'A－空環 Lv.2', '老師乙', 'cal-ring-2a', 'class-ring-2a'],
    ['2026/08/08', '10:30', 'A－空環 Lv.2', '老師乙', 'cal-ring-2b', 'class-ring-2a'],
  ];
  const { backend } = createInvitationBackend({
    teacherACapabilities: '空環',
    courseRows: recurringRows,
  });
  backend.getObClassCatalog_ = () => backend.normalizeObClassCatalog_([
    { id: 101, nameZhHant: 'A－空環 Lv.1' },
    { id: 102, nameZhHant: 'A－空環 Lv.2' },
    { id: 202, nameZhHant: 'B－空環 Lv.2' },
  ]);

  const normalized = backend.validateClaimChange_({
    teacher: '老師甲',
    targetCourseName: 'B－空環 Lv.1',
    handlingType: 'existing',
    courseTypeKey: '空環',
    difficulty: 'Lv.2',
    note: '',
  });

  assert.equal(normalized.actualClassId, '202');
  assert.equal(normalized.actualCourseName, 'B－空環 Lv.2');
  assert.equal(normalized.difficulty, 'Lv.2');
  assert.equal(normalized.handlingType, '改用既有 OB 課程');
  assert.equal(normalized.note, '');
});

test('independent course adjustment never borrows another room Class ID', () => {
  const recurringRows = [
    ['2026/08/01', '09:00', 'A－空環 Lv.2', '老師乙', 'cal-ring-2a', 'class-ring-2a'],
    ['2026/08/08', '09:00', 'A－空環 Lv.2', '老師乙', 'cal-ring-2b', 'class-ring-2a'],
  ];
  const { backend } = createInvitationBackend({
    teacherACapabilities: '空環',
    courseRows: recurringRows,
  });
  backend.getObClassCatalog_ = () => backend.normalizeObClassCatalog_([
    { id: 102, nameZhHant: 'A－空環 Lv.2' },
  ]);

  const normalized = backend.validateClaimChange_({
    teacher: '老師甲',
    targetCourseName: 'B－空環 Lv.1',
    handlingType: 'existing',
    courseTypeKey: '空環',
    difficulty: 'Lv.2',
    note: '',
  });

  assert.equal(normalized.actualClassId, '');
  assert.equal(normalized.actualCourseName, 'B－空環 Lv.2');
  assert.equal(normalized.handlingType, '需要新增課程');
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

test('cancel rolls back the business row when its audit append fails', () => {
  const { backend, leaveSheet, auditSheet, teacherASession } = createInvitationBackend();
  const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
  const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());
  injectSetValuesFailureOnce(
    auditSheet,
    ({ row }) => row > 1,
    'injected cancellation audit failure'
  );

  assert.throws(
    () => backend.cancelLeave_(teacherASession, 'leave-a'),
    /injected cancellation audit failure/
  );
  assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore);
  assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore);
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
      '時間', '老師甲', '2026/08/10', '09:00', '空環 Lv.1', '已領取', '老師乙', '', '',
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
  assert.equal(leaveSheet.values[1][8], '待回復');
  assert.equal(leaveSheet.values[1][15], '待回復 OB');
  assert.equal(leaveSheet.values[1][18], '取消後待回復 OB');
  assert.deepEqual(auditSheet.values.slice(1).map((row) => row[2]), [
    '申請取消請假', '核准取消請假',
  ]);

  const beforeRestore = backend.getAdminDashboard_(adminSession);
  assert.ok(beforeRestore.obWork.some((item) => item.substituteId === 'leave-cancel-request'));
  assert.ok(!beforeRestore.completed.some((item) => item.substituteId === 'leave-cancel-request'));

  const reconciliation = backend.reconcileObChanges_(adminSession);
  assert.equal(reconciliation.matched, 1);
  assert.equal(leaveSheet.values[1][8], '已完成');
  assert.equal(leaveSheet.values[1][15], '已回復核對');
  assert.equal(leaveSheet.values[1][18], '取消後已回復 OB');
  const afterRestore = backend.getAdminDashboard_(adminSession);
  assert.ok(!afterRestore.obWork.some((item) => item.substituteId === 'leave-cancel-request'));
  assert.ok(afterRestore.changeRequests.some((item) => item.substituteId === 'leave-cancel-request'));
  assert.ok(!afterRestore.completed.some((item) => item.substituteId === 'leave-cancel-request'));
});

test('rejected cancellation restores an OB-started pending leave to list and claim while audit keeps rejection', () => {
  const {
    backend,
    leaveSheet,
    auditSheet,
    adminSession,
    teacherASession,
    teacherBSession,
  } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師乙', '2026/08/10', '10:00', '空環 Lv.1', '確認中', '', '', '處理中',
      'leave-cancel-rejected', 'calendar-b', '', '', '', '', '', '', '', '', '', '',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  backend.requestLeaveCancellation_(teacherBSession, 'leave-cancel-rejected', '想取消這堂課');
  assert.equal(leaveSheet.values[1][18], '申請取消中');
  assert.ok(!backend.getAvailableSubstitutes_(teacherASession)
    .some((item) => item['代課編號'] === 'leave-cancel-rejected'));
  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{ substituteId: 'leave-cancel-rejected', changeNote: '' }]),
    /尚待管理員|申請取消中/
  );

  const resolution = backend.resolveChangeRequest_(
    adminSession,
    'leave-cancel-rejected',
    'reject',
    '維持原代課需求'
  );

  const row = leaveSheet.values[1];
  assert.equal(resolution.status, '確認中');
  assert.equal(row[5], '確認中');
  assert.equal(row[8], '處理中');
  assert.equal(row[18] || '', '');
  const rejectionAudit = auditSheet.values.find((auditRow) =>
    auditRow[2] === '駁回取消請假' && auditRow[3] === 'leave-cancel-rejected');
  assert.ok(rejectionAudit);
  assert.equal(rejectionAudit[5], '取消申請已駁回');
  assert.equal(rejectionAudit[6], '維持原代課需求');
  assert.ok(backend.getAdminDashboard_(adminSession).pendingInvitations
    .some((item) => item.substituteId === 'leave-cancel-rejected'));
  assert.ok(backend.getAvailableSubstitutes_(teacherASession)
    .some((item) => item['代課編號'] === 'leave-cancel-rejected'));

  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.claimSubstitute_(teacherASession, [{
      substituteId: 'leave-cancel-rejected',
      changeNote: '',
    }]))),
    { count: 1 }
  );
  assert.equal(row[5], '已領取');
  assert.equal(row[6], '老師甲');
  assert.ok(auditSheet.values.some((auditRow) =>
    auditRow[2] === '駁回取消請假' && auditRow[3] === 'leave-cancel-rejected'));
});

test('terminal I and S history labels do not block an otherwise eligible pending claim', () => {
  const { backend, leaveSheet, teacherASession } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師乙', '2026/08/10', '10:00', '空環 Lv.1', '確認中', '', '', '已完成',
      'leave-terminal-history', 'calendar-b', '', '', '', '', '', '', '', '取消申請已駁回', '', '',
    ]],
    invitationRows: [['invite-a', '老師甲', '時間', '', '開放中', '']],
  });

  assert.ok(backend.getAvailableSubstitutes_(teacherASession)
    .some((item) => item['代課編號'] === 'leave-terminal-history'));
  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.claimSubstitute_(teacherASession, [{
      substituteId: 'leave-terminal-history',
      changeNote: '',
    }]))),
    { count: 1 }
  );
  assert.equal(leaveSheet.values[1][5], '已領取');
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

test('admin-approved withdraw stays in OB restore work until reconciliation then reopens', () => {
  const {
    backend,
    leaveSheet,
    auditSheet,
    adminSession,
    teacherASession,
    teacherBSession,
  } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師丙', '2026/08/12', '12:00', '空環 Lv.1', '已領取', '老師乙',
      '沿用原課程；難度：Lv.1', '待處理', 'leave-withdraw', 'calendar-c', 'class-ring-1',
      '空環 Lv.1', 'Lv.1', '沿用原課程', '待核對', '', '', '', '空環',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  backend.requestClaimWithdrawal_(teacherBSession, 'leave-withdraw', '手腕受傷');

  const result = backend.resolveChangeRequest_(adminSession, 'leave-withdraw', 'approve', '同意重新開放');

  const row = leaveSheet.values[1];
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    substituteId: 'leave-withdraw', requestType: 'withdrawal', decision: 'approve', status: '確認中',
  });
  assert.equal(row[5], '確認中');
  assert.equal(row[6], '');
  assert.equal(row[7], '');
  assert.equal(row[8], '待回復');
  assert.deepEqual(row.slice(11, 18), ['', '', '', '', '待回復 OB', '', '']);
  assert.equal(row[15], '待回復 OB');
  assert.equal(row[18], '退出後待回復 OB');
  assert.equal(row[19], '');
  assert.match(auditSheet.values.at(-1)[6], /原代課老師：老師乙/);

  const beforeRestore = backend.getAdminDashboard_(adminSession);
  assert.ok(beforeRestore.obWork.some((item) => item.substituteId === 'leave-withdraw'));
  assert.ok(!beforeRestore.pendingInvitations.some((item) => item.substituteId === 'leave-withdraw'));
  assert.ok(!backend.getAvailableSubstitutes_(teacherASession)
    .some((item) => item['代課編號'] === 'leave-withdraw'));
  const reconciliation = backend.reconcileObChanges_(adminSession);
  assert.equal(reconciliation.matched, 1);
  assert.equal(row[8], '');
  assert.equal(row[15], '');
  assert.equal(row[18], '');
  const afterRestore = backend.getAdminDashboard_(adminSession);
  assert.ok(!afterRestore.obWork.some((item) => item.substituteId === 'leave-withdraw'));
  assert.ok(afterRestore.pendingInvitations.some((item) => item.substituteId === 'leave-withdraw'));
  assert.ok(backend.getAvailableSubstitutes_(teacherASession)
    .some((item) => item['代課編號'] === 'leave-withdraw'));
});

test('stale claim cannot consume withdrawal restore work or clear its restore state', () => {
  const {
    backend,
    leaveSheet,
    auditSheet,
    adminSession,
    teacherASession,
    teacherBSession,
  } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師丙', '2026/08/12', '12:00', '空環 Lv.1', '已領取', '老師乙',
      '沿用原課程', '待處理', 'leave-withdraw-stale', 'calendar-c', 'class-ring-1',
      '空環 Lv.1', '', '沿用原課程', '待核對', '', '', '', '空環',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  backend.requestClaimWithdrawal_(teacherBSession, 'leave-withdraw-stale', '臨時受傷');
  backend.resolveChangeRequest_(adminSession, 'leave-withdraw-stale', 'approve', '等待 OB 回復');
  const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
  const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());

  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{ substituteId: 'leave-withdraw-stale', changeNote: '' }]),
    /OB.*回復|回復.*OB|尚待管理員/
  );

  assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore);
  assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore);
  assert.equal(leaveSheet.values[1][18], '退出後待回復 OB');
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

function createSpecialGroupReconciliationRows(groupId = 'special-group-a') {
  return [
    ['時間', '老師乙', '2026/08/12', '13:30', 'B－空環 Lv.2', '已領取', '老師甲', '', '待處理', 'leave-special-1', 'group-calendar-1', '', '卡拉特別課', '', '調整為特別課', '待核對', '', '', '', '地板課程', '', groupId, '使用連續時段', 180, '16:30'],
    ['時間', '老師丙', '2026/08/12', '15:00', 'B－空環 Lv.1', '已領取', '老師甲', '', '待處理', 'leave-special-2', 'group-calendar-2', '', '卡拉特別課', '', '調整為特別課', '待核對', '', '', '', '地板課程', '', groupId, '使用連續時段', 180, '16:30'],
    ['時間', '老師乙', '2026/08/12', '16:30', 'B－空環 Lv.0', '已領取', '老師甲', '', '待處理', 'leave-special-3', 'group-calendar-3', '', '卡拉特別課', '', '調整為特別課', '待核對', '', '', '', '地板課程', '', groupId, '使用連續時段', 180, '16:30'],
  ];
}

test('special-course group reconciliation accepts one surviving OB event for every occupied slot', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [[
      '2026/08/12', '13:30', '卡拉特別課', '老師甲',
      'group-calendar-1', 'class-special', 'teacher-a', '是', '',
    ]],
    leaveRows: createSpecialGroupReconciliationRows(),
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 3, matched: 3, exceptions: 0 });
  leaveSheet.values.slice(1).forEach((row) => {
    assert.equal(row[8], '已完成');
    assert.equal(row[15], '已核對');
    assert.equal(row[17], '');
  });
});

test('special-course group reconciliation accepts OB display formatting around the same main title', () => {
  const leaveRows = createSpecialGroupReconciliationRows('special-group-ob-format');
  leaveRows.forEach((row) => {
    row[12] = '後彎主題十字墊瑜伽&頌缽充電';
    row[23] = 150;
  });
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [[
      '2026/08/12', '14:00', 'B－後彎主題十字墊瑜伽＆頌缽充電特別課 (150min)', '老師甲',
      'group-calendar-1', 'class-special', 'teacher-a', '是', '',
    ]],
    leaveRows,
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 3, matched: 3, exceptions: 0 });
  leaveSheet.values.slice(1).forEach((row) => {
    assert.equal(row[8], '已完成');
    assert.equal(row[15], '已核對');
    assert.equal(row[17], '');
  });
});

test('special-course group reconciliation still rejects a different main title after display normalization', () => {
  const leaveRows = createSpecialGroupReconciliationRows('special-group-wrong-title');
  leaveRows.forEach((row) => {
    row[12] = '後彎主題十字墊瑜伽&頌缽充電';
    row[23] = 150;
  });
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [[
      '2026/08/12', '14:00', 'B－椅子瑜伽特別課 (150min)', '老師甲',
      'group-calendar-1', 'class-special', 'teacher-a', '是', '',
    ]],
    leaveRows,
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 3, matched: 0, exceptions: 3 });
  leaveSheet.values.slice(1).forEach((row) => {
    assert.equal(row[15], '核對異常');
    assert.match(row[17], /課程不一致/);
  });
});

test('special-course group reconciliation rejects a group with no surviving OB event', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [],
    leaveRows: createSpecialGroupReconciliationRows('special-group-missing'),
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 3, matched: 0, exceptions: 3 });
  leaveSheet.values.slice(1).forEach((row) => {
    assert.equal(row[15], '核對異常');
    assert.match(row[17], /找不到特別課群組的 OB 課程/);
  });
});

test('special-course group reconciliation rejects multiple surviving OB events', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [
      ['2026/08/12', '13:30', '卡拉特別課', '老師甲', 'group-calendar-1', 'class-special', 'teacher-a', '是', ''],
      ['2026/08/12', '15:00', '卡拉特別課', '老師甲', 'group-calendar-2', 'class-special', 'teacher-a', '是', ''],
    ],
    leaveRows: createSpecialGroupReconciliationRows('special-group-duplicate'),
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 3, matched: 0, exceptions: 3 });
  leaveSheet.values.slice(1).forEach((row) => {
    assert.equal(row[15], '核對異常');
    assert.match(row[17], /同一特別課群組找到多堂 OB 課程/);
  });
});

test('reconcile ignores already verified history after it leaves the current OB snapshot', () => {
  const verifiedRow = [
    '時間', '老師甲', '2026/06/01', '09:00', '空環 Lv.1', '已領取', '老師乙', '', '已完成',
    'leave-history', 'calendar-history', 'class-ring-1', '空環 Lv.1', '', '沿用原課程',
    '已核對', '2026-06-01 10:00:00', '', '', '空環', '',
  ];
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [],
    leaveRows: [verifiedRow],
  });
  const before = JSON.stringify(leaveSheet.values[1]);

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 0, matched: 0, exceptions: 0 });
  assert.equal(JSON.stringify(leaveSheet.values[1]), before);
});

test('reconcile and dashboard exceptions only include next-month leave records', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [],
    leaveRows: [
      [
        '時間', '老師甲', '2026/07/10', '09:00', '空環 Lv.1', '已領取', '老師乙', '', '待處理',
        'leave-old-exception', 'calendar-old', 'class-ring-1', '空環 Lv.1', '', '沿用原課程',
        '核對異常', '舊核對時間', '舊月份異常', '', '空環', '',
      ],
      [
        '時間', '老師甲', '2026/08/10', '09:00', '空環 Lv.1', '已領取', '老師乙', '', '待處理',
        'leave-next-exception', 'calendar-next', 'class-ring-1', '空環 Lv.1', '', '沿用原課程',
        '核對異常', '', '', '', '空環', '',
      ],
    ],
  });

  const result = backend.reconcileObChanges_(adminSession);
  const dashboard = backend.getAdminDashboard_(adminSession);
  const oldRow = leaveSheet.values.find((row) => row[9] === 'leave-old-exception');

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 0, exceptions: 1 });
  assert.equal(oldRow[16], '舊核對時間');
  assert.equal(oldRow[17], '舊月份異常');
  assert.deepEqual(
    JSON.parse(JSON.stringify(dashboard.exceptions.map((item) => item.substituteId))),
    ['leave-next-exception']
  );
});

test('reconciliation rolls back every checked row when its audit batch fails', () => {
  const { backend, leaveSheet, auditSheet, adminSession } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '09:00', '空環 Lv.1', '老師乙', 'calendar-match-a', 'class-ring-1', 'teacher-b', '是', ''],
      ['2026/08/11', '10:00', '空環 Lv.1', '老師乙', 'calendar-match-b', 'class-ring-1', 'teacher-b', '是', ''],
    ],
    leaveRows: [
      ['時間', '老師甲', '2026/08/10', '09:00', '空環 Lv.1', '已領取', '老師乙', '', '', 'leave-match-a', 'calendar-match-a', 'class-ring-1', '空環 Lv.1', '', '沿用原課程', '待核對'],
      ['時間', '老師甲', '2026/08/11', '10:00', '空環 Lv.1', '已領取', '老師乙', '', '', 'leave-match-b', 'calendar-match-b', 'class-ring-1', '空環 Lv.1', '', '沿用原課程', '待核對'],
    ],
  });
  const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
  const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());
  injectSetValuesFailureOnce(
    auditSheet,
    ({ row }) => row > 1,
    'injected reconciliation audit failure'
  );

  assert.throws(
    () => backend.reconcileObChanges_(adminSession),
    /injected reconciliation audit failure/
  );
  assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore);
  assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore);
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

test('reclaim preserves a verified replacement Calendar ID for later reconciliation', () => {
  const { backend, leaveSheet, teacherBSession } = createInvitationBackend({
    courseRows: [[
      '2026/08/15', '13:00', '空環入門', '老師乙', 'calendar-new', 'class-new', 'teacher-b', '是', '',
    ]],
    leaveRows: [[
      '時間', '老師甲', '2026/08/15', '13:00', '空環入門', '確認中', '', '', '',
      'leave-reopened', 'calendar-old', '', '', '', '', '', '', '', '', '空環', 'calendar-new',
    ]],
    invitationRows: [['invite-b', '老師乙', '時間', '', '開放中', '']],
  });

  backend.claimSubstitute_(teacherBSession, [{
    substituteId: 'leave-reopened',
    handlingType: 'original',
    actualCourseName: '空環入門',
    category: '空環',
    difficulty: '',
    note: '',
  }]);

  assert.equal(leaveSheet.values[1][10], 'calendar-old');
  assert.equal(leaveSheet.values[1][20], 'calendar-new');
});

test('legacy manual-review leave stays unavailable until admin links its original OB course', () => {
  const { backend, leaveSheet, auditSheet, adminSession, teacherBSession } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師甲', '2026/08/01', '09:00', '空環 Lv.1', '確認中', '', '', '',
      'leave-manual', '', '', '', '', '', '待人工核對', '', '找不到完全相同的 OB 課程', '', '', '',
    ]],
    invitationRows: [['invite-b', '老師乙', '時間', '', '開放中', '']],
  });

  assert.deepEqual(JSON.parse(JSON.stringify(backend.getAvailableSubstitutes_(teacherBSession))), []);
  assert.equal(backend.getAdminDashboard_(adminSession).exceptions[0].substituteId, 'leave-manual');
  const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
  const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());
  assert.throws(
    () => backend.claimSubstitute_(teacherBSession, [{ substituteId: 'leave-manual', changeNote: '' }]),
    /OB Calendar ID|待人工核對|尚待管理員/
  );
  assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore);
  assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore);

  backend.linkReplacementCalendarItem_(adminSession, 'leave-manual', 'calendar-a');

  assert.equal(leaveSheet.values[1][10], 'calendar-a');
  assert.equal(leaveSheet.values[1][15] || '', '');
  assert.equal(backend.getAvailableSubstitutes_(teacherBSession)[0]['代課編號'], 'leave-manual');
});

test('claim rejects missing Calendar IDs and every unresolved verification state', () => {
  const cases = [
    { name: 'missing Calendar ID', calendarId: '', verification: '', expected: /OB Calendar ID/ },
    { name: 'manual review', calendarId: 'calendar-b', verification: '待人工核對', expected: /待人工核對|尚待管理員/ },
    { name: 'verification exception', calendarId: 'calendar-b', verification: '核對異常', expected: /核對異常|尚待管理員/ },
    { name: 'pending verification', calendarId: 'calendar-b', verification: '待核對', expected: /待核對|尚待管理員/ },
    { name: 'pending restore', calendarId: 'calendar-b', verification: '待回復 OB', expected: /待回復|尚待管理員/ },
  ];

  cases.forEach((item, index) => {
    const substituteId = `leave-unresolved-${index}`;
    const { backend, leaveSheet, auditSheet, teacherASession } = createInvitationBackend({
      leaveRows: [[
        '時間', '老師乙', '2026/08/10', '10:00', '空環 Lv.1', '確認中', '', '', '',
        substituteId, item.calendarId, '', '', '', '', item.verification, '', '', '', '', '',
      ]],
      invitationRows: [['invite-a', '老師甲', '時間', '', '開放中', '']],
    });
    const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
    const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());

    assert.throws(
      () => backend.claimSubstitute_(teacherASession, [{ substituteId, changeNote: '' }]),
      item.expected,
      item.name
    );
    assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore, item.name);
    assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore, item.name);
  });
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

test('admin dashboard keeps cancelled leaves in cancellation history instead of completed', () => {
  const { backend, adminSession } = createInvitationBackend({
    leaveRows: [[
      '2026-08-10 00:25:41', '嗨底 Heidi', '2026/09/07', '20:00', 'D－空瑜 Lv.0',
      '已取消', '', '', '', 'leave-cancelled', 'calendar-cancelled', '', '', '', '', '', '', '',
      '已自行取消', '', '',
    ]],
    nextMonth: '2026-09',
  });

  const dashboard = backend.getAdminDashboard_(adminSession);

  assert.deepEqual(dashboard.changeRequests.map((item) => item.substituteId), ['leave-cancelled']);
  assert.deepEqual(dashboard.completed, []);
});

test('VVIP structure creates isolated sheets idempotently without changing CourseList', () => {
  const courseSheet = createSheetFixture('CourseList', [EXPECTED_COURSE_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([courseSheet]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);

  backend.ensureVvipStructure_();
  backend.ensureVvipStructure_();

  assert.deepEqual(
    spreadsheet.sheets.map((sheet) => sheet.getName()).sort(),
    ['CourseList', 'VVIP名單', 'VVIP選課紀錄', 'VVIP選課設定'].sort()
  );
  assert.deepEqual(spreadsheet.getSheetByName('VVIP選課紀錄').values[0], EXPECTED_VVIP_SELECTION_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('VVIP選課設定').values[0], EXPECTED_VVIP_SETTINGS_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('VVIP名單').values[0], EXPECTED_VVIP_MEMBER_HEADERS);
  assert.deepEqual(courseSheet.values[0], EXPECTED_COURSE_HEADERS);
});

test('VVIP always targets next month and treats stale open settings as closed', () => {
  const { backend } = createVvipBackend();

  assert.equal(backend.getVvipActiveMonth_({ activeMonth: '2026-08' }), '2026-09');
  assert.equal(backend.isVvipSelectionOpen_({ activeMonth: '2026-08', isOpen: '是' }), false);
  assert.equal(backend.isVvipSelectionOpen_({ activeMonth: '2026-09', isOpen: '是' }), true);
});

test('VVIP administrator maintains unique active OB names and private Email mappings', () => {
  const { backend, adminSession, memberSheet } = createVvipBackend();

  const saved = backend.saveVvipMember_(adminSession, {
    name: '會員二', email: 'MEMBER2@EXAMPLE.COM', active: true, note: '續會',
  });
  assert.equal(saved.name, '會員二');
  assert.equal(memberSheet.values[3][2], 'member2@example.com');
  assert.throws(
    () => backend.saveVvipMember_(adminSession, {
      name: '會員一', email: 'duplicate@example.com', active: true,
    }),
    /OB 名稱.*重複/
  );
  backend.setVvipMemberActive_(adminSession, saved.id, false);
  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.getPublicVvipMembers_())),
    [{ id: 'vvip-member-1', name: '會員一' }]
  );
});

test('VVIP public selection resolves active whitelist members without exposing Email', () => {
  const { backend, selectionSheet } = createVvipBackend();

  assert.deepEqual(JSON.parse(JSON.stringify(backend.getPublicVvipMembers_())), [
    { id: 'vvip-member-1', name: '會員一' },
  ]);
  assert.doesNotMatch(JSON.stringify(backend.getPublicVvipMembers_()), /@example\.com/);
  const first = backend.submitVvipSelection_('vvip-member-1', ['vvip-cal-1', 'vvip-cal-2']);
  const second = backend.submitVvipSelection_('vvip-member-1', ['vvip-cal-2', 'vvip-cal-3']);

  assert.equal(first.count, 2);
  assert.equal(first.memberName, '會員一');
  assert.equal(second.count, 3);
  assert.deepEqual(second.selections.map((item) => item.calendarId), ['vvip-cal-1', 'vvip-cal-2', 'vvip-cal-3']);
  assert.equal(selectionSheet.values.length, 4);
  assert.equal(selectionSheet.values[1][1], 'vvip@example.com');
  assert.equal(selectionSheet.values[1][13], 'vvip-member-1');
  assert.equal(selectionSheet.values[1][14], '會員一');
  assert.equal(selectionSheet.values[3][8], '待人工確認');
});

test('VVIP selection rejects an over-limit batch without partial writes', () => {
  const { backend, selectionSheet } = createVvipBackend();
  backend.submitVvipSelection_('vvip-member-1', ['vvip-cal-1', 'vvip-cal-2', 'vvip-cal-3']);
  const before = JSON.stringify(selectionSheet.getDataRange().getValues());

  assert.throws(
    () => backend.submitVvipSelection_('vvip-member-1', ['vvip-cal-4', 'vvip-cal-5']),
    /最多.*4 堂|上限/
  );
  assert.equal(JSON.stringify(selectionSheet.getDataRange().getValues()), before);
});

test('VVIP public POST rejects closed periods, inactive members, missing IDs, and stale courses', () => {
  const { backend, selectionSheet, courseSheet } = createVvipBackend({ open: false });
  assert.throws(() => backend.getVvipSelection_('vvip-member-1'), /尚未開放|截止/);
  assert.throws(() => backend.submitVvipSelection_('vvip-member-2', ['vvip-cal-1']), /未啟用|名單/);

  courseSheet.values[1][4] = '';
  assert.throws(() => backend.setVvipSelectionOpen_({ teacherName: '管理員甲', role: '管理員' }, true), /Calendar ID/);
  assert.equal(selectionSheet.values.length, 1);
});

test('VVIP public routes use POST without a session and never accept Email in GET', () => {
  const { backend } = createVvipBackend();
  backend.console.error = () => {};
  const response = JSON.parse(backend.doPost({ parameter: {
    action: 'getVvipSelection', vvipId: 'vvip-member-1',
  } }).text);

  assert.equal(response.status, 'success');
  assert.equal(response.data.month, '2026-09');
  const getResponse = JSON.parse(backend.doGet({ parameter: {
    action: 'getVvipSelection', vvipId: 'vvip-member-1',
  } }).text);
  assert.equal(getResponse.status, 'error');
});

test('VVIP admin opens, confirms, cancels, groups courses, and exports CSV safely', () => {
  const { backend, adminSession, teacherSession, settingsSheet, auditSheet } = createVvipBackend({ open: false });
  assert.throws(() => backend.setVvipSelectionOpen_(teacherSession, true), /管理權限/);
  backend.setVvipSelectionOpen_(adminSession, true);
  backend.submitVvipSelection_('vvip-member-1', ['vvip-cal-1', 'vvip-cal-2']);
  const confirmation = backend.confirmVvipEmail_(adminSession, 'vvip@example.com');
  assert.equal(confirmation.confirmed, 2);
  const cancellation = backend.cancelVvipSelection_(adminSession, 'vvip@example.com', 'vvip-cal-2', '會員通知調整');
  assert.equal(cancellation.cancelled, 1);

  const dashboard = backend.getVvipAdminDashboard_(adminSession, 'vvip@example.com');
  assert.equal(dashboard.metrics.activeSelections, 1);
  assert.equal(dashboard.members[0].status, '已確認');
  assert.equal(dashboard.courseView[0].calendarId, 'vvip-cal-1');
  assert.equal(backend.csvSafeCell_('=danger'), "'=danger");
  assert.equal(backend.csvSafeCell_('\tdanger'), "'danger");
  assert.equal(backend.csvSafeCell_('\rdanger'), "'danger");
  assert.match(backend.exportVvipSelectionsCsv_(adminSession).csv, /vvip@example\.com/);
  assert.ok(settingsSheet.values.some((row) => row[0] === 'openedAt'));
  assert.ok(auditSheet.values.some((row) => row[2] === 'VVIP 取消選課'));
});

test('payroll bonus thresholds use the approved 15000 20000 and 30000 boundaries', () => {
  const backend = loadBackend();
  assert.equal(backend.calculateBonusRate_(14999), 0);
  assert.equal(backend.calculateBonusRate_(15000), 0.03);
  assert.equal(backend.calculateBonusRate_(19999), 0.03);
  assert.equal(backend.calculateBonusRate_(20000), 0.04);
  assert.equal(backend.calculateBonusRate_(29999), 0.04);
  assert.equal(backend.calculateBonusRate_(30000), 0.05);
});

test('payroll special courses pay sixty percent or split Sherry and one partner six to four', () => {
  const backend = loadBackend();
  const settings = [];
  const solo = backend.calculatePayrollLinesForCourse_({
    calendarId: 'special-solo',
    courseName: '空環 Flare 特別課',
    instructors: [{ name: 'Liz 🌰' }],
    attendanceCount: 8,
    courseIncome: 7430,
  }, settings);
  assert.deepEqual(JSON.parse(JSON.stringify(solo)), [{
    teacherName: 'Liz 🌰', amount: 4458, ruleType: '特別課60%', ruleDetail: '課程收入 7430 × 60%',
  }]);

  const collaboration = backend.calculatePayrollLinesForCourse_({
    calendarId: 'special-duo',
    courseName: '雙人合作特別課',
    instructors: [{ name: '合作老師' }, { name: 'Sherry❤雪莉' }],
    attendanceCount: 6,
    courseIncome: 10001,
  }, settings);
  assert.deepEqual(JSON.parse(JSON.stringify(collaboration)), [
    { teacherName: 'Sherry❤雪莉', amount: 6001, ruleType: '雪莉合作60%', ruleDetail: '課程收入 10001－合作老師 4000' },
    { teacherName: '合作老師', amount: 4000, ruleType: '合作老師40%', ruleDetail: '課程收入 10001 × 40%' },
  ]);
  assert.equal(collaboration.reduce((total, line) => total + line.amount, 0), 10001);
});

test('payroll general courses prefer teacher keyword rates then exact attendance tiers', () => {
  const backend = loadBackend();
  const settings = [
    { teacherName: '妙妙 簡', courseKeyword: '綢吊', billingType: '標準時薪', threshold: 0, amount: 1200 },
    { teacherName: '預設值', courseKeyword: '', billingType: '人數階梯', threshold: 3, amount: 800 },
    { teacherName: '預設值', courseKeyword: '', billingType: '人數階梯', threshold: 4, amount: 900 },
  ];
  const override = backend.calculatePayrollLinesForCourse_({
    calendarId: 'course-override', courseName: 'A－綢吊 Lv.1', instructors: [{ name: '妙妙 簡' }],
    attendanceCount: 4, courseIncome: 2400,
  }, settings);
  const tier = backend.calculatePayrollLinesForCourse_({
    calendarId: 'course-tier', courseName: 'A－空環 Lv.1', instructors: [{ name: '老師甲' }],
    attendanceCount: 4, courseIncome: 2400,
  }, settings);
  assert.equal(override[0].amount, 1200);
  assert.equal(tier[0].amount, 900);
  assert.throws(() => backend.calculatePayrollLinesForCourse_({
    calendarId: 'course-unknown', courseName: 'A－空環 Lv.1', instructors: [{ name: '老師甲' }],
    attendanceCount: 1, courseIncome: 500,
  }, settings), /找不到.*薪項|人數階梯/);
});

test('payroll summary includes special lines in bonus subtotal before fixed additions and deductions', () => {
  const backend = loadBackend();
  const summary = backend.calculatePayrollSummary_('Tako', [
    { teacherName: 'Tako', amount: 20000 },
    { teacherName: 'Tako', amount: 15763 },
  ], [
    { teacherName: 'Tako', courseKeyword: '店長固定底薪', billingType: '固定加給', threshold: 0, amount: 32000 },
    { teacherName: 'Tako', courseKeyword: '勞健保扣除額', billingType: '固定扣項', threshold: 0, amount: 1139 },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(summary)), {
    teacherName: 'Tako', subtotal: 35763, bonusRate: 0.05, bonusAmount: 1788,
    fixedAdjustment: 30861, totalSalary: 68412,
  });
});

test('payroll structure creates append-only operational sheets idempotently', () => {
  const spreadsheet = createSpreadsheetFixture([]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);

  backend.ensurePayrollStructureUnlocked_(spreadsheet);
  backend.ensurePayrollStructureUnlocked_(spreadsheet);

  assert.deepEqual(spreadsheet.getSheetByName('薪項設定').values[0], EXPECTED_PAYROLL_RULE_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('薪資來源資料').values[0], EXPECTED_PAYROLL_SOURCE_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('薪資同步快照').values[0], EXPECTED_PAYROLL_SNAPSHOT_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('薪資明細').values[0], EXPECTED_PAYROLL_LINE_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('薪資結算').values[0], EXPECTED_PAYROLL_SUMMARY_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('薪資異議').values[0], EXPECTED_PAYROLL_DISPUTE_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('薪資付款設定').values[0], EXPECTED_PAYROLL_PAYMENT_HEADERS);
  assert.equal(spreadsheet.sheets.filter((sheet) => sheet.name === '薪資明細').length, 1);
});

test('payroll draft writes complete summary rows after append-only admin columns', () => {
  const snapshot = createSheetFixture('薪資同步快照', [EXPECTED_PAYROLL_SNAPSHOT_HEADERS]);
  const lines = createSheetFixture('薪資明細', [EXPECTED_PAYROLL_LINE_HEADERS]);
  const summaries = createSheetFixture('薪資結算', [EXPECTED_PAYROLL_SUMMARY_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([snapshot, lines, summaries]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);

  backend.writePayrollDraftUnlocked_(spreadsheet, 'version-1', 'now', [], {
    month: '2026-08', errors: [], lines: [], summaries: [{
      teacherName: '老師甲', subtotal: 900, bonusRate: 0, bonusAmount: 0,
      fixedAdjustment: 0, totalSalary: 900, profit: 1200,
    }],
  });

  assert.equal(summaries.values[1].length, EXPECTED_PAYROLL_SUMMARY_HEADERS.length);
  assert.deepEqual(summaries.values[1].slice(12), [0, '', '', '']);
});

test('payroll draft blocks missing special-course income and keeps complete instructor lists', () => {
  const backend = loadBackend();
  const rules = [
    { teacherName: '預設值', billingType: '人數階梯', threshold: 4, amount: 900 },
  ];
  const normalized = backend.normalizePayrollCalendarItem_({
    id: 987,
    class: { id: 42, nameZhHant: 'A－雙人合作特別課' },
    classTime: '2026-08-20T09:30:00Z',
    size: 10,
    customersAttended: 4,
    instructors: [
      { id: 7, firstName: 'Sherry❤雪莉' },
      { id: 8, firstName: '合作老師' },
    ],
  });

  assert.deepEqual(JSON.parse(JSON.stringify(normalized.instructors)), [
    { id: '7', name: 'Sherry❤雪莉', isSubstitute: false },
    { id: '8', name: '合作老師', isSubstitute: false },
  ]);
  const blocked = backend.buildPayrollDraft_('2026-08', [normalized], rules);
  assert.equal(blocked.errors.length, 1);
  assert.match(blocked.errors[0].message, /課程收入/);
  assert.equal(blocked.lines.length, 0);

  normalized.courseIncome = 10001;
  normalized.profit = 4200;
  const ready = backend.buildPayrollDraft_('2026-08', [normalized], rules);
  assert.equal(ready.errors.length, 0);
  assert.equal(ready.lines.length, 2);
  assert.equal(ready.summaries.length, 2);
});

test('payroll publish is capability-scoped and teachers can only view confirm or dispute their own salary', () => {
  const lines = createSheetFixture('薪資明細', [
    EXPECTED_PAYROLL_LINE_HEADERS,
    ['2026-08', 'cal-1:老師甲', 'version-1', 'cal-1', '老師甲', '2026/08/01', '10:00', '空環', '人數階梯', 4, '', '人數階梯', '4 人', 900, 0, '', '草稿', 'now'],
    ['2026-08', 'cal-2:老師乙', 'version-1', 'cal-2', '老師乙', '2026/08/02', '11:00', '舞綢', '人數階梯', 5, '', '人數階梯', '5 人', 1000, 0, '', '草稿', 'now'],
  ]);
  const summaries = createSheetFixture('薪資結算', [
    EXPECTED_PAYROLL_SUMMARY_HEADERS,
    ['2026-08', '老師甲', 900, 0, 0, 0, 900, 1200, 'version-1', '草稿', '', 'now'],
    ['2026-08', '老師乙', 1000, 0, 0, 0, 1000, 1300, 'version-1', '草稿', '', 'now'],
  ]);
  const disputes = createSheetFixture('薪資異議', [EXPECTED_PAYROLL_DISPUTE_HEADERS]);
  const audit = createSheetFixture('操作紀錄', [['操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因']]);
  const spreadsheet = createSpreadsheetFixture([lines, summaries, disputes, audit]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);
  const ivy = { teacherName: 'IVY', role: '管理員', managementCapabilities: ['payroll_admin'] };
  const tako = { teacherName: 'Tako', role: '管理員', managementCapabilities: ['course_admin'] };
  const teacherA = { teacherName: '老師甲', role: '老師', managementCapabilities: [] };

  assert.throws(() => backend.publishPayroll_(tako, '2026-08', 'version-1'), /薪資管理權限/);
  backend.publishPayroll_(ivy, '2026-08', 'version-1');
  const mine = backend.getMyPayroll_(teacherA, '2026-08');
  assert.equal(mine.summary.teacherName, '老師甲');
  assert.equal(mine.lines.length, 1);
  assert.doesNotMatch(JSON.stringify(mine), /老師乙/);

  backend.confirmPayroll_(teacherA, '2026-08', 'version-1');
  assert.equal(summaries.values[1][9], '已確認');
  backend.submitPayrollDispute_(teacherA, {
    month: '2026-08', version: 'version-1', lineId: 'cal-1:老師甲', message: '堂數需要確認',
  });
  assert.equal(summaries.values[1][9], '有異議');
  assert.equal(disputes.values[1][2], '老師甲');
  backend.resolvePayrollDispute_(ivy, { disputeId: disputes.values[1][0], reply: '已核對堂數正確' });
  assert.equal(summaries.values[1][9], '待確認');
  assert.equal(disputes.values[1][5], '已回覆');
});

test('payroll manager adjustments require teacher reconfirmation and finalization updates Sherry bank format', () => {
  const lines = createSheetFixture('薪資明細', [
    EXPECTED_PAYROLL_LINE_HEADERS,
    ['2026-08', 'cal-1:老師甲', 'version-1', 'cal-1', '老師甲', '2026/08/01', '10:00', '空環', '人數階梯', 4, '', '人數階梯', '4 人', 900, 0, '', '待確認', 'now'],
    ['2026-08', 'cal-2:老師乙', 'version-1', 'cal-2', '老師乙', '2026/08/02', '11:00', '舞綢', '人數階梯', 5, '', '人數階梯', '5 人', 1000, 0, '', '待確認', 'now'],
  ]);
  const summaries = createSheetFixture('薪資結算', [
    EXPECTED_PAYROLL_SUMMARY_HEADERS,
    ['2026-08', '老師甲', 900, 0, 0, 0, 900, 1200, 'version-1', '已確認', 'teacher-time', 'now', 0, '', '', ''],
    ['2026-08', '老師乙', 1000, 0, 0, 0, 1000, 1300, 'version-1', '有異議', '', 'now', 0, '', '', ''],
  ]);
  const disputes = createSheetFixture('薪資異議', [
    EXPECTED_PAYROLL_DISPUTE_HEADERS,
    ['dispute-1', '2026-08', '老師乙', 'cal-2:老師乙', '金額不符', '待處理', '', 'now', '', ''],
  ]);
  const audit = createSheetFixture('操作紀錄', [['操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因']]);
  const rules = createSheetFixture('薪項設定', [EXPECTED_PAYROLL_RULE_HEADERS, ['預設值', '', '人數階梯', 4, 900]]);
  const source = createSheetFixture('薪資來源資料', [EXPECTED_PAYROLL_SOURCE_HEADERS]);
  const snapshot = createSheetFixture('薪資同步快照', [EXPECTED_PAYROLL_SNAPSHOT_HEADERS]);
  const payments = createSheetFixture('薪資付款設定', [EXPECTED_PAYROLL_PAYMENT_HEADERS]);
  const sherryFormat = createSheetFixture('給雪莉的格式', [
    ['中國信託銀行', '金額', '備註'],
    ['老師甲', '', ''],
    ['老師乙', '', ''],
    ['', '', ''],
    ['台新銀行', '金額', '備註'],
  ]);
  const spreadsheet = createSpreadsheetFixture([
    lines, summaries, disputes, audit, rules, source, snapshot, payments, sherryFormat,
  ]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);
  const ivy = { teacherName: '冠蓉', role: '管理員', managementCapabilities: ['payroll_admin'] };
  const courseAdmin = { teacherName: 'Tako', role: '管理員', managementCapabilities: ['course_admin'] };
  const teacherA = { teacherName: '老師甲', role: '老師', managementCapabilities: [] };

  assert.throws(
    () => backend.adjustPayrollSummary_(courseAdmin, {
      month: '2026-08', version: 'version-1', teacherName: '老師甲', adjustment: 100, reason: '補發課程',
    }),
    /薪資管理權限/
  );

  const adjusted = backend.adjustPayrollSummary_(ivy, {
    month: '2026-08', version: 'version-1', teacherName: '老師甲', adjustment: 100, reason: '補發課程',
  });
  assert.equal(adjusted.totalSalary, 1000);
  assert.equal(summaries.values[1][5], 0);
  assert.equal(summaries.values[1][6], 1000);
  assert.equal(summaries.values[1][9], '待確認');
  assert.equal(summaries.values[1][10], '');
  assert.equal(summaries.values[1][12], 100);
  assert.equal(summaries.values[1][13], '補發課程');

  backend.confirmPayroll_(teacherA, '2026-08', 'version-1');
  assert.equal(summaries.values[1][9], '已確認');
  const finalized = backend.finalizePayroll_(ivy, '2026-08', 'version-1', []);
  assert.equal(finalized.finalized, 1);
  assert.equal(finalized.skipped, 1);
  assert.equal(summaries.values[1][9], '管理員已確認');
  assert.equal(summaries.values[1][15], '冠蓉');
  assert.equal(summaries.values[2][9], '有異議');
  assert.equal(sherryFormat.values[1][1], 1000);
  assert.equal(sherryFormat.values[2][1], '');
  assert.equal(sherryFormat.values[4][1], '金額');
  assert.throws(
    () => backend.adjustPayrollSummary_(ivy, {
      month: '2026-08', version: 'version-1', teacherName: '老師甲', adjustment: 200, reason: '再次調整',
    }),
    /已完成管理員確認/
  );
});
