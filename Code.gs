var SHEETS = {
  COURSE_LIST: 'CourseList',
  LEAVES: '請假代課紀錄',
  LEGACY_LEAVES: '工作表1',
  INVITATIONS: '代課邀請',
  AUDIT: '操作紀錄',
  SETTINGS: '系統設定',
  ACCOUNTS: '登入帳號'
};

var SHEET_HEADERS = {
  COURSE_LIST: [
    '日期', '時間', '課程', '指導者',
    'OB Calendar ID', 'OB Class ID', 'OB 老師 ID', '是否代課', '最後同步時間'
  ],
  LEAVES: [
    '登記時間', '原老師', '日期', '時段', '課程',
    '狀態', '代課老師', '備註', '入系統', '代課編號',
    'OB Calendar ID', '實際課程 ID', '實際課程名稱', '預計難度',
    '處理類型', 'OB 核對狀態', 'OB 核對時間', '差異原因', '異動狀態'
  ],
  INVITATIONS: ['邀請編號', '老師', '開放時間', '首次查看時間', '狀態', '關閉時間'],
  AUDIT: ['操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因'],
  SETTINGS: ['設定名稱', '設定值', '更新時間', '備註'],
  ACCOUNTS: ['指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至']
};

var CONFIG = {
  COURSE_SHEET: SHEETS.COURSE_LIST,
  LEAVE_SHEET: SHEETS.LEAVES,
  TEACHER_SHEET: '老師名單',
  API_URL: 'https://api.omceanbooking.com/v1/calendar',
  API_TOKEN_PROPERTY: 'OMCEAN_API_TOKEN',
  PAGE_SIZE: 100,
  LOCK_TIMEOUT_MS: 30000,
  AUTH_SESSION_DURATION_SECONDS: 21600,
  AUTH_MAX_FAILED_ATTEMPTS: 5,
  AUTH_LOCK_DURATION_MS: 15 * 60 * 1000,
  AUTH_SESSION_KEY_PREFIX: 'SUBSTITUTE_SESSION_'
};

function hashPin_(pin, salt) {
  var pinText = cleanText_(pin);
  var saltText = cleanText_(salt);
  if (!pinText || !saltText) throw new Error('身分證末碼或 Salt 不可空白。');

  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    pinText + ':' + saltText,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function authenticate_(teacherName, pin) {
  var teacher = cleanText_(teacherName);
  var pinText = cleanText_(pin);
  if (!teacher || !pinText) throw new Error('請輸入姓名與身分證末碼。');

  return withScriptLock_(function() {
    var account = findAccount_(teacher);
    if (!account) throw new Error('姓名或身分證末碼不正確。');
    if (!isAccountActive_(account.active)) throw new Error('帳號目前未啟用。');
    if (isAccountLocked_(account.lockedUntil)) throw new Error('帳號暫時鎖定，請稍後再試。');

    var expectedHash = cleanText_(account.pinHash);
    var actualHash = hashPin_(pinText, account.salt);
    if (!expectedHash || !constantTimeEquals_(expectedHash, actualHash)) {
      recordFailedLogin_(account);
      throw new Error('姓名或身分證末碼不正確。');
    }

    resetFailedLogin_(account);
    var role = normalizeAccountRole_(account.role);
    var sessionToken = createSessionToken_();
    storeSession_(sessionToken, {
      teacherName: account.teacherName,
      role: role,
      expiresAt: currentTimeMs_() + CONFIG.AUTH_SESSION_DURATION_SECONDS * 1000
    });

    return {
      sessionToken: sessionToken,
      teacherName: account.teacherName,
      role: role
    };
  });
}

function requireSession_(token) {
  var sessionToken = cleanText_(token);
  if (!sessionToken) throw new Error('請先登入。');

  var session = readSession_(sessionToken);
  if (!session || !cleanText_(session.teacherName) || !cleanText_(session.role)) {
    throw new Error('登入狀態無效，請重新登入。');
  }
  var expiresAt = Number(session.expiresAt);
  if (!isFinite(expiresAt)) {
    removeSession_(sessionToken);
    throw new Error('登入狀態無效，請重新登入。');
  }
  if (expiresAt <= currentTimeMs_()) {
    removeSession_(sessionToken);
    throw new Error('登入狀態已逾期，請重新登入。');
  }
  return {
    teacherName: cleanText_(session.teacherName),
    role: normalizeAccountRole_(session.role)
  };
}

function requireAdmin_(token) {
  var session = requireSession_(token);
  if (!isAdminRole_(session.role)) throw new Error('需要管理權限。');
  return session;
}

function setupAccount_(adminToken, teacherName, pin, options) {
  requireAdmin_(adminToken);

  var teacher = cleanText_(teacherName);
  var pinText = cleanText_(pin);
  if (!teacher || !pinText) throw new Error('請輸入老師姓名與身分證末碼。');

  var settings = options || {};
  var active = settings.active !== false;
  var role = normalizeAccountRole_(settings.role);
  var salt = createRandomToken_();
  var pinHash = hashPin_(pinText, salt);
  var sheet = getAccountsSheet_();
  var headers = getHeaderMap_(sheet);
  var values = sheet.getDataRange().getValues();
  var existingRow = 0;

  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][headers['指導者'] - 1]) === teacher) {
      existingRow = index + 1;
      break;
    }
  }

  var accountValues = [teacher, salt, pinHash, active ? '是' : '否', role, 0, ''];
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, SHEET_HEADERS.ACCOUNTS.length).setValues([accountValues]);
  } else {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.ACCOUNTS.length).setValues([accountValues]);
  }

  return { teacherName: teacher, role: role, active: active };
}

function initializeFirstAdmin_(teacherName, pin) {
  var teacher = cleanText_(teacherName);
  var pinText = cleanText_(pin);
  if (!teacher || !pinText) throw new Error('請輸入管理員姓名與身分證末碼。');

  return withScriptLock_(function() {
    var sheet = getAccountsSheet_();
    var headers = getHeaderMap_(sheet);
    var values = sheet.getDataRange().getValues();
    var hasAccount = values.slice(1).some(function(row) {
      return cleanText_(row[headers['指導者'] - 1]);
    });
    if (hasAccount) throw new Error('已有帳號，請使用管理員帳號新增其他帳號。');

    var salt = createRandomToken_();
    var pinHash = hashPin_(pinText, salt);
    sheet.getRange(2, 1, 1, SHEET_HEADERS.ACCOUNTS.length).setValues([[
      teacher, salt, pinHash, '是', '管理員', 0, ''
    ]]);
    return { teacherName: teacher, role: '管理員', active: true };
  });
}

function initializeFirstAdminFromProperties() {
  var properties = PropertiesService.getScriptProperties();
  var teacherName = properties.getProperty('INITIAL_ADMIN_NAME');
  var pin = properties.getProperty('INITIAL_ADMIN_PIN');
  try {
    return initializeFirstAdmin_(teacherName, pin);
  } finally {
    properties.deleteProperty('INITIAL_ADMIN_NAME');
    properties.deleteProperty('INITIAL_ADMIN_PIN');
  }
}

function findAccount_(teacherName) {
  var sheet = getAccountsSheet_();
  var headers = getHeaderMap_(sheet);
  var values = sheet.getDataRange().getValues();
  var teacher = cleanText_(teacherName);

  for (var index = 1; index < values.length; index++) {
    var row = values[index];
    if (cleanText_(row[headers['指導者'] - 1]) === teacher) {
      return {
        sheet: sheet,
        rowNumber: index + 1,
        headers: headers,
        teacherName: teacher,
        salt: cleanText_(row[headers['Salt'] - 1]),
        pinHash: cleanText_(row[headers['PIN 雜湊'] - 1]),
        active: row[headers['是否在職'] - 1],
        role: row[headers['角色'] - 1],
        failedAttempts: parseFailedAttempts_(row[headers['登入失敗次數'] - 1]),
        lockedUntil: row[headers['鎖定至'] - 1]
      };
    }
  }
  return null;
}

function getAccountsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.ACCOUNTS);
  ensureSheetHeaders_(sheet, SHEET_HEADERS.ACCOUNTS);
  return sheet;
}

function recordFailedLogin_(account) {
  var attempts = account.failedAttempts + 1;
  account.sheet.getRange(account.rowNumber, account.headers['登入失敗次數']).setValue(attempts);
  if (attempts >= CONFIG.AUTH_MAX_FAILED_ATTEMPTS) {
    account.sheet.getRange(account.rowNumber, account.headers['鎖定至'])
      .setValue(new Date(currentTimeMs_() + CONFIG.AUTH_LOCK_DURATION_MS));
  }
}

function resetFailedLogin_(account) {
  if (account.failedAttempts || cleanText_(account.lockedUntil)) {
    account.sheet.getRange(account.rowNumber, account.headers['登入失敗次數']).setValue(0);
    account.sheet.getRange(account.rowNumber, account.headers['鎖定至']).setValue('');
  }
}

function isAccountActive_(value) {
  return [true, 1, '1', 'true', 'TRUE', '是', '啟用'].indexOf(value) !== -1;
}

function isAccountLocked_(value) {
  if (!value) return false;
  var lockTime = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return !isNaN(lockTime) && lockTime > currentTimeMs_();
}

function normalizeAccountRole_(value) {
  return isAdminRole_(value) ? '管理員' : '老師';
}

function isAdminRole_(value) {
  return ['管理員', 'admin', 'ADMIN'].indexOf(cleanText_(value)) !== -1;
}

function parseFailedAttempts_(value) {
  var attempts = Number(value);
  return isFinite(attempts) && attempts > 0 ? Math.floor(attempts) : 0;
}

function constantTimeEquals_(left, right) {
  var a = String(left || '');
  var b = String(right || '');
  var difference = a.length ^ b.length;
  var maxLength = Math.max(a.length, b.length);
  for (var index = 0; index < maxLength; index++) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function createSessionToken_() {
  return createRandomToken_();
}

function createRandomToken_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function storeSession_(token, session) {
  var sessionToken = cleanText_(token);
  if (!sessionToken) throw new Error('登入狀態無效。');
  var expiresAt = Number(session.expiresAt);
  if (!isFinite(expiresAt)) throw new Error('登入狀態期限無效。');
  var payload = JSON.stringify({
    teacherName: cleanText_(session.teacherName),
    role: normalizeAccountRole_(session.role),
    expiresAt: expiresAt
  });
  var key = getSessionKey_(sessionToken);
  var cache = getScriptCache_();
  var properties = getScriptProperties_();
  if (!properties && !cache) throw new Error('無法建立登入狀態。');
  if (properties) {
    cleanupExpiredPropertySessions_(properties);
    properties.setProperty(key, payload);
  }
  if (cache) {
    cache.put(key, payload, CONFIG.AUTH_SESSION_DURATION_SECONDS);
  }
}

function readSession_(token) {
  var key = getSessionKey_(token);
  var cache = getScriptCache_();
  var properties = getScriptProperties_();
  var raw = cache ? cache.get(key) : (properties ? properties.getProperty(key) : '');
  if (!raw && cache && properties) raw = properties.getProperty(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    removeSession_(token);
    return null;
  }
}

function removeSession_(token) {
  var key = getSessionKey_(token);
  var cache = getScriptCache_();
  var properties = getScriptProperties_();
  if (cache) cache.remove(key);
  if (properties) properties.deleteProperty(key);
}

function getSessionKey_(token) {
  return CONFIG.AUTH_SESSION_KEY_PREFIX + cleanText_(token);
}

function getScriptCache_() {
  return typeof CacheService === 'undefined' ? null : CacheService.getScriptCache();
}

function getScriptProperties_() {
  return typeof PropertiesService === 'undefined' ? null : PropertiesService.getScriptProperties();
}

function cleanupExpiredPropertySessions_(properties) {
  if (!properties || typeof properties.getProperties !== 'function') return;
  var now = currentTimeMs_();
  var allProperties = properties.getProperties();
  Object.keys(allProperties).forEach(function(key) {
    if (key.indexOf(CONFIG.AUTH_SESSION_KEY_PREFIX) !== 0) return;
    try {
      var session = JSON.parse(allProperties[key]);
      var expiresAt = Number(session.expiresAt);
      if (!isFinite(expiresAt) || expiresAt <= now) properties.deleteProperty(key);
    } catch (error) {
      properties.deleteProperty(key);
    }
  });
}

function withScriptLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function currentTimeMs_() {
  return new Date().getTime();
}

function ensureSystemStructure_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leaveSheet = migrateLeaveSheet_(ss);

  ensureSheetHeaders_(requireSheet_(ss, SHEETS.COURSE_LIST), SHEET_HEADERS.COURSE_LIST);
  ensureSheetHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
  ensureSupportingSheet_(ss, SHEETS.INVITATIONS, SHEET_HEADERS.INVITATIONS);
  ensureSupportingSheet_(ss, SHEETS.AUDIT, SHEET_HEADERS.AUDIT);
  ensureSupportingSheet_(ss, SHEETS.SETTINGS, SHEET_HEADERS.SETTINGS);
  ensureSupportingSheet_(ss, SHEETS.ACCOUNTS, SHEET_HEADERS.ACCOUNTS);

  return { leaveSheetName: SHEETS.LEAVES };
}

function migrateLeaveSheet_(ss) {
  var leaveSheet = ss.getSheetByName(SHEETS.LEAVES);
  var legacySheet = ss.getSheetByName(SHEETS.LEGACY_LEAVES);

  if (leaveSheet && legacySheet) {
    throw new Error('同時找到「' + SHEETS.LEAVES + '」與舊工作表「' + SHEETS.LEGACY_LEAVES + '」，請先人工確認資料。');
  }
  if (!leaveSheet && legacySheet) {
    legacySheet.setName(SHEETS.LEAVES);
    leaveSheet = legacySheet;
  }
  if (!leaveSheet) leaveSheet = ss.insertSheet(SHEETS.LEAVES);
  return leaveSheet;
}

function ensureSupportingSheet_(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  ensureSheetHeaders_(sheet, headers);
  return sheet;
}

function ensureSheetHeaders_(sheet, expectedHeaders) {
  var actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  expectedHeaders.forEach(function(header, index) {
    var actual = cleanText_(actualHeaders[index]);
    if (!actual) {
      sheet.getRange(1, index + 1).setValue(header);
    } else if (actual !== header) {
      throw new Error(sheet.getName() + ' 第 ' + (index + 1) + ' 欄標題應為「' + header + '」。');
    }
  });
}

function getHeaderMap_(sheet) {
  var headers = sheet.getDataRange().getValues()[0] || [];
  var map = {};
  headers.forEach(function(header, index) {
    var name = cleanText_(header);
    if (name && !map[name]) map[name] = index + 1;
  });
  return map;
}

function appendAudit_(event) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureSupportingSheet_(ss, SHEETS.AUDIT, SHEET_HEADERS.AUDIT);
  var item = event || {};
  var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.AUDIT.length).setValues([[
    now,
    cleanText_(item.actor),
    cleanText_(item.action),
    cleanText_(item.targetId),
    cleanText_(item.before),
    cleanText_(item.after),
    cleanText_(item.reason)
  ]]);
}

function doGet(e) {
  if (!e || !e.parameter || Object.keys(e.parameter).length === 0) {
    return ContentService
      .createTextOutput('Sherry Aerial Studio - 系統連線正常')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    var action = cleanText_(e.parameter.action);
    var authenticatedActions = {
      getPendingLeaves: true,
      getMySubs: true,
      submitLeave: true,
      submitClaim: true
    };
    var session = authenticatedActions[action]
      ? requireSession_(e.parameter.sessionToken)
      : null;
    if ({
      getPendingLeaves: true,
      getMySubs: true,
      submitLeave: true,
      submitClaim: true
    }[action]) {
      ensureSystemStructure_();
    }
    var handlers = {
      getTeachers: function() { return getTeachers_(); },
      getCourseList: function() { return getCourseList_(); },
      getPendingLeaves: function() { return getPendingLeaves_(); },
      getMySubs: function() { return getMySubs_(session.teacherName); },
      submitLeave: function() {
        return submitLeave_(session.teacherName, parseJsonArray_(e.parameter.items, '請假課程'));
      },
      submitClaim: function() {
        return submitClaim_(session.teacherName, parseJsonArray_(e.parameter.items, '代課課程'));
      }
    };
    if (!handlers[action]) throw new Error('不支援的操作：' + action);
    return createJsonResponse_({ status: 'success', data: handlers[action]() });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return createJsonResponse_({
      status: 'error',
      message: error && error.message ? error.message : String(error)
    });
  }
}

function getCourseCategory_(courseName) {
  var name = String(courseName || '').replace(/\s+/g, '');
  if (/空中?瑜伽|空瑜/.test(name)) return '空瑜';
  if (/空環/.test(name)) return '空環';
  if (/舞綢/.test(name)) return '舞綢';
  if (/柔軟度|柔軟開發/.test(name)) return '柔軟度';
  if (/綢吊/.test(name)) return '綢吊';
  if (/瑜伽/.test(name)) return '瑜伽';
  return '其他';
}

function getSyncDateRange_(now) {
  var source = now || new Date();
  var timezone = getTimeZone_();
  var dateFrom = Utilities.formatDate(source, timezone, 'yyyy-MM-dd');
  var parts = dateFrom.split('-').map(Number);
  var endOfNextMonth = new Date(parts[0], parts[1] + 1, 0, 12, 0, 0);
  return {
    dateFrom: dateFrom,
    dateTo: Utilities.formatDate(endOfNextMonth, timezone, 'yyyy-MM-dd')
  };
}

function normalizeCalendarItem_(item) {
  if (!item || item.cancelled === true) return null;

  var classInfo = item['class'] || item.course || {};
  var instructors = Array.isArray(item.instructors) ? item.instructors.filter(Boolean) : [];
  var instructor = instructors.filter(function(person) {
    return person.isSubstitute === true;
  })[0] || instructors[0] || item.instructor || {};

  var courseName = cleanText_(classInfo.nameZhHant || classInfo.nameEn || classInfo.name || '');
  var instructorName = cleanText_(
    instructor.name ||
    [instructor.firstName, instructor.lastName].filter(Boolean).join(' ')
  );
  var classId = cleanText_(classInfo.id || classInfo.classId || '');
  var instructorId = cleanText_(instructor.id || instructor.instructorId || '');
  var classTime = item.classTime || item.startAt || item.startTime || '';
  var parsedTime = new Date(classTime);

  if (!item.id || !courseName || !instructorName || !classId || !instructorId ||
      !classTime || isNaN(parsedTime.getTime())) {
    return null;
  }

  var timezone = getTimeZone_();
  return {
    apiId: String(item.id),
    calendarId: String(item.id),
    date: Utilities.formatDate(parsedTime, timezone, 'yyyy/MM/dd'),
    time: Utilities.formatDate(parsedTime, timezone, 'HH:mm'),
    course: courseName,
    instructor: instructorName,
    classId: classId,
    instructorId: instructorId,
    isSubstitute: instructor.isSubstitute === true ? '是' : '否'
  };
}

function fetchCalendarPages_(token, dateFrom, dateTo) {
  if (!cleanText_(token)) throw new Error('尚未設定 Omcean API 權杖。');

  var allItems = [];
  var start = 0;
  while (true) {
    var query = [
      'start=' + start,
      'date_from=' + encodeURIComponent(dateFrom),
      'date_to=' + encodeURIComponent(dateTo),
      'include_cancelled=false'
    ].join('&');
    var response = UrlFetchApp.fetch(CONFIG.API_URL + '?' + query, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    var responseCode = response.getResponseCode();
    var body = response.getContentText();
    if (responseCode < 200 || responseCode >= 300) {
      throw new Error('Omcean API 連線失敗（HTTP ' + responseCode + '）。');
    }

    var page;
    try {
      page = JSON.parse(body);
    } catch (error) {
      throw new Error('Omcean API 回傳的 JSON 無法解析。');
    }
    if (!Array.isArray(page)) {
      throw new Error('Omcean API 回傳格式不正確。');
    }

    allItems = allItems.concat(page);
    if (page.length < CONFIG.PAGE_SIZE) break;
    start += CONFIG.PAGE_SIZE;
  }
  return allItems;
}

function syncCourseListFromApi(sessionToken) {
  requireAdmin_(sessionToken);

  var token = PropertiesService.getScriptProperties().getProperty(CONFIG.API_TOKEN_PROPERTY);
  if (!cleanText_(token)) {
    throw new Error('請先在指令碼屬性設定 OMCEAN_API_TOKEN。');
  }

  var range = getSyncDateRange_(new Date());
  var rawItems = fetchCalendarPages_(token, range.dateFrom, range.dateTo);
  var dedupe = {};
  var normalized = [];
  rawItems.forEach(function(rawItem, index) {
    if (rawItem && rawItem.cancelled === true) return;

    var item = normalizeCalendarItem_(rawItem);
    if (!item) {
      throw new Error('Omcean API 第 ' + (index + 1) + ' 筆包含無效課程資料，為保護舊資料已停止同步。');
    }
    var key = item.apiId || [item.date, item.time, item.course, item.instructor].join('|');
    if (dedupe[key]) return;
    dedupe[key] = true;
    normalized.push(item);
  });
  if (!normalized.length) {
    throw new Error('API 本次沒有取得有效課程，為保護舊資料已停止同步。');
  }

  normalized.sort(function(a, b) {
    return [a.date, a.time, a.course, a.instructor].join('|')
      .localeCompare([b.date, b.time, b.course, b.instructor].join('|'));
  });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  validateAppendOnlyHeaders_(sheet, SHEET_HEADERS.COURSE_LIST);
  var syncedAt = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
  var rows = normalized.map(function(item) {
    return [
      item.date,
      item.time,
      item.course,
      item.instructor,
      item.calendarId,
      item.classId,
      item.instructorId,
      item.isSubstitute,
      syncedAt
    ];
  });

  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    var headers = validateAppendOnlyHeaders_(sheet, SHEET_HEADERS.COURSE_LIST);
    var existingRows = Math.max(0, sheet.getLastRow() - 1);
    var replacementRows = rows.slice();
    while (replacementRows.length < existingRows) {
      replacementRows.push(['', '', '', '', '', '', '', '', '']);
    }
    sheet.getRange(2, 1, replacementRows.length, SHEET_HEADERS.COURSE_LIST.length)
      .setValues(replacementRows);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.COURSE_LIST.length).setValues([headers]);
  } finally {
    lock.releaseLock();
  }

  return {
    status: 'success',
    count: normalized.length,
    dateFrom: range.dateFrom,
    dateTo: range.dateTo
  };
}

function validateAppendOnlyHeaders_(sheet, expectedHeaders) {
  var actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  return expectedHeaders.map(function(header, index) {
    var actual = cleanText_(actualHeaders[index]);
    if (!actual) return header;
    if (actual !== header) {
      throw new Error(sheet.getName() + ' 第 ' + (index + 1) + ' 欄標題應為「' + header + '」。');
    }
    return actual;
  });
}

function getTeachers_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.TEACHER_SHEET);
  var values = sheet.getDataRange().getValues();
  if (!values.length || cleanText_(values[0][0]) !== '指導者') {
    throw new Error('老師名單 A1 標題應為「指導者」。');
  }
  return values.slice(1).map(function(row) {
    return { '指導者': cleanText_(row[0]) };
  }).filter(function(item) {
    return item['指導者'];
  });
}

function getCourseList_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  assertHeaders_(sheet, ['日期', '時間', '課程', '指導者']);
  var values = sheet.getDataRange().getValues();
  return values.slice(1).map(function(r) {
    return {
      '日期': formatMyDate(r[0]),
      '時間': formatMyTime(r[1]),
      '課程': cleanText_(r[2]),
      '指導者': cleanText_(r[3]),
      '課程大類': getCourseCategory_(r[2])
    };
  }).filter(function(item) {
    return item['日期'] && item['時間'] && item['課程'] && item['指導者'];
  });
}

function getPendingLeaves_() {
  ensurePendingLeaveIds_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  ensureLeaveSheetHeaders_(sheet);
  var values = sheet.getDataRange().getValues();
  return values.slice(1).filter(function(r) {
    return cleanText_(r[5]) === '確認中';
  }).map(function(r) {
    return {
      '代課編號': cleanText_(r[9]),
      '原老師': cleanText_(r[1]),
      '日期': formatMyDate(r[2]),
      '時段': formatMyTime(r[3]),
      '課程': cleanText_(r[4]),
      '課程大類': getCourseCategory_(r[4])
    };
  });
}

function getMySubs_(teacherName) {
  var name = cleanText_(teacherName);
  if (!name) throw new Error('請選擇查詢老師。');
  assertTeacherExists_(name);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  ensureLeaveSheetHeaders_(sheet);
  return sheet.getDataRange().getValues().slice(1).filter(function(r) {
    return cleanText_(r[6]) === name && cleanText_(r[5]) === '已領取';
  }).map(function(r) {
    return {
      '代課編號': cleanText_(r[9]),
      '日期': formatMyDate(r[2]),
      '時段': formatMyTime(r[3]),
      '課程': cleanText_(r[4]),
      '課程大類': getCourseCategory_(r[4]),
      '原老師': cleanText_(r[1]),
      '備註': cleanText_(r[7])
    };
  });
}

function submitLeave_(instructor, items) {
  var teacher = cleanText_(instructor);
  if (!teacher) throw new Error('請選擇請假老師。');
  if (!items.length) throw new Error('請至少選擇一堂請假課程。');
  assertTeacherExists_(teacher);

  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    assertHeaders_(courseSheet, ['日期', '時間', '課程', '指導者']);
    ensureLeaveSheetHeaders_(leaveSheet);

    var courseRows = courseSheet.getDataRange().getValues().slice(1);
    var leaveRows = leaveSheet.getDataRange().getValues().slice(1);
    var seen = {};
    var validated = items.map(function(rawItem) {
      var item = normalizeLeaveItem_(rawItem);
      var requestKey = [item['日期'], item['時間'], item['課程']].join('|');
      if (seen[requestKey]) throw new Error('送出的請假課程有重複項目。');
      seen[requestKey] = true;

      var belongsToTeacher = courseRows.some(function(r) {
        return cleanText_(r[3]) === teacher &&
          formatMyDate(r[0]) === item['日期'] &&
          formatMyTime(r[1]) === item['時間'] &&
          cleanText_(r[2]) === item['課程'];
      });
      if (!belongsToTeacher) {
        throw new Error('找不到 ' + item['日期'] + ' ' + item['時間'] + ' 的有效課程。');
      }
      if (isDuplicateLeave_(leaveRows, teacher, item)) {
        throw new Error(item['日期'] + ' ' + item['時間'] + ' 已經登記過請假。');
      }
      return item;
    });

    var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    var rowsToAppend = validated.map(function(item) {
      return [
        now,
        teacher,
        item['日期'],
        item['時間'],
        item['課程'],
        '確認中',
        '',
        '',
        '',
        Utilities.getUuid()
      ];
    });
    leaveSheet
      .getRange(leaveSheet.getLastRow() + 1, 1, rowsToAppend.length, 10)
      .setValues(rowsToAppend);

    return { count: rowsToAppend.length };
  } finally {
    lock.releaseLock();
  }
}

function submitClaim_(subTeacher, items) {
  var teacher = cleanText_(subTeacher);
  if (!teacher) throw new Error('請選擇代課老師。');
  if (!items.length) throw new Error('請至少選擇一堂代課課程。');
  assertTeacherExists_(teacher);

  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    ensureLeaveSheetHeaders_(leaveSheet);
    var values = leaveSheet.getDataRange().getValues();
    var teacherCourses = getTeacherCourseNames_(teacher);
    var rowById = {};
    for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
      var substituteId = cleanText_(values[rowIndex][9]);
      if (substituteId) rowById[substituteId] = rowIndex;
    }

    var seen = {};
    var updates = items.map(function(item) {
      var id = cleanText_(item.substituteId || item['代課編號']);
      if (!id || seen[id]) throw new Error('代課資料編號無效或重複。');
      seen[id] = true;
      if (rowById[id] == null) throw new Error('找不到指定的代課課程，請重新整理。');

      var dataIndex = rowById[id];
      var row = values[dataIndex];
      if (cleanText_(row[5]) !== '確認中') {
        throw new Error('此代課已被其他老師領取，請重新整理。');
      }
      if (cleanText_(row[1]) === teacher) {
        throw new Error('不能領取自己原本的課程。');
      }

      var noteRequired = requiresChangeNote_(teacherCourses, cleanText_(row[4]));
      var changeNote = validateChangeNote_(noteRequired, item.changeNote);
      return {
        sheetRow: dataIndex + 1,
        values: ['已領取', teacher, changeNote]
      };
    });

    updates.forEach(function(update) {
      leaveSheet.getRange(update.sheetRow, 6, 1, 3).setValues([update.values]);
    });
    return { count: updates.length };
  } finally {
    lock.releaseLock();
  }
}

function requiresChangeNote_(teacherCourseNames, targetCourseName) {
  var targetName = normalizeCourseName_(targetCourseName);
  var targetCategory = getCourseCategory_(targetName);
  var courses = (teacherCourseNames || []).map(normalizeCourseName_).filter(Boolean);

  if (targetCategory === '其他') {
    return courses.indexOf(targetName) === -1;
  }
  return !courses.some(function(courseName) {
    return getCourseCategory_(courseName) === targetCategory;
  });
}

function validateChangeNote_(required, value) {
  var note = cleanText_(value);
  if (required && !note) throw new Error('跨課程種類代課時，請填寫要改成什麼課。');
  return note;
}

function isDuplicateLeave_(rows, instructor, item) {
  return (rows || []).some(function(r) {
    return cleanText_(r[1]) === cleanText_(instructor) &&
      formatMyDate(r[2]) === formatMyDate(item['日期']) &&
      formatMyTime(r[3]) === formatMyTime(item['時間']) &&
      cleanText_(r[4]) === cleanText_(item['課程']) &&
      ['確認中', '已領取'].indexOf(cleanText_(r[5])) !== -1;
  });
}

function ensurePendingLeaveIds_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    ensureLeaveSheetHeaders_(sheet);
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (cleanText_(values[i][5]) === '確認中' && !cleanText_(values[i][9])) {
        sheet.getRange(i + 1, 10).setValue(Utilities.getUuid());
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function ensureLeaveSheetHeaders_(sheet) {
  ensureSheetHeaders_(sheet, SHEET_HEADERS.LEAVES);
}

function assertTeacherExists_(teacherName) {
  var teachers = getTeachers_().map(function(item) {
    return item['指導者'];
  });
  if (teachers.indexOf(cleanText_(teacherName)) === -1) {
    throw new Error('老師姓名不在老師名單中。');
  }
}

function getTeacherCourseNames_(teacherName) {
  return getCourseList_().filter(function(item) {
    return item['指導者'] === teacherName;
  }).map(function(item) {
    return item['課程'];
  });
}

function normalizeLeaveItem_(item) {
  var normalized = {
    '日期': formatMyDate(item && (item['日期'] || item.date)),
    '時間': formatMyTime(item && (item['時間'] || item['時段'] || item.time)),
    '課程': cleanText_(item && (item['課程'] || item.course))
  };
  if (!normalized['日期'] || !normalized['時間'] || !normalized['課程']) {
    throw new Error('請假課程資料不完整。');
  }
  return normalized;
}

function normalizeCourseName_(value) {
  return cleanText_(value).replace(/\s+/g, '').toLowerCase();
}

function parseJsonArray_(value, fieldName) {
  var parsed;
  try {
    parsed = JSON.parse(value || '[]');
  } catch (error) {
    throw new Error(fieldName + '資料格式錯誤。');
  }
  if (!Array.isArray(parsed)) throw new Error(fieldName + '必須是陣列。');
  return parsed;
}

function createJsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatMyDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, getTimeZone_(), 'yyyy/MM/dd');
  }
  var str = cleanText_(val);
  if (str.indexOf('T') > -1) str = str.split('T')[0];
  return str.replace(/-/g, '/');
}

function formatMyTime(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, getTimeZone_(), 'HH:mm');
  }
  var str = cleanText_(val);
  if (str.indexOf('T') > -1) return str.split('T')[1].substring(0, 5);
  return str.substring(0, 5);
}

function getTimeZone_() {
  return Session.getScriptTimeZone() || 'Asia/Taipei';
}

function cleanText_(value) {
  return String(value == null ? '' : value).trim();
}

function requireSheet_(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error('找不到工作表：「' + sheetName + '」。');
  return sheet;
}

function assertHeaders_(sheet, expectedHeaders) {
  var actual = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  expectedHeaders.forEach(function(header, index) {
    if (cleanText_(actual[index]) !== header) {
      throw new Error(
        sheet.getName() + ' 第 ' + (index + 1) + ' 欄標題應為「' + header + '」。'
      );
    }
  });
}
