import { test, expect, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "nexus-language",
      JSON.stringify({ state: { language: "en" }, version: 0 }),
    ),
  );
  await page.goto("/");
});
async function open(page: Page, name: string) {
  await page.getByRole("button", { name: `Open ${name}`, exact: true }).click();
}
async function download(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("link", { name: /^Download / }).click();
  return readFile((await (await pending).path())!);
}
async function png(page: Page, text = false) {
  const url = await page.evaluate((text) => {
    const c = document.createElement("canvas");
    c.width = text ? 1000 : 200;
    c.height = text ? 180 : 100;
    const x = c.getContext("2d")!;
    x.fillStyle = "#fff";
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#000";
    if (text) {
      x.font = "bold 64px Arial";
      x.fillText("NEXUS TOOLS 12345", 30, 110);
    } else {
      x.fillRect(70, 30, 60, 40);
    }
    return c.toDataURL();
  }, text);
  return Buffer.from(url.split(",")[1], "base64");
}
test("image crop, batch ZIP, settings and transparent background", async ({
  page,
}) => {
  const image = await png(page);
  await open(page, "Image Crop & Watermark");
  await page
    .getByLabel("Choose files", { exact: true })
    .setInputFiles({
      name: "sample.png",
      mimeType: "image/png",
      buffer: image,
    });
  await page.getByLabel("Crop width (%)", { exact: true }).fill("50");
  await page.getByLabel("Maximum width (px)", { exact: true }).fill("50");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Generate file", exact: true })
    .click();
  const cropped = await download(page);
  expect(cropped.readUInt32BE(16)).toBe(50);
  expect(cropped.readUInt32BE(20)).toBe(50);
  await page.getByRole("button", { name: "Close tool" }).click();
  await open(page, "Image Crop & Watermark");
  await page.getByRole("button", { name: "Restore 1", exact: true }).click();
  await expect(page.getByLabel("Crop width (%)", { exact: true })).toHaveValue(
    "50",
  );
  await page.getByRole("button", { name: "Close tool" }).click();
  await open(page, "Batch Images & ZIP");
  await page.getByLabel("Choose files", { exact: true }).setInputFiles([
    { name: "same.png", mimeType: "image/png", buffer: image },
    { name: "same.png", mimeType: "image/png", buffer: image },
  ]);
  await page
    .getByRole("button", { name: "Generate file", exact: true })
    .click();
  const zip = unzipSync(await download(page));
  expect(Object.keys(zip)).toHaveLength(2);
  for (const bytes of Object.values(zip))
    expect(Buffer.from(bytes).readUInt32BE(16)).toBe(200);
  await page.getByRole("button", { name: "Close tool" }).click();
  await open(page, "Solid Background Remover");
  await page
    .getByLabel("Choose files", { exact: true })
    .setInputFiles({
      name: "sample.png",
      mimeType: "image/png",
      buffer: image,
    });
  await page
    .getByRole("button", { name: "Generate file", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Generated image preview" }),
  ).toBeVisible();
  const alpha = await page
    .getByRole("img", { name: "Generated image preview" })
    .evaluate(async (node) => {
      const img = node as HTMLImageElement;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const x = c.getContext("2d")!;
      x.drawImage(img, 0, 0);
      return [
        x.getImageData(0, 0, 1, 1).data[3],
        x.getImageData(100, 50, 1, 1).data[3],
      ];
    });
  expect(alpha).toEqual([0, 255]);
});
test("images to PDF and PDF page rotation, deletion and order", async ({
  page,
}) => {
  const image = await png(page);
  await open(page, "Images to PDF");
  await page.getByLabel("Choose files", { exact: true }).setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: image },
    { name: "b.png", mimeType: "image/png", buffer: image },
  ]);
  await page
    .getByRole("button", { name: "Generate file", exact: true })
    .click();
  expect((await PDFDocument.load(await download(page))).getPageCount()).toBe(2);
  await page.getByRole("button", { name: "Close tool" }).click();
  const doc = await PDFDocument.create();
  doc.addPage([200, 300]);
  doc.addPage([300, 400]);
  doc.addPage([400, 500]);
  await open(page, "PDF Page Manager");
  await page
    .getByLabel("Choose files", { exact: true })
    .setInputFiles({
      name: "pages.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await doc.save()),
    });
  await expect(
    page.getByRole("img", { name: "PDF page preview" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Move page 3 up", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete page 2", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rotate page 1", exact: true })
    .click();
  await page.getByLabel("Watermark on every page (optional)").fill("NEXUS");
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const output = await PDFDocument.load(await download(page));
  expect(output.getPages().map((p) => p.getWidth())).toEqual([200, 400]);
  expect(output.getPages()[0].getRotation().angle).toBe(90);
});
test("PDF text replacement rasterizes the edited page only", async ({
  page,
}) => {
  const doc = await PDFDocument.create();
  doc
    .addPage([400, 400])
    .drawText("Original text", { x: 30, y: 330, size: 20 });
  doc.addPage([300, 300]).drawText("Preserved page");
  await open(page, "PDF Text Replacement");
  await page
    .getByLabel("Choose files", { exact: true })
    .setInputFiles({
      name: "text.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await doc.save()),
    });
  await expect(
    page.getByRole("img", { name: "PDF page preview" }),
  ).toBeVisible();
  await page
    .getByLabel("Replacement text", { exact: true })
    .fill("Changed text");
  await page.getByRole("button", { name: "Add edit to this page" }).click();
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const output = await PDFDocument.load(await download(page));
  expect(output.getPageCount()).toBe(2);
  expect(output.getPages()[0].node.Resources()?.toString()).toContain(
    "/XObject",
  );
  expect(output.getPages()[1].getWidth()).toBe(300);
});
test("new QR formats and UTF-8 developer utilities", async ({ page }) => {
  await open(page, "QR Code Generator");
  await page.getByLabel("QR type").selectOption("wifi");
  await page.getByLabel("Network name (SSID)").fill("Nexus Office");
  await page.getByLabel("Password", { exact: true }).fill("safe;password");
  await page.getByLabel("Output format").selectOption("png");
  await page
    .getByRole("button", { name: "Generate file", exact: true })
    .click();
  expect((await download(page)).readUInt32BE(16)).toBe(512);
  await page.getByRole("button", { name: "Close tool" }).click();
  await open(page, "Developer Utilities");
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("{bad}");
  await page.getByRole("button", { name: "Process text" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("สวัสดี 🌿");
  await page.getByLabel("Operation").selectOption("base64-encode");
  await page.getByRole("button", { name: "Process text" }).click();
  const encoded = (await download(page)).toString("utf8");
  expect(Buffer.from(encoded, "base64").toString("utf8")).toBe("สวัสดี 🌿");
  await page.getByRole("button", { name: "Close tool" }).click();
  await open(page, "Text Utilities");
  await page.getByLabel("Operation").selectOption("compare");
  await page
    .getByRole("textbox", { name: "Input text", exact: true })
    .fill("hello\nworld");
  await page
    .getByLabel("Comparison text", { exact: true })
    .fill("hello\nNexus");
  await page.getByRole("button", { name: "Process text" }).click();
  expect((await download(page)).toString()).toContain("+ 2: Nexus");
});
test("invoice draft with logo persists only on explicit save and can be deleted", async ({
  page,
}) => {
  const image = await png(page);
  await open(page, "Invoice Generator");
  await page.getByLabel("Seller / business").fill("Draft business");
  await page.getByLabel("Customer", { exact: true }).fill("Buyer");
  await page.getByLabel("Date", { exact: true }).fill("2026-08-30");
  await page.getByLabel("Description 1").fill("Service");
  await page
    .getByLabel("Business logo (optional)")
    .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: image });
  await expect(page.getByRole("img", { name: "Invoice logo" })).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("nexus-tools-invoice-draft"),
    ),
  ).toBeNull();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.reload();
  await open(page, "Invoice Generator");
  await page.getByRole("button", { name: "Load draft / reuse items" }).click();
  await expect(page.getByLabel("Seller / business")).toHaveValue(
    "Draft business",
  );
  await page
    .getByRole("button", { name: "Create invoice", exact: true })
    .click();
  expect((await download(page)).toString()).toContain(
    'src="data:image/png;base64,',
  );
  await page.getByRole("button", { name: "Delete saved draft" }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("nexus-tools-invoice-draft"),
    ),
  ).toBeNull();
});
test("OCR reads a real image using locally hosted Thai/English models", async ({
  page,
}) => {
  test.setTimeout(120000);
  const image = await png(page, true);
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      new URL(r.url()).origin !== new URL(page.url()).origin &&
      !r.url().startsWith("blob:") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  await open(page, "OCR — Thai & English");
  await page
    .getByLabel("Choose files", { exact: true })
    .setInputFiles({ name: "ocr.png", mimeType: "image/png", buffer: image });
  await page
    .getByRole("button", { name: "Recognize text", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Download nexus-ocr/ }),
  ).toBeVisible({ timeout: 90000 });
  expect((await download(page)).toString()).toMatch(/NEXUS\s+TOOLS\s+12345/i);
  expect(external).toEqual([]);
});
test("mobile file drop, recent history and invalid crop recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const image = await png(page);
  await open(page, "Image Crop & Watermark");
  const transfer = await page.evaluateHandle((bytes) => {
    const dt = new DataTransfer();
    dt.items.add(
      new File([Uint8Array.from(bytes)], "dropped.png", { type: "image/png" }),
    );
    return dt;
  }, Array.from(image));
  await page
    .locator(".workspace .file-drop")
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.locator(".file-list")).toContainText("dropped.png");
  await page
    .getByRole("spinbutton", { name: "Crop left (%)", exact: true })
    .fill("90");
  await page
    .getByRole("button", { name: "Generate file", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByRole("spinbutton", { name: "Crop width (%)", exact: true })
    .fill("10");
  await page
    .getByRole("button", { name: "Generate file", exact: true })
    .click();
  expect((await download(page)).readUInt32BE(16)).toBe(20);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.getByRole("button", { name: "Close tool" }).click();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Recently used" }),
  ).toContainText("Image Crop & Watermark");
  await page.getByRole("button", { name: "Clear recent" }).click();
  await expect(page.getByRole("region", { name: "Recently used" })).toHaveCount(
    0,
  );
});
test("OCR can be cancelled during initialization and then restarted", async ({
  page,
}) => {
  test.setTimeout(120000);
  const image = await png(page, true);
  await open(page, "OCR — Thai & English");
  await page
    .getByLabel("Choose files", { exact: true })
    .setInputFiles({ name: "ocr.png", mimeType: "image/png", buffer: image });
  await page.route("**/ocr/worker.min.js", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page
    .getByRole("button", { name: "Recognize text", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("Processing…", { exact: true })).toHaveCount(0);
  await page.unroute("**/ocr/worker.min.js");
  await page
    .getByRole("button", { name: "Recognize text", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Download nexus-ocr/ }),
  ).toBeVisible({ timeout: 90000 });
  expect((await download(page)).toString()).toContain("NEXUS");
});
