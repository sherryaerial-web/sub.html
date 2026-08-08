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
