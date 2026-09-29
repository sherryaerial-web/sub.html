const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../raffle.js'), 'utf8'), context);
  return context.window.SherryRaffle;
}
test('teacher cards group by student identity, never by display name', () => {
  const html = load().renderClaims([
    { studentKey: 'a', studentName: '同名', maskedEmail: 'a•••@example.com', prizeName: '提袋', status: 'ready', quantity: 1, claimedQuantity: 0 },
    { studentKey: 'b', studentName: '同名', maskedEmail: 'b•••@example.com', prizeName: '護腕', status: 'waiting', quantity: 1, claimedQuantity: 0 }
  ], []);
  assert.equal((html.match(/data-raffle-student=/g) || []).length, 2);
  assert.match(html, /可領取/); assert.match(html, /待備貨/);
});
test('untrusted names and statuses never become markup or active buttons', () => {
  const html = load().renderClaims([{ studentKey: '" onclick="bad', studentName: '<img src=x onerror=bad()>', prizeName: '<script>bad()</script>', status: '" onclick="bad', quantity: 1 }], []);
  assert.ok(!html.includes('<img')); assert.ok(!html.includes('<script>')); assert.ok(!html.includes('<button'));
  assert.match(html, /狀態待核對/);
});
test('preview makes no claim that data was written and displays error totals', () => {
  const html = load().renderPreview({ additionCount: 0, duplicates: 2, conflictCount: 1, errorCount: 1, pendingSelection: 3, additions: [], conflicts: [{row:2,message:'來源異動'}], errors: [{row:3,message:'<invalid>'}] });
  assert.match(html, /尚未匯入/); assert.match(html, /來源異動/); assert.match(html, /&lt;invalid&gt;/);
  assert.ok(!html.includes('<button'));
});
