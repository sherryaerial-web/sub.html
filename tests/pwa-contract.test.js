const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function readPngSize(filePath) {
  const png = fs.readFileSync(filePath);
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG', `${filePath} 必須是 PNG`);
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

test('首頁提供手機與桌面安裝所需的 PWA metadata', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(html, /<link rel="manifest" href="\.\/manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="\.\/assets\/app-icon-180\.png">/);
  assert.match(html, /<meta name="theme-color" content="#f3f0eb">/);
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes">/);
  assert.match(html, /<meta name="apple-mobile-web-app-status-bar-style" content="default">/);
});

test('manifest 以獨立視窗啟動並包含標準與 maskable icon', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));

  assert.equal(manifest.name, 'Sherry Aerial 教室管理');
  assert.equal(manifest.short_name, '教室管理');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#f3f0eb');
  assert.equal(manifest.background_color, '#f3f0eb');
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, purpose }) => ({ src, sizes, purpose })),
    [
      { src: './assets/app-icon-192.png', sizes: '192x192', purpose: 'any' },
      { src: './assets/app-icon-512.png', sizes: '512x512', purpose: 'any' },
      { src: './assets/app-icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
    ],
  );
});

test('輸出的 app icon 尺寸正確', () => {
  const expectedSizes = new Map([
    ['assets/app-icon-180.png', 180],
    ['assets/app-icon-192.png', 192],
    ['assets/app-icon-512.png', 512],
    ['assets/app-icon-maskable-512.png', 512],
  ]);

  expectedSizes.forEach((size, relativePath) => {
    assert.deepEqual(readPngSize(path.join(root, relativePath)), { width: size, height: size });
  });
});

test('PWA 只使用 OneSignal 推播 worker，不快取管理資料', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'OneSignalSDKWorker.js'), 'utf8');

  assert.match(html, /OneSignalSDK\.page\.js/);
  assert.match(html, /serviceWorkerPath:\s*["']\/sub\.html\/OneSignalSDKWorker\.js["']/);
  assert.match(html, /serviceWorkerParam:\s*\{\s*scope:\s*["']\/sub\.html\/["']\s*\}/);
  assert.doesNotMatch(html, /serviceWorkerPath:\s*["']OneSignalSDKWorker\.js["']/);
  assert.doesNotMatch(html, /serviceWorkerParam:\s*\{\s*scope:\s*["']\.\/["']\s*\}/);
  assert.match(worker, /OneSignalSDK\.sw\.js/);
  assert.doesNotMatch(worker, /addEventListener\s*\(\s*['"]fetch['"]/);
  assert.doesNotMatch(worker, /caches\s*\.|CacheStorage|cache\.addAll/);
  assert.doesNotMatch(html, /navigator\.serviceWorker\.register/);
  assert.equal(fs.existsSync(path.join(root, 'service-worker.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'sw.js')), false);
});

test('deployment guide documents private OneSignal setup and device onboarding', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

  assert.match(readme, /ONESIGNAL_APP_ID/);
  assert.match(readme, /ONESIGNAL_REST_API_KEY/);
  assert.match(readme, /PUSH_EXTERNAL_ID_SALT.*自動/);
  assert.match(readme, /iOS\/iPadOS 16\.4/);
  assert.match(readme, /加入主畫面/);
  assert.match(readme, /`通知訊息`、`通知收件人`/);
  assert.match(readme, /不會改動或覆寫既有工作表欄位與人工資料/);
  assert.match(readme, /不回填舊推播/);
});
