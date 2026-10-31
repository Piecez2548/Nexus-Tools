import { expect, test } from "@playwright/test";

const openWordCounter = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^(Open|เปิด) (Word Counter|นับคำและตัวอักษร)$/ }).click();
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

test("the close button returns to the home address", async ({ page }) => {
  await openWordCounter(page);
  await page.getByRole("dialog").getByRole("button", { name: /Close tool|ปิดเครื่องมือ/ }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle("Nexus Tools — Your everyday toolkit");
});
