import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pngjs from 'pngjs';

const { PNG } = pngjs;
const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(testDir, '..');
const outputDir = '/private/tmp/substitute-vvip-screenshots';
const html = await fs.readFile(path.join(repoDir, 'vvip.html'), 'utf8');
const courses = [
  { calendarId: 'cal-existing', date: '2026/09/02', time: '10:00', courseName: '空環基礎', teacherName: 'Ariel' },
  { calendarId: 'cal-2', date: '2026/09/02', time: '19:00', courseName: '空中瑜伽', teacherName: 'Jina' },
  { calendarId: 'cal-3', date: '2026/09/03', time: '18:30', courseName: '舞綢基礎', teacherName: 'Mina' },
  { calendarId: 'cal-4', date: '2026/09/04', time: '20:00', courseName: '綢吊基礎', teacherName: 'Ariel' },
];

function payload(request) {
  const params = new URLSearchParams(request.postData() || '');
  const action = params.get('action');
  const existing = [{ ...courses[0], status: '待人工確認' }];
  if (action === 'getVvipMembers') {
    return [{ id: 'vvip-1', name: '測試會員' }];
  }
  if (action === 'getVvipSelection') {
    return { email: 'vvip@example.com', month: '2026-09', limit: 4, count: 1, selections: existing, courses };
  }
  if (action === 'submitVvipSelection') {
    return { email: 'vvip@example.com', month: '2026-09', limit: 4, count: 3, selections: [...existing, { ...courses[1], status: '待人工確認' }, { ...courses[2], status: '待人工確認' }], courses };
  }
  return {};
}

function inspectScreenshot(buffer, label) {
  const png = PNG.sync.read(buffer);
  const colors = new Set();
  for (let y = 0; y < png.height; y += 8) {
    for (let x = 0; x < png.width; x += 8) {
      const offset = (png.width * y + x) * 4;
      colors.add(`${png.data[offset] >> 4}-${png.data[offset + 1] >> 4}-${png.data[offset + 2] >> 4}`);
    }
  }
  if (colors.size < 18) throw new Error(`${label}: screenshot appears blank`);
  return { width: png.width, height: png.height, colorBuckets: colors.size };
}

async function runJourney(browser, viewport) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('https://script.google.com/**', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') throw new Error('VVIP API request must use POST');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: payload(request) }) });
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.locator('#vvip-member').fill('測試會員');
  await page.locator('#vvip-lookup').click();
  await page.locator('.vvip-course-checkbox').nth(1).check();
  await page.locator('.vvip-course-checkbox').nth(2).check();
  await page.locator('#vvip-counter').getByText('已選 3／4 堂').waitFor();
  await page.locator('#vvip-submit').click();
  await page.getByText('選課意願已送出').waitFor();
  await page.locator('#vvip-summary-list').getByText('空中瑜伽').waitFor();
  await page.locator('#vvip-summary-list').getByText('舞綢基礎').waitFor();
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    text: document.body.innerText,
    buttonOverflow: [...document.querySelectorAll('button, input, .course-item')]
      .filter((item) => item.getBoundingClientRect().width > 0)
      .filter((item) => item.scrollWidth > item.clientWidth + 2)
      .map((item) => item.id || item.className),
  }));
  if (layout.scrollWidth > layout.clientWidth + 1) throw new Error(`${viewport.name}: horizontal overflow`);
  if (layout.buttonOverflow.length) throw new Error(`${viewport.name}: clipped controls ${layout.buttonOverflow.join(', ')}`);
  if (!layout.text.includes('不代表正式保留名額')) throw new Error(`${viewport.name}: member caveat missing`);
  if (errors.length) throw new Error(`${viewport.name}: browser errors ${errors.join(' | ')}`);
  const file = path.join(outputDir, `${viewport.name}-vvip-final.png`);
  const screenshot = await page.screenshot({ fullPage: true });
  await fs.writeFile(file, screenshot);
  await page.close();
  return { file, layout: { width: layout.clientWidth, scrollWidth: layout.scrollWidth }, pixels: inspectScreenshot(screenshot, viewport.name) };
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const results = [];
  results.push(await runJourney(browser, { name: 'desktop', width: 1280, height: 900 }));
  results.push(await runJourney(browser, { name: 'mobile', width: 390, height: 844 }));
  console.log(JSON.stringify({ screenshots: results.length, outputDir, results }, null, 2));
} finally {
  await browser.close();
}
