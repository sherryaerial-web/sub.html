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
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.abort());
  await page.setContent(html);
  await page.evaluate(() => {
    let serial = 0;
    window.crypto.randomUUID = () => `noshow-ui-${++serial}`;
    window.noShowCalls = [];
    window.noShowPreviewCalls = [];
    window.fixturePayroll = { month: '2026-11', version: 'draft-1', noShowEditable: true,
      deductionDraftError: '', summaries: [{ teacherName: 'Jina', status: '草稿', version: 'draft-1', totalSalary: 700, subtotal: 700 }],
      lines: [], disputes: [], deductionTeachers: ['Jina', 'Tako'], deductions: [],
      metrics: { teachers: 1, totalSalary: 700, pendingConfirmations: 0, teacherConfirmed: 0, finalized: 0, openDisputes: 0, errors: 0 } };
    window.realPayrollPost = callPostApi;
    callPostApi = async (action, params) => {
      if (action === 'getPayrollAdminDashboard') return fixturePayroll;
      if (action === 'getPayrollNoShowCourses') return [{ calendarId: '60001', date: '2026/11/04', time: '18:00',
        courseName: 'A－空環 Lv.1', instructors: [{ name: 'Jina' }] }, { calendarId: '60002', date: '2026/11/04', time: '20:00',
        courseName: 'C－舞綢 Lv.1', sourceCancelled: true, instructors: [{ name: 'Jina' }] }];
      if (action === 'previewPayrollNoShow') {
        noShowPreviewCalls.push(params.event);
        return { amount: params.event.mode === 'replacement' ? 700 : 1440,
          quoteKey: 'fixture-quote', event: { input: params.event, originalWage: 700, pointPrice: 180, extraPoints: 8, refundPoints: 8,
            course: { calendarId: '60001', date: '2026/11/04', time: '18:00', courseName: 'A－空環 Lv.1' } } };
      }
      if (action === 'recordPayrollNoShow') {
        noShowCalls.push(params.event);
        if (noShowCalls.length === 1) throw Error('本機模擬登記結果待確認');
        if (window.holdRecord) await new Promise(resolve => { window.releaseRecord = resolve; });
        fixturePayroll.deductions = [{ id: params.event.id, month: '2026-11', teacherName: 'Jina', eventDate: '2026/11/04',
          amount: 700, reason: 'No Show Fee', status: '有效', event: { input: params.event, quoteKey: 'fixture-quote' } }];
        fixturePayroll.deductionDraftError = 'No Show／單月扣款已有變動，請重新試算後再發布薪資。';
        return fixturePayroll.deductions[0];
      }
      if (action === 'cancelPayrollNoShow') {
        window.cancelNoShowCalls = (window.cancelNoShowCalls || 0) + 1;
        fixturePayroll.deductions[0].status = '已取消';
        return { id: params.deductionId, status: '已取消' };
      }
      throw Error(`Unexpected API ${action}`);
    };
    authState.sessionToken = 'fixture'; authState.teacherName = '管理員'; authState.managementCapabilities = ['payroll_admin'];
    document.getElementById('auth-shell').hidden = true; document.getElementById('app-shell').hidden = false;
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById('view-admin').classList.add('active');
    activeAdminTab = 'payroll'; activeAdminSection = 'payroll'; payrollDashboard = fixturePayroll;
    renderPayrollAdminTab();
  });
  await page.getByText('登記 No Show Fee', { exact: true }).click();
  await page.locator('#payroll-noshow-date').fill('2026-11-04');
  await page.locator('#payroll-noshow-load').click();
  assert.match(await page.locator('#payroll-noshow-course option[value="60002"]').innerText(), /已取消/);
  await page.locator('#payroll-noshow-course').selectOption('60001');
  await page.locator('#payroll-noshow-teacher').selectOption('Jina');
  await page.locator('#payroll-noshow-replacement').selectOption('Tako');
  assert.equal(await page.locator('#payroll-noshow-reason').evaluate(input => input.required), false);
  await page.locator('#payroll-noshow-reason').fill('');
  await page.locator('#payroll-noshow-confirmed').check();
  assert.equal(await page.getByText('清單找不到課程？手動輸入 OB 課程編號', { exact: true }).count(), 1);
  await page.locator('#payroll-noshow-preview-button').click();
  await page.getByText('請填寫計薪出席人數（0–1000 的整數）。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => noShowPreviewCalls.length), 0);
  await page.locator('#payroll-noshow-attendance').fill('2');
  await page.locator('#payroll-noshow-replacement').selectOption('Jina');
  await page.locator('#payroll-noshow-preview-button').click();
  await page.getByText('代課老師須與原老師不同。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => noShowPreviewCalls.length), 0);
  await page.locator('#payroll-noshow-replacement').selectOption('Tako');
  await page.locator('#payroll-noshow-preview-button').click();
  await page.locator('#payroll-noshow-register').waitFor();
  assert.equal(await page.evaluate(() => noShowPreviewCalls[0].reason), '');
  await page.locator('#payroll-noshow-reason').fill('更新原因');
  assert.equal(await page.locator('#payroll-noshow-register').count(), 0);
  await page.locator('#payroll-noshow-mode').selectOption('noReplacement');
  await page.locator('#payroll-noshow-points').fill('8');
  await page.locator('#payroll-noshow-preview-button').click();
  await page.getByText('1,440', { exact: false }).last().waitFor();
  assert.equal(await page.locator('#payroll-noshow-replacement').isVisible(), false);
  await page.locator('#payroll-noshow-mode').selectOption('replacement');
  await page.locator('#payroll-noshow-preview-button').click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#payroll-noshow-register').click();
  assert.equal(await page.evaluate(() => noShowCalls.length), 0);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#payroll-noshow-register').click();
  await page.getByText('本機模擬登記結果待確認', { exact: true }).waitFor();
  assert.equal(await page.locator('#payroll-noshow-preview-button').isDisabled(), true);
  assert.equal(await page.locator('#payroll-noshow-teacher').isDisabled(), true);
  await page.evaluate(() => { invalidatePayrollNoShow(); window.holdRecord = true; });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#payroll-noshow-register').click();
  await page.waitForFunction(() => typeof window.releaseRecord === 'function');
  assert.equal(await page.locator('#payroll-noshow-reason').isDisabled(), true);
  await page.evaluate(() => { invalidatePayrollNoShow(); window.releaseRecord(); });
  await page.getByText('No Show／單月扣款已有變動，請重新試算後再發布薪資。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => noShowCalls[0].id === noShowCalls[1].id), true);
  assert.equal(await page.locator('[data-admin-action="publish-payroll"]').count(), 0);
  assert.equal(await page.locator('[data-admin-action="cancel-payroll-noshow"]').count(), 1);
  const output = '/private/tmp/sherry-payroll-no-show-preview';
  await fs.mkdir(output, { recursive: true });
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 700]]) {
    await page.setViewportSize({ width, height });
    const details = page.locator('#payroll-noshow-form').locator('..');
    if (!await page.locator('#payroll-noshow-form').isVisible()) await details.locator(':scope > summary').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
  await page.locator('[data-admin-action="cancel-payroll-noshow"]').click();
  await page.locator('#request-reason').fill('誤登紀錄');
  await page.locator('#request-cancel').click();
  assert.equal(await page.evaluate(() => window.cancelNoShowCalls || 0), 0);
  await page.locator('[data-admin-action="cancel-payroll-noshow"]').click();
  await page.locator('#request-reason').fill('誤登紀錄');
  await page.locator('#request-confirm').click();
  await page.waitForFunction(() => window.cancelNoShowCalls === 1);
  await page.getByText('已取消', { exact: true }).waitFor();
  assert.equal(await page.locator('[data-admin-action="cancel-payroll-noshow"]').count(), 0);
  await page.evaluate(() => { fixturePayroll.noShowEditable = false; renderPayrollAdminTab(); });
  assert.equal(await page.locator('#payroll-noshow-form').count(), 0);
  assert.equal(await page.locator('[data-admin-action="cancel-payroll-noshow"]').count(), 0);
  await page.evaluate(async () => {
    fixturePayroll.noShowEditable = true; authState.actingTeacherName = 'Jina'; renderPayrollAdminTab();
    for (const action of ['recordPayrollNoShow', 'cancelPayrollNoShow']) {
      try { await realPayrollPost(action, {}); throw Error('write allowed'); }
      catch (error) { if (!error.message.includes('唯讀')) throw error; }
    }
  });
  assert.equal(await page.locator('#payroll-noshow-form').count(), 0);
  assert.deepEqual(errors, []);
  console.log(`PASS No Show UI: preview/invalidation, both modes, confirmation cancel, stable retry, stale publish block, read-only month and responsive screenshots at ${output}; all network blocked.`);
} finally { await browser.close(); }
