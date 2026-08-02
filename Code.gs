var CONFIG = {
  COURSE_SHEET: 'CourseList',
  LEAVE_SHEET: '工作表1',
  TEACHER_SHEET: '老師名單',
  API_URL: 'https://api.omceanbooking.com/v1/calendar',
  API_TOKEN_PROPERTY: 'OMCEAN_API_TOKEN',
  PAGE_SIZE: 100,
  LOCK_TIMEOUT_MS: 30000
};

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
  var instructors = item.instructors || [];
  var instructor = instructors.filter(function(person) {
    return person && person.isSubstitute !== true;
  })[0] || instructors[0] || item.instructor || {};

  var courseName = cleanText_(classInfo.nameZhHant || classInfo.nameEn || classInfo.name || '');
  var instructorName = cleanText_(
    instructor.name ||
    [instructor.firstName, instructor.lastName].filter(Boolean).join(' ')
  );
  var classTime = item.classTime || item.startAt || item.startTime || '';
  var parsedTime = new Date(classTime);

  if (!item.id || !courseName || !instructorName || !classTime || isNaN(parsedTime.getTime())) {
    return null;
  }

  var timezone = getTimeZone_();
  return {
    apiId: String(item.id),
    date: Utilities.formatDate(parsedTime, timezone, 'yyyy/MM/dd'),
    time: Utilities.formatDate(parsedTime, timezone, 'HH:mm'),
    course: courseName,
    instructor: instructorName
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

function syncCourseListFromApi() {
  var token = PropertiesService.getScriptProperties().getProperty(CONFIG.API_TOKEN_PROPERTY);
  if (!cleanText_(token)) {
    throw new Error('請先在指令碼屬性設定 OMCEAN_API_TOKEN。');
  }

  var range = getSyncDateRange_(new Date());
  var rawItems = fetchCalendarPages_(token, range.dateFrom, range.dateTo);
  var dedupe = {};
  var normalized = rawItems.map(normalizeCalendarItem_).filter(function(item) {
    if (!item) return false;
    var key = item.apiId || [item.date, item.time, item.course, item.instructor].join('|');
    if (dedupe[key]) return false;
    dedupe[key] = true;
    return true;
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
  assertHeaders_(sheet, ['日期', '時間', '課程', '指導者']);

  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  try {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
    var rows = normalized.map(function(item) {
      return [item.date, item.time, item.course, item.instructor];
    });
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
    sheet.getRange(2, 1, rows.length, 1).setNumberFormat('yyyy/mm/dd');
    sheet.getRange(2, 2, rows.length, 1).setNumberFormat('hh:mm');
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

function installHourlySyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'syncCourseListFromApi') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('syncCourseListFromApi').timeBased().everyHours(1).create();
  return { status: 'success', message: '已建立每小時課程同步。' };
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
