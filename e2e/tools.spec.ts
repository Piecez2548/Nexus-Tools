import { test, expect } from "./auth-fixture.js";
import { PDFDocument } from "pdf-lib";
import { toBuffer } from "qrcode";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "nexus-language",
      JSON.stringify({ state: { language: "en" }, version: 0 }),
    ),
  );
  await page.goto("/");
});

test("catalogue, favorites, search, language and theme persist", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(page.locator(".tool-card")).toHaveCount(17);
  await page
    .getByRole("button", { name: "Favorite Merge PDF", exact: true })
    .click();
  await page.getByRole("button", { name: /^Favorites/ }).click();
  await expect(page.locator(".tool-card")).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Favorite Merge PDF", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("textbox", { name: "Search tools" })
    .fill("no-such-tool");
  await expect(page.getByText("Nothing here just yet")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: "Use light theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-tools-theme",
    "light",
  );
  await page.getByRole("button", { name: "Switch to Thai" }).click();
  await expect(
    page.getByRole("heading", { name: "รวมไฟล์ PDF" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("PDF merge downloads real ordered pages; invalid split is recoverable", async ({
  page,
}) => {
  const first = await PDFDocument.create();
  first.addPage([100, 200]);
  const second = await PDFDocument.create();
  second.addPage([300, 400]);
  await page
    .getByRole("button", { name: "Open Merge PDF", exact: true })
    .click();
  await page.getByLabel("Choose files", { exact: true }).setInputFiles([
    {
      name: "a.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await first.save()),
    },
    {
      name: "b.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await second.save()),
    },
  ]);
  await page.getByRole("button", { name: "Move up b.pdf" }).click();
  await page.getByRole("button", { name: "Generate file" }).click();
  await expect(page.getByText("2 pages in the exported PDF")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /Download nexus-merged/ }).click();
  const downloaded = await downloadPromise;
  const bytes = await readFile((await downloaded.path())!);
  expect(
    (await PDFDocument.load(bytes)).getPages().map((p) => p.getWidth()),
  ).toEqual([300, 100]);
  await page.getByRole("button", { name: "Close tool" }).click();
  await page
    .getByRole("button", { name: "Open Split PDF", exact: true })
    .click();
  await page.getByLabel("Choose files", { exact: true }).setInputFiles({
    name: "merged.pdf",
    mimeType: "application/pdf",
    buffer: bytes,
  });
  await page.getByLabel("Pages to extract").fill("99");
  await page.getByRole("button", { name: "Generate file" }).click();
  await expect(page.getByRole("alert")).toContainText("valid pages");
  await page.getByLabel("Pages to extract").fill("2");
  await page.getByRole("button", { name: "Generate file" }).click();
  await expect(page.getByText("1 pages in the exported PDF")).toBeVisible();
});

test("image conversion and compression generate valid files", async ({
  page,
}) => {
  // Generate a valid PNG fixture, including its checksums, rather than hand-written bytes.
  const fixture = await toBuffer("Nexus image test", { width: 64 });
  for (const name of ["Image Converter", "Image Compressor"]) {
    await page
      .getByRole("button", { name: `Open ${name}`, exact: true })
      .click();
    await page.getByLabel("Choose files", { exact: true }).setInputFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: fixture,
    });
    await page.getByLabel("Output format").selectOption("image/jpeg");
    await page.getByRole("button", { name: "Generate file" }).click();
    await expect(page.getByText("Your file is ready")).toBeVisible();
    const pending = page.waitForEvent("download");
    await page.getByRole("link", { name: /Download pixel-nexus/ }).click();
    const bytes = await readFile((await (await pending).path())!);
    expect([...bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
    await page.getByRole("button", { name: "Close tool" }).click();
  }
});

test("QR generates SVG, clears stale results and traps keyboard focus", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Open QR Code Generator", exact: true })
    .click();
  await page.getByLabel("Text or link").fill("https://example.com/hello");
  await page.getByRole("button", { name: "Generate file" }).click();
  await expect(
    page.getByRole("img", { name: "Generated image preview" }),
  ).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("link", { name: /Download nexus-qr/ }).click();
  const svg = await readFile((await (await pending).path())!, "utf8");
  expect(svg).toContain("<svg");
  await page.getByLabel("Text or link").fill("changed");
  await expect(page.getByText("Your file is ready")).toHaveCount(0);
  await page.getByRole("button", { name: "Close tool" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Generate file" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open QR Code Generator", exact: true }),
  ).toBeFocused();
});

test("unit conversion and text counting work with actual user input", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Open Unit Converter", exact: true })
    .click();
  await page.getByLabel("Value", { exact: true }).fill("1500");
  await expect(page.locator(".calculation-result strong")).toHaveText("1.5 km");
  await page.getByLabel("Measurement").selectOption("temperature");
  await page.getByLabel("Value", { exact: true }).fill("-300");
  await expect(
    page.getByText("Temperature cannot be below absolute zero."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close tool" }).click();
  await page
    .getByRole("button", { name: "Open Word Counter", exact: true })
    .click();
  await page.getByLabel("Your text").fill("กิ้ 👨‍👩‍👧‍👦");
  await expect(page.locator(".text-stats > div").filter({ hasText: "Characters (UTF-16)" }).locator("strong")).toHaveText("15");
  await expect(page.locator(".text-stats > div").filter({ hasText: "Visible characters" }).locator("strong")).toHaveText("3");
  await page.getByLabel("Your text").fill("Hello world");
  await expect(page.locator(".text-stats > div").first()).toContainText("2");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download text" }).click();
  expect(await readFile((await (await pending).path())!, "utf8")).toBe(
    "Hello world",
  );
});

test("invoice downloads a real PDF directly and calculates tax", async ({
  page,
}, testInfo) => {
  await page
    .getByRole("button", { name: "Open Invoice Generator", exact: true })
    .click();
  await page.getByLabel("Seller / business").fill("Nexus Demo");
  await page.getByLabel("Invoice number").fill("INV-001");
  await page
    .getByLabel("Customer", { exact: true })
    .fill("<img src=x onerror=alert(1)>");
  await page.getByLabel("Date", { exact: true }).fill("2026-08-30");
  await page.getByLabel("Description 1").fill("Consulting");
  await page.getByLabel("Unit price").fill("100");
  await page.getByLabel("Tax (%)").fill("7");
  await expect(page.locator(".invoice-total strong")).toContainText("107.00");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create invoice", exact: true }).click();
  const file = await pending;
  expect(file.suggestedFilename()).toBe("invoice-INV-001.pdf");
  const bytes = await readFile((await file.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.28);
  await file.saveAs(testInfo.outputPath("invoice.pdf"));
  await page.getByLabel("Seller / business").fill("บริษัท เน็กซัส จำกัด\nที่อยู่ กรุงเทพมหานคร");
  await page.getByRole("textbox", { name: "Customer", exact: true }).fill("คุณสมชาย ทดสอบ");
  await page.getByLabel("Description 1").fill("บริการออกแบบและพัฒนาเว็บไซต์พร้อมดูแลระบบ ".repeat(10));
  for (let i = 2; i <= 8; i++) {
    await page.getByRole("button", { name: "Add item", exact: true }).click();
    await page.getByLabel(`Description ${i}`, { exact: true }).fill("บริการออกแบบและพัฒนาเว็บไซต์พร้อมดูแลระบบ ".repeat(10));
  }
  await page.getByLabel("Invoice watermark (optional)").fill("สำเนา - สำหรับลูกค้าเท่านั้น");
  await page.getByRole("button",{name:"Use next document number",exact:true}).click();
  const longDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create invoice", exact: true }).click();
  const longFile = await longDownload;
  const longPdf = await PDFDocument.load(await readFile((await longFile.path())!));
  expect(longPdf.getPageCount()).toBeGreaterThan(1);
  await longFile.saveAs(testInfo.outputPath("invoice-thai-multipage.pdf"));


});

test("mobile menu, tool interaction and layout fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Main navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Favorites/ }).click();
  await expect(page.getByText("Nothing here just yet")).toBeVisible();
  await page.getByRole("button", { name: "Show all tools" }).click();
  await page
    .getByRole("button", { name: "Open Unit Converter", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close tool" }).click();
  const size = await page.locator("body").boundingBox();
  expect(size!.width).toBeLessThanOrEqual(390);
});
