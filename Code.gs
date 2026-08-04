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
  AUTH_SESSION_KEY_PREFIX: 'SUBSTITUTE_SESSION_',
  LEAVE_BATCH_MAX: 50,
  INVITATION_OPEN_STATUS: '開放中',
  INVITATION_CLOSED_STATUS: '已關閉',
  CLAIMS_PAUSED_SETTING: '暫停全部領取'
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
      getAvailableSubstitutes: true,
      getMySubs: true,
      getMyCourses: true,
      getMyLeaves: true
    };
    var session = authenticatedActions[action]
      ? requireSession_(e.parameter.sessionToken)
      : null;
    if ({
      getAvailableSubstitutes: true,
      getMySubs: true,
      getMyCourses: true,
      getMyLeaves: true
    }[action]) {
      ensureSystemStructure_();
    }
    var handlers = {
      getTeachers: function() { return getTeachers_(); },
      getAvailableSubstitutes: function() { return getAvailableSubstitutes_(session); },
      getMySubs: function() { return getMySubs_(session.teacherName); },
      getMyCourses: function() { return getMyCourses_(session); },
      getMyLeaves: function() { return getMyLeaves_(session); }
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

function doPost(e) {
  try {
    var parameters = getPostParameters_(e);
    var action = cleanText_(parameters.action);
    if (!action) throw new Error('缺少操作名稱。');

    if (action === 'login') {
      return createJsonResponse_({
        status: 'success',
        data: authenticate_(parameters.teacherName, parameters.pin)
      });
    }

    var session = requireSession_(parameters.sessionToken);
    if (action === 'logout') {
      removeSession_(parameters.sessionToken);
      return createJsonResponse_({ status: 'success', data: { loggedOut: true } });
    }

    ensureSystemStructure_();
    var handlers = {
      submitLeave: function() {
        return submitLeave_(session, parseJsonArray_(parameters.items, '請假課程'));
      },
      claimSubstitute: function() {
        return claimSubstitute_(session, parseJsonArray_(parameters.items, '代課課程'));
      },
      openInvitations: function() {
        return openInvitations_(session, parseTeacherNames_(parameters));
      },
      closeInvitations: function() {
        return closeInvitations_(session, parseTeacherNames_(parameters));
      },
      pauseClaims: function() {
        return pauseClaims_(session, parseBoolean_(parameters.paused, '暫停設定'));
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

function getPostParameters_(e) {
  var parameters = {};
  var eventParameters = e && e.parameter ? e.parameter : {};
  Object.keys(eventParameters).forEach(function(key) {
    parameters[key] = eventParameters[key];
  });

  var postData = e && e.postData ? e.postData : null;
  var body = postData ? cleanText_(postData.contents) : '';
  var contentType = postData ? cleanText_(postData.type).toLowerCase() : '';
  if (body && (!contentType || contentType.indexOf('application/x-www-form-urlencoded') === 0)) {
    body.split('&').forEach(function(pair) {
      if (!pair) return;
      var separator = pair.indexOf('=');
      var rawKey = separator === -1 ? pair : pair.substring(0, separator);
      var rawValue = separator === -1 ? '' : pair.substring(separator + 1);
      var key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
      if (!key) return;
      parameters[key] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    });
  }
  return parameters;
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
    var snapshot = captureSheetSnapshot_(sheet);
    var existingRows = Math.max(0, sheet.getLastRow() - 1);
    var replacementRows = rows.slice();
    while (replacementRows.length < existingRows) {
      replacementRows.push(['', '', '', '', '', '', '', '', '']);
    }
    var writtenRows = replacementRows.length + 1;
    var writtenColumns = SHEET_HEADERS.COURSE_LIST.length;
    try {
      sheet.getRange(2, 1, replacementRows.length, writtenColumns).setValues(replacementRows);
      sheet.getRange(1, 1, 1, writtenColumns).setValues([headers]);
    } catch (writeError) {
      try {
        restoreSheetSnapshot_(sheet, snapshot, writtenRows, writtenColumns);
      } catch (restoreError) {
        throw new Error(
          '同步寫入失敗且無法回復舊課表：' +
          (restoreError && restoreError.message ? restoreError.message : String(restoreError))
        );
      }
      throw writeError;
    }
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

function captureSheetSnapshot_(sheet) {
  var rows = Math.max(1, sheet.getLastRow());
  var columns = Math.max(1, sheet.getLastColumn());
  return {
    rows: rows,
    columns: columns,
    values: sheet.getRange(1, 1, rows, columns).getValues()
  };
}

function restoreSheetSnapshot_(sheet, snapshot, writtenRows, writtenColumns) {
  var rows = Math.max(snapshot.rows, writtenRows, sheet.getLastRow());
  var columns = Math.max(snapshot.columns, writtenColumns, sheet.getLastColumn());
  sheet.getRange(1, 1, rows, columns).clearContent();
  sheet.getRange(1, 1, snapshot.rows, snapshot.columns).setValues(snapshot.values);
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

function getMyCourses_(session) {
  var teacher = getSessionTeacherName_(session);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  assertHeaders_(sheet, ['日期', '時間', '課程', '指導者', 'OB Calendar ID']);
  ensureLeaveSheetHeaders_(leaveSheet);
  var activeLeaveIds = {};
  leaveSheet.getDataRange().getValues().slice(1).forEach(function(r) {
    if (cleanText_(r[1]) === teacher &&
        ['確認中', '已領取'].indexOf(cleanText_(r[5])) !== -1 && cleanText_(r[10])) {
      activeLeaveIds[cleanText_(r[10])] = true;
    }
  });

  return sheet.getDataRange().getValues().slice(1).filter(function(r) {
    var calendarId = cleanText_(r[4]);
    return cleanText_(r[3]) === teacher && calendarId && !activeLeaveIds[calendarId];
  }).map(function(r) {
    return {
      '日期': formatMyDate(r[0]),
      '時間': formatMyTime(r[1]),
      '課程': cleanText_(r[2]),
      '課程大類': getCourseCategory_(r[2]),
      'OB Calendar ID': cleanText_(r[4])
    };
  }).filter(function(item) {
    return item['日期'] && item['時間'] && item['課程'];
  }).sort(function(a, b) {
    return [a['日期'], a['時間'], a['課程']].join('|')
      .localeCompare([b['日期'], b['時間'], b['課程']].join('|'));
  });
}

function getMyLeaves_(session) {
  var teacher = getSessionTeacherName_(session);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  ensureLeaveSheetHeaders_(sheet);

  return sheet.getDataRange().getValues().slice(1).filter(function(r) {
    return cleanText_(r[1]) === teacher;
  }).map(function(r) {
    return {
      '登記時間': cleanText_(r[0]),
      '代課編號': cleanText_(r[9]),
      '日期': formatMyDate(r[2]),
      '時段': formatMyTime(r[3]),
      '課程': cleanText_(r[4]),
      '狀態': cleanText_(r[5]),
      '代課老師': cleanText_(r[6]),
      '備註': cleanText_(r[7]),
      '實際課程名稱': cleanText_(r[12]),
      '預計難度': cleanText_(r[13]),
      '處理類型': cleanText_(r[14]),
      'OB 核對狀態': cleanText_(r[15]),
      'OB 核對時間': cleanText_(r[16]),
      '差異原因': cleanText_(r[17]),
      '異動狀態': cleanText_(r[18])
    };
  }).sort(function(a, b) {
    return [b['日期'], b['時段'], b['登記時間']].join('|')
      .localeCompare([a['日期'], a['時段'], a['登記時間']].join('|'));
  });
}

function getSessionTeacherName_(session) {
  if (!session || typeof session !== 'object') throw new Error('登入狀態無效，請重新登入。');
  var teacher = cleanText_(session.teacherName);
  if (!teacher) throw new Error('登入狀態無效，請重新登入。');
  return teacher;
}

function assertAdminSession_(session) {
  var teacher = getSessionTeacherName_(session);
  if (!isAdminRole_(session.role)) throw new Error('需要管理權限。');
  return teacher;
}

function openInvitations_(session, teacherNames) {
  var actor = assertAdminSession_(session);
  var teachers = normalizeTeacherNames_(teacherNames);
  teachers.forEach(assertTeacherExists_);

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
    ensureSheetHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
    var values = sheet.getDataRange().getValues();
    var activeTeachers = {};
    values.slice(1).forEach(function(row) {
      if (cleanText_(row[4]) === CONFIG.INVITATION_OPEN_STATUS) {
        activeTeachers[cleanText_(row[1])] = true;
      }
    });

    var now = getTimestamp_();
    var rowsToAppend = [];
    teachers.forEach(function(teacher) {
      if (activeTeachers[teacher]) return;
      rowsToAppend.push([
        Utilities.getUuid(),
        teacher,
        now,
        '',
        CONFIG.INVITATION_OPEN_STATUS,
        ''
      ]);
      activeTeachers[teacher] = true;
    });
    if (rowsToAppend.length) {
      sheet.getRange(
        sheet.getLastRow() + 1,
        1,
        rowsToAppend.length,
        SHEET_HEADERS.INVITATIONS.length
      ).setValues(rowsToAppend);
    }
    rowsToAppend.forEach(function(row) {
      appendAudit_({
        actor: actor,
        action: '開放代課',
        targetId: row[0],
        before: '',
        after: CONFIG.INVITATION_OPEN_STATUS,
        reason: row[1]
      });
    });

    return {
      requested: teachers.length,
      opened: rowsToAppend.length,
      alreadyOpen: teachers.length - rowsToAppend.length
    };
  });
}

function closeInvitations_(session, teacherNames) {
  var actor = assertAdminSession_(session);
  var teachers = normalizeTeacherNames_(teacherNames);
  teachers.forEach(assertTeacherExists_);

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
    ensureSheetHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
    var values = sheet.getDataRange().getValues();
    var requestedTeachers = {};
    teachers.forEach(function(teacher) { requestedTeachers[teacher] = true; });
    var closedTeachers = {};
    var auditTargets = {};
    var now = getTimestamp_();

    for (var index = 1; index < values.length; index++) {
      var row = values[index];
      var teacher = cleanText_(row[1]);
      if (!requestedTeachers[teacher] || cleanText_(row[4]) !== CONFIG.INVITATION_OPEN_STATUS) continue;
      sheet.getRange(index + 1, 5, 1, 2).setValues([[
        CONFIG.INVITATION_CLOSED_STATUS,
        now
      ]]);
      closedTeachers[teacher] = true;
      if (!auditTargets[teacher]) auditTargets[teacher] = cleanText_(row[0]);
    }
    Object.keys(closedTeachers).forEach(function(teacher) {
      appendAudit_({
        actor: actor,
        action: '關閉代課',
        targetId: auditTargets[teacher],
        before: CONFIG.INVITATION_OPEN_STATUS,
        after: CONFIG.INVITATION_CLOSED_STATUS,
        reason: teacher
      });
    });

    var closed = Object.keys(closedTeachers).length;
    return {
      requested: teachers.length,
      closed: closed,
      notOpen: teachers.length - closed
    };
  });
}

function pauseClaims_(session, paused) {
  var actor = assertAdminSession_(session);
  var shouldPause = paused === true;

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.SETTINGS);
    ensureSheetHeaders_(sheet, SHEET_HEADERS.SETTINGS);
    var values = sheet.getDataRange().getValues();
    var rowNumber = 0;
    var previous = false;
    for (var index = 1; index < values.length; index++) {
      if (cleanText_(values[index][0]) === CONFIG.CLAIMS_PAUSED_SETTING) {
        rowNumber = index + 1;
        previous = isTruthySheetValue_(values[index][1]);
        break;
      }
    }

    var now = getTimestamp_();
    var nextValues = [[
      CONFIG.CLAIMS_PAUSED_SETTING,
      shouldPause ? '是' : '否',
      now,
      '由管理員手動控制'
    ]];
    if (rowNumber) {
      sheet.getRange(rowNumber, 1, 1, SHEET_HEADERS.SETTINGS.length).setValues(nextValues);
    } else {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.SETTINGS.length).setValues(nextValues);
    }
    appendAudit_({
      actor: actor,
      action: shouldPause ? '暫停全部領取' : '恢復全部領取',
      targetId: CONFIG.CLAIMS_PAUSED_SETTING,
      before: previous ? '是' : '否',
      after: shouldPause ? '是' : '否',
      reason: ''
    });
    return { paused: shouldPause };
  });
}

function getAvailableSubstitutes_(session) {
  var teacher = getSessionTeacherName_(session);
  assertTeacherExists_(teacher);

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var invitationSheet = requireSheet_(ss, SHEETS.INVITATIONS);
    ensureSheetHeaders_(invitationSheet, SHEET_HEADERS.INVITATIONS);
    var invitationValues = invitationSheet.getDataRange().getValues();
    var activeRows = [];
    for (var invitationIndex = 1; invitationIndex < invitationValues.length; invitationIndex++) {
      var invitationRow = invitationValues[invitationIndex];
      if (cleanText_(invitationRow[1]) === teacher &&
          cleanText_(invitationRow[4]) === CONFIG.INVITATION_OPEN_STATUS) {
        activeRows.push(invitationIndex + 1);
      }
    }
    if (!activeRows.length || areClaimsPaused_()) return [];

    var viewedAt = getTimestamp_();
    activeRows.forEach(function(rowNumber) {
      if (!cleanText_(invitationValues[rowNumber - 1][3])) {
        invitationSheet.getRange(rowNumber, 4).setValue(viewedAt);
      }
    });

    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    ensureLeaveSheetHeaders_(leaveSheet);
    var leaveValues = ensurePendingLeaveIdsUnlocked_(leaveSheet);
    return leaveValues.slice(1).filter(function(row) {
      return cleanText_(row[5]) === '確認中' && cleanText_(row[1]) !== teacher;
    }).map(function(row) {
      return {
        '代課編號': cleanText_(row[9]),
        '原老師': cleanText_(row[1]),
        '日期': formatMyDate(row[2]),
        '時段': formatMyTime(row[3]),
        '課程': cleanText_(row[4]),
        '課程大類': getCourseCategory_(row[4])
      };
    }).sort(function(a, b) {
      return [a['日期'], a['時段'], a['原老師'], a['代課編號']].join('|')
        .localeCompare([b['日期'], b['時段'], b['原老師'], b['代課編號']].join('|'));
    });
  });
}

function areClaimsPaused_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.SETTINGS);
  ensureSheetHeaders_(sheet, SHEET_HEADERS.SETTINGS);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][0]) === CONFIG.CLAIMS_PAUSED_SETTING) {
      return isTruthySheetValue_(values[index][1]);
    }
  }
  return false;
}

function hasActiveInvitation_(teacherName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
  ensureSheetHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
  var values = sheet.getDataRange().getValues();
  return values.slice(1).some(function(row) {
    return cleanText_(row[1]) === cleanText_(teacherName) &&
      cleanText_(row[4]) === CONFIG.INVITATION_OPEN_STATUS;
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

function submitLeave_(session, items) {
  var teacher = getSessionTeacherName_(session);
  if (!Array.isArray(items) || !items.length) throw new Error('請至少選擇一堂請假課程。');
  if (items.length > CONFIG.LEAVE_BATCH_MAX) {
    throw new Error('單次最多可送出 ' + CONFIG.LEAVE_BATCH_MAX + ' 堂請假課程。');
  }
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
    var courseByCalendarId = {};
    courseRows.forEach(function(r) {
      var calendarId = cleanText_(r[4]);
      if (calendarId && cleanText_(r[3]) === teacher) courseByCalendarId[calendarId] = r;
    });
    var seen = {};
    var duplicates = 0;
    var errors = [];
    var validated = [];
    items.forEach(function(rawItem, index) {
      var calendarId = cleanText_(rawItem && (rawItem['OB Calendar ID'] || rawItem.calendarId));
      try {
        var item = normalizeLeaveItem_(rawItem);
        if (seen[item['OB Calendar ID']]) {
          duplicates += 1;
          return;
        }
        seen[item['OB Calendar ID']] = true;

        var courseRow = courseByCalendarId[item['OB Calendar ID']];
        if (!courseRow || formatMyDate(courseRow[0]) !== item['日期'] ||
            formatMyTime(courseRow[1]) !== item['時間'] || cleanText_(courseRow[2]) !== item['課程']) {
          throw new Error('找不到 ' + item['日期'] + ' ' + item['時間'] + ' 的有效課程，請重新整理。');
        }
        if (isDuplicateLeave_(leaveRows, teacher, item)) {
          duplicates += 1;
          return;
        }
        validated.push(item);
      } catch (error) {
        errors.push({
          index: index,
          calendarId: calendarId,
          message: error && error.message ? error.message : String(error)
        });
      }
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
        Utilities.getUuid(),
        item['OB Calendar ID'],
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ];
    });
    if (rowsToAppend.length) {
      leaveSheet
        .getRange(leaveSheet.getLastRow() + 1, 1, rowsToAppend.length, SHEET_HEADERS.LEAVES.length)
        .setValues(rowsToAppend);
    }

    var result = {
      requested: items.length,
      created: rowsToAppend.length,
      duplicates: duplicates,
      failed: errors.length
    };
    if (errors.length) result.errors = errors;
    return result;
  } finally {
    lock.releaseLock();
  }
}

function claimSubstitute_(session, items) {
  var teacher = getSessionTeacherName_(session);
  if (!Array.isArray(items) || !items.length) throw new Error('請至少選擇一堂代課課程。');
  assertTeacherExists_(teacher);

  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    if (areClaimsPaused_()) throw new Error('目前暫停全部代課領取。');
    if (!hasActiveInvitation_(teacher)) throw new Error('目前尚未開放代課領取。');

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
        throw new Error('此課程剛被其他老師領取，請重新整理。');
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
      appendAudit_({
        actor: teacher,
        action: '領取代課',
        targetId: cleanText_(values[update.sheetRow - 1][9]),
        before: '確認中',
        after: '已領取',
        reason: update.values[2]
      });
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
    if (cleanText_(r[1]) !== cleanText_(instructor) ||
        ['確認中', '已領取'].indexOf(cleanText_(r[5])) === -1) {
      return false;
    }
    var itemCalendarId = cleanText_(item && (item['OB Calendar ID'] || item.calendarId));
    var rowCalendarId = cleanText_(r[10]);
    if (itemCalendarId && rowCalendarId) return itemCalendarId === rowCalendarId;
    return formatMyDate(r[2]) === formatMyDate(item['日期']) &&
      formatMyTime(r[3]) === formatMyTime(item['時間']) &&
      cleanText_(r[4]) === cleanText_(item['課程']);
  });
}

function ensurePendingLeaveIds_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    ensureLeaveSheetHeaders_(sheet);
    ensurePendingLeaveIdsUnlocked_(sheet);
  } finally {
    lock.releaseLock();
  }
}

function ensurePendingLeaveIdsUnlocked_(sheet) {
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][5]) === '確認中' && !cleanText_(values[index][9])) {
      var substituteId = Utilities.getUuid();
      sheet.getRange(index + 1, 10).setValue(substituteId);
      values[index][9] = substituteId;
    }
  }
  return values;
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
    '課程': cleanText_(item && (item['課程'] || item.course)),
    'OB Calendar ID': cleanText_(item && (item['OB Calendar ID'] || item.calendarId))
  };
  if (!normalized['日期'] || !normalized['時間'] || !normalized['課程'] ||
      !normalized['OB Calendar ID']) {
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

function parseTeacherNames_(parameters) {
  var source = parameters || {};
  if (cleanText_(source.teacherNames)) {
    return parseJsonArray_(source.teacherNames, '老師名單');
  }
  var teacherName = cleanText_(source.teacherName);
  return teacherName ? [teacherName] : [];
}

function normalizeTeacherNames_(teacherNames) {
  if (!Array.isArray(teacherNames)) throw new Error('老師名單必須是陣列。');
  var seen = {};
  var normalized = [];
  teacherNames.forEach(function(value) {
    var teacher = cleanText_(value);
    if (!teacher || seen[teacher]) return;
    seen[teacher] = true;
    normalized.push(teacher);
  });
  if (!normalized.length) throw new Error('請至少選擇一位老師。');
  return normalized;
}

function parseBoolean_(value, fieldName) {
  if (value === true || ['true', '1', '是'].indexOf(cleanText_(value).toLowerCase()) !== -1) return true;
  if (value === false || ['false', '0', '否'].indexOf(cleanText_(value).toLowerCase()) !== -1) return false;
  throw new Error((fieldName || '布林欄位') + '格式錯誤。');
}

function isTruthySheetValue_(value) {
  return value === true || ['true', '1', '是', '啟用'].indexOf(cleanText_(value).toLowerCase()) !== -1;
}

function getTimestamp_() {
  return Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
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
