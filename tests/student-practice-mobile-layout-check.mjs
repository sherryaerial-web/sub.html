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

// iOS/LINE WebView gives date inputs an intrinsic minimum width. Inject the
// equivalent low-priority style before the app stylesheet so this check can
// reproduce that browser behavior in Chromium.
const html = source
  .replace('<style>', '<style>input[type="date"]{min-width:460px}</style><style>')
  .replace('<script src="student-practice.js"></script>', '');

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const layout = await page.evaluate(() => {
    const input = document.querySelector('#practice-date');
    const app = document.querySelector('.app');
    const inputRect = input.getBoundingClientRect();
    const appRect = app.getBoundingClientRect();
    return {
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      inputLeft: inputRect.left,
      inputRight: inputRect.right,
      appLeft: appRect.left,
      appRight: appRect.right,
    };
  });

  if (layout.scrollWidth > layout.viewportWidth + 1) {
    throw new Error(`student practice page overflows horizontally: ${JSON.stringify(layout)}`);
  }
  if (layout.inputLeft < layout.appLeft - 1 || layout.inputRight > layout.appRight + 1) {
    throw new Error(`student practice date escapes its container: ${JSON.stringify(layout)}`);
  }
} finally {
  await browser.close();
}
