const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('teacher app layout preserves touch targets, horizontal dates, five tabs and safe areas', () => {
  assert.match(html, /\[data-shell-mode="teacher"\][\s\S]*?\.teacher-date-strip\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.mobile-tabbar\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5,/);
  assert.match(html, /\.mobile-tabbar\s*\{[\s\S]*?env\(safe-area-inset-bottom\)/);
  assert.match(html, /\[data-shell-mode="teacher"\][\s\S]*?button[\s\S]*?min-height:\s*44px/);
});

test('teacher home is one column on phones and two columns on wider screens', () => {
  assert.match(html, /@media\s*\(min-width:\s*900px\)[\s\S]*?\[data-shell-mode="teacher"\][\s\S]*?\.teacher-home-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s+minmax\(0,\s*\.65fr\)/);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.teacher-home-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
});

test('teacher rental dialog is a mobile bottom sheet and keeps native date fields inside the form', () => {
  assert.match(html, /#rental-dialog\s+input\[type="date"\]\s*\{[\s\S]*?width:\s*100%[\s\S]*?min-width:\s*0[\s\S]*?max-width:\s*100%/);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*?#rental-dialog\s*\{[\s\S]*?width:\s*100%[\s\S]*?max-height:\s*88dvh[\s\S]*?margin:\s*auto\s+0\s+0/);
  assert.match(html, /@media\s*\(max-width:\s*480px\)[\s\S]*?#rental-dialog\s+\.practice-form-grid\s*\{\s*grid-template-columns:\s*1fr/);
});
