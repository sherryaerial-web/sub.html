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
  { calendarId: 'cal-special', date: '2026/09/01', time: '14:00', courseName: '後彎充電特別課 (150min)', teacherName: '卡拉' },
  { calendarId: 'cal-existing', date: '2026/09/02', time: '10:00', courseName: '空環基礎', teacherName: 'Ariel' },
  { calendarId: 'cal-2', date: '2026/09/02', time: '19:00', courseName: '空中瑜伽', teacherName: '原老師甲', leaveStatus: 'pending', originalTeacherName: '原老師甲', substituteTeacherName: '', leaveLabel: '原老師請假：原老師甲｜代課老師未定' },
  { calendarId: 'cal-3', date: '2026/09/03', time: '18:30', courseName: '舞綢基礎', teacherName: '代課老師乙', leaveStatus: 'claimed', originalTeacherName: '原老師乙', substituteTeacherName: '代課老師乙', leaveLabel: '原老師請假：原老師乙｜代課老師：代課老師乙' },
  { calendarId: 'cal-4', date: '2026/09/04', time: '20:00', courseName: '綢吊 Lv.0-2 (90分)', teacherName: 'Ariel' },
];

function payload(request) {
  const params = new URLSearchParams(request.postData() || '');
  const action = params.get('action');
  const existing = [{ ...courses[1], status: '待人工確認' }];
  if (action === 'getVvipMembers') {
    return [{ id: 'vvip-1', name: '測試會員' }];
  }
  if (action === 'getVvipSelection') {
    return { email: 'vvip@example.com', month: '2026-09', limit: 4, count: 1, selections: existing, courses };
  }
  if (action === 'submitVvipSelection') {
    return { email: 'vvip@example.com', month: '2026-09', limit: 4, count: 3, selections: [...existing, { ...courses[2], status: '待人工確認' }, { ...courses[3], status: '待人工確認' }], courses };
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
  await page.locator('.vvip-special-section').getByText('後彎充電特別課 (150min)').waitFor();
  if (await page.locator('.vvip-special-section .vvip-course-checkbox').count() !== 1) {
    throw new Error(`${viewport.name}: ordinary 90-minute course was classified as special`);
  }
  const sectionOrder = await page.locator('#vvip-course-area > section').evaluateAll((sections) => sections.map((section) => section.className));
  if (sectionOrder[0] !== 'vvip-special-section') throw new Error(`${viewport.name}: special courses are not first`);
  const septemberSecond = page.locator('[data-vvip-date-toggle="2026/09/02"]');
  const septemberThird = page.locator('[data-vvip-date-toggle="2026/09/03"]');
  await septemberSecond.getByText('2026/09/02（三）').waitFor();
  if (await septemberSecond.getAttribute('aria-expanded') !== 'false') throw new Error(`${viewport.name}: ordinary date was not collapsed`);
  await septemberSecond.click();
  await septemberThird.click();
  await page.getByText('原老師請假：原老師甲｜代課老師未定').waitFor();
  await page.getByText('原老師請假：原老師乙｜代課老師：代課老師乙').waitFor();
  if (await page.locator('.vvip-course-checkbox').count() !== courses.length - 1) {
    throw new Error(`${viewport.name}: leave status created duplicate selectable courses`);
  }
  await page.locator('[data-vvip-date-toggle="2026/09/04"]').click();
  if (await page.locator('.vvip-course-checkbox').count() !== courses.length) {
    throw new Error(`${viewport.name}: expanded ordinary date did not render its course`);
  }
  await page.locator('.vvip-course-checkbox[value="cal-2"]').check();
  await page.locator('.vvip-course-checkbox[value="cal-3"]').check();
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
