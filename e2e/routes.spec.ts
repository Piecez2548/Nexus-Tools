import { expect, test } from "@playwright/test";

const openWordCounter = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  await page.getByRole("link", { name: /^(Open|เปิด) (Word Counter|นับคำและตัวอักษร)$/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
};

test("a tool address opens that tool and survives a reload", async ({ page }) => {
  await page.goto("/word-counter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveTitle("นับคำและตัวอักษร | Nexus Tools");
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("each tool page has its own metadata before JavaScript runs", async ({ request }) => {
  const html = await (await request.get("/word-counter")).text();
  expect(html).toContain("<title>นับคำและตัวอักษร | Nexus Tools</title>");
  expect(html).toContain('<link rel="canonical" href="https://nexus-tools-chi.vercel.app/word-counter" />');
  expect(html).toContain('property="og:title"');
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://nexus-tools-chi.vercel.app/ocr-thai-english</loc>");
  expect((await request.get("/404.html")).ok()).toBe(true);
});

test("pages carry share previews, structured data and an install manifest", async ({ request }) => {
  const html = await (await request.get("/word-counter")).text();
  expect(html).toContain('property="og:image" content="https://nexus-tools-chi.vercel.app/og-image.png"');
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');
  const data = JSON.parse(/<script type="application\/ld\+json">([^<]*)<\/script>/.exec(html)![1]);
  expect(data).toMatchObject({ "@type": "WebApplication", url: "https://nexus-tools-chi.vercel.app/word-counter", offers: { price: "0" } });
  const home = await (await request.get("/")).text();
  expect(home).toContain('"@type":"WebSite"');
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual(["/icon-192.png", "/icon-512.png", "/icon-512.png"]);
  for (const path of ["/og-image.png", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toBe("image/png");
  }
});

test("the OCR tool address does not collide with its asset folder", async ({ page }) => {
  await page.goto("/ocr-thai-english");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("mobile file tool: Back closes the tool and stays on the site", async ({ page }) => {
  await openWordCounter(page);
  await expect(page).toHaveURL(/\/word-counter$/);
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".hero h1")).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("Back asks before discarding work and can stay", async ({ page }) => {
  await openWordCounter(page);
  const input = page.getByRole("dialog").getByRole("textbox").first();
  await input.fill("งานที่ยังไม่บันทึก");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.goBack();
  await expect(page).toHaveURL(/\/word-counter$/);
  await expect(input).toHaveValue("งานที่ยังไม่บันทึก");
  page.once("dialog", (dialog) => dialog.accept());
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("a tool card is a real link that can open in a new tab", async ({ page, context }) => {
  await page.goto("/");
  const card = page.getByRole("link", { name: /^(Open|เปิด) (Word Counter|นับคำและตัวอักษร)$/ });
  await expect(card).toHaveAttribute("href", "/word-counter");
  const [opened] = await Promise.all([context.waitForEvent("page"), card.click({ modifiers: ["ControlOrMeta"] })]);
  await expect(opened).toHaveURL(/\/word-counter$/);
  await expect(opened.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toBeHidden();
  await opened.close();
});

test("Back does not ask once the work is downloaded", async ({ page }) => {
  await openWordCounter(page);
  await page.getByRole("dialog").getByRole("textbox").first().fill("ข้อความ");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Download text|ดาวน์โหลดข้อความ/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("nexus-text.txt");
  page.on("dialog", () => { throw new Error("Back should not ask after a download"); });
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("Back does not ask for the unit converter", async ({ page }) => {
  page.on("dialog", () => { throw new Error("Back should not ask without work to lose"); });
  await page.goto("/");
  await page.getByRole("link", { name: /^(Open|เปิด) (Unit Converter|แปลงหน่วย)$/ }).click();
  await page.getByRole("dialog").getByRole("spinbutton").first().fill("12");
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the close button returns to the home address", async ({ page }) => {
  await openWordCounter(page);
  await page.getByRole("dialog").getByRole("button", { name: /Close tool|ปิดเครื่องมือ/ }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle("Nexus Tools — Your everyday toolkit");
});

test("closing with the X button or Esc asks before discarding work", async ({ page }) => {
  await openWordCounter(page);
  const dialog = page.getByRole("dialog");
  const input = dialog.getByRole("textbox").first();
  await input.fill("งานที่ยังไม่บันทึก");
  page.once("dialog", (prompt) => prompt.dismiss());
  await dialog.getByRole("button", { name: /Close tool|ปิดเครื่องมือ/ }).click();
  await expect(dialog).toBeVisible();
  await expect(input).toHaveValue("งานที่ยังไม่บันทึก");
  page.once("dialog", (prompt) => prompt.dismiss());
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  page.once("dialog", (prompt) => prompt.accept());
  await dialog.getByRole("button", { name: /Close tool|ปิดเครื่องมือ/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test("a field that was typed in and cleared again leaves no unsaved work", async ({ page }) => {
  await openWordCounter(page);
  const dialog = page.getByRole("dialog");
  const input = dialog.getByRole("textbox").first();
  await input.fill("ลองพิมพ์");
  await input.fill("");
  page.on("dialog", () => {
    throw new Error("Nothing is left to lose, so closing should not ask");
  });
  await dialog.getByRole("button", { name: /Close tool|ปิดเครื่องมือ/ }).click();
  await expect(dialog).toBeHidden();
});
