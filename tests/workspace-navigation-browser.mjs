import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { bootWorkspaceFixture } from './fixtures/workspace-navigation-fixture.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_NODE_MODULES || '/Users/ivy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', 'playwright'));
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.env.WORKSPACE_PREVIEW_DIR || '/Users/ivy/Documents/2026 B 周年慶/output/workspace-navigation-integrated-local-20261110';
await fs.mkdir(output, { recursive: true });
let html = (await fs.readFile(path.join(repo, 'index.html'), 'utf8')).replace(/\n    initialize\(\);/, '');
const inlineScript = source => `<script>${source.replaceAll('</script', '<\\/script')}</script>`;
const scriptTags = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)];
for (const [tag, src] of scriptTags) {
  const name = src.split('?')[0];
  const source = name.includes('OneSignalSDK') ? '' : await fs.readFile(name.startsWith('https://unpkg.com/lucide') ? '/private/tmp/sherry-lucide-0.468.0.min.js' : path.join(repo, name), 'utf8');
  html = html.replace(tag, () => inlineScript(source));
}
for (const [tag, href] of [...html.matchAll(/<link\b[^>]*href="([^"]+)"[^>]*>/g)]) {
  const filename = href.split('?')[0];
  const css = filename.endsWith('.css') && !filename.startsWith('https:') ? await fs.readFile(path.join(repo, filename), 'utf8') : '';
  html = html.replace(tag, () => css ? `<style>${css}</style>` : '');
}
const logo = `data:image/png;base64,${(await fs.readFile(path.join(repo, 'assets/app-icon-180.png'))).toString('base64')}`;
html = html.replaceAll('./assets/app-icon-180.png', logo)
  .replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">')
  .replace(/<\/body>\s*<\/html>\s*$/, () => `${inlineScript(`(${bootWorkspaceFixture.toString()})();`)}</body></html>`);
const file = path.join(output, 'preview.html');
await fs.writeFile(file, html);
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const errors = [], requests = [];
let scenes = 0;
try {
  const page = await browser.newPage({ locale: 'zh-TW', timezoneId: 'Asia/Taipei' });
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  await page.route(/^https?:/, route => route.abort());
  await page.goto(pathToFileURL(file).href);
  if (errors.length) {
    const scripts = await page.locator('script').allTextContents();
    scripts.forEach((source, index) => { try { new vm.Script(source, { filename: `preview-script-${index}` }); } catch (error) { console.error(error.stack); } });
    throw Error(`Preview startup: ${errors.join('; ')}`);
  }
  await page.waitForSelector('#app-shell:not([hidden])');
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  async function checkLayout(label) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await settle();
    const overflow = await page.evaluate(() => {
      if (document.documentElement.scrollWidth > innerWidth + 1) return [{ page: document.documentElement.scrollWidth, viewport: innerWidth }];
      return Array.from(document.querySelectorAll('.view.active input, .view.active select, .view.active textarea, dialog[open] input, dialog[open] select')).filter(element => element.getClientRects().length && element.type !== 'hidden').flatMap(element => {
        const rect = element.getBoundingClientRect();
        const scrollTable = element.closest('.main-table-scroll');
        return !scrollTable && (rect.left < -1 || rect.right > innerWidth + 1) ? [{ id: element.id, left: rect.left, right: rect.right }] : [];
      });
    });
    assert.deepEqual(overflow, [], label); scenes++;
    const surfaces = await page.evaluate(() => {
      const selectors = ['.admin-priority', '.admin-home-card', '.admin-course-navigation', '.practice-admin-card', '#view-account .account-menu > button'];
      if (activeViewId === 'view-admin' && activeAdminSection === 'dashboard') selectors.push('#admin-tab-content > .main-section');
      return [...document.querySelectorAll(selectors.join(','))].filter(element => element.getClientRects().length).map(element => {
        const style = getComputedStyle(element);
        const contentStyle = element.matches('.practice-admin-card') ? getComputedStyle(element.querySelector(':scope > details > summary')) : style;
        return { name: element.className, radius: parseFloat(style.borderTopLeftRadius), left: parseFloat(contentStyle.paddingLeft), right: parseFloat(contentStyle.paddingRight) };
      });
    });
    for (const surface of surfaces) assert.ok(surface.radius >= 14 && surface.left >= 14 && surface.right >= 14,
      `${label}: colored surfaces must have soft corners and real inner spacing: ${JSON.stringify(surface)}`);
  }
  const tabs = await page.evaluate(() => Object.keys(ADMIN_TAB_SECTIONS));
  assert.equal(tabs.length, 18);
  assert.deepEqual(await page.locator('#admin-mobile-tabbar [data-admin-section]').evaluateAll(buttons => buttons.map(button => button.dataset.adminSection)),
    ['dashboard', 'courses', 'practice', 'students']);
  assert.deepEqual(await page.locator('#admin-more-dialog [data-admin-section]').evaluateAll(buttons => buttons.map(button => button.dataset.adminSection)),
    ['finance', 'notifications', 'tools']);
  assert.deepEqual(await page.locator('#admin-section-nav [data-admin-section]').evaluateAll(buttons => buttons.map(button => button.dataset.adminSection)),
    ['dashboard', 'courses', 'practice', 'finance', 'students', 'notifications', 'tools']);
  await page.evaluate(() => {
    window.originalTaskFixture = structuredClone(adminDashboard.operations.tasks);
    window.originalToday = getTaipeiToday;
    getTaipeiToday = () => '2026/11/10';
    adminDashboard.operations.tasks = [
      { key: 'review', label: '學生資格待確認', date: '2026/08/01', time: '10:00', tab: 'practice', urgency: '已逾期', targetId: 'student-review' },
      ...Array.from({ length: 25 }, (_, index) => ({ key: `old-${String(index).padStart(2, '0')}`, label: `八月課程 ${index}`,
        date: '2026/08/01', time: '11:00', tab: 'obWork', urgency: '已逾期', targetId: `private-target-${index}` }))
    ];
    renderAdminHome();
  });
  assert.equal(await page.getByText('自主練習待審核', { exact: true }).isVisible(), true);
  assert.equal(await page.locator('#admin-priority').isVisible(), false);
  assert.equal(await page.getByText('八月課程 0', { exact: true }).isVisible(), false);
  assert.doesNotMatch(await page.locator('#admin-tab-content').innerText(), /對象 ID|未承接/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(output, 'mobile-admin-earlier-collapsed.png') });
  await page.locator('.task-overview-history > summary').click();
  await page.locator('.task-overview-month > summary').click();
  await page.locator('.task-overview-month [data-task-category="obWork"] > summary').click();
  assert.equal(await page.getByText('八月課程 0', { exact: true }).isVisible(), true);
  await page.locator('[data-main-list="task-overview-history-2026-08-obWork"] [data-main-page="2"]').click();
  assert.equal(await page.getByText('八月課程 20', { exact: true }).isVisible(), true);
  assert.equal(await page.getByText('自主練習待審核', { exact: true }).isVisible(), true);
  assert.equal(await page.locator('[data-main-target-id="private-target-20"]').getAttribute('data-admin-go-tab'), 'obWork');
  await page.evaluate(() => {
    adminDashboard.operations.tasks = originalTaskFixture;
    getTaipeiToday = originalToday;
    renderAdminHome();
  });
  await page.evaluate(() => openAdminTab('practice'));
  await page.evaluate(async () => {
    await fetchPracticeAdminDashboard(false, false);
    window.originalPracticeFixture = structuredClone(practiceAdminDashboard);
    practiceAdminDashboard.bookings = Array.from({ length: 160 }, (_, index) => ({
      bookingId: `long-list-${index + 1}`, date: '2030/11/11', room: 'C', startTime: '12:00', endTime: '14:00',
      creatorName: 'Tako', status: '已成立', participants: [], audits: []
    }));
    renderPracticeAdminDashboard();
  });
  const upcoming = page.locator('[data-main-lazy="practice-current-bookings"]');
  assert.match(await upcoming.locator(':scope > summary').innerText(), /160 筆/);
  assert.equal(await upcoming.evaluate(element => element.open), false);
  assert.equal(await upcoming.locator('[data-practice-admin-booking]').count(), 0);
  await upcoming.locator(':scope > summary').click();
  await page.waitForSelector('[data-practice-admin-booking="long-list-1"]');
  assert.equal(await upcoming.locator('[data-practice-admin-booking]').count(), 20);
  await checkLayout('long practice list expanded');
  await upcoming.locator('[data-main-page="2"]').click();
  assert.equal(await upcoming.locator('[data-practice-admin-booking="long-list-21"]').isVisible(), true);
  await upcoming.locator(':scope > summary').click();
  await page.waitForFunction(() => !document.querySelector('[data-main-lazy="practice-current-bookings"] [data-practice-admin-booking]'));
  await page.evaluate(() => {
    practiceAdminDashboard = originalPracticeFixture;
    delete mainAssuranceState.pages['practice-bookings-current'];
    mainAssuranceState.openDetails.delete('practice-current-bookings');
    renderPracticeAdminDashboard();
  });
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 740]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      switchView('view-admin'); openAdminSection('dashboard');
      notificationDashboard.monthlyOperations.operations = [{ id: 'leave_reminder', label: '發送請假截止提醒',
        recommendedAt: '2026-11-11 21:00', canExecute: true, status: 'pending', early: true }];
      renderAdminHome();
    });
    await checkLayout(`${name} dashboard`);
    await page.screenshot({ path: path.join(output, `${name}-admin.png`) });
    await page.locator('.admin-home-card').last().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `${name}-admin-lower.png`) });
    for (const tab of tabs) {
      await page.evaluate(tab => openAdminTab(tab), tab);
      await checkLayout(`${name} ${tab}`);
      await page.screenshot({ path: path.join(output, `${name}-admin-${tab}.png`) });
      assert.equal(await page.evaluate(() => activeAdminSection), await page.evaluate(tab => ADMIN_TAB_SECTIONS[tab], tab));
    }
    await page.evaluate(() => openAdminSection('courses'));
    await page.locator('[data-admin-course-group="changes"]').click();
    await page.locator('#admin-status-select').selectOption('closureManagement');
    assert.equal(await page.evaluate(() => activeAdminTab), 'closureManagement');
    assert.match(await page.locator('#admin-status-select option[value="delayClosures"]').innerText(), /代關課程（0）/);
    await checkLayout(`${name} closure via status select`);
    await page.screenshot({ path: path.join(output, `${name}-courses.png`) });
    await page.evaluate(() => openAdminTab('practice'));
    assert.equal(await upcoming.evaluate(element => element.open), false);
    assert.equal(await upcoming.locator('[data-practice-admin-booking]').count(), 0);
    assert.equal(await page.locator('[data-practice-student-review] [data-student-practice-participant]').isVisible(), true);
    await page.screenshot({ path: path.join(output, `${name}-practice.png`) });
    await upcoming.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `${name}-practice-collapsed.png`) });
    await upcoming.locator(':scope > summary').click();
    await page.waitForSelector('.practice-booking-details');
    await page.locator('.practice-booking-details > summary').first().click();
    await checkLayout(`${name} practice editor`);
    await page.screenshot({ path: path.join(output, `${name}-practice-editor.png`) });
    await upcoming.locator(':scope > summary').click();
    await page.waitForFunction(() => !document.querySelector('[data-main-lazy="practice-current-bookings"] [data-practice-admin-booking]'));
    await page.evaluate(() => switchView('view-leave'));
    await page.locator('[data-date="2026/11/11"]').check();
    await page.locator('[data-date="2026/11/13"]').check();
    assert.equal(await page.locator('.leave-course-checkbox').count(), 3);
    await page.locator('.leave-course-checkbox').nth(0).check();
    await page.locator('.leave-course-checkbox').nth(2).check();
    assert.match(await page.locator('#leave-confirmation-count').innerText(), /2 堂/);
    assert.equal(await page.locator('#view-leave select, #view-leave textarea').count(), 0);
    await checkLayout(`${name} original multi-date leave`);
    await page.screenshot({ path: path.join(output, `${name}-leave.png`), fullPage: true });
    await page.locator('#leave-submit').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await settle();
    await page.screenshot({ path: path.join(output, `${name}-leave-confirmation.png`) });
    const leaveButton = await page.locator('#leave-submit').boundingBox();
    assert.ok(leaveButton && leaveButton.y >= 0 && leaveButton.y + leaveButton.height <= height - (width <= 760 ? 65 : 0), `${name}: leave confirmation remains reachable above navigation: ${JSON.stringify(leaveButton)}`);
    let confirmation = '';
    page.once('dialog', async dialog => { confirmation = dialog.message(); await dialog.dismiss(); });
    await page.locator('#leave-submit').click();
    assert.match(confirmation, /2 堂/);
    assert.equal(await page.locator('.leave-course-checkbox:checked').count(), 2);
    await page.locator('#clear-leave-dates').click();
    assert.equal(await page.locator('.leave-course-checkbox').count(), 0);
    await page.locator('#select-all-visible-dates').click();
    assert.equal(await page.locator('.leave-date-checkbox:checked').count(), 2);
    await page.evaluate(() => switchView('view-home'));
    await checkLayout(`${name} teacher home`);
    const panelGeometry = await page.locator('.teacher-home-panel').evaluateAll(panels => panels.map(panel => {
      const rect = panel.getBoundingClientRect();
      const heading = panel.querySelector('.teacher-panel-heading');
      const list = panel.querySelector('.teacher-schedule-list, .teacher-upcoming-list');
      return { radius: parseFloat(getComputedStyle(panel).borderRadius), headingInset: parseFloat(getComputedStyle(heading).paddingLeft),
        listInset: parseFloat(getComputedStyle(list).paddingLeft), panelLeft: rect.left, panelRight: rect.right };
    }));
    for (const geometry of panelGeometry) {
      assert.ok(geometry.radius >= 16 && geometry.headingInset >= 14 && geometry.listInset >= 14, `${name}: panels need soft corners and inner spacing: ${JSON.stringify(geometry)}`);
      const outerInset = width < 360 ? 14 : 16;
      assert.ok(geometry.panelLeft >= outerInset && geometry.panelRight <= width - outerInset, `${name}: panels stay inset from screen edges`);
    }
    await page.screenshot({ path: path.join(output, `${name}-teacher.png`) });
    const originalHome = await page.evaluate(() => structuredClone(teacherHomeDashboard));
    await page.evaluate(() => {
      teacherHomeDashboard.scheduleByDate = {};
      teacherHomeDashboard.upcoming = [{ date: '2026/11/12', title: '請假登記開放中', time: '21:00', meta: '請於 11/12 21:00 前完成下月請假', targetView: 'leave' }];
      teacherHomeSelectedDate = '2026/11/10';
      renderTeacherHome(teacherHomeDashboard);
      const preset = SherryPersonalAppearance.palettes.find(item => item.id === 'lilac');
      Object.entries(SherryPersonalAppearance.themeTokens({ ...SherryPersonalAppearance.defaultPreference(), mode: 'preset', presetId: 'lilac', primary: preset.primary, secondary: preset.secondary }))
        .forEach(([token, value]) => document.getElementById('app-shell').style.setProperty(token, value));
    });
    await checkLayout(`${name} empty teacher home`);
    assert.equal(await page.getByText('請假登記開放中', { exact: true }).isVisible(), true);
    assert.equal(await page.getByText('這天沒有課程或練習', { exact: true }).isVisible(), true);
    await page.screenshot({ path: path.join(output, `${name}-teacher-empty-lilac.png`) });
    await page.evaluate(home => {
      teacherHomeDashboard = home;
      renderTeacherHome(teacherHomeDashboard);
      Object.keys(SherryPersonalAppearance.themeTokens(SherryPersonalAppearance.defaultPreference()))
        .forEach(token => document.getElementById('app-shell').style.removeProperty(token));
    }, originalHome);
    await page.evaluate(() => switchView('view-account'));
    await checkLayout(`${name} account menu`);
    await page.screenshot({ path: path.join(output, `${name}-account.png`) });
    await page.evaluate(() => switchView('view-practice'));
    await page.locator('#rental-new').click();
    await page.waitForSelector('#rental-dialog[open]');
    assert.equal(await page.locator('#rental-duration option').count(), 2);
    await page.locator('#rental-recurring').check();
    assert.equal(await page.locator('#rental-end-date-field').isVisible(), true);
    await checkLayout(`${name} original rental form`);
    await page.screenshot({ path: path.join(output, `${name}-rental.png`) });
    await page.locator('#rental-dialog-cancel').click();
  }
  await page.evaluate(() => switchView('view-admin'));
  await page.locator('#admin-mobile-tabbar [data-admin-section="students"]').click();
  assert.equal(await page.evaluate(() => activeAdminSection), 'students');
  assert.equal(await page.locator('#admin-mobile-more').evaluate(button => button.classList.contains('active')), false);
  await page.locator('#admin-mobile-more').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#admin-more-dialog').evaluate(element => element.open), false);
  await page.waitForFunction(() => document.getElementById('admin-mobile-more').getAttribute('aria-expanded') === 'false');
  assert.equal(await page.locator('#admin-mobile-more').getAttribute('aria-expanded'), 'false');
  await page.locator('#admin-mobile-more').click();
  await page.locator('#admin-more-dialog [data-admin-section="finance"]').click();
  assert.equal(await page.locator('#admin-more-dialog').evaluate(element => element.open), false);
  assert.equal(await page.evaluate(() => activeAdminSection), 'finance');
  assert.equal(await page.locator('#admin-mobile-more').evaluate(button => button.classList.contains('active')), true);
  await page.locator('#inbox-button').click();
  assert.equal(await page.locator('#app-shell').getAttribute('data-shell-mode'), 'admin');
  assert.equal(await page.locator('#admin-mobile-tabbar').isVisible(), true);
  for (const [capability, section, expected] of [['invoice_admin', 'finance', 'invoices'], ['payroll_admin', 'finance', 'payroll'], ['vvip_admin', 'students', 'vvip'], ['raffle_admin', 'students', 'raffle']]) {
    await page.evaluate(({ capability, section }) => { authState.managementCapabilities = [capability]; switchView('view-admin'); openAdminSection(section); }, { capability, section });
    assert.equal(await page.evaluate(() => activeAdminTab), expected);
    assert.deepEqual(await page.locator('.admin-tab:not([hidden])').evaluateAll(elements => elements.map(element => element.dataset.adminTab)), [expected]);
    assert.equal(await page.locator('#admin-subtabs').isVisible(), false);
    await checkLayout(capability);
  }
  await page.evaluate(() => { authState.managementCapabilities = ['course_admin']; startActingAsTeacher('Tako'); });
  assert.equal(await page.locator('#workspace-switcher').isVisible(), false);
  assert.equal(await page.locator('#acting-banner').isVisible(), true);
  await page.locator('#acting-stop').click();
  assert.equal(await page.locator('#app-shell').getAttribute('data-shell-mode'), 'admin');
  await page.evaluate(() => { authState.managementCapabilities = []; switchView('view-home'); });
  assert.equal(await page.locator('#workspace-switcher').isVisible(), false);
  assert.equal(await page.locator('#admin-mobile-tabbar').isVisible(), false);
  assert.equal(await page.locator('#mobile-tabbar').isVisible(), true);
  await settle();
  assert.deepEqual(errors, [], 'No browser errors');
  assert.deepEqual(requests, [], 'No external requests');
  assert.deepEqual(await page.evaluate(() => offlineWrites), [], 'No mutation handlers were called');
  const result = { scenes, widths: [1366, 390, 320], originalAdminTabs: tabs.length, browserErrors: errors, externalRequests: requests, formalWrites: 0 };
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
