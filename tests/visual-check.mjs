import fs from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
const outputDir = "/private/tmp/substitute-v2-screenshots";
await fs.mkdir(outputDir, { recursive: true });

const fixtures = {
  getTeachers: [
    { "指導者": "Ariel Lu" },
    { "指導者": "Jina" }
  ],
  getCourseList: [
    {
      "日期": "2026/08/10",
      "時間": "18:30",
      "課程": "B－空環 Lv.2",
      "指導者": "Ariel Lu",
      "課程大類": "空環"
    },
    {
      "日期": "2026/08/11",
      "時間": "19:30",
      "課程": "A－原始瑜伽",
      "指導者": "Jina",
      "課程大類": "瑜伽"
    }
  ],
  getPendingLeaves: [
    {
      "代課編號": "sub-001",
      "原老師": "Ariel Lu",
      "日期": "2026/08/10",
      "時段": "18:30",
      "課程": "B－空環 Lv.2",
      "課程大類": "空環"
    }
  ],
  getMySubs: []
};

for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.route("https://script.google.com/**", async (route) => {
    const action = new URL(route.request().url()).searchParams.get("action");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "success", data: fixtures[action] || { count: 1 } })
    });
  });

  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "尋找與領取代課" }).click();
  await page.locator("#claim-teacher-select").selectOption("Jina");
  await page.locator(".change-note-input").waitFor();

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    noteVisible: Boolean(document.querySelector(".change-note-input")),
    buttonVisible: Boolean(document.querySelector("#claim-submit")),
    bodyTextLength: document.body.innerText.length
  }));

  if (layout.scrollWidth > layout.clientWidth) {
    throw new Error(`${viewport.name}: horizontal overflow ${layout.scrollWidth}/${layout.clientWidth}`);
  }
  if (!layout.noteVisible || !layout.buttonVisible || layout.bodyTextLength < 80) {
    throw new Error(`${viewport.name}: required UI is missing`);
  }
  if (errors.length) {
    throw new Error(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
  }

  await page.screenshot({
    path: `${outputDir}/${viewport.name}.png`,
    fullPage: true
  });
  await page.close();
  console.log(JSON.stringify({ viewport, layout }));
}

await browser.close();
console.log(`screenshots: ${outputDir}`);
