import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bootWorkspaceFixture } from './fixtures/workspace-navigation-fixture.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_NODE_MODULES || '/Users/ivy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules', 'playwright'));
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(repo, '../../../output/personal-appearance-20261110');
await fs.mkdir(output, { recursive: true });
let html = (await fs.readFile(path.join(repo, 'index.html'), 'utf8')).replace(/\n    initialize\(\);/, '');
const inline = source => `<script>${source.replaceAll('</script', '<\\/script')}</script>`;
for (const [tag, src] of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  const name = src.split('?')[0];
  const source = name.includes('OneSignalSDK') ? '' : await fs.readFile(name.startsWith('https://unpkg.com/lucide') ? '/private/tmp/sherry-lucide-0.468.0.min.js' : path.join(repo, name), 'utf8');
  html = html.replace(tag, () => inline(source));
}
for (const [tag, href] of [...html.matchAll(/<link\b[^>]*href="([^"]+)"[^>]*>/g)]) {
  const name = href.split('?')[0];
  html = html.replace(tag, () => name.endsWith('.css') && !name.startsWith('https:') ? `__CSS_${name}__` : '');
  if (name.endsWith('.css') && !name.startsWith('https:')) html = html.replace(`__CSS_${name}__`, () => `<style>${require('node:fs').readFileSync(path.join(repo, name), 'utf8')}</style>`);
}
html = html.replaceAll('./assets/app-icon-180.png', `data:image/png;base64,${(await fs.readFile(path.join(repo, 'assets/app-icon-180.png'))).toString('base64')}`)
  .replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">')
  .replace(/<\/body>\s*<\/html>\s*$/, () => `${inline(`(${bootWorkspaceFixture.toString()})();`)}</body></html>`);
const file = path.join(output, 'preview.html');
await fs.writeFile(file, html);
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const errors = [], requests = [];
let scenes = 0;
try {
  const page = await browser.newPage({ locale: 'zh-TW', timezoneId: 'Asia/Taipei' });
  page.setDefaultTimeout(5000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  await page.route(/^https?:/, route => route.abort());
  await page.goto(pathToFileURL(file).href);
  assert.equal(await page.locator('#account-appearance-entry').count(), 1, 'My includes personalization');
  await page.evaluate(() => {
    window.appearanceSaves = [];
    window.appearanceSaved = SherryPersonalAppearance.defaultPreference();
    window.appearanceResult = 'success';
    const existingRead = callPostApi;
    callPostApi = async (action, params) => {
      if (action === 'getPersonalAppearance') return { available: true, preference: structuredClone(window.appearanceSaved) };
      if (action === 'savePersonalAppearance') {
        window.appearanceSaves.push(structuredClone(params));
        if (window.appearanceResult === 'failure') throw Error('連線逾時');
        if (window.appearanceResult === 'conflict') return { saved: false, reason: 'conflict', current: { ...window.appearanceSaved, revision: 9 } };
        window.appearanceSaved = { ...JSON.parse(params.preference), revision: window.appearanceSaved.revision + 1, updatedAt: '2026-11-10T12:00:00.000Z' };
        return { saved: true, preference: structuredClone(window.appearanceSaved) };
      }
      return existingRead(action, params);
    };
    syncPersonalAppearanceSession(true);
    personalAppearance.load();
  });
  const open = async () => {
    await page.evaluate(() => switchView('view-account'));
    await page.locator('#account-appearance-entry').click();
    await page.waitForSelector('#appearance-dialog[open]');
    await page.waitForFunction(() => !personalAppearance.snapshot().busy);
  };
  const layout = async label => {
    const overflow = await page.evaluate(() => {
      const elements = [...document.querySelectorAll('#appearance-dialog[open], #appearance-dialog[open] button, #appearance-dialog[open] input')];
      return elements.filter(e => { const b=e.getBoundingClientRect(); return b.width && (b.left < -1 || b.right > innerWidth+1); }).map(e=>e.id);
    });
    assert.deepEqual(overflow, [], label); scenes++;
  };
  const readable = async label => {
    const ratios = await page.evaluate(() => {
      const luminance = color => color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => v/255)
        .map(v => v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4)
        .reduce((sum,v,i) => sum+v*[.2126,.7152,.0722][i],0);
      return ['.topbar','#appearance-save'].map(selector => {
        const css=getComputedStyle(document.querySelector(selector));
        const a=luminance(css.color),b=luminance(css.backgroundColor);
        return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      });
    });
    assert.ok(ratios.every(r=>r>=4.5),`${label}: actual primary controls must remain readable (${ratios})`);
  };
  for (const width of [1366,390,320]) {
    await page.setViewportSize({ width, height: 900 });
    await open();
    assert.equal(await page.locator('[data-appearance-preset]').count(), 6);
    for (const id of ['original','rose','sage','blue','lilac','stone']) {
      await page.locator(`[data-appearance-preset="${id}"]`).click();
      await layout(`${width}/${id}`);
      await readable(`${width}/${id}`);
      await page.locator('#appearance-save').hover();
      await readable(`${width}/${id}/hover`);
      assert.equal(await page.locator('[data-appearance-preset][aria-pressed="true"]').count(),1);
    }
    await page.locator('#appearance-primary').fill('#112233');
    await page.locator('#appearance-secondary').fill('#ddeeff');
    assert.equal(await page.locator('#appearance-primary-value').textContent(), '#112233');
    assert.equal(await page.locator('[data-appearance-preset][aria-pressed="true"]').count(),0);
    for (const color of ['#ffffff','#000000','#ffff00','#0000ff','#777777']) {
      await page.locator('#appearance-primary').fill(color);
      await page.locator('#appearance-secondary').fill(color);
      await readable(`${width}/${color}`);
      await page.locator('#appearance-save').hover();
      await readable(`${width}/${color}/hover`);
      await layout(`${width}/${color}`);
    }
    await page.locator('#appearance-reset').click();
    assert.equal(await page.locator('#appearance-primary').inputValue(),'#786c64');
    await page.screenshot({ path: path.join(output, `settings-${width}.png`) });
    await page.locator('#appearance-cancel').click();
    assert.equal(await page.evaluate(() => window.appearanceSaves.length),0);
  }
  await open();
  await page.locator('[data-appearance-preset="blue"]').click();
  await page.locator('#appearance-save').click();
  await page.waitForFunction(() => personalAppearance.snapshot().status === 'saved');
  assert.equal(await page.evaluate(() => window.appearanceSaves.length),1);
  await page.locator('#appearance-close').click();
  assert.equal(await page.locator('#app-shell').evaluate(e=>getComputedStyle(e).getPropertyValue('--appearance-primary').trim()),'#707c83');
  await open();
  await page.locator('[data-appearance-preset="rose"]').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#app-shell').evaluate(e=>getComputedStyle(e).getPropertyValue('--appearance-primary').trim()),'#707c83');
  await page.evaluate(() => {
    switchView('view-leave');
    document.querySelector('[data-date="2026/11/11"]').click();
    document.querySelector('.leave-course-checkbox').click();
    window.appearanceDraftBefore = [...selectedLeaveCourses];
    personalAppearance.open();
  });
  await page.locator('[data-appearance-preset="sage"]').click();
  await page.locator('#appearance-cancel').click();
  assert.deepEqual(await page.evaluate(() => [...selectedLeaveCourses]),await page.evaluate(() => window.appearanceDraftBefore));
  await open();
  await page.locator('[data-appearance-preset="lilac"]').click();
  await page.evaluate(() => { window.appearanceResult='conflict'; });
  await page.locator('#appearance-save').click();
  await page.waitForFunction(() => personalAppearance.snapshot().status==='conflict');
  assert.equal(await page.locator('#appearance-reload').isVisible(),true);
  await page.locator('#appearance-reload').click();
  await page.waitForFunction(() => personalAppearance.snapshot().status === 'ready');
  assert.equal(await page.locator('#appearance-dialog').evaluate(e => e.open),true,'reload survives prior queued close event');
  await page.locator('#appearance-cancel').click();
  await page.evaluate(() => { window.appearanceResult='failure'; });
  await open();
  await page.locator('[data-appearance-preset="rose"]').click();
  await page.locator('#appearance-save').click();
  await page.waitForFunction(() => ['error','uncertain'].includes(personalAppearance.snapshot().status));
  assert.notEqual(await page.locator('#appearance-status').textContent(),'');
  const unresolved = await page.evaluate(() => window.appearanceSaves.at(-1));
  assert.equal(await page.locator('#appearance-save span').textContent(),'核對原操作');
  assert.equal(await page.locator('#appearance-reload').isVisible(),false);
  await page.evaluate(() => { window.appearanceResult='success'; });
  await page.locator('#appearance-save').click();
  await page.waitForFunction(() => personalAppearance.snapshot().status === 'saved');
  assert.deepEqual(await page.evaluate(() => window.appearanceSaves.at(-1)),unresolved,'reconcile the same request');
  await page.locator('#appearance-cancel').click();
  await page.evaluate(() => startActingAsTeacher('Tako'));
  assert.equal(await page.locator('#account-appearance-entry').isDisabled(),true);
  await page.evaluate(() => stopActingAsTeacher());
  await page.evaluate(() => clearSession());
  assert.equal(await page.locator('#app-shell').evaluate(e=>getComputedStyle(e).getPropertyValue('--appearance-primary').trim()),'#786c64');
  assert.deepEqual(errors,[]);
  assert.deepEqual(requests,[]);
  assert.deepEqual(await page.evaluate(() => offlineWrites),[]);
  console.log(JSON.stringify({scenes,widths:[1366,390,320],browserErrors:errors,externalRequests:requests,formalWrites:0},null,2));
} finally { await browser.close(); }
