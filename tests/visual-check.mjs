import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const dependencyRoot = process.env.CODEX_NODE_MODULES || "";
const loadDependency = (name) => require(dependencyRoot ? path.join(dependencyRoot, name) : name);
const pngjs = loadDependency("pngjs");
const playwright = loadDependency("playwright");

const { chromium } = playwright;

const { PNG } = pngjs;
const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(testDir, "..");
const outputDir = "/private/tmp/substitute-v2-screenshots";
const html = await fs.readFile(path.join(repoDir, "index.html"), "utf8");
const lucideScript = Buffer.from("window.lucide={createIcons(){}};");
const visualHtml = html.replace(
  '<script src="assets/xlsx.full.min.js"></script>',
  '<script>window.XLSX = { utils: {} };</script>',
);

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
  time: "18:30",
  actualStartTime: "19:00",
  startDelayMinutes: 30,
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
const leaveOccupied = {
  substituteId: "sub-ob-next",
  originalTeacher: "Jina",
  substituteTeacher: "",
  date: "2026/08/14",
  time: "20:00",
  originalCourse: "空環 Lv.2",
  actualCourse: "空環 Lv.2",
  difficulty: "",
  status: "延後占用",
  changeStatus: "延後占用／待管理員關閉 OB",
  verificationStatus: "待關閉 OB",
  differenceReason: "",
  delaySourceSubstituteId: "sub-ob",
  delaySourceTeacher: "Mina",
  note: "",
  auditHistory: []
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
  getNotificationInbox: {
    teacherName: "Ariel Lu",
    unreadCount: 2,
    items: [
      {
        messageId: "notice-1", type: "代課邀請", heading: "新的代課邀請",
        content: "9/12（六）有新的代課課程開放給你，請進入領取代課查看。",
        url: "?view=claim", createdAt: "2026-09-03 10:05:00", unread: true
      },
      {
        messageId: "notice-2", type: "自主練習", heading: "自主練習時段已變更",
        content: "因正式課程恢復，原訂 A 教室 14:00–15:00 的自主練習已取消。",
        url: "?view=practice", createdAt: "2026-09-02 18:30:00", unread: true
      },
      {
        messageId: "notice-3", type: "代課紀錄", heading: "代課領取成功",
        content: "你已成功領取 9/18（五）18:30 的空環課程。",
        url: "?view=mysubs", createdAt: "2026-09-01 21:10:00", unread: false
      }
    ]
  },
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
    { "代課編號": "sub-delay", "原老師": "Jina", "日期": "2026/08/11", "時段": "18:30", "課程": "A－空環 Lv.1", "課程大類": "空環", "可沿用原課程": true },
    { "代課編號": "sub-delay-next", "原老師": "Mina", "日期": "2026/08/11", "時段": "20:00", "課程": "A－空環 Lv.2", "課程大類": "空環", "可沿用原課程": true }
  ],
  getClaimOptions: {
    capabilities: ["空環", "空瑜"],
    classes: [
      { classId: "class-ring-1", courseName: "空環 Lv.1", category: "空環" },
      { classId: "class-yoga-1", courseName: "空中瑜伽", category: "空瑜" }
    ],
    specialAvailability: {
      "sub-delay": {
        room: "A", date: "2026/08/11", startTime: "18:30", nextCourseTime: "20:00",
        mergePartnerIds: ["sub-delay-next"], maxDurationMinutes: 75
      }
    }
  },
  getMySubs: [
    {
      "代課編號": "sub-history", "日期": "2026/08/08", "時段": "19:30", "課程": "舞綢 Lv.1",
      "實際開始時間": "20:00", "延後分鐘數": 30,
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
  getPracticeDay: {
    date: "2026/09/02",
    teacherName: "Ariel Lu",
    quickDurations: [60, 90, 120],
    rooms: [
      { room: "A", blocks: [
        { id: "course-1", calendarId: "cal-practice-1", type: "course", startTime: "10:00", endTime: "11:00", label: "A－空環 Lv.2", teacherName: "Jina" },
        { id: "practice-1", bookingId: "practice-1", seriesId: "series-1", type: "practice", startTime: "14:00", endTime: "16:00", creatorName: "Ariel Lu", isMine: true, isCreator: true, participants: [
          { teacherName: "Ariel Lu", role: "建立者", startTime: "14:00", endTime: "16:00" },
          { teacherName: "Tako", role: "參與者", startTime: "14:30", endTime: "15:30" }
        ] }
      ] },
      { room: "B", blocks: [{ id: "rental-1", type: "rental", startTime: "18:00", endTime: "20:00", label: "場地租借" }] },
      { room: "C", blocks: [] },
      { room: "D", blocks: [] }
    ]
  },
  getPracticeAdminDashboard: {
    filters: {},
    summary: { total: 2, active: 1, waitlisted: 1, cancelled: 0 },
    bookings: [
      {
        bookingId: "practice-1", seriesId: "series-1", date: "2026/09/02", room: "A", startTime: "14:00", endTime: "16:00", status: "已成立", creatorName: "Ariel Lu", reason: "",
        participants: [
          { teacherName: "Ariel Lu", role: "建立者", startTime: "14:00", endTime: "16:00", status: "有效", joinScope: "future" },
          { teacherName: "Tako", role: "參與者", startTime: "14:30", endTime: "15:30", status: "有效", joinScope: "once" }
        ],
        audits: [{ time: "2026/09/01 12:00", actor: "Ariel Lu", action: "建立自主練習", reason: "" }]
      },
      {
        bookingId: "practice-2", seriesId: "", date: "2026/09/03", room: "C", startTime: "19:00", endTime: "20:00", status: "候補", creatorName: "Jina", waitlistCalendarId: "cal-candidate-1", reason: "課程取消後補入",
        participants: [{ teacherName: "Jina", role: "建立者", startTime: "19:00", endTime: "20:00", status: "有效", joinScope: "once" }],
        audits: []
      }
    ],
    notificationFailures: [{ time: "2026/09/01 12:01", targetId: "practice-1", reason: "測試推播失敗待辦" }]
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
    teachers: [
      "卡拉 卡拉", "芊芊♡", "Tako", "@N.a🧘🏻♀️", "蜜莉 戴",
      "Liz 🌰", "Jina", "Ariel Lu", "珍珍", "小mo(子涵）",
      "Vicky Lee", "萱", "Vivi", "小琪", "Chloe Lee",
      "芮錤 77", "巧", "Carrie🐟", "嗨底 Heidi", "壹壹",
      "wen", "Chin", "Melody Wang", "Lily Yellow", "姝姝",
      "妙妙 簡", "寧寧", "Sherry❤雪莉", "Josty Lin", "XUAN",
      "番茄🍅", "Sue",
      "冠蓉", "狗狗 陳", "Lydia 慕恩", "尚昀 陳", "Angela Chuang"
    ],
    pendingInvitations: [leavePending],
    missingObCancellations: [{
      ...leavePending,
      substituteId: "sub-ob-cancelled",
      date: "2026/09/18",
      time: "19:30",
      originalCourse: "A－空環 Lv.1~2",
      originalTeacher: "小mo(子涵）",
      originalCalendarId: "cal-ob-cancelled"
    }],
    activeInvitees: ["卡拉 卡拉", "芊芊♡", "Tako", "@N.a🧘🏻♀️", "蜜莉 戴", "Liz 🌰", "Angela Chuang"]
      .map((teacherName, index) => ({
        invitationId: `invite-${index + 1}`,
        teacherName,
        openedAt: "2026-08-05 09:00",
        viewedAt: index % 2 ? "" : "2026-08-05 09:12"
      })),
    obWork: [leaveOb, leaveOccupied],
    changeRequests: [leaveChange],
    exceptions: [leaveException],
    completed: [leaveComplete],
    replacementOptions: [{ calendarId: "cal-new", courseName: "空環基礎", teacherName: "Mina", date: "2026/08/14", time: "19:30" }],
    courseClosure: {
      targetDate: "2026/09/01",
      triggerCount: 2,
      automatic: true,
      manualStageAvailability: { "22:30": true, "23:40": false },
      unclaimedCandidates: [],
      recentLogs: [],
      socialCopy: {
        content: "明12:00劍潭蕃茄柔軟度開發\n13:30晴光Lily舞綢\n各缺一，等到23:40",
        updatedAt: "2026-08-31 22:30:00"
      }
    }
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
  if (action === "getPushConfiguration") {
    return { configured: true, appId: "visual-test-app", externalId: "visual-test-user" };
  }
  if (action === "getClaimPageData") {
    return {
      items: fixtures.getAvailableSubstitutes,
      options: fixtures.getClaimOptions,
    };
  }
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
      .map((element) => ({
        name: element.id || element.className || element.textContent.trim().slice(0, 30),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        children: [...element.children].map((child) => ({
          className: child.className?.baseVal || child.className || child.tagName,
          left: Math.round(child.getBoundingClientRect().left - element.getBoundingClientRect().left),
          right: Math.round(child.getBoundingClientRect().right - element.getBoundingClientRect().left),
          width: Math.round(child.getBoundingClientRect().width),
        })),
      }));
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
  if (layout.overflow.length) throw new Error(`${viewportName}/${name}: clipped controls ${JSON.stringify(layout.overflow)}`);
  if (!layout.mobileNavProtected) throw new Error(`${viewportName}/${name}: mobile navigation overlaps content`);
  if (layout.bodyTextLength < 35) throw new Error(`${viewportName}/${name}: required UI is missing`);

  const screenshot = await page.screenshot({ fullPage: true });
  const file = path.join(outputDir, `${viewportName}-${name}.png`);
  await fs.writeFile(file, screenshot);
  return { file, layout, pixels: inspectPixels(screenshot, `${viewportName}/${name}`) };
}

async function login(page, teacherName) {
  await page.locator("#login-teacher").selectOption(teacherName);
  await page.locator("#login-pin").fill("1234");
  await page.locator("#login-submit").click();
  await page.locator("#app-shell").waitFor({ state: "visible" });
}

async function openView(page, viewId) {
  let target = page.locator(`[data-view="${viewId}"]:visible`);
  if (await target.count()) {
    await target.first().click();
    return;
  }
  if (viewId === "view-mysubs") {
    await page.locator('.mobile-tab-item[data-view="view-myleaves"]:visible').click();
    await page.locator('.mobile-record-button[data-view="view-mysubs"]:visible').click();
    return;
  }
  const primary = page.locator("#mobile-primary-entry:visible");
  if (await primary.count()) {
    await primary.click();
    target = page.locator(`[data-view="${viewId}"]:visible`);
    if (await target.count()) {
      await target.first().click();
      return;
    }
  }
  throw new Error(`No visible navigation control for ${viewId}`);
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
    { name: "tablet", width: 820, height: 980 },
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
    await page.route("https://cdn.onesignal.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          const visualPushSubscription = {
            optedIn: false,
            optIn: async () => { visualPushSubscription.optedIn = true; },
            optOut: async () => { visualPushSubscription.optedIn = false; }
          };
          const visualOneSignal = {
            init: async () => {},
            login: async () => {},
            logout: async () => {},
            Notifications: { permission: false, isPushSupported: () => true, requestPermission: async () => {} },
            User: { PushSubscription: visualPushSubscription }
          };
          window.OneSignalDeferred.splice(0).forEach((callback) => callback(visualOneSignal));
          window.OneSignalDeferred.push = (callback) => Promise.resolve(callback(visualOneSignal));
        `
      });
    });
    await page.route("https://script.google.com/**", async (route) => {
      const request = route.request();
      const payload = { status: "success", data: apiPayload(request) };
      if (request.method() !== "POST") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
        return;
      }
      const requestId = new URLSearchParams(request.postData() || "").get("requestId");
      const relayMessage = JSON.stringify({ source: "sherry-gas-relay", requestId, payload }).replaceAll("<", "\\u003c");
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: `<!doctype html><meta charset="utf-8"><script>parent.postMessage(${relayMessage}, "*");<\/script>`
      });
    });

    await page.setContent(visualHtml, { waitUntil: "domcontentloaded", timeout: 10000 });
    await page.waitForTimeout(120);
    if (errors.length) throw new Error(`${viewport.name}: browser startup errors: ${errors.join(" | ")}`);
    if (adminHeaderOnly) {
      await login(page, "Ivy");
      await openView(page, "view-admin");
      await page.locator("#admin-reminders .summary-item").first().waitFor();
      await page.locator("#admin-sync").click();
      await page.locator("#admin-sync-status").getByText("已同步 1 筆").waitFor();
      const adminHeaderLayout = await page.evaluate(() => {
        const commandBar = document.querySelector(".admin-command-bar");
        const commandActions = document.querySelector(".admin-command-actions");
        const tabs = document.querySelector(".admin-tabs");
        const teacherRoundGrid = document.querySelector(".teacher-round-grid");
        const summary = document.querySelector("#admin-summary");
        const headerText = document.querySelector("#view-admin")?.innerText || "";
        return {
          hasCommandBar: Boolean(commandBar),
          commandColumns: commandActions ? getComputedStyle(commandActions).gridTemplateColumns.split(" ").filter(Boolean).length : 0,
          duplicateCancellationLabels: (headerText.match(/OB 已取消待關閉/g) || []).length,
          summaryVisible: Boolean(summary && getComputedStyle(summary).display !== "none" && summary.getBoundingClientRect().height > 0),
          tabsOverflow: tabs ? tabs.scrollWidth > tabs.clientWidth + 1 : true,
          teacherRoundColumns: teacherRoundGrid ? getComputedStyle(teacherRoundGrid).gridTemplateColumns.split(" ").filter(Boolean).length : 0,
        };
      });
      if (!adminHeaderLayout.hasCommandBar) throw new Error(`${viewport.name}: management command bar missing`);
      if (adminHeaderLayout.duplicateCancellationLabels !== 1) throw new Error(`${viewport.name}: duplicated cancellation reminder`);
      if (adminHeaderLayout.summaryVisible) throw new Error(`${viewport.name}: duplicate summary grid is still visible`);
      if (viewport.width > 760 && adminHeaderLayout.tabsOverflow) throw new Error(`${viewport.name}: management tabs overflow instead of using two rows`);
      if (viewport.width > 920 && adminHeaderLayout.teacherRoundColumns !== 5) throw new Error(`${viewport.name}: teacher rounds are not five columns`);
      if (viewport.width > 760 && viewport.width <= 920 && adminHeaderLayout.teacherRoundColumns !== 3) throw new Error(`${viewport.name}: teacher rounds are not three columns`);
      if (viewport.width <= 760 && adminHeaderLayout.teacherRoundColumns !== 2) throw new Error(`${viewport.name}: teacher rounds are not two columns`);
      if (viewport.width <= 760 && adminHeaderLayout.commandColumns !== 2) throw new Error(`${viewport.name}: management tools are not a two-column grid`);
      results.push(await capture(page, viewport.name, "admin-header"));
      if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
      await page.close();
      continue;
    }
    if (payrollOnly) {
      await login(page, "Ivy");
      await openView(page, "view-admin");
      await page.locator('[data-admin-tab="payroll"]').click();
      await page.locator(".payroll-toolbar").waitFor();
      results.push(await capture(page, viewport.name, "admin-7-payroll"));
      if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
      await page.close();
      continue;
    }
    results.push(await capture(page, viewport.name, "01-login"));
    await login(page, "Ariel Lu");

    await openView(page, "view-leave");
    await page.locator(".leave-date-checkbox").first().waitFor();
    await page.locator("#select-all-visible-dates").click();
    await page.locator(".leave-course-checkbox").nth(0).check();
    await page.locator(".leave-course-checkbox").nth(1).check();
    await page.locator("#leave-confirmation-count").getByText("已選 2 堂").waitFor();
    results.push(await capture(page, viewport.name, "02-leave-confirmation"));

    await openView(page, "view-myleaves");
    await page.locator("#my-leaves-list .list-item").first().waitFor();
    results.push(await capture(page, viewport.name, "03-leave-history"));

    await openView(page, "view-claim");
    await page.locator('[data-claim-date-toggle="2026/08/11"]').click();
    const delayedCard = page.locator('[data-claim-card-id="leave:sub-delay"]');
    await delayedCard.waitFor();
    await delayedCard.locator(".claim-checkbox").check();
    await delayedCard.locator(".handling-option", { hasText: "調整課程或時間" }).click();
    await delayedCard.locator(".claim-course-type").selectOption("__ORIGINAL__");
    await delayedCard.locator(".claim-start-delay").selectOption("30");
    await delayedCard.locator(".claim-delay-summary").filter({ hasText: "下一堂 20:00 需由管理員關閉 OB" }).waitFor();
    results.push(await capture(page, viewport.name, "04-ordinary-delay-claim"));
    await page.evaluate(() => {
      claimPageState = "ended";
      pendingLeaves = [];
      claimOptions = { capabilities: [], classes: [], specialSlots: [] };
      renderAvailableSubstitutes();
    });
    await page.locator("#pending-leaves-list").getByText("本輪代課領取已結束").waitFor();
    results.push(await capture(page, viewport.name, "04b-invitation-round-ended"));

    await openView(page, "view-mysubs");
    await page.locator("#my-subs-list .list-item").first().waitFor();
    results.push(await capture(page, viewport.name, "05-substitute-history"));

    await openView(page, "view-payroll");
    await page.locator(".payroll-hero").waitFor();
    results.push(await capture(page, viewport.name, "06-payroll"));

    await openView(page, "view-inbox");
    await page.locator(".inbox-message").first().waitFor();
    results.push(await capture(page, viewport.name, "06b-inbox"));

    await openView(page, "view-practice");
    await page.locator(".practice-timeline-grid").waitFor();
    results.push(await capture(page, viewport.name, "07-practice-day"));
    await page.locator('[data-practice-start="12:00"]').click();
    await page.locator("#practice-dialog").waitFor({ state: "visible" });
    results.push(await capture(page, viewport.name, "08-practice-create"));
    await page.locator("#practice-dialog-cancel").click();
    await page.locator('[data-practice-block="practice-1"]').click();
    await page.locator("#practice-dialog").waitFor({ state: "visible" });
    results.push(await capture(page, viewport.name, "09-practice-edit"));
    await page.locator("#practice-editor-start").fill("10:00");
    await page.locator("#practice-editor-end").fill("11:00");
    await page.locator("#practice-editor-end").dispatchEvent("change");
    await page.locator("#practice-editor-warning").filter({ hasText: "轉為候補" }).waitFor();
    const candidateDialogBounds = await page.locator("#practice-dialog").boundingBox();
    const candidateSubmitBounds = await page.locator("#practice-submit").boundingBox();
    if (!candidateDialogBounds || !candidateSubmitBounds ||
        candidateSubmitBounds.y + candidateSubmitBounds.height > candidateDialogBounds.y + candidateDialogBounds.height + 1) {
      throw new Error(`${viewport.name}: practice save action is clipped after the waitlist conversion message`);
    }
    results.push(await capture(page, viewport.name, "09b-practice-edit-to-waitlist"));
    await page.locator("#practice-dialog-cancel").click();

    await page.locator("#logout-button").click();
    await page.locator("#auth-shell").waitFor({ state: "visible" });
    await login(page, "Ivy");
    await openView(page, "view-admin");
    await page.locator("#admin-reminders .summary-item").first().waitFor();
    const adminTabs = ["pendingInvitations", "missingObCancellations", "activeInvitees", "obWork", "closureManagement", "changeRequests", "exceptions", "completed"];
    for (let index = 0; index < adminTabs.length; index += 1) {
      const tab = adminTabs[index];
      await page.locator(`[data-admin-tab="${tab}"]`).click();
      results.push(await capture(page, viewport.name, `admin-${index + 1}-${tab}`));
    }
    await page.locator('[data-admin-tab="payroll"]').click();
    await page.locator(".payroll-toolbar").waitFor();
    results.push(await capture(page, viewport.name, "admin-7-payroll"));
    await page.locator('[data-admin-tab="practice"]').click();
    await page.locator(".practice-admin-card").first().waitFor();
    results.push(await capture(page, viewport.name, "admin-8-practice"));

    if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
    await page.close();
  }
} finally {
  await browser.close();
  clearTimeout(hardTimeout);
}

console.log(JSON.stringify({ screenshots: results.length, outputDir, samples: results.map(({ file, pixels }) => ({ file, pixels })) }, null, 2));
