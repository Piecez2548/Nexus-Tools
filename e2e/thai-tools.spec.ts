import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nexus-language", JSON.stringify({ state: { language: "en" }, version: 0 })));
});

test("baht text reads amounts and explains bad input", async ({ page }) => {
  await page.goto("/baht-text");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page).toHaveTitle("Baht Text | Nexus Tools");
  const amount = dialog.getByLabel("Amount in baht");
  await amount.fill("1,234,567.89");
  await expect(dialog.getByText("หนึ่งล้านสองแสนสามหมื่นสี่พันห้าร้อยหกสิบเจ็ดบาทแปดสิบเก้าสตางค์")).toBeVisible();
  await amount.fill("121.5");
  await expect(dialog.getByText("หนึ่งร้อยยี่สิบเอ็ดบาทห้าสิบสตางค์")).toBeVisible();
  await amount.fill("1.234");
  await expect(dialog.getByRole("alert")).toContainText("at most two decimals");
  await expect(dialog.getByRole("button", { name: "Copy text" })).toBeDisabled();
});

test("year converter and date writer use both eras", async ({ page }) => {
  await page.goto("/buddhist-year");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Year").fill("2569");
  await expect(dialog.getByText("Christian era (C.E.)")).toBeVisible();
  await expect(dialog.getByText("2026", { exact: true })).toBeVisible();
  await dialog.getByLabel("Convert").selectOption("ce-to-be");
  await dialog.getByLabel("Year").fill("2000");
  await expect(dialog.getByText("2543", { exact: true })).toBeVisible();
  await dialog.getByLabel("Date").fill("2026-10-31");
  await expect(dialog.getByText("วันเสาร์ที่ 31 ตุลาคม พ.ศ. 2569")).toBeVisible();
  await expect(dialog.getByText("Saturday, 31 October 2026")).toBeVisible();
  await expect(dialog.getByText("31/10/2569")).toBeVisible();
  await dialog.getByLabel("Year").fill("0");
  await expect(dialog.getByRole("alert")).toContainText("whole year");
});

test("withholding tax works from the amount before VAT", async ({ page }) => {
  await page.goto("/withholding-tax");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount (baht)").fill("10000");
  await expect(dialog.getByText("300.00", { exact: true })).toBeVisible();
  await expect(dialog.getByText("9,700.00", { exact: true })).toBeVisible();
  await expect(dialog.getByText("VAT 7%", { exact: true })).toHaveCount(0);
  await dialog.getByRole("combobox", { name: /^VAT/ }).selectOption("separate");
  await expect(dialog.getByText("700.00", { exact: true })).toBeVisible();
  await expect(dialog.getByText("10,400.00", { exact: true })).toBeVisible();
  await dialog.getByRole("combobox", { name: /^VAT/ }).selectOption("included");
  await dialog.getByLabel("Amount (baht)").fill("10700");
  await expect(dialog.getByText("10,000.00", { exact: true })).toBeVisible();
  await expect(dialog.getByText("10,400.00", { exact: true })).toBeVisible();
  await dialog.getByLabel("Type of payment").selectOption("custom");
  await dialog.getByLabel("Rate (%)").fill("1.5");
  await expect(dialog.getByText("150.00", { exact: true })).toBeVisible();
  await dialog.getByLabel("Rate (%)").fill("101");
  await expect(dialog.getByRole("alert")).toContainText("rate from 0 to 100");
});

test("the new tools are in the catalogue and leave without a warning", async ({ page }) => {
  page.on("dialog", () => {
    throw new Error("Back should not ask when leaving a short calculation");
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Open Withholding Tax", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Amount (baht)").fill("5000");
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("searchbox").or(page.getByLabel("Search tools")).first().fill("baht");
  await expect(page.getByRole("link", { name: "Open Baht Text", exact: true })).toBeVisible();
});

test("VAT calculator adds and extracts 7%", async ({ page }) => {
  await page.goto("/vat-calculator");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount (baht)").fill("1,000");
  await expect(dialog.getByText("1,070.00")).toBeVisible();
  await expect(dialog.getByText("70.00", { exact: true })).toBeVisible();
  await dialog.getByLabel("Calculate").selectOption("extract");
  await expect(dialog.getByText("934.58")).toBeVisible();
  await expect(dialog.getByText("65.42")).toBeVisible();
  await dialog.getByLabel("Amount (baht)").fill("-5");
  await expect(dialog.getByRole("alert")).toContainText("above 0");
});

test("national ID check reports the check digit without leaving a warning", async ({ page }) => {
  page.on("dialog", () => {
    throw new Error("Back should not ask when leaving an ID check");
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Open Thai ID Number Check", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const field = dialog.getByLabel("National ID number (13 digits)");
  await field.fill("1-1017-00230-67-8");
  await expect(dialog.getByText("The check digit is correct")).toBeVisible();
  await field.fill("1101700230673");
  await expect(dialog.getByText("The check digit is wrong; it should be 8")).toBeVisible();
  await field.fill("123");
  await expect(dialog.getByRole("alert")).toContainText("13 digits");
  await page.goBack();
  await expect(dialog).toBeHidden();
});

test("PromptPay QR is a real PromptPay code that the QR reader can read back", async ({ page }) => {
  await page.goto("/promptpay-qr");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("PromptPay mobile number").fill("081-234-5678");
  await dialog.getByLabel("Amount (baht)").fill("250.5");
  await dialog.getByRole("button", { name: "Create PromptPay QR" }).click();
  await expect(dialog.getByText("Your file is ready")).toBeVisible();
  const pending = page.waitForEvent("download");
  await dialog.getByRole("link", { name: "Download nexus-promptpay.png" }).click();
  const png = await readFile((await (await pending).path())!);
  await dialog.getByRole("button", { name: "Close tool" }).click();
  await page.goto("/qr-reader");
  await page.getByRole("dialog").getByLabel("Choose files", { exact: true }).setInputFiles({ name: "pay.png", mimeType: "image/png", buffer: png });
  const text = await page.getByRole("dialog").locator("p[lang=und]").innerText();
  expect(text.slice(0, -4)).toBe("00020101021229370016A00000067701011101130066812345678" + "5802TH5303764" + "5406250.50" + "6304");
  expect(text).toMatch(/6304[0-9A-F]{4}$/);
  await page.goto("/promptpay-qr");
  await page.getByRole("dialog").getByLabel("PromptPay mobile number").fill("12345");
  await page.getByRole("dialog").getByLabel("Amount (baht)").fill("10");
  await page.getByRole("dialog").getByRole("button", { name: "Create PromptPay QR" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("PromptPay number");
});
