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
  SHERRY_PAYROLL_FORMAT: '給雪莉的格式',
  SPECIAL_COURSE_REQUESTS: '特別課安排',
  COURSE_CLOSURE_SETTINGS: '關課設定',
  COURSE_CLOSURE_LOG: '關課紀錄',
  COURSE_ADJUSTMENTS: '課程調整',
  PRACTICE_SERIES: '自主練習系列',
  PRACTICE_BOOKINGS: '自主練習場次',
  PRACTICE_PARTICIPANTS: '自主練習參與者',
  PRACTICE_EXCEPTIONS: '自主練習例外',
  PRACTICE_AUDIT: '自主練習操作紀錄',
  NOTIFICATION_MESSAGES: '通知訊息',
  NOTIFICATION_RECIPIENTS: '通知收件人',
  DISCOUNT_OBSERVATIONS: '課程開課觀測',
  DISCOUNT_HISTORY: '優惠課程歷史',
  DISCOUNT_RECOMMENDATIONS: '優惠課程推薦'
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
    '實際課程類別', '替代 OB Calendar ID',
    '特別課群組 ID', '特別課模式', '特別課分鐘數', '特別課結束時間',
    '實際開始時間', '延後分鐘數', '延後占用來源代課編號',
    '調課群組 ID', '調課確認時間', '調課確認者'
  ],
  INVITATIONS: ['邀請編號', '老師', '開放時間', '首次查看時間', '狀態', '關閉時間'],
  AUDIT: ['操作時間', '操作者', '操作類型', '目標編號', '舊狀態', '新狀態', '原因'],
  SETTINGS: ['設定名稱', '設定值', '更新時間', '備註'],
  ACCOUNTS: [
    '指導者', 'Salt', 'PIN 雜湊', '是否在職', '角色', '登入失敗次數', '鎖定至',
    '可教授類別', '功能權限'
  ],
  SPECIAL_COURSE_REQUESTS: [
    '申請時間', '特別課群組 ID', '老師', '日期', '教室', '來源時段 JSON',
    '代課編號 JSON', '實際開始時間', '特別課名稱', '預計難度', '分鐘數',
    '結束時間', '模式', '備註', '狀態', 'OB 核對狀態', 'OB 核對時間',
    '差異原因', '替代 OB Calendar ID'
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
  PAYROLL_PAYMENT_SETTINGS: ['老師', '轉帳群組/銀行', '備註', '是否啟用'],
  COURSE_CLOSURE_SETTINGS: ['設定鍵', '設定值', '更新時間', '操作者', '備註'],
  COURSE_CLOSURE_LOG: [
    '執行時間', '目標日期', '檢核時段', 'OB Calendar ID', '課程', '老師',
    '最新人數', '套用規則', 'onlyEmpty', '結果', '錯誤訊息', '操作者'
  ],
  COURSE_ADJUSTMENTS: [
    '調課群組 ID', '偵測版本', '日期', '教室配對', '調整前 JSON', '調整後 JSON',
    '建議配對 JSON', '狀態', '判斷原因', '建立時間', '確認時間', '確認者',
    '忽略原因', '通知狀態', '通知錯誤'
  ],
  PRACTICE_SERIES: [
    '系列 ID', '建立者', '教室', '星期', '開始時間', '結束時間', '生效日期',
    '停止日期', '狀態', '建立時間', '更新時間', '更新者'
  ],
  PRACTICE_BOOKINGS: [
    '場次 ID', '系列 ID', '日期', '教室', '開始時間', '結束時間', '狀態',
    '建立者', '候補 OB Calendar ID', '狀態原因', '建立時間', '更新時間', '更新者'
  ],
  PRACTICE_PARTICIPANTS: [
    '參與 ID', '場次 ID', '系列 ID', '老師', '角色', '開始時間', '結束時間',
    '加入範圍', '狀態', '加入時間', '退出時間'
  ],
  PRACTICE_EXCEPTIONS: [
    '例外 ID', '系列 ID', '日期', '類型', '原因', '建立時間', '建立者'
  ],
  PRACTICE_AUDIT: [
    '時間', '操作者', '動作', '目標類型', '目標 ID', '修改前 JSON',
    '修改後 JSON', '原因'
  ],
  NOTIFICATION_MESSAGES: [
    '訊息 ID', '事件 ID', '類型', '標題', '內容', '連結', '關聯編號', '建立時間', '建立者'
  ],
  NOTIFICATION_RECIPIENTS: [
    '收件紀錄 ID', '訊息 ID', '收件人', '狀態', '已讀時間', '建立時間'
  ],
  DISCOUNT_OBSERVATIONS: [
    '觀測 ID', '固定時段鍵', '月份', '星期', '時間', '教室', '課程', '老師',
    'OB Calendar ID', '觀測堂數', '未開堂數', '最近未開日期', '來源', '排除原因', '觀測時間'
  ],
  DISCOUNT_HISTORY: [
    '優惠月份', '固定時段鍵', '星期', '時間', '教室', '課程', '老師',
    '來源', '推薦批次 ID', '確認時間', '確認者'
  ],
  DISCOUNT_RECOMMENDATIONS: [
    '推薦批次 ID', '推薦月份', '項目 ID', '類型', '排序', '固定時段鍵', '星期',
    '時間', '教室', '課程', '老師', '觀測堂數', '未開堂數', '未開率',
    '最近未開日期', '分數', '理由', '狀態', '建立時間', '更新時間', '操作者'
  ]
};

var PRACTICE_STATUS = {
  WAITLISTED: '候補',
  ACTIVE: '已成立',
  CANCELLED: '已取消',
  CONFLICT_CANCELLED: '衝突取消'
};

var PRACTICE_ROLE = {
  CREATOR: '建立者',
  PARTICIPANT: '參與者'
};

var PRACTICE_PARTICIPANT_STATUS = {
  ACTIVE: '有效',
  LEFT: '已退出',
  CANCELLED: '已取消'
};

var CONFIG = {
  COURSE_SHEET: SHEETS.COURSE_LIST,
  LEAVE_SHEET: SHEETS.LEAVES,
  API_URL: 'https://api.omceanbooking.com/v1/calendar',
  API_BASE_URL: 'https://api.omceanbooking.com',
  CLASSES_API_URL: 'https://api.omceanbooking.com/v1/classes',
  API_TOKEN_PROPERTY: 'OMCEAN_API_TOKEN',
  OB_CANCEL_CALENDAR_PATH_PROPERTY: 'OMCEAN_CANCEL_CALENDAR_PATH',
  OB_CANCEL_CALENDAR_DEFAULT_PATH: '/v1/calendar/{id}/cancel',
  OB_CLASS_CACHE_KEY: 'OB_ACTIVE_CLASS_CATALOG_V1',
  OB_CLASS_CACHE_SECONDS: 21600,
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
  INVITATION_ROUND_ENDED_STATUS: '本輪已結束',
  CLAIMS_PAUSED_SETTING: '暫停全部領取',
  LEAVES_PAUSED_SETTING: '暫停全部請假',
  VVIP_MAX_SELECTIONS: 3,
  VVIP_READ_CACHE_SECONDS: 300,
  VVIP_MEMBER_CACHE_KEY: 'VVIP_PUBLIC_MEMBERS_V1',
  VVIP_COURSE_CACHE_KEY_PREFIX: 'VVIP_BASE_COURSES_V2_',
  COURSE_CAPABILITY_CACHE_KEY: 'COURSE_CAPABILITIES_V1',
  COURSE_CLAIM_CATALOG_CACHE_KEY: 'COURSE_CLAIM_CATALOG_V1',
  VVIP_PENDING_STATUS: '待人工確認',
  VVIP_CONFIRMED_STATUS: '已確認',
  VVIP_CANCELLED_STATUS: '已取消',
  VVIP_COURSE_CANCELLED_STATUS: '課程已取消',
  OB_CANCELLATION_BATCH_MAX: 100,
  COURSE_CLOSURE_MODE_SETTING: 'executionMode',
  COURSE_CLOSURE_SCHEDULER_INSTALLED_PROPERTY: 'COURSE_CLOSURE_SCHEDULER_INSTALLED_AT',
  COURSE_CLOSURE_FAILURE_EMAIL: 'takochang68@gmail.com',
  ONESIGNAL_APP_ID_PROPERTY: 'ONESIGNAL_APP_ID',
  ONESIGNAL_REST_API_KEY_PROPERTY: 'ONESIGNAL_REST_API_KEY',
  ONESIGNAL_NOTIFICATIONS_URL: 'https://api.onesignal.com/notifications',
  PUBLIC_APP_URL: 'https://sherryaerial-web.github.io/sub.html/',
  PUSH_EXTERNAL_ID_SALT_PROPERTY: 'PUSH_EXTERNAL_ID_SALT',
  PUSH_SENT_KEY_PREFIX: 'PUSH_SENT_',
  NOTIFICATION_SCHEDULES_PROPERTY: 'NOTIFICATION_SCHEDULES_V1',
  COURSE_CLOSURE_SOCIAL_COPY_PREFIX: 'COURSE_CLOSURE_SOCIAL_COPY_',
  PAYROLL_DRAFT_STATUS: '草稿',
  PAYROLL_PUBLISHED_STATUS: '待確認',
  PAYROLL_CONFIRMED_STATUS: '已確認',
  PAYROLL_FINALIZED_STATUS: '管理員已確認',
  PAYROLL_REVIEW_STATUS: '有異議'
};

var MANAGEMENT_CAPABILITIES = ['course_admin', 'payroll_admin', 'vvip_admin'];

var SUPPLEMENTAL_TEACHER_CAPABILITIES = {
  'Vivi': ['鞦韆'],
  'Tako': ['鞦韆']
};

function parsePracticeDateTime_(dateValue, timeValue) {
  var dateText = cleanText_(dateValue);
  var timeText = cleanText_(timeValue);
  var dateMatch = dateText.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
  var timeMatch = timeText.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) throw new Error('自主練習日期或時間格式不正確。');

  var hour = Number(timeMatch[1]);
  var minute = Number(timeMatch[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('自主練習時間格式不正確。');
  }

  var canonicalDate = [dateMatch[1], dateMatch[2], dateMatch[3]].join('/');
  var value = new Date(
    dateMatch[1] + '-' + dateMatch[2] + '-' + dateMatch[3] +
    'T' + timeMatch[1] + ':' + timeMatch[2] + ':00+08:00'
  );
  if (!isFinite(value.getTime()) ||
      Utilities.formatDate(value, 'Asia/Taipei', 'yyyy/MM/dd') !== canonicalDate ||
      Utilities.formatDate(value, 'Asia/Taipei', 'HH:mm') !== timeText) {
    throw new Error('自主練習日期或時間不存在。');
  }
  return value;
}

function normalizePracticeInterval_(dateValue, startTimeValue, endTimeValue) {
  var dateText = cleanText_(dateValue).replace(/-/g, '/');
  var startTime = cleanText_(startTimeValue);
  var endTime = cleanText_(endTimeValue);
  var startMinutes = timeTextToMinutes_(startTime);
  var endMinutes = timeTextToMinutes_(endTime);
  if (startMinutes < 0 || endMinutes < 0) throw new Error('自主練習時間格式不正確。');
  if (startMinutes % 5 !== 0 || endMinutes % 5 !== 0) {
    throw new Error('自主練習時間必須以 5 分鐘為單位。');
  }
  if (endMinutes <= startMinutes) throw new Error('自主練習結束時間必須晚於開始時間。');
  if (endMinutes - startMinutes < 15) throw new Error('自主練習至少 15 分鐘。');

  var start = parsePracticeDateTime_(dateText, startTime);
  var end = parsePracticeDateTime_(dateText, endTime);
  return {
    date: dateText,
    startTime: startTime,
    endTime: endTime,
    startMs: start.getTime(),
    endMs: end.getTime(),
    durationMinutes: endMinutes - startMinutes
  };
}

function practiceIntervalsConflict_(leftValue, rightValue, bufferMinutesValue) {
  var left = leftValue || {};
  var right = rightValue || {};
  var bufferMs = Math.max(0, Number(bufferMinutesValue) || 0) * 60 * 1000;
  var leftStart = Number(left.startMs);
  var leftEnd = Number(left.endMs);
  var rightStart = Number(right.startMs);
  var rightEnd = Number(right.endMs);
  if (![leftStart, leftEnd, rightStart, rightEnd].every(isFinite)) {
    throw new Error('無法判斷自主練習時間衝突。');
  }
  return leftStart < rightEnd + bufferMs && rightStart < leftEnd + bufferMs;
}

function getPracticeQuickDurationOptions_(requestValue, blockersValue) {
  var request = requestValue || {};
  var blockers = Array.isArray(blockersValue) ? blockersValue : [];
  var startMinutes = timeTextToMinutes_(request.startTime);
  if (startMinutes < 0 || startMinutes % 5 !== 0) {
    throw new Error('自主練習時間必須以 5 分鐘為單位。');
  }
  return [60, 90, 120].map(function(minutes) {
    var endMinutes = startMinutes + minutes;
    if (endMinutes > 24 * 60) {
      return { minutes: minutes, available: false, reason: '超過當日可登記時間' };
    }
    var candidate = normalizePracticeInterval_(
      request.date,
      minutesToTimeText_(startMinutes),
      minutesToTimeText_(endMinutes)
    );
    var conflict = blockers.find(function(blocker) {
      return blocker && blocker.interval &&
        practiceIntervalsConflict_(candidate, blocker.interval, 15);
    });
    return {
      minutes: minutes,
      available: !conflict,
      reason: conflict
        ? '與 ' + cleanText_(conflict.label || '既有行程') + ' 的前後 15 分鐘緩衝衝突'
        : ''
    };
  });
}

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

function bytesToHex_(bytes) {
  return (bytes || []).map(function(byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function getPushExternalId_(teacherNameValue) {
  var teacherName = cleanText_(teacherNameValue);
  var properties = getScriptProperties_();
  var salt = properties
    ? cleanText_(properties.getProperty(CONFIG.PUSH_EXTERNAL_ID_SALT_PROPERTY))
    : '';
  if (!teacherName || !salt) return '';
  return 'teacher_' + bytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + ':' + teacherName,
    Utilities.Charset.UTF_8
  ));
}

function getPushConfiguration_(session) {
  var teacherName = getSessionTeacherName_(session);
  var properties = getScriptProperties_();
  var appId = properties
    ? cleanText_(properties.getProperty(CONFIG.ONESIGNAL_APP_ID_PROPERTY))
    : '';
  var restApiKey = properties
    ? cleanText_(properties.getProperty(CONFIG.ONESIGNAL_REST_API_KEY_PROPERTY))
    : '';
  if (!appId || !restApiKey) return { configured: false, appId: '', externalId: '' };

  var salt = cleanText_(properties.getProperty(CONFIG.PUSH_EXTERNAL_ID_SALT_PROPERTY));
  if (!salt) {
    salt = createRandomToken_();
    properties.setProperty(CONFIG.PUSH_EXTERNAL_ID_SALT_PROPERTY, salt);
  }
  return {
    configured: true,
    appId: appId,
    externalId: getPushExternalId_(teacherName)
  };
}

function getActiveCourseAdminNames_() {
  var sheet = getAccountsSheet_();
  var headers = getHeaderMap_(sheet);
  var values = sheet.getDataRange().getValues();
  var names = [];
  var seen = {};
  for (var index = 1; index < values.length; index++) {
    var row = values[index];
    var teacherName = cleanText_(row[headers['指導者'] - 1]);
    if (!teacherName || seen[teacherName] || !isAccountActive_(row[headers['是否在職'] - 1])) continue;
    var account = {
      role: row[headers['角色'] - 1],
      managementCapabilities: row[headers['功能權限'] - 1]
    };
    if (getAccountManagementCapabilities_(account).indexOf('course_admin') === -1) continue;
    seen[teacherName] = true;
    names.push(teacherName);
  }
  return names;
}

function sendPushNotificationSafely_(teacherNames, messageValue) {
  var names = Array.isArray(teacherNames) ? teacherNames.map(cleanText_).filter(Boolean) : [];
  var seen = {};
  names = names.filter(function(name) {
    if (seen[name]) return false;
    seen[name] = true;
    return true;
  });
  var properties = getScriptProperties_();
  var appId = properties
    ? cleanText_(properties.getProperty(CONFIG.ONESIGNAL_APP_ID_PROPERTY))
    : '';
  var restApiKey = properties
    ? cleanText_(properties.getProperty(CONFIG.ONESIGNAL_REST_API_KEY_PROPERTY))
    : '';
  if (!names.length || !appId || !restApiKey || typeof UrlFetchApp === 'undefined') {
    return { attempted: false, accepted: false, delivered: 0, messageId: '', error: '' };
  }

  var externalIds = names.map(getPushExternalId_).filter(Boolean);
  if (!externalIds.length) return { attempted: false, accepted: false, delivered: 0, messageId: '', error: '' };
  var message = messageValue || {};
  var payload = {
    app_id: appId,
    include_aliases: { external_id: externalIds },
    target_channel: 'push',
    headings: { en: cleanText_(message.heading) },
    contents: { en: cleanText_(message.content) },
    url: cleanText_(message.url)
  };

  try {
    var response = UrlFetchApp.fetch(CONFIG.ONESIGNAL_NOTIFICATIONS_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Key ' + restApiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var responseCode = response.getResponseCode();
    if (responseCode < 200 || responseCode >= 300) {
      return {
        attempted: true,
        accepted: false,
        delivered: 0,
        messageId: '',
        error: 'OneSignal 推播失敗（HTTP ' + responseCode + '）。'
      };
    }
    var body = {};
    try {
      body = JSON.parse(response.getContentText() || '{}');
    } catch (ignore) {}
    return {
      attempted: true,
      accepted: true,
      delivered: body.recipients == null ? null : (Number(body.recipients) || 0),
      messageId: cleanText_(body.id),
      error: ''
    };
  } catch (error) {
    return {
      attempted: true,
      accepted: false,
      delivered: 0,
      messageId: '',
      error: 'OneSignal 推播失敗：' + getErrorMessage_(error)
    };
  }
}

function normalizeNotificationRecipients_(teacherNames) {
  var seen = {};
  return (Array.isArray(teacherNames) ? teacherNames : []).map(cleanText_).filter(function(name) {
    if (!name || seen[name]) return false;
    seen[name] = true;
    return true;
  });
}

function inferInboxNotificationType_(messageValue) {
  var message = messageValue || {};
  var explicitType = cleanText_(message.type);
  if (explicitType) return explicitType;
  var url = cleanText_(message.url);
  if (/[?&]view=claim(?:&|$)/.test(url)) return '代課邀請';
  if (/[?&]view=mysubs(?:&|$)/.test(url)) return '代課紀錄';
  if (/[?&]view=practice(?:&|$)/.test(url)) return '自主練習';
  if (/[?&]view=payroll(?:&|$)/.test(url)) return '薪資';
  if (/[?&]view=admin(?:&|$)/.test(url)) return '管理提醒';
  return '系統通知';
}

function ensureNotificationInboxStructureUnlocked_(spreadsheet) {
  return {
    messages: ensureSupportingSheet_(
      spreadsheet,
      SHEETS.NOTIFICATION_MESSAGES,
      SHEET_HEADERS.NOTIFICATION_MESSAGES
    ),
    recipients: ensureSupportingSheet_(
      spreadsheet,
      SHEETS.NOTIFICATION_RECIPIENTS,
      SHEET_HEADERS.NOTIFICATION_RECIPIENTS
    )
  };
}

function persistInboxNotification_(teacherNames, messageValue) {
  var recipients = normalizeNotificationRecipients_(teacherNames);
  if (!recipients.length) return { saved: false, messageId: '', recipientCount: 0 };
  var message = messageValue || {};
  var heading = cleanText_(message.heading);
  var content = cleanText_(message.content);
  if (!heading || !content) throw new Error('站內訊息缺少標題或內容。');

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ensureNotificationInboxStructureUnlocked_(ss);
    assertHeaders_(sheets.messages, SHEET_HEADERS.NOTIFICATION_MESSAGES);
    assertHeaders_(sheets.recipients, SHEET_HEADERS.NOTIFICATION_RECIPIENTS);
    var messageRows = sheets.messages.getDataRange().getValues();
    var messageHeaders = getHeaderMap_(sheets.messages);
    var recipientRows = sheets.recipients.getDataRange().getValues();
    var recipientHeaders = getHeaderMap_(sheets.recipients);
    var eventKey = cleanText_(message.eventKey) || ('event-' + Utilities.getUuid());
    var messageId = '';
    for (var index = 1; index < messageRows.length; index++) {
      if (cleanText_(messageRows[index][messageHeaders['事件 ID'] - 1]) !== eventKey) continue;
      messageId = cleanText_(messageRows[index][messageHeaders['訊息 ID'] - 1]);
      break;
    }
    var createdAt = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    var newMessageRow = null;
    if (!messageId) {
      messageId = Utilities.getUuid();
      newMessageRow = [
        messageId,
        eventKey,
        inferInboxNotificationType_(message),
        heading,
        content,
        cleanText_(message.url),
        cleanText_(message.relatedId),
        createdAt,
        cleanText_(message.actor) || '系統'
      ];
    }

    var existingRecipients = {};
    for (var recipientIndex = 1; recipientIndex < recipientRows.length; recipientIndex++) {
      if (cleanText_(recipientRows[recipientIndex][recipientHeaders['訊息 ID'] - 1]) !== messageId) continue;
      existingRecipients[cleanText_(recipientRows[recipientIndex][recipientHeaders['收件人'] - 1])] = true;
    }
    var newRecipientRows = recipients.filter(function(name) {
      return !existingRecipients[name];
    }).map(function(name) {
      return [Utilities.getUuid(), messageId, name, '未讀', '', createdAt];
    });

    return runStateTransitionUnlocked_([sheets.messages, sheets.recipients], function(appendAudits) {
      if (newMessageRow) {
        sheets.messages.getRange(
          sheets.messages.getLastRow() + 1,
          1,
          1,
          SHEET_HEADERS.NOTIFICATION_MESSAGES.length
        ).setValues([newMessageRow]);
      }
      if (newRecipientRows.length) {
        sheets.recipients.getRange(
          sheets.recipients.getLastRow() + 1,
          1,
          newRecipientRows.length,
          SHEET_HEADERS.NOTIFICATION_RECIPIENTS.length
        ).setValues(newRecipientRows);
      }
      appendAudits([]);
      return {
        saved: true,
        messageId: messageId,
        recipientCount: recipients.length,
        appendedRecipients: newRecipientRows.length,
        duplicate: !newMessageRow && !newRecipientRows.length
      };
    });
  });
}

function persistInboxNotificationSafely_(teacherNames, messageValue) {
  if (typeof SpreadsheetApp === 'undefined') {
    return { saved: false, messageId: '', recipientCount: 0, error: '' };
  }
  try {
    return persistInboxNotification_(teacherNames, messageValue);
  } catch (error) {
    console.warn('站內訊息保存失敗，仍繼續嘗試推播。', error);
    return { saved: false, messageId: '', recipientCount: 0, error: getErrorMessage_(error) };
  }
}

function getNotificationInbox_(session) {
  var teacherName = getSessionTeacherName_(session);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ensureNotificationInboxStructureUnlocked_(ss);
  assertHeaders_(sheets.messages, SHEET_HEADERS.NOTIFICATION_MESSAGES);
  assertHeaders_(sheets.recipients, SHEET_HEADERS.NOTIFICATION_RECIPIENTS);
  var messageRows = sheets.messages.getDataRange().getValues();
  var recipientRows = sheets.recipients.getDataRange().getValues();
  var messageHeaders = getHeaderMap_(sheets.messages);
  var recipientHeaders = getHeaderMap_(sheets.recipients);
  var messagesById = {};
  messageRows.slice(1).forEach(function(row) {
    var messageId = cleanText_(row[messageHeaders['訊息 ID'] - 1]);
    if (messageId) messagesById[messageId] = row;
  });
  var cutoff = Utilities.formatDate(
    new Date(currentTimeMs_() - 90 * 24 * 60 * 60 * 1000),
    getTimeZone_(),
    'yyyy-MM-dd HH:mm:ss'
  );
  var unreadCount = 0;
  var items = [];
  recipientRows.slice(1).forEach(function(recipientRow) {
    if (cleanText_(recipientRow[recipientHeaders['收件人'] - 1]) !== teacherName) return;
    var status = cleanText_(recipientRow[recipientHeaders['狀態'] - 1]) || '未讀';
    if (status !== '已讀') unreadCount += 1;
    var messageId = cleanText_(recipientRow[recipientHeaders['訊息 ID'] - 1]);
    var messageRow = messagesById[messageId];
    if (!messageRow) return;
    var createdAt = cleanText_(messageRow[messageHeaders['建立時間'] - 1]);
    if (status === '已讀' && createdAt && createdAt < cutoff) return;
    items.push({
      messageId: messageId,
      type: cleanText_(messageRow[messageHeaders['類型'] - 1]) || '系統通知',
      heading: cleanText_(messageRow[messageHeaders['標題'] - 1]),
      content: cleanText_(messageRow[messageHeaders['內容'] - 1]),
      url: cleanText_(messageRow[messageHeaders['連結'] - 1]),
      relatedId: cleanText_(messageRow[messageHeaders['關聯編號'] - 1]),
      createdAt: createdAt,
      readAt: cleanText_(recipientRow[recipientHeaders['已讀時間'] - 1]),
      unread: status !== '已讀'
    });
  });
  items.sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
  return { teacherName: teacherName, unreadCount: unreadCount, items: items.slice(0, 200) };
}

function markNotificationRead_(session, messageIdValue) {
  var teacherName = getSessionTeacherName_(session);
  var messageId = cleanText_(messageIdValue);
  if (!messageId) throw new Error('缺少訊息編號。');
  return withScriptLock_(function() {
    var sheets = ensureNotificationInboxStructureUnlocked_(SpreadsheetApp.getActiveSpreadsheet());
    var rows = sheets.recipients.getDataRange().getValues();
    var headers = getHeaderMap_(sheets.recipients);
    var rowNumber = 0;
    for (var index = 1; index < rows.length; index++) {
      if (cleanText_(rows[index][headers['訊息 ID'] - 1]) !== messageId) continue;
      if (cleanText_(rows[index][headers['收件人'] - 1]) !== teacherName) continue;
      rowNumber = index + 1;
      break;
    }
    if (!rowNumber) throw new Error('找不到這則訊息。');
    var readAt = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    sheets.recipients.getRange(rowNumber, headers['狀態'], 1, 2).setValues([['已讀', readAt]]);
    return { messageId: messageId, status: '已讀', readAt: readAt };
  });
}

function markAllNotificationsRead_(session) {
  var teacherName = getSessionTeacherName_(session);
  return withScriptLock_(function() {
    var sheets = ensureNotificationInboxStructureUnlocked_(SpreadsheetApp.getActiveSpreadsheet());
    var rows = sheets.recipients.getDataRange().getValues();
    var headers = getHeaderMap_(sheets.recipients);
    var readAt = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    var targets = [];
    for (var index = 1; index < rows.length; index++) {
      if (cleanText_(rows[index][headers['收件人'] - 1]) !== teacherName) continue;
      if (cleanText_(rows[index][headers['狀態'] - 1]) === '已讀') continue;
      targets.push(index + 1);
    }
    return runStateTransitionUnlocked_([sheets.recipients], function(appendAudits) {
      targets.forEach(function(rowNumber) {
        sheets.recipients.getRange(rowNumber, headers['狀態'], 1, 2).setValues([['已讀', readAt]]);
      });
      appendAudits([]);
      return { updated: targets.length, status: '已讀', readAt: readAt };
    });
  });
}

function isNotificationScheduleDue_(scheduleValue, dateKeyValue, timeValue) {
  var schedule = scheduleValue || {};
  if (schedule.enabled === false) return false;
  var dateKey = cleanText_(dateKeyValue);
  var parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return false;
  var scheduleDay = cleanText_(schedule.day);
  var nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
  var isLastDay = nextDay.getMonth() !== parts[1] - 1;
  if (scheduleDay === 'last') {
    if (!isLastDay) return false;
  } else if (Number(scheduleDay) !== parts[2]) {
    return false;
  }
  var scheduledTime = cleanText_(schedule.time);
  var currentTime = cleanText_(timeValue);
  if (!/^\d{2}:\d{2}$/.test(scheduledTime) || !/^\d{2}:\d{2}$/.test(currentTime)) return false;
  var scheduledMinutes = Number(scheduledTime.slice(0, 2)) * 60 + Number(scheduledTime.slice(3));
  var currentMinutes = Number(currentTime.slice(0, 2)) * 60 + Number(currentTime.slice(3));
  return currentMinutes >= scheduledMinutes && currentMinutes <= scheduledMinutes + 4;
}

function getActiveAccountTeacherNames_() {
  var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.ACCOUNTS);
  assertHeaders_(sheet, SHEET_HEADERS.ACCOUNTS);
  var values = sheet.getDataRange().getValues();
  var headers = getHeaderMap_(sheet);
  var seen = {};
  var names = [];
  for (var index = 1; index < values.length; index++) {
    var row = values[index];
    var name = cleanText_(row[headers['指導者'] - 1]);
    if (!name || seen[name] || !isAccountActive_(row[headers['是否在職'] - 1])) continue;
    seen[name] = true;
    names.push(name);
  }
  return names;
}

function getNotificationSchedules_() {
  var properties = getScriptProperties_();
  var raw = properties ? properties.getProperty(CONFIG.NOTIFICATION_SCHEDULES_PROPERTY) : '';
  if (!raw) return [];
  try {
    var schedules = JSON.parse(raw);
    return Array.isArray(schedules) ? schedules : [];
  } catch (error) {
    console.warn('通知排程設定無法解析，已改用空清單。', error);
    return [];
  }
}

function saveNotificationSchedules_(schedules) {
  var properties = getScriptProperties_();
  if (!properties) throw new Error('目前無法儲存通知排程。');
  properties.setProperty(CONFIG.NOTIFICATION_SCHEDULES_PROPERTY, JSON.stringify(schedules || []));
}

function normalizeNotificationAudienceMode_(modeValue) {
  var mode = cleanText_(modeValue) || 'selected';
  if (['selected', 'admins', 'all'].indexOf(mode) === -1) {
    throw new Error('通知收件人設定不正確。');
  }
  return mode;
}

function resolveNotificationAudience_(modeValue, teacherNamesValue) {
  var mode = normalizeNotificationAudienceMode_(modeValue);
  var activeNames = getActiveAccountTeacherNames_();
  var activeMap = {};
  activeNames.forEach(function(name) { activeMap[name] = true; });
  var names;
  if (mode === 'admins') {
    names = getActiveCourseAdminNames_();
  } else if (mode === 'all') {
    names = activeNames;
  } else {
    var requested = Array.isArray(teacherNamesValue) ? teacherNamesValue : [];
    var seen = {};
    names = requested.map(cleanText_).filter(function(name) {
      if (!name || !activeMap[name] || seen[name]) return false;
      seen[name] = true;
      return true;
    });
  }
  if (!names.length) throw new Error('請至少選擇一位目前在職的通知收件人。');
  return names;
}

function validateNotificationCopy_(headingValue, contentValue) {
  var heading = cleanText_(headingValue);
  var content = cleanText_(contentValue);
  if (!heading) throw new Error('請填寫通知標題。');
  if (!content) throw new Error('請填寫通知內容。');
  if (heading.length > 80) throw new Error('通知標題最多 80 個字。');
  if (content.length > 500) throw new Error('通知內容最多 500 個字。');
  return { heading: heading, content: content };
}

function normalizeNotificationSchedule_(scheduleValue, actorName, existingValue) {
  var input = scheduleValue || {};
  var copy = validateNotificationCopy_(input.heading, input.content);
  var name = cleanText_(input.name);
  if (!name) throw new Error('請填寫排程名稱。');
  var day = cleanText_(input.day);
  if (day !== 'last' && (!/^\d{1,2}$/.test(day) || Number(day) < 1 || Number(day) > 31)) {
    throw new Error('每月日期請填 1–31，或選擇月底。');
  }
  var time = cleanText_(input.time);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('通知時間格式不正確。');
  var audienceMode = normalizeNotificationAudienceMode_(input.audienceMode);
  var selectedNames = audienceMode === 'selected'
    ? resolveNotificationAudience_(audienceMode, input.teacherNames)
    : [];
  var existing = existingValue || {};
  return {
    id: cleanText_(existing.id) || cleanText_(input.id) || Utilities.getUuid(),
    name: name,
    day: day,
    time: time,
    heading: copy.heading,
    content: copy.content,
    audienceMode: audienceMode,
    teacherNames: selectedNames,
    enabled: input.enabled == null ? existing.enabled !== false : input.enabled !== false,
    createdAt: cleanText_(existing.createdAt) || Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss'),
    updatedBy: cleanText_(actorName)
  };
}

function appendNotificationAuditSafely_(event) {
  try {
    appendAudit_(event);
  } catch (error) {
    console.warn('推播已處理，但通知紀錄寫入失敗。', error);
  }
}

function sendManagedNotification_(actorName, sourceLabel, sourceId, audienceMode, teacherNames, heading, content, eventKeyValue) {
  var copy = validateNotificationCopy_(heading, content);
  var recipients = resolveNotificationAudience_(audienceMode, teacherNames);
  var result = sendPushAfterMutationSafely_(recipients, {
    eventKey: cleanText_(eventKeyValue),
    type: cleanText_(sourceLabel) || '系統通知',
    heading: copy.heading,
    content: copy.content,
    url: buildAppViewUrl_('', ''),
    relatedId: cleanText_(sourceId),
    actor: cleanText_(actorName)
  });
  var accepted = Boolean(result && result.accepted === true && !result.error);
  appendNotificationAuditSafely_({
    actor: cleanText_(actorName),
    action: '推播通知：' + cleanText_(sourceLabel),
    targetId: cleanText_(sourceId),
    before: recipients.join('、'),
    after: accepted ? '已送出' : '失敗',
    reason: JSON.stringify({
      heading: copy.heading,
      recipients: recipients.length,
      messageId: cleanText_(result && result.messageId),
      error: cleanText_(result && result.error)
    })
  });
  return {
    attempted: Boolean(result && result.attempted),
    accepted: accepted,
    delivered: result ? result.delivered : 0,
    messageId: cleanText_(result && result.messageId),
    error: cleanText_(result && result.error),
    recipientCount: recipients.length,
    recipientNames: recipients
  };
}

function sendManualNotification_(session, requestValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var request = requestValue || {};
  return sendManagedNotification_(
    actor,
    '手動',
    Utilities.getUuid(),
    request.audienceMode,
    request.teacherNames,
    request.heading,
    request.content
  );
}

function saveNotificationSchedule_(session, requestValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var request = requestValue || {};
  var schedules = getNotificationSchedules_();
  var requestId = cleanText_(request.id);
  var existingIndex = -1;
  schedules.some(function(schedule, index) {
    if (cleanText_(schedule.id) !== requestId || !requestId) return false;
    existingIndex = index;
    return true;
  });
  var normalized = normalizeNotificationSchedule_(
    request,
    actor,
    existingIndex >= 0 ? schedules[existingIndex] : null
  );
  if (existingIndex >= 0) schedules[existingIndex] = normalized;
  else schedules.push(normalized);
  saveNotificationSchedules_(schedules);
  return normalized;
}

function setNotificationScheduleEnabled_(session, scheduleIdValue, enabledValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var scheduleId = cleanText_(scheduleIdValue);
  var schedules = getNotificationSchedules_();
  var found = null;
  schedules.forEach(function(schedule) {
    if (cleanText_(schedule.id) !== scheduleId) return;
    schedule.enabled = enabledValue === true;
    schedule.updatedAt = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    schedule.updatedBy = actor;
    found = schedule;
  });
  if (!found) throw new Error('找不到這筆通知排程。');
  saveNotificationSchedules_(schedules);
  return found;
}

function sendNotificationScheduleNow_(session, scheduleIdValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var scheduleId = cleanText_(scheduleIdValue);
  var schedule = getNotificationSchedules_().filter(function(item) {
    return cleanText_(item.id) === scheduleId;
  })[0];
  if (!schedule) throw new Error('找不到這筆通知排程。');
  return sendManagedNotification_(
    actor,
    '排程手動送出',
    schedule.id,
    schedule.audienceMode,
    schedule.teacherNames,
    schedule.heading,
    schedule.content
  );
}

function getNotificationHistory_() {
  var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.AUDIT);
  assertHeaders_(sheet, SHEET_HEADERS.AUDIT);
  var values = sheet.getDataRange().getValues();
  var headers = getHeaderMap_(sheet);
  return values.slice(1).filter(function(row) {
    return cleanText_(row[headers['操作類型'] - 1]).indexOf('推播通知：') === 0;
  }).slice(-50).reverse().map(function(row) {
    return {
      sentAt: cleanText_(row[headers['操作時間'] - 1]),
      actor: cleanText_(row[headers['操作者'] - 1]),
      type: cleanText_(row[headers['操作類型'] - 1]).replace(/^推播通知：/, ''),
      targetId: cleanText_(row[headers['目標編號'] - 1]),
      recipients: cleanText_(row[headers['舊狀態'] - 1]),
      status: cleanText_(row[headers['新狀態'] - 1]),
      detail: cleanText_(row[headers['原因'] - 1])
    };
  });
}

function getNotificationAdminDashboard_(session) {
  assertCapabilitySession_(session, 'course_admin');
  return {
    teachers: getActiveAccountTeacherNames_(),
    administrators: getActiveCourseAdminNames_(),
    schedules: getNotificationSchedules_(),
    history: getNotificationHistory_(),
    closureWindows: [
      { stage: '第一輪', time: '22:30–22:34' },
      { stage: '第二輪', time: '23:40–23:44' }
    ]
  };
}

function runScheduledNotifications_(dateKeyValue, timeValue) {
  var dateKey = cleanText_(dateKeyValue);
  var time = cleanText_(timeValue);
  var properties = getScriptProperties_();
  var sentCount = 0;
  var failedCount = 0;
  var results = [];
  getNotificationSchedules_().forEach(function(schedule) {
    if (!isNotificationScheduleDue_(schedule, dateKey, time)) return;
    var eventKey = 'schedule_' + cleanText_(schedule.id).replace(/[^A-Za-z0-9_-]/g, '_') + '_' + dateKey.replace(/\D/g, '');
    var propertyKey = CONFIG.PUSH_SENT_KEY_PREFIX + eventKey;
    if (properties && properties.getProperty(propertyKey)) return;
    var result = sendManagedNotification_(
      '系統通知排程',
      '排程',
      schedule.id,
      schedule.audienceMode,
      schedule.teacherNames,
      schedule.heading,
      schedule.content,
      eventKey
    );
    results.push({ scheduleId: schedule.id, result: result });
    if (result.accepted) {
      sentCount += 1;
      if (properties) properties.setProperty(propertyKey, dateKey + ' ' + time);
    } else {
      failedCount += 1;
    }
  });
  return { sentCount: sentCount, failedCount: failedCount, items: results };
}

function buildAppViewUrl_(view, adminTab) {
  var query = [];
  if (cleanText_(view)) query.push('view=' + encodeURIComponent(cleanText_(view)));
  if (cleanText_(adminTab)) query.push('tab=' + encodeURIComponent(cleanText_(adminTab)));
  return CONFIG.PUBLIC_APP_URL + (query.length ? '?' + query.join('&') : '');
}

function sendPushAfterMutationSafely_(teacherNames, message) {
  var recipients = normalizeNotificationRecipients_(teacherNames);
  var inboxResult = persistInboxNotificationSafely_(recipients, message);
  try {
    var pushResult = sendPushNotificationSafely_(recipients, message) || {};
    pushResult.inboxSaved = inboxResult.saved === true;
    pushResult.inboxMessageId = cleanText_(inboxResult.messageId);
    pushResult.inboxError = cleanText_(inboxResult.error);
    return pushResult;
  } catch (error) {
    console.warn('操作已完成，但推播通知失敗。', error);
    return {
      attempted: true,
      accepted: false,
      delivered: 0,
      error: getErrorMessage_(error),
      inboxSaved: inboxResult.saved === true,
      inboxMessageId: cleanText_(inboxResult.messageId),
      inboxError: cleanText_(inboxResult.error)
    };
  }
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
    ensureCourseClosureStructureUnlocked_(ss);
    ensureSupportingSheet_(
      ss,
      SHEETS.COURSE_ADJUSTMENTS,
      SHEET_HEADERS.COURSE_ADJUSTMENTS
    );
    ensureSupportingSheet_(
      ss,
      SHEETS.SPECIAL_COURSE_REQUESTS,
      SHEET_HEADERS.SPECIAL_COURSE_REQUESTS
    );
    ensureVvipStructureUnlocked_(ss);
    ensurePayrollStructureUnlocked_(ss);
    ensurePracticeStructureUnlocked_(ss);
    ensureNotificationInboxStructureUnlocked_(ss);
    ensureMonthlyDiscountStructureUnlocked_(ss);
    var accountSheet = ensureSupportingSheet_(ss, SHEETS.ACCOUNTS, SHEET_HEADERS.ACCOUNTS);
    protectAccountsSheet_(accountSheet);

    return {
      leaveSheetName: SHEETS.LEAVES,
      migration: migrateLegacyLeaveLinksUnlocked_(leaveSheet, courseSheet)
    };
  });
}

function ensurePracticeStructure_() {
  return withScriptLock_(function() {
    return ensurePracticeStructureUnlocked_(SpreadsheetApp.getActiveSpreadsheet());
  });
}

function ensurePracticeStructureUnlocked_(spreadsheet) {
  var result = {};
  [
    ['series', SHEETS.PRACTICE_SERIES, SHEET_HEADERS.PRACTICE_SERIES],
    ['bookings', SHEETS.PRACTICE_BOOKINGS, SHEET_HEADERS.PRACTICE_BOOKINGS],
    ['participants', SHEETS.PRACTICE_PARTICIPANTS, SHEET_HEADERS.PRACTICE_PARTICIPANTS],
    ['exceptions', SHEETS.PRACTICE_EXCEPTIONS, SHEET_HEADERS.PRACTICE_EXCEPTIONS],
    ['audit', SHEETS.PRACTICE_AUDIT, SHEET_HEADERS.PRACTICE_AUDIT]
  ].forEach(function(definition) {
    result[definition[0]] = ensureSupportingSheet_(
      spreadsheet,
      definition[1],
      definition[2]
    ).getName();
  });
  return result;
}

function buildPracticeDayView_(recordsValue, courseRowsValue, dateValue) {
  var records = recordsValue || {};
  var date = cleanText_(dateValue).replace(/-/g, '/');
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(date)) throw new Error('自主練習日期格式不正確。');
  parsePracticeDateTime_(date, '00:00');

  var roomsByName = {};
  ['A', 'B', 'C', 'D'].forEach(function(room) {
    roomsByName[room] = { room: room, blocks: [] };
  });

  (courseRowsValue || []).forEach(function(row) {
    var courseDate = formatMyDate(row && row[0]);
    var startTime = formatMyTime(row && row[1]);
    var courseName = cleanText_(row && row[2]);
    var room = getCourseRoom_(courseName);
    var calendarId = cleanText_(row && row[4]);
    if (courseDate !== date || !roomsByName[room] || !startTime || !calendarId) return;
    var startMinutes = timeTextToMinutes_(startTime);
    if (startMinutes < 0) return;
    var endTime = minutesToTimeText_(startMinutes + getScheduledCourseDurationMinutes_(courseName));
    var type = courseName.indexOf('場地租借') !== -1 ? 'rental' : 'course';
    roomsByName[room].blocks.push({
      id: 'ob:' + calendarId,
      type: type,
      calendarId: calendarId,
      date: date,
      room: room,
      startTime: startTime,
      endTime: endTime,
      label: courseName,
      teacherName: cleanText_(row && row[3]),
      interval: normalizePracticeInterval_(date, startTime, endTime)
    });
  });

  var participantsByBooking = {};
  (records.participants || []).forEach(function(participant) {
    var bookingId = cleanText_(participant && participant.bookingId);
    var status = cleanText_(participant && participant.status);
    if (!bookingId || ['已退出', '已取消'].indexOf(status) !== -1) return;
    if (!participantsByBooking[bookingId]) participantsByBooking[bookingId] = [];
    participantsByBooking[bookingId].push({
      participantId: cleanText_(participant.participantId),
      teacherName: cleanText_(participant.teacherName),
      role: cleanText_(participant.role),
      startTime: cleanText_(participant.startTime),
      endTime: cleanText_(participant.endTime),
      status: status || '有效'
    });
  });

  (records.bookings || []).forEach(function(booking) {
    var bookingDate = cleanText_(booking && booking.date).replace(/-/g, '/');
    var room = cleanText_(booking && booking.room).toUpperCase();
    var status = cleanText_(booking && booking.status);
    if (bookingDate !== date || !roomsByName[room] ||
        [PRACTICE_STATUS.CANCELLED, PRACTICE_STATUS.CONFLICT_CANCELLED].indexOf(status) !== -1) return;
    var startTime = cleanText_(booking.startTime);
    var endTime = cleanText_(booking.endTime);
    var bookingId = cleanText_(booking.bookingId);
    roomsByName[room].blocks.push({
      id: 'practice:' + bookingId,
      type: status === PRACTICE_STATUS.WAITLISTED ? 'waitlist' : 'practice',
      bookingId: bookingId,
      seriesId: cleanText_(booking.seriesId),
      date: date,
      room: room,
      startTime: startTime,
      endTime: endTime,
      status: status,
      creatorName: cleanText_(booking.creatorName),
      waitlistCalendarId: cleanText_(booking.waitlistCalendarId),
      reason: cleanText_(booking.reason),
      participants: (participantsByBooking[bookingId] || []).sort(function(left, right) {
        if (left.role !== right.role) return left.role === PRACTICE_ROLE.CREATOR ? -1 : 1;
        return [left.startTime, left.teacherName].join('|')
          .localeCompare([right.startTime, right.teacherName].join('|'));
      }),
      interval: normalizePracticeInterval_(date, startTime, endTime)
    });
  });

  return {
    date: date,
    rooms: ['A', 'B', 'C', 'D'].map(function(room) {
      roomsByName[room].blocks.sort(function(left, right) {
        return [left.startTime, left.endTime, left.type, left.id].join('|')
          .localeCompare([right.startTime, right.endTime, right.type, right.id].join('|'));
      });
      return roomsByName[room];
    })
  };
}

function getPracticeDay_(session, dateValue) {
  var teacherName = getSessionTeacherName_(session);
  var date = cleanText_(dateValue).replace(/-/g, '/');
  parsePracticeDateTime_(date, '00:00');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensurePracticeStructureUnlocked_(ss);
  var records = getPracticeRecordsUnlocked_(ss);
  var courseSheet = requireSheet_(ss, SHEETS.COURSE_LIST);
  assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
  var courseRows = courseSheet.getDataRange().getValues().slice(1);
  var courseSource = 'snapshot';
  var courseWarning = '';
  try {
    courseRows = getPracticeCurrentObRows_(date, date);
    courseSource = 'live';
  } catch (error) {
    courseWarning = 'OB 即時課表讀取失敗，暫以最後同步課表顯示。';
    console.warn(courseWarning, error);
  }
  var view = buildPracticeDayView_(records, courseRows, date);
  view.teacherName = teacherName;
  view.actingBy = cleanText_(session && session.impersonatedBy);
  view.quickDurations = [60, 90, 120];
  view.courseSource = courseSource;
  view.courseWarning = courseWarning;
  view.rooms.forEach(function(room) {
    room.blocks.forEach(function(block) {
      if (block.type !== 'practice' && block.type !== 'waitlist') return;
      block.isMine = block.participants.some(function(participant) {
        return participant.teacherName === teacherName &&
          participant.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
      });
      block.isCreator = block.creatorName === teacherName;
    });
  });
  return view;
}

function getMyPracticeBookings_(session, monthValue) {
  var teacherName = getSessionTeacherName_(session);
  var month = cleanText_(monthValue) || Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('自主練習月份格式應為 YYYY-MM。');
  var monthPrefix = month.replace('-', '/') + '/';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensurePracticeStructureUnlocked_(ss);
  var records = getPracticeRecordsUnlocked_(ss);
  var bookingById = {};
  records.bookings.forEach(function(booking) {
    bookingById[booking.bookingId] = booking;
  });
  var items = records.participants.filter(function(participant) {
    var booking = bookingById[participant.bookingId];
    return participant.teacherName === teacherName && booking && booking.date.indexOf(monthPrefix) === 0;
  }).map(function(participant) {
    var booking = bookingById[participant.bookingId];
    var participantStatus = cleanText_(participant.status) || PRACTICE_PARTICIPANT_STATUS.ACTIVE;
    var status = cleanText_(booking.status);
    if (participantStatus === PRACTICE_PARTICIPANT_STATUS.LEFT) status = '已退出';
    else if (participantStatus === PRACTICE_PARTICIPANT_STATUS.CANCELLED) status = PRACTICE_STATUS.CANCELLED;
    return {
      bookingId: booking.bookingId,
      seriesId: booking.seriesId,
      date: booking.date,
      room: booking.room,
      startTime: participant.startTime || booking.startTime,
      endTime: participant.endTime || booking.endTime,
      status: status,
      bookingStatus: booking.status,
      participantStatus: participantStatus,
      role: participant.role,
      creatorName: booking.creatorName,
      waitlistCalendarId: booking.waitlistCalendarId
    };
  }).sort(function(left, right) {
    return [right.date, right.startTime, right.bookingId].join('|')
      .localeCompare([left.date, left.startTime, left.bookingId].join('|'));
  });
  return { month: month, teacherName: teacherName, items: items };
}

function parsePracticeAuditJson_(value) {
  var text = cleanText_(value);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function getPracticeAdminDashboard_(session, filtersValue) {
  assertCapabilitySession_(session, 'course_admin');
  var filters = filtersValue || {};
  var dateFrom = cleanText_(filters.dateFrom).replace(/-/g, '/');
  var dateTo = cleanText_(filters.dateTo).replace(/-/g, '/');
  if (dateFrom) parsePracticeDateTime_(dateFrom, '00:00');
  if (dateTo) parsePracticeDateTime_(dateTo, '00:00');
  if (dateFrom && dateTo && dateFrom > dateTo) throw new Error('結束日期不可早於開始日期。');
  var roomFilter = cleanText_(filters.room).toUpperCase();
  if (roomFilter) requirePracticeRoom_(roomFilter);
  var statusFilter = cleanText_(filters.status);
  var teacherFilter = cleanText_(filters.teacherName);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensurePracticeStructureUnlocked_(ss);
  var records = getPracticeRecordsUnlocked_(ss);
  var auditSheet = requireSheet_(ss, SHEETS.PRACTICE_AUDIT);
  assertHeaders_(auditSheet, SHEET_HEADERS.PRACTICE_AUDIT);
  var audits = auditSheet.getDataRange().getValues().slice(1).map(function(row) {
    return {
      time: cleanText_(row[0]),
      actor: cleanText_(row[1]),
      action: cleanText_(row[2]),
      targetType: cleanText_(row[3]),
      targetId: cleanText_(row[4]),
      before: parsePracticeAuditJson_(row[5]),
      after: parsePracticeAuditJson_(row[6]),
      reason: cleanText_(row[7])
    };
  });
  var participantsByBooking = {};
  records.participants.forEach(function(participant) {
    if (!participantsByBooking[participant.bookingId]) participantsByBooking[participant.bookingId] = [];
    participantsByBooking[participant.bookingId].push({
      participantId: participant.participantId,
      teacherName: participant.teacherName,
      role: participant.role,
      startTime: participant.startTime,
      endTime: participant.endTime,
      joinScope: participant.joinScope,
      status: participant.status,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt
    });
  });
  var auditsByBooking = {};
  audits.forEach(function(item) {
    if (!auditsByBooking[item.targetId]) auditsByBooking[item.targetId] = [];
    auditsByBooking[item.targetId].push(item);
  });
  var bookings = records.bookings.filter(function(booking) {
    if (dateFrom && booking.date < dateFrom) return false;
    if (dateTo && booking.date > dateTo) return false;
    if (roomFilter && booking.room !== roomFilter) return false;
    if (statusFilter && booking.status !== statusFilter) return false;
    if (teacherFilter) {
      var hasTeacher = (participantsByBooking[booking.bookingId] || []).some(function(participant) {
        return participant.teacherName === teacherFilter;
      });
      if (!hasTeacher) return false;
    }
    return true;
  }).map(function(booking) {
    return {
      bookingId: booking.bookingId,
      seriesId: booking.seriesId,
      date: booking.date,
      room: booking.room,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      creatorName: booking.creatorName,
      waitlistCalendarId: booking.waitlistCalendarId,
      reason: booking.reason,
      participants: (participantsByBooking[booking.bookingId] || []).sort(function(left, right) {
        return [left.status, left.startTime, left.teacherName].join('|')
          .localeCompare([right.status, right.startTime, right.teacherName].join('|'));
      }),
      audits: (auditsByBooking[booking.bookingId] || []).slice().reverse()
    };
  }).sort(function(left, right) {
    return [left.date, left.startTime, left.room, left.bookingId].join('|')
      .localeCompare([right.date, right.startTime, right.room, right.bookingId].join('|'));
  });
  return {
    bookings: bookings,
    notificationFailures: audits.filter(function(item) { return item.action === '推播失敗'; }).reverse(),
    summary: {
      total: bookings.length,
      active: bookings.filter(function(item) { return item.status === PRACTICE_STATUS.ACTIVE; }).length,
      waitlisted: bookings.filter(function(item) { return item.status === PRACTICE_STATUS.WAITLISTED; }).length,
      cancelled: bookings.filter(function(item) {
        return [PRACTICE_STATUS.CANCELLED, PRACTICE_STATUS.CONFLICT_CANCELLED].indexOf(item.status) !== -1;
      }).length
    }
  };
}

function getPracticeRecordsUnlocked_(spreadsheet) {
  var seriesSheet = requireSheet_(spreadsheet, SHEETS.PRACTICE_SERIES);
  var bookingSheet = requireSheet_(spreadsheet, SHEETS.PRACTICE_BOOKINGS);
  var participantSheet = requireSheet_(spreadsheet, SHEETS.PRACTICE_PARTICIPANTS);
  var exceptionSheet = requireSheet_(spreadsheet, SHEETS.PRACTICE_EXCEPTIONS);
  assertHeaders_(seriesSheet, SHEET_HEADERS.PRACTICE_SERIES);
  assertHeaders_(bookingSheet, SHEET_HEADERS.PRACTICE_BOOKINGS);
  assertHeaders_(participantSheet, SHEET_HEADERS.PRACTICE_PARTICIPANTS);
  assertHeaders_(exceptionSheet, SHEET_HEADERS.PRACTICE_EXCEPTIONS);

  return {
    sheets: {
      series: seriesSheet,
      bookings: bookingSheet,
      participants: participantSheet,
      exceptions: exceptionSheet,
      audit: requireSheet_(spreadsheet, SHEETS.PRACTICE_AUDIT)
    },
    series: seriesSheet.getDataRange().getValues().slice(1).map(function(row, index) {
      return {
        rowNumber: index + 2,
        seriesId: cleanText_(row[0]),
        creatorName: cleanText_(row[1]),
        room: cleanText_(row[2]),
        weekday: Number(row[3]),
        startTime: formatMyTime(row[4]),
        endTime: formatMyTime(row[5]),
        startDate: formatMyDate(row[6]),
        stopDate: formatMyDate(row[7]),
        status: cleanText_(row[8]),
        createdAt: cleanText_(row[9]),
        updatedAt: cleanText_(row[10]),
        updatedBy: cleanText_(row[11])
      };
    }).filter(function(item) { return item.seriesId; }),
    bookings: bookingSheet.getDataRange().getValues().slice(1).map(function(row, index) {
      return {
        rowNumber: index + 2,
        bookingId: cleanText_(row[0]),
        seriesId: cleanText_(row[1]),
        date: formatMyDate(row[2]),
        room: cleanText_(row[3]),
        startTime: formatMyTime(row[4]),
        endTime: formatMyTime(row[5]),
        status: cleanText_(row[6]),
        creatorName: cleanText_(row[7]),
        waitlistCalendarId: cleanText_(row[8]),
        reason: cleanText_(row[9]),
        createdAt: cleanText_(row[10]),
        updatedAt: cleanText_(row[11]),
        updatedBy: cleanText_(row[12])
      };
    }).filter(function(item) { return item.bookingId; }),
    participants: participantSheet.getDataRange().getValues().slice(1).map(function(row, index) {
      return {
        rowNumber: index + 2,
        participantId: cleanText_(row[0]),
        bookingId: cleanText_(row[1]),
        seriesId: cleanText_(row[2]),
        teacherName: cleanText_(row[3]),
        role: cleanText_(row[4]),
        startTime: formatMyTime(row[5]),
        endTime: formatMyTime(row[6]),
        joinScope: cleanText_(row[7]),
        status: cleanText_(row[8]),
        joinedAt: cleanText_(row[9]),
        leftAt: cleanText_(row[10])
      };
    }).filter(function(item) { return item.participantId; }),
    exceptions: exceptionSheet.getDataRange().getValues().slice(1).map(function(row, index) {
      return {
        rowNumber: index + 2,
        exceptionId: cleanText_(row[0]),
        seriesId: cleanText_(row[1]),
        date: formatMyDate(row[2]),
        type: cleanText_(row[3]),
        reason: cleanText_(row[4]),
        createdAt: cleanText_(row[5]),
        createdBy: cleanText_(row[6])
      };
    }).filter(function(item) { return item.exceptionId; })
  };
}

function appendPracticeRowUnlocked_(sheet, headers, row) {
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([row]);
}

function appendPracticeAuditUnlocked_(sheet, eventValue) {
  var event = eventValue || {};
  appendPracticeRowUnlocked_(sheet, SHEET_HEADERS.PRACTICE_AUDIT, [
    getTimestamp_(),
    cleanText_(event.actor),
    cleanText_(event.action),
    cleanText_(event.targetType),
    cleanText_(event.targetId),
    event.before == null ? '' : JSON.stringify(event.before),
    event.after == null ? '' : JSON.stringify(event.after),
    cleanText_(event.reason)
  ]);
}

function requirePracticeRoom_(value) {
  var room = cleanText_(value).toUpperCase();
  if (['A', 'B', 'C', 'D'].indexOf(room) === -1) throw new Error('請選擇 A、B、C 或 D 教室。');
  return room;
}

function findPracticeConflictsUnlocked_(requestValue, recordsValue, courseRowsValue) {
  var request = requestValue || {};
  var interval = request.interval || normalizePracticeInterval_(
    request.date,
    request.startTime,
    request.endTime
  );
  var room = requirePracticeRoom_(request.room);
  var excludeBookingId = cleanText_(request.excludeBookingId);
  var excludeBookingIds = {};
  (Array.isArray(request.excludeBookingIds) ? request.excludeBookingIds : []).forEach(function(id) {
    var cleanId = cleanText_(id);
    if (cleanId) excludeBookingIds[cleanId] = true;
  });
  if (excludeBookingId) excludeBookingIds[excludeBookingId] = true;
  var excludeCalendarId = cleanText_(request.excludeCalendarId);
  var conflicts = [];

  (courseRowsValue || []).forEach(function(row) {
    var date = formatMyDate(row && row[0]);
    var startTime = formatMyTime(row && row[1]);
    var courseName = cleanText_(row && row[2]);
    var courseRoom = getCourseRoom_(courseName);
    var calendarId = cleanText_(row && row[4]);
    if (date !== interval.date || courseRoom !== room || !startTime ||
        (excludeCalendarId && calendarId === excludeCalendarId)) return;
    var startMinutes = timeTextToMinutes_(startTime);
    if (startMinutes < 0) return;
    var endTime = minutesToTimeText_(startMinutes + getScheduledCourseDurationMinutes_(courseName));
    var blockerInterval = normalizePracticeInterval_(date, startTime, endTime);
    if (!practiceIntervalsConflict_(interval, blockerInterval, 15)) return;
    conflicts.push({
      type: courseName.indexOf('場地租借') !== -1 ? 'rental' : 'course',
      id: calendarId,
      label: courseName,
      interval: blockerInterval
    });
  });

  ((recordsValue && recordsValue.bookings) || []).forEach(function(booking) {
    if (excludeBookingIds[booking.bookingId] || booking.date !== interval.date ||
        booking.room !== room || booking.status !== PRACTICE_STATUS.ACTIVE) return;
    var blockerInterval = normalizePracticeInterval_(
      booking.date,
      booking.startTime,
      booking.endTime
    );
    if (!practiceIntervalsConflict_(interval, blockerInterval, 15)) return;
    conflicts.push({
      type: 'practice',
      id: booking.bookingId,
      label: booking.creatorName + '的自主練習',
      interval: blockerInterval
    });
  });
  return conflicts;
}

function assertPracticeIntervalAvailable_(request, records, courseRows) {
  var conflicts = findPracticeConflictsUnlocked_(request, records, courseRows);
  if (!conflicts.length) return [];
  var conflict = conflicts[0];
  if (conflict.type === 'practice') {
    throw new Error('這個時段已有' + conflict.label + '，請改用「加入一起練習」。');
  }
  throw new Error(
    (conflict.type === 'rental' ? '場地租借' : '正式課程') +
    '與自主練習的前後 15 分鐘緩衝衝突。'
  );
}

function getPracticeParticipantBounds_(participantsValue) {
  var participants = (participantsValue || []).filter(function(participant) {
    return cleanText_(participant && participant.status) === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
  });
  if (!participants.length) return null;
  var startMinutes = Math.min.apply(null, participants.map(function(participant) {
    return timeTextToMinutes_(participant.startTime);
  }));
  var endMinutes = Math.max.apply(null, participants.map(function(participant) {
    return timeTextToMinutes_(participant.endTime);
  }));
  if (startMinutes < 0 || endMinutes < 0) throw new Error('自主練習參與時間格式不正確。');
  return {
    startTime: minutesToTimeText_(startMinutes),
    endTime: minutesToTimeText_(endMinutes)
  };
}

function updatePracticeBookingBoundsUnlocked_(bookingSheet, booking, participants, now, actor) {
  var bounds = getPracticeParticipantBounds_(participants);
  if (!bounds) return null;
  bookingSheet.getRange(booking.rowNumber, 5, 1, 2)
    .setValues([[bounds.startTime, bounds.endTime]]);
  bookingSheet.getRange(booking.rowNumber, 12, 1, 2)
    .setValues([[now, actor]]);
  return bounds;
}

function getPracticeSeriesHorizonDate_(courseRows, startDateValue) {
  var startDate = cleanText_(startDateValue);
  return (courseRows || []).reduce(function(latest, row) {
    var date = formatMyDate(row && row[0]);
    return date && date > latest ? date : latest;
  }, startDate);
}

function createPracticeOccurrenceUnlocked_(records, series, date, actor, appendAudits, courseRows) {
  var existing = records.bookings.some(function(booking) {
    return booking.seriesId === series.seriesId && booking.date === date;
  });
  var excluded = records.exceptions.some(function(exception) {
    return exception.seriesId === series.seriesId && exception.date === date;
  });
  if (existing || excluded) return { created: false, skipped: true };

  var interval = normalizePracticeInterval_(date, series.startTime, series.endTime);
  var conflicts = findPracticeConflictsUnlocked_({
    date: date,
    room: series.room,
    interval: interval
  }, records, courseRows || []);
  if (conflicts.length) {
    var exceptionId = Utilities.getUuid();
    appendPracticeRowUnlocked_(records.sheets.exceptions, SHEET_HEADERS.PRACTICE_EXCEPTIONS, [
      exceptionId, series.seriesId, date, '衝突跳過', conflicts[0].label, getTimestamp_(), actor
    ]);
    records.exceptions.push({ exceptionId: exceptionId, seriesId: series.seriesId, date: date });
    return { created: false, skipped: true, conflict: conflicts[0] };
  }

  var bookingId = Utilities.getUuid();
  var participantId = Utilities.getUuid();
  var now = getTimestamp_();
  appendPracticeRowUnlocked_(records.sheets.bookings, SHEET_HEADERS.PRACTICE_BOOKINGS, [
    bookingId, series.seriesId, date, series.room, series.startTime, series.endTime,
    PRACTICE_STATUS.ACTIVE, series.creatorName, '', '', now, now, actor
  ]);
  appendPracticeRowUnlocked_(records.sheets.participants, SHEET_HEADERS.PRACTICE_PARTICIPANTS, [
    participantId, bookingId, series.seriesId, series.creatorName, PRACTICE_ROLE.CREATOR,
    series.startTime, series.endTime, '每週', PRACTICE_PARTICIPANT_STATUS.ACTIVE, now, ''
  ]);
  records.bookings.push({
    bookingId: bookingId, seriesId: series.seriesId, date: date, room: series.room,
    startTime: series.startTime, endTime: series.endTime, status: PRACTICE_STATUS.ACTIVE,
    creatorName: series.creatorName
  });
  if (appendAudits) appendAudits([{
    actor: actor,
    action: '建立循環自主練習場次',
    targetId: bookingId,
    before: '',
    after: date + ' ' + series.room + ' ' + series.startTime + '–' + series.endTime,
    reason: series.seriesId
  }]);
  appendPracticeAuditUnlocked_(records.sheets.audit, {
    actor: actor,
    action: '建立循環場次',
    targetType: '場次',
    targetId: bookingId,
    after: { date: date, room: series.room, startTime: series.startTime, endTime: series.endTime },
    reason: series.seriesId
  });
  return { created: true, bookingId: bookingId };
}

function expandPracticeSeriesUnlocked_(records, series, throughDateValue, actor, appendAudits, courseRows) {
  var throughDate = cleanText_(throughDateValue).replace(/-/g, '/');
  parsePracticeDateTime_(throughDate, '00:00');
  var cursor = parsePracticeDateTime_(series.startDate, '00:00');
  var end = parsePracticeDateTime_(throughDate, '00:00');
  var created = 0;
  var skipped = 0;
  while (cursor.getTime() <= end.getTime()) {
    var date = Utilities.formatDate(cursor, 'Asia/Taipei', 'yyyy/MM/dd');
    var result = createPracticeOccurrenceUnlocked_(
      records,
      series,
      date,
      actor,
      appendAudits,
      courseRows
    );
    if (result.created) created += 1;
    else skipped += 1;
    cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  return { created: created, skipped: skipped };
}

function createPracticeBooking_(session, inputValue) {
  var teacherName = getSessionTeacherName_(session);
  var input = inputValue || {};
  var room = requirePracticeRoom_(input.room);
  var interval = normalizePracticeInterval_(input.date, input.startTime, input.endTime);
  var recurrence = cleanText_(input.recurrence) === 'weekly' ? 'weekly' : 'once';

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var records = getPracticeRecordsUnlocked_(ss);
    var snapshotRows = requireSheet_(ss, SHEETS.COURSE_LIST).getDataRange().getValues().slice(1);
    var horizon = recurrence === 'weekly'
      ? getPracticeSeriesHorizonDate_(snapshotRows, interval.date)
      : interval.date;
    var courseRows;
    try {
      courseRows = getPracticeCurrentObRows_(interval.date, horizon);
      if (!Array.isArray(courseRows)) throw new Error('OB 課程格式不正確。');
    } catch (error) {
      throw new Error('目前無法即時核對 OB 課表，請稍後再登記自主練習。');
    }
    assertPracticeIntervalAvailable_({ room: room, interval: interval }, records, courseRows);
    var businessSheets = [
      records.sheets.series,
      records.sheets.bookings,
      records.sheets.participants,
      records.sheets.exceptions,
      records.sheets.audit
    ];
    return runStateTransitionUnlocked_(businessSheets, function(appendAudits) {
      var now = getTimestamp_();
      if (recurrence === 'weekly') {
        var seriesId = Utilities.getUuid();
        var weekday = new Date(
          parsePracticeDateTime_(interval.date, '00:00').getTime() + 8 * 60 * 60 * 1000
        ).getUTCDay();
        appendPracticeRowUnlocked_(records.sheets.series, SHEET_HEADERS.PRACTICE_SERIES, [
          seriesId, teacherName, room, weekday, interval.startTime, interval.endTime,
          interval.date, '', '啟用中', now, now, teacherName
        ]);
        var series = {
          seriesId: seriesId,
          creatorName: teacherName,
          room: room,
          startTime: interval.startTime,
          endTime: interval.endTime,
          startDate: interval.date,
          status: '啟用中'
        };
        var expansion = expandPracticeSeriesUnlocked_(
          records,
          series,
          horizon,
          teacherName,
          appendAudits,
          courseRows
        );
        appendPracticeAuditUnlocked_(records.sheets.audit, {
          actor: teacherName,
          action: '建立每週循環',
          targetType: '系列',
          targetId: seriesId,
          after: series
        });
        return {
          seriesId: seriesId,
          bookingId: records.bookings.filter(function(item) {
            return item.seriesId === seriesId && item.date === interval.date;
          })[0].bookingId,
          status: PRACTICE_STATUS.ACTIVE,
          createdOccurrences: expansion.created
        };
      }

      var bookingId = Utilities.getUuid();
      var participantId = Utilities.getUuid();
      appendPracticeRowUnlocked_(records.sheets.bookings, SHEET_HEADERS.PRACTICE_BOOKINGS, [
        bookingId, '', interval.date, room, interval.startTime, interval.endTime,
        PRACTICE_STATUS.ACTIVE, teacherName, '', '', now, now, teacherName
      ]);
      appendPracticeRowUnlocked_(records.sheets.participants, SHEET_HEADERS.PRACTICE_PARTICIPANTS, [
        participantId, bookingId, '', teacherName, PRACTICE_ROLE.CREATOR,
        interval.startTime, interval.endTime, '單次', PRACTICE_PARTICIPANT_STATUS.ACTIVE, now, ''
      ]);
      appendPracticeAuditUnlocked_(records.sheets.audit, {
        actor: teacherName,
        action: '建立單次自主練習',
        targetType: '場次',
        targetId: bookingId,
        after: { date: interval.date, room: room, startTime: interval.startTime, endTime: interval.endTime }
      });
      appendAudits([{
        actor: teacherName,
        action: '建立自主練習',
        targetId: bookingId,
        before: '',
        after: interval.date + ' ' + room + ' ' + interval.startTime + '–' + interval.endTime,
        reason: ''
      }]);
      return { bookingId: bookingId, seriesId: '', status: PRACTICE_STATUS.ACTIVE };
    });
  });
}

function createPracticeWaitlist_(session, inputValue) {
  var teacherName = getSessionTeacherName_(session);
  var input = inputValue || {};
  var calendarId = cleanText_(input.calendarId);
  if (!calendarId) throw new Error('缺少候補課程的 OB Calendar ID。');
  if (cleanText_(input.recurrence) === 'weekly') {
    throw new Error('候補自主練習目前只支援單次登記。');
  }

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var courseSheet = requireSheet_(ss, SHEETS.COURSE_LIST);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    var snapshotRows = courseSheet.getDataRange().getValues().slice(1);
    var requestedDate = cleanText_(input.date).replace(/-/g, '/');
    if (!requestedDate) {
      var snapshotCourseRow = snapshotRows.filter(function(row) {
        return cleanText_(row && row[4]) === calendarId;
      })[0];
      requestedDate = snapshotCourseRow ? formatMyDate(snapshotCourseRow[0]) : '';
    }
    if (!requestedDate) throw new Error('找不到候補課程日期，請重新整理後再選擇。');
    parsePracticeDateTime_(requestedDate, '00:00');
    var courseRows;
    try {
      courseRows = getPracticeCurrentObRows_(requestedDate, requestedDate);
      if (!Array.isArray(courseRows)) throw new Error('OB 課程格式不正確。');
    } catch (error) {
      throw new Error('目前無法即時核對 OB 課表，請稍後再登記候補自主練習。');
    }
    var courseRow = courseRows.filter(function(row) {
      return cleanText_(row && row[4]) === calendarId;
    })[0];
    if (!courseRow) {
      throw new Error('這堂 OB 課程目前已不存在，請重新整理後再選擇。');
    }
    var date = formatMyDate(courseRow[0]);
    var room = getCourseRoom_(courseRow[2]);
    var courseStartMinutes = timeTextToMinutes_(courseRow[1]);
    if (!date || !room || courseStartMinutes < 0) throw new Error('候補課程資料不完整。');
    var startTime = cleanText_(input.startTime) || minutesToTimeText_(courseStartMinutes);
    var endTime = cleanText_(input.endTime) || minutesToTimeText_(
      courseStartMinutes + getScheduledCourseDurationMinutes_(courseRow[2])
    );
    var interval = normalizePracticeInterval_(date, startTime, endTime);
    var records = getPracticeRecordsUnlocked_(ss);
    var conflicts = findPracticeConflictsUnlocked_({
      room: room,
      interval: interval
    }, records, courseRows);
    var selectedCourseConflict = conflicts.some(function(conflict) {
      return conflict.type === 'course' && conflict.id === calendarId;
    });
    if (!selectedCourseConflict) {
      throw new Error('候補時間必須與所選正課或前後 15 分鐘緩衝衝突。');
    }
    var otherConflict = conflicts.filter(function(conflict) {
      return !(conflict.type === 'course' && conflict.id === calendarId);
    })[0];
    if (otherConflict) {
      throw new Error('這個候補時段另有衝突：' + otherConflict.label + '。');
    }

    return runStateTransitionUnlocked_([
      records.sheets.bookings,
      records.sheets.participants,
      records.sheets.audit
    ], function(appendAudits) {
      var bookingId = Utilities.getUuid();
      var participantId = Utilities.getUuid();
      var now = getTimestamp_();
      appendPracticeRowUnlocked_(records.sheets.bookings, SHEET_HEADERS.PRACTICE_BOOKINGS, [
        bookingId, '', date, room, interval.startTime, interval.endTime,
        PRACTICE_STATUS.WAITLISTED, teacherName, calendarId,
        '等待 OB 課程取消後補入', now, now, teacherName
      ]);
      appendPracticeRowUnlocked_(records.sheets.participants, SHEET_HEADERS.PRACTICE_PARTICIPANTS, [
        participantId, bookingId, '', teacherName, PRACTICE_ROLE.CREATOR,
        interval.startTime, interval.endTime, '單次', PRACTICE_PARTICIPANT_STATUS.ACTIVE, now, ''
      ]);
      appendPracticeAuditUnlocked_(records.sheets.audit, {
        actor: teacherName,
        action: '登記候補自主練習',
        targetType: '場次',
        targetId: bookingId,
        after: { calendarId: calendarId, date: date, room: room, startTime: startTime, endTime: endTime }
      });
      appendAudits([{
        actor: teacherName,
        action: '登記候補自主練習',
        targetId: bookingId,
        before: calendarId,
        after: PRACTICE_STATUS.WAITLISTED,
        reason: date + ' ' + room + ' ' + startTime + '–' + endTime
      }]);
      return {
        bookingId: bookingId,
        seriesId: '',
        status: PRACTICE_STATUS.WAITLISTED,
        calendarId: calendarId
      };
    });
  });
}

function joinPracticeBooking_(session, inputValue) {
  var teacherName = getSessionTeacherName_(session);
  var input = inputValue || {};
  var bookingId = cleanText_(input.bookingId);
  if (!bookingId) throw new Error('缺少自主練習場次編號。');
  var result = withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var records = getPracticeRecordsUnlocked_(ss);
    var booking = records.bookings.filter(function(item) { return item.bookingId === bookingId; })[0];
    if (!booking || [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(booking.status) === -1) {
      throw new Error('這筆自主練習目前無法加入。');
    }
    var interval = normalizePracticeInterval_(booking.date, input.startTime, input.endTime);
    var bookingInterval = normalizePracticeInterval_(booking.date, booking.startTime, booking.endTime);
    if (!practiceIntervalsConflict_(interval, bookingInterval, 0)) {
      throw new Error('加入時間需要與現有自主練習時段重疊。');
    }
    if (records.participants.some(function(item) {
      return item.bookingId === bookingId && item.teacherName === teacherName &&
        item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
    })) throw new Error('你已加入這筆自主練習。');

    var now = getTimestamp_();
    var joinFuture = cleanText_(input.scope) === 'future' && !!booking.seriesId;
    var targetBookings = joinFuture
      ? records.bookings.filter(function(item) {
          return item.seriesId === booking.seriesId && item.date >= booking.date &&
            [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(item.status) !== -1;
        }).sort(function(left, right) { return left.date.localeCompare(right.date); })
      : [booking];
    var courseRows;
    try {
      courseRows = getPracticeCurrentObRows_(
        targetBookings[0].date,
        targetBookings[targetBookings.length - 1].date
      );
      if (!Array.isArray(courseRows)) throw new Error('OB 課程格式不正確。');
    } catch (error) {
      throw new Error('目前無法即時核對 OB 課表，請稍後再加入自主練習。');
    }
    targetBookings.forEach(function(targetBooking) {
      var targetInterval = normalizePracticeInterval_(
        targetBooking.date,
        interval.startTime,
        interval.endTime
      );
      var targetBookingInterval = normalizePracticeInterval_(
        targetBooking.date,
        targetBooking.startTime,
        targetBooking.endTime
      );
      if (!practiceIntervalsConflict_(targetInterval, targetBookingInterval, 0)) {
        throw new Error('加入時間需要與現有自主練習時段重疊。');
      }
      assertPracticeIntervalAvailable_({
        room: targetBooking.room,
        interval: targetInterval,
        excludeBookingId: targetBooking.bookingId,
        excludeCalendarId: targetBooking.status === PRACTICE_STATUS.WAITLISTED
          ? targetBooking.waitlistCalendarId
          : ''
      }, records, courseRows);
    });
    return runStateTransitionUnlocked_([
      records.sheets.participants,
      records.sheets.bookings,
      records.sheets.audit
    ], function(appendAudits) {
      var participantIds = [];
      targetBookings.forEach(function(targetBooking) {
        var alreadyJoined = records.participants.some(function(item) {
          return item.bookingId === targetBooking.bookingId && item.teacherName === teacherName &&
            item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
        });
        if (alreadyJoined) return;
        var participantId = Utilities.getUuid();
        participantIds.push(participantId);
        appendPracticeRowUnlocked_(records.sheets.participants, SHEET_HEADERS.PRACTICE_PARTICIPANTS, [
          participantId, targetBooking.bookingId, targetBooking.seriesId, teacherName,
          PRACTICE_ROLE.PARTICIPANT, interval.startTime, interval.endTime,
          joinFuture ? '本次及往後每週' : '單次',
          PRACTICE_PARTICIPANT_STATUS.ACTIVE, now, ''
        ]);
        var activeParticipants = records.participants.filter(function(item) {
          return item.bookingId === targetBooking.bookingId &&
            item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
        }).concat([{
          startTime: interval.startTime,
          endTime: interval.endTime,
          status: PRACTICE_PARTICIPANT_STATUS.ACTIVE
        }]);
        updatePracticeBookingBoundsUnlocked_(
          records.sheets.bookings,
          targetBooking,
          activeParticipants,
          now,
          teacherName
        );
      });
      appendPracticeAuditUnlocked_(records.sheets.audit, {
        actor: teacherName,
        action: '加入自主練習',
        targetType: '場次',
        targetId: bookingId,
        after: { startTime: interval.startTime, endTime: interval.endTime }
      });
      appendAudits([{
        actor: teacherName,
        action: '加入自主練習',
        targetId: bookingId,
        before: '',
        after: interval.startTime + '–' + interval.endTime,
        reason: ''
      }]);
      return {
        bookingId: bookingId,
        participantId: participantIds[0],
        joinedOccurrences: participantIds.length,
        creatorName: booking.creatorName,
        status: booking.status,
        date: booking.date,
        room: booking.room,
        startTime: interval.startTime,
        endTime: interval.endTime
      };
    });
  });
  var recipients = result.creatorName && result.creatorName !== teacherName
    ? [result.creatorName]
    : [];
  if (recipients.length) {
    var message = {
      heading: '有人加入自主練習',
      content: teacherName + ' 已加入 ' + result.date + ' ' + result.room + '教室 ' +
        result.startTime + '–' + result.endTime + '的自主練習。',
      url: buildAppViewUrl_('practice')
    };
    var pushResult = sendPushAfterMutationSafely_(recipients, message);
    if (!pushResult || pushResult.accepted === false || cleanText_(pushResult.error)) {
      recordPracticeNotificationFailure_({
        bookingId: result.bookingId,
        teacherNames: recipients,
        message: message,
        error: pushResult ? cleanText_(pushResult.error) : '推播結果不完整'
      });
    }
  }
  return result;
}

function leavePracticeBooking_(session, inputValue) {
  var teacherName = getSessionTeacherName_(session);
  var input = inputValue || {};
  var bookingId = cleanText_(input.bookingId);
  if (!bookingId) throw new Error('缺少自主練習場次編號。');
  var result = withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var records = getPracticeRecordsUnlocked_(ss);
    var booking = records.bookings.filter(function(item) { return item.bookingId === bookingId; })[0];
    if (!booking || [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(booking.status) === -1) {
      throw new Error('這筆自主練習目前無法退出。');
    }
    var leaveFuture = cleanText_(input.scope) === 'future' && !!booking.seriesId;
    var targetBookings = leaveFuture
      ? records.bookings.filter(function(item) {
          return item.seriesId === booking.seriesId && item.date >= booking.date &&
            [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(item.status) !== -1;
        })
      : [booking];
    var targetBookingIds = {};
    targetBookings.forEach(function(item) { targetBookingIds[item.bookingId] = true; });
    var leavingParticipants = records.participants.filter(function(item) {
      return targetBookingIds[item.bookingId] && item.teacherName === teacherName &&
        item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
    });
    if (!leavingParticipants.length) throw new Error('你目前不在這筆自主練習中。');
    var notifyTeacherNames = records.participants.filter(function(item) {
      return item.bookingId === bookingId && item.teacherName !== teacherName &&
        item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
    }).map(function(item) { return item.teacherName; }).filter(function(name, index, all) {
      return name && all.indexOf(name) === index;
    });
    var leavingByBooking = {};
    leavingParticipants.forEach(function(item) { leavingByBooking[item.bookingId] = item; });
    var now = getTimestamp_();
    return runStateTransitionUnlocked_([
      records.sheets.series,
      records.sheets.bookings,
      records.sheets.participants,
      records.sheets.exceptions,
      records.sheets.audit
    ], function(appendAudits) {
      var resultByBooking = {};
      var firstNewCreator = '';
      var everyOccurrenceEmpty = true;
      targetBookings.forEach(function(targetBooking) {
        var participant = leavingByBooking[targetBooking.bookingId];
        if (!participant) return;
        records.sheets.participants.getRange(participant.rowNumber, 9, 1, 3)
          .setValues([[PRACTICE_PARTICIPANT_STATUS.LEFT, participant.joinedAt, now]]);
        var remaining = records.participants.filter(function(item) {
          return item.bookingId === targetBooking.bookingId &&
            item.participantId !== participant.participantId &&
            item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
        }).sort(function(left, right) {
          return [left.joinedAt, left.participantId].join('|')
            .localeCompare([right.joinedAt, right.participantId].join('|'));
        });
        var newCreatorName = targetBooking.creatorName;
        var bookingStatus = targetBooking.status;
        if (!remaining.length) {
          bookingStatus = PRACTICE_STATUS.CANCELLED;
          newCreatorName = '';
          records.sheets.bookings.getRange(targetBooking.rowNumber, 7, 1, 7).setValues([[
            bookingStatus, '', targetBooking.waitlistCalendarId,
            '最後一位老師已退出', targetBooking.createdAt, now, teacherName
          ]]);
          if (targetBooking.seriesId && !leaveFuture) {
            appendPracticeRowUnlocked_(records.sheets.exceptions, SHEET_HEADERS.PRACTICE_EXCEPTIONS, [
              Utilities.getUuid(), targetBooking.seriesId, targetBooking.date, '取消本次',
              '最後一位老師已退出', now, teacherName
            ]);
          }
        } else {
          everyOccurrenceEmpty = false;
          if (participant.role === PRACTICE_ROLE.CREATOR || targetBooking.creatorName === teacherName) {
            var nextCreator = remaining[0];
            newCreatorName = nextCreator.teacherName;
            if (!firstNewCreator) firstNewCreator = newCreatorName;
            records.sheets.participants.getRange(nextCreator.rowNumber, 5).setValue(PRACTICE_ROLE.CREATOR);
            records.sheets.bookings.getRange(targetBooking.rowNumber, 8).setValue(newCreatorName);
          }
          var remainingBounds = updatePracticeBookingBoundsUnlocked_(
            records.sheets.bookings,
            targetBooking,
            remaining,
            now,
            teacherName
          );
          targetBooking.startTime = remainingBounds.startTime;
          targetBooking.endTime = remainingBounds.endTime;
        }
        resultByBooking[targetBooking.bookingId] = {
          bookingStatus: bookingStatus,
          newCreatorName: newCreatorName,
          startTime: targetBooking.startTime,
          endTime: targetBooking.endTime
        };
      });

      if (booking.seriesId) {
        var series = records.series.filter(function(item) { return item.seriesId === booking.seriesId; })[0];
        if (series) {
          if (firstNewCreator) {
            records.sheets.series.getRange(series.rowNumber, 2).setValue(firstNewCreator);
          }
          if (leaveFuture && everyOccurrenceEmpty) {
            records.sheets.series.getRange(series.rowNumber, 8, 1, 2)
              .setValues([[booking.date, '已停止']]);
          }
          records.sheets.series.getRange(series.rowNumber, 11, 1, 2).setValues([[now, teacherName]]);
        }
      }
      var primaryResult = resultByBooking[bookingId] || {
        bookingStatus: booking.status,
        newCreatorName: booking.creatorName
      };
      appendPracticeAuditUnlocked_(records.sheets.audit, {
        actor: teacherName,
        action: leaveFuture ? '退出本次及往後自主練習' : '退出自主練習',
        targetType: '場次',
        targetId: bookingId,
        before: { creatorName: booking.creatorName, status: booking.status },
        after: {
          creatorName: primaryResult.newCreatorName,
          status: primaryResult.bookingStatus,
          affectedOccurrences: Object.keys(resultByBooking).length
        },
        reason: cleanText_(input.reason)
      });
      appendAudits([{
        actor: teacherName,
        action: leaveFuture ? '退出本次及往後自主練習' : '退出自主練習',
        targetId: bookingId,
        before: booking.creatorName,
        after: primaryResult.newCreatorName || primaryResult.bookingStatus,
        reason: cleanText_(input.reason)
      }]);
      return {
        bookingId: bookingId,
        bookingStatus: primaryResult.bookingStatus,
        newCreatorName: primaryResult.newCreatorName,
        affectedOccurrences: Object.keys(resultByBooking).length,
        notifyTeacherNames: notifyTeacherNames,
        date: booking.date,
        room: booking.room,
        startTime: primaryResult.startTime || booking.startTime,
        endTime: primaryResult.endTime || booking.endTime
      };
    });
  });
  if (result.notifyTeacherNames.length) {
    var message = {
      heading: '有人退出自主練習',
      content: teacherName + ' 已退出 ' + result.date + ' ' + result.room + '教室 ' +
        result.startTime + '–' + result.endTime + '的自主練習。' +
        (result.newCreatorName ? '自主練習仍保留。' : ''),
      url: buildAppViewUrl_('practice')
    };
    var pushResult = sendPushAfterMutationSafely_(result.notifyTeacherNames, message);
    if (!pushResult || pushResult.accepted === false || cleanText_(pushResult.error)) {
      recordPracticeNotificationFailure_({
        bookingId: result.bookingId,
        teacherNames: result.notifyTeacherNames,
        message: message,
        error: pushResult ? cleanText_(pushResult.error) : '推播結果不完整'
      });
    }
  }
  return result;
}

function updatePracticeBooking_(session, inputValue) {
  var actor = getSessionTeacherName_(session);
  var input = inputValue || {};
  var bookingId = cleanText_(input.bookingId);
  if (!bookingId) throw new Error('缺少自主練習場次編號。');
  var result = withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var records = getPracticeRecordsUnlocked_(ss);
    var booking = records.bookings.filter(function(item) { return item.bookingId === bookingId; })[0];
    if (!booking || [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(booking.status) === -1) {
      throw new Error('這筆自主練習目前無法調整。');
    }
    var canManage = getSessionManagementCapabilities_(session).indexOf('course_admin') !== -1;
    var isOwner = booking.creatorName === actor;
    if (!isOwner && !canManage) throw new Error('只能調整自己建立的自主練習。');
    if (!isOwner && !cleanText_(input.reason)) throw new Error('管理員代為調整時請填寫原因。');

    var room = requirePracticeRoom_(input.room || booking.room);
    var interval = normalizePracticeInterval_(
      input.date || booking.date,
      input.startTime || booking.startTime,
      input.endTime || booking.endTime
    );
    var updateFuture = cleanText_(input.scope) === 'future' && !!booking.seriesId;
    if (updateFuture && interval.date !== booking.date) {
      throw new Error('調整這次與之後的循環時，日期需維持不變。');
    }
    var targetBookings = updateFuture
      ? records.bookings.filter(function(item) {
          return item.seriesId === booking.seriesId && item.date >= booking.date &&
            [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(item.status) !== -1;
        })
      : [booking];
    var targetIds = targetBookings.map(function(item) { return item.bookingId; });
    var targetIntervals = {};
    var targetDispositions = {};
    var targetDates = targetBookings.map(function(item) { return item.date; }).sort();
    var courseRows;
    try {
      courseRows = getPracticeCurrentObRows_(targetDates[0], targetDates[targetDates.length - 1]);
    } catch (error) {
      throw new Error('目前無法即時核對 OB 課表，請稍後再調整自主練習。');
    }
    targetBookings.forEach(function(targetBooking) {
      var targetInterval = normalizePracticeInterval_(
        updateFuture ? targetBooking.date : interval.date,
        interval.startTime,
        interval.endTime
      );
      targetIntervals[targetBooking.bookingId] = targetInterval;
      var conflicts = findPracticeConflictsUnlocked_({
        room: room,
        interval: targetInterval,
        excludeBookingIds: targetIds
      }, records, courseRows);
      var rentalConflict = conflicts.filter(function(item) { return item.type === 'rental'; })[0];
      if (rentalConflict) {
        throw new Error('場地租借與自主練習的前後 15 分鐘緩衝衝突。');
      }
      var practiceConflict = conflicts.filter(function(item) { return item.type === 'practice'; })[0];
      if (practiceConflict) {
        throw new Error('這個時段已有' + practiceConflict.label + '，請改用「加入一起練習」。');
      }
      var courseConflictsById = {};
      conflicts.filter(function(item) { return item.type === 'course'; }).forEach(function(item) {
        if (item.id) courseConflictsById[item.id] = item;
      });
      var courseConflicts = Object.keys(courseConflictsById).map(function(id) {
        return courseConflictsById[id];
      });
      if (courseConflicts.length > 1) {
        throw new Error('這個時段同時與多堂正式課程衝突，請調整時間後再候補。');
      }
      if (updateFuture && courseConflicts.length) {
        throw new Error('轉為候補時只能調整這一次，請取消「套用到這次及之後」。');
      }
      targetDispositions[targetBooking.bookingId] = courseConflicts.length ? {
        status: PRACTICE_STATUS.WAITLISTED,
        waitlistCalendarId: courseConflicts[0].id,
        reason: '等待 OB 課程取消後補入'
      } : {
        status: PRACTICE_STATUS.ACTIVE,
        waitlistCalendarId: '',
        reason: ''
      };
    });

    var activeParticipants = records.participants.filter(function(item) {
      return targetIds.indexOf(item.bookingId) !== -1 &&
        item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
    });
    activeParticipants.forEach(function(participant) {
      if (participant.role === PRACTICE_ROLE.CREATOR) return;
      var participantBooking = targetBookings.filter(function(item) {
        return item.bookingId === participant.bookingId;
      })[0];
      var participantInterval = normalizePracticeInterval_(
        participantBooking.date,
        participant.startTime,
        participant.endTime
      );
      var targetInterval = targetIntervals[participant.bookingId];
      if (participantInterval.startMs < targetInterval.startMs || participantInterval.endMs > targetInterval.endMs) {
        throw new Error('調整後的時間無法容納 ' + participant.teacherName + '目前加入的時段。');
      }
    });
    var now = getTimestamp_();
    var businessSheets = [
      records.sheets.bookings,
      records.sheets.participants,
      records.sheets.audit
    ];
    if (updateFuture) businessSheets.unshift(records.sheets.series);
    return runStateTransitionUnlocked_(businessSheets, function(appendAudits) {
      targetBookings.forEach(function(targetBooking) {
        var targetInterval = targetIntervals[targetBooking.bookingId];
        var disposition = targetDispositions[targetBooking.bookingId];
        records.sheets.bookings.getRange(targetBooking.rowNumber, 3, 1, 11).setValues([[
          targetInterval.date, room, targetInterval.startTime, targetInterval.endTime,
          disposition.status, targetBooking.creatorName, disposition.waitlistCalendarId,
          disposition.reason, targetBooking.createdAt, now, actor
        ]]);
      });
      activeParticipants.forEach(function(participant) {
        if (participant.role !== PRACTICE_ROLE.CREATOR) return;
        var participantTarget = targetIntervals[participant.bookingId];
        records.sheets.participants.getRange(participant.rowNumber, 6, 1, 2)
          .setValues([[participantTarget.startTime, participantTarget.endTime]]);
      });
      if (updateFuture) {
        var series = records.series.filter(function(item) { return item.seriesId === booking.seriesId; })[0];
        if (!series) throw new Error('找不到自主練習循環設定。');
        records.sheets.series.getRange(series.rowNumber, 3, 1, 4).setValues([[
          room, series.weekday, interval.startTime, interval.endTime
        ]]);
        records.sheets.series.getRange(series.rowNumber, 11, 1, 2).setValues([[now, actor]]);
      }
      appendPracticeAuditUnlocked_(records.sheets.audit, {
        actor: actor,
        action: updateFuture ? '調整這次及往後自主練習' : '調整自主練習',
        targetType: '場次',
        targetId: bookingId,
        before: { date: booking.date, room: booking.room, startTime: booking.startTime, endTime: booking.endTime },
        after: {
          date: interval.date,
          room: room,
          startTime: interval.startTime,
          endTime: interval.endTime,
          status: targetDispositions[bookingId].status,
          waitlistCalendarId: targetDispositions[bookingId].waitlistCalendarId,
          affectedOccurrences: targetBookings.length
        },
        reason: cleanText_(input.reason)
      });
      appendAudits([{
        actor: actor,
        action: updateFuture ? '調整這次及往後自主練習' : '調整自主練習',
        targetId: bookingId,
        before: booking.date + ' ' + booking.room + ' ' + booking.startTime + '–' + booking.endTime,
        after: interval.date + ' ' + room + ' ' + interval.startTime + '–' + interval.endTime,
        reason: cleanText_(input.reason)
      }]);
      return {
        bookingId: bookingId,
        status: targetDispositions[bookingId].status,
        waitlistCalendarId: targetDispositions[bookingId].waitlistCalendarId,
        date: interval.date,
        room: room,
        startTime: interval.startTime,
        endTime: interval.endTime,
        affectedOccurrences: targetBookings.length,
        teacherNames: activeParticipants.map(function(item) { return item.teacherName; })
      };
    });
  });
  var recipients = result.teacherNames.filter(function(name, index, all) {
    return name && name !== actor && all.indexOf(name) === index;
  });
  if (recipients.length) {
    sendPushAfterMutationSafely_(recipients, {
      heading: '自主練習時間已調整',
      content: result.date + ' ' + result.room + '教室已調整為 ' +
        result.startTime + '–' + result.endTime + '。',
      url: buildAppViewUrl_('practice')
    });
  }
  delete result.teacherNames;
  return result;
}

function cancelPracticeBooking_(session, inputValue) {
  var actor = getSessionTeacherName_(session);
  var input = inputValue || {};
  var bookingId = cleanText_(input.bookingId);
  if (!bookingId) throw new Error('缺少自主練習場次編號。');
  var result = withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var records = getPracticeRecordsUnlocked_(ss);
    var booking = records.bookings.filter(function(item) { return item.bookingId === bookingId; })[0];
    if (!booking || [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(booking.status) === -1) {
      throw new Error('這筆自主練習目前無法取消。');
    }
    var canManage = getSessionManagementCapabilities_(session).indexOf('course_admin') !== -1;
    var isOwner = booking.creatorName === actor;
    if (!isOwner && !canManage) throw new Error('只能取消自己建立的自主練習。');
    if (!isOwner && !cleanText_(input.reason)) throw new Error('管理員代為取消時請填寫原因。');
    var cancelFuture = cleanText_(input.scope) === 'future' && !!booking.seriesId;
    var targetBookings = cancelFuture
      ? records.bookings.filter(function(item) {
          return item.seriesId === booking.seriesId && item.date >= booking.date &&
            [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(item.status) !== -1;
        })
      : [booking];
    var targetIds = {};
    targetBookings.forEach(function(item) { targetIds[item.bookingId] = true; });
    var targetParticipants = records.participants.filter(function(item) {
      return targetIds[item.bookingId] && item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
    });
    var now = getTimestamp_();
    return runStateTransitionUnlocked_([
      records.sheets.series,
      records.sheets.bookings,
      records.sheets.participants,
      records.sheets.exceptions,
      records.sheets.audit
    ], function(appendAudits) {
      targetBookings.forEach(function(target) {
        records.sheets.bookings.getRange(target.rowNumber, 7, 1, 7).setValues([[
          PRACTICE_STATUS.CANCELLED, '', target.waitlistCalendarId,
          cleanText_(input.reason) || '建立者取消', target.createdAt, now, actor
        ]]);
      });
      targetParticipants.forEach(function(participant) {
        records.sheets.participants.getRange(participant.rowNumber, 9, 1, 3).setValues([[
          PRACTICE_PARTICIPANT_STATUS.CANCELLED, participant.joinedAt, now
        ]]);
      });
      if (booking.seriesId) {
        var series = records.series.filter(function(item) { return item.seriesId === booking.seriesId; })[0];
        if (cancelFuture && series) {
          records.sheets.series.getRange(series.rowNumber, 8, 1, 5).setValues([[
            booking.date, '已停止', series.createdAt, now, actor
          ]]);
        } else if (!cancelFuture) {
          appendPracticeRowUnlocked_(records.sheets.exceptions, SHEET_HEADERS.PRACTICE_EXCEPTIONS, [
            Utilities.getUuid(), booking.seriesId, booking.date, '取消本次',
            cleanText_(input.reason), now, actor
          ]);
        }
      }
      appendPracticeAuditUnlocked_(records.sheets.audit, {
        actor: actor,
        action: cancelFuture ? '取消本次及往後自主練習' : '取消自主練習',
        targetType: '場次',
        targetId: bookingId,
        before: { status: booking.status },
        after: { status: PRACTICE_STATUS.CANCELLED, affectedOccurrences: targetBookings.length },
        reason: cleanText_(input.reason)
      });
      appendAudits([{
        actor: actor,
        action: '取消自主練習',
        targetId: bookingId,
        before: booking.status,
        after: PRACTICE_STATUS.CANCELLED,
        reason: cleanText_(input.reason)
      }]);
      return {
        bookingId: bookingId,
        status: PRACTICE_STATUS.CANCELLED,
        affectedOccurrences: targetBookings.length,
        date: booking.date,
        room: booking.room,
        startTime: booking.startTime,
        endTime: booking.endTime,
        teacherNames: targetParticipants.map(function(item) { return item.teacherName; })
      };
    });
  });
  var recipients = result.teacherNames.filter(function(name, index, all) {
    return name && name !== actor && all.indexOf(name) === index;
  });
  if (recipients.length) {
    sendPushAfterMutationSafely_(recipients, {
      heading: '自主練習已取消',
      content: result.date + ' ' + result.room + '教室 ' + result.startTime + '–' +
        result.endTime + '的自主練習已取消。',
      url: buildAppViewUrl_('practice')
    });
  }
  delete result.teacherNames;
  return result;
}

function expandPracticeSeries_(seriesIdValue, throughDateValue) {
  var seriesId = cleanText_(seriesIdValue);
  if (!seriesId) throw new Error('缺少自主練習系列編號。');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var records = getPracticeRecordsUnlocked_(ss);
    var series = records.series.filter(function(item) { return item.seriesId === seriesId; })[0];
    if (!series || series.status !== '啟用中') throw new Error('找不到啟用中的自主練習系列。');
    var throughDate = cleanText_(throughDateValue).replace(/-/g, '/');
    var courseRows;
    try {
      courseRows = getPracticeCurrentObRows_(series.startDate, throughDate);
      if (!Array.isArray(courseRows)) throw new Error('OB 課程格式不正確。');
    } catch (error) {
      throw new Error('目前無法即時核對 OB 課表，循環自主練習尚未展開。');
    }
    return runStateTransitionUnlocked_([
      records.sheets.bookings,
      records.sheets.participants,
      records.sheets.exceptions,
      records.sheets.audit
    ], function(appendAudits) {
      return expandPracticeSeriesUnlocked_(
        records,
        series,
        throughDateValue,
        series.creatorName,
        appendAudits,
        courseRows
      );
    });
  });
}

function getPracticeCurrentObRows_(dateFromValue, dateToValue) {
  var dateFrom = cleanText_(dateFromValue).replace(/\//g, '-');
  var dateTo = cleanText_(dateToValue).replace(/\//g, '-');
  var throughDate = parsePracticeDateTime_(dateTo.replace(/-/g, '/'), '00:00');
  var exclusiveDateTo = Utilities.formatDate(
    new Date(throughDate.getTime() + 24 * 60 * 60 * 1000),
    'Asia/Taipei',
    'yyyy-MM-dd'
  );
  var token = PropertiesService.getScriptProperties().getProperty(CONFIG.API_TOKEN_PROPERTY);
  if (!cleanText_(token)) throw new Error('尚未設定 Omcean API 權杖。');
  var rawItems = fetchCalendarPages_(token, dateFrom, exclusiveDateTo);
  var rows = [];
  var seen = {};
  rawItems.forEach(function(rawItem, index) {
    if (rawItem && rawItem.cancelled === true) return;
    var item = normalizeCalendarItem_(rawItem);
    if (!item) throw new Error('Omcean API 第 ' + (index + 1) + ' 筆課程資料不完整。');
    if (seen[item.calendarId]) return;
    seen[item.calendarId] = true;
    rows.push([
      item.date,
      item.time,
      item.course,
      item.instructor,
      item.calendarId,
      item.classId,
      item.instructorId,
      item.isSubstitute,
      getTimestamp_()
    ]);
  });
  return rows;
}

function getPracticeActiveTeacherNames_(records, bookingId) {
  return records.participants.filter(function(item) {
    return item.bookingId === bookingId && item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
  }).map(function(item) { return item.teacherName; }).filter(function(name, index, all) {
    return name && all.indexOf(name) === index;
  });
}

function recordPracticeNotificationFailure_(eventValue) {
  var event = eventValue || {};
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.PRACTICE_AUDIT);
    assertHeaders_(sheet, SHEET_HEADERS.PRACTICE_AUDIT);
    appendPracticeAuditUnlocked_(sheet, {
      actor: '系統',
      action: '推播失敗',
      targetType: '場次',
      targetId: event.bookingId,
      before: { recipients: event.teacherNames || [] },
      after: { message: event.message || {} },
      reason: event.error || 'OneSignal 未接受通知'
    });
  });
}

function reconcilePracticeBookings_(optionsValue) {
  var options = optionsValue || {};
  var today = cleanText_(options.today || Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd'))
    .replace(/-/g, '/');
  var throughDate = cleanText_(options.throughDate || Utilities.formatDate(
    new Date(parsePracticeDateTime_(today, '00:00').getTime() + 45 * 24 * 60 * 60 * 1000),
    'Asia/Taipei',
    'yyyy/MM/dd'
  )).replace(/-/g, '/');
  parsePracticeDateTime_(today, '00:00');
  parsePracticeDateTime_(throughDate, '00:00');

  var currentObRows;
  try {
    currentObRows = getPracticeCurrentObRows_(today, throughDate);
    if (!Array.isArray(currentObRows)) throw new Error('OB 課程格式不正確。');
  } catch (error) {
    throw new Error('無法確認 OB，自主練習資料未變更：' + getErrorMessage_(error));
  }

  var mutationResult = withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var records = getPracticeRecordsUnlocked_(ss);
    var currentCalendarIds = {};
    currentObRows.forEach(function(row) {
      var id = cleanText_(row && row[4]);
      if (id) currentCalendarIds[id] = true;
    });
    var result = {
      checked: 0,
      activated: 0,
      cancelled: 0,
      pending: 0,
      notifications: []
    };

    return runStateTransitionUnlocked_([
      records.sheets.bookings,
      records.sheets.participants,
      records.sheets.audit
    ], function(appendAudits) {
      var formalAudits = [];
      var now = getTimestamp_();
      records.bookings.filter(function(booking) {
        return booking.date >= today && booking.date <= throughDate &&
          [PRACTICE_STATUS.ACTIVE, PRACTICE_STATUS.WAITLISTED].indexOf(booking.status) !== -1;
      }).forEach(function(booking) {
        result.checked += 1;
        var interval = normalizePracticeInterval_(booking.date, booking.startTime, booking.endTime);
        var activeTeacherNames = getPracticeActiveTeacherNames_(records, booking.bookingId);
        if (booking.status === PRACTICE_STATUS.WAITLISTED &&
            currentCalendarIds[booking.waitlistCalendarId]) {
          result.pending += 1;
          return;
        }

        var conflicts = findPracticeConflictsUnlocked_({
          room: booking.room,
          interval: interval,
          excludeBookingId: booking.bookingId,
          excludeCalendarId: booking.status === PRACTICE_STATUS.WAITLISTED
            ? booking.waitlistCalendarId
            : ''
        }, records, currentObRows).filter(function(item) {
          return item.type === 'course' || item.type === 'rental';
        });

        if (booking.status === PRACTICE_STATUS.WAITLISTED && !conflicts.length) {
          records.sheets.bookings.getRange(booking.rowNumber, 7, 1, 7).setValues([[
            PRACTICE_STATUS.ACTIVE,
            booking.creatorName,
            booking.waitlistCalendarId,
            'OB 課程已取消，候補已補入',
            booking.createdAt,
            now,
            '系統'
          ]]);
          result.activated += 1;
          result.notifications.push({
            bookingId: booking.bookingId,
            teacherNames: activeTeacherNames,
            message: {
              heading: '候補自主練習已成立',
              content: booking.date + ' ' + booking.room + ' 教室 ' +
                booking.startTime + '–' + booking.endTime + ' 已補入。',
              url: buildAppViewUrl_('practice')
            }
          });
          appendPracticeAuditUnlocked_(records.sheets.audit, {
            actor: '系統', action: '候補轉為已成立', targetType: '場次',
            targetId: booking.bookingId, before: booking.status,
            after: PRACTICE_STATUS.ACTIVE, reason: booking.waitlistCalendarId
          });
          formalAudits.push({
            actor: '系統', action: '候補自主練習補入', targetId: booking.bookingId,
            before: booking.status, after: PRACTICE_STATUS.ACTIVE,
            reason: booking.waitlistCalendarId
          });
          return;
        }

        if (!conflicts.length) return;
        var reason = (conflicts[0].type === 'rental' ? '場地租借' : 'OB 課程') +
          '「' + conflicts[0].label + '」占用此時段';
        records.sheets.bookings.getRange(booking.rowNumber, 7, 1, 7).setValues([[
          PRACTICE_STATUS.CONFLICT_CANCELLED,
          booking.creatorName,
          booking.waitlistCalendarId,
          reason,
          booking.createdAt,
          now,
          '系統'
        ]]);
        records.participants.filter(function(item) {
          return item.bookingId === booking.bookingId &&
            item.status === PRACTICE_PARTICIPANT_STATUS.ACTIVE;
        }).forEach(function(participant) {
          records.sheets.participants.getRange(participant.rowNumber, 9, 1, 3).setValues([[
            PRACTICE_PARTICIPANT_STATUS.CANCELLED,
            participant.joinedAt,
            now
          ]]);
        });
        result.cancelled += 1;
        result.notifications.push({
          bookingId: booking.bookingId,
          teacherNames: activeTeacherNames,
          message: {
            heading: '自主練習時段已取消',
            content: booking.date + ' ' + booking.room + ' 教室 ' +
              booking.startTime + '–' + booking.endTime + '：' + reason + '。',
            url: buildAppViewUrl_('practice')
          }
        });
        appendPracticeAuditUnlocked_(records.sheets.audit, {
          actor: '系統', action: '衝突取消', targetType: '場次',
          targetId: booking.bookingId, before: booking.status,
          after: PRACTICE_STATUS.CONFLICT_CANCELLED, reason: reason
        });
        formalAudits.push({
          actor: '系統', action: '取消衝突自主練習', targetId: booking.bookingId,
          before: booking.status, after: PRACTICE_STATUS.CONFLICT_CANCELLED,
          reason: reason
        });
      });
      appendAudits(formalAudits);
      return result;
    });
  });

  var notificationFailures = 0;
  mutationResult.notifications.forEach(function(notification) {
    if (!notification.teacherNames.length) return;
    var pushResult = sendPushAfterMutationSafely_(notification.teacherNames, notification.message);
    if (pushResult && pushResult.accepted !== false && !cleanText_(pushResult.error)) return;
    notificationFailures += 1;
    recordPracticeNotificationFailure_({
      bookingId: notification.bookingId,
      teacherNames: notification.teacherNames,
      message: notification.message,
      error: pushResult && pushResult.error
    });
  });
  delete mutationResult.notifications;
  mutationResult.notificationFailures = notificationFailures;
  return mutationResult;
}

function runScheduledPracticeReconciliation() {
  return reconcilePracticeBookings_({});
}

function ensureCourseClosureStructureUnlocked_(spreadsheet) {
  var settingsSheet = ensureSupportingSheet_(
    spreadsheet,
    SHEETS.COURSE_CLOSURE_SETTINGS,
    SHEET_HEADERS.COURSE_CLOSURE_SETTINGS
  );
  ensureSupportingSheet_(
    spreadsheet,
    SHEETS.COURSE_CLOSURE_LOG,
    SHEET_HEADERS.COURSE_CLOSURE_LOG
  );
  var settings = getCourseClosureSettingsUnlocked_(settingsSheet);
  if (!settings.hasExecutionMode) {
    settingsSheet.getRange(settingsSheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.COURSE_CLOSURE_SETTINGS.length)
      .setValues([[
        CONFIG.COURSE_CLOSURE_MODE_SETTING,
        'manual',
        Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss'),
        '系統初始化',
        '正式環境預設手動；確認 API 與排程後才可切換自動。'
      ]]);
    settings = getCourseClosureSettingsUnlocked_(settingsSheet);
  }
  return { mode: settings.mode };
}

function getCourseClosureSettingsUnlocked_(settingsSheet) {
  var rows = settingsSheet.getDataRange().getValues().slice(1);
  var mode = 'manual';
  var hasExecutionMode = false;
  rows.forEach(function(row) {
    if (cleanText_(row[0]) !== CONFIG.COURSE_CLOSURE_MODE_SETTING) return;
    hasExecutionMode = true;
    mode = cleanText_(row[1]) === 'auto' ? 'auto' : 'manual';
  });
  return { mode: mode, automatic: mode === 'auto', hasExecutionMode: hasExecutionMode };
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
  var parameters = {};
  try {
    parameters = getPostParameters_(e);
    var action = cleanText_(parameters.action);
    if (!action) throw new Error('缺少操作名稱。');

    if (action === 'login') {
      return createPostResponse_(parameters, {
        status: 'success',
        data: authenticate_(parameters.teacherName, parameters.pin)
      });
    }

    if (action === 'getVvipSelection') {
      return createPostResponse_(parameters, {
        status: 'success',
        data: getVvipSelection_(parameters.vvipId)
      });
    }

    if (action === 'getVvipMembers') {
      return createPostResponse_(parameters, { status: 'success', data: getPublicVvipMembers_() });
    }

    if (action === 'submitVvipSelection') {
      return createPostResponse_(parameters, {
        status: 'success',
        data: submitVvipSelection_(
          parameters.vvipId,
          parseJsonArray_(parameters.calendarIds, 'VVIP 課程')
        )
      });
    }

    var session = requireSession_(parameters.sessionToken);
    var actingSession = function() {
      return resolveActingTeacherSession_(session, parameters.actingTeacherName);
    };
    if (action === 'logout') {
      removeSession_(parameters.sessionToken);
      return createPostResponse_(parameters, { status: 'success', data: { loggedOut: true } });
    }

    var handlers = {
      getSession: function() {
        return {
          teacherName: session.teacherName,
          role: session.role,
          managementCapabilities: session.managementCapabilities || []
        };
      },
      getPushConfiguration: function() {
        return getPushConfiguration_(session);
      },
      getNotificationInbox: function() {
        return getNotificationInbox_(session);
      },
      markNotificationRead: function() {
        return markNotificationRead_(session, parameters.messageId);
      },
      markAllNotificationsRead: function() {
        return markAllNotificationsRead_(session);
      },
      getAvailableSubstitutes: function() {
        return getAvailableSubstitutes_(actingSession());
      },
      getClaimPageData: function() {
        return getClaimPageData_(actingSession());
      },
      recordInvitationFirstView: function() {
        recordInvitationFirstView_(session);
        return { recorded: true };
      },
      getClaimOptions: function() {
        return getClaimOptions_(actingSession());
      },
      getMySubs: function() {
        return getMySubs_(getSessionTeacherName_(actingSession()), parameters.recordMonth);
      },
      getMyCourses: function() {
        return getMyCourses_(actingSession());
      },
      getPracticeDay: function() {
        return getPracticeDay_(actingSession(), parameters.date);
      },
      getMyPracticeBookings: function() {
        return getMyPracticeBookings_(actingSession(), parameters.month);
      },
      createPracticeBooking: function() {
        return createPracticeBooking_(
          actingSession(),
          parseJsonObject_(parameters.practice, '自主練習')
        );
      },
      createPracticeWaitlist: function() {
        return createPracticeWaitlist_(
          actingSession(),
          parseJsonObject_(parameters.practice, '候補自主練習')
        );
      },
      joinPracticeBooking: function() {
        return joinPracticeBooking_(
          actingSession(),
          parseJsonObject_(parameters.practice, '加入自主練習')
        );
      },
      leavePracticeBooking: function() {
        return leavePracticeBooking_(
          actingSession(),
          parseJsonObject_(parameters.practice, '退出自主練習')
        );
      },
      updatePracticeBooking: function() {
        return updatePracticeBooking_(
          session,
          parseJsonObject_(parameters.practice, '調整自主練習')
        );
      },
      cancelPracticeBooking: function() {
        return cancelPracticeBooking_(
          session,
          parseJsonObject_(parameters.practice, '取消自主練習')
        );
      },
      getPracticeAdminDashboard: function() {
        return getPracticeAdminDashboard_(session, {
          dateFrom: parameters.dateFrom,
          dateTo: parameters.dateTo,
          room: parameters.room,
          status: parameters.status,
          teacherName: parameters.teacherName
        });
      },
      getMyLeaves: function() {
        return getMyLeaves_(actingSession(), parameters.recordMonth);
      },
      getMyPayroll: function() {
        return getMyPayroll_(session, parameters.month);
      },
      getAdminDashboard: function() {
        return getAdminDashboard_(session);
      },
      getMonthlyDiscountDashboard: function() {
        return getMonthlyDiscountDashboard_(session);
      },
      generateMonthlyDiscountRecommendations: function() {
        return generateMonthlyDiscountRecommendations_(session);
      },
      replaceMonthlyDiscountRecommendation: function() {
        return replaceMonthlyDiscountRecommendation_(session, parameters.itemId);
      },
      confirmMonthlyDiscountRecommendations: function() {
        return confirmMonthlyDiscountRecommendations_(session, parameters.batchId);
      },
      getNotificationAdminDashboard: function() {
        return getNotificationAdminDashboard_(session);
      },
      sendManualNotification: function() {
        return sendManualNotification_(
          session,
          parseJsonObject_(parameters.notification, '推播通知')
        );
      },
      saveNotificationSchedule: function() {
        return saveNotificationSchedule_(
          session,
          parseJsonObject_(parameters.schedule, '通知排程')
        );
      },
      setNotificationScheduleEnabled: function() {
        return setNotificationScheduleEnabled_(
          session,
          parameters.scheduleId,
          parseBoolean_(parameters.enabled, '通知排程啟用設定')
        );
      },
      sendNotificationScheduleNow: function() {
        return sendNotificationScheduleNow_(session, parameters.scheduleId);
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
        return submitLeave_(actingSession(), parseJsonArray_(parameters.items, '請假課程'));
      },
      claimSubstitute: function() {
        return claimSubstitute_(actingSession(), parseJsonArray_(parameters.items, '代課課程'));
      },
      claimSpecialCourse: function() {
        return claimSpecialCourse_(actingSession(), parseJsonObject_(parameters.specialCourse, '特別課'));
      },
      openInvitations: function() {
        return openInvitations_(session, parseTeacherNames_(parameters));
      },
      closeInvitations: function() {
        return closeInvitations_(session, parseTeacherNames_(parameters));
      },
      endInvitationRound: function() {
        return endInvitationRound_(session);
      },
      setCourseClosureAutomation: function() {
        return setCourseClosureAutomation_(
          session,
          parseBoolean_(parameters.enabled, '自動關課設定')
        );
      },
      executeNextDayClosures: function() {
        return executeNextDayClosures_(session, parameters.stage);
      },
      closeUnclaimedSubstituteCourses: function() {
        return closeUnclaimedSubstituteCourses_(
          session,
          parseJsonArray_(parameters.substituteIds, '整月未領代課清單')
        );
      },
      pauseClaims: function() {
        return pauseClaims_(session, parseBoolean_(parameters.paused, '暫停設定'));
      },
      pauseLeaves: function() {
        return pauseLeaves_(session, parseBoolean_(parameters.paused, '暫停請假設定'));
      },
      cancelLeave: function() {
        return cancelLeave_(actingSession(), parameters.substituteId);
      },
      closeMissingObCancellations: function() {
        return closeMissingObCancellations_(
          session,
          parseJsonArray_(parameters.substituteIds, '取消課程清單')
        );
      },
      requestLeaveCancellation: function() {
        return requestLeaveCancellation_(actingSession(), parameters.substituteId, parameters.reason);
      },
      requestClaimWithdrawal: function() {
        return requestClaimWithdrawal_(actingSession(), parameters.substituteId, parameters.reason);
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
      confirmCourseAdjustment: function() {
        return confirmCourseAdjustment_(
          session,
          parameters.adjustmentGroupId,
          parseJsonArray_(parameters.manualMappings || '[]', '手動調課配對')
        );
      },
      dismissCourseAdjustment: function() {
        return dismissCourseAdjustment_(
          session,
          parameters.adjustmentGroupId,
          parameters.reason
        );
      },
      correctClaimDetails: function() {
        return correctClaimDetails_(
          session,
          parameters.substituteId,
          parameters.difficulty,
          parameters.note
        );
      },
      linkSpecialCourseRequestCalendarItem: function() {
        return linkSpecialCourseRequestCalendarItem_(
          session,
          parameters.specialGroupId,
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
        return setVvipSelectionOpen_(
          session,
          parseBoolean_(parameters.open, 'VVIP 開放設定'),
          parameters.closeAt
        );
      },
      confirmVvipEmail: function() {
        return confirmVvipEmail_(session, parameters.email);
      },
      cancelVvipSelection: function() {
        return cancelVvipSelection_(session, parameters.email, parameters.calendarId, parameters.reason, parameters.recordKey);
      },
      exportVvipSelectionsCsv: function() {
        return exportVvipSelectionsCsv_(session);
      }
    };
    if (!handlers[action]) throw new Error('不支援的操作：' + action);
    return createPostResponse_(parameters, { status: 'success', data: handlers[action]() });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return createPostResponse_(parameters, {
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
  if (/綢吊/.test(name)) return '綢吊';
  if (/鞦韆/.test(name)) return '鞦韆';
  if (/瑜伽|皮拉提斯|現代小品|柔軟度|柔軟開發|後彎|開髖/.test(name)) return '地板課程';
  return '其他';
}

function getSyncDateRange_(now) {
  var source = now || new Date();
  var timezone = getTimeZone_();
  var dateFrom = Utilities.formatDate(source, timezone, 'yyyy-MM-dd');
  var parts = dateFrom.split('-').map(Number);
  var endOfNextMonth = new Date(parts[0], parts[1] + 1, 0, 12, 0, 0);
  var fetchThrough = new Date(parts[0], parts[1] + 1, 1, 12, 0, 0);
  return {
    dateFrom: dateFrom,
    dateTo: Utilities.formatDate(fetchThrough, timezone, 'yyyy-MM-dd'),
    calendarDateTo: Utilities.formatDate(endOfNextMonth, timezone, 'yyyy-MM-dd')
  };
}

function getApiDateNumber_(value) {
  var text = cleanText_(value).replace(/\//g, '-');
  var match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (!match) return null;
  return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

function isDateWithinApiWindow_(value, dateFrom, dateTo) {
  var dateNumber = getApiDateNumber_(value);
  var fromNumber = getApiDateNumber_(dateFrom);
  var toNumber = getApiDateNumber_(dateTo);
  return dateNumber !== null && fromNumber !== null && toNumber !== null &&
    dateNumber >= fromNumber && dateNumber <= toNumber;
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

function normalizeClosureCalendarDetail_(item) {
  if (!item || item.id == null || item.id === '') return null;

  var classInfo = item['class'] || item.course || {};
  var instructors = Array.isArray(item.instructors) ? item.instructors.filter(Boolean) : [];
  var instructor = instructors.filter(function(person) {
    return person.isSubstitute === true;
  })[0] || instructors[0] || item.instructor || {};
  var classTime = item.classTime || item.startAt || item.startTime || '';
  var parsedTime = new Date(classTime);
  var hasTime = classTime && !isNaN(parsedTime.getTime());
  var attendanceValue = item.customersAttending;
  var pointsValue = item.points;
  var enrollmentCount = attendanceValue === '' || attendanceValue == null
    ? null
    : Number(attendanceValue);
  var points = pointsValue === '' || pointsValue == null ? null : Number(pointsValue);
  if (enrollmentCount !== null && (!isFinite(enrollmentCount) || enrollmentCount < 0)) {
    enrollmentCount = null;
  }
  if (points !== null && (!isFinite(points) || points < 0)) points = null;

  return {
    calendarId: cleanText_(item.id),
    classId: cleanText_(classInfo.id || classInfo.classId || ''),
    date: hasTime ? Utilities.formatDate(parsedTime, getTimeZone_(), 'yyyy/MM/dd') : '',
    time: hasTime ? Utilities.formatDate(parsedTime, getTimeZone_(), 'HH:mm') : '',
    courseName: cleanText_(classInfo.nameZhHant || classInfo.nameEn || classInfo.name || ''),
    teacherName: cleanText_(
      instructor.name ||
      [instructor.firstName, instructor.lastName].filter(Boolean).join(' ')
    ),
    enrollmentCount: enrollmentCount,
    points: points,
    cancelled: item.cancelled === true
  };
}

function recordMonthlyDiscountClosureObservationsUnlocked_(spreadsheet, targetDate, stage, detailsValue, resultItemsValue) {
  var details = Array.isArray(detailsValue) ? detailsValue : [];
  var resultItems = Array.isArray(resultItemsValue) ? resultItemsValue : [];
  var outcomes = {};
  var substituteByCalendarId = {};
  var courseSheet = spreadsheet.getSheetByName(SHEETS.COURSE_LIST);
  if (courseSheet) {
    courseSheet.getDataRange().getValues().slice(1).forEach(function(row) {
      var courseCalendarId = cleanText_(row && row[4]);
      if (!courseCalendarId) return;
      substituteByCalendarId[courseCalendarId] = ['是', 'true', '1'].indexOf(
        cleanText_(row && row[7]).toLowerCase()
      ) !== -1;
    });
  }
  resultItems.forEach(function(item) {
    if (item && cleanText_(item.calendarId)) outcomes[cleanText_(item.calendarId)] = item;
  });
  ensureMonthlyDiscountStructureUnlocked_(spreadsheet);
  var sheet = requireSheet_(spreadsheet, SHEETS.DISCOUNT_OBSERVATIONS);
  var existingRows = sheet.getDataRange().getValues();
  var rowById = {};
  existingRows.slice(1).forEach(function(row, index) {
    var id = cleanText_(row[0]);
    if (id) rowById[id] = index + 2;
  });
  var nowText = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
  var month = cleanText_(targetDate).replace(/\//g, '-').slice(0, 7);
  details.forEach(function(detail) {
    var calendarId = cleanText_(detail && detail.calendarId);
    var outcome = outcomes[calendarId];
    if (!calendarId) return;
    if (stage === '22:30' && (!outcome || cleanText_(outcome.result) !== '已取消')) return;
    var courseName = cleanText_(detail.courseName);
    var descriptor = {
      weekday: getCourseWeekdayNumber_(targetDate),
      time: formatMyTime(detail.time),
      room: getCourseRoom_(courseName),
      courseName: stripCoursePromotionMarker_(courseName),
      teacherName: cleanText_(detail.teacherName)
    };
    var exclusion = '';
    if (detail.isSubstitute === true || substituteByCalendarId[calendarId] === true) exclusion = '代課';
    else if (getCoursePromotionType_(courseName)) exclusion = '優惠或新老師課';
    else if (isVenueRentalCourseName_(courseName)) exclusion = '場地租借';
    else if (isTermCourseName_(courseName)) exclusion = '期班';
    else if (/特別課|自主練習|私人包班/.test(courseName)) exclusion = '非常態課';
    else if (outcome && ['執行失敗', '待人工確認'].indexOf(cleanText_(outcome.result)) !== -1) exclusion = '關課結果未定';
    var missed = outcome && cleanText_(outcome.result) === '已取消' ? 1 : 0;
    var values = [[
      calendarId, getDiscountSlotKey_(descriptor), month, descriptor.weekday, descriptor.time,
      descriptor.room, descriptor.courseName, descriptor.teacherName, calendarId, 1, missed,
      missed ? cleanText_(targetDate) : '', '每日關課結果', exclusion, nowText
    ]];
    var rowNumber = rowById[calendarId] || sheet.getLastRow() + 1;
    sheet.getRange(rowNumber, 1, 1, SHEET_HEADERS.DISCOUNT_OBSERVATIONS.length).setValues(values);
    rowById[calendarId] = rowNumber;
  });
}

function getCourseClosureRule_(detail, stageValue) {
  var stage = cleanText_(stageValue);
  var base = {
    stage: stage,
    ruleKey: '',
    ruleLabel: '',
    minimumEnrollment: null,
    cancelAtOrBelow: null,
    eligible: false,
    onlyEmpty: false,
    manualReview: false,
    reason: ''
  };
  if (['22:30', '23:40'].indexOf(stage) === -1) {
    throw new Error('不支援的關課檢核時段：' + stage);
  }
  if (detail && isVenueRentalCourseName_(detail.courseName)) {
    base.ruleKey = 'venue-rental-excluded';
    base.ruleLabel = '場地租借不關課';
    base.reason = '場地租借／場租不納入未達人數關課。';
    return base;
  }
  if (!detail || !cleanText_(detail.calendarId) || !cleanText_(detail.date) ||
      !cleanText_(detail.time) || !cleanText_(detail.courseName) ||
      detail.enrollmentCount == null || !isFinite(Number(detail.enrollmentCount))) {
    base.manualReview = true;
    base.reason = 'OB 課程資料不完整，請人工確認。';
    return base;
  }
  if (detail.cancelled === true) {
    base.reason = 'OB 課程已取消。';
    return base;
  }

  var enrollmentCount = Number(detail.enrollmentCount);
  if (stage === '22:30') {
    base.ruleKey = 'zero';
    base.ruleLabel = '0 人關課';
    base.minimumEnrollment = 1;
    base.cancelAtOrBelow = 0;
  } else {
    var courseName = cleanText_(detail.courseName);
    var teacherName = cleanText_(detail.teacherName);
    if (courseName.indexOf('雙人') !== -1) {
      base.ruleKey = 'pair';
      base.ruleLabel = '雙人特別課至少 4 人';
      base.minimumEnrollment = 4;
      base.cancelAtOrBelow = 3;
    } else if (!teacherName || detail.points == null || !isFinite(Number(detail.points))) {
      base.manualReview = true;
      base.reason = 'OB 課程資料不完整，請人工確認。';
      return base;
    } else if (['Jina', '小美', '卡拉', '卡拉 卡拉'].indexOf(teacherName) !== -1 ||
               Number(detail.points) === 2) {
      base.ruleKey = 'teacher-or-two-points';
      base.ruleLabel = '指定老師／2 點課至少 3 人';
      base.minimumEnrollment = 3;
      base.cancelAtOrBelow = 2;
    } else {
      base.ruleKey = 'general';
      base.ruleLabel = '一般課至少 2 人';
      base.minimumEnrollment = 2;
      base.cancelAtOrBelow = 1;
    }
  }
  base.eligible = enrollmentCount <= base.cancelAtOrBelow;
  base.onlyEmpty = enrollmentCount === 0;
  return base;
}

function isVenueRentalCourseName_(courseNameValue) {
  var courseName = cleanText_(courseNameValue).replace(/\s+/g, '');
  return /場地租借|場租/.test(courseName);
}

function getCourseClosureLocation_(courseNameValue) {
  var room = getCourseRoom_(courseNameValue);
  if (room === 'A' || room === 'B') return '晴光';
  if (room === 'C' || room === 'D') return '劍潭';
  return '';
}

function getCourseClosureDisplayName_(courseNameValue) {
  var parsed = parseClaimCourseOption_(courseNameValue);
  return cleanText_(parsed.courseTypeName || stripCourseRoom_(courseNameValue));
}

function buildCourseClosureSocialCopy_(targetDateValue, details) {
  var targetDate = normalizeClosureTargetDate_(targetDateValue);
  var items = (details || []).filter(function(detail) {
    var detailDate = cleanText_(detail && detail.date).replace(/-/g, '/');
    if (!detail || detailDate !== targetDate) return false;
    var rule = getCourseClosureRule_(detail, '23:40');
    return !rule.manualReview && rule.minimumEnrollment != null &&
      Number(detail.enrollmentCount) === Number(rule.minimumEnrollment) - 1;
  }).sort(function(left, right) {
    return [cleanText_(left.time), cleanText_(left.calendarId)].join('|')
      .localeCompare([cleanText_(right.time), cleanText_(right.calendarId)].join('|'));
  });
  var lines = items.map(function(item, index) {
    return (index === 0 ? '明' : '') + cleanText_(item.time) +
      getCourseClosureLocation_(item.courseName) +
      cleanText_(item.teacherName) +
      getCourseClosureDisplayName_(item.courseName);
  });
  if (lines.length) lines.push('各缺一，等到23:40');
  return {
    targetDate: targetDate,
    content: lines.join('\n'),
    calendarIds: items.map(function(item) { return cleanText_(item.calendarId); }),
    items: items.map(function(item) {
      return {
        calendarId: cleanText_(item.calendarId),
        time: cleanText_(item.time),
        location: getCourseClosureLocation_(item.courseName),
        teacherName: cleanText_(item.teacherName),
        courseName: getCourseClosureDisplayName_(item.courseName)
      };
    })
  };
}

function getCourseClosureSocialCopyKey_(targetDateValue) {
  var targetDate = cleanText_(targetDateValue).replace(/-/g, '/');
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(targetDate)) return '';
  return CONFIG.COURSE_CLOSURE_SOCIAL_COPY_PREFIX + targetDate.replace(/\//g, '');
}

function saveCourseClosureSocialCopy_(copyValue) {
  var copy = copyValue || {};
  var properties = getScriptProperties_();
  if (!properties || !copy.targetDate) return copy;
  var propertyKey = getCourseClosureSocialCopyKey_(copy.targetDate);
  if (!propertyKey) return copy;
  var stored = Object.assign({}, copy, {
    updatedAt: Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss')
  });
  properties.setProperty(propertyKey, JSON.stringify(stored));
  return stored;
}

function getCourseClosureSocialCopy_(targetDateValue) {
  var properties = getScriptProperties_();
  if (!properties) return null;
  var propertyKey = getCourseClosureSocialCopyKey_(targetDateValue);
  if (!propertyKey) return null;
  var raw = properties.getProperty(propertyKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function getObApiJson_(url, options, label) {
  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  var body = response.getContentText();
  if (responseCode < 200 || responseCode >= 300) {
    throw new Error((label || 'OB API') + '失敗（HTTP ' + responseCode + '）。');
  }
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error((label || 'OB API') + '回傳的 JSON 無法解析。');
  }
}

function fetchCalendarDetail_(token, calendarIdValue) {
  var apiToken = cleanText_(token);
  var calendarId = cleanText_(calendarIdValue);
  if (!apiToken) throw new Error('尚未設定 Omcean API 權杖。');
  if (!calendarId) throw new Error('缺少 OB Calendar ID。');
  var raw = getObApiJson_(CONFIG.API_URL + '/' + encodeURIComponent(calendarId), {
    method: 'get',
    headers: { Authorization: 'Bearer ' + apiToken },
    muteHttpExceptions: true
  }, '讀取 OB 課程');
  var detail = normalizeClosureCalendarDetail_(raw);
  if (!detail) throw new Error('OB 單堂課程回傳格式不正確。');
  return detail;
}

function getObCancelCalendarPath_() {
  var configured = '';
  if (typeof PropertiesService !== 'undefined' && PropertiesService.getScriptProperties) {
    configured = cleanText_(PropertiesService.getScriptProperties().getProperty(
      CONFIG.OB_CANCEL_CALENDAR_PATH_PROPERTY
    ));
  }
  var path = configured || CONFIG.OB_CANCEL_CALENDAR_DEFAULT_PATH;
  if (path.indexOf('{id}') === -1 || !/^\/v1\//.test(path)) {
    throw new Error('OMCEAN_CANCEL_CALENDAR_PATH 格式不正確。');
  }
  return path;
}

function cancelObCalendarItem_(token, calendarIdValue, reasonValue, onlyEmptyValue) {
  var apiToken = cleanText_(token);
  var calendarId = cleanText_(calendarIdValue);
  var reason = cleanText_(reasonValue);
  if (!apiToken) throw new Error('尚未設定 Omcean API 權杖。');
  if (!calendarId) throw new Error('缺少 OB Calendar ID。');
  if (!reason) throw new Error('取消原因不可空白。');
  var path = getObCancelCalendarPath_().replace('{id}', encodeURIComponent(calendarId));
  var raw = getObApiJson_(CONFIG.API_BASE_URL + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiToken },
    payload: JSON.stringify({ reason: reason, onlyEmpty: onlyEmptyValue === true }),
    muteHttpExceptions: true
  }, '取消 OB 課程');
  var detail = normalizeClosureCalendarDetail_(raw);
  if (!detail) throw new Error('OB 取消課程回傳格式不正確。');
  return detail;
}

function normalizeClosureTargetDate_(value) {
  var text = cleanText_(value).replace(/-/g, '/');
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(text)) throw new Error('關課目標日期格式不正確。');
  return text;
}

function getClosureApiDateRange_(targetDateValue) {
  var targetDate = normalizeClosureTargetDate_(targetDateValue);
  var parts = targetDate.split('/').map(Number);
  var nextDayUtc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1));
  return {
    dateFrom: targetDate.replace(/\//g, '-'),
    dateTo: [
      nextDayUtc.getUTCFullYear(),
      ('0' + (nextDayUtc.getUTCMonth() + 1)).slice(-2),
      ('0' + nextDayUtc.getUTCDate()).slice(-2)
    ].join('-')
  };
}

function buildCourseClosureReason_(detail) {
  return '您好，您所預約 ' + detail.date + ' ' + detail.time + ' ' +
    detail.courseName + ' 課程因未達開課人數因此未開班🥹謝謝';
}

function getProcessedClosureKeysUnlocked_(logSheet, targetDate, stage) {
  var keys = {};
  logSheet.getDataRange().getValues().slice(1).forEach(function(row) {
    var loggedDate = cleanText_(row[1]).replace(/-/g, '/');
    if (loggedDate !== targetDate || cleanText_(row[2]) !== stage) return;
    if (cleanText_(row[9]) !== '已取消') return;
    var calendarId = cleanText_(row[3]);
    if (calendarId) keys[calendarId] = true;
  });
  return keys;
}

function appendCourseClosureLogUnlocked_(logSheet, targetDate, stage, detail, rule, result, error, actor) {
  var item = detail || {};
  var policy = rule || {};
  logSheet.getRange(logSheet.getLastRow() + 1, 1, 1, SHEET_HEADERS.COURSE_CLOSURE_LOG.length)
    .setValues([[
      Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss'),
      targetDate,
      stage,
      cleanText_(item.calendarId),
      cleanText_(item.courseName),
      cleanText_(item.teacherName),
      item.enrollmentCount == null ? '' : Number(item.enrollmentCount),
      cleanText_(policy.ruleLabel),
      policy.onlyEmpty === true ? '是' : '否',
      cleanText_(result),
      cleanText_(error),
      cleanText_(actor)
    ]]);
}

function executeNextDayClosuresCore_(actorValue, stageValue, targetDateValue) {
  var actor = cleanText_(actorValue) || '系統自動關課';
  var stage = cleanText_(stageValue);
  var targetDate = normalizeClosureTargetDate_(targetDateValue);
  if (['22:30', '23:40'].indexOf(stage) === -1) throw new Error('不支援的關課檢核時段：' + stage);
  var token = PropertiesService.getScriptProperties().getProperty(CONFIG.API_TOKEN_PROPERTY);
  if (!cleanText_(token)) throw new Error('尚未設定 Omcean API 權杖。');

  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureCourseClosureStructureUnlocked_(ss);
    var logSheet = requireSheet_(ss, SHEETS.COURSE_CLOSURE_LOG);
    assertHeaders_(logSheet, SHEET_HEADERS.COURSE_CLOSURE_LOG);
    var processed = getProcessedClosureKeysUnlocked_(logSheet, targetDate, stage);
    var apiRange = getClosureApiDateRange_(targetDate);
    var rawItems = fetchCalendarPages_(token, apiRange.dateFrom, apiRange.dateTo);
    var result = {
      targetDate: targetDate,
      stage: stage,
      cancelledCount: 0,
      keptOpenCount: 0,
      manualReviewCount: 0,
      failedCount: 0,
      alreadyProcessedCount: Object.keys(processed).length,
      items: [],
      socialCopy: null
    };
    var targetDetails = [];

    (rawItems || []).forEach(function(raw) {
      var preview = normalizeClosureCalendarDetail_(raw);
      if (!preview || preview.date !== targetDate) return;
      targetDetails.push(preview);
      var previewRule = getCourseClosureRule_(preview, stage);
      if (!previewRule.eligible && !previewRule.manualReview) return;
      if (processed[preview.calendarId]) {
        return;
      }
      if (previewRule.manualReview) {
        appendCourseClosureLogUnlocked_(
          logSheet, targetDate, stage, preview, previewRule,
          '待人工確認', previewRule.reason, actor
        );
        result.manualReviewCount += 1;
        result.items.push({
          calendarId: preview.calendarId,
          time: preview.time,
          courseName: preview.courseName,
          result: '待人工確認'
        });
        return;
      }

      try {
        var latest = fetchCalendarDetail_(token, preview.calendarId);
        var latestRule = getCourseClosureRule_(latest, stage);
        if (latestRule.manualReview) {
          appendCourseClosureLogUnlocked_(
            logSheet, targetDate, stage, latest, latestRule,
            '待人工確認', latestRule.reason, actor
          );
          result.manualReviewCount += 1;
          result.items.push({
            calendarId: latest.calendarId,
            time: latest.time,
            courseName: latest.courseName,
            result: '待人工確認'
          });
          return;
        }
        if (!latestRule.eligible) {
          appendCourseClosureLogUnlocked_(
            logSheet, targetDate, stage, latest, latestRule,
            '人數已足，保留開課', '', actor
          );
          result.keptOpenCount += 1;
          result.items.push({
            calendarId: latest.calendarId,
            time: latest.time,
            courseName: latest.courseName,
            result: '人數已足，保留開課'
          });
          return;
        }
        var cancelled = cancelObCalendarItem_(
          token,
          latest.calendarId,
          buildCourseClosureReason_(latest),
          latestRule.onlyEmpty
        );
        if (!cancelled || cancelled.cancelled !== true) {
          throw new Error('OB 回傳未確認課程已取消。');
        }
        appendCourseClosureLogUnlocked_(
          logSheet, targetDate, stage, latest, latestRule,
          '已取消', '', actor
        );
        processed[latest.calendarId] = true;
        result.cancelledCount += 1;
        result.items.push({
          calendarId: latest.calendarId,
          time: latest.time,
          courseName: latest.courseName,
          result: '已取消'
        });
      } catch (error) {
        appendCourseClosureLogUnlocked_(
          logSheet, targetDate, stage, preview, previewRule,
          '執行失敗', error && error.message ? error.message : String(error), actor
        );
        result.failedCount += 1;
        result.items.push({
          calendarId: preview.calendarId,
          time: preview.time,
          courseName: preview.courseName,
          result: '執行失敗',
          error: error && error.message ? error.message : String(error)
        });
      }
    });
    if (stage === '22:30') {
      result.socialCopy = saveCourseClosureSocialCopy_(
        buildCourseClosureSocialCopy_(targetDate, targetDetails)
      );
    }
    recordMonthlyDiscountClosureObservationsUnlocked_(ss, targetDate, stage, targetDetails, result.items);
    return result;
  });
}

function setCourseClosureModeUnlocked_(settingsSheet, modeValue, actorValue) {
  var mode = cleanText_(modeValue) === 'auto' ? 'auto' : 'manual';
  var actor = cleanText_(actorValue);
  var rows = settingsSheet.getDataRange().getValues();
  var rowNumber = 0;
  for (var index = 1; index < rows.length; index++) {
    if (cleanText_(rows[index][0]) === CONFIG.COURSE_CLOSURE_MODE_SETTING) {
      rowNumber = index + 1;
      break;
    }
  }
  var values = [[
    CONFIG.COURSE_CLOSURE_MODE_SETTING,
    mode,
    Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss'),
    actor,
    mode === 'auto' ? '每 5 分鐘檢查一次，僅在 22:30／23:40 的執行窗口動作。' : '目前僅允許管理員手動執行。'
  ]];
  settingsSheet.getRange(
    rowNumber || settingsSheet.getLastRow() + 1,
    1,
    1,
    SHEET_HEADERS.COURSE_CLOSURE_SETTINGS.length
  ).setValues(values);
  return mode;
}

function getCourseClosureTriggers_() {
  if (typeof ScriptApp === 'undefined' || !ScriptApp.getProjectTriggers) return [];
  return ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction && trigger.getHandlerFunction() === 'runCourseClosureScheduler';
  });
}

function getCourseClosureSchedulerInstalledAt_() {
  var properties = getScriptProperties_();
  return properties
    ? cleanText_(properties.getProperty(CONFIG.COURSE_CLOSURE_SCHEDULER_INSTALLED_PROPERTY))
    : '';
}

function getCourseClosureTriggerStatus_() {
  var installedAt = getCourseClosureSchedulerInstalledAt_();
  return {
    triggerCount: installedAt ? 1 : 0,
    authorizationRequired: false,
    installationRequired: !installedAt,
    installedAt: installedAt
  };
}

function installCourseClosureScheduler() {
  var triggers = getCourseClosureTriggers_();
  var created = false;
  if (!triggers.length) {
    ScriptApp.newTrigger('runCourseClosureScheduler')
      .timeBased()
      .everyMinutes(5)
      .create();
    created = true;
    triggers = getCourseClosureTriggers_();
  }
  if (!triggers.length) throw new Error('自動關課排程建立失敗，請稍後再試。');
  var installedAt = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
  PropertiesService.getScriptProperties().setProperty(
    CONFIG.COURSE_CLOSURE_SCHEDULER_INSTALLED_PROPERTY,
    installedAt
  );
  return {
    installed: true,
    created: created,
    triggerCount: triggers.length,
    installedAt: installedAt
  };
}

function authorizeCourseClosureServices() {
  var installation = installCourseClosureScheduler();
  var remainingMailQuota = MailApp.getRemainingDailyQuota();
  return {
    authorized: true,
    installed: installation.installed,
    created: installation.created,
    triggerCount: installation.triggerCount,
    installedAt: installation.installedAt,
    remainingMailQuota: remainingMailQuota
  };
}

function setCourseClosureAutomation_(session, enabledValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var enabled = enabledValue === true;
  if (enabled && !cleanText_(
    PropertiesService.getScriptProperties().getProperty(CONFIG.API_TOKEN_PROPERTY)
  )) {
    throw new Error('尚未設定 Omcean API 權杖，不能啟用自動關課。');
  }
  var triggerStatus = getCourseClosureTriggerStatus_();
  if (enabled && triggerStatus.installationRequired) {
    throw new Error(
      '尚未安裝自動關課排程。請由專案擁有者在 Apps Script 編輯器執行 ' +
      'installCourseClosureScheduler（或 authorizeCourseClosureServices）一次。'
    );
  }
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureCourseClosureStructureUnlocked_(ss);
    var settingsSheet = requireSheet_(ss, SHEETS.COURSE_CLOSURE_SETTINGS);
    var mode = setCourseClosureModeUnlocked_(settingsSheet, enabled ? 'auto' : 'manual', actor);
    return {
      mode: mode,
      automatic: mode === 'auto',
      triggerCount: triggerStatus.triggerCount,
      triggerInstalled: !triggerStatus.installationRequired
    };
  });
}

function getCourseClosureDueStage_(timeValue) {
  var time = cleanText_(timeValue);
  if (/^22:3\d$/.test(time)) return '22:30';
  if (/^23:4\d$/.test(time)) return '23:40';
  return '';
}

function getTomorrowDate_() {
  return Utilities.formatDate(
    new Date(currentTimeMs_() + 24 * 60 * 60 * 1000),
    getTimeZone_(),
    'yyyy/MM/dd'
  );
}

function getManualCourseClosureStageAvailability_() {
  var currentTime = Utilities.formatDate(new Date(currentTimeMs_()), getTimeZone_(), 'HH:mm');
  return {
    currentTime: currentTime,
    stages: {
      '22:30': currentTime >= '22:30',
      '23:40': currentTime >= '23:40'
    }
  };
}

function assertManualCourseClosureStageAvailable_(stageValue) {
  var stage = cleanText_(stageValue);
  if (['22:30', '23:40'].indexOf(stage) === -1) {
    throw new Error('不支援的關課檢核時段：' + stage);
  }
  var availability = getManualCourseClosureStageAvailability_();
  if (availability.stages[stage] !== true) {
    throw new Error(stage + ' 檢核尚未到可執行時間，請於今日 ' + stage + ' 後再試。');
  }
  return availability.currentTime;
}

function notifyCourseClosureFailures_(result) {
  if (!result || !result.failedCount || typeof MailApp === 'undefined' || !MailApp.sendEmail) return;
  var failedItems = (result.items || []).filter(function(item) { return item.result === '執行失敗'; });
  MailApp.sendEmail({
    to: CONFIG.COURSE_CLOSURE_FAILURE_EMAIL,
    subject: '[Sherry Aerial] 關課執行失敗 ' + result.targetDate + ' ' + result.stage,
    body: failedItems.map(function(item) {
      return 'OB Calendar ID ' + cleanText_(item.calendarId) + '：' + cleanText_(item.error);
    }).join('\n')
  });
}

function sendPushOnceSafely_(eventKeyValue, teacherNames, message) {
  var eventKey = cleanText_(eventKeyValue).replace(/[^A-Za-z0-9_-]/g, '_');
  var properties = getScriptProperties_();
  var propertyKey = CONFIG.PUSH_SENT_KEY_PREFIX + eventKey;
  if (properties && properties.getProperty(propertyKey)) {
    return { attempted: false, delivered: 0, error: '', duplicate: true };
  }
  var messageWithEventKey = {};
  Object.keys(message || {}).forEach(function(key) {
    messageWithEventKey[key] = message[key];
  });
  messageWithEventKey.eventKey = eventKey;
  var result = sendPushAfterMutationSafely_(teacherNames, messageWithEventKey);
  if (properties && result && result.attempted && !result.error) {
    properties.setProperty(
      propertyKey,
      Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss')
    );
  }
  return result;
}

function notifyCourseClosureResult_(resultValue) {
  var result = resultValue || {};
  if (!result.targetDate || !result.stage) return { attempted: false, delivered: 0, error: '' };
  var failedItems = (result.items || []).filter(function(item) {
    return cleanText_(item.result) === '執行失敗';
  });
  var hasFailures = failedItems.length > 0 || Number(result.failedCount) > 0;
  var heading;
  var content;
  if (hasFailures) {
    heading = result.stage + ' 關課有 ' + Math.max(failedItems.length, Number(result.failedCount) || 0) + ' 堂失敗';
    content = failedItems.map(function(item) {
      return [
        cleanText_(item.time),
        cleanText_(item.courseName) || '課程',
        '（' + cleanText_(item.calendarId) + '）',
        '：' + cleanText_(item.error)
      ].join('');
    }).join('；');
    if (!content) content = '有課程關閉失敗，請進管理平台查看關課紀錄。';
  } else {
    heading = result.stage + ' 關課完成';
    content = '已取消 ' + (Number(result.cancelledCount) || 0) + ' 堂；' +
      '保留 ' + (Number(result.keptOpenCount) || 0) + ' 堂；' +
      '待人工確認 ' + (Number(result.manualReviewCount) || 0) + ' 堂。';
  }
  if (result.stage === '22:30' && result.socialCopy && cleanText_(result.socialCopy.content)) {
    content += ' 社群提醒文字已整理完成。';
  }
  return sendPushOnceSafely_(
    ['closure', String(result.targetDate).replace(/\D/g, ''), String(result.stage).replace(/\D/g, ''), hasFailures ? 'failed' : 'success'].join('_'),
    getActiveCourseAdminNames_(),
    {
      heading: heading,
      content: content,
      url: buildAppViewUrl_('admin', 'closureManagement')
    }
  );
}

function executeNextDayClosures_(session, stageValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  assertManualCourseClosureStageAvailable_(stageValue);
  var result = executeNextDayClosuresCore_(actor, stageValue, getTomorrowDate_());
  notifyCourseClosureFailures_(result);
  notifyCourseClosureResult_(result);
  return result;
}

function runCourseClosureScheduler() {
  var now = new Date(currentTimeMs_());
  var dateKey = Utilities.formatDate(now, getTimeZone_(), 'yyyy-MM-dd');
  var time = Utilities.formatDate(now, getTimeZone_(), 'HH:mm');
  var notificationResult = runScheduledNotifications_(dateKey, time);
  var monthlyDiscountResult = runMonthlyDiscountRecommendationScheduler_(dateKey, time);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureCourseClosureStructureUnlocked_(ss);
  var settings = getCourseClosureSettingsUnlocked_(
    requireSheet_(ss, SHEETS.COURSE_CLOSURE_SETTINGS)
  );
  if (!settings.automatic) return { skipped: true, reason: 'manual', notifications: notificationResult, monthlyDiscount: monthlyDiscountResult };
  var stage = getCourseClosureDueStage_(time);
  if (!stage) return { skipped: true, reason: 'outside-window', notifications: notificationResult, monthlyDiscount: monthlyDiscountResult };
  var result = executeNextDayClosuresCore_('系統自動關課', stage, getTomorrowDate_());
  notifyCourseClosureFailures_(result);
  notifyCourseClosureResult_(result);
  result.notifications = notificationResult;
  result.monthlyDiscount = monthlyDiscountResult;
  return result;
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
    if (!isDateWithinApiWindow_(item.date, range.dateFrom, range.calendarDateTo || range.dateTo)) return;
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
    var adjustmentSheet = requireSheet_(ss, SHEETS.COURSE_ADJUSTMENTS);
    validateAppendOnlyHeaders_(adjustmentSheet, SHEET_HEADERS.COURSE_ADJUSTMENTS);
    var adjustmentSnapshot = captureSheetSnapshot_(adjustmentSheet);
    var beforeRows = snapshot.values.slice(1).filter(function(row) {
      return cleanText_(row[4]);
    });
    var adjustmentCandidates = detectCourseAdjustmentCandidates_(beforeRows, rows);
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
      var persistedAdjustments = persistCourseAdjustmentCandidatesUnlocked_(
        adjustmentSheet,
        adjustmentCandidates
      );
      appendAudit_({
        actor: admin.teacherName,
        action: '同步 OB 課表',
        targetId: range.dateFrom + '~' + range.dateTo,
        before: '',
        after: String(normalized.length) + ' 筆；待確認調課 ' + persistedAdjustments.length + ' 組',
        reason: ''
      });
    } catch (writeError) {
      try {
        restoreSheetSnapshot_(sheet, snapshot, writtenRows, writtenColumns);
        restoreSheetSnapshot_(
          adjustmentSheet,
          adjustmentSnapshot,
          Math.max(adjustmentSnapshot.rows, adjustmentSheet.getLastRow()),
          SHEET_HEADERS.COURSE_ADJUSTMENTS.length
        );
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
  invalidateVvipReadCaches_(getNextMonthKey_());
  return {
    status: 'success',
    count: normalized.length,
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    courseAdjustmentCandidates: adjustmentCandidates.length
  };
}

function persistCourseAdjustmentCandidatesUnlocked_(sheet, candidates) {
  assertHeaders_(sheet, SHEET_HEADERS.COURSE_ADJUSTMENTS);
  var values = sheet.getDataRange().getValues();
  var existingIds = {};
  for (var index = 1; index < values.length; index++) {
    var existingId = cleanText_(values[index][0]);
    if (existingId) existingIds[existingId] = true;
  }
  var timestamp = getTimestamp_();
  var rows = (candidates || []).filter(function(candidate) {
    return candidate && candidate.groupId && !existingIds[candidate.groupId];
  }).map(function(candidate) {
    existingIds[candidate.groupId] = true;
    return [
      candidate.groupId,
      candidate.detectionVersion,
      candidate.date,
      candidate.roomPair,
      JSON.stringify(candidate.before || []),
      JSON.stringify(candidate.after || []),
      JSON.stringify(candidate.mappings || []),
      candidate.status || '待確認',
      candidate.reason || '',
      timestamp,
      '', '', '', '', ''
    ];
  });
  if (rows.length) {
    sheet.getRange(
      sheet.getLastRow() + 1,
      1,
      rows.length,
      SHEET_HEADERS.COURSE_ADJUSTMENTS.length
    ).setValues(rows);
  }
  return rows;
}

function parseCourseAdjustmentJson_(value, label) {
  try {
    var parsed = JSON.parse(cleanText_(value) || '[]');
    if (!Array.isArray(parsed)) throw new Error('not array');
    return parsed;
  } catch (error) {
    throw new Error('課程調整的' + label + '資料已損壞，請勿繼續操作。');
  }
}

function getCourseAdjustmentRecordUnlocked_(sheet, adjustmentGroupId) {
  assertHeaders_(sheet, SHEET_HEADERS.COURSE_ADJUSTMENTS);
  var wantedId = cleanText_(adjustmentGroupId);
  var values = sheet.getDataRange().getValues();
  for (var index = 1; index < values.length; index++) {
    if (cleanText_(values[index][0]) === wantedId) {
      return { rowNumber: index + 1, row: values[index] };
    }
  }
  throw new Error('找不到這筆課程調整，請重新整理。');
}

function toAdminCourseAdjustmentItem_(row) {
  return {
    groupId: cleanText_(row[0]),
    detectionVersion: cleanText_(row[1]),
    date: formatMyDate(row[2]),
    roomPair: cleanText_(row[3]),
    before: parseCourseAdjustmentJson_(row[4], '調整前'),
    after: parseCourseAdjustmentJson_(row[5], '調整後'),
    mappings: parseCourseAdjustmentJson_(row[6], '建議配對'),
    status: cleanText_(row[7]),
    reason: cleanText_(row[8]),
    createdAt: cleanText_(row[9]),
    confirmedAt: cleanText_(row[10]),
    confirmedBy: cleanText_(row[11]),
    dismissedReason: cleanText_(row[12]),
    notificationStatus: cleanText_(row[13]),
    notificationError: cleanText_(row[14])
  };
}

function getPendingCourseAdjustments_(session) {
  assertCapabilitySession_(session, 'course_admin');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.COURSE_ADJUSTMENTS);
  if (!sheet) return [];
  assertHeaders_(sheet, SHEET_HEADERS.COURSE_ADJUSTMENTS);
  return sheet.getDataRange().getValues().slice(1).filter(function(row) {
    return cleanText_(row[0]) && cleanText_(row[7]) === '待確認';
  }).map(toAdminCourseAdjustmentItem_).sort(function(a, b) {
    return [a.date, a.createdAt, a.groupId].join('|')
      .localeCompare([b.date, b.createdAt, b.groupId].join('|'));
  });
}

function buildCourseAdjustmentNotification_(teacherName, updates, groupId) {
  var lines = (updates || []).map(function(update) {
    return [
      update.date,
      update.originalTime + ' ' + update.originalCourse,
      '→',
      update.effectiveTime + ' ' + update.effectiveCourse
    ].join(' ');
  });
  return {
    heading: '代課教室／時間已調整',
    content: teacherName + '，你已領取的代課安排有變更：\n' + lines.join('\n'),
    url: buildAppViewUrl_('records', ''),
    eventKey: 'course_adjustment_' + cleanText_(groupId) + '_' + cleanText_(teacherName)
  };
}

function confirmCourseAdjustment_(session, adjustmentGroupId, manualMappings) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var groupId = cleanText_(adjustmentGroupId);
  var requestedMappings = Array.isArray(manualMappings) ? manualMappings : [];
  var notificationGroups = {};
  var result = withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var adjustmentSheet = requireSheet_(ss, SHEETS.COURSE_ADJUSTMENTS);
    var leaveSheet = requireSheet_(ss, SHEETS.LEAVES);
    var courseSheet = requireSheet_(ss, SHEETS.COURSE_LIST);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    var adjustmentRecord = getCourseAdjustmentRecordUnlocked_(adjustmentSheet, groupId);
    if (cleanText_(adjustmentRecord.row[7]) !== '待確認') {
      throw new Error('這筆課程調整已經處理過。');
    }
    var suggestedMappings = parseCourseAdjustmentJson_(adjustmentRecord.row[6], '建議配對');
    var afterItems = parseCourseAdjustmentJson_(adjustmentRecord.row[5], '調整後');
    var coursesByCalendarId = {};
    courseSheet.getDataRange().getValues().slice(1).forEach(function(row) {
      var calendarId = cleanText_(row[4]);
      if (!calendarId) return;
      coursesByCalendarId[calendarId] = {
        calendarId: calendarId,
        date: formatMyDate(row[0]),
        time: formatMyTime(row[1]),
        courseName: cleanText_(row[2]),
        teacherName: cleanText_(row[3])
      };
    });
    afterItems.forEach(function(item) {
      var current = coursesByCalendarId[cleanText_(item.calendarId)];
      if (!current || current.date !== formatMyDate(item.date) ||
          current.time !== formatMyTime(item.time) ||
          current.courseName !== cleanText_(item.courseName)) {
        throw new Error('OB 課表已再次變更，請重新同步後再確認。');
      }
    });

    var mappingsBySourceCalendarId = {};
    suggestedMappings.forEach(function(mapping) {
      var sourceId = cleanText_(mapping.fromCalendarId);
      var targetId = cleanText_(mapping.effectiveCalendarId);
      if (sourceId && targetId) mappingsBySourceCalendarId[sourceId] = targetId;
    });
    var manualBySubstituteId = {};
    requestedMappings.forEach(function(mapping) {
      var substituteId = cleanText_(mapping && mapping.substituteId);
      var targetId = cleanText_(mapping && mapping.effectiveCalendarId);
      if (!substituteId || !targetId) throw new Error('手動調課配對不完整。');
      manualBySubstituteId[substituteId] = targetId;
    });

    var leaveValues = leaveSheet.getDataRange().getValues();
    var updates = [];
    for (var index = 1; index < leaveValues.length; index++) {
      var row = leaveValues[index];
      var substituteId = cleanText_(row[9]);
      var currentCalendarId = getEffectiveOpenLeaveCalendarId_(row);
      var targetCalendarId = manualBySubstituteId[substituteId] || mappingsBySourceCalendarId[currentCalendarId];
      if (!targetCalendarId) continue;
      var targetCourse = coursesByCalendarId[targetCalendarId];
      if (!targetCourse) throw new Error('找不到調課後的 OB 課程，請重新同步。');
      if (targetCourse.date !== formatMyDate(row[2])) {
        throw new Error('調課不可跨日期。');
      }
      var nextRow = row.slice();
      while (nextRow.length < SHEET_HEADERS.LEAVES.length) nextRow.push('');
      var originalMinutes = timeTextToMinutes_(row[3]);
      var effectiveMinutes = timeTextToMinutes_(targetCourse.time);
      var timeDifference = originalMinutes >= 0 && effectiveMinutes >= 0
        ? effectiveMinutes - originalMinutes
        : 0;
      nextRow[20] = targetCalendarId === cleanText_(row[10]) ? '' : targetCalendarId;
      nextRow[25] = targetCourse.time;
      nextRow[26] = [-30, -15, 0, 15, 30].indexOf(timeDifference) !== -1
        ? timeDifference
        : '';
      nextRow[28] = groupId;
      nextRow[29] = getTimestamp_();
      nextRow[30] = actor;
      updates.push({ rowNumber: index + 1, before: row, after: nextRow });
      var substituteTeacher = cleanText_(row[6]);
      if (cleanText_(row[5]) === '已領取' && substituteTeacher) {
        if (!notificationGroups[substituteTeacher]) notificationGroups[substituteTeacher] = [];
        notificationGroups[substituteTeacher].push({
          date: formatMyDate(row[2]),
          originalTime: formatMyTime(row[3]),
          originalCourse: cleanText_(row[4]),
          effectiveTime: targetCourse.time,
          effectiveCourse: targetCourse.courseName
        });
      }
    }
    if (!updates.length) throw new Error('這組調課沒有找到可更新的請假／代課紀錄。');

    var confirmedAt = getTimestamp_();
    var transitionResult = runStateTransitionUnlocked_([leaveSheet, adjustmentSheet], function(appendAudits) {
      updates.forEach(function(update) {
        leaveSheet.getRange(
          update.rowNumber,
          1,
          1,
          SHEET_HEADERS.LEAVES.length
        ).setValues([update.after]);
      });
      var nextAdjustmentRow = adjustmentRecord.row.slice();
      while (nextAdjustmentRow.length < SHEET_HEADERS.COURSE_ADJUSTMENTS.length) nextAdjustmentRow.push('');
      nextAdjustmentRow[7] = '已確認';
      nextAdjustmentRow[10] = confirmedAt;
      nextAdjustmentRow[11] = actor;
      nextAdjustmentRow[12] = '';
      nextAdjustmentRow[13] = Object.keys(notificationGroups).length ? '待通知' : '無需通知';
      nextAdjustmentRow[14] = '';
      adjustmentSheet.getRange(
        adjustmentRecord.rowNumber,
        1,
        1,
        SHEET_HEADERS.COURSE_ADJUSTMENTS.length
      ).setValues([nextAdjustmentRow]);
      appendAudits(updates.map(function(update) {
        return {
          actor: actor,
          action: '確認課程調整',
          targetId: cleanText_(update.after[9]),
          before: getEffectiveOpenLeaveCalendarId_(update.before),
          after: getEffectiveOpenLeaveCalendarId_(update.after),
          reason: '調課群組：' + groupId
        };
      }));
      return { adjustmentGroupId: groupId, status: '已確認', updatedLeaves: updates.length };
    });
    return transitionResult;
  });

  var notificationErrors = [];
  Object.keys(notificationGroups).forEach(function(teacherName) {
    var pushResult = sendPushAfterMutationSafely_([
      teacherName
    ], buildCourseAdjustmentNotification_(teacherName, notificationGroups[teacherName], groupId));
    if (pushResult && pushResult.error) notificationErrors.push(teacherName + '：' + pushResult.error);
  });
  try {
    var adjustmentSheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.COURSE_ADJUSTMENTS);
    var record = getCourseAdjustmentRecordUnlocked_(adjustmentSheet, groupId);
    adjustmentSheet.getRange(record.rowNumber, 14, 1, 2).setValues([[
      notificationErrors.length ? '通知失敗' : (Object.keys(notificationGroups).length ? '已通知' : '無需通知'),
      notificationErrors.join('；')
    ]]);
  } catch (notificationRecordError) {
    result.notificationRecordError = getErrorMessage_(notificationRecordError);
  }
  result.notificationErrors = notificationErrors;
  return result;
}

function dismissCourseAdjustment_(session, adjustmentGroupId, reasonValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var groupId = cleanText_(adjustmentGroupId);
  var reason = cleanText_(reasonValue);
  if (!reason) throw new Error('請填寫忽略原因。');
  return withScriptLock_(function() {
    var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.COURSE_ADJUSTMENTS);
    var record = getCourseAdjustmentRecordUnlocked_(sheet, groupId);
    if (cleanText_(record.row[7]) !== '待確認') throw new Error('這筆課程調整已經處理過。');
    return runStateTransitionUnlocked_([sheet], function(appendAudits) {
      sheet.getRange(record.rowNumber, 8).setValue('已忽略');
      sheet.getRange(record.rowNumber, 13).setValue(reason);
      appendAudits([{
        actor: actor,
        action: '忽略課程調整',
        targetId: groupId,
        before: '待確認',
        after: '已忽略',
        reason: reason
      }]);
      return { adjustmentGroupId: groupId, status: '已忽略' };
    });
  });
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
  var cached = getCachedJsonValue_(CONFIG.VVIP_MEMBER_CACHE_KEY);
  if (Array.isArray(cached)) return cached;
  var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.VVIP_MEMBERS);
  var members = getVvipMemberRows_(sheet);
  assertUniqueActiveVvipMembers_(members);
  var publicMembers = members.filter(function(member) { return member.active; }).map(function(member) {
    return { id: member.id, name: member.name };
  }).sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });
  putCachedJsonValue_(CONFIG.VVIP_MEMBER_CACHE_KEY, publicMembers, CONFIG.VVIP_READ_CACHE_SECONDS);
  return publicMembers;
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
    invalidateVvipMemberCache_();
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
    invalidateVvipMemberCache_();
    return { id: id, name: member.name, active: shouldEnable };
  });
}

function getCachedJsonValue_(key) {
  var cache = getScriptCache_();
  if (!cache) return null;
  try {
    var raw = cache.get(cleanText_(key));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    if (console && console.warn) console.warn('讀取快取失敗，本次改用即時資料。');
    return null;
  }
}

function putCachedJsonValue_(key, value, seconds) {
  var cache = getScriptCache_();
  if (!cache) return;
  try {
    cache.put(cleanText_(key), JSON.stringify(value), Number(seconds) || 300);
  } catch (error) {
    if (console && console.warn) console.warn('寫入快取失敗，本次仍使用即時資料。');
  }
}

function removeCachedValue_(key) {
  var cache = getScriptCache_();
  if (!cache) return;
  try {
    cache.remove(cleanText_(key));
  } catch (error) {
    if (console && console.warn) console.warn('清除快取失敗，將等待快取自然失效。');
  }
}

function getVvipCourseCacheKey_(month) {
  return CONFIG.VVIP_COURSE_CACHE_KEY_PREFIX + cleanText_(month);
}

function invalidateVvipMemberCache_() {
  removeCachedValue_(CONFIG.VVIP_MEMBER_CACHE_KEY);
}

function invalidateVvipReadCaches_(month) {
  invalidateVvipMemberCache_();
  var targetMonth = cleanText_(month) || getNextMonthKey_();
  removeCachedValue_(getVvipCourseCacheKey_(targetMonth));
  removeCachedValue_(CONFIG.COURSE_CAPABILITY_CACHE_KEY);
  removeCachedValue_(CONFIG.COURSE_CLAIM_CATALOG_CACHE_KEY);
}

function getNextMonthKey_(now) {
  var parts = getCurrentMonthKey_(now).split('-').map(Number);
  var year = parts[0];
  var month = parts[1] + 1;
  if (month === 13) {
    year += 1;
    month = 1;
  }
  return year + '-' + ('0' + month).slice(-2);
}

function getCurrentMonthKey_(now) {
  var date = now || new Date();
  var patterns = ['yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss'];
  for (var i = 0; i < patterns.length; i += 1) {
    var formatted = cleanText_(Utilities.formatDate(date, getTimeZone_(), patterns[i]));
    if (/^\d{4}-\d{2}/.test(formatted)) return formatted.slice(0, 7);
  }
  return date.getUTCFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2);
}

function getTeacherRecordMonthKeys_(recordMonth) {
  var requestedMonth = cleanText_(recordMonth);
  if (requestedMonth) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)) {
      throw new Error('紀錄月份格式應為 YYYY-MM。');
    }
    return [requestedMonth];
  }

  var nextMonth = getNextMonthKey_();
  var parts = nextMonth.split('-').map(Number);
  var year = parts[0];
  var month = parts[1] - 1;
  if (month === 0) {
    year -= 1;
    month = 12;
  }
  return [year + '-' + ('0' + month).slice(-2), nextMonth];
}

function getVvipMonthFromDate_(value) {
  var date = formatMyDate(value);
  var match = /^(\d{4})\/(\d{2})\//.exec(date);
  return match ? match[1] + '-' + match[2] : '';
}

function normalizeVvipMonthKey_(value) {
  if (value && typeof value.getTime === 'function' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, getTimeZone_(), 'yyyy-MM-dd').slice(0, 7);
  }
  var text = cleanText_(value);
  var match = /^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/.exec(text);
  return match ? match[1] + '-' + ('0' + match[2]).slice(-2) : text;
}

function getVvipSettings_(sheet) {
  assertHeaders_(sheet, SHEET_HEADERS.VVIP_SETTINGS);
  var settings = {};
  sheet.getDataRange().getValues().slice(1).forEach(function(row) {
    var key = cleanText_(row[0]);
    if (!key || settings[key] != null) return;
    var value = row[1];
    settings[key] = key === 'activeMonth' ? normalizeVvipMonthKey_(value) : cleanText_(value);
  });
  return settings;
}

function getVvipActiveMonth_(settings) {
  return getNextMonthKey_();
}

function parseTaipeiDateTime_(value) {
  if (value && typeof value.getTime === 'function' && !isNaN(value.getTime())) {
    return new Date(value.getTime());
  }
  var text = cleanText_(value).replace('T', ' ');
  var match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (!match) return null;
  var timestamp = Date.UTC(
    Number(match[1]), Number(match[2]) - 1, Number(match[3]),
    Number(match[4]) - 8, Number(match[5]), Number(match[6] || 0)
  );
  var date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

function normalizeVvipCloseAt_(value) {
  var text = cleanText_(value).replace('T', ' ');
  if (!text) return '';
  if (!parseTaipeiDateTime_(text)) throw new Error('VVIP 截止時間格式錯誤。');
  return text.length === 16 ? text + ':00' : text;
}

function isVvipSelectionOpen_(settings, now) {
  if (!isTruthySheetValue_(settings && settings.isOpen) ||
      cleanText_(settings && settings.activeMonth) !== getNextMonthKey_()) return false;
  var closeAtText = cleanText_(settings && settings.closeAt);
  if (!closeAtText) return true;
  var closeAt = parseTaipeiDateTime_(closeAtText);
  return Boolean(closeAt) && (now || new Date()).getTime() < closeAt.getTime();
}

function buildVvipLeaveStatusByCalendarId_(sheet) {
  var byCalendarId = {};
  if (!sheet) return byCalendarId;
  assertHeaders_(sheet, SHEET_HEADERS.LEAVES);
  sheet.getDataRange().getValues().slice(1).forEach(function(row) {
    var status = cleanText_(row[5]);
    var calendarIds = [cleanText_(row[10]), cleanText_(row[20])].filter(function(id) {
      return !!id;
    });
    if (!calendarIds.length) return;
    var item = {
      status: status,
      originalTeacherName: cleanText_(row[1]),
      substituteTeacherName: cleanText_(row[6])
    };
    calendarIds.forEach(function(calendarId) {
      byCalendarId[calendarId] = item;
    });
  });
  return byCalendarId;
}

function mergeVvipLeaveStatus_(course, leave) {
  var result = Object.assign({}, course, {
    leaveStatus: '',
    originalTeacherName: '',
    substituteTeacherName: '',
    leaveLabel: ''
  });
  if (!leave || ['確認中', '已領取'].indexOf(leave.status) === -1) return result;
  result.originalTeacherName = leave.originalTeacherName;
  result.substituteTeacherName = leave.substituteTeacherName;
  if (leave.status === '已領取') {
    result.leaveStatus = 'claimed';
    result.leaveLabel = '原老師請假：' + leave.originalTeacherName +
      '｜代課老師：' + (leave.substituteTeacherName || '未定');
    return result;
  }
  result.leaveStatus = 'pending';
  result.leaveLabel = '原老師請假：' + leave.originalTeacherName + '｜代課老師未定';
  return result;
}

function getVvipCourseRows_(month, requireCalendarIds) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, SHEETS.COURSE_LIST);
  var leaveStatusByCalendarId = buildVvipLeaveStatusByCalendarId_(ss.getSheetByName(SHEETS.LEAVES));
  assertHeaders_(sheet, SHEET_HEADERS.COURSE_LIST);
  var baseCourses = getVvipBaseCourseRows_(sheet, month);
  var missingIds = [];
  var courses = baseCourses.filter(function(item) {
    if (!item.calendarId) missingIds.push(item);
    return item.calendarId && item.date && item.time && item.courseName && item.teacherName &&
      item.courseName.indexOf('場地租借') === -1 && !isTermCourseName_(item.courseName);
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
  return courses.map(function(course) {
    return mergeVvipLeaveStatus_(course, leaveStatusByCalendarId[course.calendarId]);
  }).sort(function(a, b) {
    return [a.date, a.time, a.courseName, a.teacherName, a.calendarId].join('|')
      .localeCompare([b.date, b.time, b.courseName, b.teacherName, b.calendarId].join('|'));
  });
}

function getVvipBaseCourseRows_(sheet, month) {
  var targetMonth = cleanText_(month);
  var cached = getCachedJsonValue_(getVvipCourseCacheKey_(targetMonth));
  if (Array.isArray(cached)) {
    return cached.map(function(row) {
      return {
        calendarId: cleanText_(row[0]),
        date: cleanText_(row[1]),
        time: cleanText_(row[2]),
        courseName: cleanText_(row[3]),
        teacherName: cleanText_(row[4]),
        classId: cleanText_(row[5]),
        instructorId: cleanText_(row[6]),
        isNew: row[7]
      };
    });
  }

  var sourceRows = sheet.getDataRange().getValues().slice(1);
  putCachedJsonValue_(
    CONFIG.COURSE_CAPABILITY_CACHE_KEY,
    buildRecurringCourseCapabilityMap_(sourceRows),
    CONFIG.VVIP_READ_CACHE_SECONDS
  );
  putCachedJsonValue_(
    CONFIG.COURSE_CLAIM_CATALOG_CACHE_KEY,
    buildRecurringClaimCourseCatalog_(sourceRows),
    CONFIG.VVIP_READ_CACHE_SECONDS
  );
  var compactRows = sourceRows.map(function(row) {
    return [
      cleanText_(row[4]),
      formatMyDate(row[0]),
      formatMyTime(row[1]),
      cleanText_(row[2]),
      cleanText_(row[3]),
      cleanText_(row[5]),
      cleanText_(row[6]),
      row[7]
    ];
  }).filter(function(row) {
    return getVvipMonthFromDate_(row[1]) === targetMonth;
  });
  putCachedJsonValue_(
    getVvipCourseCacheKey_(targetMonth),
    compactRows,
    CONFIG.VVIP_READ_CACHE_SECONDS
  );
  return compactRows.map(function(row) {
    return {
      calendarId: row[0],
      date: row[1],
      time: row[2],
      courseName: row[3],
      teacherName: row[4],
      classId: row[5],
      instructorId: row[6],
      isNew: row[7]
    };
  });
}

function buildRecurringCourseCapabilityMap_(courseRows) {
  var capabilityMap = {};
  (courseRows || []).forEach(function(row) {
    var teacher = cleanText_(row && row[3]);
    var courseName = cleanText_(row && row[2]);
    if (!teacher || !courseName || /\u7279\u5225\u8ab2|\u5834\u5730\u79df\u501f/.test(courseName) || isTermCourseName_(courseName)) {
      return;
    }
    var category = getCourseCategory_(courseName);
    if (!category || category === '\u5176\u4ed6') return;
    if (!capabilityMap[teacher]) capabilityMap[teacher] = [];
    if (capabilityMap[teacher].indexOf(category) === -1) capabilityMap[teacher].push(category);
  });
  return capabilityMap;
}

function getRecurringCourseCapabilityMap_(courseSheet) {
  var cached = getCachedJsonValue_(CONFIG.COURSE_CAPABILITY_CACHE_KEY);
  if (cached && typeof cached === 'object' && !Array.isArray(cached)) return cached;
  var rows = courseSheet.getDataRange().getValues().slice(1);
  var capabilityMap = buildRecurringCourseCapabilityMap_(rows);
  putCachedJsonValue_(
    CONFIG.COURSE_CAPABILITY_CACHE_KEY,
    capabilityMap,
    CONFIG.VVIP_READ_CACHE_SECONDS
  );
  return capabilityMap;
}

function buildRecurringClaimCourseCatalog_(courseRows) {
  var categories = normalizeTeacherCapabilities_((courseRows || []).map(function(row) {
    return getCourseCategory_(row && row[2]);
  }));
  return buildRecurringClaimCourseOptions_(courseRows, categories);
}

function getRecurringClaimCourseCatalog_(courseSheet) {
  var cached = getCachedJsonValue_(CONFIG.COURSE_CLAIM_CATALOG_CACHE_KEY);
  if (Array.isArray(cached)) return cached;
  var rows = courseSheet.getDataRange().getValues().slice(1);
  var catalog = buildRecurringClaimCourseCatalog_(rows);
  putCachedJsonValue_(
    CONFIG.COURSE_CLAIM_CATALOG_CACHE_KEY,
    catalog,
    CONFIG.VVIP_READ_CACHE_SECONDS
  );
  return catalog;
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
    return identityMatches && normalizeVvipMonthKey_(item.row[2]) === month;
  });
}

function isActiveVvipSelectionRow_(row) {
  return [CONFIG.VVIP_PENDING_STATUS, CONFIG.VVIP_CONFIRMED_STATUS].indexOf(cleanText_(row[8])) !== -1;
}

function isCourseCancelledVvipSelectionRow_(row) {
  return cleanText_(row[8]) === CONFIG.VVIP_COURSE_CANCELLED_STATUS;
}

function toVvipSelectionItem_(row) {
  var status = cleanText_(row[8]);
  return {
    calendarId: cleanText_(row[3]),
    date: formatMyDate(row[4]),
    time: formatMyTime(row[5]),
    courseName: cleanText_(row[6]),
    teacherName: cleanText_(row[7]),
    status: status,
    courseCancelled: status === CONFIG.VVIP_COURSE_CANCELLED_STATUS
  };
}

function dedupeVvipSelectionItems_(items) {
  var seen = {};
  return (items || []).filter(function(item) {
    var calendarId = cleanText_(item && item.calendarId);
    if (!calendarId || seen[calendarId]) return false;
    seen[calendarId] = true;
    return true;
  });
}

function buildPublicVvipSelectionItems_(rows) {
  var activeItems = dedupeVvipSelectionItems_((rows || []).filter(function(item) {
    return isActiveVvipSelectionRow_(item.row);
  }).map(function(item) {
    return toVvipSelectionItem_(item.row);
  }));
  var activeIds = {};
  activeItems.forEach(function(item) { activeIds[item.calendarId] = true; });
  var cancelledItems = dedupeVvipSelectionItems_((rows || []).filter(function(item) {
    return isCourseCancelledVvipSelectionRow_(item.row);
  }).map(function(item) {
    return toVvipSelectionItem_(item.row);
  })).filter(function(item) {
    return !activeIds[item.calendarId];
  });
  return activeItems.concat(cancelledItems);
}

function buildVvipAdminRecordKey_(rowNumber, row) {
  return String(rowNumber) + '|' + cleanText_(row && row[0]);
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
  var selectionSheet = requireSheet_(ss, SHEETS.VVIP_SELECTIONS);
  var selectionRows = getVvipSelectionRows_(selectionSheet, email, month, member.id);
  var selections = buildPublicVvipSelectionItems_(selectionRows);
  if (!courses.length && !selections.length) {
    throw new Error('本期尚無可選課程，請稍後再試。');
  }
  var activeCount = dedupeVvipSelectionItems_(selectionRows.filter(function(item) {
    return isActiveVvipSelectionRow_(item.row);
  }).map(function(item) {
    return toVvipSelectionItem_(item.row);
  })).length;
  return {
    memberId: member.id,
    memberName: member.name,
    month: month,
    limit: CONFIG.VVIP_MAX_SELECTIONS,
    count: activeCount,
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
  var selections = buildPublicVvipSelectionItems_(rows || []);
  var activeCount = dedupeVvipSelectionItems_((rows || []).filter(function(item) {
    return isActiveVvipSelectionRow_(item.row);
  }).map(function(item) {
    return toVvipSelectionItem_(item.row);
  })).length;
  return {
    memberId: member.id,
    memberName: member.name,
    month: month,
    limit: CONFIG.VVIP_MAX_SELECTIONS,
    count: activeCount,
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

function setVvipSelectionOpen_(session, open, closeAtValue) {
  var actor = assertCapabilitySession_(session, 'vvip_admin');
  var shouldOpen = open === true;
  var closeAt = shouldOpen ? normalizeVvipCloseAt_(closeAtValue) : '';
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var settingsSheet = requireSheet_(ss, SHEETS.VVIP_SETTINGS);
    var settings = getVvipSettings_(settingsSheet);
    var month = getNextMonthKey_();
    if (shouldOpen) {
      if (!getPublicVvipMembers_().length) throw new Error('尚無啟用中的 VVIP 名單，無法開放。');
      var courses = getVvipCourseRows_(month, true);
      if (!courses.length) throw new Error('下個月尚無可選課程，無法開放 VVIP 選課。');
      if (closeAt && parseTaipeiDateTime_(closeAt).getTime() <= new Date().getTime()) {
        throw new Error('VVIP 截止時間必須晚於現在。');
      }
    }
    var before = isVvipSelectionOpen_(settings) ? '開放中' : '已關閉';
    var updates = { activeMonth: month, isOpen: shouldOpen ? '是' : '否' };
    if (shouldOpen) updates.closeAt = closeAt;
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
      return { month: month, isOpen: shouldOpen, closeAt: closeAt };
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
    return normalizeVvipMonthKey_(item.row[2]) === month && (!email || cleanText_(item.row[1]) === email);
  });
  var activeRows = rows.filter(function(item) { return isActiveVvipSelectionRow_(item.row); });
  var visibleRows = rows.filter(function(item) {
    return isActiveVvipSelectionRow_(item.row) || isCourseCancelledVvipSelectionRow_(item.row);
  });
  var whitelistRows = getVvipMemberRows_(requireSheet_(ss, SHEETS.VVIP_MEMBERS));
  var whitelistNameByEmail = {};
  whitelistRows.forEach(function(member) {
    if (member.active && member.email) whitelistNameByEmail[member.email] = member.name;
  });
  var emails = {};
  activeRows.forEach(function(item) { emails[cleanText_(item.row[1])] = true; });
  var members = visibleRows.map(function(item) {
    var output = toVvipSelectionItem_(item.row);
    output.email = cleanText_(item.row[1]);
    output.memberName = cleanText_(item.row[14]) || cleanText_(item.row[12]) || whitelistNameByEmail[output.email] || '';
    output.registeredAt = cleanText_(item.row[0]);
    output.recordKey = buildVvipAdminRecordKey_(item.rowNumber, item.row);
    return output;
  }).sort(function(a, b) {
    return [a.email, a.date, a.time, a.calendarId].join('|')
      .localeCompare([b.email, b.date, b.time, b.calendarId].join('|'));
  });
  var grouped = {};
  var uniqueActive = {};
  members.filter(function(item) { return !item.courseCancelled; }).forEach(function(item) {
    var activeKey = item.email + '|' + item.calendarId;
    if (uniqueActive[activeKey]) return;
    uniqueActive[activeKey] = true;
    if (!grouped[item.calendarId]) {
      grouped[item.calendarId] = {
        calendarId: item.calendarId,
        date: item.date,
        time: item.time,
        courseName: item.courseName,
        teacherName: item.teacherName,
        emails: [],
        registrants: []
      };
    }
    grouped[item.calendarId].emails.push(item.email);
    grouped[item.calendarId].registrants.push({ name: item.memberName, email: item.email });
  });
  return {
    month: month,
    isOpen: isVvipSelectionOpen_(settings),
    closeAt: cleanText_(settings.closeAt),
    whitelist: whitelistRows.map(function(member) {
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
    metrics: {
      members: Object.keys(emails).length,
      activeSelections: Object.keys(uniqueActive).length,
      pendingSelections: rows.filter(function(item) {
        return cleanText_(item.row[8]) === CONFIG.VVIP_PENDING_STATUS;
      }).length
    },
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

function cancelVvipSelection_(session, emailValue, calendarIdValue, reasonValue, recordKeyValue) {
  var actor = assertCapabilitySession_(session, 'vvip_admin');
  var email = normalizeVvipEmail_(emailValue);
  var calendarId = cleanText_(calendarIdValue);
  var reason = cleanText_(reasonValue);
  var recordKey = cleanText_(recordKeyValue);
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
    if (recordKey) {
      matches = matches.filter(function(item) {
        return buildVvipAdminRecordKey_(item.rowNumber, item.row) === recordKey;
      });
    }
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

  if (courseName.indexOf('學員自主練習') !== -1) {
    return instructors.map(function(teacherName) {
      return {
        teacherName: teacherName,
        amount: 0,
        ruleType: '學員自主練習',
        ruleDetail: '學員自主練習不計薪'
      };
    });
  }

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
    if (instructors.indexOf(sherryName) === -1 && instructors.length === 2) {
      var equalShare = Math.round(courseIncome * 0.6 / 2);
      return instructors.map(function(teacherName) {
        return {
          teacherName: teacherName,
          amount: equalShare,
          ruleType: '雙人特別課各半',
          ruleDetail: '課程收入 ' + courseIncome + ' × 60% ÷ 2'
        };
      });
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
  var fetchThrough = new Date(parts[0], parts[1], 1, 12, 0, 0);
  return {
    month: month,
    dateFrom: month + '-01',
    dateTo: Utilities.formatDate(fetchThrough, getTimeZone_(), 'yyyy-MM-dd'),
    calendarDateTo: month + '-' + ('0' + lastDay).slice(-2)
  };
}

function normalizePayrollMonthValue_(value) {
  if (value instanceof Date) {
    return formatMyDate(value).slice(0, 7).replace('/', '-');
  }
  var text = cleanText_(value);
  var match = text.match(/^(\d{4})[-\/]([01]\d)(?:[-\/]\d{1,2})?/);
  return match ? match[1] + '-' + match[2] : text;
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
    if (normalizePayrollMonthValue_(row[0]) !== month) return;
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
      if (!isDateWithinApiWindow_(item.date, range.dateFrom, range.calendarDateTo || range.dateTo)) return;
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
      if (normalizePayrollMonthValue_(row[0]) === month && cleanText_(row[8]) === version && cleanText_(row[9]) === CONFIG.PAYROLL_DRAFT_STATUS) {
        summaryRows.push(index + 2);
      }
    });
    lineValues.slice(1).forEach(function(row, index) {
      if (normalizePayrollMonthValue_(row[0]) === month && cleanText_(row[2]) === version && cleanText_(row[16]) === CONFIG.PAYROLL_DRAFT_STATUS) {
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
    month: normalizePayrollMonthValue_(row[0]), lineId: cleanText_(row[1]), version: cleanText_(row[2]),
    calendarId: cleanText_(row[3]), teacherName: cleanText_(row[4]), date: formatMyDate(row[5]),
    time: formatMyTime(row[6]), courseName: cleanText_(row[7]), billingType: cleanText_(row[8]),
    attendanceCount: row[9], courseIncome: row[10], ruleDetail: cleanText_(row[12]),
    amount: Number(row[13]) || 0, manualAdjustment: Number(row[14]) || 0,
    adjustmentReason: cleanText_(row[15]), status: cleanText_(row[16])
  };
}

function getPayrollSummaryObject_(row) {
  return {
    month: normalizePayrollMonthValue_(row[0]), teacherName: cleanText_(row[1]), subtotal: Number(row[2]) || 0,
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
      (!month || normalizePayrollMonthValue_(row[0]) === month);
  });
  if (!summaries.length) return { month: month, summary: null, lines: [], disputes: [] };
  var summaryRow = summaries[summaries.length - 1];
  var summary = getPayrollSummaryObject_(summaryRow);
  var lines = lineSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return normalizePayrollMonthValue_(row[0]) === summary.month && cleanText_(row[2]) === summary.version &&
      cleanText_(row[4]) === teacher && cleanText_(row[16]) !== CONFIG.PAYROLL_DRAFT_STATUS;
  }).map(getPayrollLineObject_);
  var disputes = disputeSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return normalizePayrollMonthValue_(row[1]) === summary.month && cleanText_(row[2]) === teacher;
  }).map(function(row) {
    return {
      id: cleanText_(row[0]), month: normalizePayrollMonthValue_(row[1]), lineId: cleanText_(row[3]),
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
      if (normalizePayrollMonthValue_(row[0]) === month && cleanText_(row[1]) === teacher && cleanText_(row[8]) === version) {
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
      if (normalizePayrollMonthValue_(summaryValues[summaryIndex][0]) === month &&
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
      return normalizePayrollMonthValue_(row[0]) === month && cleanText_(row[1]) === lineId &&
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
      if (normalizePayrollMonthValue_(summaries[index][0]) === month && cleanText_(summaries[index][1]) === teacher && cleanText_(summaries[index][8]) === version) {
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
      var month = normalizePayrollMonthValue_(values[index][1]);
      var teacher = cleanText_(values[index][2]);
      var summarySheet = requireSheet_(ss, SHEETS.PAYROLL_SUMMARIES);
      var summaries = summarySheet.getDataRange().getValues();
      for (var summaryIndex = summaries.length - 1; summaryIndex > 0; summaryIndex--) {
        if (normalizePayrollMonthValue_(summaries[summaryIndex][0]) === month &&
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
      if (normalizePayrollMonthValue_(row[0]) !== month || cleanText_(row[1]) !== teacher || cleanText_(row[8]) !== version) continue;
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
      if (normalizePayrollMonthValue_(row[1]) === month && cleanText_(row[5]) === '待處理') {
        openDisputes[cleanText_(row[2])] = true;
      }
    });

    var candidates = [];
    summaryValues.slice(1).forEach(function(row, index) {
      if (normalizePayrollMonthValue_(row[0]) !== month || cleanText_(row[8]) !== version) return;
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
        if (normalizePayrollMonthValue_(row[0]) === month && cleanText_(row[2]) === version && finalizedTeachers[cleanText_(row[4])]) {
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
    if (normalizePayrollMonthValue_(row[0]) === month && cleanText_(row[8]) === version &&
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
  if (!month && summaryRows.length) month = normalizePayrollMonthValue_(summaryRows[summaryRows.length - 1][0]);
  if (!month) month = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM');
  var monthRows = summaryRows.filter(function(row) { return normalizePayrollMonthValue_(row[0]) === month; });
  var version = monthRows.length ? cleanText_(monthRows[monthRows.length - 1][8]) : '';
  var summaries = monthRows.filter(function(row) { return cleanText_(row[8]) === version; }).map(getPayrollSummaryObject_);
  var lines = lineSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return normalizePayrollMonthValue_(row[0]) === month && cleanText_(row[2]) === version;
  }).map(getPayrollLineObject_);
  var snapshotRows = snapshotSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return normalizePayrollMonthValue_(row[1]) === month && cleanText_(row[0]) === version;
  });
  var disputes = disputeSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return normalizePayrollMonthValue_(row[1]) === month;
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
  var courseRows = getVvipBaseCourseRows_(sheet, targetMonth);
  var activeLeaveIds = {};
  leaveSheet.getDataRange().getValues().slice(1).forEach(function(r) {
    if (cleanText_(r[1]) === teacher &&
        ['確認中', '已領取'].indexOf(cleanText_(r[5])) !== -1 && cleanText_(r[10])) {
      activeLeaveIds[cleanText_(r[10])] = true;
    }
  });

  return courseRows.filter(function(r) {
    var calendarId = cleanText_(r.calendarId);
    return cleanText_(r.teacherName) === teacher && calendarId && !activeLeaveIds[calendarId];
  }).map(function(r) {
    return {
      '日期': cleanText_(r.date),
      '時間': cleanText_(r.time),
      '課程': cleanText_(r.courseName),
      '課程大類': getCourseCategory_(r.courseName),
      'OB Calendar ID': cleanText_(r.calendarId)
    };
  }).filter(function(item) {
    return item['日期'] && item['時間'] && item['課程'];
  }).sort(function(a, b) {
    return [a['日期'], a['時間'], a['課程']].join('|')
      .localeCompare([b['日期'], b['時間'], b['課程']].join('|'));
  });
}

function getMyLeaves_(session, recordMonth) {
  var teacher = getSessionTeacherName_(session);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  assertHeaders_(sheet, SHEET_HEADERS.LEAVES);

  var auditByTarget = getAuditHistoryMap_();
  var recordMonths = getTeacherRecordMonthKeys_(recordMonth);
  return sheet.getDataRange().getValues().slice(1).filter(function(r) {
    return cleanText_(r[1]) === teacher &&
      recordMonths.indexOf(getVvipMonthFromDate_(r[2])) !== -1;
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

function resolveActingTeacherSession_(session, actingTeacherName) {
  var administrator = getSessionTeacherName_(session);
  var target = cleanText_(actingTeacherName);
  if (!target || target === administrator) return session;
  assertCapabilitySession_(session, 'course_admin');
  assertTeacherExists_(target);
  return Object.assign({}, session, {
    teacherName: target,
    impersonatedBy: administrator
  });
}

function getSessionAuditActor_(session) {
  var teacher = getSessionTeacherName_(session);
  var administrator = cleanText_(session && session.impersonatedBy);
  return administrator ? administrator + '（代 ' + teacher + ' 操作）' : teacher;
}

function openInvitations_(session, teacherNames) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var teachers = normalizeTeacherNames_(teacherNames);
  var openedTeachers = [];
  teachers.forEach(assertTeacherExists_);

  var result = withScriptLock_(function() {
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
      openedTeachers.push(teacher);
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
  if (openedTeachers.length) {
    sendPushAfterMutationSafely_(openedTeachers, {
      heading: '新的代課邀請',
      content: '教室已開放新一輪代課，點此查看目前可領取的課程。',
      url: buildAppViewUrl_('claim')
    });
  }
  return result;
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

function endInvitationRound_(session) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.INVITATIONS);
    var auditSheet = requireSheet_(ss, SHEETS.AUDIT);
    assertHeaders_(sheet, SHEET_HEADERS.INVITATIONS);
    assertHeaders_(auditSheet, SHEET_HEADERS.AUDIT);
    var values = sheet.getDataRange().getValues();
    var now = getTimestamp_();
    var records = [];
    var teacherMap = {};
    for (var index = 1; index < values.length; index++) {
      var row = values[index];
      if (cleanText_(row[4]) !== CONFIG.INVITATION_OPEN_STATUS) continue;
      var teacher = cleanText_(row[1]);
      records.push({
        rowNumber: index + 1,
        invitationId: cleanText_(row[0]),
        teacher: teacher,
        snapshot: [row[4], row[5]]
      });
      if (teacher) teacherMap[teacher] = true;
    }
    if (!records.length) return { closedInvitations: 0, closedTeachers: 0 };
    var auditStartRow = auditSheet.getLastRow() + 1;
    var auditSnapshot = auditSheet.getRange(
      auditStartRow,
      1,
      records.length,
      SHEET_HEADERS.AUDIT.length
    ).getValues();

    try {
      records.forEach(function(record) {
        sheet.getRange(record.rowNumber, 5, 1, 2).setValues([[
          CONFIG.INVITATION_ROUND_ENDED_STATUS,
          now
        ]]);
      });
      appendAuditEventsUnlocked_(auditSheet, records.map(function(record) {
        return {
          actor: actor,
          action: '結束本輪邀請',
          targetId: record.invitationId,
          before: CONFIG.INVITATION_OPEN_STATUS,
          after: CONFIG.INVITATION_ROUND_ENDED_STATUS,
          reason: record.teacher
        };
      }));
    } catch (error) {
      var rollbackFailures = [];
      try {
        auditSheet.getRange(
          auditStartRow,
          1,
          records.length,
          SHEET_HEADERS.AUDIT.length
        ).setValues(auditSnapshot);
      } catch (auditRestoreError) {
        rollbackFailures.push('稽核範圍：' + getErrorMessage_(auditRestoreError));
      }
      records.slice().reverse().forEach(function(record) {
        try {
          sheet.getRange(record.rowNumber, 5, 1, 2).setValues([record.snapshot]);
        } catch (restoreError) {
          rollbackFailures.push(
            '邀請第 ' + record.rowNumber + ' 列：' + getErrorMessage_(restoreError)
          );
        }
      });
      if (rollbackFailures.length) {
        throw new Error(getErrorMessage_(error) + '；精準回復失敗：' + rollbackFailures.join('；'));
      }
      throw error;
    }
    return {
      closedInvitations: records.length,
      closedTeachers: Object.keys(teacherMap).length
    };
  });
}

function getUnclaimedSubstituteClosureCandidates_(session) {
  assertCapabilitySession_(session, 'course_admin');
  var targetMonth = getNextMonthKey_();
  var sheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), CONFIG.LEAVE_SHEET);
  assertHeaders_(sheet, SHEET_HEADERS.LEAVES);
  return sheet.getDataRange().getValues().slice(1).filter(function(row) {
    return isOrdinaryOpenLeaveRow_(row) &&
      isLeaveRowInMonth_(row, targetMonth) &&
      !isVenueRentalCourseName_(row[4]);
  }).map(function(row) {
    return {
      substituteId: cleanText_(row[9]),
      calendarId: getEffectiveOpenLeaveCalendarId_(row),
      date: formatMyDate(row[2]),
      time: formatMyTime(row[3]),
      courseName: cleanText_(row[4]),
      originalTeacher: cleanText_(row[1])
    };
  }).sort(function(a, b) {
    return [a.date, a.time, a.courseName].join('|').localeCompare(
      [b.date, b.time, b.courseName].join('|')
    );
  });
}

function closeUnclaimedSubstituteCourses_(session, substituteIds) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var ids = normalizeMissingObCancellationIds_(substituteIds);
  var token = PropertiesService.getScriptProperties().getProperty(CONFIG.API_TOKEN_PROPERTY);
  if (!cleanText_(token)) throw new Error('尚未設定 Omcean API 權杖。');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    var auditSheet = requireSheet_(ss, SHEETS.AUDIT);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(auditSheet, SHEET_HEADERS.AUDIT);
    var targetMonth = getNextMonthKey_();
    var values = leaveSheet.getDataRange().getValues();
    var recordById = {};
    for (var index = 1; index < values.length; index++) {
      var id = cleanText_(values[index][9]);
      if (id) recordById[id] = { rowNumber: index + 1, row: values[index] };
    }
    var result = {
      targetMonth: targetMonth,
      closed: 0,
      booked: 0,
      excluded: 0,
      failed: 0,
      items: []
    };
    ids.forEach(function(id) {
      var record = recordById[id];
      if (!record || !isOrdinaryOpenLeaveRow_(record.row) ||
          !isLeaveRowInMonth_(record.row, targetMonth)) {
        result.failed += 1;
        result.items.push({ substituteId: id, result: '狀態已變更，未處理' });
        return;
      }
      if (isVenueRentalCourseName_(record.row[4])) {
        result.excluded += 1;
        result.items.push({ substituteId: id, result: '場地租借，未取消' });
        return;
      }
      var calendarId = getEffectiveOpenLeaveCalendarId_(record.row);
      try {
        var latest = fetchCalendarDetail_(token, calendarId);
        if (isVenueRentalCourseName_(latest.courseName)) {
          result.excluded += 1;
          result.items.push({
            substituteId: id,
            calendarId: calendarId,
            result: '場地租借，未取消'
          });
          return;
        }
        if (latest.cancelled === true) {
          throw new Error('OB 課程已是取消狀態，請先重新同步確認。');
        }
        if (latest.enrollmentCount == null) {
          throw new Error('OB 未回傳最新預約人數。');
        }
        if (Number(latest.enrollmentCount) > 0) {
          result.booked += 1;
          result.items.push({
            substituteId: id,
            calendarId: calendarId,
            result: '已有預約，未取消',
            enrollmentCount: Number(latest.enrollmentCount)
          });
          return;
        }
        var reason = '您好，您所預約 ' + latest.date + ' ' + latest.time + ' ' +
          latest.courseName + ' 課程因未找到代課老師因此未開班🥹謝謝';
        var cancelled = cancelObCalendarItem_(token, calendarId, reason, true);
        if (!cancelled || cancelled.cancelled !== true) {
          throw new Error('OB 回傳未確認課程已取消。');
        }
        var beforeStatus = cleanText_(record.row[5]);
        var nextValues = record.row.slice(5, 19);
        while (nextValues.length < 14) nextValues.push('');
        nextValues[0] = '已取消';
        nextValues[3] = '已完成';
        nextValues[10] = '已關閉';
        nextValues[11] = getTimestamp_();
        nextValues[12] = '整月未領代課／OB 已取消';
        nextValues[13] = '未找到代課老師／代課已關閉';
        leaveSheet.getRange(record.rowNumber, 6, 1, 14).setValues([nextValues]);
        appendAuditEventsUnlocked_(auditSheet, [{
          actor: actor,
          action: '整月未領代課批量關課',
          targetId: id,
          before: beforeStatus,
          after: '已取消',
          reason: calendarId
        }]);
        result.closed += 1;
        result.items.push({ substituteId: id, calendarId: calendarId, result: '已取消' });
      } catch (error) {
        result.failed += 1;
        result.items.push({
          substituteId: id,
          calendarId: calendarId,
          result: '執行失敗',
          error: error && error.message ? error.message : String(error)
        });
      }
    });
    return result;
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

function getClaimPageReadContext_(session, includeSpecialRequestRows) {
  var teacher = getSessionTeacherName_(session);
  assertTeacherExists_(teacher);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invitationSheet = requireSheet_(ss, SHEETS.INVITATIONS);
  assertHeaders_(invitationSheet, SHEET_HEADERS.INVITATIONS);
  var invitationRows = invitationSheet.getDataRange().getValues().slice(1);
  var latestInvitation = null;
  for (var invitationIndex = invitationRows.length - 1; invitationIndex >= 0; invitationIndex--) {
    if (cleanText_(invitationRows[invitationIndex][1]) === teacher) {
      latestInvitation = invitationRows[invitationIndex];
      break;
    }
  }
  var latestInvitationStatus = latestInvitation ? cleanText_(latestInvitation[4]) : '';
  var hasInvitation = latestInvitationStatus === CONFIG.INVITATION_OPEN_STATUS;
  var hasEndedInvitation = latestInvitationStatus === CONFIG.INVITATION_ROUND_ENDED_STATUS;
  var claimsPaused = areClaimsPaused_();
  var active = hasInvitation && !claimsPaused;
  var context = {
    teacher: teacher,
    ss: ss,
    active: active,
    state: hasInvitation ? (claimsPaused ? 'paused' : 'active') :
      (hasEndedInvitation ? 'ended' : 'notInvited'),
    courseRows: [],
    leaveRows: [],
    capabilities: [],
    claimClasses: [],
    specialRequestRows: []
  };
  if (!active) return context;

  var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
  assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
  context.courseRows = getVvipBaseCourseRows_(courseSheet, getNextMonthKey_()).map(function(course) {
    return [
      course.date,
      course.time,
      course.courseName,
      course.teacherName,
      course.calendarId,
      course.classId,
      course.instructorId,
      course.isNew,
      ''
    ];
  });
  context.leaveRows = leaveSheet.getDataRange().getValues().slice(1);
  var recurringCapabilityMap = getRecurringCourseCapabilityMap_(courseSheet);
  context.capabilities = normalizeTeacherCapabilities_(
    getTeacherCapabilities_(teacher).concat(recurringCapabilityMap[teacher] || [])
  );
  context.claimClasses = getRecurringClaimCourseCatalog_(courseSheet).filter(function(item) {
    return context.capabilities.indexOf(cleanText_(item && item.category)) !== -1;
  });

  if (includeSpecialRequestRows) {
    var specialRequestSheet = ss.getSheetByName(SHEETS.SPECIAL_COURSE_REQUESTS);
    if (specialRequestSheet) {
      assertHeaders_(specialRequestSheet, SHEET_HEADERS.SPECIAL_COURSE_REQUESTS);
      context.specialRequestRows = specialRequestSheet.getDataRange().getValues().slice(1);
    }
  }
  return context;
}

function buildAvailableSubstitutesFromContext_(context) {
  if (!context.active) return [];
  var teacher = context.teacher;
  var courseRows = context.courseRows;
  var leaveRows = context.leaveRows;
  var capabilities = context.capabilities;
  var targetMonth = getNextMonthKey_();
  var courseCalendarIds = buildCourseCalendarIdSet_(courseRows);
  var allPendingRows = leaveRows.filter(function(row) {
    return cleanText_(row[5]) === '確認中' &&
      cleanText_(row[1]) !== teacher &&
      isLeaveRowInMonth_(row, targetMonth);
  });
  if (allPendingRows.some(function(row) {
    return !cleanText_(row[9]) ||
      (!cleanText_(row[10]) && cleanText_(row[15]) !== '待人工核對');
  })) {
    throw new Error('代課資料尚未完成初始化，請通知管理員執行系統設定。');
  }
  var pendingRows = allPendingRows.filter(function(row) {
    return isOrdinaryOpenLeaveRow_(row) && courseCalendarIds[getEffectiveOpenLeaveCalendarId_(row)];
  });
  var teacherCommitments = buildTeacherCommitmentSlots_(
    teacher,
    courseRows,
    leaveRows,
    context.specialRequestRows
  );
  pendingRows = pendingRows.filter(function(row) {
    return !findTeacherScheduleConflict_(buildOrdinaryLeaveTimeSlot_(row), teacherCommitments);
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

function buildClaimOptionsFromContext_(context) {
  if (!context.active) return { capabilities: [], classes: [] };
  return {
    capabilities: context.capabilities,
    classes: context.claimClasses,
    specialAvailability: getTeacherSpecialCourseAvailability_(
      context.teacher,
      context.leaveRows,
      context.courseRows
    ),
    specialSlots: buildSpecialCourseSlotsForTeacher_(
      context.teacher,
      context.leaveRows,
      context.courseRows
    )
  };
}

function getClaimPageData_(session) {
  var context = getClaimPageReadContext_(session, true);
  return {
    state: context.state,
    items: buildAvailableSubstitutesFromContext_(context),
    options: buildClaimOptionsFromContext_(context)
  };
}

function getAvailableSubstitutes_(session) {
  return buildAvailableSubstitutesFromContext_(
    getClaimPageReadContext_(session, true)
  );
}

function isOrdinaryOpenLeaveRow_(row) {
  return cleanText_(row[5]) === '確認中' &&
    !cleanText_(row[6]) &&
    !!cleanText_(row[9]) &&
    !!cleanText_(row[10]) &&
    !getOpenLeaveBlockingState_(row);
}

function buildCourseCalendarIdSet_(courseRows) {
  var ids = {};
  (courseRows || []).forEach(function(row) {
    var calendarId = cleanText_(row && row[4]);
    if (calendarId) ids[calendarId] = true;
  });
  return ids;
}

function getEffectiveOpenLeaveCalendarId_(row) {
  return cleanText_(row && row[20]) || cleanText_(row && row[10]);
}

function isMissingObCancellationCandidateRow_(row, courseCalendarIds, targetMonth) {
  return isOrdinaryOpenLeaveRow_(row) &&
    isLeaveRowInMonth_(row, targetMonth) &&
    !courseCalendarIds[getEffectiveOpenLeaveCalendarId_(row)];
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
  return buildClaimOptionsFromContext_(
    getClaimPageReadContext_(session, false)
  );
}

function getCourseRoom_(courseName) {
  var match = /^\s*([A-D])\s*[－—–-]\s*/i.exec(String(courseName || ''));
  return match ? match[1].toUpperCase() : '';
}

function getCourseAdjustmentRoomPair_(roomValue) {
  var room = cleanText_(roomValue).toUpperCase();
  if (room === 'A' || room === 'B') return 'A/B';
  if (room === 'C' || room === 'D') return 'C/D';
  return '';
}

function toCourseAdjustmentItem_(row) {
  var value = row || [];
  var classId = cleanText_(value[5]);
  var instructorIdentity = cleanText_(value[6]) || cleanText_(value[3]);
  var courseIdentity = classId
    ? 'class:' + classId
    : 'course:' + normalizeCourseCatalogKey_(value[2]);
  return {
    date: formatMyDate(value[0]),
    time: formatMyTime(value[1]),
    courseName: cleanText_(value[2]),
    teacherName: cleanText_(value[3]),
    calendarId: cleanText_(value[4]),
    classId: classId,
    instructorId: cleanText_(value[6]),
    room: getCourseRoom_(value[2]),
    identity: courseIdentity + '|teacher:' + instructorIdentity,
    syncVersion: cleanText_(value[8])
  };
}

function makeCourseAdjustmentGroupId_(dateValue, calendarIds, versionValue) {
  return [
    'course-adjustment',
    String(dateValue || '').replace(/\D/g, ''),
    (calendarIds || []).slice().sort().join('-'),
    String(versionValue || '').replace(/[^0-9A-Za-z]/g, '')
  ].join('_');
}

function detectCourseAdjustmentCandidates_(beforeRows, afterRows) {
  var beforeItems = (beforeRows || []).map(toCourseAdjustmentItem_).filter(function(item) {
    return item.date && item.room && item.calendarId && item.identity;
  });
  var afterItems = (afterRows || []).map(toCourseAdjustmentItem_).filter(function(item) {
    return item.date && item.room && item.calendarId && item.identity;
  });
  var afterByCalendarId = {};
  afterItems.forEach(function(item) {
    if (!afterByCalendarId[item.calendarId]) afterByCalendarId[item.calendarId] = item;
  });

  var groups = {};
  beforeItems.forEach(function(item) {
    var pair = getCourseAdjustmentRoomPair_(item.room);
    if (!pair) return;
    var key = item.date + '|' + pair;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  var candidates = [];
  Object.keys(groups).forEach(function(groupKey) {
    var groupItems = groups[groupKey];
    var beforeIdentityCounts = {};
    var afterIdentityCounts = {};
    groupItems.forEach(function(item) {
      beforeIdentityCounts[item.identity] = (beforeIdentityCounts[item.identity] || 0) + 1;
      var afterItem = afterByCalendarId[item.calendarId];
      if (afterItem && afterItem.date === item.date) {
        afterIdentityCounts[afterItem.identity] = (afterIdentityCounts[afterItem.identity] || 0) + 1;
      }
    });

    var matchedPairs = [];
    for (var leftIndex = 0; leftIndex < groupItems.length; leftIndex++) {
      var leftBefore = groupItems[leftIndex];
      var leftAfter = afterByCalendarId[leftBefore.calendarId];
      if (!leftAfter || leftAfter.date !== leftBefore.date) continue;
      if (getCourseAdjustmentRoomPair_(leftAfter.room) !== getCourseAdjustmentRoomPair_(leftBefore.room)) continue;
      for (var rightIndex = leftIndex + 1; rightIndex < groupItems.length; rightIndex++) {
        var rightBefore = groupItems[rightIndex];
        var rightAfter = afterByCalendarId[rightBefore.calendarId];
        if (!rightAfter || rightAfter.date !== rightBefore.date) continue;
        if (leftBefore.room === rightBefore.room) continue;
        if (getCourseAdjustmentRoomPair_(rightAfter.room) !== getCourseAdjustmentRoomPair_(rightBefore.room)) continue;
        if (leftAfter.identity !== rightBefore.identity || rightAfter.identity !== leftBefore.identity) continue;
        if (beforeIdentityCounts[leftBefore.identity] !== 1 || beforeIdentityCounts[rightBefore.identity] !== 1) continue;
        if (afterIdentityCounts[leftAfter.identity] !== 1 || afterIdentityCounts[rightAfter.identity] !== 1) continue;
        matchedPairs.push({
          before: [leftBefore, rightBefore],
          after: [leftAfter, rightAfter]
        });
      }
    }
    if (matchedPairs.length !== 1) return;

    var match = matchedPairs[0];
    var version = match.after.map(function(item) { return item.syncVersion; }).sort().pop() || '';
    var calendarIds = match.before.map(function(item) { return item.calendarId; });
    candidates.push({
      groupId: makeCourseAdjustmentGroupId_(match.before[0].date, calendarIds, version),
      detectionVersion: version,
      date: match.before[0].date,
      roomPair: getCourseAdjustmentRoomPair_(match.before[0].room),
      before: match.before,
      after: match.after,
      mappings: match.before.map(function(beforeItem) {
        var effectiveItem = match.after.filter(function(afterItem) {
          return afterItem.identity === beforeItem.identity;
        })[0];
        return {
          fromCalendarId: beforeItem.calendarId,
          effectiveCalendarId: effectiveItem ? effectiveItem.calendarId : '',
          originalTime: beforeItem.time,
          effectiveTime: effectiveItem ? effectiveItem.time : ''
        };
      }),
      status: '待確認',
      reason: getCourseAdjustmentRoomPair_(match.before[0].room) + ' 課程身分交叉調整'
    });
  });
  return candidates;
}

function getOrdinaryCourseDurationMinutes_(courseName) {
  return cleanText_(courseName).indexOf('綢吊') !== -1 ? 90 : 60;
}

function getScheduledCourseDurationMinutes_(courseName) {
  return parseExplicitCourseMinutes_(courseName) || getOrdinaryCourseDurationMinutes_(courseName);
}

function buildTeacherTimeSlot_(dateValue, timeValue, durationValue, label, calendarId) {
  var date = formatMyDate(dateValue);
  var startMinutes = timeTextToMinutes_(timeValue);
  var durationMinutes = Number(durationValue);
  if (!date || startMinutes < 0 || !isFinite(durationMinutes) || durationMinutes <= 0) return null;
  return {
    date: date,
    startMinutes: startMinutes,
    endMinutes: startMinutes + durationMinutes,
    label: cleanText_(label),
    calendarId: cleanText_(calendarId),
    calendarIds: []
  };
}

function buildOrdinaryLeaveTimeSlot_(row, actualStartTime) {
  var groupId = cleanText_(row && row[21]);
  var slot = buildTeacherTimeSlot_(
    row && row[2],
    actualStartTime ||
      (groupId ? getSpecialCourseActualStartTime_(row && row[23], row && row[24]) : '') ||
      formatMyTime(row && row[25]) ||
      formatMyTime(row && row[3]),
    groupId ? Number(row && row[23]) : getOrdinaryCourseDurationMinutes_(row && row[4]),
    cleanText_(row && row[4]),
    cleanText_(row && row[10])
  );
  if (slot) {
    slot.calendarIds = [cleanText_(row && row[10]), cleanText_(row && row[20])].filter(Boolean);
  }
  return slot;
}

function teacherTimeSlotsConflict_(first, second) {
  if (!first || !second || first.date !== second.date) return false;
  return first.startMinutes < second.endMinutes + 15 &&
    second.startMinutes < first.endMinutes + 15;
}

function findTeacherScheduleConflict_(candidate, commitments) {
  if (!candidate) return null;
  return (commitments || []).filter(function(slot) {
    if (slot.calendarId && (candidate.calendarIds || []).indexOf(slot.calendarId) !== -1) return false;
    return teacherTimeSlotsConflict_(candidate, slot);
  })[0] || null;
}

function buildTeacherCommitmentSlots_(teacherName, courseRows, leaveRows, specialRequestRows) {
  var teacher = cleanText_(teacherName);
  var inactiveOwnCalendarIds = {};
  (leaveRows || []).forEach(function(row) {
    if (cleanText_(row && row[1]) !== teacher) return;
    if (['確認中', '已領取', '延後占用'].indexOf(cleanText_(row && row[5])) === -1) return;
    var calendarId = cleanText_(row && row[10]);
    if (calendarId) inactiveOwnCalendarIds[calendarId] = true;
  });

  var slots = [];
  (courseRows || []).forEach(function(row) {
    if (cleanText_(row && row[3]) !== teacher) return;
    if (inactiveOwnCalendarIds[cleanText_(row && row[4])]) return;
    var slot = buildTeacherTimeSlot_(
      row && row[0],
      row && row[1],
      getScheduledCourseDurationMinutes_(row && row[2]),
      row && row[2],
      row && row[4]
    );
    if (slot) slots.push(slot);
  });

  var seenSpecialGroupIds = {};
  (leaveRows || []).forEach(function(row) {
    if (cleanText_(row && row[6]) !== teacher || cleanText_(row && row[5]) !== '已領取') return;
    var groupId = cleanText_(row && row[21]);
    if (groupId && seenSpecialGroupIds[groupId]) return;
    var slot = buildOrdinaryLeaveTimeSlot_(row);
    if (slot) slots.push(slot);
    if (groupId) seenSpecialGroupIds[groupId] = true;
  });

  (specialRequestRows || []).forEach(function(row) {
    if (cleanText_(row && row[2]) !== teacher || cleanText_(row && row[14]) === '已取消') return;
    var groupId = cleanText_(row && row[1]);
    if (groupId && seenSpecialGroupIds[groupId]) return;
    var slot = buildTeacherTimeSlot_(row && row[3], row && row[7], row && row[10], row && row[8]);
    if (slot) slots.push(slot);
    if (groupId) seenSpecialGroupIds[groupId] = true;
  });
  return slots;
}

function normalizeOrdinaryDelayMinutes_(value) {
  var delay = value == null || cleanText_(value) === '' ? 0 : Number(value);
  if ([-30, -15, 0, 15, 30].indexOf(delay) === -1) {
    throw new Error('一般代課只能使用提早 30 分鐘、提早 15 分鐘、原時段、延後 15 分鐘或延後 30 分鐘。');
  }
  return delay;
}

function buildOrdinaryClaimDelayPlan_(sourceRow, delayMinutes, leaveRows, courseRows) {
  var delay = normalizeOrdinaryDelayMinutes_(delayMinutes);
  var date = formatMyDate(sourceRow && sourceRow[2]);
  var originalStartTime = formatMyTime(sourceRow && sourceRow[3]);
  var originalStartMinutes = timeTextToMinutes_(originalStartTime);
  var calendarId = getEffectiveOpenLeaveCalendarId_(sourceRow);
  var room = getCourseRoom_(sourceRow && sourceRow[4]);
  var durationMinutes = getOrdinaryCourseDurationMinutes_(sourceRow && sourceRow[4]);
  if (!date || originalStartMinutes < 0 || !calendarId || !room) {
    throw new Error('代課時間或 OB Calendar ID 不完整，請重新整理。');
  }

  var actualStartMinutes = originalStartMinutes + delay;
  var endMinutes = actualStartMinutes + durationMinutes;
  var turnoverEndMinutes = endMinutes + 15;
  if (actualStartMinutes < 0 || actualStartMinutes >= 24 * 60 || endMinutes >= 24 * 60) {
    throw new Error('調整後課程不可跨日。');
  }

  var schedule = (courseRows || []).map(function(row) {
    var time = formatMyTime(row && row[1]);
    return {
      date: formatMyDate(row && row[0]),
      minutes: timeTextToMinutes_(time),
      room: getCourseRoom_(row && row[2]),
      calendarId: cleanText_(row && row[4]),
      durationMinutes: getScheduledCourseDurationMinutes_(row && row[2])
    };
  }).filter(function(course) {
    return course.date === date && course.room === room && course.minutes >= 0;
  }).sort(function(a, b) {
    return a.minutes - b.minutes;
  });

  if (!schedule.some(function(course) { return course.calendarId === calendarId; })) {
    throw new Error('原課程尚未出現在 OB 課表，請通知管理員重新同步。');
  }

  if (delay < 0) {
    var previous = schedule.filter(function(course) {
      return course.minutes < originalStartMinutes;
    }).slice(-1)[0] || null;
    if (previous && actualStartMinutes < previous.minutes + previous.durationMinutes + 15) {
      throw new Error('提早時間與上一堂課衝突，請聯絡管理員。');
    }
  }

  var conflicts = schedule.filter(function(course) {
    return course.minutes > originalStartMinutes && course.minutes < turnoverEndMinutes;
  });
  if (conflicts.length > 1) {
    throw new Error('延後會占用兩堂以上，請聯絡管理員。');
  }

  var occupiedRowIndex = -1;
  var occupiedSubstituteId = '';
  if (conflicts.length === 1) {
    var occupiedCalendarId = conflicts[0].calendarId;
    occupiedRowIndex = (leaveRows || []).findIndex(function(row) {
      return getEffectiveOpenLeaveCalendarId_(row) === occupiedCalendarId;
    });
    var occupiedRow = occupiedRowIndex >= 0 ? leaveRows[occupiedRowIndex] : null;
    if (!occupiedRow || !isOrdinaryOpenLeaveRow_(occupiedRow)) {
      throw new Error('延後時間與下一堂課衝突，請聯絡管理員。');
    }
    occupiedSubstituteId = cleanText_(occupiedRow[9]);
  }

  return {
    delayMinutes: delay,
    originalStartTime: originalStartTime,
    actualStartTime: minutesToTimeText_(actualStartMinutes),
    durationMinutes: durationMinutes,
    endTime: minutesToTimeText_(endMinutes),
    turnoverEndTime: minutesToTimeText_(turnoverEndMinutes),
    occupiedRowIndex: occupiedRowIndex,
    occupiedSubstituteId: occupiedSubstituteId
  };
}

function stripNewTeacherMarker_(courseName) {
  return cleanText_(String(courseName || '').replace(
    /\s*(?:〈\s*新老師\s*〉|<\s*新老師\s*>|（\s*新老師\s*）|\(\s*新老師\s*\)|【\s*新老師\s*】)\s*$/,
    ''
  ));
}

function getCoursePromotionType_(courseName) {
  var name = cleanText_(courseName);
  if (/(?:〈\s*新老師\s*〉|<\s*新老師\s*>|（\s*新老師\s*）|\(\s*新老師\s*\)|【\s*新老師\s*】)\s*$/.test(name)) {
    return 'new-teacher';
  }
  if (/(?:〈\s*優惠\s*〉|<\s*優惠\s*>|（\s*優惠\s*）|\(\s*優惠\s*\)|【\s*優惠\s*】)\s*$/.test(name)) {
    return 'monthly-discount';
  }
  return '';
}

function stripCoursePromotionMarker_(courseName) {
  return cleanText_(String(courseName || '').replace(
    /\s*(?:〈\s*(?:新老師|優惠)\s*〉|<\s*(?:新老師|優惠)\s*>|（\s*(?:新老師|優惠)\s*）|\(\s*(?:新老師|優惠)\s*\)|【\s*(?:新老師|優惠)\s*】)\s*$/,
    ''
  ));
}

function applyCoursePromotionType_(courseName, promotionType) {
  var baseName = stripCoursePromotionMarker_(courseName);
  return cleanText_(baseName + (promotionType === 'new-teacher' ? '〈新老師〉' : ''));
}

function stripCourseRoom_(courseName) {
  return stripCoursePromotionMarker_(
    String(courseName || '').replace(/^\s*[A-D]\s*[－—–-]\s*/i, '')
  );
}

function normalizeCourseCatalogKey_(courseName) {
  return stripCourseRoom_(courseName).replace(/\s+/g, ' ').trim();
}

function normalizeObClassCatalog_(rawClasses) {
  var seen = {};
  return (rawClasses || []).map(function(item) {
    var classId = cleanText_(item && (item.id || item.classId));
    var fullCourseName = cleanText_(item && (
      item.nameZhHant || item.nameEn || item.name || item.fullCourseName || item.courseName
    ));
    var promotionType = getCoursePromotionType_(fullCourseName);
    var courseName = stripCourseRoom_(fullCourseName);
    var courseKey = normalizeCourseCatalogKey_(courseName);
    if (!classId || !courseName || !courseKey || seen[classId]) return null;
    seen[classId] = true;
    return {
      classId: classId,
      fullCourseName: fullCourseName,
      courseName: courseName,
      courseKey: courseKey,
      room: getCourseRoom_(fullCourseName),
      category: getCourseCategory_(courseName),
      promotionType: promotionType
    };
  }).filter(Boolean).sort(function(a, b) {
    return [a.category, a.courseName, a.room, a.classId].join('|')
      .localeCompare([b.category, b.courseName, b.room, b.classId].join('|'));
  });
}

function buildClaimCourseOptions_(catalog, capabilities) {
  var allowed = {};
  (capabilities || []).forEach(function(category) { allowed[cleanText_(category)] = true; });
  var seen = {};
  return (catalog || []).filter(function(item) {
    return allowed[item.category];
  }).map(function(item) {
    var dedupeKey = item.category + '|' + item.courseKey;
    if (seen[dedupeKey]) return null;
    seen[dedupeKey] = true;
    return {
      courseKey: item.courseKey,
      courseName: item.courseName,
      category: item.category
    };
  }).filter(Boolean).sort(function(a, b) {
    return [a.category, a.courseName].join('|').localeCompare([b.category, b.courseName].join('|'));
  });
}

function parseExplicitCourseMinutes_(courseName) {
  var name = cleanText_(courseName).toLowerCase();
  var hourMatch = /(\d+(?:\.\d+)?)\s*(?:小時|hours?|hrs?)/i.exec(name);
  if (hourMatch) {
    var hourMinutes = Number(hourMatch[1]) * 60;
    return isFinite(hourMinutes) && hourMinutes > 0 ? Math.round(hourMinutes) : 0;
  }
  var minuteMatch = /(\d+)\s*(?:分鐘|分|min(?:ute)?s?)/i.exec(name);
  if (!minuteMatch) return 0;
  var minutes = Number(minuteMatch[1]);
  return isFinite(minutes) && minutes > 0 ? minutes : 0;
}

function normalizeClaimDifficulty_(value) {
  return cleanText_(value)
    .replace(/\s+/g, '')
    .replace(/[－—–-]/g, '~')
    .toLowerCase();
}

function parseClaimCourseOption_(courseNameValue) {
  var courseName = stripCourseRoom_(cleanText_(courseNameValue));
  var difficulty = '';
  var difficultyMatch = /(?:^|\s)(Lv\.?\s*\d+(?:\s*[~\-–—]\s*\d+)?|Open\s*level)(?=\s|[（(〈]|$)/i.exec(courseName);
  if (difficultyMatch) {
    difficulty = cleanText_(difficultyMatch[1]);
    if (/^open/i.test(difficulty)) {
      difficulty = 'Open level';
    } else {
      difficulty = difficulty
        .replace(/^lv\.?\s*/i, 'Lv.')
        .replace(/\s*([~\-–—])\s*/g, '$1');
    }
    courseName = cleanText_(courseName.replace(difficultyMatch[0], ' '))
      .replace(/\s+([（(〈])/g, '$1');
  }
  courseName = cleanText_(courseName.replace(
    /\s*(?:〈\s*優惠\s*〉|<\s*優惠\s*>|（\s*優惠\s*）|\(\s*優惠\s*\)|【\s*優惠\s*】|\s+優惠)\s*$/,
    ''
  ));
  return {
    courseTypeKey: normalizeCourseCatalogKey_(courseName),
    courseTypeName: courseName,
    difficulty: difficulty
  };
}

function getCourseWeekdayNumber_(dateValue) {
  var match = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(formatMyDate(dateValue));
  if (!match) return '';
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).getUTCDay();
}

function getCourseMonthKey_(dateValue) {
  var match = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(formatMyDate(dateValue));
  if (!match) return '';
  return match[1] + '-' + String(Number(match[2])).padStart(2, '0');
}

function isTeacherNewInMonth_(teacherName, targetDate, courseRows) {
  var teacher = cleanText_(teacherName);
  var monthKey = getCourseMonthKey_(targetDate);
  if (!teacher || !monthKey) return false;
  return (courseRows || []).some(function(row) {
    return cleanText_(row && row[3]) === teacher &&
      getCourseMonthKey_(row && row[0]) === monthKey &&
      getCoursePromotionType_(row && row[2]) === 'new-teacher';
  });
}

function buildNewTeacherMonthMap_(courseRows) {
  var lookup = {};
  (courseRows || []).forEach(function(row) {
    if (getCoursePromotionType_(row && row[2]) !== 'new-teacher') return;
    var teacher = cleanText_(row && row[3]);
    var monthKey = getCourseMonthKey_(row && row[0]);
    if (teacher && monthKey) lookup[JSON.stringify([teacher, monthKey])] = true;
  });
  return lookup;
}

function isTeacherNewInMonthMap_(teacherName, targetDate, lookup) {
  var teacher = cleanText_(teacherName);
  var monthKey = getCourseMonthKey_(targetDate);
  return !!(teacher && monthKey && lookup && lookup[JSON.stringify([teacher, monthKey])]);
}

function isTermCourseName_(courseName) {
  return cleanText_(courseName).indexOf('期班') !== -1;
}

function shiftMonthKey_(monthValue, offsetValue) {
  var match = /^(\d{4})-(\d{2})$/.exec(cleanText_(monthValue));
  if (!match) throw new Error('月份格式不正確。');
  var shifted = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + Number(offsetValue || 0), 1));
  return shifted.getUTCFullYear() + '-' + String(shifted.getUTCMonth() + 1).padStart(2, '0');
}

function getMonthDistance_(fromMonthValue, toMonthValue) {
  var fromMatch = /^(\d{4})-(\d{2})$/.exec(cleanText_(fromMonthValue));
  var toMatch = /^(\d{4})-(\d{2})$/.exec(cleanText_(toMonthValue));
  if (!fromMatch || !toMatch) return null;
  return (Number(toMatch[1]) * 12 + Number(toMatch[2])) -
    (Number(fromMatch[1]) * 12 + Number(fromMatch[2]));
}

function normalizeDiscountTeacherKey_(value) {
  var text = cleanText_(value).toLowerCase().replace(/\s+/g, '');
  if (!text) return '';
  if (text === '77' || text.indexOf('芮錤') !== -1 || text.indexOf('芮錶') !== -1) return '77';
  if (text.indexOf('小mo') !== -1) return '小mo';
  if (text.indexOf('sherry') !== -1 || text.indexOf('雪莉') !== -1) return '雪莉';
  if (text.indexOf('妙妙') !== -1) return '妙妙';
  if (text.indexOf('carrie') !== -1) return 'carrie';
  if (text.indexOf('vicky') !== -1) return 'vicky';
  if (text.indexOf('ariel') !== -1) return 'ariel';
  if (text.indexOf('liz') !== -1) return 'liz';
  if (text.indexOf('蜜莉') !== -1) return '蜜莉';
  if (text.indexOf('芊芊') !== -1) return '芊芊';
  if (text.indexOf('nana') !== -1 || text.indexOf('@n.a') !== -1) return 'nana';
  if (text === '巧巧' || text === '巧') return '巧';
  if (text.indexOf('嗨底') !== -1 || text.indexOf('heidi') !== -1) return '嗨底';
  return text.replace(/[^a-z0-9\u3400-\u9fff]/g, '');
}

function normalizeDiscountCourseKey_(value) {
  var text = stripCourseRoom_(value).toLowerCase()
    .replace(/空中環/g, '空環')
    .replace(/^環(?=\s*(?:lv\.?\s*)?\d|$)/, '空環')
    .replace(/lv\.?/g, '')
    .replace(/[－—–-]/g, '~')
    .replace(/\s+/g, '');
  return text.replace(/[^a-z0-9\u3400-\u9fff~]/g, '');
}

function getMonthlyDiscountEvaluationMonths_(recommendationMonthValue) {
  var month = cleanText_(recommendationMonthValue);
  return [shiftMonthKey_(month, -3), shiftMonthKey_(month, -2)];
}

function getDiscountCourseDescriptor_(row) {
  var courseName = cleanText_(row && row[2]);
  return {
    month: getCourseMonthKey_(row && row[0]),
    weekday: getCourseWeekdayNumber_(row && row[0]),
    time: formatMyTime(row && row[1]),
    room: getCourseRoom_(courseName),
    courseName: stripCoursePromotionMarker_(courseName),
    courseKey: normalizeDiscountCourseKey_(courseName),
    teacherName: cleanText_(row && row[3]),
    teacherKey: normalizeDiscountTeacherKey_(row && row[3]),
    calendarId: cleanText_(row && row[4]),
    isSubstitute: ['是', 'true', '1'].indexOf(cleanText_(row && row[7]).toLowerCase()) !== -1,
    promotionType: getCoursePromotionType_(courseName)
  };
}

function getDiscountSlotKey_(itemValue) {
  var item = itemValue || {};
  return [
    String(item.weekday), cleanText_(item.time), cleanText_(item.room),
    normalizeDiscountTeacherKey_(item.teacherName || item.teacherKey),
    normalizeDiscountCourseKey_(item.courseName || item.courseKey)
  ].join('|');
}

function discountDescriptorsMatch_(candidateValue, comparisonValue) {
  var candidate = candidateValue || {};
  var comparison = comparisonValue || {};
  if (String(candidate.weekday) !== String(comparison.weekday)) return false;
  if (cleanText_(candidate.time) !== cleanText_(comparison.time)) return false;
  if (normalizeDiscountTeacherKey_(candidate.teacherName || candidate.teacherKey) !==
      normalizeDiscountTeacherKey_(comparison.teacherName || comparison.teacherKey)) return false;
  var leftCourse = normalizeDiscountCourseKey_(candidate.courseName || candidate.courseKey);
  var rightCourse = normalizeDiscountCourseKey_(comparison.courseName || comparison.courseKey);
  if (leftCourse && rightCourse && leftCourse !== rightCourse) return false;
  var leftRoom = cleanText_(candidate.room);
  var rightRoom = cleanText_(comparison.room);
  return !leftRoom || !rightRoom || leftRoom === rightRoom;
}

function isDiscountRecommendationCourseEligible_(descriptor) {
  var item = descriptor || {};
  var courseName = cleanText_(item.courseName);
  if (!item.month || item.weekday === '' || !item.time || !item.teacherName || !courseName) return false;
  if (item.isSubstitute || item.promotionType) return false;
  if (isVenueRentalCourseName_(courseName) || isTermCourseName_(courseName)) return false;
  if (/特別課|自主練習|私人包班/.test(courseName)) return false;
  return true;
}

function buildMonthlyDiscountCandidates_(courseRowsValue, observationRowsValue, historyRowsValue, recommendationMonthValue) {
  var recommendationMonth = cleanText_(recommendationMonthValue);
  if (!/^\d{4}-\d{2}$/.test(recommendationMonth)) throw new Error('推薦月份格式不正確。');
  var evaluationMonths = getMonthlyDiscountEvaluationMonths_(recommendationMonth);
  var evaluationMonthSet = {};
  evaluationMonths.forEach(function(month) { evaluationMonthSet[month] = true; });
  var history = (historyRowsValue || []).map(function(row) {
    return {
      month: cleanText_(row && row[0]), slotKey: cleanText_(row && row[1]),
      weekday: row && row[2], time: formatMyTime(row && row[3]), room: cleanText_(row && row[4]),
      courseName: cleanText_(row && row[5]), teacherName: cleanText_(row && row[6])
    };
  });
  var seen = {};
  var candidates = [];
  (courseRowsValue || []).forEach(function(row) {
    var descriptor = getDiscountCourseDescriptor_(row);
    if (descriptor.month !== recommendationMonth || !isDiscountRecommendationCourseEligible_(descriptor)) return;
    descriptor.slotKey = getDiscountSlotKey_(descriptor);
    if (seen[descriptor.slotKey]) return;
    seen[descriptor.slotKey] = true;
    var inCooldown = history.some(function(item) {
      var distance = getMonthDistance_(item.month, recommendationMonth);
      if (distance !== 1 && distance !== 2) return false;
      return (item.slotKey && item.slotKey === descriptor.slotKey) ||
        discountDescriptorsMatch_(descriptor, item);
    });
    if (inCooldown) return;

    var totals = { observed: 0, missed: 0, lastMissDate: '' };
    (observationRowsValue || []).forEach(function(observationRow) {
      var observationMonth = cleanText_(observationRow && observationRow[2]);
      if (!evaluationMonthSet[observationMonth] || cleanText_(observationRow && observationRow[13])) return;
      var observation = {
        slotKey: cleanText_(observationRow && observationRow[1]),
        weekday: observationRow && observationRow[3],
        time: formatMyTime(observationRow && observationRow[4]),
        room: cleanText_(observationRow && observationRow[5]),
        courseName: cleanText_(observationRow && observationRow[6]),
        teacherName: cleanText_(observationRow && observationRow[7])
      };
      if (!((observation.slotKey && observation.slotKey === descriptor.slotKey) ||
            discountDescriptorsMatch_(descriptor, observation))) return;
      var observed = Math.max(0, Number(observationRow[9]) || 0);
      var missed = Math.max(0, Number(observationRow[10]) || 0);
      totals.observed += observed;
      totals.missed += Math.min(observed || missed, missed);
      var missedDate = cleanText_(observationRow[11]);
      if (missedDate && missedDate > totals.lastMissDate) totals.lastMissDate = missedDate;
    });
    var missRate = totals.observed ? totals.missed / totals.observed : 0;
    var recencyScore = Number((totals.lastMissDate || '').replace(/\D/g, '').slice(-8)) || 0;
    var score = Math.round(missRate * 1000000) + totals.missed * 10000 + recencyScore;
    candidates.push({
      slotKey: descriptor.slotKey,
      weekday: descriptor.weekday,
      time: descriptor.time,
      room: descriptor.room,
      courseName: descriptor.courseName,
      teacherName: descriptor.teacherName,
      calendarId: descriptor.calendarId,
      observedSessions: totals.observed,
      missedSessions: totals.missed,
      missRate: missRate,
      lastMissDate: totals.lastMissDate,
      score: score,
      evaluationMonths: evaluationMonths.slice(),
      reason: totals.observed
        ? '近兩個完整月份未開 ' + totals.missed + '/' + totals.observed + ' 堂（' +
          Math.round(missRate * 100) + '%）' + (totals.lastMissDate ? '；最近未開：' + totals.lastMissDate : '')
        : '歷史資料不足，依候選排序補足'
    });
  });
  return candidates.sort(function(left, right) {
    if (right.score !== left.score) return right.score - left.score;
    return left.slotKey.localeCompare(right.slotKey);
  });
}

function selectMonthlyDiscountRecommendations_(candidatesValue, countValue) {
  var required = Math.max(1, Number(countValue) || 3);
  var candidates = (candidatesValue || []).slice();
  if (candidates.length < required) {
    throw new Error('下個月符合條件的常態課不足 ' + required + ' 堂，無法建立完整推薦。');
  }
  return {
    primary: candidates.slice(0, required),
    alternates: candidates.slice(required)
  };
}

function getMonthlyDiscountDueMonth_(dateKeyValue, timeValue) {
  var dateKey = cleanText_(dateKeyValue);
  var time = cleanText_(timeValue);
  var match = /^(\d{4})-(\d{2})-05$/.exec(dateKey);
  if (!match || !/^22:0[0-4]$/.test(time)) return '';
  return shiftMonthKey_(match[1] + '-' + match[2], 1);
}

function getLegacyMonthlyDiscountHistorySeed_() {
  return [
    ['2026-03', '', 2, '10:30', 'C', '空環 Lv.0-1', '壹壹'],
    ['2026-03', '', 6, '16:30', 'B', '空環 Lv.0', 'Liz'],
    ['2026-03', '', 0, '13:30', 'D', '空環 Lv.0-1', '小mo'],
    ['2026-04', '', 1, '21:30', 'A', '空瑜 Lv.0', 'Chin'],
    ['2026-04', '', 2, '15:30', 'C', '舞綢 Lv.1-2', 'Vivi'],
    ['2026-04', '', 2, '21:00', 'D', '空瑜 Lv.1-2', '姝姝'],
    ['2026-05', '', 2, '21:00', 'D', '空瑜 Lv.1-2', '姝姝'],
    ['2026-05', '', 0, '11:00', 'C', '空環 Lv.0', '蜜莉'],
    ['2026-05', '', 0, '19:00', 'A', '現代小品', '77'],
    ['2026-06', '', 3, '13:30', 'C', '空瑜 Lv.0-1', '壹壹'],
    ['2026-06', '', 4, '13:45', 'B', '舞綢 Lv.1-2', 'Vivi'],
    ['2026-06', '', 5, '14:30', 'D', '現代小品', '77'],
    ['2026-07', '', 1, '10:30', '', '空環 Lv.2-3', 'Tako'],
    ['2026-07', '', 6, '15:30', '', '舞綢 Lv.3-5', '雪莉'],
    ['2026-07', '', 6, '18:30', '', '空環 Lv.0', '寧寧'],
    ['2026-08', '', 1, '12:30', 'A', '空瑜 Lv.0', '妙妙'],
    ['2026-08', '', 6, '17:00', 'D', '空環 Lv.1-2', '寧寧'],
    ['2026-08', '', 0, '19:00', 'B', '舞綢 Lv.1-2', '小mo'],
    ['2026-09', '', 3, '18:30', '', '空環 Lv.0', 'Carrie'],
    ['2026-09', '', 4, '21:30', '', '空瑜 Lv.1-2', 'Chin'],
    ['2026-09', '', 0, '13:15', '', '綢吊 Lv.0-2', '妙妙']
  ].map(function(row) {
    var descriptor = {
      weekday: row[2], time: row[3], room: row[4], courseName: row[5], teacherName: row[6]
    };
    row[1] = getDiscountSlotKey_(descriptor);
    return row.concat(['歷史人工整理', '', '', '']);
  });
}

function getLegacyMonthlyDiscountObservationSeed_() {
  var source = [
    '2026-07|1|10:30|巧巧|環1-2|4|2','2026-07|1|11:00|小美|綢吊|4|3','2026-07|1|21:30|Chin|空瑜0|4|4',
    '2026-07|2|10:00|Wen|環0|4|4','2026-07|2|10:30|壹壹|環0-1|4|4','2026-07|2|12:30|芊芊|舞綢2|4|2','2026-07|2|14:30|珍珍|空瑜0-2|4|2','2026-07|2|15:30|Vivi|舞綢1-2|4|4','2026-07|2|18:30|珍珍|空瑜0-2|4|2','2026-07|2|21:00|姝姝|空瑜1-2|4|4',
    '2026-07|3|10:30|Tako|環1-2|5|3','2026-07|3|12:30|芊芊|舞綢1-2|5|2','2026-07|3|13:30|壹壹|空瑜0-1|5|5','2026-07|3|14:30|Jina|後彎基本|5|3','2026-07|3|18:30|Carrie|環0|5|4','2026-07|3|19:10|嗨底|環1|5|2','2026-07|3|21:30|Chin|空瑜0|5|5',
    '2026-07|4|11:00|珍珍|空瑜0-2|5|3','2026-07|4|12:15|Vivi|空瑜0-2|5|3','2026-07|4|12:15|Ariel|皮拉提斯|5|4','2026-07|4|13:45|Vivi|舞綢1-2|5|2','2026-07|4|15:15|Vivi|空瑜0-2|5|2','2026-07|4|15:30|芊芊|環1-2|5|4','2026-07|4|17:30|芮錶|現代小品|5|3','2026-07|4|21:15|妙妙|空瑜0|5|3','2026-07|4|21:30|Chin|空瑜1-2|5|5','2026-07|4|21:30|Wen|環0|5|4',
    '2026-07|5|11:00|芮錶|環0|5|2','2026-07|5|12:30|Ariel|皮拉提斯|5|4','2026-07|5|12:30|Tako|環1|5|2','2026-07|5|14:00|Nana|舞綢2-3|5|4','2026-07|5|14:15|小Mo|環1-2|5|2','2026-07|5|14:30|芮錶|現代小品|5|4','2026-07|5|17:15|小美|舞綢2-4|5|2','2026-07|5|20:00|Tako|環1|5|2',
    '2026-07|6|12:00|Ariel|空瑜2-4|4|2','2026-07|6|14:30|萱|舞綢1|4|2','2026-07|6|17:00|寧寧|環1-2|4|2','2026-07|6|18:30|寧寧|環0|4|2','2026-07|6|18:30|萱|空瑜2-4|4|2','2026-07|6|19:45|Wen|環0|4|2',
    '2026-07|0|11:00|蜜莉|環0|4|2','2026-07|0|11:30|Chloe|空瑜3-4|4|2','2026-07|0|11:30|小Mo|環0-1|4|4','2026-07|0|12:10|蜜莉|環1-2|4|2','2026-07|0|13:15|妙妙|綢吊|4|4','2026-07|0|13:30|小Mo|環0-1|4|3','2026-07|0|15:00|Vivi|舞綢2|4|3','2026-07|0|15:00|小Mo|舞綢1-2|4|4','2026-07|0|19:00|小Mo|舞綢1-2|4|2','2026-07|0|19:00|芮錶|現代小品|4|2',
    '2026-08|1|10:30|Tako|環2-3|5|3','2026-08|1|10:45|Melody|皮拉提斯|5|5','2026-08|1|11:00|小美|綢吊|5|3','2026-08|1|12:00|巧巧|環2-3|5|3','2026-08|1|12:00|番茄|柔軟度開發|5|5','2026-08|1|12:30|妙妙|空瑜0|5|3','2026-08|1|13:15|番茄|環0|5|4','2026-08|1|14:00|壹壹|環1-2|5|4','2026-08|1|21:30|Chin|空瑜0|5|4',
    '2026-08|2|10:00|Wen|環0|4|2','2026-08|2|10:30|壹壹|環0-1|4|4','2026-08|2|14:30|珍珍|空瑜0-2|4|3','2026-08|2|15:30|Vivi|舞綢1-2|4|2','2026-08|2|21:00|姝姝|空瑜1-2|4|3',
    '2026-08|3|10:30|Melody|空瑜0-2|4|4','2026-08|3|11:30|雪莉|舞綢1|4|2','2026-08|3|11:45|Melody|皮拉提斯|4|4','2026-08|3|13:30|壹壹|空瑜0-1|4|3','2026-08|3|14:30|Jina|後彎基本|4|2','2026-08|3|19:10|嗨底|環1|4|3','2026-08|3|21:30|Chin|空瑜0|4|4',
    '2026-08|4|10:00|Xuan|環3-4|4|2','2026-08|4|11:00|珍珍|空瑜0-2|4|3','2026-08|4|12:15|Vivi|空瑜0-2|4|3','2026-08|4|12:15|Ariel|皮拉提斯|4|4','2026-08|4|12:30|Tako|環2-3|4|2','2026-08|4|13:45|Vivi|舞綢1-2|4|2','2026-08|4|15:15|Vivi|空瑜0-2|4|3','2026-08|4|17:30|芮錶|現代小品|4|3','2026-08|4|18:45|Ariel|舞綢1|4|2','2026-08|4|21:15|妙妙|空瑜0|4|2','2026-08|4|21:30|Chin|空瑜1-2|4|4',
    '2026-08|5|11:00|芮錶|環0|4|2','2026-08|5|12:30|Ariel|皮拉提斯|4|4','2026-08|5|12:30|Tako|環1|4|2','2026-08|5|14:00|Nana|舞綢2-3|4|3','2026-08|5|14:30|芮錶|現代小品|4|4','2026-08|5|17:15|小美|舞綢2-4|4|3','2026-08|5|20:00|Tako|環1|4|4',
    '2026-08|6|12:30|雪莉|舞綢2|5|2','2026-08|6|14:30|萱|舞綢1|5|2','2026-08|6|15:30|雪莉|舞綢3-5|5|4','2026-08|6|15:45|萱|空瑜0|5|5','2026-08|6|17:00|寧寧|環1-2|5|3','2026-08|6|18:15|Lily|舞綢3-5|5|2','2026-08|6|18:30|寧寧|環0|5|4','2026-08|6|18:30|萱|空瑜2-4|5|5',
    '2026-08|0|11:00|蜜莉|環0|5|4','2026-08|0|12:10|蜜莉|環1-2|5|3','2026-08|0|12:45|Chloe|空瑜1-2|5|2','2026-08|0|13:30|小Mo|環0-1|5|4','2026-08|0|15:00|小Mo|舞綢1-2|5|4','2026-08|0|17:00|小Mo|空瑜1-2|5|3','2026-08|0|19:00|小Mo|舞綢1-2|5|4','2026-08|0|19:00|芮錶|現代小品|5|4','2026-08|0|20:15|Wen|環0|5|3'
  ];
  return source.map(function(line, index) {
    var parts = line.split('|');
    var descriptor = {
      weekday: Number(parts[1]), time: parts[2], room: '', courseName: parts[4], teacherName: parts[3]
    };
    return [
      'legacy-2026-' + String(index + 1).padStart(3, '0'), getDiscountSlotKey_(descriptor),
      parts[0], Number(parts[1]), parts[2], '', parts[4], parts[3], '',
      Number(parts[5]), Number(parts[6]), '', '2026課程產出概況', '', '2026-09-05 22:00:00'
    ];
  });
}

function ensureMonthlyDiscountStructureUnlocked_(spreadsheet) {
  var observationSheet = ensureSupportingSheet_(spreadsheet, SHEETS.DISCOUNT_OBSERVATIONS, SHEET_HEADERS.DISCOUNT_OBSERVATIONS);
  var historySheet = ensureSupportingSheet_(spreadsheet, SHEETS.DISCOUNT_HISTORY, SHEET_HEADERS.DISCOUNT_HISTORY);
  var recommendationSheet = ensureSupportingSheet_(spreadsheet, SHEETS.DISCOUNT_RECOMMENDATIONS, SHEET_HEADERS.DISCOUNT_RECOMMENDATIONS);
  if (observationSheet.getLastRow() === 1) {
    var observations = getLegacyMonthlyDiscountObservationSeed_();
    if (observations.length) observationSheet.getRange(2, 1, observations.length, SHEET_HEADERS.DISCOUNT_OBSERVATIONS.length).setValues(observations);
  }
  if (historySheet.getLastRow() === 1) {
    var history = getLegacyMonthlyDiscountHistorySeed_();
    if (history.length) historySheet.getRange(2, 1, history.length, SHEET_HEADERS.DISCOUNT_HISTORY.length).setValues(history);
  }
  return {
    observations: observationSheet.getName(),
    history: historySheet.getName(),
    recommendations: recommendationSheet.getName()
  };
}

function toMonthlyDiscountRecommendationItem_(row, rowNumber) {
  return {
    rowNumber: rowNumber,
    batchId: cleanText_(row && row[0]),
    month: cleanText_(row && row[1]),
    itemId: cleanText_(row && row[2]),
    type: cleanText_(row && row[3]),
    rank: Number(row && row[4]) || 0,
    slotKey: cleanText_(row && row[5]),
    weekday: Number(row && row[6]),
    time: formatMyTime(row && row[7]),
    room: cleanText_(row && row[8]),
    courseName: cleanText_(row && row[9]),
    teacherName: cleanText_(row && row[10]),
    observedSessions: Number(row && row[11]) || 0,
    missedSessions: Number(row && row[12]) || 0,
    missRate: Number(row && row[13]) || 0,
    lastMissDate: cleanText_(row && row[14]),
    score: Number(row && row[15]) || 0,
    reason: cleanText_(row && row[16]),
    status: cleanText_(row && row[17]),
    createdAt: cleanText_(row && row[18]),
    updatedAt: cleanText_(row && row[19]),
    actor: cleanText_(row && row[20])
  };
}

function getMonthlyDiscountDashboardUnlocked_(spreadsheet) {
  var recommendationSheet = spreadsheet.getSheetByName(SHEETS.DISCOUNT_RECOMMENDATIONS);
  var historySheet = spreadsheet.getSheetByName(SHEETS.DISCOUNT_HISTORY);
  if (!recommendationSheet || !historySheet) {
    return {
      available: false, month: getNextMonthKey_(new Date(currentTimeMs_())),
      batchId: '', status: '', pendingCount: 0, recommendations: [], alternates: [], history: []
    };
  }
  assertHeaders_(recommendationSheet, SHEET_HEADERS.DISCOUNT_RECOMMENDATIONS);
  assertHeaders_(historySheet, SHEET_HEADERS.DISCOUNT_HISTORY);
  var all = recommendationSheet.getDataRange().getValues().slice(1).map(function(row, index) {
    return toMonthlyDiscountRecommendationItem_(row, index + 2);
  }).filter(function(item) {
    return item.batchId && item.status !== '已重算';
  });
  var latest = all.slice().sort(function(left, right) {
    return right.createdAt.localeCompare(left.createdAt) || right.batchId.localeCompare(left.batchId);
  })[0] || null;
  var batchRows = latest ? all.filter(function(item) { return item.batchId === latest.batchId; }) : [];
  var recommendations = batchRows.filter(function(item) { return item.type === '推薦'; })
    .sort(function(left, right) { return left.rank - right.rank; });
  var alternates = batchRows.filter(function(item) { return item.type === '候補'; })
    .sort(function(left, right) { return left.rank - right.rank; });
  var history = historySheet.getDataRange().getValues().slice(1).map(function(row) {
    return {
      month: cleanText_(row[0]), weekday: Number(row[2]), time: formatMyTime(row[3]),
      room: cleanText_(row[4]), courseName: cleanText_(row[5]), teacherName: cleanText_(row[6]),
      source: cleanText_(row[7]), confirmedAt: cleanText_(row[9]), confirmedBy: cleanText_(row[10])
    };
  }).sort(function(left, right) {
    return right.month.localeCompare(left.month) || left.weekday - right.weekday || left.time.localeCompare(right.time);
  }).slice(0, 36);
  var pendingCount = recommendations.filter(function(item) { return item.status === '待確認'; }).length;
  return {
    available: true,
    month: latest ? latest.month : getNextMonthKey_(new Date(currentTimeMs_())),
    batchId: latest ? latest.batchId : '',
    status: pendingCount ? '待確認' : (latest ? latest.status : ''),
    pendingCount: pendingCount,
    recommendations: recommendations,
    alternates: alternates,
    history: history
  };
}

function getMonthlyDiscountDashboard_(session) {
  assertCapabilitySession_(session, 'course_admin');
  return getMonthlyDiscountDashboardUnlocked_(SpreadsheetApp.getActiveSpreadsheet());
}

function appendMonthlyDiscountBatchUnlocked_(sheet, month, actor, selection) {
  var batchId = Utilities.getUuid();
  var nowText = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
  var rows = [];
  function append(items, type) {
    (items || []).forEach(function(item, index) {
      rows.push([
        batchId, month, Utilities.getUuid(), type, index + 1, item.slotKey, item.weekday,
        item.time, item.room, item.courseName, item.teacherName, item.observedSessions,
        item.missedSessions, item.missRate, item.lastMissDate, item.score, item.reason,
        '待確認', nowText, nowText, actor
      ]);
    });
  }
  append(selection.primary, '推薦');
  append(selection.alternates, '候補');
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, SHEET_HEADERS.DISCOUNT_RECOMMENDATIONS.length).setValues(rows);
  return { batchId: batchId, createdAt: nowText };
}

function generateMonthlyDiscountRecommendationsCore_(actorValue, monthValue, forceValue) {
  var actor = cleanText_(actorValue) || '系統每月推薦';
  var month = cleanText_(monthValue);
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('推薦月份格式不正確。');
  var created = false;
  var dashboard = withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureMonthlyDiscountStructureUnlocked_(ss);
    var recommendationSheet = requireSheet_(ss, SHEETS.DISCOUNT_RECOMMENDATIONS);
    var current = getMonthlyDiscountDashboardUnlocked_(ss);
    if (current.batchId && current.month === month && !forceValue) return current;
    if (current.batchId && current.month === month && current.status === '已確認') {
      throw new Error('這個月份的優惠課已確認，不會自動覆蓋。');
    }
    if (current.batchId && current.month === month) {
      current.recommendations.concat(current.alternates).forEach(function(item) {
        recommendationSheet.getRange(item.rowNumber, 18, 1, 4).setValues([[
          '已重算', item.createdAt,
          Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss'), actor
        ]]);
      });
    }
    var courseRows = requireSheet_(ss, SHEETS.COURSE_LIST).getDataRange().getValues().slice(1);
    var observationRows = requireSheet_(ss, SHEETS.DISCOUNT_OBSERVATIONS).getDataRange().getValues().slice(1);
    var historyRows = requireSheet_(ss, SHEETS.DISCOUNT_HISTORY).getDataRange().getValues().slice(1);
    var candidates = buildMonthlyDiscountCandidates_(courseRows, observationRows, historyRows, month);
    var selection = selectMonthlyDiscountRecommendations_(candidates, 3);
    appendMonthlyDiscountBatchUnlocked_(recommendationSheet, month, actor, selection);
    created = true;
    return getMonthlyDiscountDashboardUnlocked_(ss);
  });
  if (created) {
    sendPushAfterMutationSafely_(getActiveCourseAdminNames_(), {
      heading: dashboard.month + ' 優惠課待確認',
      content: '系統已選出 3 堂點數優惠課，請到管理平台確認。',
      url: buildAppViewUrl_('admin', 'closureManagement')
    });
  }
  dashboard.created = created;
  return dashboard;
}

function generateMonthlyDiscountRecommendations_(session) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  return generateMonthlyDiscountRecommendationsCore_(actor, getNextMonthKey_(new Date(currentTimeMs_())), true);
}

function replaceMonthlyDiscountRecommendation_(session, itemIdValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var itemId = cleanText_(itemIdValue);
  if (!itemId) throw new Error('找不到要替換的推薦。');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dashboard = getMonthlyDiscountDashboardUnlocked_(ss);
    if (dashboard.status !== '待確認') throw new Error('目前沒有待確認的優惠課推薦。');
    var outgoing = dashboard.recommendations.filter(function(item) { return item.itemId === itemId; })[0];
    var incoming = dashboard.alternates[0];
    if (!outgoing || !incoming) throw new Error('目前沒有可替換的候補課程。');
    var sheet = requireSheet_(ss, SHEETS.DISCOUNT_RECOMMENDATIONS);
    var nowText = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    sheet.getRange(outgoing.rowNumber, 4, 1, 18).setValues([[
      '候補', dashboard.alternates.length, outgoing.slotKey, outgoing.weekday, outgoing.time, outgoing.room,
      outgoing.courseName, outgoing.teacherName, outgoing.observedSessions, outgoing.missedSessions,
      outgoing.missRate, outgoing.lastMissDate, outgoing.score, outgoing.reason, '待確認',
      outgoing.createdAt, nowText, actor
    ]]);
    sheet.getRange(incoming.rowNumber, 4, 1, 18).setValues([[
      '推薦', outgoing.rank, incoming.slotKey, incoming.weekday, incoming.time, incoming.room,
      incoming.courseName, incoming.teacherName, incoming.observedSessions, incoming.missedSessions,
      incoming.missRate, incoming.lastMissDate, incoming.score, incoming.reason, '待確認',
      incoming.createdAt, nowText, actor
    ]]);
    return getMonthlyDiscountDashboardUnlocked_(ss);
  });
}

function confirmMonthlyDiscountRecommendations_(session, batchIdValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var batchId = cleanText_(batchIdValue);
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dashboard = getMonthlyDiscountDashboardUnlocked_(ss);
    if (!batchId || dashboard.batchId !== batchId || dashboard.status !== '待確認') {
      throw new Error('這批優惠課已更新，請重新整理後再確認。');
    }
    if (dashboard.recommendations.length !== 3) throw new Error('優惠課必須剛好 3 堂。');
    var recommendationSheet = requireSheet_(ss, SHEETS.DISCOUNT_RECOMMENDATIONS);
    var historySheet = requireSheet_(ss, SHEETS.DISCOUNT_HISTORY);
    var nowText = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    dashboard.recommendations.concat(dashboard.alternates).forEach(function(item) {
      recommendationSheet.getRange(item.rowNumber, 18, 1, 4).setValues([[
        '已確認', item.createdAt, nowText, actor
      ]]);
    });
    var historyRows = dashboard.recommendations.map(function(item) {
      return [dashboard.month, item.slotKey, item.weekday, item.time, item.room, item.courseName,
        item.teacherName, '每月系統推薦', dashboard.batchId, nowText, actor];
    });
    historySheet.getRange(historySheet.getLastRow() + 1, 1, historyRows.length, SHEET_HEADERS.DISCOUNT_HISTORY.length).setValues(historyRows);
    return getMonthlyDiscountDashboardUnlocked_(ss);
  });
}

function runMonthlyDiscountRecommendationScheduler_(dateKey, time) {
  var month = getMonthlyDiscountDueMonth_(dateKey, time);
  if (!month) return { skipped: true, reason: 'outside-window' };
  return generateMonthlyDiscountRecommendationsCore_('系統每月推薦', month, false);
}

function buildRecurringClaimCourseOptions_(courseRows, capabilities) {
  var allowed = {};
  (capabilities || []).forEach(function(category) {
    allowed[cleanText_(category)] = true;
  });
  var recurrenceCounts = {};
  var candidates = [];
  (courseRows || []).forEach(function(row) {
    var fullCourseName = cleanText_(row && row[2]);
    var courseName = stripCourseRoom_(fullCourseName);
    var courseKey = normalizeCourseCatalogKey_(courseName);
    var room = getCourseRoom_(fullCourseName);
    var time = formatMyTime(row && row[1]);
    var weekday = getCourseWeekdayNumber_(row && row[0]);
    var category = getCourseCategory_(courseName);
    if (!courseName || !courseKey || !room || time === '' || weekday === '' ||
        !allowed[category] || /特別課|場地租借/.test(courseName) || isTermCourseName_(courseName)) {
      return;
    }
    var recurrenceKey = [room, courseKey, weekday, time].join('|');
    var courseParts = parseClaimCourseOption_(courseName);
    recurrenceCounts[recurrenceKey] = (recurrenceCounts[recurrenceKey] || 0) + 1;
    candidates.push({
      recurrenceKey: recurrenceKey,
      courseKey: courseKey,
      courseName: courseName,
      courseTypeKey: courseParts.courseTypeKey,
      courseTypeName: courseParts.courseTypeName,
      difficulty: courseParts.difficulty,
      category: category,
      durationMinutes: parseExplicitCourseMinutes_(courseName)
    });
  });

  var seen = {};
  return candidates.filter(function(item) {
    if (recurrenceCounts[item.recurrenceKey] < 2) return false;
    var key = [
      item.category,
      normalizeCourseCatalogKey_(item.courseTypeKey),
      normalizeClaimDifficulty_(item.difficulty)
    ].join('|');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  }).map(function(item) {
    return {
      courseKey: item.courseKey,
      courseName: item.courseName,
      courseTypeKey: item.courseTypeKey,
      courseTypeName: item.courseTypeName,
      difficulty: item.difficulty,
      category: item.category,
      durationMinutes: item.durationMinutes
    };
  }).sort(function(a, b) {
    return [a.category, a.courseName].join('|').localeCompare([b.category, b.courseName].join('|'));
  });
}

function getRecurringClaimOptionsForTeacher_(teacher) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
  var courseRows = courseSheet.getDataRange().getValues().slice(1);
  return buildRecurringClaimCourseOptions_(
    courseRows,
    getEffectiveTeacherCapabilities_(teacher, courseRows)
  );
}

function findRecurringClaimOptionForTeacher_(teacher, courseTypeKey, difficulty) {
  var wantedType = normalizeCourseCatalogKey_(courseTypeKey);
  var wantedDifficulty = normalizeClaimDifficulty_(difficulty);
  return getRecurringClaimOptionsForTeacher_(teacher).filter(function(option) {
    return normalizeCourseCatalogKey_(option.courseTypeKey) === wantedType &&
      normalizeClaimDifficulty_(option.difficulty) === wantedDifficulty;
  })[0] || null;
}

function timeTextToMinutes_(timeValue) {
  var match = /^(\d{1,2}):(\d{2})$/.exec(formatMyTime(timeValue));
  if (!match) return -1;
  var hours = Number(match[1]);
  var minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return -1;
  return hours * 60 + minutes;
}

function minutesToTimeText_(minutesValue) {
  var minutes = Number(minutesValue);
  if (!isFinite(minutes) || minutes < 0 || minutes >= 24 * 60) return '';
  var hours = Math.floor(minutes / 60);
  var remainder = Math.floor(minutes % 60);
  return String(hours).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
}

function buildSpecialCourseSlotsForTeacher_(teacherName, pendingRows, courseRows) {
  var teacher = cleanText_(teacherName);
  var activeLeaveByCalendarId = {};
  (pendingRows || []).forEach(function(row) {
    var calendarId = getEffectiveOpenLeaveCalendarId_(row);
    if (!calendarId || ['確認中', '已領取'].indexOf(cleanText_(row && row[5])) === -1) return;
    activeLeaveByCalendarId[calendarId] = row;
  });

  return (courseRows || []).map(function(row) {
    var calendarId = cleanText_(row && row[4]);
    var courseTeacher = cleanText_(row && row[3]);
    var leaveRow = activeLeaveByCalendarId[calendarId] || null;
    var leaveTeacher = cleanText_(leaveRow && leaveRow[1]);
    var sourceType = '';
    var substituteId = '';
    if (leaveRow) {
      if (leaveTeacher === teacher || !isOrdinaryOpenLeaveRow_(leaveRow)) return null;
      sourceType = 'leave';
      substituteId = cleanText_(leaveRow[9]);
    } else if (courseTeacher === teacher) {
      sourceType = 'own';
    } else {
      return null;
    }

    var date = formatMyDate(row && row[0]);
    var time = formatMyTime(row && row[1]);
    var courseName = cleanText_(row && row[2]);
    var room = getCourseRoom_(courseName);
    if (!calendarId || !date || !time || !room ||
        getVvipMonthFromDate_(date) !== getNextMonthKey_()) return null;
    return {
      slotKey: sourceType === 'own' ? 'own:' + calendarId : 'leave:' + substituteId,
      sourceType: sourceType,
      substituteId: substituteId,
      calendarId: calendarId,
      date: date,
      time: time,
      room: room,
      courseName: courseName,
      originalTeacher: sourceType === 'own' ? courseTeacher : leaveTeacher
    };
  }).filter(Boolean).sort(function(a, b) {
    return [a.date, a.time, a.room, a.slotKey].join('|')
      .localeCompare([b.date, b.time, b.room, b.slotKey].join('|'));
  });
}

function getSpecialCourseAvailability_(pendingRows, courseRows) {
  var openByCalendarId = {};
  (pendingRows || []).forEach(function(row) {
    var id = cleanText_(row && row[9]);
    var calendarId = getEffectiveOpenLeaveCalendarId_(row);
    if (id && calendarId && isOrdinaryOpenLeaveRow_(row)) openByCalendarId[calendarId] = id;
  });

  var coursesByDateRoom = {};
  (courseRows || []).forEach(function(courseRow) {
    var courseTime = formatMyTime(courseRow && courseRow[1]);
    var course = {
      date: formatMyDate(courseRow && courseRow[0]),
      room: getCourseRoom_(courseRow && courseRow[2]),
      time: courseTime,
      minutes: timeTextToMinutes_(courseTime),
      calendarId: cleanText_(courseRow && courseRow[4])
    };
    if (!course.date || !course.room || course.minutes < 0) return;
    var key = course.date + '|' + course.room;
    if (!coursesByDateRoom[key]) coursesByDateRoom[key] = [];
    coursesByDateRoom[key].push(course);
  });
  Object.keys(coursesByDateRoom).forEach(function(key) {
    coursesByDateRoom[key].sort(function(a, b) { return a.minutes - b.minutes; });
  });

  var availability = {};
  (pendingRows || []).forEach(function(row) {
    if (!isOrdinaryOpenLeaveRow_(row)) return;
    var substituteId = cleanText_(row[9]);
    var date = formatMyDate(row[2]);
    var startTime = formatMyTime(row[3]);
    var startMinutes = timeTextToMinutes_(startTime);
    var room = getCourseRoom_(row[4]);
    if (!substituteId || !date || !room || startMinutes < 0) return;

    var schedule = coursesByDateRoom[date + '|' + room] || [];
    var next = null;
    for (var courseIndex = 0; courseIndex < schedule.length; courseIndex++) {
      if (schedule[courseIndex].minutes > startMinutes) {
        next = schedule[courseIndex];
        break;
      }
    }
    var partnerId = next ? cleanText_(openByCalendarId[next.calendarId]) : '';
    availability[substituteId] = {
      room: room,
      date: date,
      startTime: startTime,
      nextCourseTime: next ? next.time : '',
      maxDurationMinutes: next ? Math.max(0, next.minutes - startMinutes - 15) : 240,
      mergePartnerIds: partnerId ? [partnerId] : [],
      requiresClosingTimeConfirmation: !next
    };
  });
  return availability;
}

function getTeacherSpecialCourseAvailability_(teacherName, pendingRows, courseRows) {
  var slots = buildSpecialCourseSlotsForTeacher_(teacherName, pendingRows, courseRows);
  var slotByCalendarId = {};
  slots.forEach(function(slot) {
    slotByCalendarId[slot.calendarId] = slot;
  });

  var schedules = {};
  (courseRows || []).forEach(function(row) {
    var date = formatMyDate(row && row[0]);
    var time = formatMyTime(row && row[1]);
    var room = getCourseRoom_(row && row[2]);
    var minutes = timeTextToMinutes_(time);
    var calendarId = cleanText_(row && row[4]);
    if (!date || !room || minutes < 0 || !calendarId) return;
    var key = date + '|' + room;
    if (!schedules[key]) schedules[key] = [];
    schedules[key].push({
      date: date,
      room: room,
      time: time,
      minutes: minutes,
      calendarId: calendarId,
      durationMinutes: getScheduledCourseDurationMinutes_(row && row[2])
    });
  });
  Object.keys(schedules).forEach(function(key) {
    schedules[key].sort(function(a, b) { return a.minutes - b.minutes; });
  });

  var availability = {};
  slots.forEach(function(slot) {
    var startMinutes = timeTextToMinutes_(slot.time);
    var schedule = schedules[slot.date + '|' + slot.room] || [];
    var next = schedule.filter(function(course) {
      return course.minutes > startMinutes;
    })[0] || null;
    var previous = schedule.filter(function(course) {
      return course.minutes < startMinutes;
    }).slice(-1)[0] || null;
    var partner = next ? slotByCalendarId[next.calendarId] : null;
    var option = {
      room: slot.room,
      date: slot.date,
      startTime: slot.time,
      nextCourseTime: next ? next.time : '',
      previousCourseTime: previous ? previous.time : '',
      earliestStartTime: previous
        ? minutesToTimeText_(previous.minutes + previous.durationMinutes + 15)
        : '',
      maxDurationMinutes: next ? Math.max(0, next.minutes - startMinutes - 15) : 240,
      mergePartnerIds: partner ? [partner.slotKey] : [],
      requiresClosingTimeConfirmation: !next
    };
    availability[slot.slotKey] = option;
    if (slot.substituteId) availability[slot.substituteId] = option;
  });
  return availability;
}

function buildTeacherSpecialCourseSlotPlan_(teacherName, startSlotKey, durationMinutes, actualStartTime, pendingRows, courseRows, mode) {
  var teacher = cleanText_(teacherName);
  var wantedKey = cleanText_(startSlotKey);
  var duration = Number(durationMinutes);
  if (!wantedKey) throw new Error('請只勾選特別課開始的第一堂。');
  if (!isFinite(duration) || Math.floor(duration) !== duration || duration < 90 || duration > 240) {
    throw new Error('特別課時長必須是 90 至 240 分鐘的整數。');
  }

  var availableSlots = buildSpecialCourseSlotsForTeacher_(teacher, pendingRows, courseRows);
  var availableByCalendarId = {};
  var leaveByCalendarId = {};
  (pendingRows || []).forEach(function(row) {
    var calendarId = getEffectiveOpenLeaveCalendarId_(row);
    if (calendarId) leaveByCalendarId[calendarId] = row;
  });
  var startSlot = null;
  availableSlots.forEach(function(slot) {
    availableByCalendarId[slot.calendarId] = slot;
    if (slot.slotKey === wantedKey) startSlot = slot;
  });
  if (!startSlot) throw new Error('找不到指定的特別課時段，請重新整理。');

  var occupancyStartMinutes = timeTextToMinutes_(startSlot.time);
  var schedule = (courseRows || []).map(function(row) {
    var time = formatMyTime(row && row[1]);
    return {
      date: formatMyDate(row && row[0]),
      room: getCourseRoom_(row && row[2]),
      time: time,
      minutes: timeTextToMinutes_(time),
      calendarId: cleanText_(row && row[4])
    };
  }).filter(function(course) {
    return course.date === startSlot.date && course.room === startSlot.room &&
      course.minutes >= occupancyStartMinutes;
  }).sort(function(a, b) { return a.minutes - b.minutes; });

  if (!schedule.some(function(course) { return course.calendarId === startSlot.calendarId; })) {
    throw new Error(
      startSlot.date + ' ' + startSlot.room + ' 教室 ' + startSlot.time +
      ' 尚未出現在 OB 課表，請通知管理員重新同步。'
    );
  }

  var normalizedActualStartTime = cleanText_(actualStartTime) || startSlot.time;
  var actualStartMinutes = timeTextToMinutes_(normalizedActualStartTime);
  if (actualStartMinutes < 0 || actualStartMinutes % 15 !== 0) {
    throw new Error('實際開始時間必須是有效的 15 分鐘刻度。');
  }
  if (actualStartMinutes < occupancyStartMinutes) {
    throw new Error('實際開始時間不可早於所選時段 ' + startSlot.time + '。');
  }
  var firstFollowingCourse = schedule.filter(function(course) {
    return course.minutes > occupancyStartMinutes;
  })[0] || null;
  if (firstFollowingCourse && actualStartMinutes > firstFollowingCourse.minutes - 15) {
    throw new Error(
      '實際開始時間最晚只能選 ' + minutesToTimeText_(firstFollowingCourse.minutes - 15) +
      '；若要更晚開始，請改選後面的時段。'
    );
  }

  var endMinutes = actualStartMinutes + duration;
  if (endMinutes >= 24 * 60) throw new Error('特別課不可跨日，請縮短時長。');
  var turnoverEndMinutes = endMinutes + 15;
  var requiredCourses = schedule.filter(function(course) {
    return course.minutes < turnoverEndMinutes;
  });
  var orderedSlots = requiredCourses.map(function(course) {
    var slot = availableByCalendarId[course.calendarId] || null;
    if (slot) return slot;
    var unavailableLeave = leaveByCalendarId[course.calendarId] || null;
    if (unavailableLeave && cleanText_(unavailableLeave[6])) {
      throw new Error('此課程剛被其他老師領取，請重新整理。');
    }
    if (unavailableLeave && !isOrdinaryOpenLeaveRow_(unavailableLeave)) {
      throw new Error('此課程尚待管理員完成 OB 核對或回復，暫時不能領取。');
    }
    if (mode === 'vacancy') {
      throw new Error(
        '特別課結束後需保留 15 分鐘換場；下一堂 ' + course.time +
        ' 開始，最晚只能上到 ' + minutesToTimeText_(course.minutes - 15) + '。'
      );
    }
    throw new Error(
      course.date + ' ' + course.room + ' 教室 ' + course.time +
      ' 尚未開放代課，且不是您的正課，無法安排這堂特別課。'
    );
  });
  var nextCourse = schedule.filter(function(course) {
    return course.minutes >= turnoverEndMinutes;
  })[0] || null;

  return {
    orderedSlots: orderedSlots,
    orderedSubstituteIds: orderedSlots.map(function(slot) {
      return cleanText_(slot.substituteId);
    }).filter(Boolean),
    occupiedTimes: orderedSlots.map(function(slot) { return slot.time; }),
    room: startSlot.room,
    date: startSlot.date,
    startTime: startSlot.time,
    occupancyStartTime: startSlot.time,
    actualStartTime: minutesToTimeText_(actualStartMinutes),
    endMinutes: endMinutes,
    endTime: minutesToTimeText_(endMinutes),
    nextCourse: nextCourse,
    requiresClosingTimeConfirmation: !nextCourse
  };
}

function buildSpecialCourseSlotPlan_(startId, durationMinutes, actualStartTime, pendingRows, courseRows, mode) {
  var wantedId = cleanText_(startId);
  var duration = Number(durationMinutes);
  if (!wantedId) throw new Error('請只勾選特別課開始的第一堂。');
  if (!isFinite(duration) || Math.floor(duration) !== duration || duration < 90 || duration > 240) {
    throw new Error('特別課時長必須是 90 至 240 分鐘的整數。');
  }

  var startRow = null;
  var leaveByCalendarId = {};
  (pendingRows || []).forEach(function(row) {
    var substituteId = cleanText_(row && row[9]);
    var calendarId = getEffectiveOpenLeaveCalendarId_(row);
    if (substituteId === wantedId) startRow = row;
    if (substituteId && calendarId) leaveByCalendarId[calendarId] = row;
  });
  if (!startRow) throw new Error('找不到指定的代課課程，請重新整理。');

  var date = formatMyDate(startRow[2]);
  var occupancyStartTime = formatMyTime(startRow[3]);
  var occupancyStartMinutes = timeTextToMinutes_(occupancyStartTime);
  var room = getCourseRoom_(startRow[4]);
  var startCalendarId = getEffectiveOpenLeaveCalendarId_(startRow);
  if (!date || !room || occupancyStartMinutes < 0 || !startCalendarId) {
    throw new Error('特別課的日期、時間、教室或 OB Calendar ID 資料不完整。');
  }

  var schedule = (courseRows || []).map(function(row) {
    var time = formatMyTime(row && row[1]);
    return {
      date: formatMyDate(row && row[0]),
      room: getCourseRoom_(row && row[2]),
      time: time,
      minutes: timeTextToMinutes_(time),
      calendarId: cleanText_(row && row[4])
    };
  }).filter(function(course) {
    return course.date === date && course.room === room && course.minutes >= occupancyStartMinutes;
  }).sort(function(a, b) { return a.minutes - b.minutes; });

  if (!schedule.some(function(course) { return course.calendarId === startCalendarId; })) {
    throw new Error(date + ' ' + room + ' 教室 ' + occupancyStartTime + ' 尚未出現在 OB 課表，請通知管理員重新同步。');
  }

  var normalizedActualStartTime = cleanText_(actualStartTime) || occupancyStartTime;
  var actualStartMinutes = timeTextToMinutes_(normalizedActualStartTime);
  if (actualStartMinutes < 0 || actualStartMinutes % 15 !== 0) {
    throw new Error('實際開始時間必須是有效的 15 分鐘刻度。');
  }
  if (actualStartMinutes < occupancyStartMinutes) {
    throw new Error('實際開始時間不可早於所選時段 ' + occupancyStartTime + '。');
  }
  var firstFollowingCourse = schedule.filter(function(course) {
    return course.minutes > occupancyStartMinutes;
  })[0] || null;
  if (firstFollowingCourse && actualStartMinutes > firstFollowingCourse.minutes - 15) {
    throw new Error(
      '實際開始時間最晚只能選 ' + minutesToTimeText_(firstFollowingCourse.minutes - 15) +
      '；若要更晚開始，請改選後面的時段。'
    );
  }

  var endMinutes = actualStartMinutes + duration;
  if (endMinutes >= 24 * 60) throw new Error('特別課不可跨日，請縮短時長。');
  var turnoverEndMinutes = endMinutes + 15;

  var requiredCourses = schedule.filter(function(course) {
    return course.minutes < turnoverEndMinutes;
  });
  var requiredIds = requiredCourses.map(function(course) {
    var leaveRow = leaveByCalendarId[course.calendarId];
    var substituteId = cleanText_(leaveRow && leaveRow[9]);
    if (!substituteId) {
      if (mode === 'vacancy') {
        throw new Error(
          '特別課結束後需保留 15 分鐘換場；下一堂 ' + course.time +
          ' 開始，最晚只能上到 ' + minutesToTimeText_(course.minutes - 15) + '。'
        );
      }
      throw new Error(
        course.date + ' ' + course.room + ' 教室 ' + course.time +
        ' 尚未開放代課，無法安排這堂特別課。'
      );
    }
    return substituteId;
  });
  var nextCourse = schedule.filter(function(course) {
    return course.minutes >= turnoverEndMinutes;
  })[0] || null;

  return {
    orderedSubstituteIds: requiredIds,
    occupiedTimes: requiredCourses.map(function(course) { return course.time; }),
    room: room,
    date: date,
    startTime: occupancyStartTime,
    occupancyStartTime: occupancyStartTime,
    actualStartTime: minutesToTimeText_(actualStartMinutes),
    endMinutes: endMinutes,
    endTime: minutesToTimeText_(endMinutes),
    nextCourse: nextCourse,
    requiresClosingTimeConfirmation: !nextCourse
  };
}

function fetchObClassPages_(token) {
  var allClasses = [];
  var start = 0;
  while (true) {
    var response = UrlFetchApp.fetch(CONFIG.CLASSES_API_URL + '?start=' + start, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    var statusCode = response.getResponseCode();
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error('Omcean Classes API 回傳 HTTP ' + statusCode + '。');
    }
    var page;
    try {
      page = JSON.parse(response.getContentText());
    } catch (error) {
      throw new Error('Omcean Classes API 回傳格式錯誤。');
    }
    if (!Array.isArray(page)) throw new Error('Omcean Classes API 回傳格式錯誤。');
    allClasses = allClasses.concat(page);
    if (page.length < CONFIG.PAGE_SIZE) break;
    start += CONFIG.PAGE_SIZE;
  }
  return allClasses;
}

function getCourseListClassCatalogFallback_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
  assertHeaders_(sheet, SHEET_HEADERS.COURSE_LIST);
  return normalizeObClassCatalog_(sheet.getDataRange().getValues().slice(1).map(function(row) {
    return { id: cleanText_(row[5]), nameZhHant: cleanText_(row[2]) };
  }));
}

function getObClassCatalog_() {
  var cache = typeof CacheService !== 'undefined' ? CacheService.getScriptCache() : null;
  var cached = cache ? cache.get(CONFIG.OB_CLASS_CACHE_KEY) : '';
  if (cached) {
    try {
      var parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) return normalizeObClassCatalog_(parsed);
    } catch (error) {
      if (console && console.warn) console.warn('OB 課程快取格式錯誤，將重新讀取。');
    }
  }

  try {
    var properties = typeof PropertiesService !== 'undefined'
      ? PropertiesService.getScriptProperties()
      : null;
    var token = properties ? properties.getProperty(CONFIG.API_TOKEN_PROPERTY) : '';
    if (token && typeof UrlFetchApp !== 'undefined') {
      var catalog = normalizeObClassCatalog_(fetchObClassPages_(token));
      if (catalog.length) {
        if (cache) {
          try {
            cache.put(CONFIG.OB_CLASS_CACHE_KEY, JSON.stringify(catalog), CONFIG.OB_CLASS_CACHE_SECONDS);
          } catch (cacheError) {
            if (console && console.warn) console.warn('OB 課程快取寫入失敗，本次仍使用即時資料。');
          }
        }
        return catalog;
      }
    }
  } catch (error) {
    if (console && console.warn) console.warn('OB 課程項目讀取失敗，暫用 CourseList：' + getErrorMessage_(error));
  }
  return getCourseListClassCatalogFallback_();
}

function resolveCatalogCourseForRoom_(catalog, courseKey, targetCourseName, promotionType) {
  var wantedKey = normalizeCourseCatalogKey_(courseKey);
  var matches = (catalog || []).filter(function(item) { return item.courseKey === wantedKey; });
  if (!matches.length) return null;
  var wantedPromotionType = cleanText_(promotionType);
  var promotionMatches = matches.filter(function(item) {
    return cleanText_(item.promotionType) === wantedPromotionType;
  });
  var targetRoom = getCourseRoom_(targetCourseName);
  var exactRoom = promotionMatches.filter(function(item) { return item.room === targetRoom; })[0] || null;
  var selected = exactRoom || promotionMatches[0] || matches[0];
  var selectedCourseName = applyCoursePromotionType_(selected.courseName, wantedPromotionType);
  return {
    actualClassId: exactRoom ? exactRoom.classId : '',
    actualCourseName: targetRoom ? targetRoom + '－' + selectedCourseName : selectedCourseName,
    category: selected.category,
    needsCreation: !exactRoom
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

function getRecurringTeacherCapabilities_(teacherName, courseRows) {
  var teacher = cleanText_(teacherName);
  if (!teacher) return [];
  var categories = (courseRows || []).map(function(row) {
    var courseName = cleanText_(row && row[2]);
    if (cleanText_(row && row[3]) !== teacher || !courseName ||
        /\u7279\u5225\u8ab2|\u5834\u5730\u79df\u501f/.test(courseName) || isTermCourseName_(courseName)) {
      return '';
    }
    var category = getCourseCategory_(courseName);
    return category === '\u5176\u4ed6' ? '' : category;
  });
  return normalizeTeacherCapabilities_(categories);
}

function getSupplementalTeacherCapabilities_(teacherName) {
  var teacher = cleanText_(teacherName);
  return normalizeTeacherCapabilities_(SUPPLEMENTAL_TEACHER_CAPABILITIES[teacher] || []);
}

function getEffectiveTeacherCapabilities_(teacherName, courseRows) {
  return normalizeTeacherCapabilities_(
    getTeacherCapabilities_(teacherName).concat(
      getRecurringTeacherCapabilities_(teacherName, courseRows),
      getSupplementalTeacherCapabilities_(teacherName)
    )
  );
}

function getEffectiveTeacherCapabilitiesFromSheet_(teacherName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var courseSheet = ss.getSheetByName(CONFIG.COURSE_SHEET);
  if (!courseSheet) return getTeacherCapabilities_(teacherName);
  assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
  return getEffectiveTeacherCapabilities_(
    teacherName,
    courseSheet.getDataRange().getValues().slice(1)
  );
}

function teacherCanTeachCategory_(teacher, category) {
  var normalizedCategory = normalizeTeacherCapabilities_([category])[0] || '';
  return !!normalizedCategory &&
    getEffectiveTeacherCapabilitiesFromSheet_(teacher).indexOf(normalizedCategory) !== -1;
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

function getSpecialCourseActualStartTime_(durationMinutes, endTime) {
  var duration = Number(durationMinutes);
  var endMinutes = timeTextToMinutes_(formatMyTime(endTime));
  if (!isFinite(duration) || duration <= 0 || endMinutes < duration) return '';
  return minutesToTimeText_(endMinutes - duration);
}

function getMySubs_(teacherName, recordMonth) {
  var name = cleanText_(teacherName);
  if (!name) throw new Error('請選擇查詢老師。');
  assertTeacherExists_(name);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
  assertHeaders_(sheet, SHEET_HEADERS.LEAVES);
  var auditByTarget = getAuditHistoryMap_();
  var recordMonths = getTeacherRecordMonthKeys_(recordMonth);
  var substituteItems = sheet.getDataRange().getValues().slice(1).filter(function(r) {
    return cleanText_(r[6]) === name &&
      cleanText_(r[5]) === '已領取' &&
      recordMonths.indexOf(getVvipMonthFromDate_(r[2])) !== -1;
  }).map(function(r) {
    return {
      '代課編號': cleanText_(r[9]),
      'OB Calendar ID': cleanText_(r[10]),
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
      '特別課群組 ID': cleanText_(r[21]),
      '特別課模式': cleanText_(r[22]),
      '特別課分鐘數': Number(r[23]) || 0,
      '特別課實際開始時間': getSpecialCourseActualStartTime_(r[23], r[24]),
      '特別課結束時間': formatMyTime(r[24]),
      '實際開始時間': formatMyTime(r[25]) || formatMyTime(r[3]),
      '延後分鐘數': Number(r[26]) || 0,
      '異動狀態': cleanText_(r[18]),
      '可申請退出': cleanText_(r[18]) !== '申請退出中',
      '異動紀錄': auditByTarget[cleanText_(r[9])] || []
    };
  });
  var specialRequestSheet = ss.getSheetByName(SHEETS.SPECIAL_COURSE_REQUESTS);
  if (!specialRequestSheet) return sortTeacherSubstituteRecords_(substituteItems);
  assertHeaders_(specialRequestSheet, SHEET_HEADERS.SPECIAL_COURSE_REQUESTS);
  var specialItems = specialRequestSheet.getDataRange().getValues().slice(1).filter(function(row) {
    return cleanText_(row[2]) === name &&
      specialRequestHasOwnSlot_(row) &&
      recordMonths.indexOf(getVvipMonthFromDate_(row[3])) !== -1;
  }).map(function(row) {
    var sourceSlots = getSpecialRequestSourceSlots_(row);
    var groupId = cleanText_(row[1]);
    return {
      '紀錄類型': '特別課安排',
      '代課編號': '',
      'OB Calendar ID': cleanText_(row[18]),
      '日期': formatMyDate(row[3]),
      '時段': formatMyTime(row[7]),
      '課程': sourceSlots.map(function(slot) { return cleanText_(slot.courseName); }).join('＋'),
      '課程大類': '特別課',
      '原老師': sourceSlots.map(function(slot) { return cleanText_(slot.originalTeacher); })
        .filter(Boolean).filter(function(value, index, values) { return values.indexOf(value) === index; }).join('、'),
      '備註': cleanText_(row[13]),
      '實際課程 ID': '',
      '實際課程名稱': cleanText_(row[8]),
      '預計難度': cleanText_(row[9]),
      '處理類型': '安排特別課',
      '實際課程類別': '特別課',
      '特別課群組 ID': groupId,
      '特別課模式': cleanText_(row[12]),
      '特別課分鐘數': Number(row[10]) || 0,
      '特別課實際開始時間': formatMyTime(row[7]),
      '特別課結束時間': formatMyTime(row[11]),
      '來源時段': sourceSlots,
      '異動狀態': cleanText_(row[14]),
      '可申請退出': false,
      '異動紀錄': auditByTarget[groupId] || []
    };
  });
  return sortTeacherSubstituteRecords_(substituteItems.concat(specialItems));
}

function sortTeacherSubstituteRecords_(items) {
  return (items || []).slice().sort(function(a, b) {
    var firstKey = [
      cleanText_(a && a['日期']),
      cleanText_(a && (a['實際開始時間'] || a['特別課實際開始時間'] || a['時段'])),
      cleanText_(a && a['課程']),
      cleanText_(a && a['代課編號']),
      cleanText_(a && a['特別課群組 ID'])
    ].join('|');
    var secondKey = [
      cleanText_(b && b['日期']),
      cleanText_(b && (b['實際開始時間'] || b['特別課實際開始時間'] || b['時段'])),
      cleanText_(b && b['課程']),
      cleanText_(b && b['代課編號']),
      cleanText_(b && b['特別課群組 ID'])
    ].join('|');
    return firstKey.localeCompare(secondKey);
  });
}

function getSpecialRequestSourceSlots_(row) {
  try {
    var parsed = JSON.parse(cleanText_(row && row[5]) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function specialRequestHasOwnSlot_(row) {
  return getSpecialRequestSourceSlots_(row).some(function(slot) {
    return cleanText_(slot && slot.sourceType) === 'own';
  });
}

function toAdminSpecialCourseRequestItem_(row, auditHistory) {
  var sourceSlots = getSpecialRequestSourceSlots_(row);
  var sourceTeachers = sourceSlots.map(function(slot) {
    return cleanText_(slot && slot.originalTeacher);
  }).filter(Boolean).filter(function(value, index, values) {
    return values.indexOf(value) === index;
  });
  return {
    recordType: 'specialRequest',
    substituteId: '',
    originalTeacher: sourceTeachers.join('、'),
    substituteTeacher: cleanText_(row[2]),
    date: formatMyDate(row[3]),
    time: formatMyTime(row[7]),
    originalCourse: sourceSlots.map(function(slot) {
      return cleanText_(slot && slot.courseName);
    }).filter(Boolean).join('＋'),
    actualCourse: cleanText_(row[8]),
    actualClassId: '',
    difficulty: cleanText_(row[9]),
    handlingType: '安排特別課',
    note: cleanText_(row[13]),
    status: cleanText_(row[14]),
    changeStatus: '',
    verificationStatus: cleanText_(row[15]),
    verificationTime: cleanText_(row[16]),
    differenceReason: cleanText_(row[17]),
    originalCalendarId: sourceSlots.map(function(slot) {
      return cleanText_(slot && slot.calendarId);
    }).filter(Boolean).join('、'),
    replacementCalendarId: cleanText_(row[18]),
    specialGroupId: cleanText_(row[1]),
    specialMode: cleanText_(row[12]),
    specialDurationMinutes: Number(row[10]) || 0,
    specialActualStartTime: formatMyTime(row[7]),
    specialEndTime: formatMyTime(row[11]),
    sourceSlots: sourceSlots,
    auditHistory: auditHistory || []
  };
}

function submitLeave_(session, items) {
  var teacher = getSessionTeacherName_(session);
  var auditActor = getSessionAuditActor_(session);
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
          actor: auditActor,
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

function claimSpecialCourse_(session, payload) {
  var teacher = getSessionTeacherName_(session);
  var auditActor = getSessionAuditActor_(session);
  assertTeacherExists_(teacher);
  var source = payload || {};
  var mode = cleanText_(source.mode);
  var ids = Array.isArray(source.substituteIds) ? source.substituteIds.map(cleanText_).filter(Boolean) : [];
  var startSlotKey = cleanText_(source.startSlotKey) || (ids.length === 1 ? 'leave:' + ids[0] : '');
  var courseName = cleanText_(source.courseName);
  var difficulty = cleanText_(source.difficulty);
  var note = cleanText_(source.note);
  var durationMinutes = Number(source.durationMinutes);
  var actualStartTime = cleanText_(source.actualStartTime);

  if (['vacancy', 'merge'].indexOf(mode) === -1) throw new Error('請選擇特別課安排方式。');
  if (!startSlotKey || ids.length > 1) {
    throw new Error('請只勾選特別課開始的第一堂。');
  }
  if (ids.some(function(id, index) { return ids.indexOf(id) !== index; })) {
    throw new Error('特別課代課編號重複。');
  }
  if (!courseName) throw new Error('請填寫特別課名稱。');
  if (!isFinite(durationMinutes) || Math.floor(durationMinutes) !== durationMinutes ||
      durationMinutes < 90 || durationMinutes > 240) {
    throw new Error('特別課時長必須是 90 至 240 分鐘的整數。');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  var result;
  try {
    if (areClaimsPaused_()) throw new Error('目前暫停全部代課領取。');
    var invitationId = getActiveInvitationId_(teacher);
    if (!invitationId) throw new Error('目前尚未開放代課領取。');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    var specialRequestSheet = requireSheet_(ss, SHEETS.SPECIAL_COURSE_REQUESTS);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    assertHeaders_(specialRequestSheet, SHEET_HEADERS.SPECIAL_COURSE_REQUESTS);
    var leaveValues = leaveSheet.getDataRange().getValues();
    var courseRows = courseSheet.getDataRange().getValues().slice(1);
    var slotPlan = buildTeacherSpecialCourseSlotPlan_(
      teacher,
      startSlotKey,
      durationMinutes,
      actualStartTime,
      leaveValues.slice(1),
      courseRows,
      mode
    );
    var requiredIds = slotPlan.orderedSubstituteIds;
    if (mode === 'merge' && slotPlan.orderedSlots.length < 2) {
      throw new Error('此時段不需使用後續時段，請改用單堂延長。');
    }
    if (mode === 'vacancy' && slotPlan.orderedSlots.length > 1) {
      throw new Error('這堂特別課會占用後續時段，請改用「使用連續時段」。');
    }
    var rowById = {};
    for (var rowIndex = 1; rowIndex < leaveValues.length; rowIndex++) {
      var currentId = cleanText_(leaveValues[rowIndex][9]);
      if (currentId) rowById[currentId] = rowIndex;
    }

    var selected = requiredIds.map(function(id) {
      if (rowById[id] == null) throw new Error('找不到指定的代課課程，請重新整理。');
      var dataIndex = rowById[id];
      var row = leaveValues[dataIndex];
      if (cleanText_(row[5]) !== '確認中' || cleanText_(row[6])) {
        throw new Error('此課程剛被其他老師領取，請重新整理。');
      }
      if (!cleanText_(row[10])) {
        throw new Error('此課程尚未連結 OB Calendar ID，請通知管理員先完成核對。');
      }
      if (!isOrdinaryOpenLeaveRow_(row)) {
        throw new Error('此課程尚待管理員完成 OB 核對或回復，暫時不能領取。');
      }
      if (cleanText_(row[1]) === teacher) throw new Error('不能領取自己原本的課程。');
      var date = formatMyDate(row[2]);
      var time = formatMyTime(row[3]);
      var room = getCourseRoom_(row[4]);
      var minutes = timeTextToMinutes_(time);
      if (!date || !room || minutes < 0) throw new Error('特別課的日期、時間或教室資料不完整。');
      return {
        id: id,
        dataIndex: dataIndex,
        row: row,
        date: date,
        time: time,
        room: room,
        minutes: minutes,
        calendarId: getEffectiveOpenLeaveCalendarId_(row)
      };
    }).sort(function(a, b) { return a.minutes - b.minutes; });

    var endMinutes = slotPlan.endMinutes;
    if (endMinutes >= 24 * 60) throw new Error('特別課不可跨日，請縮短時長。');

    var nextCourse = slotPlan.nextCourse;

    var specialGroupId = Utilities.getUuid();
    var specialMode = mode === 'merge' ? '使用連續時段' : '使用後方空堂';
    var endTime = minutesToTimeText_(endMinutes);
    var updates = selected.map(function(item) {
      var change = validateClaimChange_({
        teacher: teacher,
        targetCourseName: cleanText_(item.row[4]),
        targetCalendarId: item.calendarId,
        handlingType: 'special',
        actualCourseName: courseName,
        difficulty: difficulty,
        note: note
      });
      var nextRow = item.row.slice();
      while (nextRow.length < SHEET_HEADERS.LEAVES.length) nextRow.push('');
      nextRow[5] = '已領取';
      nextRow[6] = teacher;
      nextRow[7] = [
        change.summary,
        '模式：' + specialMode,
        '實際開始：' + slotPlan.actualStartTime,
        '時長：' + durationMinutes + ' 分鐘'
      ]
        .join('；');
      nextRow[8] = '待處理';
      nextRow[11] = '';
      nextRow[12] = change.actualCourseName;
      nextRow[13] = change.difficulty;
      nextRow[14] = change.handlingType;
      nextRow[15] = '待核對';
      nextRow[16] = '';
      nextRow[17] = '';
      nextRow[18] = '';
      nextRow[19] = change.category;
      nextRow[21] = specialGroupId;
      nextRow[22] = specialMode;
      nextRow[23] = durationMinutes;
      nextRow[24] = endTime;
      return { item: item, rowValues: nextRow };
    });

    var requestRow = [
      getTimestamp_(),
      specialGroupId,
      teacher,
      slotPlan.date,
      slotPlan.room,
      JSON.stringify(slotPlan.orderedSlots),
      JSON.stringify(requiredIds),
      slotPlan.actualStartTime,
      courseName,
      difficulty,
      durationMinutes,
      endTime,
      specialMode,
      note,
      '待處理',
      '待核對',
      '',
      '',
      ''
    ];

    result = runStateTransitionUnlocked_([leaveSheet, specialRequestSheet], function(appendAudits) {
      updates.forEach(function(update) {
        leaveSheet.getRange(
          update.item.dataIndex + 1,
          6,
          1,
          SHEET_HEADERS.LEAVES.length - 5
        ).setValues([update.rowValues.slice(5, SHEET_HEADERS.LEAVES.length)]);
      });
      specialRequestSheet.getRange(
        specialRequestSheet.getLastRow() + 1,
        1,
        1,
        SHEET_HEADERS.SPECIAL_COURSE_REQUESTS.length
      ).setValues([requestRow]);
      var auditEvents = updates.map(function(update) {
        return {
          actor: auditActor,
          action: '領取特別課',
          targetId: update.item.id,
          before: '確認中',
          after: '已領取',
          reason: [
            '群組：' + specialGroupId,
            courseName,
            specialMode,
            '實際開始：' + slotPlan.actualStartTime,
            durationMinutes + ' 分鐘',
            '邀請編號：' + invitationId
          ].join('；')
        };
      });
      auditEvents.push({
        actor: auditActor,
        action: '安排特別課',
        targetId: specialGroupId,
        before: '',
        after: '待處理',
        reason: [
          slotPlan.date,
          slotPlan.room + ' 教室',
          slotPlan.actualStartTime + '–' + endTime,
          courseName,
          '來源時段：' + slotPlan.orderedSlots.map(function(slot) { return slot.slotKey; }).join('、'),
          '邀請編號：' + invitationId
        ].join('；')
      });
      appendAudits(auditEvents);
      return {
        count: slotPlan.orderedSlots.length,
        substituteIds: updates.map(function(update) { return update.item.id; }),
        occupiedSlotKeys: slotPlan.orderedSlots.map(function(slot) { return slot.slotKey; }),
        specialGroupId: specialGroupId,
        actualStartTime: slotPlan.actualStartTime,
        endTime: endTime,
        occupiedTimes: slotPlan.orderedSlots.map(function(slot) { return slot.time; }),
        requiresClosingTimeConfirmation: !nextCourse
      };
    });
  } finally {
    lock.releaseLock();
  }
  sendPushAfterMutationSafely_([teacher], {
    heading: '特別課領取成功',
    content: slotPlan.date + ' ' + slotPlan.actualStartTime + '「' + courseName + '」已完成安排。',
    url: buildAppViewUrl_('mysubs')
  });
  return result;
}

function claimSubstitute_(session, items) {
  var teacher = getSessionTeacherName_(session);
  var auditActor = getSessionAuditActor_(session);
  if (!Array.isArray(items) || !items.length) throw new Error('請至少選擇一堂代課課程。');
  assertTeacherExists_(teacher);

  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  var result;
  try {
    if (areClaimsPaused_()) throw new Error('目前暫停全部代課領取。');
    var invitationId = getActiveInvitationId_(teacher);
    if (!invitationId) throw new Error('目前尚未開放代課領取。');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    var values = leaveSheet.getDataRange().getValues();
    var leaveRows = values.slice(1);
    var courseRows = courseSheet.getDataRange().getValues().slice(1);
    var courseCalendarIds = buildCourseCalendarIdSet_(courseRows);
    var specialRequestSheet = ss.getSheetByName(SHEETS.SPECIAL_COURSE_REQUESTS);
    var specialRequestRows = [];
    if (specialRequestSheet) {
      assertHeaders_(specialRequestSheet, SHEET_HEADERS.SPECIAL_COURSE_REQUESTS);
      specialRequestRows = specialRequestSheet.getDataRange().getValues().slice(1);
    }
    var teacherCommitments = buildTeacherCommitmentSlots_(
      teacher,
      courseRows,
      leaveRows,
      specialRequestRows
    );
    var rowById = {};
    for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
      var substituteId = cleanText_(values[rowIndex][9]);
      if (substituteId) rowById[substituteId] = rowIndex;
    }

    var primaryIds = {};
    items.forEach(function(item) {
      var id = cleanText_(item.substituteId || item['代課編號']);
      if (!id || primaryIds[id]) throw new Error('代課資料編號無效或重複。');
      primaryIds[id] = true;
    });

    var reservedOccupiedIds = {};
    var occupiedUpdates = [];
    var primaryUpdates = items.map(function(item) {
      var id = cleanText_(item.substituteId || item['代課編號']);
      if (rowById[id] == null) throw new Error('找不到指定的代課課程，請重新整理。');

      var dataIndex = rowById[id];
      var row = values[dataIndex];
      if (cleanText_(row[5]) !== '確認中') {
        throw new Error('此課程剛被其他老師領取，請重新整理。');
      }
      if (!cleanText_(row[10])) {
        throw new Error('此課程尚未連結 OB Calendar ID，請通知管理員先完成核對。');
      }
      if (!courseCalendarIds[getEffectiveOpenLeaveCalendarId_(row)]) {
        throw new Error('這堂課已不在 OB 課表，可能已取消，請重新整理。');
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

      var delay = normalizeOrdinaryDelayMinutes_(item.startDelayMinutes);
      var delayPlan = delay ? buildOrdinaryClaimDelayPlan_(
        row,
        delay,
        leaveRows,
        courseRows
      ) : {
        delayMinutes: 0,
        originalStartTime: formatMyTime(row[3]),
        actualStartTime: formatMyTime(row[3]),
        occupiedRowIndex: -1,
        occupiedSubstituteId: ''
      };
      if (delayPlan.occupiedSubstituteId &&
          (primaryIds[delayPlan.occupiedSubstituteId] || reservedOccupiedIds[delayPlan.occupiedSubstituteId])) {
        throw new Error('同一批不可同時領取或重複占用下一堂課。');
      }

      var candidateSlot = buildOrdinaryLeaveTimeSlot_(row, delayPlan.actualStartTime);
      if (findTeacherScheduleConflict_(candidateSlot, teacherCommitments)) {
        throw new Error('此課程與您已安排的正課或代課相隔未滿 15 分鐘，不能領取。');
      }
      teacherCommitments.push(candidateSlot);

      var change = validateClaimChange_({
        teacher: teacher,
        targetDate: formatMyDate(row[2]),
        courseRows: courseRows,
        targetCourseName: cleanText_(row[4]),
        targetCalendarId: getEffectiveOpenLeaveCalendarId_(row),
        handlingType: item.handlingType,
        courseTypeKey: item.courseTypeKey,
        courseKey: item.courseKey,
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
      nextRow[25] = delayPlan.actualStartTime;
      nextRow[26] = delayPlan.delayMinutes;
      nextRow[27] = '';
      if (delayPlan.delayMinutes) {
        nextRow[7] = [
          change.summary,
          '實際開始：' + delayPlan.actualStartTime
        ].filter(Boolean).join('；');
      }

      if (delayPlan.occupiedSubstituteId) {
        reservedOccupiedIds[delayPlan.occupiedSubstituteId] = true;
        var occupiedDataIndex = delayPlan.occupiedRowIndex;
        var occupiedRow = leaveRows[occupiedDataIndex].slice();
        while (occupiedRow.length < SHEET_HEADERS.LEAVES.length) occupiedRow.push('');
        occupiedRow[5] = '延後占用';
        occupiedRow[6] = '';
        occupiedRow[7] = '由代課編號 ' + id + ' 延後占用';
        occupiedRow[8] = '待處理';
        occupiedRow[11] = '';
        occupiedRow[12] = '';
        occupiedRow[13] = '';
        occupiedRow[14] = '';
        occupiedRow[15] = '待關閉 OB';
        occupiedRow[16] = '';
        occupiedRow[17] = '';
        occupiedRow[18] = '延後占用／待管理員關閉 OB';
        occupiedRow[19] = '';
        occupiedRow[20] = '';
        occupiedRow[21] = '';
        occupiedRow[22] = '';
        occupiedRow[23] = '';
        occupiedRow[24] = '';
        occupiedRow[25] = '';
        occupiedRow[26] = '';
        occupiedRow[27] = id;
        occupiedUpdates.push({
          sheetRow: occupiedDataIndex + 2,
          rowValues: occupiedRow,
          substituteId: delayPlan.occupiedSubstituteId,
          sourceId: id
        });
      }
      return {
        sheetRow: dataIndex + 1,
        rowValues: nextRow,
        summary: nextRow[7],
        substituteId: id,
        occupiedSubstituteId: delayPlan.occupiedSubstituteId
      };
    });

    result = runStateTransitionUnlocked_([leaveSheet], function(appendAudits) {
      primaryUpdates.concat(occupiedUpdates).forEach(function(update) {
        leaveSheet.getRange(
          update.sheetRow,
          6,
          1,
          SHEET_HEADERS.LEAVES.length - 5
        ).setValues([update.rowValues.slice(5, SHEET_HEADERS.LEAVES.length)]);
      });
      var audits = primaryUpdates.map(function(update) {
        return {
          actor: auditActor,
          action: '領取代課',
          targetId: update.substituteId,
          before: '確認中',
          after: '已領取',
          reason: [
            update.summary,
            update.occupiedSubstituteId ? '占用下一堂：' + update.occupiedSubstituteId : '',
            '邀請編號：' + invitationId
          ].filter(Boolean).join('；')
        };
      }).concat(occupiedUpdates.map(function(update) {
        return {
          actor: auditActor,
          action: '延後占用',
          targetId: update.substituteId,
          before: '確認中',
          after: '延後占用',
          reason: '來源代課編號：' + update.sourceId
        };
      }));
      appendAudits(audits);
      return {
        count: primaryUpdates.length,
        occupiedSubstituteIds: occupiedUpdates.map(function(update) {
          return update.substituteId;
        })
      };
    });
  } finally {
    lock.releaseLock();
  }
  sendPushAfterMutationSafely_([teacher], {
    heading: '代課領取成功',
    content: result.count === 1
      ? '已成功領取 1 堂代課，請到代課紀錄確認內容。'
      : '已成功領取 ' + result.count + ' 堂代課，請到代課紀錄確認內容。',
    url: buildAppViewUrl_('mysubs')
  });
  return result;
}

function cancelLeave_(session, substituteId) {
  var teacher = getSessionTeacherName_(session);
  var auditActor = getSessionAuditActor_(session);
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
        actor: auditActor,
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

function normalizeMissingObCancellationIds_(values) {
  if (!Array.isArray(values)) throw new Error('取消課程清單必須是陣列。');
  var seen = {};
  var ids = [];
  values.forEach(function(value) {
    var id = cleanText_(value);
    if (!id || seen[id]) return;
    seen[id] = true;
    ids.push(id);
  });
  if (!ids.length) throw new Error('請至少選擇一堂已從 OB 取消的課程。');
  if (ids.length > CONFIG.OB_CANCELLATION_BATCH_MAX) {
    throw new Error('單次最多可關閉 ' + CONFIG.OB_CANCELLATION_BATCH_MAX + ' 堂課程。');
  }
  return ids;
}

function closeMissingObCancellations_(session, substituteIds) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var ids = normalizeMissingObCancellationIds_(substituteIds);
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    var vvipSheet = ss.getSheetByName(SHEETS.VVIP_SELECTIONS);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    if (vvipSheet) assertHeaders_(vvipSheet, SHEET_HEADERS.VVIP_SELECTIONS);

    var leaveValues = leaveSheet.getDataRange().getValues();
    var courseCalendarIds = buildCourseCalendarIdSet_(courseSheet.getDataRange().getValues().slice(1));
    var targetMonth = getNextMonthKey_();
    var recordById = {};
    for (var rowIndex = 1; rowIndex < leaveValues.length; rowIndex++) {
      var substituteId = cleanText_(leaveValues[rowIndex][9]);
      if (substituteId) recordById[substituteId] = {
        rowNumber: rowIndex + 1,
        row: leaveValues[rowIndex]
      };
    }

    var records = ids.map(function(id) {
      var record = recordById[id];
      if (!record) throw new Error('找不到代課編號 ' + id + '，請重新整理。');
      if (!isMissingObCancellationCandidateRow_(record.row, courseCalendarIds, targetMonth)) {
        if (courseCalendarIds[getEffectiveOpenLeaveCalendarId_(record.row)]) {
          throw new Error(formatMyDate(record.row[2]) + ' ' + formatMyTime(record.row[3]) +
            ' 的 OB 課程仍存在，不可關閉；請先重新同步確認。');
        }
        throw new Error(formatMyDate(record.row[2]) + ' ' + formatMyTime(record.row[3]) +
          ' 目前狀態不可關閉，請重新整理。');
      }
      return record;
    });

    var selectedCalendarIds = {};
    records.forEach(function(record) {
      var effectiveCalendarId = getEffectiveOpenLeaveCalendarId_(record.row);
      if (effectiveCalendarId) selectedCalendarIds[effectiveCalendarId] = true;
      var originalCalendarId = cleanText_(record.row[10]);
      if (originalCalendarId && originalCalendarId !== effectiveCalendarId && !courseCalendarIds[originalCalendarId]) {
        selectedCalendarIds[originalCalendarId] = true;
      }
    });
    var vvipRecords = [];
    if (vvipSheet) {
      vvipSheet.getDataRange().getValues().slice(1).forEach(function(row, index) {
        if (normalizeVvipMonthKey_(row[2]) !== targetMonth ||
            !selectedCalendarIds[cleanText_(row[3])] ||
            !isActiveVvipSelectionRow_(row)) return;
        vvipRecords.push({ rowNumber: index + 2, row: row });
      });
    }

    var auditSheet = requireSheet_(ss, SHEETS.AUDIT);
    assertHeaders_(auditSheet, SHEET_HEADERS.AUDIT);
    var leaveSnapshots = records.map(function(record) {
      var values = record.row.slice(5, 19);
      while (values.length < 14) values.push('');
      return {
        rowNumber: record.rowNumber,
        values: values
      };
    });
    var vvipSnapshots = vvipRecords.map(function(record) {
      var values = record.row.slice(8, 13);
      while (values.length < 5) values.push('');
      return {
        rowNumber: record.rowNumber,
        values: values
      };
    });
    var now = getTimestamp_();
    var auditEvents = records.map(function(record) {
      return {
        actor: actor,
        action: '管理員關閉 OB 已取消代課',
        targetId: cleanText_(record.row[9]),
        before: cleanText_(record.row[5]),
        after: '已取消',
        reason: getEffectiveOpenLeaveCalendarId_(record.row)
      };
    }).concat(vvipRecords.map(function(record) {
      return {
        actor: actor,
        action: 'VVIP 課程取消',
        targetId: cleanText_(record.row[3]),
        before: cleanText_(record.row[8]),
        after: CONFIG.VVIP_COURSE_CANCELLED_STATUS,
        reason: cleanText_(record.row[1])
      };
    }));
    try {
      records.forEach(function(record, index) {
        var nextValues = leaveSnapshots[index].values.slice();
        nextValues[0] = '已取消';
        nextValues[3] = '已完成';
        nextValues[10] = '已關閉';
        nextValues[11] = now;
        nextValues[12] = 'OB 已取消課程';
        nextValues[13] = 'OB 已取消／代課已關閉';
        leaveSheet.getRange(record.rowNumber, 6, 1, 14).setValues([nextValues]);
      });
      vvipRecords.forEach(function(record) {
        vvipSheet.getRange(record.rowNumber, 9, 1, 5).setValues([[
          CONFIG.VVIP_COURSE_CANCELLED_STATUS,
          cleanText_(record.row[9]),
          now,
          'OB 課程已取消',
          actor
        ]]);
      });
      appendAuditEventsUnlocked_(auditSheet, auditEvents);
    } catch (error) {
      var rollbackFailures = [];
      vvipSnapshots.slice().reverse().forEach(function(snapshot) {
        try {
          vvipSheet.getRange(snapshot.rowNumber, 9, 1, 5).setValues([snapshot.values]);
        } catch (restoreError) {
          rollbackFailures.push('VVIP 第 ' + snapshot.rowNumber + ' 列：' + getErrorMessage_(restoreError));
        }
      });
      leaveSnapshots.slice().reverse().forEach(function(snapshot) {
        try {
          leaveSheet.getRange(snapshot.rowNumber, 6, 1, 14).setValues([snapshot.values]);
        } catch (restoreError) {
          rollbackFailures.push('代課第 ' + snapshot.rowNumber + ' 列：' + getErrorMessage_(restoreError));
        }
      });
      if (rollbackFailures.length) {
        throw new Error(getErrorMessage_(error) + '；精準回復失敗：' + rollbackFailures.join('；'));
      }
      throw error;
    }
    invalidateVvipReadCaches_(targetMonth);
    return { closed: records.length, vvipCancelled: vvipRecords.length };
  });
}

function requestLeaveCancellation_(session, substituteId, reason) {
  var teacher = getSessionTeacherName_(session);
  var auditActor = getSessionAuditActor_(session);
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
        actor: auditActor,
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
  var auditActor = getSessionAuditActor_(session);
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
        actor: auditActor,
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
  var pushRecipient = '';
  var pushMessage = null;
  if (normalizedDecision === 'reject' && !resolutionReason) throw new Error('駁回時請填寫原因。');

  var result = withScriptLock_(function() {
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
    if (requestType === 'withdrawal' && priorSubstitute) {
      pushRecipient = priorSubstitute;
      pushMessage = {
        heading: normalizedDecision === 'approve' ? '退出代課已核准' : '退出代課未核准',
        content: normalizedDecision === 'approve'
          ? '管理員已核准退出申請，該課將在 OB 回復後重新開放。'
          : '管理員已駁回退出申請' + (resolutionReason ? '：' + resolutionReason : '。'),
        url: buildAppViewUrl_('mysubs')
      };
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
  if (pushRecipient && pushMessage) {
    sendPushAfterMutationSafely_([pushRecipient], pushMessage);
  }
  return result;
}

function reconcileObChanges_(session) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  return withScriptLock_(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    var specialRequestSheet = ss.getSheetByName(SHEETS.SPECIAL_COURSE_REQUESTS);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    if (specialRequestSheet) {
      assertHeaders_(specialRequestSheet, SHEET_HEADERS.SPECIAL_COURSE_REQUESTS);
    }
    var leaveRows = leaveSheet.getDataRange().getValues();
    var courseRows = courseSheet.getDataRange().getValues().slice(1);
    var specialRequestRows = specialRequestSheet
      ? specialRequestSheet.getDataRange().getValues()
      : [];
    var courseByCalendarId = {};
    var targetMonth = getNextMonthKey_();
    courseRows.forEach(function(row) {
      var calendarId = cleanText_(row[4]);
      if (calendarId) courseByCalendarId[calendarId] = row;
    });

    var result = { checked: 0, matched: 0, exceptions: 0 };
    var updates = [];
    var specialRequestUpdates = [];
    var audits = [];
    var ownSpecialRequestByGroup = {};
    for (var specialIndex = 1; specialIndex < specialRequestRows.length; specialIndex++) {
      var specialRow = specialRequestRows[specialIndex];
      if (!specialRequestHasOwnSlot_(specialRow)) continue;
      var specialRequestGroupId = cleanText_(specialRow[1]);
      if (specialRequestGroupId) {
        ownSpecialRequestByGroup[specialRequestGroupId] = {
          rowIndex: specialIndex,
          row: specialRow
        };
      }
    }
    var specialGroupRows = {};
    for (var groupRowIndex = 1; groupRowIndex < leaveRows.length; groupRowIndex++) {
      var groupRow = leaveRows[groupRowIndex];
      if (!isLeaveRowInMonth_(groupRow, targetMonth)) continue;
      var groupId = cleanText_(groupRow[21]);
      if (!groupId || getObExpectation_(groupRow, courseRows).restoreType) continue;
      if (ownSpecialRequestByGroup[groupId]) continue;
      if (!specialGroupRows[groupId]) specialGroupRows[groupId] = [];
      specialGroupRows[groupId].push({ rowIndex: groupRowIndex, row: groupRow });
    }

    var reconcileTargets = [];
    var processedSpecialGroups = {};
    for (var rowIndex = 1; rowIndex < leaveRows.length; rowIndex++) {
      var row = leaveRows[rowIndex];
      if (!isLeaveRowInMonth_(row, targetMonth) || !isActiveObWorkRow_(row)) continue;
      var expectation = getObExpectation_(row, courseRows);
      var specialGroupId = cleanText_(row[21]);
      if (specialGroupId && ownSpecialRequestByGroup[specialGroupId] && !expectation.restoreType) {
        continue;
      }
      if (specialGroupId && !expectation.restoreType) {
        if (processedSpecialGroups[specialGroupId]) continue;
        processedSpecialGroups[specialGroupId] = true;
        var groupRecords = specialGroupRows[specialGroupId] || [];
        var groupOutcome = getSpecialCourseGroupObOutcome_(groupRecords, courseByCalendarId);
        groupRecords.filter(function(record) {
          return isActiveObWorkRow_(record.row);
        }).forEach(function(record) {
          reconcileTargets.push({
            rowIndex: record.rowIndex,
            row: record.row,
            effectiveCalendarId: groupOutcome.effectiveCalendarId,
            expectation: getObExpectation_(record.row, courseRows),
            differences: groupOutcome.differences
          });
        });
        continue;
      }
      var effectiveCalendarId = cleanText_(row[20]) || cleanText_(row[10]);
      var obRow = courseByCalendarId[effectiveCalendarId];
      reconcileTargets.push({
        rowIndex: rowIndex,
        row: row,
        effectiveCalendarId: effectiveCalendarId,
        expectation: expectation,
        differences: getObCourseDifferences_(effectiveCalendarId, obRow, expectation)
      });
    }

    reconcileTargets.forEach(function(target) {
      result.checked += 1;
      var rowIndex = target.rowIndex;
      var row = target.row;
      var effectiveCalendarId = target.effectiveCalendarId;
      var expectation = target.expectation;
      var differences = target.differences;
      var now = getTimestamp_();
      var before = cleanText_(row[15]);
      var auditAfter = '';
      var nextRow = row.slice();
      while (nextRow.length < SHEET_HEADERS.LEAVES.length) nextRow.push('');
      if (!differences.length) {
        if (expectation.closeType === 'delay-occupancy') {
          nextRow[8] = '已完成';
          nextRow[15] = '已關閉';
          nextRow[16] = now;
          nextRow[17] = '';
          nextRow[18] = '延後占用／OB 已關閉';
        } else if (expectation.restoreType === 'cancellation') {
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
          action: expectation.closeType === 'delay-occupancy'
            ? '延後占用 OB 關閉完成'
            : (expectation.restoreType ? 'OB 回復完成' : 'OB 核對完成'),
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
          action: expectation.closeType === 'delay-occupancy'
            ? '延後占用 OB 尚未關閉'
            : (expectation.restoreType ? 'OB 回復異常' : 'OB 核對異常'),
          targetId: row[9],
          before: before,
          after: '核對異常',
          reason: differenceText
        });
      }
      updates.push({ rowNumber: rowIndex + 1, values: nextRow.slice(5, 21) });
    });

    Object.keys(ownSpecialRequestByGroup).forEach(function(groupId) {
      var requestRecord = ownSpecialRequestByGroup[groupId];
      var requestRow = requestRecord.row;
      if (!isSpecialRequestRowInMonth_(requestRow, targetMonth)) return;
      if (['已核對', '已完成'].indexOf(cleanText_(requestRow[15])) !== -1 ||
          cleanText_(requestRow[14]) === '已完成') {
        return;
      }
      var outcome = getSpecialCourseRequestObOutcome_(requestRow, courseByCalendarId);
      var differences = outcome.differences;
      var now = getTimestamp_();
      var nextRequestRow = requestRow.slice();
      while (nextRequestRow.length < SHEET_HEADERS.SPECIAL_COURSE_REQUESTS.length) nextRequestRow.push('');
      result.checked += 1;
      if (!differences.length) {
        nextRequestRow[14] = '已完成';
        nextRequestRow[15] = '已核對';
        nextRequestRow[16] = now;
        nextRequestRow[17] = '';
        result.matched += 1;
      } else {
        nextRequestRow[14] = '待處理';
        nextRequestRow[15] = '核對異常';
        nextRequestRow[16] = now;
        nextRequestRow[17] = differences.join('；');
        result.exceptions += 1;
      }
      specialRequestUpdates.push({
        rowNumber: requestRecord.rowIndex + 1,
        values: nextRequestRow.slice(14, 18)
      });
      audits.push({
        actor: actor,
        action: differences.length ? '特別課 OB 核對異常' : '特別課 OB 核對完成',
        targetId: groupId,
        before: cleanText_(requestRow[15]),
        after: cleanText_(nextRequestRow[15]),
        reason: differences.length ? differences.join('；') : outcome.effectiveCalendarId
      });

      for (var linkedIndex = 1; linkedIndex < leaveRows.length; linkedIndex++) {
        var linkedRow = leaveRows[linkedIndex];
        if (cleanText_(linkedRow[21]) !== groupId || cleanText_(linkedRow[5]) !== '已領取') continue;
        var nextLinkedRow = linkedRow.slice();
        while (nextLinkedRow.length < SHEET_HEADERS.LEAVES.length) nextLinkedRow.push('');
        nextLinkedRow[8] = differences.length ? '待處理' : '已完成';
        nextLinkedRow[15] = differences.length ? '核對異常' : '已核對';
        nextLinkedRow[16] = now;
        nextLinkedRow[17] = differences.length ? differences.join('；') : '';
        updates.push({ rowNumber: linkedIndex + 1, values: nextLinkedRow.slice(5, 21) });
      }
    });

    if (!updates.length && !specialRequestUpdates.length) return result;
    var transitionSheets = [leaveSheet];
    if (specialRequestSheet) transitionSheets.push(specialRequestSheet);
    return runStateTransitionUnlocked_(transitionSheets, function(appendAudits) {
      updates.forEach(function(update) {
        leaveSheet.getRange(update.rowNumber, 6, 1, 16).setValues([update.values]);
      });
      specialRequestUpdates.forEach(function(update) {
        specialRequestSheet.getRange(update.rowNumber, 15, 1, 4).setValues([update.values]);
      });
      appendAudits(audits);
      return result;
    });
  });
}

function isSpecialRequestRowInMonth_(row, month) {
  var date = formatMyDate(row && row[3]);
  var match = /^(\d{4})\/(\d{2})\//.exec(date);
  return Boolean(match) && match[1] + '-' + match[2] === cleanText_(month);
}

function getSpecialCourseRequestObOutcome_(requestRow, courseByCalendarId) {
  var candidateIds = [];
  var replacementId = cleanText_(requestRow && requestRow[18]);
  if (replacementId) candidateIds.push(replacementId);
  getSpecialRequestSourceSlots_(requestRow).forEach(function(slot) {
    var calendarId = cleanText_(slot && slot.calendarId);
    if (calendarId) candidateIds.push(calendarId);
  });
  var existingIds = [];
  candidateIds.forEach(function(calendarId) {
    if (!courseByCalendarId[calendarId] || existingIds.indexOf(calendarId) !== -1) return;
    existingIds.push(calendarId);
  });
  if (!existingIds.length) {
    return { effectiveCalendarId: '', differences: ['找不到特別課群組的 OB 課程'] };
  }
  if (existingIds.length > 1) {
    return {
      effectiveCalendarId: '',
      differences: ['同一特別課安排找到多堂 OB 課程，請確認只保留一堂實際特別課']
    };
  }
  var effectiveCalendarId = existingIds[0];
  return {
    effectiveCalendarId: effectiveCalendarId,
    differences: getObCourseDifferences_(
      effectiveCalendarId,
      courseByCalendarId[effectiveCalendarId],
      {
        teacher: cleanText_(requestRow[2]),
        course: cleanText_(requestRow[8]),
        difficulty: cleanText_(requestRow[9]),
        classId: '',
        restoreType: ''
      },
      normalizeSpecialCourseReconciliationName_
    )
  };
}

function getObCourseDifferences_(effectiveCalendarId, obRow, expectation, courseNameNormalizer) {
  var differences = [];
  var normalizeCourse = typeof courseNameNormalizer === 'function'
    ? courseNameNormalizer
    : normalizeOrdinaryCourseReconciliationName_;
  if (expectation && expectation.closeType === 'delay-occupancy') {
    if (!effectiveCalendarId) {
      differences.push('尚未連結 OB Calendar ID');
    } else if (obRow) {
      differences.push('OB 課程仍存在，尚未關閉');
    }
    return differences;
  }
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
    } else {
      var courseNamesMatch = typeof courseNameNormalizer === 'function'
        ? normalizeCourse(obRow[2]) === normalizeCourse(expectation.course)
        : ordinaryCourseReconciliationNamesMatch_(expectation.course, obRow[2], {
          allowRoomChange: expectation.allowRoomChange === true,
          ignoreNewTeacherMarker: expectation.promotionType === 'new-teacher'
        });
      if (!courseNamesMatch) {
        differences.push('課程不一致：預期 ' + expectation.course + '，OB 為 ' + cleanText_(obRow[2]));
      }
      if (typeof courseNameNormalizer === 'function' &&
          Object.prototype.hasOwnProperty.call(expectation, 'difficulty')) {
        var expectedParts = getSpecialCourseReconciliationParts_(expectation.course);
        var actualParts = getSpecialCourseReconciliationParts_(obRow[2]);
        var expectedDifficulty = cleanText_(expectation.difficulty) || expectedParts.difficulty;
        var actualDifficulty = actualParts.difficulty;
        if (actualDifficulty &&
            normalizeCourseReconciliationDifficulty_(expectedDifficulty) !==
            normalizeCourseReconciliationDifficulty_(actualDifficulty)) {
          differences.push(
            '等級不一致：預期 ' + (expectedDifficulty || '未標示') +
            '，OB 為 ' + (actualDifficulty || '未標示')
          );
        }
      }
    }
    if (expectation.expectedTime && formatMyTime(obRow[1]) !== expectation.expectedTime) {
      differences.push(
        '時間不一致：預期 ' + expectation.expectedTime + '，OB 為 ' + formatMyTime(obRow[1])
      );
    }
  }
  return differences;
}

function normalizeOrdinaryCourseReconciliationName_(value) {
  return normalizeCourseName_(value).replace(/(lv\.?\d+)[~\-–—](\d+)/g, '$1~$2');
}

function ordinaryCourseReconciliationNamesMatch_(expectedCourse, obCourse, options) {
  var settings = options || {};
  var expected = cleanText_(expectedCourse);
  var actual = cleanText_(obCourse);
  if (settings.ignoreNewTeacherMarker) {
    expected = stripNewTeacherMarker_(expected);
    actual = stripNewTeacherMarker_(actual);
  }
  if (settings.allowRoomChange || !getCourseRoom_(expected)) {
    expected = expected.replace(/^\s*[A-D]\s*[－—–-]\s*/i, '');
    actual = actual.replace(/^\s*[A-D]\s*[－—–-]\s*/i, '');
  }
  return normalizeOrdinaryCourseReconciliationName_(expected) ===
    normalizeOrdinaryCourseReconciliationName_(actual);
}

function normalizeSpecialCourseReconciliationName_(value) {
  return getSpecialCourseReconciliationParts_(value).name;
}

function getSpecialCourseReconciliationParts_(value) {
  var displayName = stripCourseRoom_(value)
    .replace(/[（(]\s*\d+\s*(?:min|分鐘)\s*[)）]\s*$/i, '')
    .replace(/[＆﹠]/g, '&')
    .replace(/瑜珈/g, '瑜伽');
  var courseParts = parseClaimCourseOption_(displayName);
  var normalizedName = normalizeCourseName_(courseParts.courseTypeName.replace(/\s*特別課\s*$/, ''))
    .replace(/摺疊環/g, '折疊環')
    .replace(/迷你環綢舞碼/g, '迷你環綢');
  return {
    name: normalizedName,
    difficulty: cleanText_(courseParts.difficulty)
  };
}

function normalizeCourseReconciliationDifficulty_(value) {
  return normalizeClaimDifficulty_(value).replace(/(lv\.?\d+)[~\-–—](\d+)/g, '$1~$2');
}

function getSpecialCourseGroupObOutcome_(groupRecords, courseByCalendarId) {
  var existingIds = [];
  var seenIds = {};
  groupRecords.forEach(function(record) {
    var row = record.row;
    var effectiveCalendarId = cleanText_(row[20]) || cleanText_(row[10]);
    if (!effectiveCalendarId || !courseByCalendarId[effectiveCalendarId] || seenIds[effectiveCalendarId]) {
      return;
    }
    seenIds[effectiveCalendarId] = true;
    existingIds.push(effectiveCalendarId);
  });

  if (!existingIds.length) {
    return {
      effectiveCalendarId: '',
      differences: ['找不到特別課群組的 OB 課程']
    };
  }
  if (existingIds.length > 1) {
    return {
      effectiveCalendarId: '',
      differences: ['同一特別課群組找到多堂 OB 課程，請確認只保留一堂實際特別課']
    };
  }

  var effectiveCalendarId = existingIds[0];
  var expectation = getObExpectation_(groupRecords[0].row);
  return {
    effectiveCalendarId: effectiveCalendarId,
    differences: getObCourseDifferences_(
      effectiveCalendarId,
      courseByCalendarId[effectiveCalendarId],
      expectation,
      normalizeSpecialCourseReconciliationName_
    )
  };
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
  if (cleanText_(row[5]) === '延後占用') {
    return ['待關閉 OB', '核對異常'].indexOf(cleanText_(row[15])) !== -1;
  }
  if (cleanText_(row[5]) !== '已領取') return false;
  return ['', '待核對', '核對異常'].indexOf(cleanText_(row[15])) !== -1;
}

function getObExpectation_(row, courseRows, newTeacherMonthMap) {
  var changeStatus = cleanText_(row[18]);
  if (cleanText_(row[5]) === '延後占用') {
    return {
      teacher: '',
      course: '',
      classId: '',
      expectedTime: '',
      restoreType: '',
      closeType: 'delay-occupancy'
    };
  }
  if (changeStatus === '取消後待回復 OB') {
    return {
      teacher: cleanText_(row[1]),
      course: cleanText_(row[4]),
      classId: '',
      expectedTime: '',
      restoreType: 'cancellation',
      closeType: ''
    };
  }
  if (changeStatus === '退出後待回復 OB') {
    return {
      teacher: cleanText_(row[1]),
      course: cleanText_(row[4]),
      classId: '',
      expectedTime: '',
      restoreType: 'withdrawal',
      closeType: ''
    };
  }
  var storedCourse = cleanText_(row[12]) || cleanText_(row[4]);
  var teacherIsNew = newTeacherMonthMap
    ? isTeacherNewInMonthMap_(row[6], row[2], newTeacherMonthMap)
    : isTeacherNewInMonth_(row[6], row[2], courseRows);
  var promotionType = teacherIsNew ? 'new-teacher' : '';
  var storedPromotionType = getCoursePromotionType_(storedCourse);
  var expectedClassId = cleanText_(row[11]);
  var allowRoomChange = Boolean(cleanText_(row[20]));
  if (allowRoomChange) expectedClassId = '';
  if (storedPromotionType !== promotionType) expectedClassId = '';
  if (expectedClassId) {
    var matchingClassRow = (courseRows || []).filter(function(courseRow) {
      return cleanText_(courseRow && courseRow[5]) === expectedClassId;
    })[0] || null;
    if (matchingClassRow && getCoursePromotionType_(matchingClassRow[2]) !== promotionType) {
      expectedClassId = '';
    }
  }
  return {
    teacher: cleanText_(row[6]),
    course: applyCoursePromotionType_(storedCourse, promotionType),
    difficulty: cleanText_(row[13]),
    classId: expectedClassId,
    promotionType: promotionType,
    allowRoomChange: allowRoomChange,
    expectedTime: cleanText_(row[21]) ? '' : formatMyTime(row[25]),
    restoreType: '',
    closeType: ''
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
    var courseSheet = requireSheet_(SpreadsheetApp.getActiveSpreadsheet(), CONFIG.COURSE_SHEET);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    var courseRows = courseSheet.getDataRange().getValues().slice(1);
    if (formatMyDate(record.row[2]) !== obCourse.date) {
      throw new Error('替代 OB 課程必須與這堂代課在同一天。');
    }
    var changeStatus = cleanText_(record.row[18]);
    var manualReview = cleanText_(record.row[15]) === '待人工核對';
    if (!manualReview && cleanText_(record.row[5]) !== '已領取' &&
        ['取消後待回復 OB', '退出後待回復 OB'].indexOf(changeStatus) === -1) {
      throw new Error('只有待處理 OB 的紀錄可以連結替代 OB 課程。');
    }
    var before = cleanText_(record.row[20]) || cleanText_(record.row[10]);
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
        var nextRow = record.row.slice();
        while (nextRow.length < SHEET_HEADERS.LEAVES.length) nextRow.push('');
        var isRestore = ['取消後待回復 OB', '退出後待回復 OB'].indexOf(changeStatus) !== -1;
        nextRow[20] = replacementId;
        if (!isRestore) {
          var originalStartMinutes = timeTextToMinutes_(formatMyTime(nextRow[3]));
          var replacementStartMinutes = timeTextToMinutes_(obCourse.time);
          nextRow[25] = obCourse.time;
          nextRow[26] = originalStartMinutes >= 0 && replacementStartMinutes >= 0
            ? replacementStartMinutes - originalStartMinutes
            : '';
        }

        var expectation = getObExpectation_(nextRow, courseRows);
        var differences = getObCourseDifferences_(
          replacementId,
          obCourse.sourceRow,
          expectation
        );
        var now = getTimestamp_();
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
          } else {
            nextRow[8] = '已完成';
            nextRow[15] = '已核對';
            nextRow[16] = now;
            nextRow[17] = '';
          }
        } else {
          nextRow[8] = expectation.restoreType ? '待回復' : '待處理';
          nextRow[15] = '核對異常';
          nextRow[16] = now;
          nextRow[17] = differences.join('；');
        }

        record.sheet.getRange(record.rowNumber, 9).setValue(nextRow[8]);
        record.sheet.getRange(record.rowNumber, 16, 1, 4).setValues([nextRow.slice(15, 19)]);
        record.sheet.getRange(record.rowNumber, 21).setValue(nextRow[20]);
        if (!isRestore) {
          record.sheet.getRange(record.rowNumber, 26, 1, 2).setValues([[nextRow[25], nextRow[26]]]);
        }
      }
      appendAudits([{
        actor: actor,
        action: manualReview ? '連結舊資料 OB 課程' : '連結並核對替代 OB 課程',
        targetId: id,
        before: before,
        after: replacementId,
        reason: obCourse.courseName + (manualReview || !differences.length ? '' : '；' + differences.join('；'))
      }]);
      return manualReview
        ? { substituteId: id, replacementCalendarId: replacementId }
        : {
            substituteId: id,
            replacementCalendarId: replacementId,
            verificationStatus: cleanText_(nextRow[15]) || (expectation.restoreType === 'withdrawal' ? '已重新開放' : ''),
            differences: differences,
            actualStartTime: formatMyTime(nextRow[25]) || formatMyTime(nextRow[3])
          };
    });
  });
}

function linkSpecialCourseRequestCalendarItem_(session, specialGroupId, replacementCalendarId) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var groupId = cleanText_(specialGroupId);
  var replacementId = cleanText_(replacementCalendarId);
  if (!groupId) throw new Error('找不到特別課群組，請重新整理。');
  if (!replacementId) throw new Error('請選擇替代的 OB 課程。');

  return withScriptLock_(function() {
    var obCourse = findObCourseByCalendarId_(replacementId);
    if (!obCourse) throw new Error('找不到選擇的替代 OB 課程，請先重新同步。');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = requireSheet_(ss, SHEETS.SPECIAL_COURSE_REQUESTS);
    assertHeaders_(sheet, SHEET_HEADERS.SPECIAL_COURSE_REQUESTS);
    var values = sheet.getDataRange().getValues();
    var rowNumber = 0;
    var before = '';
    for (var index = 1; index < values.length; index++) {
      if (cleanText_(values[index][1]) !== groupId) continue;
      rowNumber = index + 1;
      before = cleanText_(values[index][18]);
      break;
    }
    if (!rowNumber) throw new Error('找不到特別課安排紀錄，請重新整理。');

    return runStateTransitionUnlocked_([sheet], function(appendAudits) {
      sheet.getRange(rowNumber, 15, 1, 5).setValues([[
        '待處理', '待核對', '', '', replacementId
      ]]);
      appendAudits([{
        actor: actor,
        action: '連結特別課替代 OB 課程',
        targetId: groupId,
        before: before,
        after: replacementId,
        reason: obCourse.courseName
      }]);
      return { specialGroupId: groupId, replacementCalendarId: replacementId };
    });
  });
}

function buildCorrectedClaimSummary_(summary, difficulty, note) {
  var timingParts = [];
  var mainParts = cleanText_(summary).split('；').filter(function(part) {
    var value = cleanText_(part);
    if (!value || /^難度：/.test(value) || /^備註：/.test(value)) return false;
    if (/^實際開始：/.test(value)) {
      timingParts.push(value);
      return false;
    }
    return true;
  });
  if (difficulty) mainParts.push('難度：' + difficulty);
  if (note) mainParts.push('備註：' + note);
  return mainParts.concat(timingParts).join('；');
}

function correctClaimDetails_(session, substituteId, difficultyValue, noteValue) {
  var actor = assertCapabilitySession_(session, 'course_admin');
  var id = requireSubstituteId_(substituteId);
  var difficulty = cleanText_(difficultyValue);
  var note = cleanText_(noteValue);
  if (difficulty.length > 40) throw new Error('難度／等級最多 40 個字。');
  if (note.length > 240) throw new Error('備註最多 240 個字。');

  return withScriptLock_(function() {
    var record = getLeaveRecordByIdUnlocked_(id);
    if (cleanText_(record.row[5]) !== '已領取') {
      throw new Error('只有已領取的代課可以直接更正難度與備註。');
    }
    var nextRow = record.row.slice();
    var before = {
      difficulty: cleanText_(nextRow[13]),
      note: cleanText_(nextRow[7]),
      verificationStatus: cleanText_(nextRow[15])
    };
    nextRow[7] = buildCorrectedClaimSummary_(nextRow[7], difficulty, note);
    nextRow[13] = difficulty;
    nextRow[15] = '待核對';
    nextRow[16] = '';
    nextRow[17] = '';

    return runStateTransitionUnlocked_([record.sheet], function(appendAudits) {
      record.sheet.getRange(record.rowNumber, 8, 1, 11).setValues([
        nextRow.slice(7, 18)
      ]);
      appendAudits([{
        actor: actor,
        action: '管理員更正領課資料',
        targetId: id,
        before: JSON.stringify(before),
        after: JSON.stringify({ difficulty: difficulty, note: note, verificationStatus: '待核對' }),
        reason: '不需退領，保留原領課老師並重新進入 OB 核對'
      }]);
      return {
        substituteId: id,
        difficulty: difficulty,
        note: note,
        verificationStatus: '待核對'
      };
    });
  });
}

function getCourseClosureDashboard_(session) {
  assertCapabilitySession_(session, 'course_admin');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureCourseClosureStructureUnlocked_(ss);
  var settingSheet = requireSheet_(ss, SHEETS.COURSE_CLOSURE_SETTINGS);
  var logSheet = requireSheet_(ss, SHEETS.COURSE_CLOSURE_LOG);
  assertHeaders_(settingSheet, SHEET_HEADERS.COURSE_CLOSURE_SETTINGS);
  assertHeaders_(logSheet, SHEET_HEADERS.COURSE_CLOSURE_LOG);
  var settings = getCourseClosureSettingsUnlocked_(settingSheet);
  var logs = logSheet.getDataRange().getValues().slice(1).map(function(row) {
    return {
      executedAt: cleanText_(row[0]),
      targetDate: cleanText_(row[1]),
      stage: cleanText_(row[2]),
      calendarId: cleanText_(row[3]),
      courseName: cleanText_(row[4]),
      teacherName: cleanText_(row[5]),
      enrollmentCount: row[6] === '' ? null : Number(row[6]),
      ruleLabel: cleanText_(row[7]),
      onlyEmpty: cleanText_(row[8]) === '是',
      result: cleanText_(row[9]),
      error: cleanText_(row[10]),
      actor: cleanText_(row[11])
    };
  }).reverse().slice(0, 50);
  var triggerStatus = getCourseClosureTriggerStatus_();
  var manualAvailability = getManualCourseClosureStageAvailability_();
  return {
    mode: settings.mode,
    automatic: settings.automatic,
    triggerCount: triggerStatus.triggerCount,
    triggerAuthorizationRequired: triggerStatus.authorizationRequired,
    triggerInstallationRequired: triggerStatus.installationRequired,
    triggerInstalledAt: triggerStatus.installedAt,
    targetDate: getTomorrowDate_(),
    socialCopy: getCourseClosureSocialCopy_(getTomorrowDate_()),
    currentTime: manualAvailability.currentTime,
    manualStageAvailability: manualAvailability.stages,
    unclaimedCandidates: getUnclaimedSubstituteClosureCandidates_(session),
    recentLogs: logs
  };
}

function getAdminDashboard_(session) {
  assertCapabilitySession_(session, 'course_admin');
  return (function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveSheet = requireSheet_(ss, CONFIG.LEAVE_SHEET);
    var invitationSheet = requireSheet_(ss, SHEETS.INVITATIONS);
    var accountSheet = requireSheet_(ss, SHEETS.ACCOUNTS);
    var courseSheet = requireSheet_(ss, CONFIG.COURSE_SHEET);
    var specialRequestSheet = ss.getSheetByName(SHEETS.SPECIAL_COURSE_REQUESTS);
    assertHeaders_(leaveSheet, SHEET_HEADERS.LEAVES);
    assertHeaders_(invitationSheet, SHEET_HEADERS.INVITATIONS);
    assertHeaders_(accountSheet, SHEET_HEADERS.ACCOUNTS);
    assertHeaders_(courseSheet, SHEET_HEADERS.COURSE_LIST);
    if (specialRequestSheet) {
      assertHeaders_(specialRequestSheet, SHEET_HEADERS.SPECIAL_COURSE_REQUESTS);
    }

    var auditByTarget = getAuditHistoryMap_();
    var courseRows = courseSheet.getDataRange().getValues().slice(1);
    var courseCalendarIds = buildCourseCalendarIdSet_(courseRows);
    var newTeacherMonthMap = buildNewTeacherMonthMap_(courseRows);
    var leaveSourceRows = leaveSheet.getDataRange().getValues().slice(1).filter(function(row) {
      return cleanText_(row[9]);
    });
    var targetMonth = getNextMonthKey_();
    var leaves = leaveSourceRows.map(function(row) {
      return toAdminLeaveItem_(
        row,
        auditByTarget[cleanText_(row[9])] || [],
        courseRows,
        newTeacherMonthMap
      );
    });
    var leaveById = {};
    leaves.forEach(function(item) {
      leaveById[item.substituteId] = item;
    });
    leaves.forEach(function(item) {
      item.delaySourceTeacher = item.delaySourceSubstituteId && leaveById[item.delaySourceSubstituteId]
        ? leaveById[item.delaySourceSubstituteId].substituteTeacher
        : '';
    });
    var ownSpecialRequests = specialRequestSheet
      ? specialRequestSheet.getDataRange().getValues().slice(1).filter(function(row) {
          return cleanText_(row[1]) && specialRequestHasOwnSlot_(row);
        }).map(function(row) {
          return toAdminSpecialCourseRequestItem_(row, auditByTarget[cleanText_(row[1])] || []);
        })
      : [];
    var ownSpecialGroupIds = {};
    ownSpecialRequests.forEach(function(item) {
      ownSpecialGroupIds[item.specialGroupId] = true;
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
    var replacementOptions = courseRows.map(function(row) {
      return {
        calendarId: cleanText_(row[4]),
        courseName: cleanText_(row[2]),
        teacherName: cleanText_(row[3]),
        date: formatMyDate(row[0]),
        time: formatMyTime(row[1])
      };
    }).filter(function(item) {
      var match = /^(\d{4})\/(\d{2})\//.exec(item.date);
      return item.calendarId && Boolean(match) && match[1] + '-' + match[2] === targetMonth;
    });

    return {
      paused: areClaimsPaused_(),
      leavePaused: areLeavesPaused_(),
      teachers: teachers,
      pendingInvitations: leaves.filter(function(item, index) {
        return isOrdinaryOpenLeaveRow_(leaveSourceRows[index]) &&
          isLeaveRowInMonth_(leaveSourceRows[index], targetMonth) &&
          courseCalendarIds[getEffectiveOpenLeaveCalendarId_(leaveSourceRows[index])];
      }),
      missingObCancellations: leaves.filter(function(item, index) {
        return isMissingObCancellationCandidateRow_(
          leaveSourceRows[index],
          courseCalendarIds,
          targetMonth
        );
      }),
      activeInvitees: activeInvitees,
      delayClosures: leaves.filter(function(item, index) {
        return item.status === '延後占用' &&
          ['待關閉 OB', '核對異常'].indexOf(item.verificationStatus) !== -1 &&
          isLeaveRowInMonth_(leaveSourceRows[index], targetMonth);
      }),
      obWork: leaves.filter(function(item) {
        if (ownSpecialGroupIds[item.specialGroupId]) return false;
        return ['取消後待回復 OB', '退出後待回復 OB'].indexOf(item.changeStatus) !== -1 ||
          (item.status === '延後占用' &&
            ['待關閉 OB', '核對異常'].indexOf(item.verificationStatus) !== -1) ||
          (item.status === '已領取' &&
            ['', '待核對', '核對異常'].indexOf(item.verificationStatus) !== -1);
      }).concat(ownSpecialRequests.filter(function(item) {
        return ['待處理', '核對異常'].indexOf(item.status) !== -1 ||
          ['', '待核對', '核對異常'].indexOf(item.verificationStatus) !== -1;
      })),
      changeRequests: leaves.filter(function(item) {
        return ['申請取消中', '申請退出中'].indexOf(item.changeStatus) !== -1;
      }),
      exceptions: leaves.filter(function(item, index) {
        if (ownSpecialGroupIds[item.specialGroupId]) return false;
        return isLeaveRowInMonth_(leaveSourceRows[index], targetMonth) &&
          ['核對異常', '待人工核對'].indexOf(item.verificationStatus) !== -1;
      }).concat(ownSpecialRequests.filter(function(item) {
        return item.verificationStatus === '核對異常';
      })),
      completed: leaves.filter(function(item) {
        if (ownSpecialGroupIds[item.specialGroupId]) return false;
        return item.status !== '已取消' &&
          ['已核對', '已回復核對', '已關閉'].indexOf(item.verificationStatus) !== -1;
      }).concat(ownSpecialRequests.filter(function(item) {
        return item.verificationStatus === '已核對';
      })),
      courseClosure: getCourseClosureDashboard_(session),
      monthlyDiscount: getMonthlyDiscountDashboardUnlocked_(ss),
      courseAdjustments: getPendingCourseAdjustments_(session),
      replacementOptions: replacementOptions
    };
  })();
}

function toAdminLeaveItem_(row, auditHistory, courseRows, newTeacherMonthMap) {
  var storedCourse = cleanText_(row[12]) || cleanText_(row[4]);
  var expectedCourse = cleanText_(row[21])
    ? storedCourse
    : (getObExpectation_(row, courseRows, newTeacherMonthMap).course || storedCourse);
  return {
    substituteId: cleanText_(row[9]),
    originalTeacher: cleanText_(row[1]),
    substituteTeacher: cleanText_(row[6]),
    date: formatMyDate(row[2]),
    time: formatMyTime(row[3]),
    originalCourse: cleanText_(row[4]),
    actualCourse: expectedCourse,
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
    specialGroupId: cleanText_(row[21]),
    specialMode: cleanText_(row[22]),
    specialDurationMinutes: Number(row[23]) || 0,
    specialActualStartTime: getSpecialCourseActualStartTime_(row[23], row[24]),
    specialEndTime: formatMyTime(row[24]),
    actualStartTime: formatMyTime(row[25]) || formatMyTime(row[3]),
    startDelayMinutes: Number(row[26]) || 0,
    delaySourceSubstituteId: cleanText_(row[27]),
    courseAdjustmentGroupId: cleanText_(row[28]),
    courseAdjustmentConfirmedAt: cleanText_(row[29]),
    courseAdjustmentConfirmedBy: cleanText_(row[30]),
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
  var selectedCourseTypeKey = cleanText_(item.courseTypeKey);
  var selectedCourseKey = cleanText_(item.courseKey);
  var difficulty = cleanText_(item.difficulty);
  var note = cleanText_(item.note);
  var actualClassId = '';
  var actualCourseName = '';
  var actualCategory = '';
  var handlingType = '';
  var promotionType = isTeacherNewInMonth_(teacher, item.targetDate, item.courseRows)
    ? 'new-teacher'
    : '';

  if (!teacher || !targetCourseName) throw new Error('代課課程資料不完整，請重新整理。');

  if (handlingKey === 'original') {
    if (!teacherCanTeachCategory_(teacher, targetCategory)) {
      throw new Error('這堂課不在您的可教授類別中，不能沿用原課程。');
    }
    var originalCourse = findObCourseByCalendarId_(item.targetCalendarId);
    if (originalCourse && getCoursePromotionType_(originalCourse.courseName) === promotionType) {
      actualClassId = originalCourse.classId;
      actualCourseName = applyCoursePromotionType_(targetCourseName, promotionType);
    } else {
      var resolvedOriginalCourse = resolveCatalogCourseForRoom_(
        getObClassCatalog_(),
        normalizeCourseCatalogKey_(targetCourseName),
        targetCourseName,
        promotionType
      );
      actualClassId = resolvedOriginalCourse ? resolvedOriginalCourse.actualClassId : '';
      actualCourseName = resolvedOriginalCourse
        ? resolvedOriginalCourse.actualCourseName
        : applyCoursePromotionType_(targetCourseName, promotionType);
    }
    actualCategory = targetCategory;
    difficulty = parseClaimCourseOption_(targetCourseName).difficulty;
    note = '';
    handlingType = '沿用原課程';
  } else if (handlingKey === 'existing') {
    if (selectedCourseTypeKey) {
      var recurringOption = findRecurringClaimOptionForTeacher_(
        teacher,
        selectedCourseTypeKey,
        difficulty
      );
      if (!recurringOption) {
        throw new Error('找不到選擇的固定課程類型與難度，請重新整理。');
      }
      var recurringResolvedCourse = resolveCatalogCourseForRoom_(
        getObClassCatalog_(),
        recurringOption.courseKey,
        targetCourseName,
        promotionType
      );
      if (!recurringResolvedCourse) {
        throw new Error('找不到選擇的 OB 課程項目，請重新整理。');
      }
      actualClassId = recurringResolvedCourse.actualClassId;
      actualCourseName = recurringResolvedCourse.actualCourseName;
      actualCategory = recurringResolvedCourse.category;
      difficulty = recurringOption.difficulty;
      handlingType = recurringResolvedCourse.needsCreation ? '需要新增課程' : '改用既有 OB 課程';
    } else if (selectedCourseKey) {
      var resolvedCourse = resolveCatalogCourseForRoom_(
        getObClassCatalog_(),
        selectedCourseKey,
        targetCourseName,
        promotionType
      );
      if (!resolvedCourse) throw new Error('找不到選擇的 OB 課程項目，請重新整理。');
      actualClassId = resolvedCourse.actualClassId;
      actualCourseName = resolvedCourse.actualCourseName;
      actualCategory = resolvedCourse.category;
      difficulty = parseClaimCourseOption_(actualCourseName).difficulty;
      handlingType = resolvedCourse.needsCreation ? '需要新增課程' : '改用既有 OB 課程';
    } else {
      actualClassId = cleanText_(item.actualClassId);
      if (!actualClassId) throw new Error('請選擇要改用的 OB 現有課程。');
      var existingCourse = findObCourseByClassId_(actualClassId);
      if (!existingCourse) throw new Error('找不到選擇的 OB 現有課程，請重新整理。');
      if (getCoursePromotionType_(existingCourse.courseName) === promotionType) {
        actualCourseName = applyCoursePromotionType_(existingCourse.courseName, promotionType);
        actualCategory = existingCourse.category;
      } else {
        var resolvedExistingCourse = resolveCatalogCourseForRoom_(
          getObClassCatalog_(),
          normalizeCourseCatalogKey_(existingCourse.courseName),
          targetCourseName,
          promotionType
        );
        if (!resolvedExistingCourse) throw new Error('找不到選擇的 OB 現有課程，請重新整理。');
        actualClassId = resolvedExistingCourse.actualClassId;
        actualCourseName = resolvedExistingCourse.actualCourseName;
        actualCategory = resolvedExistingCourse.category;
      }
      difficulty = parseClaimCourseOption_(actualCourseName).difficulty;
      handlingType = '改用既有 OB 課程';
    }
  } else if (handlingKey === 'special') {
    actualCourseName = cleanText_(item.actualCourseName);
    actualCategory = '其他';
    if (!actualCourseName) throw new Error('請填寫特別課名稱。');
    handlingType = '需要新增課程';
  } else if (handlingKey === 'new') {
    actualCourseName = applyCoursePromotionType_(item.actualCourseName, promotionType);
    actualCategory = normalizeTeacherCapabilities_([item.category])[0] || '';
    if (!actualCourseName) throw new Error('請填寫需要新增的課程名稱。');
    if (!actualCategory) throw new Error('請選擇需要新增課程的類別。');
    handlingType = '需要新增課程';
  } else {
    throw new Error('課程處理方式無效，請重新選擇。');
  }

  if (handlingKey !== 'special' && !teacherCanTeachCategory_(teacher, actualCategory)) {
    throw new Error('所選課程類別不在可教授類別中。');
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
        category: getCourseCategory_(values[index][2]),
        teacherName: cleanText_(values[index][3]),
        date: formatMyDate(values[index][0]),
        time: formatMyTime(values[index][1]),
        sourceRow: values[index]
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

function parseJsonObject_(value, fieldName) {
  var parsed;
  try {
    parsed = JSON.parse(value || '{}');
  } catch (error) {
    throw new Error(fieldName + '資料格式錯誤。');
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(fieldName + '必須是物件。');
  }
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

function createPostResponse_(parameters, data) {
  if (cleanText_(parameters && parameters.transport) === 'iframe') {
    return createIframeRelayResponse_(parameters.requestId, data);
  }
  return createJsonResponse_(data);
}

function createIframeRelayResponse_(requestIdValue, data) {
  var requestId = cleanText_(requestIdValue);
  if (!/^[A-Za-z0-9_-]{8,120}$/.test(requestId)) requestId = '';
  var encodedPayload = Utilities.base64Encode(
    JSON.stringify(data),
    Utilities.Charset.UTF_8
  );
  var html = '<!doctype html><html><head><meta charset="utf-8"></head><body><script>' +
    '(function(){' +
    'var binary=atob(' + JSON.stringify(encodedPayload) + ');' +
    'var bytes=new Uint8Array(binary.length);' +
    'for(var i=0;i<binary.length;i++){bytes[i]=binary.charCodeAt(i);}' +
    'var payload=JSON.parse(new TextDecoder("utf-8").decode(bytes));' +
    'window.top.postMessage({' +
      'source:"sherry-gas-relay",' +
      'requestId:' + JSON.stringify(requestId) + ',' +
      'payload:payload' +
    '},"https://sherryaerial-web.github.io");' +
    '})();' +
    '<\/script></body></html>';
  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
