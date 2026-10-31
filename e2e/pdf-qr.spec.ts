import { test, expect } from "./auth-fixture.js";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";
import { toBuffer } from "qrcode";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("nexus-language", JSON.stringify({ state: { language: "en" }, version: 0 })),
  );
});

async function download(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("link", { name: /^Download / }).click();
  return readFile((await (await pending).path())!);
}

async function samplePdf(pages: number) {
  const pdf = await PDFDocument.create();
  for (let n = 1; n <= pages; n++) pdf.addPage([200, 300]).drawText(`Page ${n}`, { x: 30, y: 150, size: 24 });
  return Buffer.from(await pdf.save());
}

test("PDF pages become one ZIP of images, or a single image for one page", async ({ page }) => {
  await page.goto("/pdf-to-images");
  const dialog = page.getByRole("dialog");
  await expect(page).toHaveTitle("PDF to Images | Nexus Tools");
  await dialog.getByLabel("Choose files", { exact: true }).setInputFiles({ name: "report.pdf", mimeType: "application/pdf", buffer: await samplePdf(3) });
  await dialog.getByRole("button", { name: "Convert to images" }).click();
  await expect(dialog.getByText("Your file is ready")).toBeVisible();
  const files = unzipSync(new Uint8Array(await download(page)));
  expect(Object.keys(files).sort()).toEqual(["report-page-1.png", "report-page-2.png", "report-page-3.png"]);
  expect([...files["report-page-2.png"].subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  const width = Buffer.from(files["report-page-1.png"]).readUInt32BE(16);
  expect(width).toBe(400);

  await dialog.getByLabel("Pages (empty = all pages)").fill("2");
  await dialog.getByLabel("Output format").selectOption("image/jpeg");
  await dialog.getByRole("button", { name: "Convert to images" }).click();
  await expect(dialog.getByRole("link", { name: "Download report-page-2.jpg" })).toBeVisible();
  expect([...(await download(page)).subarray(0, 3)]).toEqual([255, 216, 255]);

  await dialog.getByLabel("Pages (empty = all pages)").fill("9");
  await dialog.getByRole("button", { name: "Convert to images" }).click();
  await expect(dialog.getByRole("alert")).toContainText("valid pages");
});

test("QR reader finds the text, offers web links only, and explains failures", async ({ page }) => {
  await page.goto("/qr-reader");
  const dialog = page.getByRole("dialog");
  const choose = (name: string, buffer: Buffer) =>
    dialog.getByLabel("Choose files", { exact: true }).setInputFiles({ name, mimeType: "image/png", buffer });

  await choose("link.png", await toBuffer("https://example.com/hello?x=1", { width: 300 }));
  await expect(dialog.getByText("https://example.com/hello?x=1")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Open link" })).toHaveAttribute("href", "https://example.com/hello?x=1");

  await choose("wifi.png", await toBuffer("WIFI:T:WPA;S:Home;P:secret;;", { width: 300 }));
  await expect(dialog.getByText("WIFI:T:WPA;S:Home;P:secret;;")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Open link" })).toHaveCount(0);

  await choose("script.png", await toBuffer("javascript:alert(1)", { width: 300 }));
  await expect(dialog.getByText("javascript:alert(1)")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Open link" })).toHaveCount(0);

  const blank = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 200;
    canvas.getContext("2d")!.fillRect(20, 20, 60, 60);
    return canvas.toDataURL().split(",")[1];
  });
  await choose("blank.png", Buffer.from(blank, "base64"));
  await expect(dialog.getByRole("alert")).toContainText("No QR code found");
});
