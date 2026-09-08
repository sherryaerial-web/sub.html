import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dependencyRoot = process.env.CODEX_NODE_MODULES || '';
const playwright = require(dependencyRoot ? path.join(dependencyRoot, 'playwright') : 'playwright');
const { chromium } = playwright;
const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(testDir, '..');
const source = await fs.readFile(path.join(repoDir, 'student-practice.html'), 'utf8');

const html = source
  .replace('<script src="student-practice.js"></script>', '')
  .replace(/\s*<script src="https:\/\/challenges\.cloudflare\.com\/turnstile\/[^>]+><\/script>/, '');

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});

try {
  for (const width of [320, 375, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const layout = await page.evaluate(() => {
      const input = document.querySelector('#practice-date');
      const field = input.closest('.field');
      const app = document.querySelector('.app');
      const inputRect = input.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      const appRect = app.getBoundingClientRect();
      const style = getComputedStyle(input);
      const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      return {
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        inputLeft: inputRect.left,
        inputRight: inputRect.right,
        fieldLeft: fieldRect.left,
        fieldRight: fieldRect.right,
        appLeft: appRect.left,
        appRight: appRect.right,
        horizontalPadding,
        iosInputRight: inputRect.right + horizontalPadding,
      };
    });

    if (layout.scrollWidth > layout.viewportWidth + 1) {
      throw new Error(`student practice page overflows horizontally: ${JSON.stringify(layout)}`);
    }
    if (layout.inputLeft < layout.fieldLeft - 1 || layout.inputRight > layout.fieldRight + 1) {
      throw new Error(`student practice date escapes its container: ${JSON.stringify(layout)}`);
    }
    // WebKit bug 301648 calculates date inputs as 100% wide and then adds
    // horizontal padding on iOS. Model that extra width here so the test fails
    // if padding is accidentally restored to the full-width date input.
    if (layout.iosInputRight > layout.fieldRight + 1) {
      throw new Error(`student practice date triggers iOS padded-width overflow: ${JSON.stringify(layout)}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
