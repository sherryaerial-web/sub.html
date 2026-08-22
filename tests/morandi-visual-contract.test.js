const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const pages = [read('index.html'), read('vvip.html')];

test('both pages use the approved Morandi taupe palette', () => {
  pages.forEach((html) => {
    assert.match(html, /#786c64/i);
    assert.match(html, /#ad8175/i);
    assert.match(html, /#f3f0eb/i);
    assert.match(html, /#fffdf9/i);
  });
});

test('both pages use matching sans-serif Chinese and English fonts', () => {
  pages.forEach((html) => {
    assert.match(html, /DM Sans/);
    assert.match(html, /Noto Sans TC/);
    assert.doesNotMatch(html, /Georgia|Noto Serif TC|(?:^|[,\s"])serif(?:[,;\s"]|$)/im);
  });
});

test('admin pending dates use compact accessible disclosure rows', () => {
  const html = pages[0];
  assert.match(html, /\.admin-date-group\s*\{/);
  assert.match(html, /\.admin-date-group\s+summary\s*\{[^}]*min-height:\s*48px/s);
  assert.match(html, /\.admin-date-group\s+summary::-webkit-details-marker\s*\{[^}]*display:\s*none/s);
  assert.match(html, /\.admin-date-group\s+summary::after\s*\{[^}]*content:\s*"\+"/s);
  assert.match(html, /\.admin-date-group\[open\]\s+summary::after\s*\{[^}]*content:\s*"−"/s);
  assert.match(html, /\.admin-date-group-body\s*\{/);
});

test('admin teacher invitations render as five-person desktop rounds with mobile wrapping', () => {
  const html = pages[0];
  assert.match(html, /\.teacher-round\s*\{/);
  assert.match(html, /\.teacher-round-grid\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(html, /\.teacher-option\.is-invited\s*\{/);
  assert.match(html, /@media\s*\(max-width:\s*920px\)[\s\S]*\.teacher-round-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.teacher-round-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
});
