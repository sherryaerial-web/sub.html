import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_NODE_MODULES, 'playwright'));
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = (await fs.readFile(path.join(repo, 'index.html'), 'utf8'))
  .replace(/<script\b[^>]*src=[^>]*><\/script>/g, '').replace(/\n    initialize\(\);/, '');
const output = '/private/tmp/sherry-practice-history-preview';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const page = await browser.newPage({ timezoneId: 'America/Los_Angeles' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.abort());
  await page.setContent(html);
  await page.evaluate(() => {
    Date.now = () => Date.parse('2026-10-23T15:00:00+08:00');
    const booking = (bookingId, date, status = '已成立', endTime = '15:00') => ({
      bookingId, date, status, room: 'A', creatorName: 'Tako', startTime: '14:00', endTime,
      participants: [{ teacherName: 'Tako', role: '建立者', startTime: '14:00', endTime, status: '有效' }],
      audits: [{ time: '2026/10/01 10:00', actor: '冠蓉', action: '建立自主練習', reason: '保留操作紀錄' }],
    });
    practiceAdminDashboard = { filters: {}, summary: { total: 25, active: 23, waitlisted: 1, cancelled: 1 }, bookings: [
      ...Array.from({ length: 20 }, (_, i) => booking(`sep-${i}`, `2026/09/${String(i + 1).padStart(2, '0')}`)),
      booking('at-end', '2026/10/23'), booking('ongoing', '2026/10/23', '已成立', '15:01'),
      booking('future', '2026/10/24', '候補'), booking('future-cancel', '2026/11/02', '已取消'),
      booking('old-oct', '2026/10/01'),
    ], notificationFailures: [] };
    studentPracticeAdminDashboard = { summary: {}, requests: [] };
    authState.sessionToken = 'fixture'; authState.teacherName = '測試管理員';
    authState.managementCapabilities = ['course_admin'];
    document.getElementById('auth-shell').hidden = true;
    document.getElementById('app-shell').hidden = false;
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById('view-admin').classList.add('active');
    activeAdminTab = 'practice'; activeAdminSection = 'practice';
    renderPracticeAdminDashboard();
  });
  const current = page.locator('[data-practice-admin-current]');
  assert.equal(await current.locator('[data-practice-admin-booking]').count(), 2);
  assert.equal(await current.locator('[data-practice-admin-booking="ongoing"]').isVisible(), true);
  assert.equal(await page.locator('[data-practice-admin-booking="at-end"]').isVisible(), false);
  assert.equal(await page.locator('[data-practice-admin-booking="future-cancel"]').isVisible(), false);
  const months = page.locator('[data-practice-admin-month]');
  assert.deepEqual(await months.evaluateAll(nodes => nodes.map(node => node.dataset.practiceAdminMonth)), ['2026-11', '2026-10', '2026-09']);
  const september = page.locator('[data-practice-admin-month="2026-09"]');
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 700]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await months.evaluateAll(nodes => nodes.every(node => !node.open)), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name);
    await page.locator('[data-practice-admin-history]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${name}-collapsed.png` });
    await september.locator(':scope > summary').click();
    assert.equal(await september.locator('[data-practice-admin-booking]').count(), 20);
    const card = september.locator('[data-practice-admin-booking]').first();
    await card.scrollIntoViewIfNeeded();
    assert.equal(await card.isVisible(), true);
    assert.equal(await card.locator('[data-admin-action="update-practice"]').isVisible(), true);
    await card.locator('.practice-admin-audits > summary').click();
    assert.equal(await card.getByText(/保留操作紀錄/).isVisible(), true);
    assert.equal(await september.evaluate(node => node.open), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name} expanded`);
    const overflow = await card.evaluate(node => Array.from(node.querySelectorAll('input, select, button')).some(child => {
      const parent = node.getBoundingClientRect(); const rect = child.getBoundingClientRect();
      return rect.left < parent.left - 1 || rect.right > parent.right + 1;
    }));
    assert.equal(overflow, false, `${name} card controls`);
    await page.screenshot({ path: `${output}/${name}-expanded.png` });
    await card.locator('.practice-admin-audits > summary').click();
    await september.locator(':scope > summary').click();
  }
  await page.evaluate(() => {
    practiceAdminDashboard.filters = { dateFrom: '2026-09-01', dateTo: '2026-09-30', teacherName: 'Tako' };
    practiceAdminDashboard.bookings = practiceAdminDashboard.bookings.filter(item => item.bookingId.startsWith('sep-'));
    renderPracticeAdminDashboard();
  });
  assert.equal(await page.locator('#practice-admin-date-to').inputValue(), '2026-09-30');
  assert.equal(await page.locator('#practice-admin-teacher').inputValue(), 'Tako');
  await september.locator(':scope > summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await september.locator('[data-practice-admin-booking]').count(), 20);
  assert.equal(await september.locator('[data-practice-admin-booking]').first().isVisible(), true);
  assert.deepEqual(errors, []);
  console.log(`PASS practice history: Taipei boundary from US timezone, collapsed monthly groups, preserved records/filters/audits, keyboard toggle, desktop/mobile/narrow layouts. Screenshots: ${output}; all external requests blocked.`);
} finally {
  await browser.close();
}
