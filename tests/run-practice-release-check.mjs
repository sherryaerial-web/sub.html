import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(testDir, "..");
const dependencyFallback = path.join(
  os.homedir(),
  ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules",
);
const dependencyRoot = process.env.CODEX_NODE_MODULES || dependencyFallback;

function runStep(label, command, args, env = process.env) {
  console.log(`\n[自主練習發布檢查] ${label}`);
  const result = spawnSync(command, args, {
    cwd: repoDir,
    env,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`${label} 無法啟動：${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${label} 失敗，已阻止發布。`);
    process.exit(result.status || 1);
  }
}

runStep("程式差異格式", "git", ["diff", "--check", "HEAD"]);
runStep("後端、前端、PWA 與 VVIP 全套回歸", process.execPath, [
  "--test",
  "tests/backend-core.test.js",
  "tests/frontend-contract.test.js",
  "tests/morandi-visual-contract.test.js",
  "tests/pwa-contract.test.js",
  "tests/vvip-frontend.test.js",
]);

if (!fs.existsSync(dependencyRoot)) {
  console.error(`找不到視覺測試依賴：${dependencyRoot}`);
  process.exit(1);
}
runStep("桌面、平板與手機完整視覺操作", process.execPath, [
  "tests/visual-check.mjs",
], {
  ...process.env,
  CODEX_NODE_MODULES: dependencyRoot,
});

console.log("\n自主練習發布檢查全部通過；測試只使用假資料，未連線或寫入正式 Sheet／OB。\n");
