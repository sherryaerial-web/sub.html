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

test('mobile app shell uses a fixed five-item safe-area tab bar', () => {
  const html = pages[0];
  const tabbar = html.match(/<nav id="mobile-tabbar" class="mobile-tabbar"[\s\S]*?<\/nav>/)?.[0] || '';

  assert.ok(tabbar, 'mobile tab bar must exist');
  assert.equal((tabbar.match(/class="mobile-tab-item/g) || []).length, 5);
  assert.match(tabbar, /id="mobile-primary-entry"/);
  assert.match(tabbar, /data-mobile-tab="records"/);
  assert.match(html, /\.mobile-tabbar\s*\{[^}]*display:\s*none/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.sidebar\s*\{[^}]*display:\s*none/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.mobile-tabbar\s*\{[^}]*position:\s*fixed[^}]*bottom:\s*0[^}]*display:\s*grid/s);
  assert.match(html, /padding-bottom:\s*env\(safe-area-inset-bottom\)/);
});

test('mobile app shell groups records and keeps primary actions reachable', () => {
  const html = pages[0];

  assert.equal((html.match(/class="mobile-record-switcher"/g) || []).length, 2);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*#claim-submit[\s\S]*position:\s*sticky/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*#leave-submit[\s\S]*position:\s*sticky/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.admin-tabs\s*\{[^}]*position:\s*sticky/s);
});

test('mobile header uses the selected app icon and synchronizes role-aware navigation', () => {
  const html = pages[0];

  assert.match(html, /class="app-icon-mark"[^>]*src="\.\/assets\/app-icon-180\.png"/);
  assert.match(html, /function\s+updateMobileNavigation\s*\(/);
  assert.match(html, /function\s+syncMobileTabState\s*\(/);
  assert.match(html, /mobile-primary-entry/);
  assert.match(html, /managementCapabilities\.length\s*\?\s*"view-admin"\s*:\s*"view-home"/);
});

test('practice timeline is touch-friendly and the editor becomes a mobile bottom sheet', () => {
  const html = pages[0];

  assert.match(html, /\.practice-date-strip\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(html, /\.practice-room-tabs\s*\{[^}]*display:\s*grid/s);
  assert.match(html, /\.practice-time-button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(html, /\.practice-block\.course/);
  assert.match(html, /\.practice-block\.rental/);
  assert.match(html, /\.practice-block\.practice/);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*#practice-dialog\s*\{[^}]*margin:\s*auto 0 0/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*#practice-dialog\s*\{[^}]*width:\s*100%/s);
});

test('practice admin cards keep filters and actions usable on narrow screens', () => {
  const html = pages[0];

  assert.match(html, /\.practice-admin-filters\s*\{[^}]*display:\s*grid/s);
  assert.match(html, /\.practice-admin-card\s*\{/);
  assert.match(html, /\.practice-admin-fields\s*\{[^}]*display:\s*grid/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.practice-admin-filters\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.practice-admin-fields\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
});
