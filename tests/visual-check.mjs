import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import pngjs from "pngjs";
import { chromium } from "playwright";

const { PNG } = pngjs;
const require = createRequire(import.meta.url);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(testDir, "..");
const outputDir = "/private/tmp/substitute-v2-screenshots";
const html = await fs.readFile(path.join(repoDir, "index.html"), "utf8");
const lucidePath = path.resolve(path.dirname(require.resolve("lucide")), "../umd/lucide.js");
const lucideScript = await fs.readFile(lucidePath);

const hardTimeout = setTimeout(() => {
  console.error("visual check exceeded 90 seconds");
  process.exit(1);
}, 90000);

await fs.mkdir(outputDir, { recursive: true });

const leavePending = {
  substituteId: "sub-pending",
  originalTeacher: "Ariel Lu",
  substituteTeacher: "",
  date: "2026/08/12",
  time: "18:30",
  originalCourse: "空環 Lv.2",
  actualCourse: "空環 Lv.2",
  difficulty: "",
  status: "確認中",
  changeStatus: "",
  verificationStatus: "",
  note: "",
  auditHistory: []
};
const leaveOb = {
  substituteId: "sub-ob",
  originalTeacher: "Jina",
  substituteTeacher: "Mina",
  date: "2026/08/14",
  time: "19:30",
  originalCourse: "舞綢 Lv.1",
  actualCourse: "空環基礎",
  difficulty: "Lv.1",
  status: "已領取",
  changeStatus: "",
  verificationStatus: "待核對",
  differenceReason: "",
  note: "改為可教授的空環課程",
  auditHistory: [{ time: "2026-08-05 10:20", action: "領取代課", reason: "改課" }]
};
const leaveChange = {
  ...leaveOb,
  substituteId: "sub-change",
  changeStatus: "申請退出中",
  note: "臨時身體不適"
};
const leaveException = {
  ...leaveOb,
  substituteId: "sub-exception",
  verificationStatus: "核對異常",
  differenceReason: "代課老師不一致"
};
const leaveComplete = {
  ...leaveOb,
  substituteId: "sub-complete",
  verificationStatus: "已核對",
  status: "已領取"
};

const fixtures = {
  getTeachers: [
    { "指導者": "Ariel Lu" },
    { "指導者": "Ivy" },
    { "指導者": "Jina" },
    { "指導者": "Mina" }
  ],
  getMyCourses: [
    { "日期": "2026/08/10", "時間": "18:30", "課程": "空環 Lv.2", "課程大類": "空環", "OB Calendar ID": "cal-1" },
    { "日期": "2026/08/10", "時間": "19:30", "課程": "空環基礎", "課程大類": "空環", "OB Calendar ID": "cal-2" },
    { "日期": "2026/08/12", "時間": "20:30", "課程": "空中瑜伽", "課程大類": "空瑜", "OB Calendar ID": "cal-3" }
  ],
  getMyLeaves: [
    {
      "代課編號": "mine-1", "日期": "2026/08/10", "時段": "18:30", "課程": "空環 Lv.2",
      "狀態": "已領取", "代課老師": "Jina", "實際課程名稱": "空環 Lv.2", "預計難度": "Lv.2",
      "處理類型": "沿用原課程", "OB 核對狀態": "待核對", "異動狀態": "無", "備註": "",
      "可自行取消": false, "可申請取消": true, "異動紀錄": []
    },
    {
      "代課編號": "mine-2", "日期": "2026/08/12", "時段": "20:30", "課程": "空中瑜伽",
      "狀態": "確認中", "代課老師": "", "實際課程名稱": "", "預計難度": "",
      "處理類型": "", "OB 核對狀態": "", "異動狀態": "無", "備註": "",
      "可自行取消": true, "可申請取消": false, "異動紀錄": []
    }
  ],
  getAvailableSubstitutes: [
    { "代課編號": "sub-cross", "原老師": "Jina", "日期": "2026/08/11", "時段": "18:30", "課程": "舞綢 Lv.1", "課程大類": "舞綢", "可沿用原課程": false },
    { "代課編號": "sub-same", "原老師": "Mina", "日期": "2026/08/13", "時段": "19:30", "課程": "空環 Lv.1", "課程大類": "空環", "可沿用原課程": true }
  ],
  getClaimOptions: {
    capabilities: ["空環", "空瑜"],
    classes: [
      { classId: "class-ring-1", courseName: "空環 Lv.1", category: "空環" },
      { classId: "class-yoga-1", courseName: "空中瑜伽", category: "空瑜" }
    ]
  },
  getMySubs: [
    {
      "代課編號": "sub-history", "日期": "2026/08/08", "時段": "19:30", "課程": "舞綢 Lv.1",
      "原老師": "Jina", "處理類型": "需要新增課程", "實際課程名稱": "空環基礎", "預計難度": "Lv.1",
      "備註": "改為可教授的空環課程", "異動狀態": "無", "可申請退出": true, "異動紀錄": []
    }
  ],
  getMyPayroll: {
    month: "2026-08",
    summary: { month: "2026-08", teacherName: "Ariel Lu", subtotal: 26800, bonusRate: 0.04, bonusAmount: 1072, fixedAdjustment: 0, totalSalary: 27872, profit: 41200, version: "payroll-v1", status: "待確認", confirmedAt: "", updatedAt: "2026-09-01 10:00" },
    lines: [
      { month: "2026-08", lineId: "pay-1", version: "payroll-v1", calendarId: "cal-pay-1", teacherName: "Ariel Lu", date: "2026/08/05", time: "18:30", courseName: "空環 Lv.2", billingType: "人數階梯", attendanceCount: 5, courseIncome: "", ruleDetail: "5 人", amount: 1000, manualAdjustment: 0, adjustmentReason: "", status: "待確認" },
      { month: "2026-08", lineId: "pay-2", version: "payroll-v1", calendarId: "cal-pay-2", teacherName: "Ariel Lu", date: "2026/08/08", time: "19:30", courseName: "空環 Flare 特別課", billingType: "特別課60%", attendanceCount: 8, courseIncome: 7430, ruleDetail: "課程收入 7430 × 60%", amount: 4458, manualAdjustment: 0, adjustmentReason: "", status: "待確認" }
    ],
    disputes: []
  },
  getPayrollAdminDashboard: {
    month: "2026-08",
    version: "payroll-v1",
    summaries: [
      { month: "2026-08", teacherName: "Ariel Lu", subtotal: 26800, bonusRate: 0.04, bonusAmount: 1072, fixedAdjustment: 0, adminAdjustment: 100, adjustmentReason: "補發一堂課", totalSalary: 27972, profit: 41200, version: "payroll-v1", status: "已確認", confirmedAt: "2026-09-01 12:00", updatedAt: "2026-09-01 10:00" },
      { month: "2026-08", teacherName: "Jina", subtotal: 18400, bonusRate: 0.03, bonusAmount: 552, fixedAdjustment: 0, adminAdjustment: 0, adjustmentReason: "", totalSalary: 18952, profit: 28000, version: "payroll-v1", status: "管理員已確認", confirmedAt: "2026-09-01 12:00", updatedAt: "2026-09-01 13:00", adminConfirmedAt: "2026-09-01 13:00", adminConfirmedBy: "Ivy" }
    ],
    lines: [],
    disputes: [{ id: "dispute-1", teacherName: "Mina", lineId: "pay-3", message: "8/12 的出席人數需要確認", status: "待處理", reply: "", createdAt: "2026-09-01 11:00", handler: "", resolvedAt: "" }],
    metrics: { teachers: 2, totalSalary: 46924, draft: 0, pendingConfirmations: 0, teacherConfirmed: 1, finalized: 1, openDisputes: 1, errors: 0 }
  },
  getAdminDashboard: {
    paused: false,
    leavePaused: false,
    teachers: ["Ivy", "Ariel Lu", "Jina", "Mina"],
    pendingInvitations: [leavePending],
    activeInvitees: [{ invitationId: "invite-1", teacherName: "Jina", openedAt: "2026-08-05 09:00", viewedAt: "2026-08-05 09:12" }],
    obWork: [leaveOb],
    changeRequests: [leaveChange],
    exceptions: [leaveException],
    completed: [leaveComplete],
    replacementOptions: [{ calendarId: "cal-new", courseName: "空環基礎", teacherName: "Mina", date: "2026/08/14", time: "19:30" }]
  }
};

function apiPayload(request) {
  const isPost = request.method() === "POST";
  const params = isPost
    ? new URLSearchParams(request.postData() || "")
    : new URL(request.url()).searchParams;
  const action = params.get("action");
  if (action === "login") {
    const teacherName = params.get("teacherName");
    return {
      sessionToken: teacherName === "Ivy" ? "admin-token" : "teacher-token",
      teacherName,
      role: teacherName === "Ivy" ? "管理員" : "老師",
      managementCapabilities: teacherName === "Ivy" ? ["course_admin", "payroll_admin", "vvip_admin"] : []
    };
  }
  if (action === "logout") return { loggedOut: true };
  return fixtures[action] ?? { count: 1 };
}

function inspectPixels(buffer, label) {
  const png = PNG.sync.read(buffer);
  const colors = new Set();
  let count = 0;
  let sum = 0;
  let sumSquares = 0;
  for (let y = 0; y < png.height; y += 8) {
    for (let x = 0; x < png.width; x += 8) {
      const index = (png.width * y + x) * 4;
      const r = png.data[index];
      const g = png.data[index + 1];
      const b = png.data[index + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      colors.add(`${r >> 4}-${g >> 4}-${b >> 4}`);
      sum += luminance;
      sumSquares += luminance * luminance;
      count += 1;
    }
  }
  const mean = sum / count;
  const deviation = Math.sqrt(Math.max(0, sumSquares / count - mean * mean));
  if (colors.size < 18 || deviation < 8) throw new Error(`${label}: screenshot appears blank`);
  return { width: png.width, height: png.height, colorBuckets: colors.size, luminanceDeviation: Number(deviation.toFixed(2)) };
}

async function capture(page, viewportName, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(80);
  const layout = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const overflow = [...document.querySelectorAll("button, .list-item, .date-option, .summary-item")]
      .filter(visible)
      .filter((element) => element.scrollWidth > element.clientWidth + 2)
      .map((element) => element.id || element.className || element.textContent.trim().slice(0, 30));
    const nav = document.querySelector(".primary-nav");
    const workspace = document.querySelector(".workspace");
    const navStyle = getComputedStyle(nav);
    const mobileNavProtected = innerWidth > 760 || navStyle.position !== "fixed" || parseFloat(getComputedStyle(workspace).paddingBottom) >= nav.getBoundingClientRect().height + 16;
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyTextLength: document.body.innerText.length,
      overflow,
      mobileNavProtected
    };
  });
  if (layout.scrollWidth > layout.clientWidth + 1) throw new Error(`${viewportName}/${name}: horizontal overflow ${layout.scrollWidth}/${layout.clientWidth}`);
  if (layout.overflow.length) throw new Error(`${viewportName}/${name}: clipped controls ${layout.overflow.join(" | ")}`);
  if (!layout.mobileNavProtected) throw new Error(`${viewportName}/${name}: mobile navigation overlaps content`);
  if (layout.bodyTextLength < 35) throw new Error(`${viewportName}/${name}: required UI is missing`);

  const screenshot = await page.screenshot({ fullPage: true });
  const file = path.join(outputDir, `${viewportName}-${name}.png`);
  await fs.writeFile(file, screenshot);
  return { file, layout, pixels: inspectPixels(screenshot, `${viewportName}/${name}`) };
}

async function login(page, teacherName) {
  await page.locator("#login-teacher").fill(teacherName);
  await page.locator("#login-pin").fill("1234");
  await page.locator("#login-submit").click();
  await page.locator("#app-shell").waitFor({ state: "visible" });
}

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
const results = [];
const payrollOnly = process.env.VISUAL_SCOPE === "payroll";
const adminHeaderOnly = process.env.VISUAL_SCOPE === "admin-header";

try {
  for (const viewport of [
    { name: "desktop", width: 1280, height: 900 },
    { name: "mobile", width: 390, height: 844 }
  ]) {
    const page = await browser.newPage({ viewport });
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.route("https://unpkg.com/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/javascript", body: lucideScript });
    });
    await page.route("https://script.google.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", data: apiPayload(route.request()) })
      });
    });

    await page.setContent(html, { waitUntil: "networkidle", timeout: 10000 });
    if (adminHeaderOnly) {
      await login(page, "Ivy");
      await page.locator("#admin-entry").click();
      await page.locator("#admin-summary .summary-item").first().waitFor();
      results.push(await capture(page, viewport.name, "admin-header"));
      if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
      await page.close();
      continue;
    }
    if (payrollOnly) {
      await login(page, "Ivy");
      await page.locator("#admin-entry").click();
      await page.locator('[data-admin-tab="payroll"]').click();
      await page.locator(".payroll-toolbar").waitFor();
      results.push(await capture(page, viewport.name, "admin-7-payroll"));
      if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
      await page.close();
      continue;
    }
    results.push(await capture(page, viewport.name, "01-login"));
    await login(page, "Ariel Lu");

    await page.locator('.nav-item[data-view="view-leave"]').click();
    await page.locator(".leave-date-checkbox").first().waitFor();
    await page.locator("#select-all-visible-dates").click();
    await page.locator(".leave-course-checkbox").nth(0).check();
    await page.locator(".leave-course-checkbox").nth(1).check();
    await page.locator("#leave-confirmation-count").getByText("已選 2 堂").waitFor();
    results.push(await capture(page, viewport.name, "02-leave-confirmation"));

    await page.locator('.nav-item[data-view="view-myleaves"]').click();
    await page.locator("#my-leaves-list .list-item").first().waitFor();
    results.push(await capture(page, viewport.name, "03-leave-history"));

    await page.locator('.nav-item[data-view="view-claim"]').click();
    const crossCard = page.locator('[data-claim-card-id="sub-cross"]');
    await crossCard.waitFor();
    await crossCard.locator(".claim-checkbox").check();
    await crossCard.locator(".handling-option", { hasText: "需要新增課程" }).click();
    await crossCard.locator(".new-course-name").fill("空環基礎");
    await crossCard.locator(".new-course-category").selectOption("空環");
    await crossCard.locator(".claim-difficulty").fill("Lv.1");
    await crossCard.locator(".claim-note").fill("改為可教授的空環課程");
    results.push(await capture(page, viewport.name, "04-cross-apparatus-claim"));

    await page.locator('.nav-item[data-view="view-mysubs"]').click();
    await page.locator("#my-subs-list .list-item").first().waitFor();
    results.push(await capture(page, viewport.name, "05-substitute-history"));

    await page.locator('.nav-item[data-view="view-payroll"]').click();
    await page.locator(".payroll-hero").waitFor();
    results.push(await capture(page, viewport.name, "06-payroll"));

    await page.locator("#logout-button").click();
    await page.locator("#auth-shell").waitFor({ state: "visible" });
    await login(page, "Ivy");
    await page.locator("#admin-entry").click();
    await page.locator("#admin-summary .summary-item").first().waitFor();
    const adminTabs = ["pendingInvitations", "activeInvitees", "obWork", "changeRequests", "exceptions", "completed"];
    for (let index = 0; index < adminTabs.length; index += 1) {
      const tab = adminTabs[index];
      await page.locator(`[data-admin-tab="${tab}"]`).click();
      results.push(await capture(page, viewport.name, `admin-${index + 1}-${tab}`));
    }
    await page.locator('[data-admin-tab="payroll"]').click();
    await page.locator(".payroll-toolbar").waitFor();
    results.push(await capture(page, viewport.name, "admin-7-payroll"));

    if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
    await page.close();
  }
} finally {
  await browser.close();
  clearTimeout(hardTimeout);
}

console.log(JSON.stringify({ screenshots: results.length, outputDir, samples: results.map(({ file, pixels }) => ({ file, pixels })) }, null, 2));
