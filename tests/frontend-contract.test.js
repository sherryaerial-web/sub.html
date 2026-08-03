const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('keeps API secrets out of the public frontend', () => {
  assert.doesNotMatch(html, /eyJ[a-zA-Z0-9_-]+\./);
  assert.doesNotMatch(html, /Authorization\s*:\s*['"]Bearer/i);
  assert.doesNotMatch(html, /OMCEAN_API_TOKEN/);
});

test('does not use no-cors blind success writes', () => {
  assert.doesNotMatch(html, /mode\s*:\s*['"]no-cors['"]/);
  assert.match(html, /status\s*!==\s*['"]success['"]/);
});

test('submits claims by UUID with per-course change notes', () => {
  assert.match(html, /代課編號/);
  assert.match(html, /substituteId/);
  assert.match(html, /changeNote/);
  assert.match(html, /改成什麼課/);
  assert.match(html, /change-note-input/);
});

test('keeps the three required workflows and mobile viewport', () => {
  assert.match(html, /name=['"]viewport['"]/);
  assert.match(html, /請假登記/);
  assert.match(html, /尋找與領取代課/);
  assert.match(html, /查看我的代課紀錄/);
});

test('shows backend errors instead of always claiming success', () => {
  assert.match(html, /throw new Error\(payload\.message/);
  assert.match(html, /catch\s*\(error\)/);
});

test('provides teacher login and sends credentials through form-encoded POST', () => {
  assert.match(html, /id=["']login-form["']/);
  assert.match(html, /id=["']login-teacher["']/);
  assert.match(html, /id=["']login-pin["']/);
  assert.match(html, /callPostApi\(["']login["']/);
  assert.match(html, /application\/x-www-form-urlencoded/);
  assert.match(html, /method:\s*["']POST["']/);
});

test('implements date-first leave selection with select-all-visible and clear controls', () => {
  assert.match(html, /id=["']leave-date-list["']/);
  assert.match(html, /id=["']select-all-visible-dates["']/);
  assert.match(html, /id=["']clear-leave-dates["']/);
  assert.match(html, /selectedLeaveDates/);
  assert.match(html, /renderLeaveDates/);
  assert.match(html, /renderLeaveCourses/);
});

test('shows an exact confirmation count and full selected course list', () => {
  assert.match(html, /id=["']leave-confirmation-count["']/);
  assert.match(html, /id=["']leave-confirmation-list["']/);
  assert.match(html, /updateLeaveConfirmation/);
  assert.match(html, /selectedLeaveCourses\.length/);
});

test('submits leave items in bounded POST batches and verifies exact backend totals', () => {
  assert.match(html, /LEAVE_BATCH_SIZE\s*=\s*25/);
  assert.match(html, /callPostApi\(["']submitLeave["']/);
  assert.match(html, /requested/);
  assert.match(html, /created/);
  assert.match(html, /duplicates/);
  assert.match(html, /failed/);
  assert.match(html, /送出結果與勾選堂數不一致/);
});

test('renders personal leave history details for the logged-in teacher', () => {
  assert.match(html, /我的請假紀錄/);
  assert.match(html, /callApi\(["']getMyLeaves["']/);
  assert.match(html, /實際課程名稱/);
  assert.match(html, /預計難度/);
  assert.match(html, /OB 核對狀態/);
  assert.match(html, /異動狀態/);
});
