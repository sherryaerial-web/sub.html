import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_NODE_MODULES, 'playwright'));
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.env.PRACTICE_PREVIEW_DIR || '/private/tmp/sherry-practice-compact-preview';
const html = (await fs.readFile(path.join(repo, 'index.html'), 'utf8'))
  .replace(/<script\b[^>]*src=[^>]*><\/script>/g, '')
  .replace(/\n    initialize\(\);/, '');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const page = await browser.newPage({ locale: 'zh-TW', timezoneId: 'Asia/Taipei' });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'https://practice.test') return route.abort();
    if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html });
    if (url.pathname.endsWith('.css')) return route.fulfill({ contentType: 'text/css', body: await fs.readFile(path.join(repo, path.basename(url.pathname))) });
    if (/^\/assets\/app-icon-[a-z0-9-]+\.png$/.test(url.pathname)) return route.fulfill({ contentType: 'image/png', body: await fs.readFile(path.join(repo, url.pathname)) });
    return route.abort();
  });
  await page.goto('https://practice.test/');
  await page.addScriptTag({ path: path.join(repo, 'main-assurance-ui.js') });
  if (process.env.PRACTICE_ICON_SCRIPT) await page.addScriptTag({ path: process.env.PRACTICE_ICON_SCRIPT });
  await page.evaluate(() => {
    Date.now = () => Date.parse('2026-11-09T22:00:00+08:00');
    const booking = (id, name, room, status = '已成立') => ({
      bookingId: id, date: '2026/11/10', room, status, creatorName: name,
      startTime: '10:00', endTime: '11:30', seriesId: 'series-1', waitlistCalendarId: '53867|53868',
      participants: [{ teacherName: name, role: '建立者', startTime: '10:00', endTime: '11:30', status: '有效' }],
      reason: status === '候補' ? '等待相關課程取消後補入' : '',
      audits: [{ time: '2026/11/01 10:00', actor: '冠蓉', action: '建立登記' }],
    });
    const student = (id, name, status, extra = {}) => ({
      participantId: id, appName: name, email: `${id}@example.test`, status,
      qualificationVenue: '劍潭', room: 'C', date: '2026/11/10', startTime: '14:00', endTime: '15:00', ...extra,
    });
    practiceAdminDashboard = { filters: {}, summary: { total: 672, active: 318, waitlisted: 176, cancelled: 178 },
      bookings: [booking('one', 'wen', 'A', '候補'), booking('two', '珍珍', 'B'),
        ...Array.from({ length: 23 }, (_, i) => booking(`next-${i}`, i === 0 ? '非常長的老師名稱 Very Long Teacher Name' : 'Tako', 'C'))], notificationFailures: [] };
    studentPracticeAdminDashboard = { requests: [
      student('pending', '學生甲', '待確認資格', { canMarkAsCompanion: true }),
      student('changed', '學生乙', '已成立', { changeStatus: '時段異動待處理', date: '2026/11/01' }),
      student('ready', '學生丙', '已成立'),
      student('past', '學生丁', '已成立', { date: '2026/11/01' }),
    ], summary: { active: 20, pendingQualification: 1, changePending: 1 } };
    authState.sessionToken = 'offline-fixture'; authState.teacherName = 'Tako';
    authState.managementCapabilities = ['course_admin'];
    activeViewId = 'view-admin'; activeAdminTab = 'practice'; activeAdminSection = 'practice';
    document.getElementById('app-shell').dataset.shellMode = 'admin';
    document.getElementById('current-user').textContent = 'Tako';
    document.getElementById('auth-shell').hidden = true;
    document.getElementById('app-shell').hidden = false;
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === 'view-admin'));
    document.getElementById('admin-entry').hidden = false;
    document.querySelectorAll('.nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === 'view-admin'));
    syncMobileTabState('view-admin');
    window.practiceCalls = [];
    callApi = async (action, args) => { practiceCalls.push({ action, args }); throw Error('Offline fixture: no backend'); };
    callPostApi = async (action, args) => { practiceCalls.push({ action, args }); throw Error('Offline fixture: no writes'); };
    renderAdminDashboard();
  });
  const first = page.locator('[data-practice-admin-booking="one"]');
  const detail = first.locator('.practice-booking-details');
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 700]]) {
    await page.setViewportSize({ width, height });
    if (await detail.count()) await detail.evaluate(node => { node.open = true; });
    const filters = page.locator('.practice-admin-filter-panel');
    if (await filters.count()) await filters.evaluate(node => { node.open = true; });
    const overflow = await page.locator('.practice-admin-fields, .practice-admin-filters').evaluateAll(groups => groups.flatMap(group =>
      Array.from(group.querySelectorAll('input, select')).filter(node => node.getClientRects().length).flatMap(node => {
        const box = node.getBoundingClientRect(), field = node.closest('label').getBoundingClientRect();
        const css = getComputedStyle(node);
        const padding = ['date', 'time'].includes(node.type) ? parseFloat(css.paddingLeft) + parseFloat(css.paddingRight) : 0;
        return box.left < field.left - 1 || box.right + padding > field.right + 1
          ? [{ field: node.id || node.type, width: box.width, available: field.width, padding }] : [];
      })));
    assert.deepEqual(overflow, [], `${name}: native controls must fit their own field including iOS inline padding`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name);
    assert.equal(await detail.count(), 1, 'compact booking disclosure');
    await first.scrollIntoViewIfNeeded();
    assert.equal(await first.locator('[data-admin-action="update-practice"]').isVisible(), true);
    await page.screenshot({ path: `${output}/${name}-details.png` });
    await detail.evaluate(node => { node.open = false; });
    await filters.evaluate(node => { node.open = false; });
    assert.equal(await first.locator('input').first().isVisible(), false);
    assert.equal(await page.locator('#admin-subtabs').isVisible(), false);
    assert.equal(await page.locator('[data-practice-student-review] [data-student-practice-participant]').count(), 2);
    if (process.env.PRACTICE_ICON_SCRIPT) assert.ok(await page.locator('.practice-admin-card svg.lucide').count());
    await first.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${name}-teacher-list.png` });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${name}-overview.png` });
  }
  const preview = await page.evaluate(({ css, icon }) => {
    const root = document.documentElement.cloneNode(true);
    root.querySelectorAll('script, link, base, iframe, object, embed').forEach(node => node.remove());
    root.querySelectorAll('*').forEach(node => {
      for (const attr of Array.from(node.attributes)) if (/^on/i.test(attr.name)) node.removeAttribute(attr.name);
    });
    root.querySelectorAll('button').forEach(node => { node.disabled = true; });
    root.querySelectorAll('a').forEach(node => node.removeAttribute('href'));
    root.querySelectorAll('form').forEach(node => {
      const replacement = document.createElement('div');
      replacement.className = node.className;
      replacement.append(...node.childNodes);
      node.replaceWith(replacement);
    });
    root.querySelectorAll('img').forEach(node => { node.src = icon; node.removeAttribute('srcset'); });
    const style = document.createElement('style');
    style.textContent = css;
    root.querySelector('head').insertBefore(style, root.querySelector('style'));
    const policy = document.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'";
    root.querySelector('head').prepend(policy);
    root.querySelector('title').textContent = '自主練習｜離線版面預覽（範例資料）';
    root.querySelector('#current-user').textContent = 'Tako（範例）';
    return '<!DOCTYPE html>\n' + root.outerHTML;
  }, {
    css: await fs.readFile(path.join(repo, 'main-assurance-ui.css'), 'utf8'),
    icon: `data:image/png;base64,${(await fs.readFile(path.join(repo, 'assets/app-icon-180.png'))).toString('base64')}`,
  });
  await fs.writeFile(path.join(output, 'preview.html'), preview);
  const previewPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const previewRequests = [];
  previewPage.on('request', request => { if (/^https?:/.test(request.url())) previewRequests.push(request.url()); });
  await previewPage.route(/^https?:/, route => route.abort());
  await previewPage.goto(pathToFileURL(path.join(output, 'preview.html')).href);
  assert.equal(await previewPage.locator('script').count(), 0);
  assert.equal(await previewPage.locator('button:enabled').count(), 0);
  await previewPage.locator('.practice-booking-details > summary').first().click();
  assert.equal(await previewPage.locator('[data-practice-admin-start]').first().isVisible(), true);
  assert.deepEqual(previewRequests, [], 'preview stays offline');
  await previewPage.close();
  const summary = first.locator('.practice-booking-details > summary');
  await summary.focus(); await page.keyboard.press('Enter');
  await first.locator('[data-practice-admin-start]').fill('10:15');
  assert.equal(await first.locator('[data-practice-admin-start]').inputValue(), '10:15');
  await first.locator('.practice-admin-audits > summary').click();
  assert.equal(await first.getByText(/建立登記/).isVisible(), true);
  const next = page.locator('[data-main-page-key="practice-bookings-current"][data-main-page="2"]');
  await next.click();
  assert.equal(await page.locator('[data-practice-admin-current] [data-practice-admin-booking]').count(), 5);
  assert.equal(await page.locator('[data-practice-student-review] [data-student-practice-participant]').count(), 2);
  await page.evaluate(() => {
    studentPracticeAdminDashboard.requests = [];
    renderPracticeAdminDashboard();
    scrollTo(0, 0);
  });
  await page.screenshot({ path: `${output}/narrow-no-review.png` });
  assert.deepEqual(await page.evaluate(() => practiceCalls), []);
  assert.deepEqual(errors, []);
  console.log(`PASS practice compact UI: review priority, compact editable rows, keyboard, pagination, field-level iOS width checks, 1366/390/320 screenshots at ${output}; no real requests or writes.`);
} finally {
  await browser.close();
}
