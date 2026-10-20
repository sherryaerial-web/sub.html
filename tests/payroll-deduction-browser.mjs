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
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.abort());
  await page.setContent(html);
  await page.evaluate(() => {
    window.crypto.randomUUID = () => 'fixture-deduction-1';
    window.deductionCalls = [];
    window.fixturePayroll = { month: '2026-10', version: '', summaries: [], lines: [], disputes: [],
      deductionTeachers: ['妙妙 簡'], deductions: [], metrics: { teachers: 0, totalSalary: 0, pendingConfirmations: 0, teacherConfirmed: 0, finalized: 0, openDisputes: 0, errors: 0 } };
    callPostApi = async (action, params) => {
      if (action === 'getPayrollAdminDashboard') return fixturePayroll;
      if (action === 'recordPayrollDeduction') {
        deductionCalls.push(params.deduction);
        if (deductionCalls.length === 1) throw Error('本機模擬結果待確認');
        fixturePayroll.deductions = [{ ...params.deduction, status: '有效' }];
        return { id: params.deduction.id };
      }
      throw Error(`Unexpected API ${action}`);
    };
    authState.sessionToken = 'fixture'; authState.teacherName = '測試管理員'; authState.managementCapabilities = ['payroll_admin'];
    document.getElementById('auth-shell').hidden = true; document.getElementById('app-shell').hidden = false;
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById('view-admin').classList.add('active');
    activeAdminTab = 'payroll'; activeAdminSection = 'payroll'; payrollDashboard = fixturePayroll;
    renderPayrollAdminTab();
  });
  await page.getByText('2026-10 單月待扣款', { exact: true }).click();
  await page.locator('#payroll-deduction-teacher').selectOption('妙妙 簡');
  await page.locator('#payroll-deduction-date').fill('2026-10-19');
  await page.locator('#payroll-deduction-amount').fill('700');
  await page.locator('#payroll-deduction-reason').fill('10/19 no-show，僅扣本次');
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#payroll-deduction-submit').click();
  assert.equal(await page.evaluate(() => deductionCalls.length), 0);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#payroll-deduction-submit').click();
  await page.getByText('本機模擬結果待確認', { exact: true }).waitFor();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#payroll-deduction-submit').click();
  await page.getByText('待試算', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => deductionCalls[0].id === deductionCalls[1].id), true);
  const output = '/private/tmp/sherry-payroll-deduction-preview';
  await fs.mkdir(output, { recursive: true });
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 700]]) {
    await page.setViewportSize({ width, height });
    await page.getByText('2026-10 單月待扣款', { exact: true }).click();
    const open = await page.locator('#payroll-deduction-form').isVisible();
    if (!open) await page.getByText('2026-10 單月待扣款', { exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name);
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log(`PASS one-time payroll UI: confirmation cancel, stable retry ID, pending record, desktop/mobile/narrow layouts at ${output}; all external requests blocked.`);
} finally {
  await browser.close();
}
