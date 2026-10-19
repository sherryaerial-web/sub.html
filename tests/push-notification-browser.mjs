import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_NODE_MODULES, 'playwright'));
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = '/private/tmp/sherry-push-preview';
const html = (await fs.readFile(path.join(repo, 'index.html'), 'utf8'))
  .replace(/<script\b[^>]*src=[^>]*><\/script>/g, '')
  .replace(/\n    initialize\(\);/, '');
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const asset = new URL(route.request().url()).pathname.match(/^\/sub\.html\/assets\/(app-icon-[a-z0-9-]+\.png)$/);
    if (asset) return route.fulfill({ contentType: 'image/png', body: await fs.readFile(path.join(repo, 'assets', asset[1])) });
    return route.abort();
  });
  await page.setContent(html.replace('<head>', '<head><base href="https://push.test/sub.html/">'));
  await page.evaluate(() => {
    Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted' } });
    window.pushCalls = [];
    window.pushRemoteStatus = 'ready';
    const sdk = window.fixturePushSdk = {
      init: async () => pushCalls.push('init'),
      login: async id => { pushCalls.push(['login', id]); sdk.User.externalId = id; },
      logout: async () => pushCalls.push('logout'),
      Notifications: { permission: true, requestPermission: async () => { pushCalls.push('permission'); } },
      User: { externalId: '', addEventListener() {}, PushSubscription: {
        id: '11111111-1111-4111-8111-111111111111', token: 'fixture-token', optedIn: true,
        optIn: async () => pushCalls.push('optIn'), optOut: async () => pushCalls.push('optOut'), addEventListener() {},
      } },
    };
    window.OneSignalDeferred = { push: callback => callback(sdk) };
    callPostApi = async (action, params) => {
      pushCalls.push({ action, params });
      if (action === 'getPushConfiguration') return { configured: true, appId: 'fixture-app', externalId: 'teacher_fixture_owner' };
      if (action === 'getPushSubscriptionStatus') return {
        status: pushRemoteStatus, matched: pushRemoteStatus === 'ready', enabled: pushRemoteStatus === 'ready',
      };
      throw Error(`Unexpected API: ${action}`);
    };
    authState.sessionToken = 'fixture'; authState.teacherName = '卡拉 卡拉';
    document.getElementById('auth-shell').hidden = true;
    document.getElementById('app-shell').hidden = false;
    document.getElementById('current-user').textContent = '卡拉 卡拉';
    document.getElementById('teacher-home-summary').textContent = '2026 年 11 月';
  });
  await page.evaluate(() => initializePushForSession());
  await page.locator('#push-check').click();
  await page.getByText('已確認這支裝置綁定 卡拉 卡拉，通知訂閱有效。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => pushCalls.includes('optIn')), false);
  await fs.mkdir(output, { recursive: true });
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 700]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name);
    for (const selector of ['#push-check', '#push-repair']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box && box.width > 70 && box.height >= 40 && box.x >= 0 && box.x + box.width <= width, `${name}: ${selector}`);
    }
    const copy = await page.locator('#push-status-copy').boundingBox();
    const actions = await page.locator('.push-permission-actions').boundingBox();
    assert.ok(copy && actions && (copy.y + copy.height <= actions.y || copy.x + copy.width <= actions.x), `${name}: copy/actions overlap`);
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
  await page.evaluate(() => { pushRemoteStatus = 'not_linked'; });
  await page.locator('#push-repair').click();
  await page.getByText('推播服務尚未確認這支裝置的帳號綁定，請稍後檢查或重新綁定。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => pushCalls.filter(call => call === 'optIn').length), 1);
  await page.screenshot({ path: `${output}/not-linked-mobile.png`, fullPage: true });
  await page.evaluate(() => { fixturePushSdk.User.PushSubscription.id = ''; fixturePushSdk.User.PushSubscription.token = ''; });
  await page.locator('#push-check').click();
  await page.getByText('這支裝置尚未建立有效通知訂閱，請開啟通知或重新綁定。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => pushCalls.filter(call => call && call.action === 'getPushSubscriptionStatus').length), 2);
  assert.equal(await page.evaluate(() => pushCalls.includes('optOut') || pushCalls.includes('logout')), false);
  assert.deepEqual(errors, []);
  console.log(`PASS push UI: desktop/mobile/narrow screenshots at ${output}; check is read-only, repair rebinds own device, missing subscription and unconfirmed server do not report success; no real network/sends.`);
} finally {
  await browser.close();
}
