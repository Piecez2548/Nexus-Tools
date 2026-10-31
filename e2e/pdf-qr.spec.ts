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

test("PDF compressor rebuilds an image-heavy PDF smaller, with the same pages and sizes", async ({ page }) => {
  // A noisy picture compresses badly as PNG but well as JPEG, like a scan.
  const noise = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 900;
    const context = canvas.getContext("2d")!;
    const data = context.createImageData(700, 900);
    for (let i = 0; i < data.data.length; i += 4) {
      const value = (Math.random() * 255) | 0;
      data.data.set([value, 255 - value, (value * 7) % 255, 255], i);
    }
    context.putImageData(data, 0, 0);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(Buffer.from(noise, "base64"));
  for (const size of [[350, 450], [450, 350]] as const) pdf.addPage([...size]).drawImage(image, { x: 0, y: 0, width: size[0], height: size[1] });
  const original = Buffer.from(await pdf.save());

  await page.goto("/pdf-compress");
  const dialog = page.getByRole("dialog");
  await expect(page).toHaveTitle("PDF Compressor | Nexus Tools");
  await expect(dialog.getByRole("button", { name: "Compress PDF" })).toBeDisabled();
  await dialog.getByLabel("Choose files", { exact: true }).setInputFiles({ name: "scan.pdf", mimeType: "application/pdf", buffer: original });
  await dialog.getByLabel("Quality").selectOption("smaller");
  await dialog.getByRole("button", { name: "Compress PDF" }).click();
  await expect(dialog.getByText("Your file is ready")).toBeVisible();
  await expect(dialog.getByText("2 pages in the exported PDF")).toBeVisible();
  const bytes = await download(page);
  expect(bytes.byteLength).toBeLessThan(original.byteLength);
  const result = await PDFDocument.load(bytes);
  expect(result.getPages().map((p) => [Math.round(p.getWidth()), Math.round(p.getHeight())])).toEqual([[350, 450], [450, 350]]);
});

// A real photo is needed for the decoder test. It is not stored in the repository:
// set NEXUS_HEIC_SAMPLE to the path of any .heic file to run it.
test("HEIC photos convert to a real JPEG", async ({ page }) => {
  test.skip(!process.env.NEXUS_HEIC_SAMPLE, "set NEXUS_HEIC_SAMPLE to a .heic file to run this test");
  const photo = await readFile(process.env.NEXUS_HEIC_SAMPLE!);
  await page.goto("/heic-to-jpg");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Choose files", { exact: true }).setInputFiles({ name: "IMG_0001.HEIC", mimeType: "", buffer: photo });
  await dialog.getByRole("button", { name: "Convert to JPG" }).click();
  await expect(dialog.getByRole("link", { name: "Download IMG_0001.jpg" })).toBeVisible({ timeout: 60_000 });
  const jpeg = await download(page);
  expect([...jpeg.subarray(0, 3)]).toEqual([255, 216, 255]);
  const size = await page.evaluate(async (bytes) => {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }));
    return [bitmap.width, bitmap.height];
  }, [...jpeg]);
  expect(size[0]).toBeGreaterThan(100);
  expect(size[1]).toBeGreaterThan(100);
});

test("HEIC converter explains a file that is not a HEIC photo", async ({ page }) => {
  await page.goto("/heic-to-jpg");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Convert to JPG" })).toBeDisabled();
  await dialog.getByLabel("Choose files", { exact: true }).setInputFiles({ name: "photo.heic", mimeType: "image/heic", buffer: Buffer.from("this is not a photo at all, just text") });
  await dialog.getByRole("button", { name: "Convert to JPG" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Cannot read this file as a HEIC");
});
