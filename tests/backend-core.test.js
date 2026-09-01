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

const EXPECTED_LEAVE_ADJUSTMENT_HEADERS = [
  '調課群組 ID', '調課確認時間', '調課確認者',
];

const EXPECTED_COURSE_ADJUSTMENT_HEADERS = [
  '調課群組 ID', '偵測版本', '日期', '教室配對', '調整前 JSON', '調整後 JSON',
  '建議配對 JSON', '狀態', '判斷原因', '建立時間', '確認時間', '確認者',
  '忽略原因', '通知狀態', '通知錯誤',
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
const EXPECTED_COURSE_CLOSURE_SETTING_HEADERS = [
  '設定鍵', '設定值', '更新時間', '操作者', '備註',
];
const EXPECTED_COURSE_CLOSURE_LOG_HEADERS = [
  '執行時間', '目標日期', '檢核時段', 'OB Calendar ID', '課程', '老師',
  '最新人數', '套用規則', 'onlyEmpty', '結果', '錯誤訊息', '操作者',
];

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
    createAccount(bootstrap, '老師甲', '1234').concat(
      options.teacherACapabilities == null ? '空環' : options.teacherACapabilities
    ),
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
  const vvipSelectionSheet = createSheetFixture('VVIP選課紀錄', [
    EXPECTED_VVIP_SELECTION_HEADERS,
    ...(options.vvipSelectionRows || []),
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
    vvipSelectionSheet,
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
    vvipSelectionSheet,
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
  const leaveSheet = createSheetFixture('請假代課紀錄', [
    EXPECTED_LEAVE_HEADERS.concat(
      EXPECTED_LEAVE_EXTENSION_HEADERS,
      EXPECTED_SPECIAL_COURSE_HEADERS,
      EXPECTED_ORDINARY_DELAY_HEADERS
    ),
    ...(options.leaveRows || []),
  ]);
  const spreadsheet = createSpreadsheetFixture([
    accountSheet, courseSheet, selectionSheet, settingsSheet, memberSheet, auditSheet, leaveSheet,
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
    leaveSheet,
    adminToken: backend.authenticate_('管理員甲', '9999').sessionToken,
    teacherToken: backend.authenticate_('老師甲', '1234').sessionToken,
    adminSession: { teacherName: '管理員甲', role: '管理員' },
    teacherSession: { teacherName: '老師甲', role: '老師' },
  };
}

function enableVvipMonthDateFormatting(backend) {
  backend.Utilities.formatDate = (value, _timezone, pattern) => {
    if (pattern !== 'yyyy-MM-dd') return '';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(value));
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

test('course admin can act as an active teacher while audit preserves the real actor', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend();

  const acting = backend.resolveActingTeacherSession_(adminSession, '老師甲');

  assert.equal(acting.teacherName, '老師甲');
  assert.equal(acting.impersonatedBy, '管理員甲');
  assert.equal(backend.getSessionAuditActor_(acting), '管理員甲（代 老師甲 操作）');
  assert.throws(
    () => backend.resolveActingTeacherSession_(teacherASession, '老師乙'),
    /課程管理權限/
  );
});

test('push configuration exposes only app id and opaque external id', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  services.PropertiesService.getScriptProperties().setProperty('ONESIGNAL_APP_ID', 'public-app-id');
  services.PropertiesService.getScriptProperties().setProperty('ONESIGNAL_REST_API_KEY', 'private-rest-key');
  services.PropertiesService.getScriptProperties().setProperty('PUSH_EXTERNAL_ID_SALT', 'private-salt');
  const { backend } = createAuthBackend([
    createAccount(bootstrap, 'Jina', '1234').concat('地板課程', ''),
  ], services);

  const config = backend.getPushConfiguration_({ teacherName: 'Jina' });

  assert.equal(config.configured, true);
  assert.equal(config.appId, 'public-app-id');
  assert.match(config.externalId, /^teacher_[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(config), /private-rest-key|private-salt|Jina/);
});

test('push configuration disables cleanly when OneSignal properties are absent', () => {
  const bootstrap = loadBackend(createAuthServices());
  const { backend } = createAuthBackend([
    createAccount(bootstrap, 'Jina', '1234').concat('地板課程', ''),
  ]);

  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.getPushConfiguration_({ teacherName: 'Jina' }))),
    { configured: false, appId: '', externalId: '' },
  );
});

test('OneSignal push targets only active course administrators by opaque external id', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const requests = [];
  services.PropertiesService.getScriptProperties().setProperty('ONESIGNAL_APP_ID', 'public-app-id');
  services.PropertiesService.getScriptProperties().setProperty('ONESIGNAL_REST_API_KEY', 'private-rest-key');
  services.PropertiesService.getScriptProperties().setProperty('PUSH_EXTERNAL_ID_SALT', 'private-salt');
  services.UrlFetchApp = {
    fetch(url, options) {
      requests.push({ url, options });
      return {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({ id: 'notification-1', recipients: 2 }),
      };
    },
  };
  const { backend } = createAuthBackend([
    createAccount(bootstrap, '冠蓉', '1234', { role: '管理員' }).concat('', 'course_admin,vvip_admin'),
    createAccount(bootstrap, 'Tako', '2345').concat('空環', 'course_admin'),
    createAccount(bootstrap, 'Sherry❤雪莉', '3456').concat('舞綢', ''),
    createAccount(bootstrap, '停用管理員', '4567', { active: '否' }).concat('', 'course_admin'),
  ], services);

  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.getActiveCourseAdminNames_())),
    ['冠蓉', 'Tako'],
  );
  const result = backend.sendPushNotificationSafely_(
    backend.getActiveCourseAdminNames_(),
    {
      eventKey: 'closure-20260831-2230',
      heading: '22:30 關課完成',
      content: '已取消 2 堂。',
      url: 'https://sherryaerial-web.github.io/sub.html/?view=admin&tab=closureManagement',
    },
  );

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    attempted: true, accepted: true, delivered: 2, messageId: 'notification-1', error: '',
  });
  assert.equal(requests[0].url, 'https://api.onesignal.com/notifications');
  assert.equal(requests[0].options.headers.Authorization, 'Key private-rest-key');
  const payload = JSON.parse(requests[0].options.payload);
  assert.deepEqual(payload.include_aliases.external_id, [
    backend.getPushExternalId_('冠蓉'),
    backend.getPushExternalId_('Tako'),
  ]);
  assert.equal(payload.target_channel, 'push');
  assert.equal(payload.url, 'https://sherryaerial-web.github.io/sub.html/?view=admin&tab=closureManagement');
  assert.doesNotMatch(JSON.stringify(requests[0]), /private-salt|Sherry❤雪莉|停用管理員/);
});

test('OneSignal accepted response without recipient count remains a successful send', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  services.PropertiesService.getScriptProperties().setProperty('ONESIGNAL_APP_ID', 'public-app-id');
  services.PropertiesService.getScriptProperties().setProperty('ONESIGNAL_REST_API_KEY', 'private-rest-key');
  services.PropertiesService.getScriptProperties().setProperty('PUSH_EXTERNAL_ID_SALT', 'private-salt');
  services.UrlFetchApp = {
    fetch() {
      return {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({ id: 'notification-accepted' }),
      };
    },
  };
  const { backend } = createAuthBackend([
    createAccount(bootstrap, 'Jina', '1234').concat('地板課程', ''),
  ], services);

  const result = backend.sendPushNotificationSafely_(['Jina'], {
    heading: '測試通知', content: '測試內容', url: 'https://example.test/',
  });

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    attempted: true,
    accepted: true,
    delivered: null,
    messageId: 'notification-accepted',
    error: '',
  });
});

test('notification schedule windows support delayed five-minute trigger execution without overlap', () => {
  const backend = loadBackend();

  assert.equal(backend.isNotificationScheduleDue_({ day: '31', time: '22:30', enabled: true }, '2026-08-31', '22:34'), true);
  assert.equal(backend.isNotificationScheduleDue_({ day: '31', time: '22:30', enabled: true }, '2026-08-31', '22:35'), false);
  assert.equal(backend.isNotificationScheduleDue_({ day: '31', time: '23:40', enabled: true }, '2026-08-31', '23:44'), true);
  assert.equal(backend.isNotificationScheduleDue_({ day: '31', time: '23:40', enabled: true }, '2026-08-31', '22:34'), false);
  assert.equal(backend.isNotificationScheduleDue_({ day: 'last', time: '22:30', enabled: true }, '2026-08-31', '22:34'), true);
});

function createNotificationBackend() {
  const services = createAuthServices();
  const bootstrap = loadBackend(services);
  const accountSheet = createSheetFixture('登入帳號', [
    EXPECTED_ACCOUNT_HEADERS,
    createAccount(bootstrap, '冠蓉', '1234', { role: '管理員' }).concat('', 'course_admin,vvip_admin'),
    createAccount(bootstrap, 'Tako', '2345').concat('空環', 'course_admin,vvip_admin'),
    createAccount(bootstrap, 'Jina', '3456').concat('地板課程', ''),
    createAccount(bootstrap, '停用老師', '4567', { active: '否' }).concat('空環', ''),
  ]);
  const auditSheet = createSheetFixture('操作紀錄', [[
    '操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因',
  ]]);
  const spreadsheet = createSpreadsheetFixture([accountSheet, auditSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  return {
    backend,
    services,
    auditSheet,
    adminSession: backend.requireSession_(backend.authenticate_('冠蓉', '1234').sessionToken),
  };
}

function createPracticeBackend(options = {}) {
  const courseSheet = createSheetFixture('CourseList', [
    EXPECTED_COURSE_HEADERS,
    ...(options.courseRows || []),
  ]);
  const auditSheet = createSheetFixture('操作紀錄', [[
    '操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因',
  ]]);
  const spreadsheet = createSpreadsheetFixture([courseSheet, auditSheet]);
  const backend = loadBackend({
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  backend.ensurePracticeStructure_();
  return {
    backend,
    spreadsheet,
    courseSheet,
    bookingSheet: spreadsheet.getSheetByName('自主練習場次'),
    seriesSheet: spreadsheet.getSheetByName('自主練習系列'),
    participantSheet: spreadsheet.getSheetByName('自主練習參與者'),
    exceptionSheet: spreadsheet.getSheetByName('自主練習例外'),
    practiceAuditSheet: spreadsheet.getSheetByName('自主練習操作紀錄'),
    teacher(name) { return { teacherName: name, role: '老師', managementCapabilities: [] }; },
  };
}

test('course administrators can manually notify selected active teachers and the send is audited', () => {
  const { backend, auditSheet, adminSession } = createNotificationBackend();
  const deliveries = [];
  backend.sendPushNotificationSafely_ = (names, message) => {
    deliveries.push({ names: Array.from(names), message: { ...message } });
    return { attempted: true, accepted: true, delivered: null, messageId: 'manual-1', error: '' };
  };

  const result = backend.sendManualNotification_(adminSession, {
    heading: '請記得請假',
    content: '九月請假登記今晚截止。',
    audienceMode: 'selected',
    teacherNames: ['Jina', '停用老師'],
  });

  assert.equal(result.accepted, true);
  assert.deepEqual(deliveries[0].names, ['Jina']);
  assert.equal(deliveries[0].message.url, 'https://sherryaerial-web.github.io/sub.html/');
  assert.equal(auditSheet.values.length, 2);
  assert.equal(auditSheet.values[1][1], '冠蓉');
  assert.equal(auditSheet.values[1][2], '推播通知：手動');
  assert.equal(auditSheet.values[1][5], '已送出');
});

test('fixed notification schedules send once in the five-minute window even when closure automation is manual', () => {
  const { backend, adminSession } = createNotificationBackend();
  const deliveries = [];
  backend.sendPushNotificationSafely_ = (names, message) => {
    deliveries.push({ names: Array.from(names), message: { ...message } });
    return { attempted: true, accepted: true, delivered: 2, messageId: 'scheduled-1', error: '' };
  };
  const saved = backend.saveNotificationSchedule_(adminSession, {
    name: '月底請假提醒',
    day: 'last',
    time: '22:30',
    heading: '請假提醒',
    content: '請記得完成下月請假登記。',
    audienceMode: 'admins',
    teacherNames: [],
    enabled: true,
  });

  const first = backend.runScheduledNotifications_('2026-08-31', '22:34');
  const second = backend.runScheduledNotifications_('2026-08-31', '22:34');

  assert.equal(saved.name, '月底請假提醒');
  assert.equal(first.sentCount, 1);
  assert.equal(second.sentCount, 0);
  assert.equal(deliveries.length, 1);
  assert.deepEqual(deliveries[0].names, ['冠蓉', 'Tako']);
});

test('OneSignal failure returns a safe result without throwing or exposing the key', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  services.PropertiesService.getScriptProperties().setProperty('ONESIGNAL_APP_ID', 'public-app-id');
  services.PropertiesService.getScriptProperties().setProperty('ONESIGNAL_REST_API_KEY', 'private-rest-key');
  services.PropertiesService.getScriptProperties().setProperty('PUSH_EXTERNAL_ID_SALT', 'private-salt');
  services.UrlFetchApp = {
    fetch() {
      return {
        getResponseCode: () => 500,
        getContentText: () => JSON.stringify({ errors: ['service unavailable'] }),
      };
    },
  };
  const { backend } = createAuthBackend([
    createAccount(bootstrap, 'Jina', '1234').concat('地板課程', ''),
  ], services);

  const result = backend.sendPushNotificationSafely_(['Jina'], {
    heading: '測試通知', content: '測試內容', url: 'https://example.test/',
  });

  assert.equal(result.attempted, true);
  assert.equal(result.delivered, 0);
  assert.match(result.error, /HTTP 500/);
  assert.doesNotMatch(JSON.stringify(result), /private-rest-key|private-salt/);
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

test('combined claim page data reads shared CourseList and leave rows once', () => {
  const fixture = createInvitationBackend({
    invitationRows: [['invite-a', '老師甲', '時間', '', '開放中', '']],
  });
  const originalCourseRange = fixture.courseSheet.getDataRange.bind(fixture.courseSheet);
  const originalLeaveRange = fixture.leaveSheet.getDataRange.bind(fixture.leaveSheet);
  let courseReads = 0;
  let leaveReads = 0;
  fixture.courseSheet.getDataRange = function() {
    courseReads += 1;
    return originalCourseRange();
  };
  fixture.leaveSheet.getDataRange = function() {
    leaveReads += 1;
    return originalLeaveRange();
  };

  const data = fixture.backend.getClaimPageData_(fixture.teacherASession);
  fixture.backend.getClaimPageData_(fixture.teacherASession);

  assert.ok(Array.isArray(data.items));
  assert.ok(Array.isArray(data.options.capabilities));
  assert.ok(Array.isArray(data.options.classes));
  assert.equal(courseReads, 1);
  assert.equal(leaveReads, 2);
});

test('read-only admin dashboard does not wait for the global write lock', () => {
  const fixture = createInvitationBackend();
  const waitsBeforeRead = fixture.services.__lockState.waits;
  const releasesBeforeRead = fixture.services.__lockState.releases;

  fixture.backend.getAdminDashboard_(fixture.adminSession);

  assert.equal(fixture.services.__lockState.waits, waitsBeforeRead);
  assert.equal(fixture.services.__lockState.releases, releasesBeforeRead);
  assert.equal(fixture.services.__lockState.depth, 0);
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

test('warm personal course reads reuse stable CourseList rows but always reread live leave state', () => {
  const fixture = createInvitationBackend();
  let courseReads = 0;
  let leaveReads = 0;
  const originalCourseGetDataRange = fixture.courseSheet.getDataRange.bind(fixture.courseSheet);
  const originalLeaveGetDataRange = fixture.leaveSheet.getDataRange.bind(fixture.leaveSheet);
  fixture.courseSheet.getDataRange = () => {
    courseReads += 1;
    return originalCourseGetDataRange();
  };
  fixture.leaveSheet.getDataRange = () => {
    leaveReads += 1;
    return originalLeaveGetDataRange();
  };

  fixture.backend.getMyCourses_(fixture.teacherASession);
  fixture.backend.getMyCourses_(fixture.teacherASession);

  assert.equal(courseReads, 1);
  assert.equal(leaveReads, 2);
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

test('teacher leave records default to current plus next month and allow one archived month', () => {
  const { backend } = createLeaveBackend({
    courseRows: [],
    leaveRows: [
      ['stamp', '老師甲', '2026/06/30', '18:30', '六月課', '已取消', '', '', '', 'leave-jun'],
      ['stamp', '老師甲', '2026/07/01', '18:30', '七月課', '已取消', '', '', '', 'leave-jul'],
      ['stamp', '老師甲', '2026/08/31', '18:30', '八月課', '已取消', '', '', '', 'leave-aug'],
      ['stamp', '老師甲', '2026/09/01', '18:30', '九月課', '已取消', '', '', '', 'leave-sep'],
    ],
  });
  backend.getNextMonthKey_ = () => '2026-08';

  assert.deepEqual(
    backend.getMyLeaves_({ teacherName: '老師甲', role: '老師' }).map((row) => row['代課編號']),
    ['leave-aug', 'leave-jul'],
  );
  assert.deepEqual(
    backend.getMyLeaves_({ teacherName: '老師甲', role: '老師' }, '2026-06').map((row) => row['代課編號']),
    ['leave-jun'],
  );
  assert.throws(
    () => backend.getMyLeaves_({ teacherName: '老師甲', role: '老師' }, '2026-6'),
    /月份格式/,
  );
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
      '薪資異議', '薪資付款設定', '請假代課紀錄', '特別課安排',
      '關課設定', '關課紀錄', '自主練習系列', '自主練習場次',
      '自主練習參與者', '自主練習例外', '自主練習操作紀錄'
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
  assert.equal(backend.normalizeOrdinaryDelayMinutes_('-30'), -30);
  assert.equal(backend.normalizeOrdinaryDelayMinutes_('-15'), -15);
  assert.equal(backend.normalizeOrdinaryDelayMinutes_('15'), 15);
  assert.equal(backend.normalizeOrdinaryDelayMinutes_(30), 30);
  assert.throws(
    () => backend.normalizeOrdinaryDelayMinutes_(45),
    /提早 30.*提早 15.*原時段.*延後 15.*延後 30/
  );
});

test('ordinary early start allows a safe gap but rejects the previous-course turnover window', () => {
  const backend = loadBackend();
  const source = ['stamp', '原老師甲', '2026/09/01', '18:45', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'];
  const safeRows = [
    ['2026/09/01', '17:00', 'A－空環 Lv.1', '原老師乙', 'cal-before'],
    ['2026/09/01', '18:45', 'A－空環 Lv.1', '原老師甲', 'cal-a'],
    ['2026/09/01', '20:00', 'A－空環 Lv.2', '原老師丙', 'cal-after'],
  ];

  const safe = backend.buildOrdinaryClaimDelayPlan_(source, -15, [source], safeRows);

  assert.equal(safe.actualStartTime, '18:30');
  assert.equal(safe.endTime, '19:30');
  assert.equal(safe.occupiedSubstituteId, '');
  assert.throws(
    () => backend.buildOrdinaryClaimDelayPlan_(source, -15, [source], [
      ['2026/09/01', '17:30', 'A－空環 Lv.1', '原老師乙', 'cal-before'],
      ['2026/09/01', '18:45', 'A－空環 Lv.1', '原老師甲', 'cal-a'],
    ]),
    /提早時間與上一堂課衝突/
  );

  const thirtyMinutesEarly = backend.buildOrdinaryClaimDelayPlan_(source, -30, [source], [
    ['2026/09/01', '17:00', 'A－空環 Lv.1', '原老師乙', 'cal-before'],
    ['2026/09/01', '18:45', 'A－空環 Lv.1', '原老師甲', 'cal-a'],
  ]);
  assert.equal(thirtyMinutesEarly.actualStartTime, '18:15');
  assert.equal(thirtyMinutesEarly.endTime, '19:15');
});

test('ordinary sixty-minute delay occupies only the conflicting next open leave', () => {
  const backend = loadBackend();
  const leaveRows = [
    ['stamp', '原老師甲', '2026/09/01', '18:30', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'],
    ['stamp', '原老師乙', '2026/09/01', '20:00', 'A－空環 Lv.2', '確認中', '', '', '', 'leave-b', 'cal-b'],
  ];
  const courseRows = [
    ['2026/09/01', '18:30', 'A－空環 Lv.1', '原老師甲', 'cal-a'],
    ['2026/09/01', '20:00', 'A－空環 Lv.2', '原老師乙', 'cal-b'],
    ['2026/09/01', '21:30', 'A－瑜伽', '原老師丙', 'cal-c'],
  ];

  const fifteen = backend.buildOrdinaryClaimDelayPlan_(leaveRows[0], 15, leaveRows, courseRows);
  const thirty = backend.buildOrdinaryClaimDelayPlan_(leaveRows[0], 30, leaveRows, courseRows);

  assert.equal(fifteen.actualStartTime, '18:45');
  assert.equal(fifteen.endTime, '19:45');
  assert.equal(fifteen.occupiedSubstituteId, '');
  assert.equal(thirty.actualStartTime, '19:00');
  assert.equal(thirty.endTime, '20:00');
  assert.equal(thirty.occupiedSubstituteId, 'leave-b');
  assert.equal(thirty.occupiedRowIndex, 1);
});

test('ordinary delay planning consistently uses a verified replacement OB Calendar ID', () => {
  const backend = loadBackend();
  const source = [
    'stamp', '原老師甲', '2026/09/01', '18:30', 'A－空環 Lv.1',
    '確認中', '', '', '', 'leave-a', 'cal-old',
  ];
  while (source.length < 21) source.push('');
  source[20] = 'cal-new';
  const courseRows = [
    ['2026/09/01', '18:30', 'A－空環 Lv.1', '原老師甲', 'cal-new'],
    ['2026/09/01', '20:00', 'A－空環 Lv.2', '原老師乙', 'cal-next'],
  ];

  const result = backend.buildOrdinaryClaimDelayPlan_(source, 15, [source], courseRows);

  assert.equal(result.actualStartTime, '18:45');
});

test('teacher special-course slots consistently use a verified replacement OB Calendar ID', () => {
  const backend = loadBackend();
  backend.getNextMonthKey_ = () => '2026-09';
  const source = [
    'stamp', '原老師甲', '2026/09/01', '18:30', 'A－空環 Lv.1',
    '確認中', '', '', '', 'leave-a', 'cal-old',
  ];
  while (source.length < 21) source.push('');
  source[20] = 'cal-new';

  const slots = backend.buildSpecialCourseSlotsForTeacher_('代課老師乙', [source], [[
    '2026/09/01', '18:30', 'A－空環 Lv.1', '原老師甲', 'cal-new',
  ]]);

  assert.equal(slots.length, 1);
  assert.equal(slots[0].calendarId, 'cal-new');
  assert.equal(slots[0].substituteId, 'leave-a');
});

test('ordinary planner treats 綢吊 as ninety minutes but 舞綢 as sixty minutes', () => {
  const backend = loadBackend();
  const next = ['stamp', '原老師乙', '2026/09/01', '20:00', 'A－空環 Lv.2', '確認中', '', '', '', 'leave-b', 'cal-b'];
  const cases = [
    { course: 'A－綢吊 Lv.1', expected: 'leave-b' },
    { course: 'A－舞綢 Lv.1', expected: '' },
  ];

  cases.forEach(({ course, expected }) => {
    const source = ['stamp', '原老師甲', '2026/09/01', '18:30', course, '確認中', '', '', '', 'leave-a', 'cal-a'];
    const courseRows = [
      ['2026/09/01', '18:30', course, '原老師甲', 'cal-a'],
      ['2026/09/01', '20:00', 'A－空環 Lv.2', '原老師乙', 'cal-b'],
    ];
    assert.equal(
      backend.buildOrdinaryClaimDelayPlan_(source, 0, [source, next], courseRows).occupiedSubstituteId,
      expected
    );
  });
});

test('ordinary planner rejects unavailable or multiple following slots without mutating input', () => {
  const backend = loadBackend();
  const source = ['stamp', '原老師甲', '2026/09/01', '18:30', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'];
  const next = ['stamp', '原老師乙', '2026/09/01', '20:00', 'A－空環 Lv.2', '已領取', '別人', '', '', 'leave-b', 'cal-b'];
  const courseRows = [
    ['2026/09/01', '18:30', 'A－空環 Lv.1', '原老師甲', 'cal-a'],
    ['2026/09/01', '20:00', 'A－空環 Lv.2', '原老師乙', 'cal-b'],
  ];
  const leaveSnapshot = JSON.stringify([source, next]);
  const courseSnapshot = JSON.stringify(courseRows);

  assert.throws(
    () => backend.buildOrdinaryClaimDelayPlan_(source, 30, [source], courseRows),
    /下一堂課衝突/
  );
  assert.throws(
    () => backend.buildOrdinaryClaimDelayPlan_(source, 30, [source, next], courseRows),
    /下一堂課衝突/
  );
  const noCalendar = source.slice();
  noCalendar[10] = '';
  assert.throws(
    () => backend.buildOrdinaryClaimDelayPlan_(noCalendar, 30, [noCalendar], courseRows),
    /Calendar ID 不完整/
  );
  assert.throws(
    () => backend.buildOrdinaryClaimDelayPlan_(source, 30, [source], courseRows.concat([
      ['2026/09/01', '20:10', 'A－瑜伽', '原老師丙', 'cal-c'],
    ])),
    /占用兩堂以上/
  );
  assert.equal(JSON.stringify([source, next]), leaveSnapshot);
  assert.equal(JSON.stringify(courseRows), courseSnapshot);
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
    { id: 607, nameZhHant: 'B－皮拉提斯' },
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
  assert.equal(resolved.actualClassId, '607');
  assert.equal(resolved.actualCourseName, 'B－皮拉提斯');
});

test('recurring claim catalog excludes one-off long special and period courses but keeps recurring 90-minute courses', () => {
  const backend = loadBackend();
  const rows = [
    ['2026/08/01', '10:00', 'A－原始瑜伽', '老師甲', 'cal-yoga-1', 'class-yoga-a'],
    ['2026/08/08', '10:00', 'A－原始瑜伽', '老師甲', 'cal-yoga-2', 'class-yoga-a'],
    ['2026/08/01', '14:00', 'C－空環 Lv.3 技巧訓練期班', '老師甲', 'cal-term-1', 'class-term-c'],
    ['2026/08/08', '14:00', 'C－空環 Lv.3 技巧訓練期班', '老師甲', 'cal-term-2', 'class-term-c'],
    ['2026/08/02', '13:15', 'B－綢吊 Lv.0-2（90分）', '老師乙', 'cal-sling-1', 'class-sling-b'],
    ['2026/08/09', '13:15', 'B－綢吊 Lv.0-2（90分）', '老師乙', 'cal-sling-2', 'class-sling-b'],
    ['2026/08/03', '18:30', 'B－椅子瑜伽（90min）', '老師丙', 'cal-chair', 'class-chair-b'],
    ['2026/08/04', '19:00', 'A－原始瑜伽特別課', '老師丙', 'cal-special', 'class-special-a'],
  ];

  const options = backend.buildRecurringClaimCourseOptions_(rows, ['地板課程', '空環', '綢吊']);

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

test('recurring claim options merge hyphen and tilde spellings of the same difficulty range', () => {
  const backend = loadBackend();
  const rows = [
    ['2026/09/05', '18:30', 'A－舞綢 Lv.1-2', '老師甲', 'calendar-hyphen-1', 'class-hyphen'],
    ['2026/09/12', '18:30', 'A－舞綢 Lv.1-2', '老師甲', 'calendar-hyphen-2', 'class-hyphen'],
    ['2026/09/06', '19:00', 'B－舞綢 Lv.1~2', '老師乙', 'calendar-tilde-1', 'class-tilde'],
    ['2026/09/13', '19:00', 'B－舞綢 Lv.1~2', '老師乙', 'calendar-tilde-2', 'class-tilde'],
  ];

  const options = backend.buildRecurringClaimCourseOptions_(rows, ['舞綢']);

  assert.equal(options.length, 1);
  assert.equal(
    backend.normalizeClaimDifficulty_(options[0].difficulty),
    backend.normalizeClaimDifficulty_('Lv.1~2')
  );
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
    promotionType: 'new-teacher',
  }]);
});

test('calculates an exclusive API date_to one day after the end of next month', () => {
  const backend = loadBackend();
  assert.equal(typeof backend.getSyncDateRange_, 'function');
  const range = backend.getSyncDateRange_(new Date(2026, 7, 3, 12, 0, 0));
  assert.equal(range.dateFrom, '2026-08-03');
  assert.equal(range.dateTo, '2026-10-01');
  assert.equal(range.calendarDateTo, '2026-09-30');
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

test('manual sync fetches one extra day but only writes courses through the target month', () => {
  const { backend, courseSheet, calls, adminToken } = createSyncBackend({
    pages: [[
      {
        id: 93001,
        classTime: '2026-09-30T11:10:00Z',
        class: { id: 301, nameZhHant: '月底最後一天課程' },
        instructors: [{ id: 401, firstName: '月底', lastName: '老師' }],
      },
      {
        id: 100101,
        classTime: '2026-10-01T11:10:00Z',
        class: { id: 302, nameZhHant: '下月第一天課程' },
        instructors: [{ id: 402, firstName: '下月', lastName: '老師' }],
      },
    ]],
  });
  backend.getSyncDateRange_ = () => ({
    dateFrom: '2026-08-03',
    dateTo: '2026-10-01',
    calendarDateTo: '2026-09-30',
  });

  const result = backend.syncCourseListFromApi(adminToken);

  assert.match(calls[0].url, /date_to=2026-10-01/);
  assert.equal(result.count, 1);
  assert.deepEqual(courseSheet.values.slice(1).filter((row) => row[0]).map((row) => row[0]), ['2026/09/30']);
  assert.equal(courseSheet.values.find((row) => row[4] === '100101'), undefined);
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

test('invitation push targets only newly opened teachers and runs after the Sheet lock', () => {
  const { backend, services, adminSession } = createInvitationBackend();
  const pushes = [];
  backend.sendPushNotificationSafely_ = (names, message) => {
    assert.equal(services.__lockState.depth, 0);
    pushes.push({ names: names.slice(), message });
    return { attempted: true, delivered: names.length, error: '' };
  };

  backend.openInvitations_(adminSession, ['老師甲']);
  backend.openInvitations_(adminSession, ['老師甲', '老師乙']);

  assert.deepEqual(JSON.parse(JSON.stringify(pushes.map((item) => item.names))), [['老師甲'], ['老師乙']]);
  assert.match(pushes[0].message.heading, /代課/);
  assert.match(pushes[0].message.url, /view=claim/);
});

test('claim success survives a push failure and notifies only the claiming teacher after unlock', () => {
  const { backend, services, leaveSheet, adminSession, teacherASession } = createInvitationBackend();
  backend.openInvitations_(adminSession, ['老師甲']);
  const pushes = [];
  backend.sendPushNotificationSafely_ = (names, message) => {
    assert.equal(services.__lockState.depth, 0);
    pushes.push({ names: names.slice(), message });
    throw new Error('injected push outage');
  };

  const result = backend.claimSubstitute_(teacherASession, [{ substituteId: 'leave-c', changeNote: '' }]);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { count: 1, occupiedSubstituteIds: [] });
  assert.equal(leaveSheet.values.find((row) => row[9] === 'leave-c')[5], '已領取');
  assert.deepEqual(JSON.parse(JSON.stringify(pushes[0].names)), ['老師甲']);
  assert.match(pushes[0].message.url, /view=mysubs/);
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

test('teacher substitute list only exposes open courses from the target month', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/08/31', '10:00', '空環 Lv.1', '老師乙', 'calendar-aug'],
      ['2026/09/01', '10:00', '空環 Lv.1', '老師乙', 'calendar-sep'],
      ['2026/10/01', '10:00', '空環 Lv.1', '老師乙', 'calendar-oct'],
    ],
    leaveRows: [
      ['時間', '老師乙', '2026/08/31', '10:00', '空環 Lv.1', '確認中', '', '', '', 'leave-aug', 'calendar-aug'],
      ['時間', '老師乙', '2026/09/01', '10:00', '空環 Lv.1', '確認中', '', '', '', 'leave-sep', 'calendar-sep'],
      ['時間', '老師乙', '2026/10/01', '10:00', '空環 Lv.1', '確認中', '', '', '', 'leave-oct', 'calendar-oct'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  assert.deepEqual(
    backend.getAvailableSubstitutes_(teacherASession).map((row) => row['代課編號']),
    ['leave-sep'],
  );
});

test('teacher substitute records default to current plus next month and allow one archived month', () => {
  const ownSource = (date, calendarId) => JSON.stringify([{
    sourceType: 'own', date, time: '11:00', courseName: 'A－原始瑜伽',
    originalTeacher: '老師甲', calendarId,
  }]);
  const { backend } = createInvitationBackend({
    nextMonth: '2026-09',
    leaveRows: [
      ['stamp', '老師乙', '2026/07/30', '10:00', '空環 Lv.1', '已領取', '老師甲', '', '', 'leave-jul', 'calendar-jul'],
      ['stamp', '老師乙', '2026/08/30', '10:00', '空環 Lv.1', '已領取', '老師甲', '', '', 'leave-aug', 'calendar-aug'],
      ['stamp', '老師乙', '2026/09/05', '10:00', '空環 Lv.1', '已領取', '老師甲', '', '', 'leave-sep', 'calendar-sep'],
      ['stamp', '老師乙', '2026/10/05', '10:00', '空環 Lv.1', '已領取', '老師甲', '', '', 'leave-oct', 'calendar-oct'],
    ],
    specialRequestRows: [
      ['stamp', 'special-jul', '老師甲', '2026/07/26', 'A', ownSource('2026/07/26', 'own-jul'), '[]', '11:00', '七月特別課', '', 120, '13:00', '使用連續時段', '', '待處理'],
      ['stamp', 'special-aug', '老師甲', '2026/08/26', 'A', ownSource('2026/08/26', 'own-aug'), '[]', '11:00', '八月特別課', '', 120, '13:00', '使用連續時段', '', '待處理'],
      ['stamp', 'special-sep', '老師甲', '2026/09/26', 'A', ownSource('2026/09/26', 'own-sep'), '[]', '11:00', '九月特別課', '', 120, '13:00', '使用連續時段', '', '待處理'],
      ['stamp', 'special-oct', '老師甲', '2026/10/26', 'A', ownSource('2026/10/26', 'own-oct'), '[]', '11:00', '十月特別課', '', 120, '13:00', '使用連續時段', '', '待處理'],
    ],
  });

  assert.deepEqual(
    backend.getMySubs_('老師甲').map((row) => [row['日期'], row['實際課程名稱']]),
    [
      ['2026/08/26', '八月特別課'],
      ['2026/08/30', ''],
      ['2026/09/05', ''],
      ['2026/09/26', '九月特別課'],
    ],
  );
  assert.deepEqual(
    backend.getMySubs_('老師甲', '2026-07').map((row) => [row['日期'], row['實際課程名稱']]),
    [['2026/07/26', '七月特別課'], ['2026/07/30', '']],
  );
});

test('teacher substitute records sort ordinary and special courses by course start time', () => {
  const ownSource = (date, time, calendarId) => JSON.stringify([{
    sourceType: 'own', date, time, courseName: 'A－原始瑜伽',
    originalTeacher: '老師甲', calendarId,
  }]);
  const adjustedOrdinary = [
    'stamp', '老師乙', '2026/09/05', '20:00', '空環 Lv.1',
    '已領取', '老師甲', '', '', 'leave-adjusted', 'calendar-adjusted',
  ];
  while (adjustedOrdinary.length < 28) adjustedOrdinary.push('');
  adjustedOrdinary[25] = '18:45';
  adjustedOrdinary[26] = -15;
  const { backend } = createInvitationBackend({
    nextMonth: '2026-09',
    leaveRows: [
      ['stamp', '老師乙', '2026/09/20', '18:00', '空環 Lv.1', '已領取', '老師甲', '', '', 'leave-late', 'calendar-late'],
      ['stamp', '老師乙', '2026/09/05', '19:00', '空環 Lv.1', '已領取', '老師甲', '', '', 'leave-early', 'calendar-early'],
      adjustedOrdinary,
    ],
    specialRequestRows: [
      ['stamp', 'special-sep-6', '老師甲', '2026/09/06', 'A', ownSource('2026/09/06', '11:00', 'own-sep-6'), '[]', '11:00', '九月六日特別課', '', 120, '13:00', '使用連續時段', '', '待處理'],
      ['stamp', 'special-sep-5', '老師甲', '2026/09/05', 'A', ownSource('2026/09/05', '18:30', 'own-sep-5'), '[]', '18:30', '九月五日特別課', '', 90, '20:00', '使用後方空堂', '', '待處理'],
    ],
  });

  assert.deepEqual(
    backend.getMySubs_('老師甲').map((row) => row['代課編號'] || row['特別課群組 ID']),
    [
      'special-sep-5',
      'leave-adjusted',
      'leave-early',
      'special-sep-6',
      'leave-late',
    ],
  );
});

test('available substitute list blocks own-course conflicts but allows an exact fifteen-minute gap', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/05', '18:00', 'A－空環 Lv.1', '老師甲', 'calendar-own'],
      ['2026/09/05', '19:00', 'B－空環 Lv.1', '老師乙', 'calendar-close'],
      ['2026/09/05', '19:15', 'C－空環 Lv.1', '老師丙', 'calendar-safe'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/09/05', '19:00', 'B－空環 Lv.1', '確認中', '', '', '', 'leave-close', 'calendar-close'],
      ['stamp', '老師丙', '2026/09/05', '19:15', 'C－空環 Lv.1', '確認中', '', '', '', 'leave-safe', 'calendar-safe'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  assert.deepEqual(
    backend.getAvailableSubstitutes_(teacherASession).map((row) => row['代課編號']),
    ['leave-safe'],
  );
});

test('available substitute list blocks conflicts with an already claimed substitute before OB sync', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/05', '18:15', 'A－舞綢 Lv.3~5', '老師乙', 'calendar-claimed'],
      ['2026/09/05', '19:00', 'B－空環 Lv.2~3', '老師丙', 'calendar-pending'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/09/05', '18:15', 'A－舞綢 Lv.3~5', '已領取', '老師甲', '', '', 'leave-claimed', 'calendar-claimed', '', 'A－香氛瑜伽'],
      ['stamp', '老師丙', '2026/09/05', '19:00', 'B－空環 Lv.2~3', '確認中', '', '', '', 'leave-pending', 'calendar-pending'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  assert.deepEqual(backend.getAvailableSubstitutes_(teacherASession), []);
});

test('OB-missing pending leaves move out of invitations and never reach the teacher claim list', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/05', '19:15', 'C－空環 Lv.1', '老師丙', 'calendar-present'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/09/05', '19:00', 'B－空環 Lv.1', '確認中', '', '', '', 'leave-missing', 'calendar-missing'],
      ['stamp', '老師丙', '2026/09/05', '19:15', 'C－空環 Lv.1', '確認中', '', '', '', 'leave-present', 'calendar-present'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const dashboard = backend.getAdminDashboard_(adminSession);

  assert.deepEqual(dashboard.pendingInvitations.map((item) => item.substituteId), ['leave-present']);
  assert.deepEqual(dashboard.missingObCancellations.map((item) => item.substituteId), ['leave-missing']);
  assert.deepEqual(
    backend.getAvailableSubstitutes_(teacherASession).map((item) => item['代課編號']),
    ['leave-present'],
  );
});

test('unlinked legacy leaves never enter the OB-cancelled bulk-close queue', () => {
  const { backend, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/05', '19:15', 'C－空環 Lv.1', '老師丙', 'calendar-present'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/09/05', '19:00', 'B－空環 Lv.1', '確認中', '', '', '', 'leave-unlinked', ''],
    ],
  });

  const dashboard = backend.getAdminDashboard_(adminSession);

  assert.deepEqual(dashboard.pendingInvitations, []);
  assert.deepEqual(dashboard.missingObCancellations, []);
  assert.throws(
    () => backend.closeMissingObCancellations_(adminSession, ['leave-unlinked']),
    /不可關閉|尚未連結|重新整理/,
  );
});

test('claim rejects a pending leave whose original OB course disappeared after the page loaded', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/05', '19:15', 'C－空環 Lv.1', '老師丙', 'calendar-other'],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/05', '19:00', 'B－空環 Lv.1',
      '確認中', '', '', '', 'leave-missing', 'calendar-missing',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  const before = JSON.stringify(leaveSheet.values);

  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{
      substituteId: 'leave-missing', handlingType: 'original',
    }]),
    /OB.*不存在|課程已取消|重新整理/,
  );
  assert.equal(JSON.stringify(leaveSheet.values), before);
});

test('claim rejects a stale conflicting course without writing any leave row', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/05', '18:00', 'A－空環 Lv.1', '老師甲', 'calendar-own', 'class-ring-1'],
      ['2026/09/05', '19:00', 'B－空環 Lv.1', '老師乙', 'calendar-target', 'class-ring-1'],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/05', '19:00', 'B－空環 Lv.1',
      '確認中', '', '', '', 'leave-target', 'calendar-target',
    ]],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  const before = JSON.parse(JSON.stringify(leaveSheet.values));

  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{
      substituteId: 'leave-target', handlingType: 'original',
    }]),
    /相隔未滿 15 分鐘/,
  );
  assert.deepEqual(leaveSheet.values, before);
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

test('admin ends the invitation round without changing any leave or claimed substitute row', () => {
  const {
    backend,
    invitationSheet,
    leaveSheet,
    auditSheet,
    adminSession,
    teacherASession,
    teacherBSession,
  } = createInvitationBackend({
    invitationRows: [
      ['invite-a', '老師甲', '2026-08-20 09:00:00', '2026-08-20 09:05:00', '開放中', ''],
      ['invite-b', '老師乙', '2026-08-20 09:00:00', '', '開放中', ''],
      ['invite-old', '老師丙', '2026-08-19 09:00:00', '', '已關閉', '2026-08-19 10:00:00'],
    ],
  });
  const leaveBefore = JSON.stringify(leaveSheet.values);

  const result = backend.endInvitationRound_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    closedInvitations: 2,
    closedTeachers: 2,
  });
  assert.deepEqual(invitationSheet.values.slice(1).map((row) => row[4]), [
    '本輪已結束', '本輪已結束', '已關閉',
  ]);
  assert.ok(invitationSheet.values[1][5]);
  assert.ok(invitationSheet.values[2][5]);
  assert.equal(JSON.stringify(leaveSheet.values), leaveBefore);
  assert.equal(backend.getClaimPageData_(teacherASession).state, 'ended');
  assert.equal(backend.getClaimPageData_(teacherBSession).state, 'ended');
  assert.deepEqual(JSON.parse(JSON.stringify(backend.getAvailableSubstitutes_(teacherASession))), []);
  assert.equal(auditSheet.values.filter((row) => row[2] === '結束本輪邀請').length, 2);
  assert.throws(() => backend.endInvitationRound_(teacherASession), /課程管理權限|管理權限/);
});

test('opening a new invitation after a round ended restores that teacher claim page', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    invitationRows: [[
      'invite-old', '老師甲', '2026-08-19 09:00:00', '', '本輪已結束', '2026-08-19 10:00:00',
    ]],
  });

  assert.equal(backend.getClaimPageData_(teacherASession).state, 'ended');

  backend.openInvitations_(adminSession, ['老師甲']);

  assert.equal(backend.getClaimPageData_(teacherASession).state, 'active');
});

test('a manually closed historical invitation does not masquerade as an ended round', () => {
  const { backend, teacherASession } = createInvitationBackend({
    invitationRows: [[
      'invite-old', '老師甲', '2026-08-19 09:00:00', '', '已關閉', '2026-08-19 10:00:00',
    ]],
  });

  assert.equal(backend.getClaimPageData_(teacherASession).state, 'notInvited');
});

test('claim page state follows the latest invitation instead of an older ended round', () => {
  const { backend, teacherASession } = createInvitationBackend({
    invitationRows: [
      ['invite-round-one', '老師甲', '2026-08-18 09:00:00', '', '本輪已結束', '2026-08-18 10:00:00'],
      ['invite-round-two', '老師甲', '2026-08-19 09:00:00', '', '已關閉', '2026-08-19 10:00:00'],
    ],
  });

  assert.equal(backend.getClaimPageData_(teacherASession).state, 'notInvited');
});

test('ending the invitation round restores only invitation rows when its audit write fails', () => {
  const { backend, invitationSheet, leaveSheet, auditSheet, adminSession } = createInvitationBackend({
    invitationRows: [
      ['invite-a', '老師甲', '2026-08-20 09:00:00', '', '開放中', ''],
      ['invite-b', '老師乙', '2026-08-20 09:00:00', '', '開放中', ''],
    ],
  });
  const invitationsBefore = JSON.stringify(invitationSheet.values);
  const leavesBefore = JSON.stringify(leaveSheet.values);
  injectSetValuesFailureOnce(auditSheet, ({ row }) => row >= 2, 'audit unavailable');

  assert.throws(() => backend.endInvitationRound_(adminSession), /audit unavailable/);

  assert.equal(JSON.stringify(invitationSheet.values), invitationsBefore);
  assert.equal(JSON.stringify(leaveSheet.values), leavesBefore);
});

test('ending the invitation round precisely restores audit cells if the audit write commits then fails', () => {
  const { backend, invitationSheet, auditSheet, adminSession } = createInvitationBackend({
    invitationRows: [
      ['invite-a', '老師甲', '2026-08-20 09:00:00', '', '開放中', ''],
      ['invite-b', '老師乙', '2026-08-20 09:00:00', '', '開放中', ''],
    ],
  });
  const invitationsBefore = JSON.stringify(invitationSheet.values);
  const originalGetRange = auditSheet.getRange.bind(auditSheet);
  let fired = false;
  auditSheet.getRange = (row, column, numRows = 1, numColumns = 1) => {
    const range = originalGetRange(row, column, numRows, numColumns);
    const originalSetValues = range.setValues.bind(range);
    range.setValues = (nextValues) => {
      const result = originalSetValues(nextValues);
      if (!fired && row >= 2) {
        fired = true;
        throw new Error('audit post-write failure');
      }
      return result;
    };
    return range;
  };

  assert.throws(() => backend.endInvitationRound_(adminSession), /audit post-write failure/);

  assert.equal(JSON.stringify(invitationSheet.values), invitationsBefore);
  assert.equal(auditSheet.values.filter((row) => row[2] === '結束本輪邀請').length, 0);
});

test('end-invitation-round POST is wired only for a course administrator session', () => {
  const { backend, adminToken, teacherAToken } = createInvitationBackend({
    invitationRows: [[
      'invite-a', '老師甲', '2026-08-20 09:00:00', '', '開放中', '',
    ]],
  });
  backend.console.error = () => {};

  const teacherResponse = JSON.parse(backend.doPost({ parameter: {
    action: 'endInvitationRound', sessionToken: teacherAToken,
  } }).text);
  const adminResponse = JSON.parse(backend.doPost({ parameter: {
    action: 'endInvitationRound', sessionToken: adminToken,
  } }).text);

  assert.equal(teacherResponse.status, 'error');
  assert.match(teacherResponse.message, /課程管理權限|管理權限/);
  assert.equal(adminResponse.status, 'success');
  assert.deepEqual(JSON.parse(JSON.stringify(adminResponse.data)), {
    closedInvitations: 1,
    closedTeachers: 1,
  });
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
  assert.deepEqual(JSON.parse(JSON.stringify(winner)), { count: 1, occupiedSubstituteIds: [] });
  assert.equal(claimedRow[5], '已領取');
  assert.equal(claimedRow[6], '老師甲');
  assert.equal(auditSheet.values.filter((row) => row[2] === '領取代課' && row[3] === 'leave-c').length, 1);
});

test('ordinary claim switches a monthly discount choice to the regular OB class', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    teacherACapabilities: '舞綢',
    courseRows: [
      ['2026/09/27', '17:30', 'A－空環 Lv.2~3', '老師乙', 'calendar-target', 'class-ring', 'teacher-b', '否', ''],
      ['2026/09/01', '18:30', 'A－舞綢 Lv.1-2〈優惠〉', '老師丙', 'calendar-discount-1', 'class-silk-discount', 'teacher-c', '否', ''],
      ['2026/09/08', '18:30', 'A－舞綢 Lv.1-2〈優惠〉', '老師丙', 'calendar-discount-2', 'class-silk-discount', 'teacher-c', '否', ''],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/27', '17:30', 'A－空環 Lv.2~3',
      '確認中', '', '', '', 'leave-target', 'calendar-target',
    ]],
  });
  backend.getObClassCatalog_ = () => backend.normalizeObClassCatalog_([
    { id: 'class-silk-regular', nameZhHant: 'A－舞綢 Lv.1-2' },
    { id: 'class-silk-discount', nameZhHant: 'A－舞綢 Lv.1-2〈優惠〉' },
    { id: 'class-silk-new', nameZhHant: 'A－舞綢 Lv.1-2〈新老師〉' },
  ]);
  backend.openInvitations_(adminSession, ['老師甲']);

  backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-target', handlingType: 'existing',
    courseTypeKey: '舞綢', difficulty: 'Lv.1-2',
  }]);

  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[11], 'class-silk-regular');
  assert.equal(row[12], 'A－舞綢 Lv.1-2');
});

test('new teacher claim switches any ordinary substitute to the new-teacher OB class', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    teacherACapabilities: '舞綢',
    courseRows: [
      ['2026/09/27', '17:30', 'A－空環 Lv.2~3', '老師乙', 'calendar-target', 'class-ring', 'teacher-b', '否', ''],
      ['2026/09/02', '19:00', 'B－空環 Lv.0〈新老師〉', '老師甲', 'calendar-own-new', 'class-ring-new', 'teacher-a', '否', ''],
      ['2026/09/01', '18:30', 'A－舞綢 Lv.1-2〈優惠〉', '老師丙', 'calendar-discount-1', 'class-silk-discount', 'teacher-c', '否', ''],
      ['2026/09/08', '18:30', 'A－舞綢 Lv.1-2〈優惠〉', '老師丙', 'calendar-discount-2', 'class-silk-discount', 'teacher-c', '否', ''],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/27', '17:30', 'A－空環 Lv.2~3',
      '確認中', '', '', '', 'leave-target', 'calendar-target',
    ]],
  });
  backend.getObClassCatalog_ = () => backend.normalizeObClassCatalog_([
    { id: 'class-silk-regular', nameZhHant: 'A－舞綢 Lv.1-2' },
    { id: 'class-silk-discount', nameZhHant: 'A－舞綢 Lv.1-2〈優惠〉' },
    { id: 'class-silk-new', nameZhHant: 'A－舞綢 Lv.1-2〈新老師〉' },
  ]);
  backend.openInvitations_(adminSession, ['老師甲']);

  backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-target', handlingType: 'existing',
    courseTypeKey: '舞綢', difficulty: 'Lv.1-2',
  }]);

  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[11], 'class-silk-new');
  assert.equal(row[12], 'A－舞綢 Lv.1-2〈新老師〉');
});

test('direct claim of a monthly discount course uses the regular OB class for a non-new substitute', () => {
  const { backend, leaveSheet, adminSession, teacherASession } = createInvitationBackend({
    nextMonth: '2026-09',
    teacherACapabilities: '舞綢',
    courseRows: [[
      '2026/09/27', '17:30', 'A－舞綢 Lv.1-2〈優惠〉', '老師乙',
      'calendar-target', 'class-silk-discount', 'teacher-b', '否', '',
    ]],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/27', '17:30', 'A－舞綢 Lv.1-2〈優惠〉',
      '確認中', '', '', '', 'leave-target', 'calendar-target',
    ]],
  });
  backend.getObClassCatalog_ = () => backend.normalizeObClassCatalog_([
    { id: 'class-silk-regular', nameZhHant: 'A－舞綢 Lv.1-2' },
    { id: 'class-silk-discount', nameZhHant: 'A－舞綢 Lv.1-2〈優惠〉' },
  ]);
  backend.openInvitations_(adminSession, ['老師甲']);

  backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-target', handlingType: 'original',
  }]);

  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[11], 'class-silk-regular');
  assert.equal(row[12], 'A－舞綢 Lv.1-2');
});

test('ordinary delay atomically claims the source and reserves the next open leave', () => {
  const {
    backend, leaveSheet, auditSheet, adminSession, teacherASession,
  } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '18:30', 'A－空環 Lv.1', '老師乙', 'cal-a', 'class-a'],
      ['2026/08/10', '20:00', 'A－空環 Lv.2', '老師丙', 'cal-b', 'class-b'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/08/10', '18:30', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'],
      ['stamp', '老師丙', '2026/08/10', '20:00', 'A－空環 Lv.2', '確認中', '', '', '', 'leave-b', 'cal-b'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const result = backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-a', handlingType: 'original', startDelayMinutes: 30,
  }]);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    count: 1,
    occupiedSubstituteIds: ['leave-b'],
  });
  assert.equal(leaveSheet.values[1][5], '已領取');
  assert.equal(leaveSheet.values[1][6], '老師甲');
  assert.equal(leaveSheet.values[1][25], '19:00');
  assert.equal(leaveSheet.values[1][26], 30);
  assert.equal(leaveSheet.values[2][5], '延後占用');
  assert.equal(leaveSheet.values[2][6], '');
  assert.equal(leaveSheet.values[2][8], '待處理');
  assert.equal(leaveSheet.values[2][15], '待關閉 OB');
  assert.equal(leaveSheet.values[2][18], '延後占用／待管理員關閉 OB');
  assert.equal(leaveSheet.values[2][27], 'leave-a');
  assert.equal(auditSheet.values.filter((row) => row[2] === '領取代課' && row[3] === 'leave-a').length, 1);
  assert.equal(auditSheet.values.filter((row) => row[2] === '延後占用' && row[3] === 'leave-b').length, 1);
});

test('ordinary early start persists negative fifteen minutes without occupying another leave', () => {
  const {
    backend, leaveSheet, adminSession, teacherASession,
  } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '17:00', 'A－空環 Lv.1', '老師丙', 'cal-before', 'class-before'],
      ['2026/08/10', '18:45', 'A－空環 Lv.1', '老師乙', 'cal-a', 'class-a'],
      ['2026/08/10', '20:00', 'A－空環 Lv.2', '老師丙', 'cal-after', 'class-after'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/08/10', '18:45', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const result = backend.claimSubstitute_(teacherASession, [{
    substituteId: 'leave-a', handlingType: 'original', startDelayMinutes: -15,
  }]);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    count: 1,
    occupiedSubstituteIds: [],
  });
  assert.equal(leaveSheet.values[1][5], '已領取');
  assert.equal(leaveSheet.values[1][25], '18:30');
  assert.equal(leaveSheet.values[1][26], -15);
  assert.equal(leaveSheet.values[1][27], '');
});

test('ordinary delay batch conflict rejects every write', () => {
  const {
    backend, leaveSheet, auditSheet, adminSession, teacherASession,
  } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '18:30', 'A－空環 Lv.1', '老師乙', 'cal-a', 'class-a'],
      ['2026/08/10', '20:00', 'A－空環 Lv.2', '老師丙', 'cal-b', 'class-b'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/08/10', '18:30', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'],
      ['stamp', '老師丙', '2026/08/10', '20:00', 'A－空環 Lv.2', '確認中', '', '', '', 'leave-b', 'cal-b'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
  const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());

  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [
      { substituteId: 'leave-a', handlingType: 'original', startDelayMinutes: 30 },
      { substituteId: 'leave-b', handlingType: 'original', startDelayMinutes: 0 },
    ]),
    /同時領取|重複/
  );
  assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore);
  assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore);
});

test('ordinary delay rollback restores both leaves when the occupied write fails', () => {
  const {
    backend, leaveSheet, auditSheet, adminSession, teacherASession,
  } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '18:30', 'A－空環 Lv.1', '老師乙', 'cal-a', 'class-a'],
      ['2026/08/10', '20:00', 'A－空環 Lv.2', '老師丙', 'cal-b', 'class-b'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/08/10', '18:30', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'],
      ['stamp', '老師丙', '2026/08/10', '20:00', 'A－空環 Lv.2', '確認中', '', '', '', 'leave-b', 'cal-b'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
  const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());
  injectSetValuesFailureOnce(
    leaveSheet,
    ({ row, column }) => row === 3 && column === 6,
    'injected occupied write failure'
  );

  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{
      substituteId: 'leave-a', handlingType: 'original', startDelayMinutes: 30,
    }]),
    /injected occupied write failure/
  );
  assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore);
  assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore);
});

test('ordinary delay rollback restores both leaves when its audit append fails', () => {
  const {
    backend, leaveSheet, auditSheet, adminSession, teacherASession,
  } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '18:30', 'A－空環 Lv.1', '老師乙', 'cal-a', 'class-a'],
      ['2026/08/10', '20:00', 'A－空環 Lv.2', '老師丙', 'cal-b', 'class-b'],
    ],
    leaveRows: [
      ['stamp', '老師乙', '2026/08/10', '18:30', 'A－空環 Lv.1', '確認中', '', '', '', 'leave-a', 'cal-a'],
      ['stamp', '老師丙', '2026/08/10', '20:00', 'A－空環 Lv.2', '確認中', '', '', '', 'leave-b', 'cal-b'],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);
  const leaveBefore = JSON.stringify(leaveSheet.getDataRange().getValues());
  const auditBefore = JSON.stringify(auditSheet.getDataRange().getValues());
  injectSetValuesFailureOnce(
    auditSheet,
    ({ row }) => row > 1,
    'injected delayed audit failure'
  );

  assert.throws(
    () => backend.claimSubstitute_(teacherASession, [{
      substituteId: 'leave-a', handlingType: 'original', startDelayMinutes: 30,
    }]),
    /injected delayed audit failure/
  );
  assert.equal(JSON.stringify(leaveSheet.getDataRange().getValues()), leaveBefore);
  assert.equal(JSON.stringify(auditSheet.getDataRange().getValues()), auditBefore);
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

test('category capability validation combines protected account settings with regular OB courses', () => {
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
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { count: 1, occupiedSubstituteIds: [] });
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
    previousCourseTime: '', earliestStartTime: '',
    maxDurationMinutes: 75, mergePartnerIds: ['leave:leave-open-1'],
    requiresClosingTimeConfirmation: false,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(availability['leave:leave-open-1'])), {
    room: 'A', date: '2026/08/10', startTime: '10:30', nextCourseTime: '12:00',
    previousCourseTime: '09:00', earliestStartTime: '10:15',
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
  const { backend, services, courseSheet, leaveSheet, specialRequestSheet, adminSession, teacherASession } = createInvitationBackend({
    courseRows: [
      ['2026/08/10', '09:00', 'A－空環 Lv.1', '老師甲', 'cal-own-1', 'class-a', 'teacher-a', '否', ''],
      ['2026/08/10', '10:30', 'A－空環 Lv.2', '老師甲', 'cal-own-2', 'class-b', 'teacher-a', '否', ''],
      ['2026/08/10', '12:00', 'A－空環 Lv.3', '老師丙', 'cal-private', 'class-c', 'teacher-c', '否', ''],
    ],
    leaveRows: [],
  });
  backend.getTimestamp_ = () => '2026-08-15 12:00:00';
  backend.openInvitations_(adminSession, ['老師甲']);
  const pushes = [];
  backend.sendPushNotificationSafely_ = (names, message) => {
    assert.equal(services.__lockState.depth, 0);
    pushes.push({ names: Array.from(names), message });
    return { attempted: true, delivered: 1, error: '' };
  };
  const beforeLeaves = JSON.stringify(leaveSheet.values);

  const result = backend.claimSpecialCourse_(teacherASession, {
    mode: 'merge', startSlotKey: 'own:cal-own-1', actualStartTime: '09:00',
    courseName: '舞綢中軸特別課', durationMinutes: 120, difficulty: 'Open level', note: '',
  });

  assert.equal(JSON.stringify(leaveSheet.values), beforeLeaves);
  assert.equal(specialRequestSheet.values.length, 2);
  assert.equal(result.count, 2);
  assert.deepEqual(pushes[0].names, ['老師甲']);
  assert.match(pushes[0].message.content, /舞綢中軸特別課/);
  assert.match(pushes[0].message.url, /view=mysubs/);
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
    ['2026/08/10', '09:00', 'A－舞綢中軸特別課 Open level (120min)', '老師甲', 'cal-own-1', 'class-special', 'teacher-a', '否', ''],
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

test('teacher regular OB courses supplement missing account teaching capabilities', () => {
  const { backend, adminSession, teacherASession } = createInvitationBackend({
    teacherACapabilities: '',
    courseRows: [
      ['2026/09/01', '09:00', 'A－空瑜 Lv.1', '老師甲', 'calendar-yoga-1', 'class-yoga-1', 'teacher-a', '否', ''],
      ['2026/09/08', '09:00', 'A－空瑜 Lv.1', '老師甲', 'calendar-yoga-2', 'class-yoga-1', 'teacher-a', '否', ''],
      ['2026/09/02', '10:00', 'A－空環技巧訓練期班', '老師甲', 'calendar-term', 'class-term', 'teacher-a', '否', ''],
      ['2026/09/03', '11:00', 'A－舞綢特別課', '老師甲', 'calendar-special', 'class-special', 'teacher-a', '否', ''],
    ],
  });
  backend.openInvitations_(adminSession, ['老師甲']);

  const options = backend.getClaimOptions_(teacherASession);

  assert.deepEqual(JSON.parse(JSON.stringify(options.capabilities)), ['空瑜']);
  assert.equal(options.classes.some((item) => item.category === '空瑜'), true);
  assert.equal(options.capabilities.includes('空環'), false);
  assert.equal(options.capabilities.includes('舞綢'), false);
  assert.equal(backend.teacherCanTeachCategory_('老師甲', '空瑜'), true);
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

test('custom floor course accepts a teacher supplied name without difficulty', () => {
  const { backend } = createInvitationBackend({ teacherACapabilities: '地板課程' });

  const normalized = backend.validateClaimChange_({
    teacher: '老師甲',
    targetCourseName: 'B－舞綢 Lv.2',
    handlingType: 'new',
    actualCourseName: '筋膜放鬆新主題',
    category: '地板課程',
    difficulty: '',
    note: 'Jina 自訂課程',
  });

  assert.equal(normalized.actualCourseName, '筋膜放鬆新主題');
  assert.equal(normalized.category, '地板課程');
  assert.equal(normalized.difficulty, '');
  assert.equal(normalized.handlingType, '需要新增課程');
  assert.equal(normalized.summary, '需要新增課程：筋膜放鬆新主題；備註：Jina 自訂課程');
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
  assert.ok(!beforeRestore.changeRequests.some((item) => item.substituteId === 'leave-cancel-request'));
  assert.ok(!beforeRestore.completed.some((item) => item.substituteId === 'leave-cancel-request'));

  const reconciliation = backend.reconcileObChanges_(adminSession);
  assert.equal(reconciliation.matched, 1);
  assert.equal(leaveSheet.values[1][8], '已完成');
  assert.equal(leaveSheet.values[1][15], '已回復核對');
  assert.equal(leaveSheet.values[1][18], '取消後已回復 OB');
  const afterRestore = backend.getAdminDashboard_(adminSession);
  assert.ok(!afterRestore.obWork.some((item) => item.substituteId === 'leave-cancel-request'));
  assert.ok(!afterRestore.changeRequests.some((item) => item.substituteId === 'leave-cancel-request'));
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
    { count: 1, occupiedSubstituteIds: [] }
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
    { count: 1, occupiedSubstituteIds: [] }
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

test('withdraw approval or rejection notifies the requesting substitute without rolling back', () => {
  const { backend, services, leaveSheet, adminSession, teacherBSession } = createInvitationBackend({
    leaveRows: [[
      '時間', '老師丙', '2026/08/12', '12:00', '空環 Lv.1', '已領取', '老師乙',
      '沿用原課程', '待處理', 'leave-withdraw-push', 'calendar-c', '', '', '',
      '沿用原課程', '待核對', '', '', '', '空環',
    ]],
  });
  backend.requestClaimWithdrawal_(teacherBSession, 'leave-withdraw-push', '臨時有事');
  const pushes = [];
  backend.sendPushNotificationSafely_ = (names, message) => {
    assert.equal(services.__lockState.depth, 0);
    pushes.push({ names: names.slice(), message });
    return { attempted: true, delivered: 1, error: '' };
  };

  const result = backend.resolveChangeRequest_(adminSession, 'leave-withdraw-push', 'reject', '仍需由你代課');

  assert.equal(result.decision, 'reject');
  assert.equal(leaveSheet.values[1][18], '退出申請已駁回');
  assert.deepEqual(JSON.parse(JSON.stringify(pushes[0].names)), ['老師乙']);
  assert.match(pushes[0].message.content, /駁回/);
  assert.match(pushes[0].message.url, /view=mysubs/);
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

test('delayed primary claim verifies its actual OB start time', () => {
  const fixture = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/01', '18:30', 'A－空環 Lv.1', '老師甲',
      'cal-a', 'class-ring-1', 'teacher-a', '是', '',
    ]],
    leaveRows: [[
      'stamp', '原老師甲', '2026/09/01', '18:30', 'A－空環 Lv.1',
      '已領取', '老師甲', '', '待處理', 'leave-a', 'cal-a',
      'class-ring-1', 'A－空環 Lv.1', '', '沿用原課程', '待核對', '', '', '',
      '空環', '', '', '', '', '', '19:00', 30, '',
    ]],
  });

  fixture.backend.reconcileObChanges_(fixture.adminSession);
  assert.equal(fixture.leaveSheet.values[1][15], '核對異常');
  assert.match(fixture.leaveSheet.values[1][17], /時間不一致.*19:00.*18:30/);

  fixture.courseSheet.values[1][1] = '19:00';
  fixture.backend.reconcileObChanges_(fixture.adminSession);
  assert.equal(fixture.leaveSheet.values[1][15], '已核對');
  assert.equal(fixture.leaveSheet.values[1][17], '');
});

test('delay occupied row completes only after its OB calendar disappears', () => {
  const fixture = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/01', '20:00', 'A－空環 Lv.2', '原老師乙',
      'cal-b', 'class-b', 'teacher-b', '否', '',
    ]],
    leaveRows: [[
      'stamp', '原老師乙', '2026/09/01', '20:00', 'A－空環 Lv.2',
      '延後占用', '', '由代課編號 leave-a 延後占用', '待處理', 'leave-b', 'cal-b',
      '', '', '', '', '待關閉 OB', '', '', '延後占用／待管理員關閉 OB',
      '', '', '', '', '', '', '', '', 'leave-a',
    ]],
  });

  const stillOpen = fixture.backend.reconcileObChanges_(fixture.adminSession);
  assert.equal(stillOpen.exceptions, 1);
  assert.equal(fixture.leaveSheet.values[1][15], '核對異常');
  assert.match(fixture.leaveSheet.values[1][17], /OB 課程仍存在/);

  fixture.courseSheet.values.splice(1, 1);
  const closed = fixture.backend.reconcileObChanges_(fixture.adminSession);
  assert.equal(closed.matched, 1);
  assert.equal(fixture.leaveSheet.values[1][8], '已完成');
  assert.equal(fixture.leaveSheet.values[1][15], '已關閉');
  assert.equal(fixture.leaveSheet.values[1][18], '延後占用／OB 已關閉');
});

test('delay occupied admin work links its source while personal records keep only the claimed class', () => {
  const fixture = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [],
    leaveRows: [
      [
        'stamp', '原老師甲', '2026/09/01', '18:30', 'A－空環 Lv.1',
        '已領取', '老師甲', '實際開始：19:00', '待處理', 'leave-a', 'cal-a',
        'class-a', 'A－空環 Lv.1', '', '沿用原課程', '待核對', '', '', '',
        '空環', '', '', '', '', '', '19:00', 30, '',
      ],
      [
        'stamp', '原老師乙', '2026/09/01', '20:00', 'A－空環 Lv.2',
        '延後占用', '', '由代課編號 leave-a 延後占用', '待處理', 'leave-b', 'cal-b',
        '', '', '', '', '待關閉 OB', '', '', '延後占用／待管理員關閉 OB',
        '', '', '', '', '', '', '', '', 'leave-a',
      ],
    ],
  });

  const dashboard = fixture.backend.getAdminDashboard_(fixture.adminSession);
  const occupied = dashboard.obWork.find((item) => item.substituteId === 'leave-b');
  const personal = fixture.backend.getMySubs_('老師甲');

  assert.ok(occupied);
  assert.equal(occupied.delaySourceSubstituteId, 'leave-a');
  assert.equal(occupied.delaySourceTeacher, '老師甲');
  assert.ok(!dashboard.pendingInvitations.some((item) => item.substituteId === 'leave-b'));
  assert.deepEqual(personal.map((item) => item['代課編號']), ['leave-a']);
  assert.equal(personal[0]['實際開始時間'], '19:00');
  assert.equal(personal[0]['延後分鐘數'], 30);
});

test('admin dashboard keeps only pending delay closures in the action queue', () => {
  const fixture = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [],
    leaveRows: [
      [
        'stamp', '原老師甲', '2026/09/01', '20:00', 'A－空環 Lv.1',
        '延後占用', '', '由代課編號 leave-source-a 延後占用', '待處理', 'leave-delay-open', 'cal-open',
        '', '', '', '', '待關閉 OB', '', '', '延後占用／待管理員關閉 OB',
        '', '', '', '', '', '', '', '', 'leave-source-a',
      ],
      [
        'stamp', '原老師乙', '2026/09/02', '20:00', 'B－空環 Lv.1',
        '延後占用', '', '由代課編號 leave-source-b 延後占用', '已完成', 'leave-delay-closed', 'cal-closed',
        '', '', '', '', '已關閉', 'stamp', '', '延後占用／OB 已關閉',
        '', '', '', '', '', '', '', '', 'leave-source-b',
      ],
      [
        'stamp', '原老師丙', '2026/08/31', '20:00', 'C－空環 Lv.1',
        '延後占用', '', '由代課編號 leave-source-c 延後占用', '已完成', 'leave-delay-old', 'cal-old',
        '', '', '', '', '已關閉', 'stamp', '', '延後占用／OB 已關閉',
        '', '', '', '', '', '', '', '', 'leave-source-c',
      ],
    ],
  });

  const dashboard = fixture.backend.getAdminDashboard_(fixture.adminSession);

  assert.deepEqual(
    dashboard.delayClosures.map((item) => item.substituteId),
    ['leave-delay-open']
  );
  assert.ok(dashboard.completed.some((item) => item.substituteId === 'leave-delay-closed'));
});

test('course admin can correct difficulty and note on one claimed row and sends it back to OB review', () => {
  const fixture = createInvitationBackend();
  const target = fixture.leaveSheet.values.find((row) => row[9] === 'leave-claimed');
  target[7] = '沿用原課程；難度：備註誤填；備註：Lv.2~3；實際開始：12:15';
  target[13] = '備註誤填';
  target[15] = '已核對';
  target[16] = 'old-time';
  target[17] = 'old-difference';
  const unrelatedBefore = JSON.stringify(fixture.leaveSheet.values[1]);

  assert.throws(
    () => fixture.backend.correctClaimDetails_(fixture.teacherASession, 'leave-claimed', 'Lv.2~3', '請留意肩膀'),
    /課程管理權限/
  );

  const result = fixture.backend.correctClaimDetails_(
    fixture.adminSession,
    'leave-claimed',
    'Lv.2~3',
    '請留意肩膀'
  );

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    substituteId: 'leave-claimed',
    difficulty: 'Lv.2~3',
    note: '請留意肩膀',
    verificationStatus: '待核對',
  });
  assert.equal(target[13], 'Lv.2~3');
  assert.equal(target[15], '待核對');
  assert.equal(target[16], '');
  assert.equal(target[17], '');
  assert.match(target[7], /沿用原課程；難度：Lv\.2~3；備註：請留意肩膀；實際開始：12:15/);
  assert.equal(JSON.stringify(fixture.leaveSheet.values[1]), unrelatedBefore);
  const audit = fixture.auditSheet.values.find((row) => row[2] === '管理員更正領課資料');
  assert.equal(audit[1], '管理員甲');
  assert.equal(audit[3], 'leave-claimed');
  assert.throws(
    () => fixture.backend.correctClaimDetails_(fixture.adminSession, 'leave-a', 'Lv.1', ''),
    /只有已領取/
  );
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

test('reconciliation accepts a regular OB course for a legacy monthly-discount expectation', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/27', '17:30', 'A－舞綢 Lv.1-2', '老師甲',
      'calendar-target', 'class-silk-regular', 'teacher-a', '是', '',
    ]],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/27', '17:30', 'A－空環 Lv.2~3',
      '已領取', '老師甲', '', '待處理', 'leave-target', 'calendar-target',
      '', 'A－舞綢 Lv.1-2〈優惠〉', 'Lv.1-2', '需要新增課程', '待核對',
    ]],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 1, exceptions: 0 });
  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[15], '已核對');
  assert.equal(row[17], '');
});

test('reconciliation treats hyphen and tilde level ranges as the same ordinary course', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/14', '10:30', 'C－舞綢 Lv.1~2', 'Vivi',
      'calendar-target', 'class-silk-regular', 'teacher-vivi', '是', '',
    ]],
    leaveRows: [[
      'stamp', 'Tako', '2026/09/14', '10:30', 'C－空環 Lv.2~3',
      '已領取', 'Vivi', '需要新增課程：C－舞綢 Lv.1-2〈優惠〉', '待處理',
      'leave-target', 'calendar-target', '', 'C－舞綢 Lv.1-2〈優惠〉',
      'Lv.1-2', '需要新增課程', '核對異常', '', '舊差異', '', '舞綢',
    ]],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 1, exceptions: 0 });
  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[15], '已核對');
  assert.equal(row[17], '');
});

test('reconciliation ignores an OB room prefix when the expected custom course has no room', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/05', '12:30', 'A－肩頸舒壓瑜伽', '老師甲',
      'calendar-target', 'class-shoulder-yoga', 'teacher-a', '是', '',
    ]],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/05', '12:30', 'A－空瑜 Lv.0~2',
      '已領取', '老師甲', '需要新增課程：肩頸舒壓瑜伽', '待處理',
      'leave-target', 'calendar-target', '', '肩頸舒壓瑜伽', '',
      '需要新增課程', '核對異常', '', '舊差異', '', '地板課程',
    ]],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 1, exceptions: 0 });
  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[15], '已核對');
  assert.equal(row[17], '');
});

test('reconciliation still rejects a different OB room when the expected course includes a room', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/05', '12:30', 'B－肩頸舒壓瑜伽', '老師甲',
      'calendar-target', 'class-shoulder-yoga-b', 'teacher-a', '是', '',
    ]],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/05', '12:30', 'A－空瑜 Lv.0~2',
      '已領取', '老師甲', '需要新增課程：A－肩頸舒壓瑜伽', '待處理',
      'leave-target', 'calendar-target', '', 'A－肩頸舒壓瑜伽', '',
      '需要新增課程', '待核對', '', '', '', '地板課程',
    ]],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 0, exceptions: 1 });
  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[15], '核對異常');
  assert.match(row[17], /課程不一致/);
});

test('admin dashboard displays the current regular expectation for a legacy discount claim', () => {
  const { backend, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/14', '10:30', 'C－舞綢 Lv.1~2', 'Vivi',
      'calendar-target', 'class-silk-regular', 'teacher-vivi', '是', '',
    ]],
    leaveRows: [[
      'stamp', 'Tako', '2026/09/14', '10:30', 'C－空環 Lv.2~3',
      '已領取', 'Vivi', '需要新增課程：C－舞綢 Lv.1-2〈優惠〉', '待處理',
      'leave-target', 'calendar-target', '', 'C－舞綢 Lv.1-2〈優惠〉',
      'Lv.1-2', '需要新增課程', '核對異常', '', '舊差異', '', '舞綢',
    ]],
  });

  const item = backend.getAdminDashboard_(adminSession).exceptions
    .find((record) => record.substituteId === 'leave-target');

  assert.equal(item.actualCourse, 'C－舞綢 Lv.1-2');
});

test('reconciliation requires the new-teacher marker when the substitute is new that month', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/27', '17:30', 'A－舞綢 Lv.1-2〈新老師〉', '老師甲', 'calendar-target', 'class-silk-new', 'teacher-a', '是', ''],
      ['2026/09/02', '19:00', 'B－空環 Lv.0〈新老師〉', '老師甲', 'calendar-own-new', 'class-ring-new', 'teacher-a', '否', ''],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/27', '17:30', 'A－空環 Lv.2~3',
      '已領取', '老師甲', '', '待處理', 'leave-target', 'calendar-target',
      '', 'A－舞綢 Lv.1-2', 'Lv.1-2', '需要新增課程', '待核對',
    ]],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 1, exceptions: 0 });
  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[15], '已核對');
  assert.equal(row[17], '');
});

test('reconciliation accepts a normal OB title for a new-teacher substitute while preserving the promotion expectation', () => {
  const courseRows = [
    ['2026/09/20', '17:00', 'D－空瑜 Lv.1~2', 'Melody Wang', 'calendar-target', 'class-yoga-regular', 'teacher-melody', '是', ''],
    ['2026/09/02', '10:30', 'D－空瑜 Lv.0~2〈新老師〉', 'Melody Wang', 'calendar-own-new', 'class-yoga-new', 'teacher-melody', '否', ''],
  ];
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows,
    leaveRows: [[
      'stamp', '小mo(子涵）', '2026/09/20', '17:00', 'D－空瑜 Lv.1~2',
      '已領取', 'Melody Wang', '', '待處理', 'leave-target', 'calendar-target',
      '', 'D－空瑜 Lv.1~2', 'Lv.1~2', '沿用原課程', '待核對',
    ]],
  });

  const expectation = backend.getObExpectation_(leaveSheet.values[1], courseRows);
  assert.equal(expectation.course, 'D－空瑜 Lv.1~2〈新老師〉');

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 1, exceptions: 0 });
  const row = leaveSheet.values.find((item) => item[9] === 'leave-target');
  assert.equal(row[15], '已核對');
  assert.equal(row[17], '');
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

test('special-course request reconciliation ignores OB level suffixes and yoga character variants', () => {
  const ownSource = (date, time, courseName, calendarId) => JSON.stringify([{
    sourceType: 'own', date, time, courseName,
    originalTeacher: '老師甲', calendarId,
  }]);
  const { backend, specialRequestSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      [
        '2026/09/20', '14:00', 'C－空中環長帶舞碼特別課 Lv.3', '老師甲',
        'calendar-aerial-dance', 'class-aerial-dance', 'teacher-a', '是', '',
      ],
      [
        '2026/09/26', '11:00', 'B－原始瑜伽椅子瑜伽特別課', '老師甲',
        'calendar-chair-yoga', 'class-chair-yoga', 'teacher-a', '是', '',
      ],
    ],
    leaveRows: [],
    specialRequestRows: [
      [
        'stamp', 'special-aerial-dance', '老師甲', '2026/09/20', 'C',
        ownSource('2026/09/20', '14:00', 'C－空環 Lv.2~3', 'calendar-aerial-dance'),
        '[]', '14:00', '空中環長帶舞碼', 'Lv.3', 90, '15:30',
        '使用連續時段', '', '待處理', '核對異常', '', '舊差異', '',
      ],
      [
        'stamp', 'special-chair-yoga', '老師甲', '2026/09/26', 'B',
        ownSource('2026/09/26', '11:00', 'A－原始瑜伽', 'calendar-chair-yoga'),
        '[]', '11:00', '原始瑜伽椅子瑜珈特別課', '', 120, '13:00',
        '使用連續時段', '', '待處理', '核對異常', '', '舊差異', '',
      ],
    ],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 2, matched: 2, exceptions: 0 });
  specialRequestSheet.values.slice(1).forEach((row) => {
    assert.equal(row[14], '已完成');
    assert.equal(row[15], '已核對');
    assert.equal(row[17], '');
  });
});

test('special-course request reconciliation accepts an OB title without the requested level', () => {
  const sourceSlots = JSON.stringify([{
    sourceType: 'own', date: '2026/09/20', time: '14:00', courseName: 'C－空環 Lv.2~3',
    originalTeacher: '老師甲', calendarId: 'calendar-aerial-dance',
  }]);
  const { backend, specialRequestSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/20', '14:00', 'C－空中環長帶舞碼特別課 (90min)', '老師甲',
      'calendar-aerial-dance', 'class-aerial-dance', 'teacher-a', '是', '',
    ]],
    leaveRows: [],
    specialRequestRows: [[
      'stamp', 'special-aerial-dance', '老師甲', '2026/09/20', 'C', sourceSlots,
      '[]', '14:00', '空中環長帶舞碼', 'Lv.3', 90, '15:30',
      '使用連續時段', '', '待處理', '待核對', '', '', '',
    ]],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 1, exceptions: 0 });
  const row = specialRequestSheet.values[1];
  assert.equal(row[14], '已完成');
  assert.equal(row[15], '已核對');
  assert.equal(row[17], '');
});

test('special-course request reconciliation accepts configured OB title aliases', () => {
  const sourceSlots = (date, time, courseName, calendarId) => JSON.stringify([{
    sourceType: 'own', date, time, courseName,
    originalTeacher: '老師甲', calendarId,
  }]);
  const { backend, specialRequestSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      [
        '2026/09/05', '19:45', 'A－折疊環特別課(90min)', '老師甲',
        'calendar-folding-hoop', 'class-folding-hoop', 'teacher-a', '是', '',
      ],
      [
        '2026/09/24', '12:15', 'A－迷你環綢舞碼特別課(90min)', '老師甲',
        'calendar-mini-silk', 'class-mini-silk', 'teacher-a', '是', '',
      ],
    ],
    leaveRows: [],
    specialRequestRows: [
      [
        'stamp', 'special-folding-hoop', '老師甲', '2026/09/05', 'A',
        sourceSlots('2026/09/05', '19:45', 'A－空環 Lv.0', 'calendar-folding-hoop'),
        '[]', '19:45', '摺疊環特別課', 'Lv3', 90, '21:15',
        '使用後方空堂', '', '待處理', '待核對', '', '', '',
      ],
      [
        'stamp', 'special-mini-silk', '老師甲', '2026/09/24', 'A',
        sourceSlots('2026/09/24', '12:15', 'A－皮拉提斯', 'calendar-mini-silk'),
        '[]', '12:15', '迷你環綢特別課', 'Lv2', 90, '13:45',
        '使用後方空堂', '', '待處理', '待核對', '', '', '',
      ],
    ],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 2, matched: 2, exceptions: 0 });
  specialRequestSheet.values.slice(1).forEach((row) => {
    assert.equal(row[14], '已完成');
    assert.equal(row[15], '已核對');
    assert.equal(row[17], '');
  });
});

test('special-course request reconciliation still rejects a different OB level', () => {
  const sourceSlots = JSON.stringify([{
    sourceType: 'own', date: '2026/09/20', time: '14:00', courseName: 'C－空環 Lv.2~3',
    originalTeacher: '老師甲', calendarId: 'calendar-aerial-dance',
  }]);
  const { backend, specialRequestSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [[
      '2026/09/20', '14:00', 'C－空中環長帶舞碼特別課 Lv.2', '老師甲',
      'calendar-aerial-dance', 'class-aerial-dance', 'teacher-a', '是', '',
    ]],
    leaveRows: [],
    specialRequestRows: [[
      'stamp', 'special-aerial-dance', '老師甲', '2026/09/20', 'C', sourceSlots,
      '[]', '14:00', '空中環長帶舞碼', 'Lv.3', 90, '15:30',
      '使用連續時段', '', '待處理', '待核對', '', '', '',
    ]],
  });

  const result = backend.reconcileObChanges_(adminSession);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { checked: 1, matched: 0, exceptions: 1 });
  const row = specialRequestSheet.values[1];
  assert.equal(row[15], '核對異常');
  assert.match(row[17], /等級不一致/);
  assert.match(row[17], /Lv\.3/);
  assert.match(row[17], /Lv\.2/);
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

test('admin replacement choices only include the target month', () => {
  const { backend, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/08/31', '14:00', 'B－空環 Lv.1~2', '老師甲', 'calendar-aug', 'class-ring', 'teacher-a', '否', ''],
      ['2026/09/18', '14:00', 'B－空環 Lv.1~2', '老師乙', 'calendar-sep', 'class-ring', 'teacher-b', '否', ''],
    ],
    leaveRows: [],
  });

  assert.deepEqual(JSON.parse(JSON.stringify(backend.getAdminDashboard_(adminSession).replacementOptions)), [{
    calendarId: 'calendar-sep',
    courseName: 'B－空環 Lv.1~2',
    teacherName: '老師乙',
    date: '2026/09/18',
    time: '14:00',
  }]);
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

test('replacement calendar linking adopts its time and immediately reconciles the row', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [[
      '2026/08/15', '14:00', '空環入門', '老師乙', 'calendar-new', 'class-new', 'teacher-b', '是', '',
    ]],
    leaveRows: [[
      '時間', '老師甲', '2026/08/15', '14:15', '舞綢', '已領取', '老師乙', '需要新增', '待處理',
      'leave-new-calendar', 'calendar-old', 'class-new', '空環入門', '', '需要新增課程', '核對異常', '', '時間不一致', '', '空環',
      '', '', '', '', '', '14:15', 0,
    ]],
  });

  const result = backend.linkReplacementCalendarItem_(adminSession, 'leave-new-calendar', 'calendar-new');

  assert.equal(leaveSheet.values[1][10], 'calendar-old');
  assert.equal(leaveSheet.values[1][20], 'calendar-new');
  assert.equal(leaveSheet.values[1][25], '14:00');
  assert.equal(leaveSheet.values[1][26], -15);
  assert.equal(leaveSheet.values[1][8], '已完成');
  assert.equal(leaveSheet.values[1][15], '已核對');
  assert.equal(leaveSheet.values[1][17], '');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    substituteId: 'leave-new-calendar',
    replacementCalendarId: 'calendar-new',
    verificationStatus: '已核對',
    differences: [],
    actualStartTime: '14:00',
  });
});

test('replacement calendar linking accepts an explicit room change but still requires the same level', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/26', '10:45', 'A－空瑜 Lv.2', 'Melody Wang', 'calendar-room-a', 'class-room-a', 'teacher-melody', '是', ''],
      ['2026/09/02', '10:30', 'D－空瑜 Lv.0~2〈新老師〉', 'Melody Wang', 'calendar-own-new', 'class-yoga-new', 'teacher-melody', '否', ''],
    ],
    leaveRows: [[
      'stamp', 'Ariel Lu', '2026/09/26', '10:45', 'B－空瑜 Lv.2',
      '已領取', 'Melody Wang', '', '待處理', 'leave-room-change', 'calendar-room-b',
      'class-room-b', 'B－空瑜 Lv.2', 'Lv.2', '沿用原課程', '核對異常', '', '舊教室不一致',
    ]],
  });

  const linked = backend.linkReplacementCalendarItem_(
    adminSession,
    'leave-room-change',
    'calendar-room-a'
  );

  assert.equal(leaveSheet.values[1][20], 'calendar-room-a');
  assert.equal(leaveSheet.values[1][15], '已核對');
  assert.equal(leaveSheet.values[1][17], '');
  assert.deepEqual(JSON.parse(JSON.stringify(linked.differences)), []);

  const levelMismatch = backend.ordinaryCourseReconciliationNamesMatch_(
    'B－空瑜 Lv.2〈新老師〉',
    'A－空瑜 Lv.2~4',
    { allowRoomChange: true, ignoreNewTeacherMarker: true }
  );
  assert.equal(levelMismatch, false);
});

test('replacement calendar linking rejects a course from a different date without writing', () => {
  const { backend, leaveSheet, adminSession } = createInvitationBackend({
    courseRows: [[
      '2026/08/16', '14:00', '空環入門', '老師乙', 'calendar-wrong-date', 'class-new', 'teacher-b', '是', '',
    ]],
    leaveRows: [[
      '時間', '老師甲', '2026/08/15', '14:15', '舞綢', '已領取', '老師乙', '需要新增', '待處理',
      'leave-wrong-date', 'calendar-old', 'class-new', '空環入門', '', '需要新增課程', '核對異常', '', '時間不一致', '', '空環',
      '', '', '', '', '', '14:15', 0,
    ]],
  });
  const before = JSON.stringify(leaveSheet.values[1]);

  assert.throws(
    () => backend.linkReplacementCalendarItem_(adminSession, 'leave-wrong-date', 'calendar-wrong-date'),
    /同一天/,
  );
  assert.equal(JSON.stringify(leaveSheet.values[1]), before);
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
  assert.equal(leaveSheet.values[1][11], 'class-new');
});

test('legacy manual-review leave stays unavailable until admin links its original OB course', () => {
  const { backend, leaveSheet, auditSheet, adminSession, teacherBSession } = createInvitationBackend({
    courseRows: [
      ['2026/08/01', '09:00', '空環 Lv.1', '老師甲', 'calendar-a', 'class-ring-1', 'teacher-a', '否', ''],
      ['2026/08/01', '10:15', '空環 Lv.1', '老師乙', 'calendar-b', 'class-ring-1', 'teacher-b', '否', ''],
    ],
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

test('admin dashboard precomputes new-teacher months without rescanning courses for each leave', () => {
  const { backend, adminSession } = createInvitationBackend({
    nextMonth: '2026-09',
    courseRows: [
      ['2026/09/02', '19:00', 'B－空環 Lv.0〈新老師〉', '老師甲', 'calendar-own-new', 'class-ring-new', 'teacher-a', '否', ''],
      ['2026/09/27', '17:30', 'A－舞綢 Lv.1-2〈新老師〉', '老師甲', 'calendar-target', 'class-silk-new', 'teacher-a', '是', ''],
    ],
    leaveRows: [[
      'stamp', '老師乙', '2026/09/27', '17:30', 'A－空環 Lv.2~3',
      '已領取', '老師甲', '', '待處理', 'leave-target', 'calendar-target',
      '', 'A－舞綢 Lv.1-2', 'Lv.1-2', '需要新增課程', '待核對',
    ]],
  });
  backend.isTeacherNewInMonth_ = () => {
    throw new Error('dashboard should use its precomputed new-teacher month lookup');
  };

  const item = backend.getAdminDashboard_(adminSession).obWork[0];

  assert.match(item.actualCourse, /新老師/);
});

test('admin change-request queue includes only pending cancellation or withdrawal requests', () => {
  const { backend, adminSession } = createInvitationBackend({
    leaveRows: [
      [
        '2026-08-10 00:25:41', '芮錤 77', '2026/09/27', '17:30', 'B－空環 Lv.1~3',
        '已取消', '', '', '', 'leave-cancelled', 'calendar-cancelled', '', '', '', '', '', '', '',
        '已自行取消', '', '',
      ],
      [
        '2026-08-10 00:25:41', 'Lily Yellow', '2026/09/05', '18:15', 'A－舞綢 Lv.3~5',
        '已領取', 'Jina', '', '', 'leave-withdraw-pending', 'calendar-withdraw', '', '', '', '', '', '', '',
        '申請退出中', '', '',
      ],
      [
        '2026-08-10 00:25:41', '老師乙', '2026/09/06', '18:15', 'A－空環 Lv.1',
        '確認中', '', '', '', 'leave-rejected', 'calendar-rejected', '', '', '', '', '', '', '',
        '取消申請已駁回', '', '',
      ],
    ],
    nextMonth: '2026-09',
  });

  const dashboard = backend.getAdminDashboard_(adminSession);

  assert.deepEqual(dashboard.changeRequests.map((item) => item.substituteId), ['leave-withdraw-pending']);
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

test('VVIP closes exactly at the configured Taipei deadline', () => {
  const { backend } = createVvipBackend();
  const settings = {
    activeMonth: '2026-09',
    isOpen: '是',
    closeAt: '2026-08-23 20:00:00',
  };

  assert.equal(backend.isVvipSelectionOpen_(settings, new Date('2026-08-23T11:59:59.000Z')), true);
  assert.equal(backend.isVvipSelectionOpen_(settings, new Date('2026-08-23T12:00:00.000Z')), false);
});

test('VVIP reads an auto-formatted active month date as the intended month', () => {
  const { backend, settingsSheet } = createVvipBackend();
  enableVvipMonthDateFormatting(backend);
  settingsSheet.values[1][1] = new Date('2026-09-01T00:00:00+08:00');

  const settings = backend.getVvipSettings_(settingsSheet);

  assert.equal(settings.activeMonth, '2026-09');
  assert.equal(backend.isVvipSelectionOpen_(settings), true);
});

test('VVIP admin includes selections whose month cell was auto-formatted as a date', () => {
  const { backend, adminSession } = createVvipBackend({
    selectionRows: [[
      '2026-08-18 08:35:20',
      'vvip@example.com',
      new Date('2026-09-01T00:00:00+08:00'),
      'vvip-cal-1',
      '2026/09/02',
      '10:00',
      '空環基礎',
      '老師甲',
      '待人工確認',
      '', '', '',
      '會員一',
      'vvip-member-1',
      '會員一',
    ]],
  });
  enableVvipMonthDateFormatting(backend);

  const dashboard = backend.getVvipAdminDashboard_(adminSession);

  assert.equal(dashboard.metrics.activeSelections, 1);
  assert.equal(dashboard.metrics.members, 1);
  assert.equal(dashboard.members[0].calendarId, 'vvip-cal-1');
});

test('VVIP duplicate detection includes selections whose month cell was auto-formatted as a date', () => {
  const { backend, selectionSheet } = createVvipBackend({
    selectionRows: [[
      '2026-08-18 08:35:20',
      'vvip@example.com',
      new Date('2026-09-01T00:00:00+08:00'),
      'vvip-cal-1',
      '2026/09/02',
      '10:00',
      '空環基礎',
      '老師甲',
      '待人工確認',
      '', '', '',
      '會員一',
      'vvip-member-1',
      '會員一',
    ]],
  });
  enableVvipMonthDateFormatting(backend);

  const result = backend.submitVvipSelection_('vvip-member-1', ['vvip-cal-1']);

  assert.equal(result.count, 1);
  assert.equal(selectionSheet.values.length, 2);
});

test('VVIP public count and admin metrics count the same active course only once', () => {
  const duplicateRows = ['08:35:20', '08:36:20', '08:37:20'].map((time) => [
    `2026-08-18 ${time}`, 'vvip@example.com', '2026-09', 'vvip-cal-1',
    '2026/09/02', '10:00', '空環基礎', '老師甲', '待人工確認',
    '', '', '', '會員一', 'vvip-member-1', '會員一',
  ]);
  const { backend, adminSession } = createVvipBackend({ selectionRows: duplicateRows });

  const publicResult = backend.getVvipSelection_('vvip-member-1');
  const dashboard = backend.getVvipAdminDashboard_(adminSession);

  assert.equal(publicResult.count, 1);
  assert.equal(publicResult.selections.length, 1);
  assert.equal(dashboard.metrics.activeSelections, 1);
  assert.equal(dashboard.members.length, 3);
  assert.deepEqual(dashboard.members.map((item) => item.memberName), ['會員一', '會員一', '會員一']);
  assert.equal(new Set(dashboard.members.map((item) => item.recordKey)).size, 3);
});

test('VVIP administrator cancels exactly the selected duplicate record', () => {
  const duplicateRows = ['08:35:20', '08:36:20', '08:37:20'].map((time) => [
    `2026-08-18 ${time}`, 'vvip@example.com', '2026-09', 'vvip-cal-1',
    '2026/09/02', '10:00', '空環基礎', '老師甲', '待人工確認',
    '', '', '', '會員一', 'vvip-member-1', '會員一',
  ]);
  const { backend, adminSession, selectionSheet } = createVvipBackend({ selectionRows: duplicateRows });
  const dashboard = backend.getVvipAdminDashboard_(adminSession);
  const middle = dashboard.members[1];

  const result = backend.cancelVvipSelection_(
    adminSession,
    middle.email,
    middle.calendarId,
    '重複送出',
    middle.recordKey
  );

  assert.equal(result.cancelled, 1);
  assert.deepEqual(selectionSheet.values.slice(1).map((row) => row[8]), [
    '待人工確認', '已取消', '待人工確認',
  ]);
  assert.equal(backend.getVvipAdminDashboard_(adminSession).metrics.activeSelections, 1);
});

test('bulk-closing OB-missing leaves marks matching VVIP choices cancelled and frees the quota', () => {
  const { backend, adminSession, leaveSheet, selectionSheet, auditSheet } = createVvipBackend({
    courseRows: [
      ['2026/09/03', '11:00', '舞綢基礎', '老師乙', 'vvip-cal-2', 'class-2', 'teacher-2', '否', ''],
    ],
    leaveRows: [[
      'stamp', '原老師甲', '2026/09/02', '10:00', '空環基礎',
      '確認中', '', '', '', 'leave-cancelled-ob', 'vvip-cal-1',
    ]],
    selectionRows: [[
      '2026-08-18 08:35:20', 'vvip@example.com', '2026-09', 'vvip-cal-1',
      '2026/09/02', '10:00', '空環基礎', '原老師甲', '已確認',
      '2026-08-18 09:00:00', '', '', '管理員甲', 'vvip-member-1', '會員一',
    ]],
  });

  const result = backend.closeMissingObCancellations_(adminSession, ['leave-cancelled-ob']);
  const publicData = backend.getVvipSelection_('vvip-member-1');

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { closed: 1, vvipCancelled: 1 });
  assert.equal(leaveSheet.values[1][5], '已取消');
  assert.equal(leaveSheet.values[1][15], '已關閉');
  assert.equal(leaveSheet.values[1][18], 'OB 已取消／代課已關閉');
  assert.equal(selectionSheet.values[1][8], '課程已取消');
  assert.equal(selectionSheet.values[1][11], 'OB 課程已取消');
  assert.equal(publicData.count, 0);
  assert.equal(publicData.selections.length, 1);
  assert.equal(publicData.selections[0].status, '課程已取消');
  assert.ok(auditSheet.values.some((row) => row[2] === '管理員關閉 OB 已取消代課'));
  assert.ok(auditSheet.values.some((row) => row[2] === 'VVIP 課程取消'));
});

test('bulk-closing a missing replacement does not cancel a VVIP choice whose original OB course still exists', () => {
  const leaveRow = [
    'stamp', '原老師甲', '2026/09/02', '10:00', '空環基礎',
    '確認中', '', '', '', 'leave-replacement-missing', 'cal-original',
  ];
  while (leaveRow.length < 21) leaveRow.push('');
  leaveRow[20] = 'cal-replacement-missing';
  const { backend, adminSession, selectionSheet } = createVvipBackend({
    courseRows: [[
      '2026/09/02', '10:00', '空環基礎', '原老師甲', 'cal-original', 'class-1', 'teacher-1', '否', '',
    ]],
    leaveRows: [leaveRow],
    selectionRows: [[
      'stamp', 'vvip@example.com', '2026-09', 'cal-original', '2026/09/02', '10:00',
      '空環基礎', '原老師甲', '已確認', '', '', '', '會員一', 'vvip-member-1', '會員一',
    ]],
  });

  const result = backend.closeMissingObCancellations_(adminSession, ['leave-replacement-missing']);

  assert.equal(result.closed, 1);
  assert.equal(result.vvipCancelled, 0);
  assert.equal(selectionSheet.values[1][8], '已確認');
});

test('bulk-closing 34 OB-missing leaves uses at most one leave write per explicit row', () => {
  const leaveRows = Array.from({ length: 34 }, (_, index) => [
    'stamp', `原老師${index + 1}`, '2026/09/02', '10:00', `課程${index + 1}`,
    '確認中', '', '', '', `leave-missing-${index + 1}`, `cal-missing-${index + 1}`,
  ]);
  const fixture = createVvipBackend({
    courseRows: [[
      '2026/09/03', '11:00', '其他課程', '老師乙', 'cal-other', 'class-2', 'teacher-2', '否', '',
    ]],
    leaveRows,
  });
  let leaveWrites = 0;
  const originalGetRange = fixture.leaveSheet.getRange.bind(fixture.leaveSheet);
  fixture.leaveSheet.getRange = (row, column, numRows = 1, numColumns = 1) => {
    const range = originalGetRange(row, column, numRows, numColumns);
    const originalSetValue = range.setValue.bind(range);
    const originalSetValues = range.setValues.bind(range);
    range.setValue = (value) => {
      leaveWrites += 1;
      return originalSetValue(value);
    };
    range.setValues = (values) => {
      leaveWrites += 1;
      return originalSetValues(values);
    };
    return range;
  };

  const result = fixture.backend.closeMissingObCancellations_(
    fixture.adminSession,
    leaveRows.map((row) => row[9])
  );

  assert.equal(result.closed, 34);
  assert.ok(leaveWrites <= 34, `expected at most 34 leave writes, got ${leaveWrites}`);
});

test('VVIP cancelled history remains visible when every active-month OB course is gone', () => {
  const { backend } = createVvipBackend({
    courseRows: [],
    selectionRows: [[
      'stamp', 'vvip@example.com', '2026-09', 'cal-cancelled', '2026/09/02', '10:00',
      '已取消課程', '原老師甲', '課程已取消', '', '2026-08-20 10:00:00',
      'OB 課程已取消', '管理員甲', 'vvip-member-1', '會員一',
    ]],
  });

  const result = backend.getVvipSelection_('vvip-member-1');

  assert.equal(result.count, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(result.courses)), []);
  assert.equal(result.selections.length, 1);
  assert.equal(result.selections[0].status, '課程已取消');
});

test('bulk-closing missing OB leaves validates the whole batch before any Sheet write', () => {
  const { backend, adminSession, leaveSheet, selectionSheet } = createVvipBackend({
    courseRows: [
      ['2026/09/03', '11:00', '仍存在課程', '老師乙', 'cal-present', 'class-2', 'teacher-2', '否', ''],
    ],
    leaveRows: [
      ['stamp', '老師甲', '2026/09/02', '10:00', '已取消課程', '確認中', '', '', '', 'leave-missing', 'cal-missing'],
      ['stamp', '老師乙', '2026/09/03', '11:00', '仍存在課程', '確認中', '', '', '', 'leave-present', 'cal-present'],
    ],
    selectionRows: [[
      'stamp', 'vvip@example.com', '2026-09', 'cal-missing', '2026/09/02', '10:00',
      '已取消課程', '老師甲', '待人工確認', '', '', '', '會員一', 'vvip-member-1', '會員一',
    ]],
  });
  const leaveBefore = JSON.stringify(leaveSheet.values);
  const vvipBefore = JSON.stringify(selectionSheet.values);

  assert.throws(
    () => backend.closeMissingObCancellations_(adminSession, ['leave-missing', 'leave-present']),
    /仍存在|重新同步|不可關閉/,
  );
  assert.equal(JSON.stringify(leaveSheet.values), leaveBefore);
  assert.equal(JSON.stringify(selectionSheet.values), vvipBefore);
});

test('bulk-closing rollback restores only selected rows and never clears a human-data sheet', () => {
  const { backend, adminSession, leaveSheet, selectionSheet, auditSheet } = createVvipBackend({
    courseRows: [
      ['2026/09/03', '11:00', '其他課程', '老師乙', 'cal-other', 'class-2', 'teacher-2', '否', ''],
    ],
    leaveRows: [
      ['stamp', '老師甲', '2026/09/02', '10:00', '已取消課程', '確認中', '', '', '', 'leave-missing', 'cal-missing'],
      ['stamp', '老師乙', '2026/09/03', '11:00', '其他課程', '已領取', '老師丙', '', '', 'leave-unrelated', 'cal-other'],
    ],
    selectionRows: [
      ['stamp', 'vvip@example.com', '2026-09', 'cal-missing', '2026/09/02', '10:00', '已取消課程', '老師甲', '已確認', '', '', '', '會員一', 'vvip-member-1', '會員一'],
      ['stamp', 'other@example.com', '2026-09', 'cal-other', '2026/09/03', '11:00', '其他課程', '老師乙', '已確認', '', '', '', '會員二', 'vvip-member-2', '會員二'],
    ],
  });
  const clearedRanges = [];
  [leaveSheet, selectionSheet].forEach((sheet) => {
    const originalGetRange = sheet.getRange.bind(sheet);
    sheet.getRange = (row, column, numRows = 1, numColumns = 1) => {
      const range = originalGetRange(row, column, numRows, numColumns);
      const originalClear = range.clearContent.bind(range);
      range.clearContent = () => {
        clearedRanges.push({ sheet: sheet.name, row, column, numRows, numColumns });
        return originalClear();
      };
      return range;
    };
  });
  injectSetValuesFailureOnce(auditSheet, ({ row }) => row >= 2, 'audit unavailable');
  const trimTrailingBlanks = (rows) => rows.map((row) => {
    const copy = row.slice();
    while (copy.length && copy[copy.length - 1] === '') copy.pop();
    return copy;
  });
  const leaveBefore = trimTrailingBlanks(leaveSheet.values);
  const vvipBefore = trimTrailingBlanks(selectionSheet.values);

  assert.throws(
    () => backend.closeMissingObCancellations_(adminSession, ['leave-missing']),
    /audit unavailable/,
  );
  assert.deepEqual(trimTrailingBlanks(leaveSheet.values), leaveBefore);
  assert.deepEqual(trimTrailingBlanks(selectionSheet.values), vvipBefore);
  assert.deepEqual(clearedRanges, []);
});

test('VVIP course rows merge leave and substitute status without duplicating selectable courses', () => {
  const courseRows = [
    ['2026/09/01', '10:00', '一般課', '一般老師', 'cal-normal', 'class-1', 'teacher-1', '否', ''],
    ['2026/09/02', '10:00', '待代課', '原老師甲', 'cal-pending', 'class-2', 'teacher-2', '否', ''],
    ['2026/09/03', '10:00', '實際代課', '代課老師乙', 'cal-claimed', 'class-3', 'teacher-3', '是', ''],
    ['2026/09/04', '10:00', '取消後正常', '原老師丙', 'cal-cancelled', 'class-4', 'teacher-4', '否', ''],
    ['2026/09/05', '10:00', '替代實際課程', '代課老師丁', 'cal-replacement', 'class-5', 'teacher-5', '是', ''],
    ['2026/09/06', '10:00', '重新請假', '原老師戊', 'cal-reopened', 'class-6', 'teacher-6', '否', ''],
  ];
  const emptyTail = Array(17).fill('');
  const leaveRows = [
    ['2026-08-01 09:00:00', '原老師甲', '2026/09/02', '10:00', '待代課', '確認中', '', '', '', 'leave-1', 'cal-pending', ...emptyTail],
    ['2026-08-01 09:05:00', '原老師乙', '2026/09/03', '10:00', '原課程', '已領取', '代課老師乙', '', '', 'leave-2', 'cal-claimed', ...emptyTail],
    ['2026-08-01 09:10:00', '原老師丙', '2026/09/04', '10:00', '取消課程', '已取消', '', '', '', 'leave-3', 'cal-cancelled', ...emptyTail],
    ['2026-08-01 09:15:00', '原老師丁', '2026/09/05', '10:00', '原始課程', '已領取', '代課老師丁', '', '', 'leave-4', 'cal-original', '', '替代實際課程', '', '改用既有 OB 課程', '', '', '', '', '', 'cal-replacement', '', '', '', '', '', '', ''],
    ['2026-08-01 09:20:00', '原老師戊', '2026/09/06', '10:00', '舊請假', '已取消', '', '', '', 'leave-5-old', 'cal-reopened', ...emptyTail],
    ['2026-08-02 09:20:00', '原老師戊', '2026/09/06', '10:00', '新請假', '確認中', '', '', '', 'leave-5-new', 'cal-reopened', ...emptyTail],
  ];
  const { backend } = createVvipBackend({ courseRows, leaveRows });

  const courses = JSON.parse(JSON.stringify(backend.getVvipCourseRows_('2026-09', true)));
  const byId = Object.fromEntries(courses.map((course) => [course.calendarId, course]));

  assert.equal(courses.length, 6);
  assert.equal(byId['cal-normal'].leaveStatus, '');
  assert.equal(byId['cal-pending'].leaveStatus, 'pending');
  assert.equal(byId['cal-pending'].leaveLabel, '原老師請假：原老師甲｜代課老師未定');
  assert.equal(byId['cal-claimed'].leaveStatus, 'claimed');
  assert.equal(byId['cal-claimed'].leaveLabel, '原老師請假：原老師乙｜代課老師：代課老師乙');
  assert.equal(byId['cal-cancelled'].leaveStatus, '');
  assert.equal(byId['cal-replacement'].originalTeacherName, '原老師丁');
  assert.equal(byId['cal-replacement'].substituteTeacherName, '代課老師丁');
  assert.equal(byId['cal-reopened'].leaveStatus, 'pending');
});

test('VVIP course rows exclude venue rental entries from public selection', () => {
  const courseRows = [
    ['2026/09/01', '10:00', 'A－空環 Lv.1', '一般老師', 'cal-normal', 'class-1', 'teacher-1', '否', ''],
    ['2026/09/01', '14:00', 'C－場地租借', '租借會員', 'cal-rental', 'class-rental', 'teacher-rental', '否', ''],
  ];
  const { backend } = createVvipBackend({ courseRows });

  const courses = JSON.parse(JSON.stringify(backend.getVvipCourseRows_('2026-09', true)));

  assert.deepEqual(courses.map((course) => course.calendarId), ['cal-normal']);
});

test('VVIP course rows exclude period courses that require direct teacher registration', () => {
  const courseRows = [
    ['2026/09/01', '10:00', 'A－空環 Lv.1', '一般老師', 'cal-normal', 'class-1', 'teacher-1', '否', ''],
    ['2026/09/01', '14:00', 'C－空環 Lv.3 技巧訓練期班', '雪莉老師', 'cal-term', 'class-term', 'teacher-term', '否', ''],
  ];
  const { backend } = createVvipBackend({ courseRows });

  const courses = JSON.parse(JSON.stringify(backend.getVvipCourseRows_('2026-09', true)));

  assert.deepEqual(courses.map((course) => course.calendarId), ['cal-normal']);
});

test('VVIP warm course reads reuse only stable CourseList data and explicit invalidation reloads it', () => {
  const { backend, courseSheet } = createVvipBackend();
  const originalGetDataRange = courseSheet.getDataRange.bind(courseSheet);
  let courseReads = 0;
  courseSheet.getDataRange = function() {
    courseReads += 1;
    return originalGetDataRange();
  };

  const first = backend.getVvipCourseRows_('2026-09', true);
  courseSheet.values[1][2] = '快取後修改課名';
  const warm = backend.getVvipCourseRows_('2026-09', true);

  assert.equal(courseReads, 1);
  assert.equal(first[0].courseName, '空環基礎');
  assert.equal(warm[0].courseName, '空環基礎');

  backend.invalidateVvipReadCaches_('2026-09');
  const refreshed = backend.getVvipCourseRows_('2026-09', true);
  assert.equal(courseReads, 2);
  assert.equal(refreshed[0].courseName, '快取後修改課名');
});

test('VVIP member maintenance invalidates the public member list cache', () => {
  const { backend, adminSession } = createVvipBackend();

  assert.deepEqual(JSON.parse(JSON.stringify(backend.getPublicVvipMembers_())), [
    { id: 'vvip-member-1', name: '會員一' },
  ]);
  backend.saveVvipMember_(adminSession, {
    name: '會員二', email: 'member2@example.com', active: true, note: '',
  });

  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.getPublicVvipMembers_())).map((item) => item.name),
    ['會員一', '會員二']
  );
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

test('VVIP selection rejects a fourth unique course without partial writes', () => {
  const { backend, selectionSheet } = createVvipBackend();
  backend.submitVvipSelection_('vvip-member-1', ['vvip-cal-1', 'vvip-cal-2', 'vvip-cal-3']);
  const before = JSON.stringify(selectionSheet.getDataRange().getValues());

  assert.throws(
    () => backend.submitVvipSelection_('vvip-member-1', ['vvip-cal-4']),
    /最多.*3 堂|上限/
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

test('payroll non-Sherry dual-teacher special course rounds each equal share like the legacy workbook', () => {
  const backend = loadBackend();
  const lines = backend.calculatePayrollLinesForCourse_({
    calendarId: 'special-duo-teachers',
    courseName: 'A－空環 雙人舞碼特別課',
    instructors: [{ name: 'Angela Chuang' }, { name: 'Lydia 慕恩' }],
    attendanceCount: 2,
    courseIncome: 3305,
  }, []);

  assert.deepEqual(JSON.parse(JSON.stringify(lines)), [
    {
      teacherName: 'Angela Chuang', amount: 992, ruleType: '雙人特別課各半',
      ruleDetail: '課程收入 3305 × 60% ÷ 2',
    },
    {
      teacherName: 'Lydia 慕恩', amount: 992, ruleType: '雙人特別課各半',
      ruleDetail: '課程收入 3305 × 60% ÷ 2',
    },
  ]);
});

test('payroll student self-practice remains visible but pays zero salary', () => {
  const backend = loadBackend();
  const lines = backend.calculatePayrollLinesForCourse_({
    calendarId: 'self-practice',
    courseName: '學員自主練習(小編專用）',
    instructors: [{ name: '共用帳號' }],
    attendanceCount: 11,
    courseIncome: 3227,
  }, []);

  assert.deepEqual(JSON.parse(JSON.stringify(lines)), [{
    teacherName: '共用帳號', amount: 0, ruleType: '學員自主練習',
    ruleDetail: '學員自主練習不計薪',
  }]);
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

test('payroll sync fetches one extra day but only drafts courses inside the requested month', () => {
  const services = createAuthServices();
  services.Utilities.formatDate = formatTaipeiDate;
  services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  const rules = createSheetFixture('薪項設定', [
    EXPECTED_PAYROLL_RULE_HEADERS,
    ['預設值', '', '人數階梯', 4, 900],
  ]);
  const source = createSheetFixture('薪資來源資料', [EXPECTED_PAYROLL_SOURCE_HEADERS]);
  const snapshot = createSheetFixture('薪資同步快照', [EXPECTED_PAYROLL_SNAPSHOT_HEADERS]);
  const lines = createSheetFixture('薪資明細', [EXPECTED_PAYROLL_LINE_HEADERS]);
  const summaries = createSheetFixture('薪資結算', [EXPECTED_PAYROLL_SUMMARY_HEADERS]);
  const disputes = createSheetFixture('薪資異議', [EXPECTED_PAYROLL_DISPUTE_HEADERS]);
  const payment = createSheetFixture('薪資付款設定', [EXPECTED_PAYROLL_PAYMENT_HEADERS]);
  const audit = createSheetFixture('操作紀錄', [['操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因']]);
  const spreadsheet = createSpreadsheetFixture([rules, source, snapshot, lines, summaries, disputes, payment, audit]);
  const pages = [[
    {
      id: 'pay-0831',
      class: { id: 'class-0831', nameZhHant: 'A－空環 Lv.1' },
      classTime: '2026-08-31T10:30:00Z',
      customersAttended: 4,
      instructors: [{ id: 'teacher-1', firstName: '月底老師' }],
    },
    {
      id: 'pay-0901',
      class: { id: 'class-0901', nameZhHant: 'A－空環 Lv.1' },
      classTime: '2026-09-01T10:30:00Z',
      customersAttended: 4,
      instructors: [{ id: 'teacher-2', firstName: '下月老師' }],
    },
  ]];
  const calls = [];
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
    UrlFetchApp: {
      fetch(url) {
        calls.push(url);
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify(pages.shift() || []),
        };
      },
    },
  });

  const result = backend.syncPayrollMonth_({
    teacherName: '管理員甲',
    role: '管理員',
    managementCapabilities: ['payroll_admin'],
  }, '2026-08');

  assert.match(calls[0], /date_to=2026-09-01/);
  assert.equal(result.courseCount, 1);
  assert.equal(result.lineCount, 1);
  assert.deepEqual(snapshot.values.slice(1).filter((row) => row[2]).map((row) => row[2]), ['pay-0831']);
  assert.deepEqual(lines.values.slice(1).filter((row) => row[3]).map((row) => row[3]), ['pay-0831']);
  assert.equal(snapshot.values.some((row) => row[1] === '2026-09'), false);
});

test('payroll dashboard recognizes month cells stored as Google Sheets dates', () => {
  const augustSheetDate = new Date('2026-08-01T00:00:00+08:00');
  const rules = createSheetFixture('薪項設定', [EXPECTED_PAYROLL_RULE_HEADERS]);
  const source = createSheetFixture('薪資來源資料', [EXPECTED_PAYROLL_SOURCE_HEADERS]);
  const snapshot = createSheetFixture('薪資同步快照', [
    EXPECTED_PAYROLL_SNAPSHOT_HEADERS,
    ['version-1', augustSheetDate, 'cal-1', '2026/08/01', '10:00', '空環', '["老師甲"]', 4, 8, '', '', 'A', '晴光', 'now', '完成'],
  ]);
  const lines = createSheetFixture('薪資明細', [
    EXPECTED_PAYROLL_LINE_HEADERS,
    [augustSheetDate, 'cal-1:老師甲', 'version-1', 'cal-1', '老師甲', '2026/08/01', '10:00', '空環', '人數階梯', 4, '', '人數階梯', '4 人', 900, 0, '', '待確認', 'now'],
  ]);
  const summaries = createSheetFixture('薪資結算', [
    EXPECTED_PAYROLL_SUMMARY_HEADERS,
    [augustSheetDate, '老師甲', 900, 0, 0, 0, 900, 1200, 'version-1', '待確認', '', 'now', 0, '', '', ''],
  ]);
  const disputes = createSheetFixture('薪資異議', [EXPECTED_PAYROLL_DISPUTE_HEADERS]);
  const payment = createSheetFixture('薪資付款設定', [EXPECTED_PAYROLL_PAYMENT_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([rules, source, snapshot, lines, summaries, disputes, payment]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);

  const result = backend.getPayrollAdminDashboard_({
    teacherName: '冠蓉', role: '管理員', managementCapabilities: ['payroll_admin'],
  }, '2026-08');

  assert.equal(result.month, '2026-08');
  assert.equal(result.version, 'version-1');
  assert.equal(result.metrics.teachers, 1);
  assert.equal(result.metrics.totalSalary, 900);
  assert.equal(result.metrics.pendingConfirmations, 1);
  assert.equal(result.lines.length, 1);
});

test('payroll publish is capability-scoped and teachers can only view confirm or dispute their own salary', () => {
  const augustSheetDate = new Date('2026-08-01T00:00:00+08:00');
  const lines = createSheetFixture('薪資明細', [
    EXPECTED_PAYROLL_LINE_HEADERS,
    [augustSheetDate, 'cal-1:老師甲', 'version-1', 'cal-1', '老師甲', '2026/08/01', '10:00', '空環', '人數階梯', 4, '', '人數階梯', '4 人', 900, 0, '', '草稿', 'now'],
    [augustSheetDate, 'cal-2:老師乙', 'version-1', 'cal-2', '老師乙', '2026/08/02', '11:00', '舞綢', '人數階梯', 5, '', '人數階梯', '5 人', 1000, 0, '', '草稿', 'now'],
  ]);
  const summaries = createSheetFixture('薪資結算', [
    EXPECTED_PAYROLL_SUMMARY_HEADERS,
    [augustSheetDate, '老師甲', 900, 0, 0, 0, 900, 1200, 'version-1', '草稿', '', 'now'],
    [augustSheetDate, '老師乙', 1000, 0, 0, 0, 1000, 1300, 'version-1', '草稿', '', 'now'],
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

test('next-day closure policy applies the approved thresholds with highest rule precedence', () => {
  const backend = loadBackend();
  const detail = (overrides = {}) => ({
    calendarId: '987',
    date: '2026/08/24',
    time: '12:30',
    courseName: 'A－空環 Lv.1',
    teacherName: '一般老師',
    enrollmentCount: 0,
    points: 1,
    cancelled: false,
    ...overrides,
  });
  const policy = (item, stage) => JSON.parse(JSON.stringify(
    backend.getCourseClosureRule_(item, stage),
  ));

  assert.deepEqual(policy(detail(), '22:30'), {
    stage: '22:30', ruleKey: 'zero', ruleLabel: '0 人關課',
    minimumEnrollment: 1, cancelAtOrBelow: 0, eligible: true,
    onlyEmpty: true, manualReview: false, reason: '',
  });
  assert.equal(policy(detail({ enrollmentCount: 1 }), '22:30').eligible, false);

  const ordinary = policy(detail({ enrollmentCount: 1 }), '23:40');
  assert.equal(ordinary.ruleKey, 'general');
  assert.equal(ordinary.minimumEnrollment, 2);
  assert.equal(ordinary.cancelAtOrBelow, 1);
  assert.equal(ordinary.eligible, true);
  assert.equal(ordinary.onlyEmpty, false);

  ['Jina', '小美', '卡拉', '卡拉 卡拉'].forEach((teacherName) => {
    const rule = policy(detail({ teacherName, enrollmentCount: 2 }), '23:40');
    assert.equal(rule.ruleKey, 'teacher-or-two-points');
    assert.equal(rule.minimumEnrollment, 3);
    assert.equal(rule.cancelAtOrBelow, 2);
    assert.equal(rule.eligible, true);
  });

  const twoPoints = policy(detail({ points: 2, enrollmentCount: 2 }), '23:40');
  assert.equal(twoPoints.ruleKey, 'teacher-or-two-points');
  assert.equal(twoPoints.eligible, true);

  const pair = policy(detail({
    courseName: '空環雙人特別課', teacherName: 'Jina', points: 2, enrollmentCount: 3,
  }), '23:40');
  assert.equal(pair.ruleKey, 'pair');
  assert.equal(pair.minimumEnrollment, 4);
  assert.equal(pair.cancelAtOrBelow, 3);
  assert.equal(pair.eligible, true);
  assert.equal(policy(detail({
    courseName: '雙人舞綢', teacherName: null, points: null, enrollmentCount: 3,
  }), '23:40').ruleKey, 'pair');
  assert.equal(policy(detail({ courseName: '雙人舞綢', enrollmentCount: 4 }), '23:40').eligible, false);
});

test('next-day closure policy always excludes venue rentals at both stages', () => {
  const backend = loadBackend();
  const detail = (courseName) => ({
    calendarId: 'rental-987',
    date: '2026/08/24',
    time: '12:30',
    courseName,
    teacherName: '',
    enrollmentCount: 0,
    points: null,
    cancelled: false,
  });

  ['C－場地租借', 'A－場租'].forEach((courseName) => {
    ['22:30', '23:40'].forEach((stage) => {
      const rule = JSON.parse(JSON.stringify(
        backend.getCourseClosureRule_(detail(courseName), stage),
      ));
      assert.equal(rule.ruleKey, 'venue-rental-excluded');
      assert.equal(rule.eligible, false);
      assert.equal(rule.onlyEmpty, false);
      assert.equal(rule.manualReview, false);
      assert.match(rule.reason, /不納入/);
    });
  });
});

test('22:30 community copy lists only courses one person short of the 23:40 minimum', () => {
  const backend = loadBackend();
  const copy = backend.buildCourseClosureSocialCopy_('2026/09/01', [
    { calendarId: '1', date: '2026/09/01', time: '12:00', courseName: 'C－柔軟度開發', teacherName: '蕃茄', enrollmentCount: 1, points: 1 },
    { calendarId: '2', date: '2026/09/01', time: '13:30', courseName: 'A－舞綢 Lv.2', teacherName: 'Lily Yellow', enrollmentCount: 1, points: 1 },
    { calendarId: '3', date: '2026/09/01', time: '18:30', courseName: 'D－空環雙人特別課', teacherName: 'Ariel', enrollmentCount: 3, points: 1 },
    { calendarId: '4', date: '2026/09/01', time: '20:00', courseName: 'B－空瑜', teacherName: 'Jina', enrollmentCount: 2, points: 1 },
    { calendarId: '5', date: '2026/09/01', time: '21:00', courseName: 'A－場地租借', teacherName: '', enrollmentCount: 0, points: 1 },
    { calendarId: '6', date: '2026/09/01', time: '21:30', courseName: 'A－空環', teacherName: '老師甲', enrollmentCount: 2, points: 1 },
  ]);

  assert.equal(copy.content, [
    '明12:00劍潭蕃茄柔軟度開發',
    '13:30晴光Lily Yellow舞綢',
    '18:30劍潭Ariel空環雙人特別課',
    '20:00晴光Jina空瑜',
    '各缺一，等到23:40',
  ].join('\n'));
  assert.deepEqual(JSON.parse(JSON.stringify(copy.calendarIds)), ['1', '2', '3', '4']);
});

test('closure result push targets course admins once and includes failure details', () => {
  const services = createAuthServices();
  const backend = loadBackend(services);
  const pushes = [];
  backend.getActiveCourseAdminNames_ = () => ['冠蓉', 'Tako'];
  backend.sendPushNotificationSafely_ = (names, message) => {
    pushes.push({ names: Array.from(names), message });
    return { attempted: true, delivered: names.length, error: '' };
  };
  const result = {
    targetDate: '2026/09/01', stage: '22:30', cancelledCount: 1,
    keptOpenCount: 0, manualReviewCount: 0, failedCount: 1,
    socialCopy: { content: '明12:00劍潭蕃茄柔軟度開發\n各缺一，等到23:40' },
    items: [{ calendarId: 'cal-fail', time: '13:30', courseName: 'A－舞綢', result: '執行失敗', error: 'OB timeout' }],
  };

  backend.notifyCourseClosureResult_(result);
  backend.notifyCourseClosureResult_(result);

  assert.equal(pushes.length, 1);
  assert.deepEqual(pushes[0].names, ['冠蓉', 'Tako']);
  assert.match(pushes[0].message.heading, /失敗/);
  assert.match(pushes[0].message.content, /A－舞綢.*cal-fail.*OB timeout/);
  assert.match(pushes[0].message.url, /view=admin&tab=closureManagement/);
});

test('23:40 closure policy sends incomplete OB details to manual review instead of guessing', () => {
  const backend = loadBackend();
  const base = {
    calendarId: '987', date: '2026/08/24', time: '12:30',
    courseName: '空環', teacherName: '老師甲', enrollmentCount: 1,
    points: 1, cancelled: false,
  };
  ['courseName', 'teacherName', 'enrollmentCount', 'points'].forEach((field) => {
    const item = { ...base };
    item[field] = null;
    const rule = JSON.parse(JSON.stringify(backend.getCourseClosureRule_(item, '23:40')));
    assert.equal(rule.manualReview, true, `${field} should require manual review`);
    assert.equal(rule.eligible, false);
    assert.match(rule.reason, /資料不完整/);
  });
});

test('closure calendar detail normalization keeps live attendance, points and display fields', () => {
  const backend = loadBackend();
  const result = backend.normalizeClosureCalendarDetail_({
    id: 987,
    class: { id: 42, nameZhHant: 'A－空環 Lv.1' },
    classTime: '2026-08-24T04:30:00.000Z',
    customersAttending: 2,
    points: 1,
    cancelled: false,
    instructors: [{ id: 7, firstName: 'Jina', lastName: '', isSubstitute: false }],
  });

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    calendarId: '987', classId: '42', date: '2026/08/24', time: '12:30',
    courseName: 'A－空環 Lv.1', teacherName: 'Jina', enrollmentCount: 2,
    points: 1, cancelled: false,
  });
});

test('OB cancellation API posts the guarded body and reads a single live calendar detail', () => {
  const requests = [];
  const backend = loadBackend({
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => key === 'OMCEAN_CANCEL_CALENDAR_PATH'
          ? '/v1/calendar/{id}/cancel'
          : '',
      }),
    },
    UrlFetchApp: {
      fetch(url, options) {
        requests.push({ url, options });
        const body = {
          id: 987,
          class: { id: 42, nameZhHant: 'A－空環 Lv.1' },
          classTime: '2026-08-24T04:30:00.000Z',
          customersAttending: 1,
          points: 1,
          cancelled: options.method === 'post',
          instructors: [{ id: 7, firstName: 'Jina', lastName: '' }],
        };
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify(body),
        };
      },
    },
  });

  const before = backend.fetchCalendarDetail_('token-for-test', '987');
  const cancelled = backend.cancelObCalendarItem_(
    'token-for-test', '987', '未達開課人數', false,
  );

  assert.equal(before.enrollmentCount, 1);
  assert.equal(cancelled.cancelled, true);
  assert.equal(requests[0].url, 'https://api.omceanbooking.com/v1/calendar/987');
  assert.equal(requests[0].options.method, 'get');
  assert.equal(requests[1].url, 'https://api.omceanbooking.com/v1/calendar/987/cancel');
  assert.equal(requests[1].options.method, 'post');
  assert.deepEqual(JSON.parse(requests[1].options.payload), {
    reason: '未達開課人數', onlyEmpty: false,
  });
  assert.equal(requests[1].options.headers.Authorization, 'Bearer token-for-test');
  assert.equal(JSON.stringify(cancelled).includes('token-for-test'), false);
});

test('course closure structure is additive and defaults to manual mode', () => {
  const spreadsheet = createSpreadsheetFixture([]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);

  const result = backend.ensureCourseClosureStructureUnlocked_(spreadsheet);

  assert.deepEqual(spreadsheet.getSheetByName('關課設定').values[0], EXPECTED_COURSE_CLOSURE_SETTING_HEADERS);
  assert.deepEqual(spreadsheet.getSheetByName('關課紀錄').values[0], EXPECTED_COURSE_CLOSURE_LOG_HEADERS);
  assert.equal(result.mode, 'manual');
  assert.equal(spreadsheet.getSheetByName('關課設定').values[1][0], 'executionMode');
  assert.equal(spreadsheet.getSheetByName('關課設定').values[1][1], 'manual');
});

test('next-day closure re-reads latest enrollment, logs idempotently, and preserves formal workflow sheets', () => {
  const services = createAuthServices();
  services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  services.Utilities.formatDate = (value, _timezone, pattern) => {
    const date = new Date(value);
    if (pattern === 'yyyy-MM-dd HH:mm:ss') return date.toISOString().replace('T', ' ').slice(0, 19);
    if (pattern === 'yyyy/MM/dd') return '2026/08/24';
    if (pattern === 'HH:mm') return '12:30';
    return '';
  };
  const leaveSheet = createSheetFixture('請假代課紀錄', [
    EXPECTED_LEAVE_HEADERS.concat(EXPECTED_LEAVE_EXTENSION_HEADERS, EXPECTED_SPECIAL_COURSE_HEADERS, EXPECTED_ORDINARY_DELAY_HEADERS),
    ['formal-human-value', '老師甲', '2026/09/01', '12:30', '空環', '確認中'],
  ]);
  const invitationSheet = createSheetFixture('代課邀請', [
    ['邀請編號', '老師', '開放時間', '首次查看時間', '狀態', '關閉時間'],
    ['invite-human-value', '老師乙', '', '', '開放中', ''],
  ]);
  const closureSettingSheet = createSheetFixture('關課設定', [
    EXPECTED_COURSE_CLOSURE_SETTING_HEADERS,
    ['executionMode', 'manual', '', '管理員', ''],
  ]);
  const closureLogSheet = createSheetFixture('關課紀錄', [EXPECTED_COURSE_CLOSURE_LOG_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([leaveSheet, invitationSheet, closureSettingSheet, closureLogSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  const leaveBefore = JSON.stringify(leaveSheet.values);
  const invitationBefore = JSON.stringify(invitationSheet.values);
  let detailReads = 0;
  let cancellations = 0;
  let fetchedWindow = null;
  backend.fetchCalendarPages_ = (_token, dateFrom, dateTo) => {
    fetchedWindow = { dateFrom, dateTo };
    return [{
    id: 987, classTime: '2026-08-24T04:30:00.000Z', customersAttending: 0, points: 1,
    class: { id: 9, nameZhHant: 'A－空環 Lv.1' }, instructors: [{ id: 2, name: '老師甲' }],
    }];
  };
  backend.fetchCalendarDetail_ = () => {
    detailReads += 1;
    return {
      calendarId: '987', date: '2026/08/24', time: '12:30', courseName: 'A－空環 Lv.1',
      teacherName: '老師甲', enrollmentCount: 0, points: 1, cancelled: false,
    };
  };
  backend.cancelObCalendarItem_ = (_token, calendarId, reason, onlyEmpty) => {
    cancellations += 1;
    assert.equal(calendarId, '987');
    assert.match(reason, /2026\/08\/24 12:30 A－空環 Lv\.1/);
    assert.equal(onlyEmpty, true);
    return { calendarId: '987', cancelled: true };
  };

  const first = backend.executeNextDayClosuresCore_('管理員甲', '22:30', '2026/08/24');
  const second = backend.executeNextDayClosuresCore_('管理員甲', '22:30', '2026/08/24');

  assert.equal(first.cancelledCount, 1);
  assert.equal(second.cancelledCount, 0);
  assert.equal(second.alreadyProcessedCount, 1);
  assert.equal(detailReads, 1);
  assert.equal(cancellations, 1);
  assert.deepEqual(fetchedWindow, {
    dateFrom: '2026-08-24',
    dateTo: '2026-08-25',
  });
  assert.equal(closureLogSheet.values.length, 2);
  assert.equal(closureLogSheet.values[1][9], '已取消');
  assert.equal(JSON.stringify(leaveSheet.values), leaveBefore);
  assert.equal(JSON.stringify(invitationSheet.values), invitationBefore);
});

test('manual next-day closure derives the target date on the server instead of trusting the browser value', () => {
  const backend = loadBackend();
  let received = null;
  backend.assertCapabilitySession_ = () => '管理員甲';
  backend.getTomorrowDate_ = () => '2026/08/24';
  backend.executeNextDayClosuresCore_ = (actor, stage, targetDate) => {
    received = { actor, stage, targetDate };
    return { cancelledCount: 0, failedCount: 0, items: [] };
  };
  backend.assertManualCourseClosureStageAvailable_ = () => '23:40';

  backend.executeNextDayClosures_({}, '22:30', '瀏覽器送來的錯誤日期');

  assert.deepEqual(received, {
    actor: '管理員甲',
    stage: '22:30',
    targetDate: '2026/08/24',
  });
});

test('manual next-day closure cannot execute before its configured stage time', () => {
  const services = createAuthServices();
  services.Utilities.formatDate = (_value, _timezone, pattern) => {
    if (pattern === 'HH:mm') return '23:10';
    if (pattern === 'yyyy/MM/dd') return '2026/08/24';
    return '';
  };
  const backend = loadBackend(services);
  let coreCalls = 0;
  backend.assertCapabilitySession_ = () => 'Tako';
  backend.executeNextDayClosuresCore_ = () => {
    coreCalls += 1;
    return {};
  };

  assert.throws(
    () => backend.executeNextDayClosures_({}, '23:40'),
    /23:40 檢核尚未到可執行時間/,
  );
  assert.equal(coreCalls, 0);
});

test('manual next-day closure executes at or after its configured stage time', () => {
  const services = createAuthServices();
  services.Utilities.formatDate = (_value, _timezone, pattern) => {
    if (pattern === 'HH:mm') return '23:40';
    if (pattern === 'yyyy/MM/dd') return '2026/08/24';
    return '';
  };
  const backend = loadBackend(services);
  let received = null;
  backend.assertCapabilitySession_ = () => 'Tako';
  backend.executeNextDayClosuresCore_ = (actor, stage, targetDate) => {
    received = { actor, stage, targetDate };
    return { cancelledCount: 0, failedCount: 0, items: [] };
  };

  backend.executeNextDayClosures_({}, '23:40');

  assert.deepEqual(received, {
    actor: 'Tako',
    stage: '23:40',
    targetDate: '2026/08/24',
  });
});

test('repeat closure reports prior cancellations even when cancelled rows disappear from OB list', () => {
  const services = createAuthServices();
  services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  const closureSettingSheet = createSheetFixture('關課設定', [
    EXPECTED_COURSE_CLOSURE_SETTING_HEADERS,
    ['executionMode', 'manual', '', '管理員', ''],
  ]);
  const closureLogSheet = createSheetFixture('關課紀錄', [
    EXPECTED_COURSE_CLOSURE_LOG_HEADERS,
    ['2026-08-23 23:10:00', '2026/08/24', '23:40', '987', 'A－空瑜 Lv.0', 'Tako', 1, '一般課至少 2 人', '否', '已取消', '', 'Tako'],
    ['2026-08-23 23:10:01', '2026/08/24', '23:40', '988', 'A－空瑜 Lv.1-2〈優惠〉', '妙妙 簡', 2, '指定老師／2 點課至少 3 人', '否', '已取消', '', 'Tako'],
  ]);
  const spreadsheet = createSpreadsheetFixture([closureSettingSheet, closureLogSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  backend.fetchCalendarPages_ = () => [];

  const result = backend.executeNextDayClosuresCore_('Tako', '23:40', '2026/08/24');

  assert.equal(result.cancelledCount, 0);
  assert.equal(result.alreadyProcessedCount, 2);
});

test('closure idempotency ignores malformed historical log rows instead of blocking the run', () => {
  const backend = loadBackend();
  const logSheet = createSheetFixture('關課紀錄', [
    EXPECTED_COURSE_CLOSURE_LOG_HEADERS,
    ['now', '', '22:30', 'bad-row', '', '', '', '', '', '已取消', '', ''],
    ['now', '2026/08/24', '22:30', '987', '空環', '老師甲', 0, '0 人關課', '是', '已取消', '', '管理員'],
  ]);

  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.getProcessedClosureKeysUnlocked_(logSheet, '2026/08/24', '22:30'))),
    { 987: true },
  );
});

test('23:40 next-day closure keeps a class when the latest re-read reaches minimum enrollment', () => {
  const services = createAuthServices();
  services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  services.Utilities.formatDate = (value, _timezone, pattern) => {
    const date = new Date(value);
    if (pattern === 'yyyy-MM-dd HH:mm:ss') return date.toISOString().replace('T', ' ').slice(0, 19);
    if (pattern === 'yyyy/MM/dd') return '2026/08/24';
    if (pattern === 'HH:mm') return '12:30';
    return '';
  };
  const closureSettingSheet = createSheetFixture('關課設定', [
    EXPECTED_COURSE_CLOSURE_SETTING_HEADERS,
    ['executionMode', 'manual', '', '管理員', ''],
  ]);
  const closureLogSheet = createSheetFixture('關課紀錄', [EXPECTED_COURSE_CLOSURE_LOG_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([closureSettingSheet, closureLogSheet]);
  const backend = loadBackend({
    ...services,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  backend.fetchCalendarPages_ = () => [{
    id: 988, classTime: '2026-08-24T04:30:00.000Z', customersAttending: 1, points: 1,
    class: { id: 9, nameZhHant: 'A－空環 Lv.1' }, instructors: [{ id: 2, name: '老師甲' }],
  }];
  backend.fetchCalendarDetail_ = () => ({
    calendarId: '988', date: '2026/08/24', time: '12:30', courseName: 'A－空環 Lv.1',
    teacherName: '老師甲', enrollmentCount: 2, points: 1, cancelled: false,
  });
  backend.cancelObCalendarItem_ = () => { throw new Error('must not cancel'); };

  const result = backend.executeNextDayClosuresCore_('系統自動關課', '23:40', '2026/08/24');

  assert.equal(result.cancelledCount, 0);
  assert.equal(result.keptOpenCount, 1);
  assert.equal(closureLogSheet.values.length, 2);
  assert.equal(closureLogSheet.values[1][9], '人數已足，保留開課');
});

test('course closure mode switch never calls ScriptApp after the scheduler is installed', () => {
  const services = createAuthServices();
  const settingSheet = createSheetFixture('關課設定', [EXPECTED_COURSE_CLOSURE_SETTING_HEADERS]);
  const logSheet = createSheetFixture('關課紀錄', [EXPECTED_COURSE_CLOSURE_LOG_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([settingSheet, logSheet]);
  let scriptAppCalls = 0;
  const ScriptApp = {
    getProjectTriggers() { scriptAppCalls += 1; throw new Error('web request must not read triggers'); },
    newTrigger() { scriptAppCalls += 1; throw new Error('web request must not create triggers'); },
    deleteTrigger() { scriptAppCalls += 1; throw new Error('web request must not delete triggers'); },
  };
  const backend = loadBackend({
    ...services,
    ScriptApp,
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  const admin = { teacherName: '管理員甲', role: '管理員', managementCapabilities: ['course_admin'] };

  assert.throws(() => backend.setCourseClosureAutomation_(admin, true), /權杖/);
  services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  services.PropertiesService.getScriptProperties().setProperty(
    'COURSE_CLOSURE_SCHEDULER_INSTALLED_AT',
    '2026-08-24 22:00:00',
  );
  const enabled = backend.setCourseClosureAutomation_(admin, true);
  const enabledAgain = backend.setCourseClosureAutomation_(admin, true);
  assert.equal(enabled.mode, 'auto');
  assert.equal(enabledAgain.mode, 'auto');
  assert.equal(enabled.triggerCount, 1);

  const disabled = backend.setCourseClosureAutomation_(admin, false);
  assert.equal(disabled.mode, 'manual');
  assert.equal(disabled.triggerCount, 1);
  assert.equal(scriptAppCalls, 0);
  assert.equal(
    services.PropertiesService.getScriptProperties().getProperty('COURSE_CLOSURE_SCHEDULER_INSTALLED_AT'),
    '2026-08-24 22:00:00',
  );
});

test('course closure auto mode gives a friendly instruction before scheduler installation', () => {
  const services = createAuthServices();
  services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  const settingSheet = createSheetFixture('關課設定', [EXPECTED_COURSE_CLOSURE_SETTING_HEADERS]);
  const logSheet = createSheetFixture('關課紀錄', [EXPECTED_COURSE_CLOSURE_LOG_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([settingSheet, logSheet]);
  const backend = loadBackend({
    ...services,
    ScriptApp: {
      getProjectTriggers() { throw new Error('web request must not read triggers'); },
    },
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  const admin = { teacherName: '管理員甲', role: '管理員', managementCapabilities: ['course_admin'] };

  assert.throws(
    () => backend.setCourseClosureAutomation_(admin, true),
    /尚未安裝自動關課排程.*installCourseClosureScheduler/,
  );
});

test('course closure dashboard reads scheduler installation state without ScriptApp scope', () => {
  const services = createAuthServices();
  const settingSheet = createSheetFixture('關課設定', [
    EXPECTED_COURSE_CLOSURE_SETTING_HEADERS,
    ['executionMode', 'manual', '', '管理員甲', ''],
  ]);
  const logSheet = createSheetFixture('關課紀錄', [EXPECTED_COURSE_CLOSURE_LOG_HEADERS]);
  const spreadsheet = createSpreadsheetFixture([settingSheet, logSheet]);
  const backend = loadBackend({
    ...services,
    ScriptApp: {
      getProjectTriggers() {
        throw new Error('你沒有呼叫「ScriptApp.getProjectTriggers」的權限。必要權限：https://www.googleapis.com/auth/script.scriptapp。');
      },
    },
    SpreadsheetApp: { getActiveSpreadsheet() { return spreadsheet; } },
  });
  backend.getUnclaimedSubstituteClosureCandidates_ = () => [];
  const admin = { teacherName: '管理員甲', role: '管理員', managementCapabilities: ['course_admin'] };

  const result = backend.getCourseClosureDashboard_(admin);

  assert.equal(result.mode, 'manual');
  assert.equal(result.automatic, false);
  assert.equal(result.triggerCount, 0);
  assert.equal(result.triggerAuthorizationRequired, false);
  assert.equal(result.triggerInstallationRequired, true);
});

test('course closure scheduler installer is idempotent and records successful installation', () => {
  const services = createAuthServices();
  const triggers = [];
  const ScriptApp = {
    getProjectTriggers: () => triggers.slice(),
    newTrigger(handler) {
      const trigger = { handler, getHandlerFunction: () => handler };
      return {
        timeBased() { return this; },
        everyMinutes(minutes) { trigger.minutes = minutes; return this; },
        create() { triggers.push(trigger); return trigger; },
      };
    },
  };
  const backend = loadBackend({ ...services, ScriptApp });

  const installed = backend.installCourseClosureScheduler();
  const installedAgain = backend.installCourseClosureScheduler();

  assert.equal(triggers.length, 1);
  assert.equal(triggers[0].handler, 'runCourseClosureScheduler');
  assert.equal(triggers[0].minutes, 5);
  assert.equal(installed.triggerCount, 1);
  assert.equal(installed.created, true);
  assert.equal(installedAgain.triggerCount, 1);
  assert.equal(installedAgain.created, false);
  assert.match(
    services.PropertiesService.getScriptProperties().getProperty('COURSE_CLOSURE_SCHEDULER_INSTALLED_AT'),
    /^\d{4}-\d{2}-\d{2} /,
  );
});

test('course closure authorization helper requests trigger and mail scopes together', () => {
  const services = createAuthServices();
  let triggerReads = 0;
  let quotaReads = 0;
  const triggers = [];
  const backend = loadBackend({
    ...services,
    ScriptApp: {
      getProjectTriggers() {
        triggerReads += 1;
        return triggers.slice();
      },
      newTrigger(handler) {
        const trigger = { handler, getHandlerFunction: () => handler };
        return {
          timeBased() { return this; },
          everyMinutes(minutes) { trigger.minutes = minutes; return this; },
          create() { triggers.push(trigger); return trigger; },
        };
      },
    },
    MailApp: {
      getRemainingDailyQuota() {
        quotaReads += 1;
        return 88;
      },
    },
  });

  const result = backend.authorizeCourseClosureServices();

  assert.equal(triggerReads, 2);
  assert.equal(quotaReads, 1);
  assert.equal(triggers.length, 1);
  assert.equal(triggers[0].handler, 'runCourseClosureScheduler');
  assert.equal(triggers[0].minutes, 5);
  assert.equal(result.authorized, true);
  assert.equal(result.installed, true);
  assert.equal(result.created, true);
  assert.equal(result.triggerCount, 1);
  assert.equal(result.remainingMailQuota, 88);
  assert.match(result.installedAt, /^\d{4}-\d{2}-\d{2} /);
});

test('course closure scheduler only opens bounded windows for the two approved stages', () => {
  const backend = loadBackend();
  assert.equal(backend.getCourseClosureDueStage_('22:29'), '');
  assert.equal(backend.getCourseClosureDueStage_('22:30'), '22:30');
  assert.equal(backend.getCourseClosureDueStage_('22:39'), '22:30');
  assert.equal(backend.getCourseClosureDueStage_('22:40'), '');
  assert.equal(backend.getCourseClosureDueStage_('23:40'), '23:40');
  assert.equal(backend.getCourseClosureDueStage_('23:49'), '23:40');
  assert.equal(backend.getCourseClosureDueStage_('23:50'), '');
});

test('next-month unclaimed substitute closure is manual, only-empty, and closes rows only after OB confirms cancellation', () => {
  const leaveRows = [
    ['2026-08-20', '老師甲', '2026/09/05', '10:00', 'A－空環', '確認中', '', '', '', 'leave-empty', 'cal-empty'],
    ['2026-08-20', '老師乙', '2026/09/06', '11:00', 'B－舞綢', '確認中', '', '', '', 'leave-booked', 'cal-booked'],
    ['2026-08-20', '租借會員', '2026/09/06', '12:00', 'C－場地租借', '確認中', '', '', '', 'leave-rental', 'cal-rental'],
    ['2026-08-20', '老師丙', '2026/09/07', '12:00', 'C－空瑜', '已領取', '老師甲', '', '', 'leave-claimed', 'cal-claimed'],
    ['2026-08-20', '老師丙', '2026/10/01', '13:00', 'D－空環', '確認中', '', '', '', 'leave-other-month', 'cal-other'],
  ];
  const fixture = createInvitationBackend({ leaveRows, nextMonth: '2026-09' });
  fixture.services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  const cancelCalls = [];
  fixture.backend.fetchCalendarDetail_ = (_token, calendarId) => ({
    calendarId,
    date: calendarId === 'cal-empty' ? '2026/09/05' : '2026/09/06',
    time: calendarId === 'cal-empty' ? '10:00' : '11:00',
    courseName: calendarId === 'cal-empty' ? 'A－空環' : 'B－舞綢',
    teacherName: '老師甲',
    enrollmentCount: calendarId === 'cal-empty' ? 0 : 1,
    points: 1,
    cancelled: false,
  });
  fixture.backend.cancelObCalendarItem_ = (_token, calendarId, _reason, onlyEmpty) => {
    cancelCalls.push({ calendarId, onlyEmpty });
    return { calendarId, cancelled: true };
  };

  const candidates = fixture.backend.getUnclaimedSubstituteClosureCandidates_(fixture.adminSession);
  assert.deepEqual(candidates.map((item) => item.substituteId), ['leave-empty', 'leave-booked']);

  const result = fixture.backend.closeUnclaimedSubstituteCourses_(
    fixture.adminSession,
    ['leave-empty', 'leave-booked']
  );

  assert.equal(result.closed, 1);
  assert.equal(result.booked, 1);
  assert.deepEqual(cancelCalls, [{ calendarId: 'cal-empty', onlyEmpty: true }]);
  assert.equal(fixture.leaveSheet.values[1][5], '已取消');
  assert.equal(fixture.leaveSheet.values[1][8], '已完成');
  assert.equal(fixture.leaveSheet.values[2][5], '確認中');
  assert.equal(fixture.leaveSheet.values[3][5], '確認中');
  assert.equal(fixture.leaveSheet.values[4][5], '已領取');
  assert.equal(fixture.leaveSheet.values[5][5], '確認中');
});

test('next-month unclaimed closure rechecks live OB name and never cancels a venue rental', () => {
  const fixture = createInvitationBackend({
    nextMonth: '2026-09',
    leaveRows: [[
      '2026-08-20', '老師甲', '2026/09/05', '10:00', 'A－空環',
      '確認中', '', '', '', 'leave-stale-rental', 'cal-stale-rental',
    ]],
  });
  fixture.services.PropertiesService.getScriptProperties().setProperty('OMCEAN_API_TOKEN', 'test-token');
  fixture.backend.fetchCalendarDetail_ = () => ({
    calendarId: 'cal-stale-rental', date: '2026/09/05', time: '10:00',
    courseName: 'C－場地租借', teacherName: '', enrollmentCount: 0,
    points: null, cancelled: false,
  });
  let cancellations = 0;
  fixture.backend.cancelObCalendarItem_ = () => {
    cancellations += 1;
    return { calendarId: 'cal-stale-rental', cancelled: true };
  };

  const result = fixture.backend.closeUnclaimedSubstituteCourses_(
    fixture.adminSession,
    ['leave-stale-rental'],
  );

  assert.equal(result.excluded, 1);
  assert.equal(result.closed, 0);
  assert.equal(result.failed, 0);
  assert.equal(cancellations, 0);
  assert.equal(fixture.leaveSheet.values[1][5], '確認中');
  assert.equal(result.items[0].result, '場地租借，未取消');
});

test('practice intervals enforce five-minute steps and a fifteen-minute minimum', () => {
  const backend = loadBackend();

  const interval = backend.normalizePracticeInterval_('2026/09/10', '14:05', '14:20');

  assert.equal(interval.date, '2026/09/10');
  assert.equal(interval.startTime, '14:05');
  assert.equal(interval.endTime, '14:20');
  assert.equal(interval.durationMinutes, 15);
  assert.throws(
    () => backend.normalizePracticeInterval_('2026/09/10', '14:03', '14:20'),
    /5 分鐘/
  );
  assert.throws(
    () => backend.normalizePracticeInterval_('2026/09/10', '14:05', '14:15'),
    /至少 15 分鐘/
  );
});

test('practice intervals use Taipei timestamps independent of the device timezone', () => {
  const backend = loadBackend();

  const interval = backend.normalizePracticeInterval_('2026/09/10', '00:05', '01:05');

  assert.equal(new Date(interval.startMs).toISOString(), '2026-09-09T16:05:00.000Z');
  assert.equal(new Date(interval.endMs).toISOString(), '2026-09-09T17:05:00.000Z');
});

test('practice conflicts include an exact fifteen-minute turnover buffer', () => {
  const backend = loadBackend();
  const practice = backend.normalizePracticeInterval_('2026/09/10', '14:00', '15:00');
  const blocked = backend.normalizePracticeInterval_('2026/09/10', '15:10', '16:10');
  const allowed = backend.normalizePracticeInterval_('2026/09/10', '15:15', '16:15');

  assert.equal(backend.practiceIntervalsConflict_(practice, blocked, 15), true);
  assert.equal(backend.practiceIntervalsConflict_(practice, allowed, 15), false);
});

test('practice quick durations expose only sixty ninety and one hundred twenty minutes', () => {
  const backend = loadBackend();
  const blocker = backend.normalizePracticeInterval_('2026/09/10', '15:40', '17:00');

  const options = backend.getPracticeQuickDurationOptions_(
    { date: '2026/09/10', startTime: '14:00' },
    [{ interval: blocker, label: 'A－空環' }]
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(options)),
    [
      { minutes: 60, available: true, reason: '' },
      { minutes: 90, available: false, reason: '與 A－空環 的前後 15 分鐘緩衝衝突' },
      { minutes: 120, available: false, reason: '與 A－空環 的前後 15 分鐘緩衝衝突' },
    ]
  );
});

test('practice structure is isolated and preserves formal course rows across reruns', () => {
  const courseRow = ['2026/09/10', '14:00', 'A－空環 Lv.1', '老師甲', 'cal-1', 'class-1', 'teacher-1', '否', 'stamp'];
  const courseSheet = createSheetFixture('CourseList', [EXPECTED_COURSE_HEADERS, courseRow]);
  const spreadsheet = createSpreadsheetFixture([courseSheet]);
  const backend = loadBackendWithSpreadsheet(spreadsheet);

  backend.ensurePracticeStructure_();
  backend.ensurePracticeStructure_();

  assert.deepEqual(courseSheet.values, [EXPECTED_COURSE_HEADERS, courseRow]);
  assert.deepEqual(
    spreadsheet.sheets.map((sheet) => sheet.getName()).sort(),
    ['CourseList', '自主練習系列', '自主練習場次', '自主練習參與者', '自主練習例外', '自主練習操作紀錄'].sort()
  );
});

test('practice day view separates OB classes rentals and shared practice by room', () => {
  const backend = loadBackend();
  const day = backend.buildPracticeDayView_(
    {
      bookings: [{
        bookingId: 'practice-1', seriesId: '', date: '2026/09/10', room: 'A',
        startTime: '16:00', endTime: '17:00', status: '已成立', creatorName: '小琪',
        waitlistCalendarId: '', reason: ''
      }],
      participants: [
        { participantId: 'part-1', bookingId: 'practice-1', teacherName: '小琪', role: '建立者', startTime: '16:00', endTime: '17:00', status: '有效' },
        { participantId: 'part-2', bookingId: 'practice-1', teacherName: 'Ariel Lu', role: '參與者', startTime: '16:30', endTime: '17:00', status: '有效' },
      ],
    },
    [
      ['2026/09/10', '14:00', 'A－空環 Lv.1', '老師甲', 'cal-class'],
      ['2026/09/10', '18:00', 'B－場地租借', '租借者', 'cal-rental'],
      ['2026/09/11', '14:00', 'C－舞綢 Lv.1', '老師乙', 'cal-other-day'],
    ],
    '2026/09/10'
  );

  assert.equal(day.date, '2026/09/10');
  assert.deepEqual(JSON.parse(JSON.stringify(day.rooms.map((room) => room.room))), ['A', 'B', 'C', 'D']);
  assert.deepEqual(JSON.parse(JSON.stringify(day.rooms[0].blocks.map((block) => block.type))), ['course', 'practice']);
  assert.deepEqual(JSON.parse(JSON.stringify(day.rooms[0].blocks[1].participants.map((item) => item.teacherName))), ['小琪', 'Ariel Lu']);
  assert.deepEqual(JSON.parse(JSON.stringify(day.rooms[1].blocks.map((block) => block.type))), ['rental']);
  assert.equal(day.rooms[2].blocks.length, 0);
});

test('practice create stores one UUID booking and its creator without touching CourseList', () => {
  const fixture = createPracticeBackend();
  const beforeCourses = JSON.parse(JSON.stringify(fixture.courseSheet.values));

  const result = fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '15:00', recurrence: 'once',
  });

  assert.equal(result.status, '已成立');
  assert.ok(result.bookingId);
  assert.equal(fixture.bookingSheet.values.length, 2);
  assert.equal(fixture.bookingSheet.values[1][0], result.bookingId);
  assert.equal(fixture.bookingSheet.values[1][7], '小琪');
  assert.equal(fixture.participantSheet.values.length, 2);
  assert.equal(fixture.participantSheet.values[1][3], '小琪');
  assert.equal(fixture.participantSheet.values[1][4], '建立者');
  assert.deepEqual(fixture.courseSheet.values, beforeCourses);
});

test('practice join keeps participant-specific times and creator exit hands ownership over', () => {
  const fixture = createPracticeBackend();
  const created = fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '16:00', recurrence: 'once',
  });

  fixture.backend.joinPracticeBooking_(fixture.teacher('Ariel Lu'), {
    bookingId: created.bookingId, startTime: '15:00', endTime: '16:00', scope: 'once',
  });
  const result = fixture.backend.leavePracticeBooking_(fixture.teacher('小琪'), {
    bookingId: created.bookingId, scope: 'once',
  });

  assert.equal(result.bookingStatus, '已成立');
  assert.equal(result.newCreatorName, 'Ariel Lu');
  assert.equal(fixture.bookingSheet.values[1][7], 'Ariel Lu');
  assert.equal(fixture.participantSheet.values[1][8], '已退出');
  assert.equal(fixture.participantSheet.values[2][3], 'Ariel Lu');
  assert.equal(fixture.participantSheet.values[2][4], '建立者');
  assert.equal(fixture.participantSheet.values[2][5], '15:00');
});

test('practice creation rejects formal blockers and points overlapping teachers to join', () => {
  const fixture = createPracticeBackend({
    courseRows: [[
      '2026/09/10', '14:00', 'A－空環 Lv.1', '老師甲',
      'cal-1', 'class-1', 'teacher-1', '否', 'stamp',
    ]],
  });

  assert.throws(
    () => fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
      date: '2026/09/10', room: 'A', startTime: '15:10', endTime: '16:10', recurrence: 'once',
    }),
    /正式課程.*15 分鐘/
  );

  const first = fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'B', startTime: '16:00', endTime: '17:00', recurrence: 'once',
  });
  assert.ok(first.bookingId);
  assert.throws(
    () => fixture.backend.createPracticeBooking_(fixture.teacher('Ariel Lu'), {
      date: '2026/09/10', room: 'B', startTime: '16:30', endTime: '17:30', recurrence: 'once',
    }),
    /已有.*自主練習.*加入/
  );
});

test('practice weekly recurrence keeps a cancelled occurrence as an exception', () => {
  const fixture = createPracticeBackend({
    courseRows: [
      ['2026/09/10', '08:00', 'D－空環', '老師甲', 'cal-1'],
      ['2026/09/17', '08:00', 'D－空環', '老師甲', 'cal-2'],
      ['2026/09/24', '08:00', 'D－空環', '老師甲', 'cal-3'],
    ],
  });
  const created = fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '15:00', recurrence: 'weekly',
  });
  const occurrence = fixture.bookingSheet.values.find((row) => row[2] === '2026/09/17');

  fixture.backend.leavePracticeBooking_(fixture.teacher('小琪'), {
    bookingId: occurrence[0], scope: 'once',
  });
  fixture.backend.expandPracticeSeries_(created.seriesId, '2026/09/24');

  assert.equal(fixture.bookingSheet.values.filter((row) => row[1] === created.seriesId).length, 3);
  assert.equal(occurrence[6], '已取消');
  assert.equal(fixture.exceptionSheet.values.length, 2);
  assert.equal(fixture.exceptionSheet.values[1][2], '2026/09/17');
});

test('practice future join and creator exit preserve participants across the weekly series', () => {
  const fixture = createPracticeBackend({
    courseRows: [
      ['2026/09/10', '08:00', 'D－空環', '老師甲', 'cal-1'],
      ['2026/09/17', '08:00', 'D－空環', '老師甲', 'cal-2'],
      ['2026/09/24', '08:00', 'D－空環', '老師甲', 'cal-3'],
    ],
  });
  const created = fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '16:00', recurrence: 'weekly',
  });

  fixture.backend.joinPracticeBooking_(fixture.teacher('Ariel Lu'), {
    bookingId: created.bookingId, startTime: '15:00', endTime: '16:00', scope: 'future',
  });
  fixture.backend.leavePracticeBooking_(fixture.teacher('小琪'), {
    bookingId: created.bookingId, scope: 'future',
  });

  const bookings = fixture.bookingSheet.values.slice(1).filter((row) => row[1] === created.seriesId);
  const activeAriel = fixture.participantSheet.values.slice(1).filter((row) => (
    row[2] === created.seriesId && row[3] === 'Ariel Lu' && row[8] === '有效'
  ));
  const leftCreator = fixture.participantSheet.values.slice(1).filter((row) => (
    row[2] === created.seriesId && row[3] === '小琪' && row[8] === '已退出'
  ));
  assert.equal(activeAriel.length, 3);
  assert.equal(leftCreator.length, 3);
  assert.ok(bookings.every((row) => row[6] === '已成立' && row[7] === 'Ariel Lu'));
  assert.equal(fixture.seriesSheet.values[1][1], 'Ariel Lu');
  assert.equal(fixture.seriesSheet.values[1][8], '啟用中');
});

test('practice candidate activates only after a successful OB check confirms the linked course is gone', () => {
  const fixture = createPracticeBackend({
    courseRows: [[
      '2026/09/10', '14:00', 'A－空環 Lv.1', '老師甲',
      'cal-wait', 'class-1', 'teacher-1', '否', 'stamp',
    ]],
  });
  const candidate = fixture.backend.createPracticeWaitlist_(fixture.teacher('小琪'), {
    calendarId: 'cal-wait', startTime: '14:00', endTime: '15:00', recurrence: 'once',
  });
  assert.equal(fixture.bookingSheet.values[1][6], '候補');

  fixture.backend.getPracticeCurrentObRows_ = () => [];
  const result = fixture.backend.reconcilePracticeBookings_({
    today: '2026/09/10', throughDate: '2026/09/10',
  });

  assert.equal(result.activated, 1);
  assert.equal(result.cancelled, 0);
  assert.equal(fixture.bookingSheet.values[1][0], candidate.bookingId);
  assert.equal(fixture.bookingSheet.values[1][6], '已成立');
});

test('practice candidate stays pending while its linked OB course still exists', () => {
  const courseRow = [
    '2026/09/10', '14:00', 'A－空環 Lv.1', '老師甲',
    'cal-wait', 'class-1', 'teacher-1', '否', 'stamp',
  ];
  const fixture = createPracticeBackend({ courseRows: [courseRow] });
  fixture.backend.createPracticeWaitlist_(fixture.teacher('小琪'), {
    calendarId: 'cal-wait', startTime: '14:00', endTime: '15:00', recurrence: 'once',
  });
  fixture.backend.getPracticeCurrentObRows_ = () => [courseRow];

  const result = fixture.backend.reconcilePracticeBookings_({
    today: '2026/09/10', throughDate: '2026/09/10',
  });

  assert.equal(result.activated, 0);
  assert.equal(result.pending, 1);
  assert.equal(fixture.bookingSheet.values[1][6], '候補');
});

test('practice reconciliation fails closed when OB cannot be verified', () => {
  const fixture = createPracticeBackend({
    courseRows: [[
      '2026/09/10', '14:00', 'A－空環 Lv.1', '老師甲',
      'cal-wait', 'class-1', 'teacher-1', '否', 'stamp',
    ]],
  });
  fixture.backend.createPracticeWaitlist_(fixture.teacher('小琪'), {
    calendarId: 'cal-wait', startTime: '14:00', endTime: '15:00', recurrence: 'once',
  });
  fixture.backend.getPracticeCurrentObRows_ = () => { throw new Error('injected OB outage'); };

  assert.throws(
    () => fixture.backend.reconcilePracticeBookings_({
      today: '2026/09/10', throughDate: '2026/09/10',
    }),
    /無法確認 OB/
  );
  assert.equal(fixture.bookingSheet.values[1][6], '候補');
});

test('practice reconciliation cancels a revived conflict and records push failure for managers', () => {
  const fixture = createPracticeBackend();
  fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '15:00', recurrence: 'once',
  });
  fixture.backend.getPracticeCurrentObRows_ = () => [[
    '2026/09/10', '14:00', 'A－空環 Lv.1', '老師甲',
    'cal-revived', 'class-1', 'teacher-1', '否', 'stamp',
  ]];
  fixture.backend.sendPushAfterMutationSafely_ = () => ({
    attempted: true, accepted: false, delivered: 0, error: 'injected push outage',
  });

  const result = fixture.backend.reconcilePracticeBookings_({
    today: '2026/09/10', throughDate: '2026/09/10',
  });

  assert.equal(result.cancelled, 1);
  assert.equal(result.notificationFailures, 1);
  assert.equal(fixture.bookingSheet.values[1][6], '衝突取消');
  assert.equal(fixture.participantSheet.values[1][8], '已取消');
  assert.ok(fixture.practiceAuditSheet.values.some((row) => row[2] === '推播失敗'));
});

test('practice join and leave notify the current creator after Sheet writes finish', () => {
  const fixture = createPracticeBackend();
  const created = fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '16:00', recurrence: 'once',
  });
  const deliveries = [];
  fixture.backend.sendPushAfterMutationSafely_ = (teacherNames, message) => {
    deliveries.push({ teacherNames: Array.from(teacherNames), heading: message.heading });
    return { attempted: true, accepted: true, delivered: teacherNames.length, error: '' };
  };

  fixture.backend.joinPracticeBooking_(fixture.teacher('Ariel Lu'), {
    bookingId: created.bookingId, startTime: '15:00', endTime: '16:00', scope: 'once',
  });
  fixture.backend.leavePracticeBooking_(fixture.teacher('Ariel Lu'), {
    bookingId: created.bookingId, scope: 'once',
  });

  assert.deepEqual(deliveries, [
    { teacherNames: ['小琪'], heading: '有人加入自主練習' },
    { teacherNames: ['小琪'], heading: '有人退出自主練習' },
  ]);
});

test('practice API requires login, ignores forged teachers, and permits course-admin acting mode', () => {
  const bootstrap = loadBackend(createAuthServices());
  const services = createAuthServices();
  const { backend } = createAuthBackend([
    createAccount(bootstrap, '冠蓉', '1234', { role: '管理員' }).concat('', 'course_admin'),
    createAccount(bootstrap, '小琪', '2345').concat('空環', ''),
  ], services);
  backend.console = { error() {} };
  const calls = [];
  backend.getPracticeDay_ = (session, date) => {
    calls.push(['day', session.teacherName, session.impersonatedBy || '', date]);
    return { date, teacherName: session.teacherName };
  };
  backend.createPracticeBooking_ = (session, input) => {
    calls.push(['create', session.teacherName, session.impersonatedBy || '', input.room]);
    return { bookingId: 'practice-1' };
  };
  backend.getPracticeAdminDashboard_ = (session) => {
    backend.assertCapabilitySession_(session, 'course_admin');
    calls.push(['admin', session.teacherName]);
    return { bookings: [] };
  };

  const missing = JSON.parse(backend.doPost({ parameter: {
    action: 'getPracticeDay', date: '2026/09/10', teacherName: '偽造老師',
  } }).text);
  assert.equal(missing.status, 'error');
  assert.match(missing.message, /請先登入/);

  const teacherToken = backend.authenticate_('小琪', '2345').sessionToken;
  const teacherResult = JSON.parse(backend.doPost({ parameter: {
    action: 'createPracticeBooking',
    sessionToken: teacherToken,
    teacherName: '偽造老師',
    practice: JSON.stringify({ date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '15:00' }),
  } }).text);
  assert.equal(teacherResult.status, 'success');

  const adminToken = backend.authenticate_('冠蓉', '1234').sessionToken;
  const actingResult = JSON.parse(backend.doPost({ parameter: {
    action: 'getPracticeDay',
    sessionToken: adminToken,
    actingTeacherName: '小琪',
    date: '2026/09/10',
  } }).text);
  assert.equal(actingResult.status, 'success');
  const dashboardResult = JSON.parse(backend.doPost({ parameter: {
    action: 'getPracticeAdminDashboard', sessionToken: adminToken,
  } }).text);
  assert.equal(dashboardResult.status, 'success');
  assert.deepEqual(calls, [
    ['create', '小琪', '', 'A'],
    ['day', '小琪', '冠蓉', '2026/09/10'],
    ['admin', '冠蓉'],
  ]);
});

test('practice day service returns the signed-in teacher and canonical room timeline', () => {
  const fixture = createPracticeBackend({
    courseRows: [[
      '2026/09/10', '13:00', 'A－空環 Lv.1', '老師甲', 'cal-1', 'class-1', 'teacher-1', '否', 'stamp',
    ]],
  });
  fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'B', startTime: '15:00', endTime: '16:00', recurrence: 'once',
  });

  const result = fixture.backend.getPracticeDay_(fixture.teacher('小琪'), '2026/09/10');

  assert.equal(result.teacherName, '小琪');
  assert.equal(result.date, '2026/09/10');
  assert.equal(result.rooms.find((room) => room.room === 'A').blocks[0].type, 'course');
  assert.equal(result.rooms.find((room) => room.room === 'B').blocks[0].type, 'practice');
  assert.deepEqual(Array.from(result.quickDurations), [60, 90, 120]);
});

test('practice update and cancellation enforce ownership and administrator reasons', () => {
  const fixture = createPracticeBackend();
  const created = fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '15:00', recurrence: 'once',
  });
  const admin = {
    teacherName: '冠蓉', role: '管理員', managementCapabilities: ['course_admin'],
  };

  assert.throws(() => fixture.backend.updatePracticeBooking_(fixture.teacher('Ariel Lu'), {
    bookingId: created.bookingId, date: '2026/09/10', room: 'A', startTime: '14:30', endTime: '15:30',
  }), /只能調整自己/);
  assert.throws(() => fixture.backend.updatePracticeBooking_(admin, {
    bookingId: created.bookingId, date: '2026/09/10', room: 'A', startTime: '14:30', endTime: '15:30',
  }), /請填寫原因/);

  const updated = fixture.backend.updatePracticeBooking_(admin, {
    bookingId: created.bookingId, date: '2026/09/10', room: 'B', startTime: '14:30', endTime: '15:30',
    reason: '管理員依老師需求調整',
  });
  assert.equal(updated.room, 'B');
  assert.equal(updated.startTime, '14:30');

  assert.throws(() => fixture.backend.cancelPracticeBooking_(admin, {
    bookingId: created.bookingId,
  }), /請填寫原因/);
  const cancelled = fixture.backend.cancelPracticeBooking_(admin, {
    bookingId: created.bookingId, reason: '臨時開課', scope: 'once',
  });
  assert.equal(cancelled.status, '已取消');
  assert.equal(fixture.bookingSheet.values[1][6], '已取消');
  assert.equal(fixture.participantSheet.values[1][8], '已取消');
});

test('practice administrator dashboard is course-admin only and includes participants and failures', () => {
  const fixture = createPracticeBackend();
  const created = fixture.backend.createPracticeBooking_(fixture.teacher('小琪'), {
    date: '2026/09/10', room: 'A', startTime: '14:00', endTime: '15:00', recurrence: 'once',
  });
  fixture.backend.recordPracticeNotificationFailure_({
    bookingId: created.bookingId,
    teacherNames: ['小琪'],
    message: { heading: '測試' },
    error: '測試推播失敗',
  });
  assert.throws(() => fixture.backend.getPracticeAdminDashboard_(fixture.teacher('小琪'), {}), /課程管理權限/);

  const result = fixture.backend.getPracticeAdminDashboard_({
    teacherName: '冠蓉', role: '管理員', managementCapabilities: ['course_admin'],
  }, { dateFrom: '2026/09/01', dateTo: '2026/09/30' });

  assert.equal(result.bookings.length, 1);
  assert.equal(result.bookings[0].participants[0].teacherName, '小琪');
  assert.equal(result.notificationFailures.length, 1);
  assert.equal(result.notificationFailures[0].reason, '測試推播失敗');
});

test('course adjustment detection pairs C and D when class identities cross at different times', () => {
  const backend = loadBackend();
  const beforeRows = [
    ['2026/09/18', '18:30', 'C－空環 Lv.1', '老師甲', 'cal-c', 'class-ring', 'teacher-a', '否', 'old'],
    ['2026/09/18', '18:45', 'D－舞綢 Lv.2', '老師乙', 'cal-d', 'class-silk', 'teacher-b', '否', 'old'],
  ];
  const afterRows = [
    ['2026/09/18', '18:30', 'C－舞綢 Lv.2', '老師乙', 'cal-c', 'class-silk', 'teacher-b', '否', 'new'],
    ['2026/09/18', '18:45', 'D－空環 Lv.1', '老師甲', 'cal-d', 'class-ring', 'teacher-a', '否', 'new'],
  ];

  const candidates = backend.detectCourseAdjustmentCandidates_(beforeRows, afterRows);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].date, '2026/09/18');
  assert.equal(candidates[0].roomPair, 'C/D');
  assert.equal(candidates[0].status, '待確認');
  assert.deepEqual(Array.from(candidates[0].mappings, (mapping) => ({
    fromCalendarId: mapping.fromCalendarId,
    effectiveCalendarId: mapping.effectiveCalendarId,
  })), [
    { fromCalendarId: 'cal-c', effectiveCalendarId: 'cal-d' },
    { fromCalendarId: 'cal-d', effectiveCalendarId: 'cal-c' },
  ]);
});

test('course adjustment detection supports A/B and rejects unsafe or ambiguous changes', () => {
  const backend = loadBackend();
  const makeRow = (date, time, room, identity, calendarId) => [
    date, time, `${room}－${identity}`, `teacher-${identity}`, calendarId,
    `class-${identity}`, `teacher-id-${identity}`, '否', 'stamp',
  ];
  const before = [
    makeRow('2026/09/18', '10:00', 'A', 'ring', 'cal-a'),
    makeRow('2026/09/18', '10:15', 'B', 'silk', 'cal-b'),
  ];
  const crossed = [
    makeRow('2026/09/18', '10:00', 'A', 'silk', 'cal-a'),
    makeRow('2026/09/18', '10:15', 'B', 'ring', 'cal-b'),
  ];
  assert.equal(backend.detectCourseAdjustmentCandidates_(before, crossed)[0].roomPair, 'A/B');

  const crossBuilding = [
    makeRow('2026/09/18', '10:00', 'A', 'silk', 'cal-a'),
    makeRow('2026/09/18', '10:15', 'C', 'ring', 'cal-b'),
  ];
  assert.equal(backend.detectCourseAdjustmentCandidates_(before, crossBuilding).length, 0);

  const oneSided = [
    makeRow('2026/09/18', '10:00', 'A', 'silk', 'cal-a'),
    makeRow('2026/09/18', '10:15', 'B', 'silk', 'cal-b'),
  ];
  assert.equal(backend.detectCourseAdjustmentCandidates_(before, oneSided).length, 0);

  const missingId = before.map((row) => row.slice());
  missingId[0][4] = '';
  assert.equal(backend.detectCourseAdjustmentCandidates_(missingId, crossed).length, 0);

  const differentDate = crossed.map((row) => row.slice());
  differentDate[1][0] = '2026/09/19';
  assert.equal(backend.detectCourseAdjustmentCandidates_(before, differentDate).length, 0);

  const ambiguousBefore = before.concat([
    makeRow('2026/09/18', '11:00', 'A', 'ring', 'cal-a2'),
  ]);
  const ambiguousAfter = crossed.concat([
    makeRow('2026/09/18', '11:00', 'A', 'silk', 'cal-a2'),
  ]);
  assert.equal(backend.detectCourseAdjustmentCandidates_(ambiguousBefore, ambiguousAfter).length, 0);
});

test('course adjustment sheet contract appends leave metadata without changing existing indexes', () => {
  const backend = loadBackend();

  assert.deepEqual(
    Array.from(backend.SHEET_HEADERS.LEAVES.slice(25, 28)),
    EXPECTED_ORDINARY_DELAY_HEADERS,
  );
  assert.deepEqual(
    Array.from(backend.SHEET_HEADERS.LEAVES.slice(28)),
    EXPECTED_LEAVE_ADJUSTMENT_HEADERS,
  );
  assert.deepEqual(
    Array.from(backend.SHEET_HEADERS.COURSE_ADJUSTMENTS),
    EXPECTED_COURSE_ADJUSTMENT_HEADERS,
  );
});
