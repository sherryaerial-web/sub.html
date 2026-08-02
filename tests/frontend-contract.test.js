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
