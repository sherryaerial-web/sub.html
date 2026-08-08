const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(__dirname, '..', 'vvip.html');
const html = fs.existsSync(pagePath) ? fs.readFileSync(pagePath, 'utf8') : '';
const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('VVIP public page is a standalone responsive intent-registration page', () => {
  assert.match(html, /name=["']viewport["']/);
  assert.match(html, /VVIP 優先選課意願登記/);
  assert.match(html, /不代表正式保留名額/);
  assert.match(html, /id=["']vvip-email-form["']/);
  assert.match(html, /id=["']vvip-email["']/);
  assert.match(html, /type=["']email["']/);
  assert.doesNotMatch(html, /老師登入|login-pin|teacher-options/);
});

test('VVIP public page posts Email and never adds it to a URL', () => {
  assert.match(html, /callVvipApi\(["']getVvipSelection["']/);
  assert.match(html, /callVvipApi\(["']submitVvipSelection["']/);
  assert.match(html, /method:\s*["']POST["']/);
  assert.match(html, /application\/x-www-form-urlencoded/);
  assert.doesNotMatch(html, /\?[^"']*email=/i);
  assert.doesNotMatch(html, /URLSearchParams\(\{[^}]*email/i);
});

test('VVIP public page groups courses, searches them, and enforces the cumulative four-course view', () => {
  assert.match(html, /groupCoursesByDate/);
  assert.match(html, /filterVvipCourses/);
  assert.match(html, /已選.*LIMIT/);
  assert.match(html, /selectedCalendarIds/);
  assert.match(html, /existingCalendarIds/);
  assert.match(html, /最多.*[四4]/);
  assert.match(html, /id=["']vvip-course-search["']/);
});

test('VVIP public page keeps closed, empty, duplicate, and retry states visible', () => {
  assert.match(html, /尚未開放|已截止/);
  assert.match(html, /尚無可選課程/);
  assert.match(html, /已選過/);
  assert.match(html, /重新整理|重試/);
  assert.match(html, /保留目前勾選/);
});

test('VVIP successful submission keeps the complete accumulated list visible', () => {
  assert.match(html, /const displayed = selected\.length \? selected : \(state\.data\.selections \|\| \[\]\)/);
  assert.match(html, /displayed\.map\(\(course\)/);
});

test('VVIP admin workspace is the seventh protected tab with management actions', () => {
  assert.equal((adminHtml.match(/role=["']tab["']/g) || []).length, 7);
  assert.match(adminHtml, /data-admin-tab=["']vvip["']/);
  assert.match(adminHtml, /VVIP 選課/);
  assert.match(adminHtml, /getVvipAdminDashboard/);
  assert.match(adminHtml, /setVvipSelectionOpen/);
  assert.match(adminHtml, /confirmVvipEmail/);
  assert.match(adminHtml, /cancelVvipSelection/);
  assert.match(adminHtml, /exportVvipSelectionsCsv/);
  assert.match(adminHtml, /new Blob/);
});
