var SHEETS = {
  COURSE_LIST: 'CourseList',
  LEAVES: '請假代課紀錄',
  LEGACY_LEAVES: '工作表1',
  INVITATIONS: '代課邀請',
  AUDIT: '操作紀錄',
  SETTINGS: '系統設定',
  ACCOUNTS: '登入帳號',
  PASSWORD_IMPORT: '密碼表',
  VVIP_MEMBERS: 'VVIP名單',
  VVIP_SELECTIONS: 'VVIP選課紀錄',
  VVIP_SETTINGS: 'VVIP選課設定',
  PAYROLL_RULES: '薪項設定',
  PAYROLL_SOURCE: '薪資來源資料',
  PAYROLL_SNAPSHOT: '薪資同步快照',
  PAYROLL_LINES: '薪資明細',
  PAYROLL_SUMMARIES: '薪資結算',
  PAYROLL_DISPUTES: '薪資異議',
  PAYROLL_PAYMENT_SETTINGS: '薪資付款設定',
  SHERRY_PAYROLL_FORMAT: '給雪莉的格式'
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
    '處理類型', 'OB 核對狀態', 'OB 核對時間', '差異原因', '異動狀態',
    '實際課程類別', '替代 OB Calendar ID'
  ],
  INVITATIONS: ['邀請編號', '老師', '開放時間', '首次查看時間', '狀態', '關閉時間'],
  AUDIT: ['操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因'],
  SETTINGS: ['設定名稱', '設定值', '更新時間', '備註'],
  ACCOUNTS: [
    '指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至',
    '可教授類別', '功能權限'
  ],
  VVIP_SELECTIONS: [
    '登記時間', 'Email', '月份', 'OB Calendar ID', '日期', '時間', '課程', '老師',
    '狀態', '確認時間', '取消時間', '取消原因', '操作者', 'VVIP ID', 'OB 名稱'
  ],
  VVIP_MEMBERS: [
    'VVIP ID', 'OB 名稱', 'Email', '是否啟用', '備註', '建立時間', '更新時間', '更新者'
  ],
  VVIP_SETTINGS: ['設定鍵', '設定值', '更新時間', '操作者'],
  PAYROLL_RULES: ['老師姓名', '課程關鍵字 (可留空)', '計費類型', '人數門檻', '金額'],
  PAYROLL_SOURCE: [
    '月份', 'OB Calendar ID', '日期時間', '課程', '指導者', '出席狀態', '缺席',
    '課程收入', '盈利', '教室', '分店', '更新時間'
  ],
  PAYROLL_SNAPSHOT: [
    '同步版本', '月份', 'OB Calendar ID', '日期', '時間', '課程', '全部指導者 JSON',
    '出席人數', '容量', '課程收入', '盈利', '教室', '分店', '同步時間', '檢查狀態'
  ],
  PAYROLL_LINES: [
    '月份', '明細 ID', '同步版本', 'OB Calendar ID', '老師', '日期', '時間', '課程',
    '計費類型', '出席人數', '課程收入', '套用規則', '規則說明', '金額', '人工調整',
    '調整理由', '狀態', '建立時間'
  ],
  PAYROLL_SUMMARIES: [
    '月份', '老師', '鐘點費小計', '獎金比例', '獎金金額', '固定津貼/扣項',
    '應領總薪資', '盈利', '發布版本', '狀態', '確認時間', '最後更新時間',
    '管理員加扣', '管理員調整原因', '管理員確認時間', '管理員確認者'
  ],
  PAYROLL_DISPUTES: [
    '異議 ID', '月份', '老師', '明細 ID', '問題說明', '狀態', '管理員回覆',
    '提出時間', '處理者', '處理時間'
  ],
  PAYROLL_PAYMENT_SETTINGS: ['老師', '轉帳群組/銀行', '備註', '是否啟用']
};

var CONFIG = {
  COURSE_SHEET: SHEETS.COURSE_LIST,
  LEAVE_SHEET: SHEETS.LEAVES,
  API_URL: 'https://api.omceanbooking.com/v1/calendar',
  API_TOKEN_PROPERTY: 'OMCEAN_API_TOKEN',
  PAGE_SIZE: 100,
  LOCK_TIMEOUT_MS: 30000,
  AUTH_SESSION_DURATION_SECONDS: 30 * 24 * 60 * 60,
  AUTH_CACHE_DURATION_SECONDS: 21600,
  AUTH_MAX_FAILED_ATTEMPTS: 5,
  AUTH_LOCK_DURATION_MS: 15 * 60 * 1000,
  AUTH_SESSION_KEY_PREFIX: 'SUBSTITUTE_SESSION_',
  PASSWORD_IMPORT_COMPLETED_PROPERTY: 'TEACHER_PASSWORD_IMPORT_COMPLETED_AT',
  PASSWORD_IMPORT_EXPECTED_ROWS: 37,
  LEAVE_BATCH_MAX: 50,
  INVITATION_OPEN_STATUS: '開放中',
  INVITATION_CLOSED_STATUS: '已關閉',
  CLAIMS_PAUSED_SETTING: '暫停全部領取',
  LEAVES_PAUSED_SETTING: '暫停全部請假',
  VVIP_MAX_SELECTIONS: 4,
  VVIP_PENDING_STATUS: '待人工確認',
  VVIP_CONFIRMED_STATUS: '已確認',
  VVIP_CANCELLED_STATUS: '已取消',
  PAYROLL_DRAFT_STATUS: '草稿',
  PAYROLL_PUBLISHED_STATUS: '待確認',
  PAYROLL_CONFIRMED_STATUS: '已確認',
  PAYROLL_FINALIZED_STATUS: '管理員已確認',
  PAYROLL_REVIEW_STATUS: '有異議'
};

var MANAGEMENT_CAPABILITIES = ['course_admin', 'payroll_admin', 'vvip_admin'];

function setupSystemStructure() {
  return ensureSystemStructure_();
}

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
      role: role,
      managementCapabilities: getAccountManagementCapabilities_(account)
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

  var account = findAccount_(cleanText_(session.teacherName));
  if (!account) {
    removeSession_(sessionToken);
    throw new Error('登入帳號不存在，請重新登入。');
  }
  if (!isAccountActive_(account.active)) {
    removeSession_(sessionToken);
    throw new Error('帳號目前未啟用。');
  }
  return {
    teacherName: account.teacherName,
    role: normalizeAccountRole_(account.role),
    capabilities: normalizeTeacherCapabilities_(account.capabilities),
    managementCapabilities: getAccountManagementCapabilities_(account)
  };
}

function requireAdmin_(token) {
  var session = requireSession_(token);
  if (!isAdminRole_(session.role)) throw new Error('需要管理權限。');
  return session;
}

function requireCapability_(token, capability) {
  var session = requireSession_(token);
  var required = cleanText_(capability);
  if (session.managementCapabilities.indexOf(required) === -1) {
    var labels = {
      course_admin: '課程管理權限',
      payroll_admin: '薪資管理權限',
      vvip_admin: 'VVIP 管理權限'
    };
    throw new Error('沒有' + (labels[required] || '此功能管理權限') + '。');
  }
  return session;
}

function setupAccount_(adminToken, teacherName, pin, options) {
  requireAdmin_(adminToken);

  var teacher = cleanText_(teacherName);
  var pinText = requireFourDigitPin_(pin);
  if (!teacher) throw new Error('請輸入老師姓名與身分證末碼。');

  var settings = options || {};
  var active = settings.active !== false;
  var role = normalizeAccountRole_(settings.role);
  var sheet = getAccountsSheet_();
  protectAccountsSheet_(sheet);
  var headers = getHeaderMap_(sheet);
  var values = sheet.getDataRange().getValues();
  var existingRow = 0;

  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][headers['指導者'] - 1]) === teacher) {
      existingRow = index + 1;
      break;
    }
  }

  var capabilityValue = settings.capabilities == null
    ? ''
    : normalizeTeacherCapabilities_(settings.capabilities).join('、');
  if (existingRow && settings.capabilities == null) {
    capabilityValue = cleanText_(values[existingRow - 1][headers['可教授類別'] - 1]);
  }
  var managementCapabilityValue = settings.managementCapabilities == null
    ? ''
    : normalizeManagementCapabilities_(settings.managementCapabilities).join(',');
  if (existingRow && settings.managementCapabilities == null) {
    managementCapabilityValue = cleanText_(values[existingRow - 1][headers['功能權限'] - 1]);
  }
  var accountValues = buildAccountValues_(teacher, pinText, {
    active: active,
    role: role,
    capabilities: capabilityValue,
    managementCapabilities: managementCapabilityValue
  });
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, SHEET_HEADERS.ACCOUNTS.length).setValues([accountValues]);
  } else {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.ACCOUNTS.length).setValues([accountValues]);
  }

  return { teacherName: teacher, role: role, active: active };
}

function buildAccountValues_(teacherName, pin, options) {
  var teacher = cleanText_(teacherName);
  var pinText = requireFourDigitPin_(pin);
  if (!teacher) throw new Error('請輸入老師姓名與身分證末碼。');

  var settings = options || {};
  var active = settings.active !== false;
  var role = normalizeAccountRole_(settings.role);
  var capabilities = settings.capabilities == null
    ? ''
    : normalizeTeacherCapabilities_(settings.capabilities).join('、');
  var managementCapabilities = settings.managementCapabilities == null
    ? ''
    : normalizeManagementCapabilities_(settings.managementCapabilities).join(',');
  var salt = createRandomToken_();
  var pinHash = hashPin_(pinText, salt);
  return [teacher, salt, pinHash, active ? '是' : '否', role, 0, '', capabilities, managementCapabilities];
}

function importTeacherAccountsFromPasswordSheet() {
  return withScriptLock_(function() {
    var properties = getScriptProperties_();
    if (!properties) throw new Error('無法讀取指令碼屬性，請稍後再試。');
    if (properties.getProperty(CONFIG.PASSWORD_IMPORT_COMPLETED_PROPERTY)) {
      throw new Error('老師密碼批次匯入已經完成過；如需重新匯入，請由管理員先人工確認。');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sourceSheet = requireSheet_(ss, SHEETS.PASSWORD_IMPORT);
    var sourceValues = sourceSheet.getDataRange().getValues();
    var sourceHeaders = sourceValues[0] || [];
    var teacherColumn = 0;
    var passwordColumn = 0;
    sourceHeaders.forEach(function(header, index) {
      var name = cleanText_(header);
      if (name === '老師' && !teacherColumn) teacherColumn = index + 1;
      if (name === '密碼' && !passwordColumn) passwordColumn = index + 1;
    });
    if (!teacherColumn || !passwordColumn) {
      throw new Error('「密碼表」必須包含「老師」與「密碼」標題。');
    }

    var records = [];
    var seenNames = {};
    var lastSourceRow = 1;
    for (var index = 1; index < sourceValues.length; index++) {
      var rowNumber = index + 1;
      var teacher = cleanText_(sourceValues[index][teacherColumn - 1]);
      var pin = cleanText_(sourceValues[index][passwordColumn - 1]);
      if (!teacher && !pin) continue;
      lastSourceRow = rowNumber;
      if (!teacher) throw new Error('密碼表第 ' + rowNumber + ' 列缺少老師姓名。');
      if (!/^\d{4}$/.test(pin)) {
        throw new Error('密碼表第 ' + rowNumber + ' 列的密碼必須是 4 位數字。');
      }
      var teacherKey = teacher.toLowerCase();
      if (seenNames[teacherKey]) {
        throw new Error(
          '老師姓名重複：密碼表第 ' + rowNumber + ' 列與第 ' + seenNames[teacherKey] + ' 列皆為「' + teacher + '」。'
        );
      }
      seenNames[teacherKey] = rowNumber;
      records.push({ teacherName: teacher, pin: pin });
    }

    if (records.length !== CONFIG.PASSWORD_IMPORT_EXPECTED_ROWS) {
      throw new Error(
        '密碼表應有 ' + CONFIG.PASSWORD_IMPORT_EXPECTED_ROWS + ' 位老師，目前讀到 ' + records.length + ' 位。'
      );
    }

    var accountSheet = requireSheet_(ss, SHEETS.ACCOUNTS);
    protectAccountsSheet_(accountSheet);
    var actualHeaders = accountSheet
      .getRange(1, 1, 1, SHEET_HEADERS.ACCOUNTS.length)
      .getValues()[0];
    SHEET_HEADERS.ACCOUNTS.forEach(function(header, headerIndex) {
      if (cleanText_(actualHeaders[headerIndex]) !== header) {
        throw new Error('登入帳號第 ' + (headerIndex + 1) + ' 欄標題應為「' + header + '」。');
      }
    });

    var accountValues = accountSheet.getDataRange().getValues();
    var accountRows = accountValues.slice(1).map(function(row) {
      return SHEET_HEADERS.ACCOUNTS.map(function(_header, columnIndex) {
        return row[columnIndex] == null ? '' : row[columnIndex];
      });
    });
    var accountIndexes = {};
    accountRows.forEach(function(row, rowIndex) {
      var existingName = cleanText_(row[0]);
      if (!existingName) return;
      var existingKey = existingName.toLowerCase();
      if (accountIndexes[existingKey] != null) {
        throw new Error('登入帳號內有重複老師姓名：「' + existingName + '」。');
      }
      accountIndexes[existingKey] = rowIndex;
    });

    var created = 0;
    var updated = 0;
    records.forEach(function(record) {
      var values = buildAccountValues_(record.teacherName, record.pin, {
        active: true,
        role: '老師',
        capabilities: [],
        managementCapabilities: []
      });
      var key = record.teacherName.toLowerCase();
      if (accountIndexes[key] == null) {
        accountIndexes[key] = accountRows.length;
        accountRows.push(values);
        created++;
      } else {
        var existingValues = accountRows[accountIndexes[key]];
        values[3] = existingValues[3];
        values[4] = existingValues[4];
        values[5] = existingValues[5];
        values[6] = existingValues[6];
        values[7] = existingValues[7];
        values[8] = existingValues[8];
        accountRows[accountIndexes[key]] = values;
        updated++;
      }
    });

    var accountRowsBefore = Math.max(0, accountSheet.getLastRow() - 1);
    var accountRange = accountSheet.getRange(
      2,
      1,
      accountRows.length,
      SHEET_HEADERS.ACCOUNTS.length
    );
    var pinRange = sourceSheet.getRange(2, passwordColumn, lastSourceRow - 1, 1);
    var importSnapshot = {
      accountSheet: accountSheet,
      accountRange: accountRange,
      accountRowsBefore: accountRowsBefore,
      accountValues: accountRange.getValues(),
      pinRange: pinRange,
      pinValues: pinRange.getValues(),
      properties: properties,
      completionPropertyValue: properties.getProperty(CONFIG.PASSWORD_IMPORT_COMPLETED_PROPERTY)
    };

    try {
      accountRange.setValues(accountRows);
      pinRange.clearContent();
      properties.setProperty(
        CONFIG.PASSWORD_IMPORT_COMPLETED_PROPERTY,
        Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss')
      );
    } catch (error) {
      var rollbackFailures = rollbackTeacherPasswordImport_(importSnapshot);
      var failureMessage = '老師密碼批次匯入失敗：' + getErrorMessage_(error);
      if (rollbackFailures.length) {
        throw new Error(failureMessage + '；回復失敗：' + rollbackFailures.join('；'));
      }
      throw new Error(failureMessage + '；已完成回復，未保留部分變更。');
    }

    return {
      sourceSheet: SHEETS.PASSWORD_IMPORT,
      imported: records.length,
      created: created,
      updated: updated
    };
  });
}

function rollbackTeacherPasswordImport_(snapshot) {
  var failures = [];

  try {
    snapshot.accountRange.clearContent();
    if (snapshot.accountRowsBefore > 0) {
      snapshot.accountSheet
        .getRange(
          2,
          1,
          snapshot.accountRowsBefore,
          SHEET_HEADERS.ACCOUNTS.length
        )
        .setValues(snapshot.accountValues.slice(0, snapshot.accountRowsBefore));
    }
  } catch (error) {
    failures.push('登入帳號：' + getErrorMessage_(error));
  }

  try {
    snapshot.pinRange.setValues(snapshot.pinValues);
  } catch (error) {
    failures.push('密碼表 PIN：' + getErrorMessage_(error));
  }

  try {
    if (snapshot.completionPropertyValue == null) {
      snapshot.properties.deleteProperty(CONFIG.PASSWORD_IMPORT_COMPLETED_PROPERTY);
    } else {
      snapshot.properties.setProperty(
        CONFIG.PASSWORD_IMPORT_COMPLETED_PROPERTY,
        snapshot.completionPropertyValue
      );
    }
  } catch (error) {
    failures.push('完成標記：' + getErrorMessage_(error));
  }

  return failures;
}

function getErrorMessage_(error) {
  return error && error.message ? error.message : String(error);
}

function initializeFirstAdmin_(teacherName, pin) {
  var teacher = cleanText_(teacherName);
  var pinText = requireFourDigitPin_(pin);
  if (!teacher) throw new Error('請輸入管理員姓名與身分證末碼。');

  return withScriptLock_(function() {
    var sheet = getAccountsSheet_();
    protectAccountsSheet_(sheet);
    var headers = getHeaderMap_(sheet);
    var values = sheet.getDataRange().getValues();
    var hasAccount = values.slice(1).some(function(row) {
      return cleanText_(row[headers['指導者'] - 1]);
    });
    if (hasAccount) throw new Error('已有帳號，請使用管理員帳號新增其他帳號。');

    var salt = createRandomToken_();
    var pinHash = hashPin_(pinText, salt);
    sheet.getRange(2, 1, 1, SHEET_HEADERS.ACCOUNTS.length).setValues([[
      teacher, salt, pinHash, '是', '管理員', 0, '', '', MANAGEMENT_CAPABILITIES.join(',')
    ]]);
    return { teacherName: teacher, role: '管理員', active: true };
  });
}

function requireFourDigitPin_(pin) {
  var pinText = cleanText_(pin);
  if (!/^\d{4}$/.test(pinText)) {
    throw new Error('身分證末碼必須是 4 位數字。');
  }
  return pinText;
}

function protectAccountsSheet_(sheet) {
  if (!sheet || typeof sheet.protect !== 'function' || typeof sheet.getProtections !== 'function') {
    throw new Error('目前無法保護「' + SHEETS.ACCOUNTS + '」工作表，請確認執行帳號權限。');
  }
  var protectionType = SpreadsheetApp.ProtectionType
    ? SpreadsheetApp.ProtectionType.SHEET
    : null;
  var description = '系統保護：' + SHEETS.ACCOUNTS;
  var protections = sheet.getProtections(protectionType) || [];
  var protection = null;
  for (var index = 0; index < protections.length; index++) {
    if (protections[index].getDescription() === description) {
      protection = protections[index];
      break;
    }
  }
  if (!protection) protection = sheet.protect().setDescription(description);

  var effectiveUser = Session.getEffectiveUser ? Session.getEffectiveUser() : null;
  var effectiveEmail = effectiveUser && effectiveUser.getEmail
    ? cleanText_(effectiveUser.getEmail())
    : '';
  if (effectiveUser) protection.addEditor(effectiveUser);
  var removableEditors = (protection.getEditors() || []).filter(function(editor) {
    return !effectiveEmail || cleanText_(editor.getEmail()) !== effectiveEmail;
  });
  if (removableEditors.length) protection.removeEditors(removableEditors);
  if (protection.canDomainEdit()) protection.setDomainEdit(false);
  return protection;
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
        lockedUntil: row[headers['鎖定至'] - 1],
        capabilities: row[headers['可教授類別'] - 1],
        managementCapabilities: row[headers['功能權限'] - 1]
      };
    }
  }
  return null;
}

function getAccountsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.ACCOUNTS);
  assertHeaders_(sheet, SHEET_HEADERS.ACCOUNTS);
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

function normalizeManagementCapabilities_(value) {
  var source = Array.isArray(value) ? value : cleanText_(value).split(/[、,，;；\s]+/);
  var seen = {};
  return source.map(cleanText_).filter(function(capability) {
    if (MANAGEMENT_CAPABILITIES.indexOf(capability) === -1 || seen[capability]) return false;
    seen[capability] = true;
    return true;
  });
}

function getAccountManagementCapabilities_(account) {
  var capabilities = normalizeManagementCapabilities_(account && account.managementCapabilities);
  if (!capabilities.length && account && isAdminRole_(account.role)) {
    return MANAGEMENT_CAPABILITIES.slice();
  }
  return capabilities;
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
    cache.put(key, payload, Math.min(
      CONFIG.AUTH_SESSION_DURATION_SECONDS,
      CONFIG.AUTH_CACHE_DURATION_SECONDS
    ));
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
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = migrateLeaveSheet_(ss);
    var courseSheet = requireSheet_(ss, SHEETS.COURSE_LIST);

    ensureSheetHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    ensureSheetHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    ensureSupportingSheet_(ss, SHEETS.INVITATIONS, SHEET_HEADERS.INVITATIONS);
    ensureSupportingSheet_(ss, SHEETS.AUDIT, SHEET_HEADERS.AUDIT);
    ensureSupportingSheet_(ss, SHEETS.SETTINGS, SHEET_HEADERS.SETTINGS);
    ensureVvipStructureUnlocked_(ss);
    ensurePayrollStructureUnlocked_(ss);
    var accountSheet = ensureSupportingSheet_(ss, SHEETS.ACCOUNTS, SHEET_HEADERS.ACCOUNTS);
    protectAccountsSheet_(accountSheet);

    return {
      leaveSheetName: SHEETS.LEAVES,
      migration: migrateLegacyLeaveLinksUnlocked_(leaveSheet, courseSheet)
    };
  });
}

function ensureVvipStructure_() {
  return withScriptLock_(function() {
    return ensureVvipStructureUnlocked_(SpreadsheetApp.getActiveSpreadsheet());
  });
}

function ensureVvipStructureUnlocked_(spreadsheet) {
  var members = ensureSupportingSheet_(
    spreadsheet,
    SHEETS.VVIP_MEMBERS,
    SHEET_HEADERS.VVIP_MEMBERS
  );
  var selections = ensureSupportingSheet_(
    spreadsheet,
    SHEETS.VVIP_SELECTIONS,
    SHEET_HEADERS.VVIP_SELECTIONS
  );
  var settings = ensureSupportingSheet_(
    spreadsheet,
    SHEETS.VVIP_SETTINGS,
    SHEET_HEADERS.VVIP_SETTINGS
  );
  return { members: members.getName(), selections: selections.getName(), settings: settings.getName() };
}

function ensurePayrollStructure_() {
  return withScriptLock_(function() {
    return ensurePayrollStructureUnlocked_(SpreadsheetApp.getActiveSpreadsheet());
  });
}

function ensurePayrollStructureUnlocked_(spreadsheet) {
  var result = {};
  [
    ['rules', SHEETS.PAYROLL_RULES, SHEET_HEADERS.PAYROLL_RULES],
    ['source', SHEETS.PAYROLL_SOURCE, SHEET_HEADERS.PAYROLL_SOURCE],
    ['snapshot', SHEETS.PAYROLL_SNAPSHOT, SHEET_HEADERS.PAYROLL_SNAPSHOT],
    ['lines', SHEETS.PAYROLL_LINES, SHEET_HEADERS.PAYROLL_LINES],
    ['summaries', SHEETS.PAYROLL_SUMMARIES, SHEET_HEADERS.PAYROLL_SUMMARIES],
    ['disputes', SHEETS.PAYROLL_DISPUTES, SHEET_HEADERS.PAYROLL_DISPUTES],
    ['paymentSettings', SHEETS.PAYROLL_PAYMENT_SETTINGS, SHEET_HEADERS.PAYROLL_PAYMENT_SETTINGS]
  ].forEach(function(definition) {
    result[definition[0]] = ensureSupportingSheet_(spreadsheet, definition[1], definition[2]).getName();
  });
  seedPayrollRulesUnlocked_(requireSheet_(spreadsheet, SHEETS.PAYROLL_RULES));
  return result;
}

function seedPayrollRulesUnlocked_(sheet) {
  if (sheet.getLastRow() > 1) return { seeded: false, count: sheet.getLastRow() - 1 };
  var rows = [
    ['妙妙 簡', '綢吊', '標準時薪', 0, 1200],
    ['Josty Lin', '(留空)', '標準時薪', 0, 1500],
    ['卡拉 卡拉', '(留空)', '標準時薪', 0, 1000],
    ['姝姝', '私人包班', '標準時薪', 0, 1000],
    ['Tako', '勞健保扣除額', '固定扣項', 0, 1139],
    ['Tako', '店長固定底薪', '固定加給', 0, 32000],
    ['冠蓉', '(留空)', '固定月薪', 0, 30000],
    ['預設值', '場地租借', '標準時薪', 0, 0],
    ['預設值', '(留空)', '人數階梯', 2, 700],
    ['預設值', '(留空)', '人數階梯', 3, 800],
    ['預設值', '(留空)', '人數階梯', 4, 900],
    ['預設值', '(留空)', '人數階梯', 5, 1000],
    ['預設值', '(留空)', '人數階梯', 6, 1100],
    ['預設值', '(留空)', '人數階梯', 7, 1100],
    ['預設值', '(留空)', '人數階梯', 8, 1100],
    ['預設值', '(留空)', '人數階梯', 9, 1200],
    ['預設值', '(留空)', '人數階梯', 10, 1300],
    ['芮錤 77', '私人包班', '標準時薪', 0, 1000],
    ['Jina', '私人包班', '標準時薪', 0, 2000]
  ];
  sheet.getRange(2, 1, rows.length, SHEET_HEADERS.PAYROLL_RULES.length).setValues(rows);
  return { seeded: true, count: rows.length };
}

function migrateLegacyLeaveLinksUnlocked_(leaveSheet, courseSheet) {
  var leaveValues = leaveSheet.getDataRange().getValues();
  var courseValues = courseSheet.getDataRange().getValues();
  var matchesByKey = {};
  courseValues.slice(1).forEach(function(row) {
    var calendarId = cleanText_(row[4]);
    if (!calendarId) return;
    var key = getLegacyCourseMatchKey_(row[3], row[0], row[1], row[2]);
    if (!matchesByKey[key]) matchesByKey[key] = [];
    matchesByKey[key].push(calendarId);
  });

  var result = { assignedIds: 0, linked: 0, manualReview: 0 };
  var updates = [];
  for (var index = 1; index < leaveValues.length; index++) {
    var row = leaveValues[index].slice();
    while (row.length < SHEET_HEADERS.LEAVES.length) row.push('');
    if (['確認中', '已領取'].indexOf(cleanText_(row[5])) === -1) continue;
    var changed = false;

    if (!cleanText_(row[9])) {
      row[9] = Utilities.getUuid();
      result.assignedIds += 1;
      changed = true;
    }

    if (!cleanText_(row[10])) {
      var key = getLegacyCourseMatchKey_(row[1], row[2], row[3], row[4]);
      var matches = matchesByKey[key] || [];
      if (matches.length === 1) {
        row[10] = matches[0];
        row[17] = '';
        if (cleanText_(row[5]) === '已領取') row[15] = '待核對';
        else if (cleanText_(row[15]) === '待人工核對') row[15] = '';
        result.linked += 1;
        changed = true;
      } else {
        var reason = matches.length > 1
          ? '找到多筆完全相同的 OB 課程，請人工指定。'
          : '找不到完全相同的 OB 課程，請人工核對。';
        if (cleanText_(row[15]) !== '待人工核對' || cleanText_(row[17]) !== reason) {
          row[15] = '待人工核對';
          row[16] = '';
          row[17] = reason;
          result.manualReview += 1;
          changed = true;
        }
      }
    }
    if (changed) updates.push({ rowNumber: index + 1, values: row });
  }

  if (!updates.length) return result;
  return runStateTransitionUnlocked_([leaveSheet], function(appendAudits) {
    updates.forEach(function(update) {
      leaveSheet.getRange(update.rowNumber, 1, 1, SHEET_HEADERS.LEAVES.length)
        .setValues([update.values]);
    });
    appendAudits([{
      actor: '系統設定',
      action: '舊資料遷移',
      targetId: SHEETS.LEAVES,
      before: '',
      after: [
        '補代課編號 ' + result.assignedIds,
        '安全連結 ' + result.linked,
        '待人工核對 ' + result.manualReview
      ].join('；'),
      reason: '僅回填老師、日期、時間與課名完全一致且唯一的 OB Calendar ID'
    }]);
    return result;
  });
}

function getLegacyCourseMatchKey_(teacher, date, time, course) {
  return [
    cleanText_(teacher),
    formatMyDate(date),
    formatMyTime(time),
    normalizeCourseName_(course)
  ].join('|');
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
  var sheet = requireSheet_(ss, SHEETS.AUDIT);
  assertHeaders_(sheet, SHEET_HEADERS.AUDIT);
  appendAuditEventsUnlocked_(sheet, [event]);
}

function createAuditRow_(event) {
  var item = event || {};
  return [
    Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss'),
    cleanText_(item.actor),
    cleanText_(item.action),
    cleanText_(item.targetId),
    cleanText_(item.before),
    cleanText_(item.after),
    cleanText_(item.reason)
  ];
}

function appendAuditEventsUnlocked_(sheet, events) {
  var rows = (events || []).map(createAuditRow_);
  if (!rows.length) return;
  sheet.getRange(
    sheet.getLastRow() + 1,
    1,
    rows.length,
    SHEET_HEADERS.AUDIT.length
  ).setValues(rows);
}

function doGet(e) {
  if (!e || !e.parameter || Object.keys(e.parameter).length === 0) {
    return ContentService
      .createTextOutput('Sherry Aerial Studio - 系統連線正常')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    var action = cleanText_(e.parameter.action);
    var handlers = {
      getTeachers: function() { return getTeachers_(); }
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

    if (action === 'getVvipSelection') {
      return createJsonResponse_({
        status: 'success',
        data: getVvipSelection_(parameters.vvipId)
      });
    }

    if (action === 'getVvipMembers') {
      return createJsonResponse_({ status: 'success', data: getPublicVvipMembers_() });
    }

    if (action === 'submitVvipSelection') {
      return createJsonResponse_({
        status: 'success',
        data: submitVvipSelection_(
          parameters.vvipId,
          parseJsonArray_(parameters.calendarIds, 'VVIP 課程')
        )
      });
    }

    var session = requireSession_(parameters.sessionToken);
    if (action === 'logout') {
      removeSession_(parameters.sessionToken);
      return createJsonResponse_({ status: 'success', data: { loggedOut: true } });
    }

    var handlers = {
      getSession: function() {
        return {
          teacherName: session.teacherName,
          role: session.role,
          managementCapabilities: session.managementCapabilities || []
        };
      },
      getAvailableSubstitutes: function() {
        var available = getAvailableSubstitutes_(session);
        recordInvitationFirstView_(session);
        return available;
      },
      getClaimOptions: function() {
        return getClaimOptions_(session);
      },
      getMySubs: function() {
        return getMySubs_(session.teacherName);
      },
      getMyCourses: function() {
        return getMyCourses_(session);
      },
      getMyLeaves: function() {
        return getMyLeaves_(session);
      },
      getMyPayroll: function() {
        return getMyPayroll_(session, parameters.month);
      },
      getAdminDashboard: function() {
        return getAdminDashboard_(session);
      },
      getPayrollAdminDashboard: function() {
        return getPayrollAdminDashboard_(session, parameters.month);
      },
      setupSystemStructure: function() {
        assertCapabilitySession_(session, 'course_admin');
        return ensureSystemStructure_();
      },
      getVvipAdminDashboard: function() {
        return getVvipAdminDashboard_(session, parameters.email);
      },
      saveVvipMember: function() {
        return saveVvipMember_(session, {
          id: parameters.vvipId,
          name: parameters.name,
          email: parameters.email,
          active: parameters.active == null ? true : parseBoolean_(parameters.active, 'VVIP 啟用設定'),
          note: parameters.note
        });
      },
      setVvipMemberActive: function() {
        return setVvipMemberActive_(
          session,
          parameters.vvipId,
          parseBoolean_(parameters.active, 'VVIP 啟用設定')
        );
      },
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
      },
      pauseLeaves: function() {
        return pauseLeaves_(session, parseBoolean_(parameters.paused, '暫停請假設定'));
      },
      cancelLeave: function() {
        return cancelLeave_(session, parameters.substituteId);
      },
      requestLeaveCancellation: function() {
        return requestLeaveCancellation_(session, parameters.substituteId, parameters.reason);
      },
      requestClaimWithdrawal: function() {
        return requestClaimWithdrawal_(session, parameters.substituteId, parameters.reason);
      },
      resolveChangeRequest: function() {
        return resolveChangeRequest_(
          session,
          parameters.substituteId,
          parameters.decision,
          parameters.reason
        );
      },
      reconcileObChanges: function() {
        return reconcileObChanges_(session);
      },
      linkReplacementCalendarItem: function() {
        return linkReplacementCalendarItem_(
          session,
          parameters.substituteId,
          parameters.replacementCalendarId
        );
      },
      syncObCalendar: function() {
        assertCapabilitySession_(session, 'course_admin');
        return syncCourseListFromApi(parameters.sessionToken);
      },
      syncPayrollMonth: function() {
        return syncPayrollMonth_(session, parameters.month);
      },
      publishPayroll: function() {
        return publishPayroll_(session, parameters.month, parameters.version);
      },
      confirmPayroll: function() {
        return confirmPayroll_(session, parameters.month, parameters.version);
      },
      submitPayrollDispute: function() {
        return submitPayrollDispute_(session, {
          month: parameters.month,
          version: parameters.version,
          lineId: parameters.lineId,
          message: parameters.message
        });
      },
      resolvePayrollDispute: function() {
        return resolvePayrollDispute_(session, {
          disputeId: parameters.disputeId,
          reply: parameters.reply
        });
      },
      adjustPayrollSummary: function() {
        return adjustPayrollSummary_(session, {
          month: parameters.month,
          version: parameters.version,
          teacherName: parameters.teacherName,
          adjustment: parameters.adjustment,
          reason: parameters.reason
        });
      },
      finalizePayroll: function() {
        return finalizePayroll_(
          session,
          parameters.month,
          parameters.version,
          parseTeacherNames_(parameters)
        );
      },
      setVvipSelectionOpen: function() {
        return setVvipSelectionOpen_(session, parseBoolean_(parameters.open, 'VVIP 開放設定'));
      },
      confirmVvipEmail: function() {
        return confirmVvipEmail_(session, parameters.email);
      },
      cancelVvipSelection: function() {
        return cancelVvipSelection_(session, parameters.email, parameters.calendarId, parameters.reason);
      },
      exportVvipSelectionsCsv: function() {
        return exportVvipSelectionsCsv_(session);
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
  var admin = requireCapability_(sessionToken, 'course_admin');

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
      appendAudit_({
        actor: admin.teacherName,
        action: '同步 OB 課表',
        targetId: range.dateFrom + '~' + range.dateTo,
        before: '',
        after: String(normalized.length) + ' 筆',
        reason: ''
      });
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
  var targetRows = Number(writtenRows);
  var targetColumns = Number(writtenColumns);
  if (!isFinite(targetRows) || targetRows < 1) targetRows = snapshot.rows;
  if (!isFinite(targetColumns) || targetColumns < 1) targetColumns = snapshot.columns;
  var rows = Math.max(snapshot.rows, targetRows, sheet.getLastRow());
  var columns = Math.max(snapshot.columns, targetColumns, sheet.getLastColumn());
  sheet.getRange(1, 1, rows, columns).clearContent();
  sheet.getRange(1, 1, snapshot.rows, snapshot.columns).setValues(snapshot.values);
}

function runStateTransitionUnlocked_(businessSheets, callback) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var auditSheet = requireSheet_(ss, SHEETS.AUDIT);
  assertHeaders_(auditSheet, SHEET_HEADERS.AUDIT);

  var uniqueSheets = [];
  var seen = {};
  (businessSheets || []).concat([auditSheet]).forEach(function(sheet) {
    var key = sheet.getName();
    if (seen[key]) return;
    seen[key] = true;
    uniqueSheets.push(sheet);
  });
  var snapshots = uniqueSheets.map(function(sheet) {
    return { sheet: sheet, snapshot: captureSheetSnapshot_(sheet) };
  });

  try {
    return callback(function(events) {
      appendAuditEventsUnlocked_(auditSheet, events);
    });
  } catch (error) {
    var rollbackFailures = [];
    snapshots.slice().reverse().forEach(function(item) {
      try {
        restoreSheetSnapshot_(item.sheet, item.snapshot);
      } catch (restoreError) {
        rollbackFailures.push(
          item.sheet.getName() + '：' + getErrorMessage_(restoreError)
        );
      }
    });
    if (rollbackFailures.length) {
      throw new Error(
        getErrorMessage_(error) + '；資料回復失敗：' + rollbackFailures.join('；')
      );
    }
    throw error;
  }
}

function getTeachers_() {
  var sheet = getAccountsSheet_();
  var headers = getHeaderMap_(sheet);
  var values = sheet.getDataRange().getValues();
  return values.slice(1).map(function(row) {
    return {
      teacherName: cleanText_(row[headers['指導者'] - 1]),
      salt: cleanText_(row[headers['Salt'] - 1]),
      pinHash: cleanText_(row[headers['PIN 雜湊'] - 1]),
      active: row[headers['是否在職'] - 1]
    };
  }).filter(function(item) {
    return item.teacherName && item.salt && item.pinHash && isAccountActive_(item.active);
  }).map(function(item) {
    return { '指導者': item.teacherName };
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

function normalizeVvipEmail_(value) {
  var email = cleanText_(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('請輸入有效的 Email。');
  }
  return email;
}

function getVvipMemberRows_(sheet) {
  assertHeaders_(sheet, SHEET_HEADERS.VVIP_MEMBERS);
  return sheet.getDataRange().getValues().slice(1).map(function(row, index) {
    return {
      rowNumber: index + 2,
      id: cleanText_(row[0]),
      name: cleanText_(row[1]),
      email: cleanText_(row[2]).toLowerCase(),
      active: isTruthySheetValue_(row[3]),
      note: cleanText_(row[4]),
      createdAt: cleanText_(row[5]),
      updatedAt: cleanText_(row[6]),
      updatedBy: cleanText_(row[7])
    };
  }).filter(function(member) {
    return member.id || member.name || member.email;
  });
}

function assertUniqueActiveVvipMembers_(members) {
  var names = {};
  var emails = {};
  (members || []).filter(function(member) { return member.active; }).forEach(function(member) {
    var nameKey = member.name.toLowerCase();
    var emailKey = member.email.toLowerCase();
    if (!member.id || !member.name || !member.email) {
      throw new Error('啟用中的 VVIP 名單資料不完整。');
    }
    if (names[nameKey]) throw new Error('啟用中的 VVIP OB 名稱重複：' + member.name);
    if (emails[emailKey]) throw new Error('啟用中的 VVIP Email 重複：' + member.email);
    names[nameKey] = true;
    emails[emailKey] = true;
  });
}

function getPublicVvipMembers_() {
  var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.VVIP_MEMBERS);
  var members = getVvipMemberRows_(sheet);
  assertUniqueActiveVvipMembers_(members);
  return members.filter(function(member) { return member.active; }).map(function(member) {
    return { id: member.id, name: member.name };
  }).sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });
}

function resolveVvipMember_(memberId, requireActive) {
  var id = cleanText_(memberId);
  if (!id) throw new Error('請選擇 VVIP OB 名稱。');
  var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.VVIP_MEMBERS);
  var matches = getVvipMemberRows_(sheet).filter(function(member) { return member.id === id; });
  if (matches.length !== 1) throw new Error('找不到 VVIP 名單資料。');
  var member = matches[0];
  if (requireActive !== false && !member.active) throw new Error('此 VVIP 名單目前未啟用。');
  normalizeVvipEmail_(member.email);
  if (!member.name) throw new Error('VVIP 名單缺少 OB 名稱。');
  return member;
}

function saveVvipMember_(session, payload) {
  var actor = assertCapabilitySession_(session, 'vvip_admin');
  var input = payload || {};
  var id = cleanText_(input.id) || Utilities.getUuid();
  var name = cleanText_(input.name);
  var email = normalizeVvipEmail_(input.email);
  var active = input.active !== false;
  var note = cleanText_(input.note);
  if (!name) throw new Error('請填寫 VVIP OB 名稱。');

  return withScriptLock_(function() {
    var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.VVIP_MEMBERS);
    var members = getVvipMemberRows_(sheet);
    var existing = members.filter(function(member) { return member.id === id; });
    if (existing.length > 1) throw new Error('VVIP ID 重複，請先整理名單。');
    var now = getTimestamp_();
    var candidate = {
      id: id,
      name: name,
      email: email,
      active: active,
      note: note,
      createdAt: existing.length ? existing[0].createdAt : now,
      updatedAt: now,
      updatedBy: actor
    };
    var nextMembers = members.filter(function(member) { return member.id !== id; }).concat(candidate);
    assertUniqueActiveVvipMembers_(nextMembers);
    var row = [[
      candidate.id, candidate.name, candidate.email, candidate.active ? '是' : '否',
      candidate.note, candidate.createdAt, candidate.updatedAt, candidate.updatedBy
    ]];
    if (existing.length) {
      sheet.getRange(existing[0].rowNumber, 1, 1, SHEET_HEADERS.VVIP_MEMBERS.length).setValues(row);
    } else {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.VVIP_MEMBERS.length).setValues(row);
    }
    return { id: candidate.id, name: candidate.name, active: candidate.active };
  });
}

function setVvipMemberActive_(session, memberId, active) {
  var actor = assertCapabilitySession_(session, 'vvip_admin');
  var id = cleanText_(memberId);
  return withScriptLock_(function() {
    var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.VVIP_MEMBERS);
    var matches = getVvipMemberRows_(sheet).filter(function(member) { return member.id === id; });
    if (matches.length !== 1) throw new Error('找不到 VVIP 名單資料。');
    var member = matches[0];
    var shouldEnable = active === true;
    var nextMembers = getVvipMemberRows_(sheet).map(function(item) {
      if (item.id !== id) return item;
      item.active = shouldEnable;
      return item;
    });
    assertUniqueActiveVvipMembers_(nextMembers);
    sheet.getRange(member.rowNumber, 4, 1, 5).setValues([[
      shouldEnable ? '是' : '否', member.note, member.createdAt, getTimestamp_(), actor
    ]]);
    return { id: id, name: member.name, active: shouldEnable };
  });
}

function getNextMonthKey_(now) {
  var dateText = Utilities.formatDate(now || new Date(), getTimeZone_(), 'yyyy-MM-dd');
  var parts = dateText.split('-').map(Number);
  var year = parts[0];
  var month = parts[1] + 1;
  if (month === 13) {
    year += 1;
    month = 1;
  }
  return year + '-' + ('0' + month).slice(-2);
}

function getVvipMonthFromDate_(value) {
  var date = formatMyDate(value);
  var match = /^(\d{4})\/(\d{2})\//.exec(date);
  return match ? match[1] + '-' + match[2] : '';
}

function getVvipSettings_(sheet) {
  assertHeaders_(sheet, SHEET_HEADERS.VVIP_SETTINGS);
  var settings = {};
  sheet.getDataRange().getValues().slice(1).forEach(function(row) {
    var key = cleanText_(row[0]);
    if (key && settings[key] == null) settings[key] = cleanText_(row[1]);
  });
  return settings;
}

function getVvipActiveMonth_(settings) {
  return getNextMonthKey_();
}

function isVvipSelectionOpen_(settings) {
  return isTruthySheetValue_(settings && settings.isOpen) &&
    cleanText_(settings && settings.activeMonth) === getNextMonthKey_();
}

function getVvipCourseRows_(month, requireCalendarIds) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.COURSE_LIST);
  assertHeaders_(sheet, SHEET_HEADERS.COURSE_LIST);
  var missingIds = [];
  var courses = sheet.getDataRange().getValues().slice(1).map(function(row) {
    var date = formatMyDate(row[0]);
    var item = {
      calendarId: cleanText_(row[4]),
      date: date,
      time: formatMyTime(row[1]),
      courseName: cleanText_(row[2]),
      teacherName: cleanText_(row[3])
    };
    if (getVvipMonthFromDate_(date) === month && !item.calendarId) missingIds.push(item);
    return item;
  }).filter(function(item) {
    return getVvipMonthFromDate_(item.date) === month &&
      item.calendarId && item.date && item.time && item.courseName && item.teacherName;
  });

  if (requireCalendarIds && missingIds.length) {
    throw new Error('下個月 CourseList 有課程缺少 OB Calendar ID，請先重新同步。');
  }
  var unique = {};
  courses.forEach(function(course) {
    if (unique[course.calendarId]) {
      throw new Error('CourseList 有重複的 OB Calendar ID，請先重新同步。');
    }
    unique[course.calendarId] = true;
  });
  return courses.sort(function(a, b) {
    return [a.date, a.time, a.courseName, a.teacherName, a.calendarId].join('|')
      .localeCompare([b.date, b.time, b.courseName, b.teacherName, b.calendarId].join('|'));
  });
}

function getVvipSelectionRows_(sheet, email, month, memberId) {
  assertHeaders_(sheet, SHEET_HEADERS.VVIP_SELECTIONS);
  return sheet.getDataRange().getValues().slice(1).map(function(row, index) {
    return { rowNumber: index + 2, row: row };
  }).filter(function(item) {
    var storedMemberId = cleanText_(item.row[13]);
    var requestedMemberId = cleanText_(memberId);
    var identityMatches = requestedMemberId && storedMemberId
      ? storedMemberId === requestedMemberId
      : cleanText_(item.row[1]) === email;
    return identityMatches && cleanText_(item.row[2]) === month;
  });
}

function isActiveVvipSelectionRow_(row) {
  return [CONFIG.VVIP_PENDING_STATUS, CONFIG.VVIP_CONFIRMED_STATUS].indexOf(cleanText_(row[8])) !== -1;
}

function toVvipSelectionItem_(row) {
  return {
    calendarId: cleanText_(row[3]),
    date: formatMyDate(row[4]),
    time: formatMyTime(row[5]),
    courseName: cleanText_(row[6]),
    teacherName: cleanText_(row[7]),
    status: cleanText_(row[8])
  };
}

function getVvipSelection_(memberId) {
  var member = resolveVvipMember_(memberId, true);
  var email = member.email;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = requireSheet_(ss, SHEETS.VVIP_SETTINGS);
  var settings = getVvipSettings_(settingsSheet);
  if (!isVvipSelectionOpen_(settings)) {
    throw new Error('本期 VVIP 選課尚未開放或已截止。');
  }
  var month = getVvipActiveMonth_(settings);
  var courses = getVvipCourseRows_(month, true);
  if (!courses.length) throw new Error('本期尚無可選課程，請稍後再試。');
  var selectionSheet = requireSheet_(ss, SHEETS.VVIP_SELECTIONS);
  var selections = getVvipSelectionRows_(selectionSheet, email, month, member.id)
    .filter(function(item) { return isActiveVvipSelectionRow_(item.row); })
    .map(function(item) { return toVvipSelectionItem_(item.row); });
  return {
    memberId: member.id,
    memberName: member.name,
    month: month,
    limit: CONFIG.VVIP_MAX_SELECTIONS,
    count: selections.length,
    selections: selections,
    courses: courses
  };
}

function normalizeVvipCalendarIds_(calendarIds) {
  if (!Array.isArray(calendarIds)) throw new Error('VVIP 課程必須是陣列。');
  var unique = {};
  var ids = [];
  calendarIds.forEach(function(value) {
    var id = cleanText_(value);
    if (id && !unique[id]) {
      unique[id] = true;
      ids.push(id);
    }
  });
  if (!ids.length) throw new Error('請至少選擇一堂課。');
  return ids;
}

function submitVvipSelection_(memberId, calendarIds) {
  var member = resolveVvipMember_(memberId, true);
  var email = member.email;
  var requestedIds = normalizeVvipCalendarIds_(calendarIds);
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var settingsSheet = requireSheet_(ss, SHEETS.VVIP_SETTINGS);
    var settings = getVvipSettings_(settingsSheet);
    if (!isVvipSelectionOpen_(settings)) {
      throw new Error('本期 VVIP 選課尚未開放或已截止。');
    }
    var month = getVvipActiveMonth_(settings);
    var courses = getVvipCourseRows_(month, true);
    if (!courses.length) throw new Error('本期尚無可選課程，請稍後再試。');
    var coursesById = {};
    courses.forEach(function(course) { coursesById[course.calendarId] = course; });
    requestedIds.forEach(function(calendarId) {
      if (!coursesById[calendarId]) {
        throw new Error('課程已異動，請重新整理後再送出。');
      }
    });

    var selectionSheet = requireSheet_(ss, SHEETS.VVIP_SELECTIONS);
    var existingRows = getVvipSelectionRows_(selectionSheet, email, month, member.id);
    var activeIds = {};
    existingRows.forEach(function(item) {
      if (isActiveVvipSelectionRow_(item.row)) activeIds[cleanText_(item.row[3])] = true;
    });
    var newIds = requestedIds.filter(function(id) { return !activeIds[id]; });
    var activeCount = Object.keys(activeIds).length;
    if (activeCount + newIds.length > CONFIG.VVIP_MAX_SELECTIONS) {
      throw new Error('每位 VVIP 最多可登記 ' + CONFIG.VVIP_MAX_SELECTIONS + ' 堂，目前已選 ' + activeCount + ' 堂。');
    }
    if (!newIds.length) return buildVvipSelectionResult_(member, month, courses, existingRows);

    var timestamp = getTimestamp_();
    var rowsToAppend = newIds.map(function(calendarId) {
      var course = coursesById[calendarId];
      return [
        timestamp, email, month, course.calendarId, course.date, course.time,
        course.courseName, course.teacherName, CONFIG.VVIP_PENDING_STATUS,
        '', '', '', member.name, member.id, member.name
      ];
    });
    return runStateTransitionUnlocked_([selectionSheet], function(appendAudits) {
      selectionSheet.getRange(
        selectionSheet.getLastRow() + 1,
        1,
        rowsToAppend.length,
        SHEET_HEADERS.VVIP_SELECTIONS.length
      ).setValues(rowsToAppend);
      appendAudits(rowsToAppend.map(function(row) {
        return {
          actor: member.name,
          action: 'VVIP 選課登記',
          targetId: row[3],
          before: '',
          after: CONFIG.VVIP_PENDING_STATUS,
          reason: month
        };
      }));
      return buildVvipSelectionResult_(
        member,
        month,
        courses,
        getVvipSelectionRows_(selectionSheet, email, month, member.id)
      );
    });
  });
}

function buildVvipSelectionResult_(member, month, courses, rows) {
  var selections = (rows || []).filter(function(item) {
    return isActiveVvipSelectionRow_(item.row);
  }).map(function(item) {
    return toVvipSelectionItem_(item.row);
  });
  return {
    memberId: member.id,
    memberName: member.name,
    month: month,
    limit: CONFIG.VVIP_MAX_SELECTIONS,
    count: selections.length,
    selections: selections,
    courses: courses
  };
}

function setVvipSettingRowsUnlocked_(sheet, updates, actor) {
  assertHeaders_(sheet, SHEET_HEADERS.VVIP_SETTINGS);
  var values = sheet.getDataRange().getValues();
  var rowByKey = {};
  values.slice(1).forEach(function(row, index) {
    var key = cleanText_(row[0]);
    if (key && !rowByKey[key]) rowByKey[key] = index + 2;
  });
  var timestamp = getTimestamp_();
  Object.keys(updates).forEach(function(key) {
    var row = [[key, cleanText_(updates[key]), timestamp, actor]];
    if (rowByKey[key]) {
      sheet.getRange(rowByKey[key], 1, 1, SHEET_HEADERS.VVIP_SETTINGS.length).setValues(row);
    } else {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.VVIP_SETTINGS.length).setValues(row);
    }
  });
}

function setVvipSelectionOpen_(session, open) {
  var actor = assertCapabilitySession_(session, 'vvip_admin');
  var shouldOpen = open === true;
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var settingsSheet = requireSheet_(ss, SHEETS.VVIP_SETTINGS);
    var settings = getVvipSettings_(settingsSheet);
    var month = getNextMonthKey_();
    if (shouldOpen) {
      if (!getPublicVvipMembers_().length) throw new Error('尚無啟用中的 VVIP 名單，無法開放。');
      var courses = getVvipCourseRows_(month, true);
      if (!courses.length) throw new Error('下個月尚無可選課程，無法開放 VVIP 選課。');
    }
    var before = isVvipSelectionOpen_(settings) ? '開放中' : '已關閉';
    var updates = { activeMonth: month, isOpen: shouldOpen ? '是' : '否' };
    updates[shouldOpen ? 'openedAt' : 'closedAt'] = getTimestamp_();
    return runStateTransitionUnlocked_([settingsSheet], function(appendAudits) {
      setVvipSettingRowsUnlocked_(settingsSheet, updates, actor);
      appendAudits([{
        actor: actor,
        action: shouldOpen ? '開放 VVIP 選課' : '關閉 VVIP 選課',
        targetId: month,
        before: before,
        after: shouldOpen ? '開放中' : '已關閉',
        reason: ''
      }]);
      return { month: month, isOpen: shouldOpen };
    });
  });
}

function getVvipAdminDashboard_(session, emailQuery) {
  assertCapabilitySession_(session, 'vvip_admin');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = requireSheet_(ss, SHEETS.VVIP_SETTINGS);
  var selectionSheet = requireSheet_(ss, SHEETS.VVIP_SELECTIONS);
  var settings = getVvipSettings_(settingsSheet);
  var month = getVvipActiveMonth_(settings);
  var email = cleanText_(emailQuery) ? normalizeVvipEmail_(emailQuery) : '';
  var rows = selectionSheet.getDataRange().getValues().slice(1).map(function(row, index) {
    return { rowNumber: index + 2, row: row };
  }).filter(function(item) {
    return cleanText_(item.row[2]) === month && (!email || cleanText_(item.row[1]) === email);
  });
  var activeRows = rows.filter(function(item) { return isActiveVvipSelectionRow_(item.row); });
  var emails = {};
  activeRows.forEach(function(item) { emails[cleanText_(item.row[1])] = true; });
  var members = activeRows.map(function(item) {
    var output = toVvipSelectionItem_(item.row);
    output.email = cleanText_(item.row[1]);
    output.registeredAt = cleanText_(item.row[0]);
    return output;
  }).sort(function(a, b) {
    return [a.email, a.date, a.time, a.calendarId].join('|')
      .localeCompare([b.email, b.date, b.time, b.calendarId].join('|'));
  });
  var grouped = {};
  members.forEach(function(item) {
    if (!grouped[item.calendarId]) {
      grouped[item.calendarId] = {
        calendarId: item.calendarId,
        date: item.date,
        time: item.time,
        courseName: item.courseName,
        teacherName: item.teacherName,
        emails: []
      };
    }
    grouped[item.calendarId].emails.push(item.email);
  });
  return {
    month: month,
    isOpen: isVvipSelectionOpen_(settings),
    whitelist: getVvipMemberRows_(requireSheet_(ss, SHEETS.VVIP_MEMBERS)).map(function(member) {
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        active: member.active,
        note: member.note,
        updatedAt: member.updatedAt,
        updatedBy: member.updatedBy
      };
    }),
    metrics: { members: Object.keys(emails).length, activeSelections: activeRows.length },
    members: members,
    courseView: Object.keys(grouped).map(function(id) { return grouped[id]; }).sort(function(a, b) {
      return [a.date, a.time, a.calendarId].join('|').localeCompare([b.date, b.time, b.calendarId].join('|'));
    })
  };
}

function confirmVvipEmail_(session, emailValue) {
  var actor = assertCapabilitySession_(session, 'vvip_admin');
  var email = normalizeVvipEmail_(emailValue);
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var settings = getVvipSettings_(requireSheet_(ss, SHEETS.VVIP_SETTINGS));
    var month = getVvipActiveMonth_(settings);
    var sheet = requireSheet_(ss, SHEETS.VVIP_SELECTIONS);
    var rows = getVvipSelectionRows_(sheet, email, month).filter(function(item) {
      return cleanText_(item.row[8]) === CONFIG.VVIP_PENDING_STATUS;
    });
    if (!rows.length) throw new Error('找不到待確認的 VVIP 選課紀錄。');
    var now = getTimestamp_();
    return runStateTransitionUnlocked_([sheet], function(appendAudits) {
      rows.forEach(function(item) {
        sheet.getRange(item.rowNumber, 9, 1, 5).setValues([[
          CONFIG.VVIP_CONFIRMED_STATUS, now, '', '', actor
        ]]);
      });
      appendAudits(rows.map(function(item) {
        return {
          actor: actor,
          action: 'VVIP 確認 Email',
          targetId: cleanText_(item.row[3]),
          before: CONFIG.VVIP_PENDING_STATUS,
          after: CONFIG.VVIP_CONFIRMED_STATUS,
          reason: email
        };
      }));
      return { email: email, confirmed: rows.length };
    });
  });
}

function cancelVvipSelection_(session, emailValue, calendarIdValue, reasonValue) {
  var actor = assertCapabilitySession_(session, 'vvip_admin');
  var email = normalizeVvipEmail_(emailValue);
  var calendarId = cleanText_(calendarIdValue);
  var reason = cleanText_(reasonValue);
  if (!calendarId) throw new Error('請選擇要取消的課程。');
  if (!reason) throw new Error('請填寫取消原因。');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var settings = getVvipSettings_(requireSheet_(ss, SHEETS.VVIP_SETTINGS));
    var month = getVvipActiveMonth_(settings);
    var sheet = requireSheet_(ss, SHEETS.VVIP_SELECTIONS);
    var matches = getVvipSelectionRows_(sheet, email, month).filter(function(item) {
      return cleanText_(item.row[3]) === calendarId && isActiveVvipSelectionRow_(item.row);
    });
    if (matches.length !== 1) throw new Error('找不到可取消的 VVIP 選課紀錄。');
    var item = matches[0];
    var before = cleanText_(item.row[8]);
    var now = getTimestamp_();
    return runStateTransitionUnlocked_([sheet], function(appendAudits) {
      sheet.getRange(item.rowNumber, 9, 1, 5).setValues([[
        CONFIG.VVIP_CANCELLED_STATUS,
        cleanText_(item.row[9]), now, reason, actor
      ]]);
      appendAudits([{
        actor: actor,
        action: 'VVIP 取消選課',
        targetId: calendarId,
        before: before,
        after: CONFIG.VVIP_CANCELLED_STATUS,
        reason: email + '：' + reason
      }]);
      return { email: email, calendarId: calendarId, cancelled: 1 };
    });
  });
}

function csvSafeCell_(value) {
  var raw = value == null ? '' : String(value);
  var text = cleanText_(raw);
  return /^[=+\-@\t\r]/.test(raw) || /^[=+\-@]/.test(text) ? "'" + text : text;
}

function csvEscape_(value) {
  return '"' + csvSafeCell_(value).replace(/"/g, '""') + '"';
}

function exportVvipSelectionsCsv_(session) {
  var dashboard = getVvipAdminDashboard_(session);
  var header = ['Email', '月份', '日期', '時間', '課程', '老師', 'OB Calendar ID', '狀態'];
  var lines = [header.map(csvEscape_).join(',')];
  dashboard.members.forEach(function(item) {
    lines.push([
      item.email, dashboard.month, item.date, item.time, item.courseName,
      item.teacherName, item.calendarId, item.status
    ].map(csvEscape_).join(','));
  });
  return { filename: 'vvip-' + dashboard.month + '.csv', csv: lines.join('\r\n') };
}

function calculateBonusRate_(subtotalValue) {
  var subtotal = Number(subtotalValue);
  if (!isFinite(subtotal) || subtotal < 0) throw new Error('鐘點費小計格式錯誤。');
  if (subtotal >= 30000) return 0.05;
  if (subtotal >= 20000) return 0.04;
  if (subtotal >= 15000) return 0.03;
  return 0;
}

function normalizePayrollRule_(rule) {
  var source = rule || {};
  var keyword = cleanText_(source.courseKeyword == null ? source['課程關鍵字 (可留空)'] : source.courseKeyword);
  if (['(留空)', '（留空）'].indexOf(keyword) !== -1) keyword = '';
  return {
    teacherName: cleanText_(source.teacherName == null ? source['老師姓名'] : source.teacherName),
    courseKeyword: keyword,
    billingType: cleanText_(source.billingType == null ? source['計費類型'] : source.billingType),
    threshold: Number(source.threshold == null ? source['人數門檻'] : source.threshold) || 0,
    amount: Number(source.amount == null ? source['金額'] : source.amount)
  };
}

function normalizePayrollInstructors_(course) {
  var seen = {};
  var instructors = Array.isArray(course && course.instructors) ? course.instructors : [];
  return instructors.map(function(instructor) {
    return cleanText_(typeof instructor === 'string' ? instructor : instructor && instructor.name);
  }).filter(function(name) {
    if (!name || seen[name]) return false;
    seen[name] = true;
    return true;
  });
}

function calculatePayrollLinesForCourse_(course, ruleValues) {
  var item = course || {};
  var courseName = cleanText_(item.courseName);
  var calendarId = cleanText_(item.calendarId);
  var instructors = normalizePayrollInstructors_(item);
  if (!calendarId || !courseName) throw new Error('薪資課程缺少 Calendar ID 或課程名稱。');
  if (!instructors.length) throw new Error('薪資課程缺少指導者。');

  if (courseName.indexOf('場地租借') !== -1) {
    return instructors.map(function(teacherName) {
      return { teacherName: teacherName, amount: 0, ruleType: '場地租借', ruleDetail: '場地租借不計鐘點費' };
    });
  }

  var hasCourseIncome = item.courseIncome !== null && item.courseIncome !== undefined && item.courseIncome !== '';
  var courseIncome = Number(item.courseIncome);
  if (courseName.indexOf('特別課') !== -1) {
    if (!hasCourseIncome || !isFinite(courseIncome) || courseIncome < 0) {
      throw new Error('特別課缺少有效課程收入。');
    }
    if (instructors.length === 1) {
      return [{
        teacherName: instructors[0],
        amount: Math.round(courseIncome * 0.6),
        ruleType: '特別課60%',
        ruleDetail: '課程收入 ' + courseIncome + ' × 60%'
      }];
    }
    var sherryName = 'Sherry❤雪莉';
    var partners = instructors.filter(function(name) { return name !== sherryName; });
    if (instructors.indexOf(sherryName) !== -1 && partners.length === 1 && instructors.length === 2) {
      var partnerAmount = Math.round(courseIncome * 0.4);
      return [
        {
          teacherName: sherryName,
          amount: Math.round(courseIncome - partnerAmount),
          ruleType: '雪莉合作60%',
          ruleDetail: '課程收入 ' + courseIncome + '－合作老師 ' + partnerAmount
        },
        {
          teacherName: partners[0],
          amount: partnerAmount,
          ruleType: '合作老師40%',
          ruleDetail: '課程收入 ' + courseIncome + ' × 40%'
        }
      ];
    }
    throw new Error('特別課指導者組合無法自動分配薪資。');
  }

  if (instructors.length !== 1) throw new Error('一般課有多位指導者，無法自動計薪。');
  var teacherName = instructors[0];
  var hasAttendance = item.attendanceCount !== null && item.attendanceCount !== undefined && item.attendanceCount !== '';
  var attendance = Number(item.attendanceCount);
  if (!hasAttendance || !isFinite(attendance) || attendance < 0 || Math.floor(attendance) !== attendance) {
    throw new Error('課程缺少有效出席人數。');
  }
  var rules = (ruleValues || []).map(normalizePayrollRule_).filter(function(rule) {
    return rule.teacherName && rule.billingType && isFinite(rule.amount);
  });
  var teacherRules = rules.filter(function(rule) {
    return rule.teacherName === teacherName && rule.billingType === '標準時薪' &&
      (!rule.courseKeyword || courseName.indexOf(rule.courseKeyword) !== -1);
  }).sort(function(a, b) { return b.courseKeyword.length - a.courseKeyword.length; });
  if (teacherRules.length) {
    return [{
      teacherName: teacherName,
      amount: Math.round(teacherRules[0].amount),
      ruleType: '老師專屬薪項',
      ruleDetail: teacherRules[0].courseKeyword || '老師固定時薪'
    }];
  }
  var tierRules = rules.filter(function(rule) {
    return rule.teacherName === '預設值' && rule.billingType === '人數階梯' && rule.threshold === attendance;
  });
  if (tierRules.length !== 1) throw new Error('找不到出席 ' + attendance + ' 人的人數階梯薪項。');
  return [{
    teacherName: teacherName,
    amount: Math.round(tierRules[0].amount),
    ruleType: '人數階梯',
    ruleDetail: attendance + ' 人'
  }];
}

function calculatePayrollSummary_(teacherNameValue, lines, ruleValues) {
  var teacherName = cleanText_(teacherNameValue);
  if (!teacherName) throw new Error('薪資結算缺少老師姓名。');
  var subtotal = (lines || []).filter(function(line) {
    return cleanText_(line.teacherName) === teacherName;
  }).reduce(function(total, line) {
    var amount = Number(line.amount);
    if (!isFinite(amount)) throw new Error('薪資明細金額格式錯誤。');
    return total + amount;
  }, 0);
  subtotal = Math.round(subtotal);
  var fixedAdjustment = (ruleValues || []).map(normalizePayrollRule_).filter(function(rule) {
    return rule.teacherName === teacherName &&
      ['固定加給', '固定扣項', '固定月薪'].indexOf(rule.billingType) !== -1;
  }).reduce(function(total, rule) {
    return total + (rule.billingType === '固定扣項' ? -Math.abs(rule.amount) : rule.amount);
  }, 0);
  fixedAdjustment = Math.round(fixedAdjustment);
  var bonusRate = calculateBonusRate_(subtotal);
  var bonusAmount = Math.round(subtotal * bonusRate);
  return {
    teacherName: teacherName,
    subtotal: subtotal,
    bonusRate: bonusRate,
    bonusAmount: bonusAmount,
    fixedAdjustment: fixedAdjustment,
    totalSalary: subtotal + bonusAmount + fixedAdjustment
  };
}

function getPayrollMonthRange_(monthValue) {
  var month = cleanText_(monthValue);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('薪資月份格式應為 YYYY-MM。');
  var parts = month.split('-').map(Number);
  var lastDay = new Date(parts[0], parts[1], 0, 12, 0, 0).getDate();
  return {
    month: month,
    dateFrom: month + '-01',
    dateTo: month + '-' + ('0' + lastDay).slice(-2)
  };
}

function getPayrollInstructorName_(instructor) {
  var person = instructor || {};
  return cleanText_(
    typeof person === 'string' ? person :
      (person.name || [person.firstName, person.lastName].filter(Boolean).join(' '))
  );
}

function normalizePayrollCalendarItem_(item) {
  if (!item || item.cancelled === true) return null;
  var classInfo = item['class'] || item.course || {};
  var classTime = item.classTime || item.startAt || item.startTime || '';
  var parsedTime = new Date(classTime);
  var courseName = cleanText_(classInfo.nameZhHant || classInfo.nameEn || classInfo.name || '');
  var seen = {};
  var instructors = (Array.isArray(item.instructors) ? item.instructors : [item.instructor]).filter(Boolean)
    .map(function(person) {
      var name = getPayrollInstructorName_(person);
      return {
        id: cleanText_(person && (person.id || person.instructorId)),
        name: name,
        isSubstitute: !!(person && person.isSubstitute === true)
      };
    }).filter(function(person) {
      if (!person.name || seen[person.name]) return false;
      seen[person.name] = true;
      return true;
    });
  if (!cleanText_(item.id) || !courseName || !classTime || isNaN(parsedTime.getTime()) || !instructors.length) {
    return null;
  }
  var attended = item.customersAttended;
  if (attended == null) attended = item.customersAttending;
  var timezone = getTimeZone_();
  return {
    calendarId: cleanText_(item.id),
    date: Utilities.formatDate(parsedTime, timezone, 'yyyy/MM/dd'),
    time: Utilities.formatDate(parsedTime, timezone, 'HH:mm'),
    courseName: courseName,
    instructors: instructors,
    attendanceCount: attended == null || attended === '' ? null : Number(attended),
    capacity: item.size == null || item.size === '' ? null : Number(item.size),
    courseIncome: item.courseIncome == null || item.courseIncome === '' ? null : Number(item.courseIncome),
    profit: item.profit == null || item.profit === '' ? null : Number(item.profit),
    room: cleanText_((item.classRoom || {}).nameZhHant || (item.classRoom || {}).nameEn || item.room),
    location: cleanText_((item.location || {}).nameZhHant || (item.location || {}).nameEn || item.locationName)
  };
}

function buildPayrollDraft_(monthValue, courses, ruleValues) {
  var month = getPayrollMonthRange_(monthValue).month;
  var lines = [];
  var errors = [];
  var warnings = [];
  (courses || []).forEach(function(course, index) {
    var item = course || {};
    try {
      if (!item.calendarId || !item.courseName || !item.date || !item.time) {
        throw new Error('課程基本資料不完整。');
      }
      if (cleanText_(item.date).substring(0, 7).replace('/', '-') !== month) return;
      var calculated = calculatePayrollLinesForCourse_(item, ruleValues);
      var courseProfit = Number(item.profit);
      if (!isFinite(courseProfit)) {
        courseProfit = 0;
        warnings.push({ calendarId: item.calendarId, message: '尚未提供盈利，老師薪資仍可計算。' });
      }
      var courseSalary = calculated.reduce(function(total, line) { return total + Number(line.amount); }, 0);
      var allocatedProfit = 0;
      calculated.forEach(function(line, lineIndex) {
        var profitShare = lineIndex === calculated.length - 1
          ? Math.round(courseProfit - allocatedProfit)
          : Math.round(courseProfit * (courseSalary ? Number(line.amount) / courseSalary : 1 / calculated.length));
        allocatedProfit += profitShare;
        lines.push({
          month: month,
          lineId: cleanText_(item.calendarId) + ':' + cleanText_(line.teacherName),
          calendarId: cleanText_(item.calendarId),
          teacherName: cleanText_(line.teacherName),
          date: cleanText_(item.date),
          time: cleanText_(item.time),
          courseName: cleanText_(item.courseName),
          billingType: cleanText_(line.ruleType),
          attendanceCount: Number(item.attendanceCount),
          courseIncome: isFinite(Number(item.courseIncome)) ? Number(item.courseIncome) : '',
          ruleDetail: cleanText_(line.ruleDetail),
          amount: Number(line.amount),
          manualAdjustment: 0,
          adjustmentReason: '',
          profit: profitShare
        });
      });
    } catch (error) {
      errors.push({
        index: index + 1,
        calendarId: cleanText_(item.calendarId),
        courseName: cleanText_(item.courseName),
        message: error && error.message ? error.message : String(error)
      });
    }
  });
  var teachers = {};
  lines.forEach(function(line) { teachers[line.teacherName] = true; });
  (ruleValues || []).map(normalizePayrollRule_).forEach(function(rule) {
    if (rule.teacherName && rule.teacherName !== '預設值') teachers[rule.teacherName] = true;
  });
  var summaries = Object.keys(teachers).sort().map(function(teacherName) {
    var summary = calculatePayrollSummary_(teacherName, lines, ruleValues);
    summary.profit = lines.filter(function(line) { return line.teacherName === teacherName; })
      .reduce(function(total, line) { return total + Number(line.profit || 0); }, 0);
    return summary;
  });
  return { month: month, lines: lines, summaries: summaries, errors: errors, warnings: warnings };
}

function parsePayrollAttendance_(value) {
  if (typeof value === 'number') return value;
  var match = cleanText_(value).match(/^(\d+)\s*\//);
  return match ? Number(match[1]) : null;
}

function getPayrollRulesUnlocked_(spreadsheet) {
  var sheet = requireSheet_(spreadsheet, SHEETS.PAYROLL_RULES);
  assertHeaders_(sheet, SHEET_HEADERS.PAYROLL_RULES);
  return sheet.getDataRange().getValues().slice(1).map(function(row) {
    return {
      teacherName: row[0], courseKeyword: row[1], billingType: row[2], threshold: row[3], amount: row[4]
    };
  }).filter(function(rule) { return cleanText_(rule.teacherName) && cleanText_(rule.billingType); });
}

function getPayrollSourceMapUnlocked_(spreadsheet, month) {
  var sheet = requireSheet_(spreadsheet, SHEETS.PAYROLL_SOURCE);
  assertHeaders_(sheet, SHEET_HEADERS.PAYROLL_SOURCE);
  var byId = {};
  var byDetails = {};
  sheet.getDataRange().getValues().slice(1).forEach(function(row) {
    if (cleanText_(row[0]) !== month) return;
    var dateTime = row[2] instanceof Date ? row[2] : new Date(row[2]);
    var date = isNaN(dateTime.getTime()) ? formatMyDate(row[2]) : formatMyDate(dateTime);
    var time = isNaN(dateTime.getTime()) ? formatMyTime(row[2]) : formatMyTime(dateTime);
    var source = {
      calendarId: cleanText_(row[1]),
      date: date,
      time: time,
      courseName: cleanText_(row[3]),
      instructor: cleanText_(row[4]),
      attendanceCount: parsePayrollAttendance_(row[5]),
      courseIncome: row[7] === '' || row[7] == null ? null : Number(row[7]),
      profit: row[8] === '' || row[8] == null ? null : Number(row[8]),
      room: cleanText_(row[9]),
      location: cleanText_(row[10])
    };
    if (source.calendarId) byId[source.calendarId] = source;
    if (source.date && source.time && source.courseName) {
      byDetails[[source.date, source.time, normalizeCourseName_(source.courseName)].join('|')] = source;
    }
  });
  return { byId: byId, byDetails: byDetails };
}

function mergePayrollSource_(course, sourceMap) {
  var item = course;
  var source = sourceMap.byId[item.calendarId] || sourceMap.byDetails[
    [item.date, item.time, normalizeCourseName_(item.courseName)].join('|')
  ];
  if (!source) return item;
  if (source.attendanceCount !== null) item.attendanceCount = source.attendanceCount;
  if (source.courseIncome !== null && isFinite(source.courseIncome)) item.courseIncome = source.courseIncome;
  if (source.profit !== null && isFinite(source.profit)) item.profit = source.profit;
  if (source.room) item.room = source.room;
  if (source.location) item.location = source.location;
  return item;
}

function syncPayrollMonth_(session, monthValue) {
  assertCapabilitySession_(session, 'payroll_admin');
  var range = getPayrollMonthRange_(monthValue);
  var token = PropertiesService.getScriptProperties().getProperty(CONFIG.API_TOKEN_PROPERTY);
  if (!cleanText_(token)) throw new Error('請先在指令碼屬性設定 OMCEAN_API_TOKEN。');
  var rawItems = fetchCalendarPages_(token, range.dateFrom, range.dateTo);
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensurePayrollStructureUnlocked_(ss);
    var sourceMap = getPayrollSourceMapUnlocked_(ss, range.month);
    var normalized = [];
    var seen = {};
    rawItems.forEach(function(rawItem, index) {
      var item = normalizePayrollCalendarItem_(rawItem);
      if (!item) throw new Error('OB 第 ' + (index + 1) + ' 筆薪資課程資料不完整，已停止同步。');
      if (seen[item.calendarId]) return;
      seen[item.calendarId] = true;
      normalized.push(mergePayrollSource_(item, sourceMap));
    });
    if (!normalized.length) throw new Error('該月份沒有取得有效課程，未寫入薪資草稿。');
    var rules = getPayrollRulesUnlocked_(ss);
    if (!rules.length) throw new Error('「薪項設定」尚未填入任何計費規則。');
    var draft = buildPayrollDraft_(range.month, normalized, rules);
    var version = Utilities.getUuid();
    var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    writePayrollDraftUnlocked_(ss, version, now, normalized, draft);
    appendAuditEventsUnlocked_(requireSheet_(ss, SHEETS.AUDIT), [{
      actor: session.teacherName,
      action: '薪資同步',
      targetId: range.month,
      before: '',
      after: draft.errors.length ? '草稿有 ' + draft.errors.length + ' 筆錯誤' : '草稿完成',
      reason: '版本 ' + version
    }]);
    return {
      month: range.month,
      version: version,
      courseCount: normalized.length,
      lineCount: draft.lines.length,
      summaryCount: draft.summaries.length,
      errors: draft.errors,
      warnings: draft.warnings,
      publishable: draft.errors.length === 0
    };
  });
}

function writePayrollDraftUnlocked_(spreadsheet, version, now, courses, draft) {
  var snapshotSheet = requireSheet_(spreadsheet, SHEETS.PAYROLL_SNAPSHOT);
  var lineSheet = requireSheet_(spreadsheet, SHEETS.PAYROLL_LINES);
  var summarySheet = requireSheet_(spreadsheet, SHEETS.PAYROLL_SUMMARIES);
  assertHeaders_(snapshotSheet, SHEET_HEADERS.PAYROLL_SNAPSHOT);
  assertHeaders_(lineSheet, SHEET_HEADERS.PAYROLL_LINES);
  assertHeaders_(summarySheet, SHEET_HEADERS.PAYROLL_SUMMARIES);
  var errorById = {};
  draft.errors.forEach(function(error) { errorById[error.calendarId] = error.message; });
  var snapshotRows = courses.map(function(item) {
    return [
      version, draft.month, item.calendarId, item.date, item.time, item.courseName,
      JSON.stringify(item.instructors), item.attendanceCount == null ? '' : item.attendanceCount,
      item.capacity == null ? '' : item.capacity,
      item.courseIncome == null ? '' : item.courseIncome,
      item.profit == null ? '' : item.profit, item.room, item.location, now,
      errorById[item.calendarId] ? '錯誤：' + errorById[item.calendarId] : '完成'
    ];
  });
  if (snapshotRows.length) snapshotSheet.getRange(snapshotSheet.getLastRow() + 1, 1, snapshotRows.length, SHEET_HEADERS.PAYROLL_SNAPSHOT.length).setValues(snapshotRows);
  if (draft.errors.length) return;
  var lineRows = draft.lines.map(function(line) {
    return [
      draft.month, line.lineId, version, line.calendarId, line.teacherName, line.date, line.time,
      line.courseName, line.billingType, line.attendanceCount, line.courseIncome, line.billingType,
      line.ruleDetail, line.amount, line.manualAdjustment, line.adjustmentReason,
      CONFIG.PAYROLL_DRAFT_STATUS, now
    ];
  });
  if (lineRows.length) lineSheet.getRange(lineSheet.getLastRow() + 1, 1, lineRows.length, SHEET_HEADERS.PAYROLL_LINES.length).setValues(lineRows);
  var summaryRows = draft.summaries.map(function(summary) {
    return [
      draft.month, summary.teacherName, summary.subtotal, summary.bonusRate, summary.bonusAmount,
      summary.fixedAdjustment, summary.totalSalary, summary.profit, version,
      CONFIG.PAYROLL_DRAFT_STATUS, '', now, 0, '', '', ''
    ];
  });
  if (summaryRows.length) summarySheet.getRange(summarySheet.getLastRow() + 1, 1, summaryRows.length, SHEET_HEADERS.PAYROLL_SUMMARIES.length).setValues(summaryRows);
}

function publishPayroll_(session, monthValue, versionValue) {
  var actor = assertCapabilitySession_(session, 'payroll_admin');
  var month = getPayrollMonthRange_(monthValue).month;
  var version = cleanText_(versionValue);
  if (!version) throw new Error('缺少薪資草稿版本。');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var summarySheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
    var lineSheet = requireSheet_(ss, SHEETS.PAYROLL_LINES);
    assertHeaders_(summarySheet, SHEET_HEADERS.PAYROLL_SUMMARIES);
    assertHeaders_(lineSheet, SHEET_HEADERS.PAYROLL_LINES);
    var summaryValues = summarySheet.getDataRange().getValues();
    var lineValues = lineSheet.getDataRange().getValues();
    var summaryRows = [];
    var lineRows = [];
    summaryValues.slice(1).forEach(function(row, index) {
      if (cleanText_(row[0]) === month && cleanText_(row[8]) === version && cleanText_(row[9]) === CONFIG.PAYROLL_DRAFT_STATUS) {
        summaryRows.push(index + 2);
      }
    });
    lineValues.slice(1).forEach(function(row, index) {
      if (cleanText_(row[0]) === month && cleanText_(row[2]) === version && cleanText_(row[16]) === CONFIG.PAYROLL_DRAFT_STATUS) {
        lineRows.push(index + 2);
      }
    });
    if (!summaryRows.length || !lineRows.length) throw new Error('找不到可發布的薪資草稿，或此版本已發布。');
    var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    summaryRows.forEach(function(rowNumber) {
      summarySheet.getRange(rowNumber, 10).setValue(CONFIG.PAYROLL_PUBLISHED_STATUS);
      summarySheet.getRange(rowNumber, 11).setValue('');
      summarySheet.getRange(rowNumber, 12).setValue(now);
    });
    lineRows.forEach(function(rowNumber) {
      lineSheet.getRange(rowNumber, 17).setValue(CONFIG.PAYROLL_PUBLISHED_STATUS);
    });
    appendAuditEventsUnlocked_(requireSheet_(ss, SHEETS.AUDIT), [{
      actor: actor, action: '薪資發布', targetId: month, before: CONFIG.PAYROLL_DRAFT_STATUS,
      after: CONFIG.PAYROLL_PUBLISHED_STATUS, reason: '版本 ' + version
    }]);
    return { month: month, version: version, teachers: summaryRows.length, lines: lineRows.length };
  });
}

function getPayrollLineObject_(row) {
  return {
    month: cleanText_(row[0]), lineId: cleanText_(row[1]), version: cleanText_(row[2]),
    calendarId: cleanText_(row[3]), teacherName: cleanText_(row[4]), date: formatMyDate(row[5]),
    time: formatMyTime(row[6]), courseName: cleanText_(row[7]), billingType: cleanText_(row[8]),
    attendanceCount: row[9], courseIncome: row[10], ruleDetail: cleanText_(row[12]),
    amount: Number(row[13]) || 0, manualAdjustment: Number(row[14]) || 0,
    adjustmentReason: cleanText_(row[15]), status: cleanText_(row[16])
  };
}

function getPayrollSummaryObject_(row) {
  return {
    month: cleanText_(row[0]), teacherName: cleanText_(row[1]), subtotal: Number(row[2]) || 0,
    bonusRate: Number(row[3]) || 0, bonusAmount: Number(row[4]) || 0,
    fixedAdjustment: Number(row[5]) || 0, totalSalary: Number(row[6]) || 0,
    profit: Number(row[7]) || 0, version: cleanText_(row[8]), status: cleanText_(row[9]),
    confirmedAt: cleanText_(row[10]), updatedAt: cleanText_(row[11]),
    adminAdjustment: Number(row[12]) || 0, adjustmentReason: cleanText_(row[13]),
    adminConfirmedAt: cleanText_(row[14]), adminConfirmedBy: cleanText_(row[15])
  };
}

function getMyPayroll_(session, monthValue) {
  var teacher = getSessionTeacherName_(session);
  var month = monthValue ? getPayrollMonthRange_(monthValue).month : '';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var summarySheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
  var lineSheet = requireSheet_(ss, SHEETS.PAYROLL_LINES);
  var disputeSheet = requireSheet_(ss, SHEETS.PAYROLL_DISPUTES);
  assertHeaders_(summarySheet, SHEET_HEADERS.PAYROLL_SUMMARIES);
  assertHeaders_(lineSheet, SHEET_HEADERS.PAYROLL_LINES);
  assertHeaders_(disputeSheet, SHEET_HEADERS.PAYROLL_DISPUTES);
  var summaries = summarySheet.getDataRange().getValues().slice(1).filter(function(row) {
    return cleanText_(row[1]) === teacher && cleanText_(row[9]) !== CONFIG.PAYROLL_DRAFT_STATUS &&
      (!month || cleanText_(row[0]) === month);
  });
  if (!summaries.length) return { month: month, summary: null, lines: [], disputes: [] };
  var summaryRow = summaries[summaries.length - 1];
  var summary = getPayrollSummaryObject_(summaryRow);
  var lines = lineSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return cleanText_(row[0]) === summary.month && cleanText_(row[2]) === summary.version &&
      cleanText_(row[4]) === teacher && cleanText_(row[16]) !== CONFIG.PAYROLL_DRAFT_STATUS;
  }).map(getPayrollLineObject_);
  var disputes = disputeSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return cleanText_(row[1]) === summary.month && cleanText_(row[2]) === teacher;
  }).map(function(row) {
    return {
      id: cleanText_(row[0]), month: cleanText_(row[1]), lineId: cleanText_(row[3]),
      message: cleanText_(row[4]), status: cleanText_(row[5]), reply: cleanText_(row[6]),
      createdAt: cleanText_(row[7]), resolvedAt: cleanText_(row[9])
    };
  });
  return { month: summary.month, summary: summary, lines: lines, disputes: disputes };
}

function confirmPayroll_(session, monthValue, versionValue) {
  var teacher = getSessionTeacherName_(session);
  var month = getPayrollMonthRange_(monthValue).month;
  var version = cleanText_(versionValue);
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
    assertHeaders_(sheet, SHEET_HEADERS.PAYROLL_SUMMARIES);
    var values = sheet.getDataRange().getValues();
    for (var index = values.length - 1; index > 0; index--) {
      var row = values[index];
      if (cleanText_(row[0]) === month && cleanText_(row[1]) === teacher && cleanText_(row[8]) === version) {
        var status = cleanText_(row[9]);
        if (status === CONFIG.PAYROLL_REVIEW_STATUS) throw new Error('薪資異議尚未處理，暫時不能確認。');
        if (status === CONFIG.PAYROLL_DRAFT_STATUS) throw new Error('薪資尚未發布。');
        if (status === CONFIG.PAYROLL_FINALIZED_STATUS) throw new Error('薪資已完成管理員確認。');
        var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
        sheet.getRange(index + 1, 10).setValue(CONFIG.PAYROLL_CONFIRMED_STATUS);
        sheet.getRange(index + 1, 11).setValue(now);
        appendAuditEventsUnlocked_(requireSheet_(ss, SHEETS.AUDIT), [{
          actor: teacher, action: '薪資確認', targetId: month, before: status,
          after: CONFIG.PAYROLL_CONFIRMED_STATUS, reason: '版本 ' + version
        }]);
        return { month: month, version: version, confirmedAt: now };
      }
    }
    throw new Error('找不到可確認的薪資版本。');
  });
}

function submitPayrollDispute_(session, payload) {
  var teacher = getSessionTeacherName_(session);
  var item = payload || {};
  var month = getPayrollMonthRange_(item.month).month;
  var version = cleanText_(item.version);
  var lineId = cleanText_(item.lineId);
  var message = cleanText_(item.message);
  if (!lineId || !message) throw new Error('請選擇薪資明細並填寫問題說明。');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var lineSheet = requireSheet_(ss, SHEETS.PAYROLL_LINES);
    var summarySheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
    var disputeSheet = requireSheet_(ss, SHEETS.PAYROLL_DISPUTES);
    var summaryValues = summarySheet.getDataRange().getValues();
    var summaryRow = null;
    for (var summaryIndex = summaryValues.length - 1; summaryIndex > 0; summaryIndex--) {
      if (cleanText_(summaryValues[summaryIndex][0]) === month &&
          cleanText_(summaryValues[summaryIndex][1]) === teacher &&
          cleanText_(summaryValues[summaryIndex][8]) === version) {
        summaryRow = summaryValues[summaryIndex];
        break;
      }
    }
    if (!summaryRow) throw new Error('找不到您的薪資結算資料。');
    if (cleanText_(summaryRow[9]) === CONFIG.PAYROLL_FINALIZED_STATUS) {
      throw new Error('薪資已完成管理員確認，請直接聯絡管理員。');
    }
    var lineExists = lineSheet.getDataRange().getValues().slice(1).some(function(row) {
      return cleanText_(row[0]) === month && cleanText_(row[1]) === lineId &&
        cleanText_(row[2]) === version && cleanText_(row[4]) === teacher &&
        cleanText_(row[16]) !== CONFIG.PAYROLL_DRAFT_STATUS;
    });
    if (!lineExists) throw new Error('找不到您的這筆薪資明細。');
    var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    var disputeId = Utilities.getUuid();
    disputeSheet.getRange(disputeSheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.PAYROLL_DISPUTES.length).setValues([[
      disputeId, month, teacher, lineId, message, '待處理', '', now, '', ''
    ]]);
    var summaries = summarySheet.getDataRange().getValues();
    for (var index = summaries.length - 1; index > 0; index--) {
      if (cleanText_(summaries[index][0]) === month && cleanText_(summaries[index][1]) === teacher && cleanText_(summaries[index][8]) === version) {
        summarySheet.getRange(index + 1, 10).setValue(CONFIG.PAYROLL_REVIEW_STATUS);
        summarySheet.getRange(index + 1, 11).setValue('');
        break;
      }
    }
    appendAuditEventsUnlocked_(requireSheet_(ss, SHEETS.AUDIT), [{
      actor: teacher, action: '提出薪資異議', targetId: disputeId, before: '', after: '待處理', reason: message
    }]);
    return { id: disputeId, status: '待處理' };
  });
}

function resolvePayrollDispute_(session, payload) {
  var actor = assertCapabilitySession_(session, 'payroll_admin');
  var item = payload || {};
  var disputeId = cleanText_(item.disputeId);
  var reply = cleanText_(item.reply);
  if (!disputeId || !reply) throw new Error('請填寫異議處理回覆。');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.PAYROLL_DISPUTES);
    var values = sheet.getDataRange().getValues();
    for (var index = 1; index < values.length; index++) {
      if (cleanText_(values[index][0]) !== disputeId) continue;
      if (cleanText_(values[index][5]) !== '待處理') throw new Error('這筆異議已處理。');
      var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(index + 1, 6).setValue('已回覆');
      sheet.getRange(index + 1, 7).setValue(reply);
      sheet.getRange(index + 1, 9).setValue(actor);
      sheet.getRange(index + 1, 10).setValue(now);
      var month = cleanText_(values[index][1]);
      var teacher = cleanText_(values[index][2]);
      var summarySheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
      var summaries = summarySheet.getDataRange().getValues();
      for (var summaryIndex = summaries.length - 1; summaryIndex > 0; summaryIndex--) {
        if (cleanText_(summaries[summaryIndex][0]) === month &&
            cleanText_(summaries[summaryIndex][1]) === teacher &&
            cleanText_(summaries[summaryIndex][9]) === CONFIG.PAYROLL_REVIEW_STATUS) {
          summarySheet.getRange(summaryIndex + 1, 10).setValue(CONFIG.PAYROLL_PUBLISHED_STATUS);
          summarySheet.getRange(summaryIndex + 1, 11).setValue('');
          summarySheet.getRange(summaryIndex + 1, 12).setValue(now);
          break;
        }
      }
      appendAuditEventsUnlocked_(requireSheet_(ss, SHEETS.AUDIT), [{
        actor: actor, action: '處理薪資異議', targetId: disputeId, before: '待處理', after: '已回覆', reason: reply
      }]);
      return { id: disputeId, status: '已回覆', reply: reply };
    }
    throw new Error('找不到薪資異議。');
  });
}

function adjustPayrollSummary_(session, payload) {
  var actor = assertCapabilitySession_(session, 'payroll_admin');
  var item = payload || {};
  var month = getPayrollMonthRange_(item.month).month;
  var version = cleanText_(item.version);
  var teacher = cleanText_(item.teacherName);
  var reason = cleanText_(item.reason);
  var adjustment = Number(item.adjustment);
  if (!version || !teacher) throw new Error('薪資調整資料不完整。');
  if (!isFinite(adjustment)) throw new Error('薪資加扣金額格式錯誤。');
  adjustment = Math.round(adjustment);
  if (!reason) throw new Error('請填寫薪資調整原因。');

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensurePayrollStructureUnlocked_(ss);
    var summarySheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
    var values = summarySheet.getDataRange().getValues();
    for (var index = values.length - 1; index > 0; index--) {
      var row = values[index];
      if (cleanText_(row[0]) !== month || cleanText_(row[1]) !== teacher || cleanText_(row[8]) !== version) continue;
      var status = cleanText_(row[9]);
      if (status === CONFIG.PAYROLL_FINALIZED_STATUS) throw new Error('薪資已完成管理員確認，不能再調整。');
      if (status === CONFIG.PAYROLL_REVIEW_STATUS) throw new Error('請先處理這位老師尚未完成的薪資異議。');
      while (row.length < SHEET_HEADERS.PAYROLL_SUMMARIES.length) row.push('');
      var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
      var nextStatus = status === CONFIG.PAYROLL_DRAFT_STATUS
        ? CONFIG.PAYROLL_DRAFT_STATUS
        : CONFIG.PAYROLL_PUBLISHED_STATUS;
      row[6] = (Number(row[2]) || 0) + (Number(row[4]) || 0) +
        (Number(row[5]) || 0) + adjustment;
      row[9] = nextStatus;
      row[10] = '';
      row[11] = now;
      row[12] = adjustment;
      row[13] = reason;
      row[14] = '';
      row[15] = '';
      return runStateTransitionUnlocked_([summarySheet], function(appendAudits) {
        summarySheet.getRange(index + 1, 7, 1, 10).setValues([row.slice(6, 16)]);
        appendAudits([{
          actor: actor,
          action: '管理員調整薪資',
          targetId: [month, teacher].join('|'),
          before: status,
          after: nextStatus,
          reason: '管理員加扣 ' + adjustment + '；' + reason
        }]);
        return getPayrollSummaryObject_(row);
      });
    }
    throw new Error('找不到指定的薪資結算資料。');
  });
}

function finalizePayroll_(session, monthValue, versionValue, teacherNames) {
  var actor = assertCapabilitySession_(session, 'payroll_admin');
  var month = getPayrollMonthRange_(monthValue).month;
  var version = cleanText_(versionValue);
  var requestedTeachers = [];
  var requestedMap = {};
  (Array.isArray(teacherNames) ? teacherNames : []).forEach(function(value) {
    var teacher = cleanText_(value);
    if (!teacher || requestedMap[teacher]) return;
    requestedMap[teacher] = true;
    requestedTeachers.push(teacher);
  });
  if (!version) throw new Error('缺少薪資版本。');

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensurePayrollStructureUnlocked_(ss);
    var summarySheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
    var lineSheet = requireSheet_(ss, SHEETS.PAYROLL_LINES);
    var disputeSheet = requireSheet_(ss, SHEETS.PAYROLL_DISPUTES);
    var formatSheet = ss.getSheetByName(SHEETS.SHERRY_PAYROLL_FORMAT);
    var summaryValues = summarySheet.getDataRange().getValues();
    var lineValues = lineSheet.getDataRange().getValues();
    var disputeValues = disputeSheet.getDataRange().getValues();
    var openDisputes = {};
    disputeValues.slice(1).forEach(function(row) {
      if (cleanText_(row[1]) === month && cleanText_(row[5]) === '待處理') {
        openDisputes[cleanText_(row[2])] = true;
      }
    });

    var candidates = [];
    summaryValues.slice(1).forEach(function(row, index) {
      if (cleanText_(row[0]) !== month || cleanText_(row[8]) !== version) return;
      var teacher = cleanText_(row[1]);
      if (requestedTeachers.length && !requestedMap[teacher]) return;
      candidates.push({ rowNumber: index + 2, row: row, teacher: teacher });
    });
    if (requestedTeachers.length) {
      var foundMap = {};
      candidates.forEach(function(item) { foundMap[item.teacher] = true; });
      var missing = requestedTeachers.filter(function(teacher) { return !foundMap[teacher]; });
      if (missing.length) throw new Error('找不到薪資資料：' + missing.join('、'));
    }
    var eligible = candidates.filter(function(item) {
      return cleanText_(item.row[9]) === CONFIG.PAYROLL_CONFIRMED_STATUS && !openDisputes[item.teacher];
    });
    if (requestedTeachers.length && eligible.length !== candidates.length) {
      throw new Error('選取的薪資尚未完成老師確認，或仍有待處理異議。');
    }
    if (!eligible.length) throw new Error('目前沒有老師已確認且可結案的薪資。');

    var finalizedTeachers = {};
    eligible.forEach(function(item) { finalizedTeachers[item.teacher] = true; });
    var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    var businessSheets = [summarySheet, lineSheet];
    if (formatSheet) businessSheets.push(formatSheet);
    return runStateTransitionUnlocked_(businessSheets, function(appendAudits) {
      eligible.forEach(function(item) {
        var row = item.row.slice();
        while (row.length < SHEET_HEADERS.PAYROLL_SUMMARIES.length) row.push('');
        row[9] = CONFIG.PAYROLL_FINALIZED_STATUS;
        row[11] = now;
        row[14] = now;
        row[15] = actor;
        summarySheet.getRange(item.rowNumber, 10, 1, 7).setValues([row.slice(9, 16)]);
      });
      lineValues.slice(1).forEach(function(row, index) {
        if (cleanText_(row[0]) === month && cleanText_(row[2]) === version && finalizedTeachers[cleanText_(row[4])]) {
          lineSheet.getRange(index + 2, 17).setValue(CONFIG.PAYROLL_FINALIZED_STATUS);
        }
      });
      var formatResult = refreshSherryPayrollFormatUnlocked_(ss, month, version);
      appendAudits(eligible.map(function(item) {
        return {
          actor: actor,
          action: '管理員確認薪資',
          targetId: [month, item.teacher].join('|'),
          before: CONFIG.PAYROLL_CONFIRMED_STATUS,
          after: CONFIG.PAYROLL_FINALIZED_STATUS,
          reason: '版本 ' + version
        };
      }));
      return {
        month: month,
        version: version,
        finalized: eligible.length,
        skipped: candidates.length - eligible.length,
        formatUpdated: formatResult.updated
      };
    });
  });
}

function refreshSherryPayrollFormatUnlocked_(spreadsheet, month, version) {
  var formatSheet = spreadsheet.getSheetByName(SHEETS.SHERRY_PAYROLL_FORMAT);
  if (!formatSheet || formatSheet.getLastRow() < 2) return { updated: 0 };
  var summarySheet = requireSheet_(spreadsheet, SHEETS.PAYROLL_SUMMARIES);
  var finalizedByTeacher = {};
  summarySheet.getDataRange().getValues().slice(1).forEach(function(row) {
    if (cleanText_(row[0]) === month && cleanText_(row[8]) === version &&
        cleanText_(row[9]) === CONFIG.PAYROLL_FINALIZED_STATUS) {
      finalizedByTeacher[cleanText_(row[1])] = Number(row[6]) || 0;
    }
  });
  var values = formatSheet.getRange(1, 1, formatSheet.getLastRow(), 3).getValues();
  var sectionNames = ['中國信託銀行', '台新銀行', 'Linepay', '國泰銀行'];
  var amountValues = values.slice(1).map(function(row) {
    var name = cleanText_(row[0]);
    if (Object.prototype.hasOwnProperty.call(finalizedByTeacher, name)) {
      return [finalizedByTeacher[name]];
    }
    if (sectionNames.indexOf(name) !== -1) return [row[1]];
    return [''];
  });
  formatSheet.getRange(2, 2, amountValues.length, 1).setValues(amountValues);
  return { updated: Object.keys(finalizedByTeacher).length };
}

function getPayrollAdminDashboard_(session, monthValue) {
  assertCapabilitySession_(session, 'payroll_admin');
  var month = monthValue ? getPayrollMonthRange_(monthValue).month : '';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensurePayrollStructureUnlocked_(ss);
  var summarySheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
  var lineSheet = requireSheet_(ss, SHEETS.PAYROLL_LINES);
  var snapshotSheet = requireSheet_(ss, SHEETS.PAYROLL_SNAPSHOT);
  var disputeSheet = requireSheet_(ss, SHEETS.PAYROLL_DISPUTES);
  var summaryRows = summarySheet.getDataRange().getValues().slice(1);
  if (!month && summaryRows.length) month = cleanText_(summaryRows[summaryRows.length - 1][0]);
  if (!month) month = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM');
  var monthRows = summaryRows.filter(function(row) { return cleanText_(row[0]) === month; });
  var version = monthRows.length ? cleanText_(monthRows[monthRows.length - 1][8]) : '';
  var summaries = monthRows.filter(function(row) { return cleanText_(row[8]) === version; }).map(getPayrollSummaryObject_);
  var lines = lineSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return cleanText_(row[0]) === month && cleanText_(row[2]) === version;
  }).map(getPayrollLineObject_);
  var snapshotRows = snapshotSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return cleanText_(row[1]) === month && cleanText_(row[0]) === version;
  });
  var disputes = disputeSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return cleanText_(row[1]) === month;
  }).map(function(row) {
    return {
      id: cleanText_(row[0]), teacherName: cleanText_(row[2]), lineId: cleanText_(row[3]),
      message: cleanText_(row[4]), status: cleanText_(row[5]), reply: cleanText_(row[6]),
      createdAt: cleanText_(row[7]), handler: cleanText_(row[8]), resolvedAt: cleanText_(row[9])
    };
  });
  return {
    month: month,
    version: version,
    summaries: summaries,
    lines: lines,
    disputes: disputes,
    metrics: {
      teachers: summaries.length,
      totalSalary: summaries.reduce(function(total, item) { return total + item.totalSalary; }, 0),
      draft: summaries.filter(function(item) { return item.status === CONFIG.PAYROLL_DRAFT_STATUS; }).length,
      pendingConfirmations: summaries.filter(function(item) { return item.status === CONFIG.PAYROLL_PUBLISHED_STATUS; }).length,
      teacherConfirmed: summaries.filter(function(item) { return item.status === CONFIG.PAYROLL_CONFIRMED_STATUS; }).length,
      finalized: summaries.filter(function(item) { return item.status === CONFIG.PAYROLL_FINALIZED_STATUS; }).length,
      openDisputes: disputes.filter(function(item) { return item.status === '待處理'; }).length,
      errors: snapshotRows.filter(function(row) { return cleanText_(row[14]).indexOf('錯誤：') === 0; }).length
    }
  };
}

function getMyCourses_(session) {
  var teacher = getSessionTeacherName_(session);
  if (areLeavesPaused_()) throw new Error('目前已暫停請假登記，請稍後再試。');
  var targetMonth = getNextMonthKey_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  assertHeaders_(sheet, ['日期', '時間', '課程', '指導者', 'OB Calendar ID']);
  assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
  var activeLeaveIds = {};
  leaveSheet.getDataRange().getValues().slice(1).forEach(function(r) {
    if (cleanText_(r[1]) === teacher &&
        ['確認中', '已領取'].indexOf(cleanText_(r[5])) !== -1 && cleanText_(r[10])) {
      activeLeaveIds[cleanText_(r[10])] = true;
    }
  });

  return sheet.getDataRange().getValues().slice(1).filter(function(r) {
    var calendarId = cleanText_(r[4]);
    return cleanText_(r[3]) === teacher && calendarId && !activeLeaveIds[calendarId] &&
      getVvipMonthFromDate_(r[0]) === targetMonth;
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
  assertHeaders_(sheet, SHEET_HEADERS.LEAVES);

  var auditByTarget = getAuditHistoryMap_();
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
      '異動狀態': cleanText_(r[18]),
      '可自行取消': canSelfCancelLeaveRow_(r),
      '可申請取消': canRequestLeaveCancellationRow_(r),
      '異動紀錄': auditByTarget[cleanText_(r[9])] || []
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

function getSessionManagementCapabilities_(session) {
  var teacher = getSessionTeacherName_(session);
  if (session.managementCapabilities != null) {
    var supplied = normalizeManagementCapabilities_(session.managementCapabilities);
    if (supplied.length || !isAdminRole_(session.role)) return supplied;
  }
  var account = findAccount_(teacher);
  if (account) return getAccountManagementCapabilities_(account);
  return isAdminRole_(session.role) ? MANAGEMENT_CAPABILITIES.slice() : [];
}

function assertCapabilitySession_(session, capability) {
  var teacher = getSessionTeacherName_(session);
  var required = cleanText_(capability);
  if (getSessionManagementCapabilities_(session).indexOf(required) === -1) {
    var labels = {
      course_admin: '課程管理權限',
      payroll_admin: '薪資管理權限',
      vvip_admin: 'VVIP 管理權限'
    };
    throw new Error('沒有' + (labels[required] || '此功能管理權限') + '。');
  }
  return teacher;
}

function openInvitations_(session, teacherNames) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var teachers = normalizeTeacherNames_(teacherNames);
  teachers.forEach(assertTeacherExists_);

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
    assertHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
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
    return runStateTransitionUnlocked_([sheet], function(appendAudits) {
      if (rowsToAppend.length) {
        sheet.getRange(
          sheet.getLastRow() + 1,
          1,
          rowsToAppend.length,
          SHEET_HEADERS.INVITATIONS.length
        ).setValues(rowsToAppend);
      }
      appendAudits(rowsToAppend.map(function(row) {
        return {
        actor: actor,
        action: '開放代課',
        targetId: row[0],
        before: '',
        after: CONFIG.INVITATION_OPEN_STATUS,
        reason: row[1]
        };
      }));

      return {
        requested: teachers.length,
        opened: rowsToAppend.length,
        alreadyOpen: teachers.length - rowsToAppend.length
      };
    });
  });
}

function closeInvitations_(session, teacherNames) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var teachers = normalizeTeacherNames_(teacherNames);
  teachers.forEach(assertTeacherExists_);

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
    assertHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
    var values = sheet.getDataRange().getValues();
    var requestedTeachers = {};
    teachers.forEach(function(teacher) { requestedTeachers[teacher] = true; });
    var closedTeachers = {};
    var auditTargets = {};
    var now = getTimestamp_();
    var updates = [];

    for (var index = 1; index < values.length; index++) {
      var row = values[index];
      var teacher = cleanText_(row[1]);
      if (!requestedTeachers[teacher] || cleanText_(row[4]) !== CONFIG.INVITATION_OPEN_STATUS) continue;
      updates.push({ rowNumber: index + 1, values: [CONFIG.INVITATION_CLOSED_STATUS, now] });
      closedTeachers[teacher] = true;
      if (!auditTargets[teacher]) auditTargets[teacher] = cleanText_(row[0]);
    }

    var closed = Object.keys(closedTeachers).length;
    return runStateTransitionUnlocked_([sheet], function(appendAudits) {
      updates.forEach(function(update) {
        sheet.getRange(update.rowNumber, 5, 1, 2).setValues([update.values]);
      });
      appendAudits(Object.keys(closedTeachers).map(function(teacher) {
        return {
          actor: actor,
          action: '關閉代課',
          targetId: auditTargets[teacher],
          before: CONFIG.INVITATION_OPEN_STATUS,
          after: CONFIG.INVITATION_CLOSED_STATUS,
          reason: teacher
        };
      }));
      return {
        requested: teachers.length,
        closed: closed,
        notOpen: teachers.length - closed
      };
    });
  });
}

function pauseClaims_(session, paused) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var shouldPause = paused === true;

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.SETTINGS);
    assertHeaders_(sheet, SHEET_HEADERS.SETTINGS);
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
    return runStateTransitionUnlocked_([sheet], function(appendAudits) {
      if (rowNumber) {
        sheet.getRange(rowNumber, 1, 1, SHEET_HEADERS.SETTINGS.length).setValues(nextValues);
      } else {
        sheet.getRange(sheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.SETTINGS.length).setValues(nextValues);
      }
      appendAudits([{
        actor: actor,
        action: shouldPause ? '暫停全部領取' : '恢復全部領取',
        targetId: CONFIG.CLAIMS_PAUSED_SETTING,
        before: previous ? '是' : '否',
        after: shouldPause ? '是' : '否',
        reason: ''
      }]);
      return { paused: shouldPause };
    });
  });
}

function pauseLeaves_(session, paused) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var shouldPause = paused === true;

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.SETTINGS);
    assertHeaders_(sheet, SHEET_HEADERS.SETTINGS);
    var values = sheet.getDataRange().getValues();
    var rowNumber = 0;
    var previous = false;
    for (var index = 1; index < values.length; index++) {
      if (cleanText_(values[index][0]) === CONFIG.LEAVES_PAUSED_SETTING) {
        rowNumber = index + 1;
        previous = isTruthySheetValue_(values[index][1]);
        break;
      }
    }

    var nextValues = [[
      CONFIG.LEAVES_PAUSED_SETTING,
      shouldPause ? '是' : '否',
      getTimestamp_(),
      '由管理員手動控制'
    ]];
    return runStateTransitionUnlocked_([sheet], function(appendAudits) {
      if (rowNumber) {
        sheet.getRange(rowNumber, 1, 1, SHEET_HEADERS.SETTINGS.length).setValues(nextValues);
      } else {
        sheet.getRange(sheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.SETTINGS.length).setValues(nextValues);
      }
      appendAudits([{
        actor: actor,
        action: shouldPause ? '暫停全部請假' : '恢復全部請假',
        targetId: CONFIG.LEAVES_PAUSED_SETTING,
        before: previous ? '是' : '否',
        after: shouldPause ? '是' : '否',
        reason: ''
      }]);
      return { paused: shouldPause };
    });
  });
}

function getAvailableSubstitutes_(session) {
  var teacher = getSessionTeacherName_(session);
  assertTeacherExists_(teacher);
  var capabilities = getTeacherCapabilities_(teacher);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invitationSheet = requireSheet_(ss, SHEETS.INVITATIONS);
  assertHeaders_(invitationSheet, SHEET_HEADERS.INVITATIONS);
  var invitationValues = invitationSheet.getDataRange().getValues();
  var hasInvitation = invitationValues.slice(1).some(function(row) {
    return cleanText_(row[1]) === teacher &&
      cleanText_(row[4]) === CONFIG.INVITATION_OPEN_STATUS;
  });
  if (!hasInvitation || areClaimsPaused_()) return [];

  var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
  var leaveValues = leaveSheet.getDataRange().getValues();
  var allPendingRows = leaveValues.slice(1).filter(function(row) {
    return cleanText_(row[5]) === '確認中' && cleanText_(row[1]) !== teacher;
  });
  if (allPendingRows.some(function(row) {
    return !cleanText_(row[9]) ||
      (!cleanText_(row[10]) && cleanText_(row[15]) !== '待人工核對');
  })) {
    throw new Error('代課資料尚未完成初始化，請通知管理員執行系統設定。');
  }
  var pendingRows = allPendingRows.filter(function(row) {
    return isOrdinaryOpenLeaveRow_(row);
  });
  return pendingRows.map(function(row) {
    return {
      '代課編號': cleanText_(row[9]),
      '原老師': cleanText_(row[1]),
      '日期': formatMyDate(row[2]),
      '時段': formatMyTime(row[3]),
      '課程': cleanText_(row[4]),
      '課程大類': getCourseCategory_(row[4]),
      '可沿用原課程': capabilities.indexOf(getCourseCategory_(row[4])) !== -1
    };
  }).sort(function(a, b) {
    return [a['日期'], a['時段'], a['原老師'], a['代課編號']].join('|')
      .localeCompare([b['日期'], b['時段'], b['原老師'], b['代課編號']].join('|'));
  });
}

function isOrdinaryOpenLeaveRow_(row) {
  return cleanText_(row[5]) === '確認中' &&
    !cleanText_(row[6]) &&
    !!cleanText_(row[9]) &&
    !!cleanText_(row[10]) &&
    !getOpenLeaveBlockingState_(row);
}

function getOpenLeaveBlockingState_(row) {
  var verificationState = cleanText_(row[15]);
  if (verificationState) return verificationState;

  var changeState = cleanText_(row[18]);
  if ([
    '申請取消中',
    '申請退出中',
    '取消後待回復 OB',
    '退出後待回復 OB'
  ].indexOf(changeState) !== -1) {
    return changeState;
  }

  return cleanText_(row[8]) === '待回復' ? '待回復' : '';
}

function recordInvitationFirstView_(session) {
  var teacher = getSessionTeacherName_(session);
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
    assertHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
    var values = sheet.getDataRange().getValues();
    var viewedAt = getTimestamp_();
    for (var index = 1; index < values.length; index++) {
      if (cleanText_(values[index][1]) === teacher &&
          cleanText_(values[index][4]) === CONFIG.INVITATION_OPEN_STATUS &&
          !cleanText_(values[index][3])) {
        sheet.getRange(index + 1, 4).setValue(viewedAt);
      }
    }
  });
}

function getClaimOptions_(session) {
  var teacher = getSessionTeacherName_(session);
  assertTeacherExists_(teacher);
  if (areClaimsPaused_() || !hasActiveInvitation_(teacher)) {
    return { capabilities: [], classes: [] };
  }
  var capabilities = getTeacherCapabilities_(teacher);
  return {
    capabilities: capabilities,
    classes: getObClassOptions_().filter(function(item) {
      return capabilities.indexOf(item.category) !== -1;
    })
  };
}

function getObClassOptions_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  assertHeaders_(sheet, SHEET_HEADERS.COURSE_LIST);
  var values = sheet.getDataRange().getValues();
  var seen = {};
  var classes = [];

  values.slice(1).forEach(function(row) {
    var classId = cleanText_(row[5]);
    var courseName = cleanText_(row[2]);
    if (!classId || !courseName || seen[classId]) return;
    seen[classId] = true;
    classes.push({
      classId: classId,
      courseName: courseName,
      category: getCourseCategory_(courseName)
    });
  });

  return classes.sort(function(a, b) {
    return [a.category, a.courseName, a.classId].join('|')
      .localeCompare([b.category, b.courseName, b.classId].join('|'));
  });
}

function normalizeTeacherCapabilities_(value) {
  var source = Array.isArray(value) ? value : String(value == null ? '' : value).split(/[,，、;；\/|\n]+/);
  var seen = {};
  return source.map(function(item) {
    var text = cleanText_(item);
    if (!text) return '';
    var category = getCourseCategory_(text);
    return category === '其他' ? text : category;
  }).filter(function(category) {
    if (!category || seen[category]) return false;
    seen[category] = true;
    return true;
  });
}

function getTeacherCapabilities_(teacherName) {
  var account = findAccount_(teacherName);
  if (!account) return [];
  return normalizeTeacherCapabilities_(account.capabilities);
}

function teacherCanTeachCategory_(teacher, category) {
  var normalizedCategory = normalizeTeacherCapabilities_([category])[0] || '';
  return !!normalizedCategory && getTeacherCapabilities_(teacher).indexOf(normalizedCategory) !== -1;
}

function areClaimsPaused_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.SETTINGS);
  assertHeaders_(sheet, SHEET_HEADERS.SETTINGS);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][0]) === CONFIG.CLAIMS_PAUSED_SETTING) {
      return isTruthySheetValue_(values[index][1]);
    }
  }
  return false;
}

function areLeavesPaused_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.SETTINGS);
  assertHeaders_(sheet, SHEET_HEADERS.SETTINGS);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][0]) === CONFIG.LEAVES_PAUSED_SETTING) {
      return isTruthySheetValue_(values[index][1]);
    }
  }
  return false;
}

function hasActiveInvitation_(teacherName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
  assertHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
  var values = sheet.getDataRange().getValues();
  return values.slice(1).some(function(row) {
    return cleanText_(row[1]) === cleanText_(teacherName) &&
      cleanText_(row[4]) === CONFIG.INVITATION_OPEN_STATUS;
  });
}

function getActiveInvitationId_(teacherName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
  assertHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][1]) === cleanText_(teacherName) &&
        cleanText_(values[index][4]) === CONFIG.INVITATION_OPEN_STATUS) {
      return cleanText_(values[index][0]);
    }
  }
  return '';
}

function getPendingLeaves_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  assertHeaders_(sheet, SHEET_HEADERS.LEAVES);
  var values = sheet.getDataRange().getValues();
  if (values.slice(1).some(function(row) {
    return cleanText_(row[5]) === '確認中' && !cleanText_(row[9]);
  })) {
    throw new Error('代課資料尚未完成初始化，請先執行系統設定。');
  }
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
  assertHeaders_(sheet, SHEET_HEADERS.LEAVES);
  var auditByTarget = getAuditHistoryMap_();
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
      '備註': cleanText_(r[7]),
      '實際課程 ID': cleanText_(r[11]),
      '實際課程名稱': cleanText_(r[12]),
      '預計難度': cleanText_(r[13]),
      '處理類型': cleanText_(r[14]),
      '實際課程類別': cleanText_(r[19]),
      '異動狀態': cleanText_(r[18]),
      '可申請退出': cleanText_(r[18]) !== '申請退出中',
      '異動紀錄': auditByTarget[cleanText_(r[9])] || []
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
    if (areLeavesPaused_()) throw new Error('目前已暫停請假登記，請稍後再試。');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    assertHeaders_(courseSheet, ['日期', '時間', '課程', '指導者']);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);

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
        if (getVvipMonthFromDate_(courseRow[0]) !== getNextMonthKey_()) {
          throw new Error('請假只開放登記下個月課程。');
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
          date: formatMyDate(rawItem && (rawItem['日期'] || rawItem.date)),
          time: formatMyTime(rawItem && (rawItem['時間'] || rawItem['時段'] || rawItem.time)),
          course: cleanText_(rawItem && (rawItem['課程'] || rawItem.course)),
          message: error && error.message ? error.message : String(error)
        });
      }
    });

    var now = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    var rowsToAppend = validated.map(function(item) {
      var row = [
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
      while (row.length < SHEET_HEADERS.LEAVES.length) row.push('');
      return row;
    });
    var result = {
      requested: items.length,
      created: rowsToAppend.length,
      duplicates: duplicates,
      failed: errors.length
    };
    if (errors.length) result.errors = errors;
    if (!rowsToAppend.length) return result;

    return runStateTransitionUnlocked_([leaveSheet], function(appendAudits) {
      leaveSheet
        .getRange(leaveSheet.getLastRow() + 1, 1, rowsToAppend.length, SHEET_HEADERS.LEAVES.length)
        .setValues(rowsToAppend);
      appendAudits(rowsToAppend.map(function(row) {
        return {
          actor: teacher,
          action: '送出請假',
          targetId: row[9],
          before: '',
          after: '確認中',
          reason: [row[2], row[3], row[4]].join(' ')
        };
      }));
      return result;
    });
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
    var invitationId = getActiveInvitationId_(teacher);
    if (!invitationId) throw new Error('目前尚未開放代課領取。');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    var values = leaveSheet.getDataRange().getValues();
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
      if (!cleanText_(row[10])) {
        throw new Error('此課程尚未連結 OB Calendar ID，請通知管理員先完成核對。');
      }
      if (!isOrdinaryOpenLeaveRow_(row)) {
        var unresolvedState = getOpenLeaveBlockingState_(row);
        throw new Error(
          '此課程尚待管理員完成 OB 核對或回復' +
          (unresolvedState ? '（' + unresolvedState + '）' : '') +
          '，暫時不能領取。'
        );
      }
      if (cleanText_(row[1]) === teacher) {
        throw new Error('不能領取自己原本的課程。');
      }

      var change = validateClaimChange_({
        teacher: teacher,
        targetCourseName: cleanText_(row[4]),
        targetCalendarId: cleanText_(row[10]),
        handlingType: item.handlingType,
        actualClassId: item.actualClassId,
        actualCourseName: item.actualCourseName,
        category: item.category,
        difficulty: item.difficulty,
        note: item.note == null ? item.changeNote : item.note
      });
      var nextRow = row.slice();
      while (nextRow.length < SHEET_HEADERS.LEAVES.length) nextRow.push('');
      nextRow[5] = '已領取';
      nextRow[6] = teacher;
      nextRow[7] = change.summary;
      nextRow[8] = '待處理';
      nextRow[11] = change.actualClassId;
      nextRow[12] = change.actualCourseName;
      nextRow[13] = change.difficulty;
      nextRow[14] = change.handlingType;
      nextRow[15] = '待核對';
      nextRow[16] = '';
      nextRow[17] = '';
      nextRow[18] = '';
      nextRow[19] = change.category;
      return {
        sheetRow: dataIndex + 1,
        rowValues: nextRow,
        summary: change.summary
      };
    });

    return runStateTransitionUnlocked_([leaveSheet], function(appendAudits) {
      updates.forEach(function(update) {
        leaveSheet.getRange(update.sheetRow, 6, 1, 16)
          .setValues([update.rowValues.slice(5, 21)]);
      });
      appendAudits(updates.map(function(update) {
        return {
          actor: teacher,
          action: '領取代課',
          targetId: cleanText_(values[update.sheetRow - 1][9]),
          before: '確認中',
          after: '已領取',
          reason: [update.summary, '邀請編號：' + invitationId].filter(Boolean).join('；')
        };
      }));
      return { count: updates.length };
    });
  } finally {
    lock.releaseLock();
  }
}

function cancelLeave_(session, substituteId) {
  var teacher = getSessionTeacherName_(session);
  var id = requireSubstituteId_(substituteId);
  return withScriptLock_(function() {
    var record = getLeaveRecordByIdUnlocked_(id);
    if (cleanText_(record.row[1]) !== teacher) throw new Error('只能取消自己的請假。');
    if (!canSelfCancelLeaveRow_(record.row)) {
      throw new Error('這堂課已有人領取或已開始處理 OB，請改用申請取消。');
    }

    var before = cleanText_(record.row[5]);
    return runStateTransitionUnlocked_([record.sheet], function(appendAudits) {
      record.sheet.getRange(record.rowNumber, 6).setValue('已取消');
      record.sheet.getRange(record.rowNumber, 19).setValue('已自行取消');
      appendAudits([{
        actor: teacher,
        action: '自行取消請假',
        targetId: id,
        before: before,
        after: '已取消',
        reason: ''
      }]);
      return { substituteId: id, status: '已取消' };
    });
  });
}

function requestLeaveCancellation_(session, substituteId, reason) {
  var teacher = getSessionTeacherName_(session);
  var id = requireSubstituteId_(substituteId);
  var requestReason = requireChangeReason_(reason);
  return withScriptLock_(function() {
    var record = getLeaveRecordByIdUnlocked_(id);
    if (cleanText_(record.row[1]) !== teacher) throw new Error('只能申請取消自己的請假。');
    if (canSelfCancelLeaveRow_(record.row)) throw new Error('這堂課目前可以直接取消。');
    if (!canRequestLeaveCancellationRow_(record.row)) throw new Error('目前狀態無法申請取消。');

    var before = cleanText_(record.row[18]);
    return runStateTransitionUnlocked_([record.sheet], function(appendAudits) {
      record.sheet.getRange(record.rowNumber, 19).setValue('申請取消中');
      appendAudits([{
        actor: teacher,
        action: '申請取消請假',
        targetId: id,
        before: before,
        after: '申請取消中',
        reason: requestReason
      }]);
      return { substituteId: id, status: '申請取消中' };
    });
  });
}

function requestClaimWithdrawal_(session, substituteId, reason) {
  var teacher = getSessionTeacherName_(session);
  var id = requireSubstituteId_(substituteId);
  var requestReason = requireChangeReason_(reason);
  return withScriptLock_(function() {
    var record = getLeaveRecordByIdUnlocked_(id);
    if (cleanText_(record.row[5]) !== '已領取' || cleanText_(record.row[6]) !== teacher) {
      throw new Error('只有目前的代課老師可以申請退出。');
    }
    if (cleanText_(record.row[18]) === '申請退出中') throw new Error('退出申請已送出，請等待處理。');
    if (cleanText_(record.row[18]) === '申請取消中') throw new Error('原老師已申請取消，請等待處理。');

    var before = cleanText_(record.row[18]);
    return runStateTransitionUnlocked_([record.sheet], function(appendAudits) {
      record.sheet.getRange(record.rowNumber, 19).setValue('申請退出中');
      appendAudits([{
        actor: teacher,
        action: '申請退出代課',
        targetId: id,
        before: before,
        after: '申請退出中',
        reason: requestReason
      }]);
      return { substituteId: id, status: '申請退出中' };
    });
  });
}

function resolveChangeRequest_(session, substituteId, decision, reason) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var id = requireSubstituteId_(substituteId);
  var normalizedDecision = normalizeResolutionDecision_(decision);
  var resolutionReason = cleanText_(reason);
  if (normalizedDecision === 'reject' && !resolutionReason) throw new Error('駁回時請填寫原因。');

  return withScriptLock_(function() {
    var record = getLeaveRecordByIdUnlocked_(id);
    var row = record.row.slice();
    while (row.length < SHEET_HEADERS.LEAVES.length) row.push('');
    var requestState = cleanText_(row[18]);
    var requestType;
    var action;
    var auditAfter = '';
    var priorSubstitute = cleanText_(row[6]);

    if (requestState === '申請取消中') {
      requestType = 'cancellation';
      if (normalizedDecision === 'approve') {
        row[5] = '已取消';
        row[8] = '待回復';
        row[15] = '待回復 OB';
        row[16] = '';
        row[17] = '';
        row[18] = '取消後待回復 OB';
        action = '核准取消請假';
      } else {
        row[18] = '';
        auditAfter = '取消申請已駁回';
        action = '駁回取消請假';
      }
    } else if (requestState === '申請退出中') {
      requestType = 'withdrawal';
      if (normalizedDecision === 'approve') {
        row[5] = '確認中';
        row[6] = '';
        row[7] = '';
        row[8] = '待回復';
        for (var index = 11; index <= 17; index++) row[index] = '';
        row[15] = '待回復 OB';
        row[18] = '退出後待回復 OB';
        row[19] = '';
        row[20] = '';
        action = '核准退出代課';
      } else {
        row[18] = '退出申請已駁回';
        action = '駁回退出代課';
      }
    } else {
      throw new Error('這筆資料目前沒有待處理的取消或退出申請。');
    }

    var auditReason = resolutionReason;
    if (requestType === 'withdrawal' && normalizedDecision === 'approve') {
      auditReason = ['原代課老師：' + priorSubstitute, resolutionReason].filter(Boolean).join('；');
    }
    return runStateTransitionUnlocked_([record.sheet], function(appendAudits) {
      record.sheet.getRange(record.rowNumber, 6, 1, 16).setValues([row.slice(5, 21)]);
      appendAudits([{
        actor: actor,
        action: action,
        targetId: id,
        before: requestState,
        after: auditAfter || row[18],
        reason: auditReason
      }]);
      return {
        substituteId: id,
        requestType: requestType,
        decision: normalizedDecision,
        status: cleanText_(row[5])
      };
    });
  });
}

function reconcileObChanges_(session) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    var leaveRows = leaveSheet.getDataRange().getValues();
    var courseRows = courseSheet.getDataRange().getValues().slice(1);
    var courseByCalendarId = {};
    var targetMonth = getNextMonthKey_();
    courseRows.forEach(function(row) {
      var calendarId = cleanText_(row[4]);
      if (calendarId) courseByCalendarId[calendarId] = row;
    });

    var result = { checked: 0, matched: 0, exceptions: 0 };
    var updates = [];
    var audits = [];
    for (var rowIndex = 1; rowIndex < leaveRows.length; rowIndex++) {
      var row = leaveRows[rowIndex];
      if (!isLeaveRowInMonth_(row, targetMonth) || !isActiveObWorkRow_(row)) continue;
      result.checked += 1;
      var effectiveCalendarId = cleanText_(row[20]) || cleanText_(row[10]);
      var obRow = courseByCalendarId[effectiveCalendarId];
      var expectation = getObExpectation_(row);
      var differences = [];
      if (!effectiveCalendarId) {
        differences.push('尚未連結 OB Calendar ID');
      } else if (!obRow) {
        differences.push('找不到 OB 課程（Calendar ID：' + effectiveCalendarId + '）');
      } else {
        if (cleanText_(obRow[3]) !== expectation.teacher) {
          differences.push('指導者不一致：預期 ' + expectation.teacher + '，OB 為 ' + cleanText_(obRow[3]));
        }
        if (expectation.classId) {
          if (cleanText_(obRow[5]) !== expectation.classId) {
            differences.push('課程不一致：預期 Class ID ' + expectation.classId + '，OB 為 ' + cleanText_(obRow[5]));
          }
        } else if (normalizeCourseName_(obRow[2]) !== normalizeCourseName_(expectation.course)) {
          differences.push('課程不一致：預期 ' + expectation.course + '，OB 為 ' + cleanText_(obRow[2]));
        }
      }

      var now = getTimestamp_();
      var before = cleanText_(row[15]);
      var auditAfter = '';
      var nextRow = row.slice();
      while (nextRow.length < SHEET_HEADERS.LEAVES.length) nextRow.push('');
      if (!differences.length) {
        if (expectation.restoreType === 'cancellation') {
          nextRow[8] = '已完成';
          nextRow[15] = '已回復核對';
          nextRow[16] = now;
          nextRow[17] = '';
          nextRow[18] = '取消後已回復 OB';
        } else if (expectation.restoreType === 'withdrawal') {
          nextRow[8] = '';
          nextRow[15] = '';
          nextRow[16] = '';
          nextRow[17] = '';
          nextRow[18] = '';
          auditAfter = '已重新開放';
        } else {
          nextRow[8] = '已完成';
          nextRow[15] = '已核對';
          nextRow[16] = now;
          nextRow[17] = '';
        }
        result.matched += 1;
        audits.push({
          actor: actor,
          action: expectation.restoreType ? 'OB 回復完成' : 'OB 核對完成',
          targetId: row[9],
          before: before,
          after: auditAfter || cleanText_(nextRow[15]) || cleanText_(nextRow[18]),
          reason: effectiveCalendarId
        });
      } else {
        var differenceText = differences.join('；');
        nextRow[8] = expectation.restoreType ? '待回復' : '待處理';
        nextRow[15] = '核對異常';
        nextRow[16] = now;
        nextRow[17] = differenceText;
        result.exceptions += 1;
        audits.push({
          actor: actor,
          action: expectation.restoreType ? 'OB 回復異常' : 'OB 核對異常',
          targetId: row[9],
          before: before,
          after: '核對異常',
          reason: differenceText
        });
      }
      updates.push({ rowNumber: rowIndex + 1, values: nextRow.slice(5, 21) });
    }

    if (!updates.length) return result;
    return runStateTransitionUnlocked_([leaveSheet], function(appendAudits) {
      updates.forEach(function(update) {
        leaveSheet.getRange(update.rowNumber, 6, 1, 16).setValues([update.values]);
      });
      appendAudits(audits);
      return result;
    });
  });
}

function isLeaveRowInMonth_(row, month) {
  var date = formatMyDate(row[2]);
  var match = /^(\d{4})\/(\d{2})\//.exec(date);
  return Boolean(match) && match[1] + '-' + match[2] === cleanText_(month);
}

function isActiveObWorkRow_(row) {
  var changeStatus = cleanText_(row[18]);
  if (['取消後待回復 OB', '退出後待回復 OB'].indexOf(changeStatus) !== -1) {
    return true;
  }
  if (cleanText_(row[5]) !== '已領取') return false;
  return ['', '待核對', '核對異常'].indexOf(cleanText_(row[15])) !== -1;
}

function getObExpectation_(row) {
  var changeStatus = cleanText_(row[18]);
  if (changeStatus === '取消後待回復 OB') {
    return {
      teacher: cleanText_(row[1]),
      course: cleanText_(row[4]),
      classId: '',
      restoreType: 'cancellation'
    };
  }
  if (changeStatus === '退出後待回復 OB') {
    return {
      teacher: cleanText_(row[1]),
      course: cleanText_(row[4]),
      classId: '',
      restoreType: 'withdrawal'
    };
  }
  return {
    teacher: cleanText_(row[6]),
    course: cleanText_(row[12]) || cleanText_(row[4]),
    classId: cleanText_(row[11]),
    restoreType: ''
  };
}

function linkReplacementCalendarItem_(session, substituteId, replacementCalendarId) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var id = requireSubstituteId_(substituteId);
  var replacementId = cleanText_(replacementCalendarId);
  if (!replacementId) throw new Error('請選擇替代的 OB 課程。');

  return withScriptLock_(function() {
    var obCourse = findObCourseByCalendarId_(replacementId);
    if (!obCourse) throw new Error('找不到選擇的替代 OB 課程，請先重新同步。');
    var record = getLeaveRecordByIdUnlocked_(id);
    var changeStatus = cleanText_(record.row[18]);
    var manualReview = cleanText_(record.row[15]) === '待人工核對';
    if (!manualReview && cleanText_(record.row[5]) !== '已領取' &&
        ['取消後待回復 OB', '退出後待回復 OB'].indexOf(changeStatus) === -1) {
      throw new Error('只有待處理 OB 的紀錄可以連結替代 OB 課程。');
    }
    var before = cleanText_(record.row[20]) || cleanText_(record.row[10]);
    var nextVerification = ['取消後待回復 OB', '退出後待回復 OB'].indexOf(changeStatus) !== -1
      ? '待回復 OB'
      : '待核對';
    return runStateTransitionUnlocked_([record.sheet], function(appendAudits) {
      if (manualReview) {
        record.sheet.getRange(record.rowNumber, 11).setValue(replacementId);
        if (cleanText_(record.row[5]) === '已領取') {
          record.sheet.getRange(record.rowNumber, 9).setValue('待處理');
          record.sheet.getRange(record.rowNumber, 16, 1, 3).setValues([['待核對', '', '']]);
        } else {
          record.sheet.getRange(record.rowNumber, 16, 1, 3).setValues([['', '', '']]);
        }
      } else {
        record.sheet.getRange(record.rowNumber, 21).setValue(replacementId);
        record.sheet.getRange(record.rowNumber, 16, 1, 3).setValues([[nextVerification, '', '']]);
      }
      appendAudits([{
        actor: actor,
        action: manualReview ? '連結舊資料 OB 課程' : '連結替代 OB 課程',
        targetId: id,
        before: before,
        after: replacementId,
        reason: obCourse.courseName
      }]);
      return { substituteId: id, replacementCalendarId: replacementId };
    });
  });
}

function getAdminDashboard_(session) {
  assertCapabilitySession_(session, 'course_admin');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    var invitationSheet = requireSheet_(ss, SHEETS.INVITATIONS);
    var accountSheet = requireSheet_(ss, SHEETS.ACCOUNTS);
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(invitationSheet, SHEET_HEADERS.INVITATIONS);
    assertHeaders_(accountSheet, SHEET_HEADERS.ACCOUNTS);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);

    var auditByTarget = getAuditHistoryMap_();
    var leaveSourceRows = leaveSheet.getDataRange().getValues().slice(1).filter(function(row) {
      return cleanText_(row[9]);
    });
    var targetMonth = getNextMonthKey_();
    var leaves = leaveSourceRows.map(function(row) {
      return toAdminLeaveItem_(row, auditByTarget[cleanText_(row[9])] || []);
    });
    var activeInvitees = invitationSheet.getDataRange().getValues().slice(1).filter(function(row) {
      return cleanText_(row[4]) === CONFIG.INVITATION_OPEN_STATUS;
    }).map(function(row) {
      return {
        invitationId: cleanText_(row[0]),
        teacherName: cleanText_(row[1]),
        openedAt: cleanText_(row[2]),
        viewedAt: cleanText_(row[3])
      };
    });
    var accountHeaders = getHeaderMap_(accountSheet);
    var teachers = accountSheet.getDataRange().getValues().slice(1).filter(function(row) {
      return cleanText_(row[accountHeaders['指導者'] - 1]) &&
        isAccountActive_(row[accountHeaders['是否在職'] - 1]);
    }).map(function(row) {
      return cleanText_(row[accountHeaders['指導者'] - 1]);
    });
    var replacementOptions = courseSheet.getDataRange().getValues().slice(1).map(function(row) {
      return {
        calendarId: cleanText_(row[4]),
        courseName: cleanText_(row[2]),
        teacherName: cleanText_(row[3]),
        date: formatMyDate(row[0]),
        time: formatMyTime(row[1])
      };
    }).filter(function(item) { return item.calendarId; });

    return {
      paused: areClaimsPaused_(),
      leavePaused: areLeavesPaused_(),
      teachers: teachers,
      pendingInvitations: leaves.filter(function(item, index) {
        return isOrdinaryOpenLeaveRow_(leaveSourceRows[index]);
      }),
      activeInvitees: activeInvitees,
      obWork: leaves.filter(function(item) {
        return ['取消後待回復 OB', '退出後待回復 OB'].indexOf(item.changeStatus) !== -1 ||
          (item.status === '已領取' &&
            ['', '待核對', '核對異常'].indexOf(item.verificationStatus) !== -1);
      }),
      changeRequests: leaves.filter(function(item) {
        return item.status === '已取消' ||
          ['申請取消中', '申請退出中'].indexOf(item.changeStatus) !== -1 ||
          /取消|退出/.test(item.changeStatus);
      }),
      exceptions: leaves.filter(function(item, index) {
        return isLeaveRowInMonth_(leaveSourceRows[index], targetMonth) &&
          ['核對異常', '待人工核對'].indexOf(item.verificationStatus) !== -1;
      }),
      completed: leaves.filter(function(item) {
        return item.status !== '已取消' &&
          ['已核對', '已回復核對'].indexOf(item.verificationStatus) !== -1;
      }),
      replacementOptions: replacementOptions
    };
  });
}

function toAdminLeaveItem_(row, auditHistory) {
  return {
    substituteId: cleanText_(row[9]),
    originalTeacher: cleanText_(row[1]),
    substituteTeacher: cleanText_(row[6]),
    date: formatMyDate(row[2]),
    time: formatMyTime(row[3]),
    originalCourse: cleanText_(row[4]),
    actualCourse: cleanText_(row[12]) || cleanText_(row[4]),
    actualClassId: cleanText_(row[11]),
    difficulty: cleanText_(row[13]),
    handlingType: cleanText_(row[14]),
    note: cleanText_(row[7]),
    status: cleanText_(row[5]),
    changeStatus: cleanText_(row[18]),
    verificationStatus: cleanText_(row[15]),
    verificationTime: cleanText_(row[16]),
    differenceReason: cleanText_(row[17]),
    originalCalendarId: cleanText_(row[10]),
    replacementCalendarId: cleanText_(row[20]),
    auditHistory: auditHistory
  };
}

function getAuditHistoryMap_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.AUDIT);
  if (!sheet) return {};
  assertHeaders_(sheet, SHEET_HEADERS.AUDIT);
  var history = {};
  sheet.getDataRange().getValues().slice(1).forEach(function(row) {
    var targetId = cleanText_(row[3]);
    if (!targetId) return;
    if (!history[targetId]) history[targetId] = [];
    history[targetId].push({
      time: cleanText_(row[0]),
      actor: cleanText_(row[1]),
      action: cleanText_(row[2]),
      before: cleanText_(row[4]),
      after: cleanText_(row[5]),
      reason: cleanText_(row[6])
    });
  });
  return history;
}

function getLeaveRecordByIdUnlocked_(substituteId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  assertHeaders_(sheet, SHEET_HEADERS.LEAVES);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][9]) === substituteId) {
      var row = values[index].slice();
      while (row.length < SHEET_HEADERS.LEAVES.length) row.push('');
      return { sheet: sheet, rowNumber: index + 1, row: row };
    }
  }
  throw new Error('找不到指定的請假代課紀錄，請重新整理。');
}

function canSelfCancelLeaveRow_(row) {
  return cleanText_(row[5]) === '確認中' && !cleanText_(row[6]) && !hasObProcessingStarted_(row) &&
    ['申請取消中', '申請退出中'].indexOf(cleanText_(row[18])) === -1;
}

function canRequestLeaveCancellationRow_(row) {
  return ['確認中', '已領取'].indexOf(cleanText_(row[5])) !== -1 &&
    !canSelfCancelLeaveRow_(row) &&
    ['申請取消中', '申請退出中'].indexOf(cleanText_(row[18])) === -1;
}

function hasObProcessingStarted_(row) {
  return [row[8], row[15], row[16], row[17]].some(function(value) { return !!cleanText_(value); });
}

function requireSubstituteId_(value) {
  var id = cleanText_(value);
  if (!id) throw new Error('缺少代課編號。');
  return id;
}

function requireChangeReason_(value) {
  var reason = cleanText_(value);
  if (!reason) throw new Error('請填寫申請原因。');
  return reason;
}

function normalizeResolutionDecision_(value) {
  var decision = cleanText_(value).toLowerCase();
  if (['approve', '核准', '同意'].indexOf(decision) !== -1) return 'approve';
  if (['reject', '駁回', '不同意'].indexOf(decision) !== -1) return 'reject';
  throw new Error('處理決定無效。');
}

function validateClaimChange_(claim) {
  var item = claim || {};
  var teacher = cleanText_(item.teacher);
  var targetCourseName = cleanText_(item.targetCourseName);
  var targetCategory = getCourseCategory_(targetCourseName);
  var handlingKey = cleanText_(item.handlingType) || 'original';
  var difficulty = cleanText_(item.difficulty);
  var note = cleanText_(item.note);
  var actualClassId = '';
  var actualCourseName = '';
  var actualCategory = '';
  var handlingType = '';

  if (!teacher || !targetCourseName) throw new Error('代課課程資料不完整，請重新整理。');

  if (handlingKey === 'original') {
    if (!teacherCanTeachCategory_(teacher, targetCategory)) {
      throw new Error('這堂課不在您的可教授類別中，不能沿用原課程。');
    }
    var originalCourse = findObCourseByCalendarId_(item.targetCalendarId);
    actualClassId = originalCourse ? originalCourse.classId : '';
    actualCourseName = targetCourseName;
    actualCategory = targetCategory;
    handlingType = '沿用原課程';
  } else if (handlingKey === 'existing') {
    actualClassId = cleanText_(item.actualClassId);
    if (!actualClassId) throw new Error('請選擇要改用的 OB 現有課程。');
    var existingCourse = findObCourseByClassId_(actualClassId);
    if (!existingCourse) throw new Error('找不到選擇的 OB 現有課程，請重新整理。');
    actualCourseName = existingCourse.courseName;
    actualCategory = existingCourse.category;
    handlingType = '改用既有 OB 課程';
  } else if (handlingKey === 'new') {
    actualCourseName = cleanText_(item.actualCourseName);
    actualCategory = normalizeTeacherCapabilities_([item.category])[0] || '';
    if (!actualCourseName) throw new Error('請填寫需要新增的課程名稱。');
    if (!actualCategory) throw new Error('請選擇需要新增課程的類別。');
    if (!difficulty) throw new Error('需要新增課程時，請填寫難度。');
    handlingType = '需要新增課程';
  } else {
    throw new Error('課程處理方式無效，請重新選擇。');
  }

  if (!teacherCanTeachCategory_(teacher, actualCategory)) {
    throw new Error('所選課程類別不在可教授類別中。');
  }

  var isCrossApparatus = actualCategory !== targetCategory ||
    !teacherCanTeachCategory_(teacher, targetCategory);
  if (isCrossApparatus && !note) {
    throw new Error('跨道具代課時，請填寫改課原因或補充備註。');
  }

  var normalized = {
    actualClassId: actualClassId,
    actualCourseName: actualCourseName,
    category: actualCategory,
    difficulty: difficulty,
    handlingType: handlingType,
    note: note
  };
  normalized.summary = buildClaimSummary_(normalized);
  return normalized;
}

function findObCourseByCalendarId_(calendarId) {
  var wantedId = cleanText_(calendarId);
  if (!wantedId) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  assertHeaders_(sheet, SHEET_HEADERS.COURSE_LIST);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][4]) === wantedId) {
      return {
        calendarId: wantedId,
        classId: cleanText_(values[index][5]),
        courseName: cleanText_(values[index][2]),
        category: getCourseCategory_(values[index][2])
      };
    }
  }
  return null;
}

function findObCourseByClassId_(classId) {
  var wantedId = cleanText_(classId);
  if (!wantedId) return null;
  var classes = getObClassOptions_();
  for (var index = 0; index < classes.length; index++) {
    if (classes[index].classId === wantedId) return classes[index];
  }
  return null;
}

function buildClaimSummary_(change) {
  var parts = [];
  if (change.handlingType === '沿用原課程') {
    parts.push('沿用原課程');
  } else {
    parts.push(change.handlingType + '：' + change.actualCourseName);
  }
  if (change.difficulty) parts.push('難度：' + change.difficulty);
  if (change.note) parts.push('備註：' + change.note);
  return parts.join('；');
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
    throw new Error('老師帳號未啟用或尚未設定密碼。');
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
